export function canSpeakGreek(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const AudioContextCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextCtor) {
    return null;
  }

  if (!audioContext) {
    audioContext = new AudioContextCtor();
  }

  if (audioContext.state === 'suspended') {
    void audioContext.resume().catch(() => undefined);
  }

  return audioContext;
}

function playTone(frequency: number, startOffset: number, duration: number, gainValue: number, type: OscillatorType): void {
  const context = getAudioContext();
  if (!context) {
    return;
  }

  const oscillator = context.createOscillator();
  const gainNode = context.createGain();
  const startTime = context.currentTime + startOffset;
  const stopTime = startTime + duration;

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startTime);

  gainNode.gain.setValueAtTime(0.0001, startTime);
  gainNode.gain.exponentialRampToValueAtTime(gainValue, startTime + 0.02);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, stopTime);

  oscillator.connect(gainNode);
  gainNode.connect(context.destination);
  oscillator.start(startTime);
  oscillator.stop(stopTime);
}

export function playCorrectSound(): void {
  playTone(659.25, 0, 0.12, 0.09, 'sine');
  playTone(830.61, 0.1, 0.16, 0.08, 'sine');
}

export function playWrongSound(): void {
  playTone(466.16, 0, 0.13, 0.095, 'square');
  playTone(349.23, 0.09, 0.19, 0.09, 'sawtooth');
}

export function playLessonFinishedSound(): void {
  playTone(523.25, 0, 0.12, 0.08, 'sine');
  playTone(659.25, 0.11, 0.12, 0.08, 'sine');
  playTone(783.99, 0.22, 0.15, 0.08, 'sine');
  playTone(1046.5, 0.34, 0.22, 0.1, 'sine');
}

export function speakGreek(text: string): Promise<void> {
  if (!canSpeakGreek()) {
    return Promise.resolve();
  }

  window.speechSynthesis.cancel();
  return new Promise((resolve) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'el-GR';
    utterance.rate = 0.9;

    const greekVoice = window.speechSynthesis
      .getVoices()
      .find((voice) => voice.lang.toLowerCase().startsWith('el'));

    if (greekVoice) {
      utterance.voice = greekVoice;
    }

    let settled = false;
    const finish = () => {
      if (settled) {
        return;
      }
      settled = true;
      resolve();
    };

    utterance.onend = finish;
    utterance.onerror = finish;

    window.speechSynthesis.speak(utterance);

    window.setTimeout(finish, Math.max(900, text.length * 110));
  });
}
