import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mic, BarChart3, BookOpen, ArrowRight, Sparkles, Target, TrendingUp } from 'lucide-react';

export default function Landing() {
  const { user } = useAuth();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
      {/* Hero Section */}
      <section
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '4rem 1.5rem 3rem',
          display: 'flex',
          alignItems: 'center',
          gap: '4rem',
          minHeight: 'calc(100vh - 64px)',
        }}
      >
        {/* Left content */}
        <div style={{ flex: 1 }} className="animate-fade-in-up">
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.375rem 0.875rem',
              borderRadius: '9999px',
              backgroundColor: 'var(--color-primary-50)',
              color: 'var(--color-primary-600)',
              fontSize: '0.8125rem',
              fontWeight: 600,
              marginBottom: '1.5rem',
            }}
            className="stagger-1 animate-fade-in"
          >
            <Sparkles size={14} />
            AI-Powered Interview Preparation
          </div>

          <h1
            style={{
              fontSize: 'clamp(2.25rem, 5vw, 3.5rem)',
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: '-0.03em',
              color: 'var(--text-primary)',
              margin: '0 0 1.25rem',
            }}
          >
            Practice. Speak.{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-primary-700))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Improve.
            </span>
          </h1>

          <p
            style={{
              fontSize: '1.125rem',
              lineHeight: 1.7,
              color: 'var(--text-secondary)',
              maxWidth: '540px',
              margin: '0 0 2rem',
            }}
            className="stagger-2 animate-fade-in"
          >
            An AI-powered interview preparation platform that helps you improve communication,
            pronunciation, and speaking confidence.
          </p>

          <div
            style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}
            className="stagger-3 animate-fade-in"
          >
            <Link
              to={user ? '/dashboard' : '/signup'}
              className="btn-primary"
              style={{ fontSize: '0.9375rem', padding: '0.75rem 1.75rem' }}
            >
              Get Started
              <ArrowRight size={18} />
            </Link>
            {!user && (
              <Link
                to="/login"
                className="btn-secondary"
                style={{ fontSize: '0.9375rem', padding: '0.75rem 1.75rem' }}
              >
                Login
              </Link>
            )}
          </div>
        </div>

        {/* Right - Animated Mic Visualization */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          className="stagger-4 animate-fade-in"
        >
          <div style={{ position: 'relative' }}>
            {/* Outer rings */}
            <div
              style={{
                position: 'absolute',
                inset: '-30px',
                borderRadius: '50%',
                border: '1.5px solid var(--color-primary-200)',
                opacity: 0.3,
              }}
              className="animate-pulse-ring"
            />
            <div
              style={{
                position: 'absolute',
                inset: '-60px',
                borderRadius: '50%',
                border: '1px solid var(--color-primary-200)',
                opacity: 0.15,
              }}
              className="animate-pulse-ring"
            />
            <div
              style={{
                position: 'absolute',
                inset: '-90px',
                borderRadius: '50%',
                border: '1px solid var(--color-primary-200)',
                opacity: 0.08,
              }}
              className="animate-pulse-ring"
            />

            {/* Main circle */}
            <div
              className="animate-float"
              style={{
                width: '180px',
                height: '180px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-primary-700))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 20px 60px rgba(79, 70, 229, 0.3)',
              }}
            >
              <Mic size={64} color="white" strokeWidth={1.5} />
            </div>

            {/* Floating badges */}
            <div
              style={{
                position: 'absolute',
                top: '-10px',
                right: '-60px',
                padding: '0.5rem 0.875rem',
                borderRadius: '0.75rem',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                boxShadow: 'var(--shadow-md)',
                fontSize: '0.75rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
              }}
              className="animate-float"
            >
              <BarChart3 size={14} style={{ color: 'var(--color-primary-500)' }} />
              Live Analysis
            </div>

            <div
              style={{
                position: 'absolute',
                bottom: '0',
                left: '-70px',
                padding: '0.5rem 0.875rem',
                borderRadius: '0.75rem',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                boxShadow: 'var(--shadow-md)',
                fontSize: '0.75rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                animationDelay: '0.5s',
              }}
              className="animate-float"
            >
              <Target size={14} style={{ color: 'var(--color-success-500)' }} />
              Pronunciation
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem 5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2
            style={{
              fontSize: '1.75rem',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: 'var(--text-primary)',
              marginBottom: '0.75rem',
            }}
          >
            How It Works
          </h2>
          <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto' }}>
            Practice your communication skills with real-time speech analysis and detailed feedback.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.5rem',
          }}
        >
          {[
            {
              icon: <BookOpen size={24} />,
              title: 'Read the Challenge',
              description: 'Get a paragraph to practice. Take your time to prepare before speaking.',
              color: 'var(--color-primary-500)',
            },
            {
              icon: <Mic size={24} />,
              title: 'Speak & Record',
              description: 'Read the paragraph aloud. Your speech is transcribed in real time with exact accuracy.',
              color: 'var(--color-success-500)',
            },
            {
              icon: <TrendingUp size={24} />,
              title: 'Get Detailed Results',
              description: 'Receive word-level comparison, pronunciation analysis, and actionable feedback.',
              color: 'var(--color-warning-500)',
            },
          ].map((feature, i) => (
            <div
              key={i}
              className="glass-card stagger-2 animate-fade-in-up"
              style={{
                padding: '1.75rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  backgroundColor: `${feature.color}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: feature.color,
                }}
              >
                {feature.icon}
              </div>
              <h3 style={{ fontSize: '1.0625rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                {feature.title}
              </h3>
              <p style={{ fontSize: '0.875rem', lineHeight: 1.6, color: 'var(--text-secondary)', margin: 0 }}>
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
