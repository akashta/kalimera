from __future__ import annotations

import argparse
import csv
import hashlib
import re
import subprocess
import sys
import tempfile
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

import imageio_ffmpeg
import numpy as np
import soundfile as sf
import torch
from huggingface_hub import snapshot_download
from peft import PeftModel
from snac import SNAC
from transformers import AutoModelForCausalLM, AutoTokenizer


BASE_MODEL_NAME = "unsloth/orpheus-3b-0.1-ft"
ADAPTER_MODEL_NAME = "moiralabs/GreekTTS-1.5"
ADAPTER_SUBFOLDER = "checkpoint-264000"
SNAC_MODEL_NAME = "hubertsiuzdak/snac_24khz"
DEFAULT_WORDS_CSV = Path("words.csv")
DEFAULT_OUTPUT_DIR = Path("public/audio/greek")
DEFAULT_BATCH_SIZE = 6
DEFAULT_MAX_NEW_TOKENS = 560
OUTPUT_SAMPLE_RATE = 24000

TOKENIZER_LENGTH = 128256
START_OF_SPEECH = TOKENIZER_LENGTH + 1
END_OF_SPEECH = TOKENIZER_LENGTH + 2
START_OF_HUMAN = TOKENIZER_LENGTH + 3
END_OF_HUMAN = TOKENIZER_LENGTH + 4
PAD_TOKEN = 128263
END_OF_TEXT = 128009

FFMPEG_EXE = imageio_ffmpeg.get_ffmpeg_exe()


@dataclass(frozen=True)
class AudioWord:
    greek: str
    file_name: str


def slugify_greek_text(text: str) -> str:
    normalized = text.strip().lower()
    normalized = normalized.replace("ς", "σ")
    normalized = (
        normalized.replace("ά", "α")
        .replace("έ", "ε")
        .replace("ή", "η")
        .replace("ί", "ι")
        .replace("ϊ", "ι")
        .replace("ΐ", "ι")
        .replace("ό", "ο")
        .replace("ύ", "υ")
        .replace("ϋ", "υ")
        .replace("ΰ", "υ")
        .replace("ώ", "ω")
    )
    normalized = re.sub(r"[^0-9a-z\u0370-\u03ff]+", "-", normalized)
    normalized = re.sub(r"-{2,}", "-", normalized).strip("-")
    return normalized or "word"


def build_audio_file_name(greek: str) -> str:
    digest = hashlib.sha1(greek.encode("utf-8")).hexdigest()[:10]
    return f"{slugify_greek_text(greek)}-{digest}.mp3"


def load_unique_words(csv_path: Path) -> list[AudioWord]:
    seen: set[str] = set()
    words: list[AudioWord] = []

    with csv_path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        if "greek" not in (reader.fieldnames or []):
            raise ValueError("words.csv must contain a 'greek' column.")

        for row in reader:
            greek = (row.get("greek") or "").strip()
            if not greek or greek in seen:
                continue

            seen.add(greek)
            words.append(AudioWord(greek=greek, file_name=build_audio_file_name(greek)))

    return words


class GreekTTSGenerator:
    def __init__(self, max_new_tokens: int, temperature: float, top_p: float) -> None:
        self.max_new_tokens = max_new_tokens
        self.temperature = temperature
        self.top_p = top_p
        self.device = "cuda" if torch.cuda.is_available() else "cpu"

        if self.device != "cuda":
            raise RuntimeError("GreekTTS-1.5 generation requires CUDA on this machine.")

        self.tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL_NAME)
        base_model = AutoModelForCausalLM.from_pretrained(
            BASE_MODEL_NAME,
            torch_dtype=torch.float16,
            low_cpu_mem_usage=True,
        )
        adapter_snapshot_dir = Path(
            snapshot_download(
                repo_id=ADAPTER_MODEL_NAME,
                allow_patterns=[f"{ADAPTER_SUBFOLDER}/*"],
            )
        )
        adapter_dir = adapter_snapshot_dir / ADAPTER_SUBFOLDER
        self.model = PeftModel.from_pretrained(base_model, str(adapter_dir))
        self.model = self.model.to(self.device)
        self.model.eval()

        self.snac_model = SNAC.from_pretrained(SNAC_MODEL_NAME).to("cpu")
        self.start_token = torch.tensor([[START_OF_HUMAN]], dtype=torch.int64)
        self.end_tokens = torch.tensor([[END_OF_TEXT, END_OF_HUMAN]], dtype=torch.int64)

    def _prepare_inputs(self, prompts: list[str]) -> tuple[torch.Tensor, torch.Tensor]:
        modified_inputs = []
        for prompt in prompts:
            input_ids = self.tokenizer(prompt, return_tensors="pt").input_ids
            modified = torch.cat([self.start_token, input_ids, self.end_tokens], dim=1)
            modified_inputs.append(modified)

        max_length = max(item.shape[1] for item in modified_inputs)
        padded_tensors = []
        attention_masks = []
        for item in modified_inputs:
            padding = max_length - item.shape[1]
            padded = torch.cat([torch.full((1, padding), PAD_TOKEN, dtype=torch.int64), item], dim=1)
            mask = torch.cat(
                [torch.zeros((1, padding), dtype=torch.int64), torch.ones((1, item.shape[1]), dtype=torch.int64)],
                dim=1,
            )
            padded_tensors.append(padded)
            attention_masks.append(mask)

        return torch.cat(padded_tensors, dim=0).to(self.device), torch.cat(attention_masks, dim=0).to(self.device)

    def _extract_code_lists(self, generated_ids: torch.Tensor) -> list[list[int]]:
        token_indices = (generated_ids == START_OF_SPEECH).nonzero(as_tuple=True)
        if len(token_indices[1]) > 0:
            generated_ids = generated_ids[:, token_indices[1][-1].item() + 1 :]

        processed_rows = []
        for row in generated_ids:
            processed_rows.append(row[row != END_OF_SPEECH])

        code_lists: list[list[int]] = []
        for row in processed_rows:
            row_length = row.size(0)
            trimmed = row[: (row_length // 7) * 7]
            code_lists.append([(token.item() - 128266) for token in trimmed])

        return code_lists

    def _decode_audio(self, code_list: list[int]) -> np.ndarray:
        layer_1: list[int] = []
        layer_2: list[int] = []
        layer_3: list[int] = []

        for index in range((len(code_list) + 1) // 7):
            base = index * 7
            layer_1.append(code_list[base])
            layer_2.append(code_list[base + 1] - 4096)
            layer_3.append(code_list[base + 2] - (2 * 4096))
            layer_3.append(code_list[base + 3] - (3 * 4096))
            layer_2.append(code_list[base + 4] - (4 * 4096))
            layer_3.append(code_list[base + 5] - (5 * 4096))
            layer_3.append(code_list[base + 6] - (6 * 4096))

        codes = [
            torch.tensor(layer_1, dtype=torch.long).unsqueeze(0),
            torch.tensor(layer_2, dtype=torch.long).unsqueeze(0),
            torch.tensor(layer_3, dtype=torch.long).unsqueeze(0),
        ]
        audio = self.snac_model.decode(codes)
        return audio.detach().squeeze().to("cpu").numpy()

    def generate_batch(self, prompts: list[str]) -> list[np.ndarray]:
        with torch.inference_mode():
            input_ids, attention_mask = self._prepare_inputs(prompts)
            generated_ids = self.model.generate(
                input_ids=input_ids,
                attention_mask=attention_mask,
                max_new_tokens=self.max_new_tokens,
                do_sample=True,
                temperature=self.temperature,
                top_p=self.top_p,
                repetition_penalty=1.1,
                num_return_sequences=1,
                eos_token_id=END_OF_SPEECH,
                use_cache=True,
            )

        code_lists = self._extract_code_lists(generated_ids)
        if len(code_lists) != len(prompts):
            raise RuntimeError("Generated audio count does not match the prompt count.")
        if any(len(code_list) == 0 for code_list in code_lists):
            raise RuntimeError("Generated an empty audio code sequence for at least one prompt.")

        return [self._decode_audio(code_list) for code_list in code_lists]


def chunked(values: list[AudioWord], size: int) -> Iterable[list[AudioWord]]:
    for index in range(0, len(values), size):
        yield values[index : index + size]


def export_mp3(samples: np.ndarray, output_path: Path) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_file:
        temp_wav = Path(temp_file.name)

    try:
        clipped = np.clip(samples, -1.0, 1.0)
        sf.write(temp_wav, clipped, OUTPUT_SAMPLE_RATE)
        subprocess.run(
            [
                FFMPEG_EXE,
                "-y",
                "-loglevel",
                "error",
                "-i",
                str(temp_wav),
                "-codec:a",
                "libmp3lame",
                "-b:a",
                "96k",
                str(output_path),
            ],
            check=True,
        )
    finally:
        temp_wav.unlink(missing_ok=True)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate Greek MP3 files from words.csv using GreekTTS-1.5.")
    parser.add_argument("--csv", type=Path, default=DEFAULT_WORDS_CSV)
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT_DIR)
    parser.add_argument("--limit", type=int)
    parser.add_argument("--batch-size", type=int, default=DEFAULT_BATCH_SIZE)
    parser.add_argument("--temperature", type=float, default=0.6)
    parser.add_argument("--top-p", type=float, default=0.95)
    parser.add_argument("--max-new-tokens", type=int, default=DEFAULT_MAX_NEW_TOKENS)
    parser.add_argument("--force", action="store_true")
    parser.add_argument("--text", type=str, help="Generate audio only for a single Greek text.")
    return parser.parse_args()


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")

    args = parse_args()

    if args.text:
        words = [AudioWord(greek=args.text.strip(), file_name=build_audio_file_name(args.text.strip()))]
    else:
        words = load_unique_words(args.csv)

    if args.limit:
        words = words[: args.limit]

    if not words:
        print("No Greek words found.", file=sys.stderr)
        return 1

    pending_words = []
    for word in words:
        output_path = args.output_dir / word.file_name
        if output_path.exists() and not args.force:
            continue
        pending_words.append(word)

    if not pending_words:
        print(f"Generated 0 MP3 files into {args.output_dir}.")
        return 0

    generator = GreekTTSGenerator(
        max_new_tokens=args.max_new_tokens,
        temperature=args.temperature,
        top_p=args.top_p,
    )

    generated_count = 0
    for batch_index, batch in enumerate(chunked(pending_words, args.batch_size), start=1):
        pending = [(word, args.output_dir / word.file_name) for word in batch]
        prompts = [word.greek for word in batch]
        print(f"[{batch_index}] generating {len(pending)} items...")
        audio_samples = generator.generate_batch(prompts)
        for (word, output_path), samples in zip(pending, audio_samples, strict=True):
            export_mp3(samples, output_path)
            generated_count += 1
            print(f"  saved {output_path.name} <- {word.greek}")

        torch.cuda.empty_cache()

    print(f"Generated {generated_count} MP3 files into {args.output_dir}.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
