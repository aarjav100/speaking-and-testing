import React from 'react';

interface ScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
}

export default function ScoreRing({
  score,
  size = 140,
  strokeWidth = 10,
  label,
}: ScoreRingProps) {
  const center = size / 2;
  const radius = center - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  // Color selection
  let color = 'var(--color-error-500)';
  let bgTrack = 'rgba(239, 68, 68, 0.15)';
  let rating = 'Needs Practice';

  if (score >= 85) {
    color = 'var(--color-success-500)';
    bgTrack = 'rgba(16, 185, 129, 0.15)';
    rating = 'Mastered ⭐';
  } else if (score >= 65) {
    color = 'var(--color-warning-500)';
    bgTrack = 'rgba(245, 158, 11, 0.15)';
    rating = 'Good Effort';
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          {/* Background circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke={bgTrack}
            strokeWidth={strokeWidth}
          />
          {/* Progress circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.8s ease' }}
          />
        </svg>

        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span style={{ fontSize: '2.25rem', fontWeight: 800, color, lineHeight: 1 }}>
            {score}
          </span>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            / 100
          </span>
        </div>
      </div>

      <div
        style={{
          marginTop: '0.75rem',
          fontSize: '0.875rem',
          fontWeight: 700,
          color,
          backgroundColor: bgTrack,
          padding: '0.25rem 0.75rem',
          borderRadius: '9999px',
        }}
      >
        {label || rating}
      </div>
    </div>
  );
}
