import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mic, Target, TrendingUp, Volume2, ArrowRight, Sparkles, BookOpen, Flame } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2.5rem 1.5rem' }}>
      {/* Welcome */}
      <div className="animate-fade-in-up" style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 0.375rem' }}>
          Welcome back 👋
        </h1>
        <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', margin: 0 }}>
          {user?.name ? `Hi ${user.name}, ready` : 'Ready'} to practice today?
        </p>
      </div>

          {/* Action Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
            {/* Word Pronunciation Practice Card (NEW) */}
            <div
              className="glass-card animate-fade-in-up"
              style={{
                padding: '2rem',
                cursor: 'pointer',
                transition: 'all 0.25s ease',
                border: '1px solid var(--color-primary-400)',
                position: 'relative',
                overflow: 'hidden',
              }}
              onClick={() => navigate('/word-practice')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && navigate('/word-practice')}
            >
              <div
                style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  backgroundColor: 'var(--color-primary-500)',
                  color: 'white',
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  padding: '0.2rem 0.6rem',
                  borderRadius: '9999px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                New Feature
              </div>

                <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
                  <div
                    style={{
                      width: '52px',
                      height: '52px',
                      borderRadius: '14px',
                      background: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Sparkles size={24} color="white" />
                  </div>

                    <div style={{ flex: 1 }}>
                      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.375rem' }}>
                        Word Pronunciation Practice
                      </h2>
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '0 0 1rem', lineHeight: 1.5 }}>
                        Practice challenging words syllable-by-syllable with instant phoneme feedback, stress scoring, and native audio.
                      </p>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginBottom: '1.25rem' }}>
                        {[
                          '200+ Words',
                          'Syllable Breakdown',
                          'Phoneme / Stress Check',
                          'US / UK / IN Accents',
                        ].map((chip) => (
                          <span
                            key={chip}
                            style={{
                              padding: '0.25rem 0.625rem',
                              borderRadius: '9999px',
                              backgroundColor: 'var(--color-primary-50)',
                              color: 'var(--color-primary-600)',
                              fontSize: '0.6875rem',
                              fontWeight: 600,
                            }}
                          >
                            {chip}
                          </span>
                        ))}
                      </div>

                      <button
                        className="btn-primary"
                        onClick={(e) => { e.stopPropagation(); navigate('/word-practice'); }}
                        style={{ fontSize: '0.8125rem', padding: '0.5rem 1rem' }}
                      >
                        Practice Words
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                </div>

                  {/* Communication Practice Card */}
        <div
                  className="glass-card animate-fade-in-up stagger-1"
                  style={{
                    padding: '2rem',
                    cursor: 'pointer',
                    transition: 'all 0.25s ease',
                  }}
                  onClick={() => navigate('/communication')}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && navigate('/communication')}
                >
                  <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
                    <div
                      style={{
                        width: '52px',
                        height: '52px',
                        borderRadius: '14px',
                        background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-primary-700))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                    <Mic size={24} color="white" />
                  </div>

                  <div style={{ flex: 1 }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.375rem' }}>
                      Passage Reading Practice
                    </h2>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '0 0 1rem', lineHeight: 1.5 }}>
                      Read full paragraphs aloud and analyze communication accuracy, fluency, and speaking pace.
                    </p>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginBottom: '1.25rem' }}>
                      {[
                        'Paragraph Challenges',
                        'Live Audio Waveform',
                        'Word-Level Diff',
                        'Fluency & WPM',
                      ].map((chip) => (
                        <span
                          key={chip}
                          style={{
                            padding: '0.25rem 0.625rem',
                            borderRadius: '9999px',
                            backgroundColor: 'var(--bg-surface-elevated)',
                            color: 'var(--text-secondary)',
                            fontSize: '0.6875rem',
                            fontWeight: 600,
                          }}
                        >
                          {chip}
                        </span>
                      ))}
                    </div>

                    <button
                      className="btn-secondary"
                      onClick={(e) => { e.stopPropagation(); navigate('/communication'); }}
                      style={{ fontSize: '0.8125rem', padding: '0.5rem 1rem' }}
                    >
                      Start Passages
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Coming soon placeholders for future extensibility */}
            <div style={{ marginTop: '2rem' }}>
              <h3 style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem' }}>
                Coming Soon
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
                {['Technical Interview', 'HR Interview', 'System Design'].map((item) => (
                  <div
                    key={item}
                    className="glass-card"
                    style={{
                      padding: '1.25rem',
                      opacity: 0.5,
                      cursor: 'not-allowed',
                    }}
                  >
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        backgroundColor: 'var(--bg-surface-elevated)',
                        marginBottom: '0.75rem',
                      }}
                    />
                    <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, margin: '0 0 0.25rem' }}>{item}</h4>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>Coming in future updates</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          );
}
