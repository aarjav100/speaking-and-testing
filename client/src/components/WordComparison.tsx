import React, { useState } from 'react';
import { Volume2 } from 'lucide-react';
import type { WordComparison as WordComparisonType, WordComparisonItem } from '../types';

interface WordComparisonProps {
  comparison: WordComparisonType;
  expectedText: string;
  rawTranscript: string;
}

export default function WordComparison({ comparison, expectedText, rawTranscript }: WordComparisonProps) {
  const [selectedWord, setSelectedWord] = useState<WordComparisonItem | null>(null);

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Side by side comparison */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '1rem',
        }}
      >
        {/* Expected */}
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div
            style={{
              fontSize: '0.6875rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: 'var(--color-primary-500)',
              marginBottom: '0.75rem',
            }}
          >
            Expected Paragraph
          </div>
          <p
            style={{
              fontSize: '0.9375rem',
              lineHeight: 1.75,
              color: 'var(--text-primary)',
            }}
          >
            {expectedText}
          </p>
        </div>

        {/* Spoken (raw transcript) */}
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div
            style={{
              fontSize: '0.6875rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: 'var(--color-warning-500)',
              marginBottom: '0.75rem',
            }}
          >
            Your Speech (Raw Transcript)
          </div>
          <p
            style={{
              fontSize: '0.9375rem',
              lineHeight: 1.75,
              color: 'var(--text-primary)',
            }}
          >
            {rawTranscript}
          </p>
        </div>
      </div>

      {/* Interactive word-level comparison */}
      <div className="glass-card" style={{ padding: '1.25rem' }}>
        <div
          style={{
            fontSize: '0.6875rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: 'var(--text-muted)',
            marginBottom: '1rem',
          }}
        >
          Word-Level Analysis
        </div>

        {/* Legend */}
        <div
          style={{
            display: 'flex',
            gap: '1rem',
            marginBottom: '1rem',
            flexWrap: 'wrap',
          }}
        >
          {[
            { label: 'Correct', className: 'word-correct', symbol: '✓' },
            { label: 'Missing', className: 'word-missing', symbol: '✗' },
            { label: 'Extra', className: 'word-extra', symbol: '+' },
            { label: 'Mismatch', className: 'word-mismatch', symbol: '≠' },
          ].map((item) => (
            <div
              key={item.label}
              style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem' }}
            >
              <span className={item.className} style={{ fontWeight: 600 }}>
                {item.symbol}
              </span>
              <span style={{ color: 'var(--text-muted)' }}>{item.label}</span>
            </div>
          ))}
        </div>

        {/* Expected words */}
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            Expected:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
            {comparison.expected.map((item, i) => (
              <span
                key={`exp-${i}`}
                className={`word-${item.status}`}
                style={{
                  cursor: item.status !== 'correct' ? 'pointer' : 'default',
                  padding: '0.125rem 0.375rem',
                  borderRadius: '0.25rem',
                  fontSize: '0.9375rem',
                  fontWeight: item.status !== 'correct' ? 600 : 400,
                  transition: 'all 0.15s ease',
                }}
                onClick={() => item.status !== 'correct' && setSelectedWord(item)}
              >
                {item.word}
              </span>
            ))}
          </div>
        </div>

        {/* Spoken words */}
        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            Your speech:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
            {comparison.spoken.map((item, i) => (
              <span
                key={`spk-${i}`}
                className={`word-${item.status}`}
                style={{
                  cursor: item.status !== 'correct' ? 'pointer' : 'default',
                  padding: '0.125rem 0.375rem',
                  borderRadius: '0.25rem',
                  fontSize: '0.9375rem',
                  fontWeight: item.status !== 'correct' ? 600 : 400,
                  transition: 'all 0.15s ease',
                }}
                onClick={() => item.status !== 'correct' && setSelectedWord(item)}
              >
                {item.word}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Selected word detail */}
      {selectedWord && selectedWord.status !== 'correct' && (
        <div
          className="glass-card animate-fade-in"
          style={{ padding: '1.25rem' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, margin: 0 }}>Word Detail</h4>
            <button
              onClick={() => setSelectedWord(null)}
              style={{
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Close
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                Word
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 600 }}>{selectedWord.word}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                Status
              </div>
              <span className={`word-${selectedWord.status}`} style={{ fontSize: '1rem', fontWeight: 600, textTransform: 'capitalize' }}>
                {selectedWord.status}
              </span>
            </div>
            {selectedWord.expected && (
              <div>
                <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                  Expected
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 500 }}>{selectedWord.expected}</div>
              </div>
            )}
          </div>
          <button
            onClick={() => handleListen(selectedWord.expected || selectedWord.word)}
            className="btn-secondary"
            style={{ marginTop: '0.75rem', fontSize: '0.8125rem', padding: '0.5rem 1rem' }}
          >
            <Volume2 size={16} />
            Listen
          </button>
        </div>
      )}

      {/* Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '0.75rem',
        }}
      >
        {[
          { label: 'Total Words', value: comparison.totalExpected, color: 'var(--text-primary)' },
          { label: 'Correct', value: comparison.correctCount, color: 'var(--color-success-500)' },
          { label: 'Missing', value: comparison.missingCount, color: 'var(--color-error-500)' },
          { label: 'Extra', value: comparison.extraCount, color: 'var(--color-warning-500)' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="glass-card"
            style={{ padding: '1rem', textAlign: 'center' }}
          >
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
