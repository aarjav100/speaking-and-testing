import React from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';
import type { CommunicationFeedback } from '../types';

interface FeedbackSectionProps {
  feedback: CommunicationFeedback;
}

export default function FeedbackSection({ feedback }: FeedbackSectionProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Summary */}
      {feedback.summary && (
        <div
          className="glass-card"
          style={{ padding: '1.25rem' }}
        >
          <p style={{ fontSize: '0.9375rem', lineHeight: 1.7, color: 'var(--text-secondary)', margin: 0 }}>
            {feedback.summary}
          </p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        {/* Strengths */}
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <h4
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.9375rem',
              fontWeight: 600,
              color: 'var(--color-success-600)',
              margin: '0 0 0.875rem',
            }}
          >
            <CheckCircle size={18} />
            Strengths
          </h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {feedback.strengths.map((item, i) => (
              <li
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.5rem',
                  fontSize: '0.875rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.5,
                }}
              >
                <span style={{ color: 'var(--color-success-500)', marginTop: '0.125rem', flexShrink: 0 }}>✓</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Improvements */}
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <h4
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.9375rem',
              fontWeight: 600,
              color: 'var(--color-warning-600)',
              margin: '0 0 0.875rem',
            }}
          >
            <AlertCircle size={18} />
            Areas to Improve
          </h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {feedback.improvements.map((item, i) => (
              <li
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.5rem',
                  fontSize: '0.875rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.5,
                }}
              >
                <span style={{ color: 'var(--color-warning-500)', marginTop: '0.125rem', flexShrink: 0 }}>•</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
