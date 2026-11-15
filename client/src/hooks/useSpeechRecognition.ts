import { useState, useRef, useCallback, useEffect } from 'react';

// Extend Window for webkit prefixed API
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition: new () => SpeechRecognitionInstance;
  }
}

interface UseSpeechRecognitionReturn {
  isListening: boolean;
  isPaused: boolean;
  transcript: string;
  interimTranscript: string;
  error: string | null;
  isSupported: boolean;
  startListening: () => void;
  stopListening: () => void;
  pauseListening: () => void;
  resumeListening: () => void;
  resetTranscript: () => void;
}

export function useSpeechRecognition(): UseSpeechRecognitionReturn {
  const [isListening, setIsListening] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const finalTranscriptRef = useRef('');
  const isStoppingRef = useRef(false);
  const shouldRestartRef = useRef(false);

  const isSupported = typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const createRecognition = useCallback(() => {
    if (!isSupported) return null;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      let finalNew = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0].transcript;
        if (result.isFinal) {
          finalNew += text;
        } else {
          interim += text;
        }
      }

      if (finalNew) {
        // CRITICAL: Store the raw transcript EXACTLY as received
        // Do NOT normalize, correct, or modify in any way
        finalTranscriptRef.current += finalNew;
        setTranscript(finalTranscriptRef.current);
      }
      interimTranscriptRef.current = interim;
      setInterimTranscript(interim);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      const errorMessages: Record<string, string> = {
        'not-allowed': 'Microphone access was denied. Please allow microphone permissions.',
        'no-speech': 'No speech detected. Please try speaking again.',
        'audio-capture': 'No microphone found. Please connect a microphone.',
        'network': 'Network error occurred. Please check your connection.',
        'aborted': 'Speech recognition was aborted.',
        'service-not-allowed': 'Speech recognition service is not available.',
      };

      const message = errorMessages[event.error] || `Speech recognition error: ${event.error}`;
      
      // Don't set error for 'aborted' when we're intentionally stopping
      if (event.error !== 'aborted' || !isStoppingRef.current) {
        setError(message);
      }

      if (event.error !== 'no-speech') {
        setIsListening(false);
        setIsPaused(false);
      }
    };

    recognition.onend = () => {
      // Auto-restart if we haven't explicitly stopped
      // This handles the Chrome bug where continuous recognition stops randomly
      if (shouldRestartRef.current && !isStoppingRef.current) {
        try {
          recognition.start();
        } catch {
          setIsListening(false);
        }
      } else {
        setIsListening(false);
      }
    };

    return recognition;
  }, [isSupported]);

  const startListening = useCallback(() => {
    if (!isSupported) {
      setError('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    setError(null);
    finalTranscriptRef.current = '';
    setTranscript('');
    setInterimTranscript('');
    isStoppingRef.current = false;
    shouldRestartRef.current = true;

    const recognition = createRecognition();
    if (!recognition) return;

    recognitionRef.current = recognition;

    try {
      recognition.start();
      setIsListening(true);
      setIsPaused(false);
    } catch (err) {
      setError('Failed to start speech recognition. Please try again.');
    }
  }, [isSupported, createRecognition]);

  const interimTranscriptRef = useRef('');

  const stopListening = useCallback(() => {
    isStoppingRef.current = true;
    shouldRestartRef.current = false;
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore errors when stopping
      }
      recognitionRef.current = null;
    }

    // CRITICAL: Append any remaining interim speech / fumble words to final transcript
    if (interimTranscriptRef.current.trim()) {
      finalTranscriptRef.current = (finalTranscriptRef.current + ' ' + interimTranscriptRef.current).trim();
      setTranscript(finalTranscriptRef.current);
    }

    setIsListening(false);
    setIsPaused(false);
    setInterimTranscript('');
  }, []);

  const pauseListening = useCallback(() => {
    shouldRestartRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore
      }
    }
    setIsPaused(true);
  }, []);

  const resumeListening = useCallback(() => {
    if (!isSupported) return;

    shouldRestartRef.current = true;
    isStoppingRef.current = false;

    const recognition = createRecognition();
    if (!recognition) return;

    recognitionRef.current = recognition;

    try {
      recognition.start();
      setIsPaused(false);
    } catch {
      setError('Failed to resume speech recognition.');
    }
  }, [isSupported, createRecognition]);

  const resetTranscript = useCallback(() => {
    finalTranscriptRef.current = '';
    setTranscript('');
    setInterimTranscript('');
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isStoppingRef.current = true;
      shouldRestartRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // Ignore
        }
      }
    };
  }, []);

  return {
    isListening,
    isPaused,
    transcript,
    interimTranscript,
    error,
    isSupported,
    startListening,
    stopListening,
    pauseListening,
    resumeListening,
    resetTranscript,
  };
}
