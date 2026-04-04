# AGENTS.md

## Project Root

- Use the repository root as the working directory.
- Treat `words.csv` as the source of truth for vocabulary data.

## Encoding Rules

- Always preserve Greek and Russian text as UTF-8.
- Read `words.csv` with `utf-8-sig`.
- Write `words.csv` with `utf-8`.
- Never save Greek or Russian text as ANSI, ASCII, or Windows-1252.

## PowerShell Safety

- Do not pass raw Greek or Russian text through PowerShell here-strings or inline command literals when editing data files.
- PowerShell output may display mojibake or `????`; do not assume the file itself is broken until the bytes are verified.
- For inline scripts that must update Greek/Russian text, prefer Unicode escape literals and decode them inside Python.

Safe pattern:

```python
value = r"\u03ac\u03bd\u03b8\u03c1\u03c9\u03c0\u03bf\u03c2".encode("ascii").decode("unicode_escape")
```

## CSV Editing

- Use Python `csv.DictReader` / `csv.DictWriter` for `words.csv`.
- Keep the exact column order:
  - `id`
  - `greek`
  - `english`
  - `russian`
  - `level`
  - `group`
- Do not edit CSV rows with regex replacements unless the scope is trivial and verified.
- After changing `words.csv`, re-read the edited rows and inspect them using `unicode_escape` output if there is any encoding risk.

Verification pattern:

```python
print(row["greek"].encode("unicode_escape").decode())
print(row["russian"].encode("unicode_escape").decode())
```

## Translation Rules

- Translate Russian directly from Greek, not from the English gloss.
- Prefer short learner-friendly Russian glosses.
- Avoid explanatory notes unless the meaning would otherwise be ambiguous.
- For Greek names, prefer transliteration of the Greek name, not substitution with an English equivalent.

## Audio / Manifest Files

- JSON manifests containing Greek must be written with `encoding="utf-8"`.
- If terminal output shows `????`, verify file contents with a UTF-8-aware reader before regenerating assets.

## Audio Generation

- Use `scripts/generate_greek_audio_google.py` for the main Google batch workflow.
- Store production MP3 files in `audio/<voice>/`.
- Keep filenames ID-based: `audio/<voice>/<id>.mp3`.
- Keep a matching manifest at `audio/<voice>/manifest.json`.
- Current supported production voices are folder-based, for example:
  - `audio/aoede/`
  - `audio/charon/`
- Default full-batch usage:

```powershell
.\.venv-tts\Scripts\python.exe scripts\generate_greek_audio_google.py --voice-name el-GR-Chirp3-HD-Aoede --output-dir audio\aoede --manifest audio\aoede\manifest.json
```

- Regenerate only specific IDs when possible instead of the full library.
- For one-off Google voice comparisons, write samples under `public/audio/voice-review/`.
- When generating one-off Greek samples from a shell script, do not pass raw Greek text through PowerShell literals; use Unicode escapes and decode inside Python first.
- After generating audio, verify:
  - the MP3 files exist in the expected voice folder
  - `manifest.json` contains valid Greek text, not `????`
  - the app can resolve the files by ID

## Required Checks After Data Changes

- Reopen the modified rows and verify the actual stored text.
- Run:

```powershell
npm.cmd run build
```

- If the change affects generated audio inputs, regenerate only the affected IDs when possible.
