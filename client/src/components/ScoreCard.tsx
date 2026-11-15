import React, { useEffect, useState } from 'react';

interface ScoreCardProps {
  score: number;
  label: string;
  size?: 'sm' | 'lg';
  color?: string;
}

export default function ScoreCard({ score, label, size = 'sm', color }: ScoreCardProps) {
  const [displayScore, setDisplayScore] = useState(0);
  const isLarge = size === 'lg';
  const dimension = isLarge ? 160 : 100;
  const strokeWidth = isLarge ? 10 : 7;
  const radius = (dimension - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Determine color based on score
  const getColor = () => {
    if (color) return color;
    if (score >= 80) return 'var(--color-success-500)';
    if (score >= 60) return 'var(--color-warning-500)';
    return 'var(--color-error-500)';
  };

  useEffect(() => {
    const duration = 1200;
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(eased * score));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [score]);

  const strokeDashoffset = circumference - (displayScore / 100) * circumference;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
      <div style={{ position: 'relative', width: dimension, height: dimension }}>
        <svg
          className="score-circle"
          width={dimension}
          height={dimension}
          viewBox={`0 0 ${dimension} ${dimension}`}
        >
          <circle
            className="score-circle-track"
            cx={dimension / 2}
            cy={dimension / 2}
            r={radius}
            strokeWidth={strokeWidth}
          />
          <circle
            cx={dimension / 2}
            cy={dimension / 2}
            r={radius}
            fill="none"
            stroke={getColor()}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: 'stroke-dashoffset 0.1s ease' }}
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
          <span
            style={{
              fontSize: isLarge ? '2.25rem' : '1.375rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              lineHeight: 1,
            }}
          >
            {displayScore}
          </span>
          <span
            style={{
              fontSize: isLarge ? '0.8125rem' : '0.6875rem',
              color: 'var(--text-muted)',
              fontWeight: 500,
            }}
          >
            / 100
          </span>
        </div>
      </div>
      <span
        style={{
          fontSize: isLarge ? '0.9375rem' : '0.8125rem',
          fontWeight: 600,
          color: 'var(--text-secondary)',
          textAlign: 'center',
        }}
      >
        {label}
      </span>
    </div>
  );
}
