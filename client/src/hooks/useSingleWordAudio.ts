import { useState, useRef, useCallback, useEffect } from 'react';

export type EnglishAccent = 'en-US' | 'en-GB' | 'en-IN';

interface UseSingleWordAudioReturn {
  isListening: boolean;
  transcript: string;
  userAudioUrl: string | null;
  error: string | null;
  accent: EnglishAccent;
  isSlow: boolean;
  setAccent: (accent: EnglishAccent) => void;
  setIsSlow: (slow: boolean) => void;
  playNativeAudio: (word: string) => void;
  playUserAudio: () => void;
  startListening: () => void;
  stopListening: () => void;
  resetState: () => void;
}

export function useSingleWordAudio(
  onWordRecognized?: (transcript: string, durationSeconds: number) => void
): UseSingleWordAudioReturn {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [userAudioUrl, setUserAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [accent, setAccent] = useState<EnglishAccent>('en-US');
  const [isSlow, setIsSlow] = useState(false);

  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);

  // Play native speaker pronunciation using SpeechSynthesis
  const playNativeAudio = useCallback((word: string) => {
    if (!('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = accent;
    utterance.rate = isSlow ? 0.72 : 1.0;

    const voices = window.speechSynthesis.getVoices();
    const matchedVoice = voices.find((v) => v.lang.startsWith(accent));
    if (matchedVoice) utterance.voice = matchedVoice;

    window.speechSynthesis.speak(utterance);
  }, [accent, isSlow]);

  // Play user's recorded audio
  const playUserAudio = useCallback(() => {
    if (!userAudioUrl) return;
    const audio = new Audio(userAudioUrl);
    audio.play().catch(() => {});
  }, [userAudioUrl]);

  const resetState = useCallback(() => {
    setTranscript('');
    setUserAudioUrl(null);
    setError(null);
  }, []);

  const stopListening = useCallback(() => {
    setIsListening(false);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const startListening = useCallback(async () => {
    setError(null);
    setTranscript('');
    setUserAudioUrl(null);

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    // Request microphone access
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
    } catch (err: any) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Microphone permission blocked. Please allow microphone access in your browser settings.');
      } else if (err.name === 'NotFoundError') {
        setError('No microphone found on your computer. Please connect a mic or headset.');
      } else {
        setError('Could not access microphone: ' + (err.message || 'Unknown error'));
      }
      return;
    }

    // Setup MediaRecorder to save user voice audio
    try {
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setUserAudioUrl(url);
      };
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
    } catch (e) {
      console.warn('MediaRecorder not available, proceeding with speech-to-text only');
    }

    // Setup Speech Recognition
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = accent;
    recognition.maxAlternatives = 3;

    startTimeRef.current = Date.now();

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const durationSeconds = (Date.now() - startTimeRef.current) / 1000;
      const resultText = event.results[0][0].transcript;
      setTranscript(resultText);

      stopListening();

      if (onWordRecognized) {
        onWordRecognized(resultText, durationSeconds);
      }
    };

    recognition.onerror = (event: any) => {
      stopListening();
      if (event.error === 'no-speech') {
        setError('No speech detected. Please speak closer to your microphone and try again.');
      } else if (event.error === 'audio-capture') {
        setError('No microphone was detected. Please check your mic connection.');
      } else if (event.error === 'not-allowed') {
        setError('Microphone access denied. Please enable mic permissions.');
      } else if (event.error !== 'aborted') {
        setError(`Speech recognition error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch (err: any) {
      setError('Failed to initiate microphone listening. Please try again.');
      stopListening();
    }
  }, [accent, onWordRecognized, stopListening]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  return {
    isListening,
    transcript,
    userAudioUrl,
    error,
    accent,
    isSlow,
    setAccent,
    setIsSlow,
    playNativeAudio,
    playUserAudio,
    startListening,
    stopListening,
    resetState,
  };
}
