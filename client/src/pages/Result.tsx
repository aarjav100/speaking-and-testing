import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchResult } from '../services/api';
import ScoreCard from '../components/ScoreCard';
import WordComparison from '../components/WordComparison';
import PronunciationCard from '../components/PronunciationCard';
import FeedbackSection from '../components/FeedbackSection';
import type { SessionWithResult } from '../types';
import {
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  Trophy,
  Volume2,
  BarChart3,
} from 'lucide-react';

export default function Result() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<SessionWithResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setError('Invalid session');
      setLoading(false);
      return;
    }
    loadResult();
  }, [sessionId]);

  const loadResult = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchResult(sessionId!);
      setData(result);
    } catch (err: any) {
      const cached = sessionStorage.getItem('last_result_' + sessionId);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setData({
            session: {
              id: sessionId!,
              user_id: 'demo-user-1',
              challenge_id: 'default',
              expected_text: 'Communication Practice',
              raw_transcript: 'Speech recorded',
              duration: 30,
              created_at: new Date().toISOString(),
            },
            result: parsed,
            challenge: {
              id: 'default',
              title: 'Communication Practice',
              paragraph: 'Practice completed',
              difficulty: 'medium',
              created_at: new Date().toISOString(),
            },
          });
          return;
        } catch {}
      }
      setError(err.message || 'Failed to load result');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2.5rem 1.5rem' }}>
        <div className="skeleton" style={{ width: '150px', height: '24px', marginBottom: '2rem' }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
          <div className="skeleton" style={{ height: '140px' }} />
          <div className="skeleton" style={{ height: '140px' }} />
          <div className="skeleton" style={{ height: '140px' }} />
        </div>
        <div className="skeleton" style={{ height: '300px' }} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '4rem 1.5rem', textAlign: 'center' }}>
        <AlertCircle size={48} style={{ color: 'var(--color-error-500)', marginBottom: '1rem' }} />
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>Failed to Load Result</h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>{error}</p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <button className="btn-secondary" onClick={() => navigate('/dashboard')}>
            <ArrowLeft size={16} />
            Dashboard
          </button>
          <button className="btn-primary" onClick={loadResult}>
            <RefreshCw size={16} />
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { result } = data;

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1.5rem 4rem' }}>
      {/* Header */}
      <div className="animate-fade-in" style={{ marginBottom: '2rem' }}>
        <button
          onClick={() => navigate('/dashboard')}
          className="btn-secondary"
          style={{ marginBottom: '1rem', fontSize: '0.8125rem', padding: '0.375rem 0.875rem' }}
        >
          <ArrowLeft size={14} />
          Dashboard
        </button>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 0.25rem' }}>
          Communication Result
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0 }}>
          {data.challenge?.title || 'Practice Session'}
        </p>
      </div>

      {/* Overall Score */}
      <div
        className="glass-card animate-fade-in-up stagger-1"
        style={{
          padding: '2rem',
          textAlign: 'center',
          marginBottom: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <Trophy size={20} style={{ color: 'var(--color-primary-500)' }} />
          <span style={{ fontSize: '0.8125rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
            Overall Score
          </span>
        </div>
        <ScoreCard score={result.overall_score} label="Overall" size="lg" />
      </div>

      {/* Sub Scores */}
      <div
        className="animate-fade-in-up stagger-2"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem',
        }}
      >
        {[
          { label: 'Pronunciation', score: result.pronunciation_score, icon: <Volume2 size={14} /> },
          { label: 'Speech Accuracy', score: result.speech_accuracy, icon: <BarChart3 size={14} /> },
          { label: 'Fluency', score: result.fluency_score },
          { label: 'Word Accuracy', score: result.word_accuracy },
          { label: 'Communication', score: result.communication_score },
        ].map((item) => (
          <div key={item.label} className="glass-card" style={{ padding: '1.25rem', textAlign: 'center' }}>
            <ScoreCard score={item.score} label={item.label} size="sm" />
          </div>
        ))}
      </div>

      {/* Speech Comparison */}
      <div className="animate-fade-in-up stagger-3" style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <BarChart3 size={18} style={{ color: 'var(--color-primary-500)' }} />
          Speech Comparison
        </h2>
        <WordComparison
          comparison={result.word_comparison}
          expectedText={data.session.expected_text}
          rawTranscript={data.session.raw_transcript}
        />
      </div>

      {/* Pronunciation Issues */}
      {result.pronunciation_issues && result.pronunciation_issues.length > 0 && (
        <div className="animate-fade-in-up stagger-4" style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Volume2 size={18} style={{ color: 'var(--color-warning-500)' }} />
            Pronunciation Issues ({result.pronunciation_issues.length})
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {result.pronunciation_issues.map((issue) => (
              <PronunciationCard key={issue.id} issue={issue} />
            ))}
          </div>
        </div>
      )}

      {/* Feedback */}
      {result.feedback && (
        <div className="animate-fade-in-up stagger-5" style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1rem' }}>
            Communication Feedback
          </h2>
          <FeedbackSection feedback={result.feedback} />
        </div>
      )}

      {/* Actions */}
      <div
        className="animate-fade-in"
        style={{
          display: 'flex',
          gap: '0.75rem',
          justifyContent: 'center',
          paddingTop: '1rem',
        }}
      >
        <button className="btn-secondary" onClick={() => navigate('/dashboard')}>
          <ArrowLeft size={16} />
          Dashboard
        </button>
        <button className="btn-primary" onClick={() => navigate('/communication')}>
          <RefreshCw size={16} />
          Practice Again
        </button>
      </div>
    </div>
  );
}
