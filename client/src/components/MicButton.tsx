import React from 'react';
import { Mic, MicOff, Pause, Play, Square } from 'lucide-react';

interface MicButtonProps {
  isListening: boolean;
  isPaused: boolean;
  onStart: () => void;
  onStop: () => void;
  onPause: () => void;
  onResume: () => void;
  disabled?: boolean;
}

export default function MicButton({
  isListening,
  isPaused,
  onStart,
  onStop,
  onPause,
  onResume,
  disabled,
}: MicButtonProps) {
  if (!isListening) {
    return (
      <button
        onClick={onStart}
        disabled={disabled}
        className="btn-primary"
        style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          padding: 0,
          fontSize: '1rem',
          position: 'relative',
          overflow: 'visible',
        }}
        aria-label="Start recording"
      >
        {/* Outer ring */}
        <span
          style={{
            position: 'absolute',
            inset: '-6px',
            borderRadius: '50%',
            border: '2px solid var(--color-primary-300)',
            opacity: 0.4,
          }}
        />
        <Mic size={28} />
      </button>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
      {/* Pause/Resume */}
      <button
        onClick={isPaused ? onResume : onPause}
        className="btn-secondary"
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          padding: 0,
        }}
        aria-label={isPaused ? 'Resume recording' : 'Pause recording'}
      >
        {isPaused ? <Play size={20} /> : <Pause size={20} />}
      </button>

      {/* Main mic button - pulsing while recording */}
      <div style={{ position: 'relative' }}>
        {!isPaused && (
          <>
            <span
              style={{
                position: 'absolute',
                inset: '-8px',
                borderRadius: '50%',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
              }}
              className="animate-pulse-ring"
            />
            <span
              style={{
                position: 'absolute',
                inset: '-16px',
                borderRadius: '50%',
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
              }}
              className="animate-pulse-ring"
            />
          </>
        )}
        <button
          onClick={onStop}
          className={isPaused ? 'btn-secondary' : 'btn-danger'}
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            padding: 0,
            position: 'relative',
            zIndex: 1,
            animation: !isPaused ? 'recording-pulse 2s ease-in-out infinite' : 'none',
          }}
          aria-label="Stop recording"
        >
          <Square size={24} />
        </button>
      </div>

      {/* Spacer */}
      <div style={{ width: '48px' }} />
    </div>
  );
}
