import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Volume2, AlertTriangle } from 'lucide-react';
import type { PronunciationIssue } from '../types';

interface PronunciationCardProps {
  issue: PronunciationIssue;
}

export default function PronunciationCard({ issue }: PronunciationCardProps) {
  const [expanded, setExpanded] = useState(false);

  const severityColors: Record<string, { bg: string; text: string; border: string }> = {
    low: {
      bg: 'rgba(16, 185, 129, 0.1)',
      text: 'var(--color-success-600)',
      border: 'rgba(16, 185, 129, 0.3)',
    },
    medium: {
      bg: 'rgba(245, 158, 11, 0.1)',
      text: 'var(--color-warning-600)',
      border: 'rgba(245, 158, 11, 0.3)',
    },
    high: {
      bg: 'rgba(239, 68, 68, 0.1)',
      text: 'var(--color-error-600)',
      border: 'rgba(239, 68, 68, 0.3)',
    },
  };

  const colors = severityColors[issue.severity] || severityColors.medium;

  const handleListen = (word: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.rate = 0.8;
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div
      style={{
        borderRadius: '0.75rem',
        border: `1px solid ${colors.border}`,
        backgroundColor: colors.bg,
        overflow: 'hidden',
        transition: 'all 0.2s ease',
      }}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.875rem 1rem',
          border: 'none',
          backgroundColor: 'transparent',
          cursor: 'pointer',
          color: 'var(--text-primary)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <AlertTriangle size={16} style={{ color: colors.text }} />
          <span style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{issue.word}</span>
          <span
            style={{
              fontSize: '0.6875rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: colors.text,
              padding: '0.125rem 0.5rem',
              borderRadius: '9999px',
              backgroundColor: `${colors.text}15`,
            }}
          >
            {issue.severity}
          </span>
        </div>
        {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>

      {/* Expandable content */}
      {expanded && (
        <div
          style={{
            padding: '0 1rem 1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.875rem',
            animation: 'fadeIn 0.2s ease-out',
          }}
        >
          {/* Expected vs Detected */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0.75rem',
            }}
          >
            <div>
              <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
                Expected
              </div>
              <div style={{ fontSize: '0.9375rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                {issue.expected_pronunciation || issue.word}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
                Detected
              </div>
              <div style={{ fontSize: '0.9375rem', fontWeight: 500, color: colors.text }}>
                {issue.detected_form}
              </div>
            </div>
          </div>

          {/* IPA */}
          {issue.ipa && (
            <div>
              <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
                IPA Pronunciation
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 500, fontFamily: 'serif', color: 'var(--text-primary)' }}>
                {issue.ipa}
              </div>
            </div>
          )}

          {/* Tip */}
          {issue.feedback && (
            <div
              style={{
                padding: '0.625rem 0.875rem',
                backgroundColor: 'var(--bg-surface)',
                borderRadius: '0.5rem',
                fontSize: '0.8125rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.5,
              }}
            >
              💡 {issue.feedback}
            </div>
          )}

          {/* Listen button */}
          <button
            onClick={() => handleListen(issue.expected_pronunciation || issue.word)}
            className="btn-secondary"
            style={{ alignSelf: 'flex-start', fontSize: '0.8125rem', padding: '0.5rem 1rem' }}
          >
            <Volume2 size={16} />
            Listen to correct pronunciation
          </button>
        </div>
      )}
    </div>
  );
}
