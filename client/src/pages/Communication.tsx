import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useToast } from '../context/ToastContext';
import { fetchChallenge, submitSession, analyzeSession } from '../services/api';
import AudioVisualizer from '../components/AudioVisualizer';
import MicButton from '../components/MicButton';
import type { CommunicationChallenge } from '../types';
import {
  BookOpen,
  Clock,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Send,
  Loader2,
  ArrowLeft,
} from 'lucide-react';

type Phase = 'loading' | 'preparation' | 'recording' | 'review' | 'submitting' | 'error';

export default function Communication() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const {
    isListening,
    isPaused,
    transcript,
    interimTranscript,
    error: speechError,
    isSupported,
    startListening,
    stopListening,
    pauseListening,
    resumeListening,
    resetTranscript,
  } = useSpeechRecognition();

  const [phase, setPhase] = useState<Phase>('loading');
  const [challenge, setChallenge] = useState<CommunicationChallenge | null>(null);
  const [duration, setDuration] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const transcriptContainerRef = useRef<HTMLDivElement>(null);

  // Load challenge
  useEffect(() => {
    loadChallenge();
  }, []);

  const loadChallenge = async () => {
    setPhase('loading');
    setLoadError(null);
    try {
      const data = await fetchChallenge();
      setChallenge(data);
      setPhase('preparation');
    } catch (err: any) {
      setLoadError(err.message || 'Failed to load challenge');
      setPhase('error');
    }
  };

  // Timer
  useEffect(() => {
    if (isListening && !isPaused) {
      timerRef.current = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isListening, isPaused]);

  // Auto-scroll transcript
  useEffect(() => {
    if (transcriptContainerRef.current) {
      transcriptContainerRef.current.scrollTop = transcriptContainerRef.current.scrollHeight;
    }
  }, [transcript, interimTranscript]);

  // Handle speech error
  useEffect(() => {
    if (speechError) {
      showToast('error', speechError);
    }
  }, [speechError, showToast]);

  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleStart = () => {
    resetTranscript();
    setDuration(0);
    startListening();
    setPhase('recording');
  };

  const handleStop = () => {
    stopListening();
    setPhase('review');
  };

  const handleRecordAgain = () => {
    resetTranscript();
    setDuration(0);
    setPhase('preparation');
  };

  const handleSubmit = async () => {
    if (!challenge || !transcript.trim()) {
      showToast('error', 'No speech recorded. Please try again.');
      return;
    }

    setPhase('submitting');

    try {
      // Step 1: Create session with raw transcript (IMMUTABLE)
      const { session_id } = await submitSession({
        challenge_id: challenge.id,
        expected_text: challenge.paragraph,
        raw_transcript: transcript, // NEVER MODIFIED
        duration,
      });

      // Step 2: Trigger analysis
      const analysisData = await analyzeSession(session_id);

      try {
        sessionStorage.setItem('last_session_id', session_id);
        sessionStorage.setItem('last_result_' + session_id, JSON.stringify(analysisData));
      } catch { }

      showToast('success', 'Analysis complete!');
      navigate(`/communication/result/${session_id}`);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to submit recording');
      setPhase('review');
    }
  };

  // Loading state
  if (phase === 'loading') {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '3rem 1.5rem', textAlign: 'center' }}>
        <div className="skeleton" style={{ width: '100%', height: '200px', marginBottom: '1.5rem' }} />
        <div className="skeleton" style={{ width: '200px', height: '48px', margin: '0 auto' }} />
      </div>
    );
  }

  // Error state
  if (phase === 'error') {
    return (
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '4rem 1.5rem', textAlign: 'center' }}>
        <AlertCircle size={48} style={{ color: 'var(--color-error-500)', marginBottom: '1rem' }} />
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>Failed to Load Challenge</h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>{loadError}</p>
        <button className="btn-primary" onClick={loadChallenge}>
          <RefreshCw size={16} />
          Try Again
        </button>
      </div>
    );
  }

  // Browser not supported
  if (!isSupported) {
    return (
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '4rem 1.5rem', textAlign: 'center' }}>
        <AlertCircle size={48} style={{ color: 'var(--color-warning-500)', marginBottom: '1rem' }} />
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>Browser Not Supported</h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          Speech recognition is not supported in this browser. Please use <strong>Google Chrome</strong> or <strong>Microsoft Edge</strong>.
        </p>
        <button className="btn-secondary" onClick={() => navigate('/dashboard')}>
          <ArrowLeft size={16} />
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1.5rem 4rem' }}>
      {/* Header */}
      <div className="animate-fade-in" style={{ marginBottom: '1.5rem' }}>
        <button
          onClick={() => navigate('/dashboard')}
          className="btn-secondary"
          style={{ marginBottom: '1rem', fontSize: '0.8125rem', padding: '0.375rem 0.875rem' }}
        >
          <ArrowLeft size={14} />
          Dashboard
        </button>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em', margin: 0 }}>
          Communication Practice
        </h1>
      </div>

      {/* Challenge Card */}
      <div
        className="glass-card animate-fade-in-up stagger-1"
        style={{ padding: '1.5rem', marginBottom: '1.5rem' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <BookOpen size={16} style={{ color: 'var(--color-primary-500)' }} />
          <span
            style={{
              fontSize: '0.6875rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: 'var(--color-primary-500)',
            }}
          >
            Speaking Challenge
          </span>
          {challenge && (
            <span
              style={{
                fontSize: '0.6875rem',
                fontWeight: 600,
                padding: '0.125rem 0.5rem',
                borderRadius: '9999px',
                backgroundColor: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-muted)',
                textTransform: 'capitalize',
              }}
            >
              {challenge.difficulty}
            </span>
          )}
        </div>
        <p
          style={{
            fontSize: '1.0625rem',
            lineHeight: 1.8,
            color: 'var(--text-primary)',
            margin: 0,
            fontStyle: phase === 'preparation' ? 'normal' : 'normal',
          }}
        >
          "{challenge?.paragraph}"
        </p>
      </div>

      {/* Recording Interface */}
      <div
        className="glass-card animate-fade-in-up stagger-2"
        style={{ padding: '1.5rem', textAlign: 'center' }}
      >
        {/* Preparation Phase */}
        {phase === 'preparation' && (
          <div style={{ padding: '1rem 0' }}>
            <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Read the paragraph above, then press the button when you're ready to speak.
            </p>
            <AudioVisualizer isActive={false} isPaused={false} />
            <div style={{ marginTop: '1.5rem' }}>
              <MicButton
                isListening={false}
                isPaused={false}
                onStart={handleStart}
                onStop={() => { }}
                onPause={() => { }}
                onResume={() => { }}
              />
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
              🎙️ Start Recording
            </p>
          </div>
        )}

        {/* Recording Phase */}
        {phase === 'recording' && (
          <div style={{ padding: '0.5rem 0' }}>
            {/* Status */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.375rem 0.875rem',
                borderRadius: '9999px',
                backgroundColor: isPaused ? 'var(--bg-surface-elevated)' : 'rgba(239, 68, 68, 0.1)',
                color: isPaused ? 'var(--text-muted)' : 'var(--color-error-500)',
                fontSize: '0.8125rem',
                fontWeight: 600,
                marginBottom: '1rem',
              }}
            >
              {!isPaused && (
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-error-500)',
                    animation: 'recording-pulse 2s ease-in-out infinite',
                  }}
                />
              )}
              {isPaused ? 'Paused' : 'Recording'}
            </div>

            {/* Timer */}
            <div
              style={{
                fontSize: '2rem',
                fontWeight: 700,
                fontVariantNumeric: 'tabular-nums',
                color: 'var(--text-primary)',
                marginBottom: '1rem',
              }}
            >
              <Clock size={18} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle', color: 'var(--text-muted)' }} />
              {formatTime(duration)}
            </div>

            {/* Visualizer */}
            <AudioVisualizer isActive={isListening} isPaused={isPaused} />

            {/* Mic controls */}
            <div style={{ marginTop: '1.5rem' }}>
              <MicButton
                isListening={true}
                isPaused={isPaused}
                onStart={handleStart}
                onStop={handleStop}
                onPause={pauseListening}
                onResume={resumeListening}
              />
            </div>
          </div>
        )}

        {/* Review Phase */}
        {phase === 'review' && (
          <div style={{ padding: '0.5rem 0' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: 'var(--color-success-500)',
                fontSize: '0.9375rem',
                fontWeight: 600,
                marginBottom: '1rem',
              }}
            >
              <CheckCircle size={20} />
              Recording Complete
            </div>

            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              Duration: {formatTime(duration)}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="btn-secondary" onClick={handleRecordAgain}>
                <RefreshCw size={16} />
                Record Again
              </button>
              <button className="btn-primary" onClick={handleSubmit}>
                <Send size={16} />
                Submit for Analysis
              </button>
            </div>
          </div>
        )}

        {/* Submitting Phase */}
        {phase === 'submitting' && (
          <div style={{ padding: '2rem 0' }}>
            <Loader2
              size={40}
              style={{
                color: 'var(--color-primary-500)',
                animation: 'spin 0.8s linear infinite',
                marginBottom: '1rem',
              }}
            />
            <p style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.375rem' }}>
              Analyzing your speech...
            </p>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Comparing transcript, evaluating pronunciation, generating feedback
            </p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}
      </div>

      {/* Live Transcript */}
      {(phase === 'recording' || phase === 'review') && (
        <div
          className="glass-card animate-fade-in"
          style={{ marginTop: '1.5rem', padding: '1.25rem' }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '0.75rem',
            }}
          >
            <span
              style={{
                fontSize: '0.6875rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: phase === 'recording' ? 'var(--color-error-500)' : 'var(--color-success-500)',
              }}
            >
              {phase === 'recording' ? 'Live Transcript' : 'Your Raw Transcript'}
            </span>
            {transcript && (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {transcript.split(/\s+/).filter(Boolean).length} words
              </span>
            )}
          </div>

          <div
            ref={transcriptContainerRef}
            style={{
              minHeight: '80px',
              maxHeight: '200px',
              overflowY: 'auto',
              padding: '0.875rem',
              borderRadius: '0.5rem',
              backgroundColor: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-color)',
            }}
          >
            {transcript || interimTranscript ? (
              <p style={{ fontSize: '0.9375rem', lineHeight: 1.75, margin: 0, color: 'var(--text-primary)' }}>
                {transcript}
                {interimTranscript && (
                  <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    {interimTranscript}
                  </span>
                )}
              </p>
            ) : (
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0, fontStyle: 'italic' }}>
                Your speech will appear here as you speak...
              </p>
            )}
          </div>

          {phase === 'review' && (
            <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '0.5rem', marginBottom: 0 }}>
              ⚠️ This is the exact output from the speech recognition engine — no corrections applied.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
