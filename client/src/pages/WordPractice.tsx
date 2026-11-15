import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { WORDS_DATABASE, WordItem } from '../data/words';
import { analyzeSingleWord, WordAnalysisResult } from '../services/wordAnalysis';
import { useSingleWordAudio, EnglishAccent } from '../hooks/useSingleWordAudio';
import { saveWordAttempt, getWordPracticeStats, WordAttemptRecord } from '../services/wordStorage';
import ScoreRing from '../components/ScoreRing';
import {
  Volume2,
  Mic,
  MicOff,
  RotateCcw,
  ArrowRight,
  ArrowLeft,
  Shuffle,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Play,
  Flame,
  Award,
  ListFilter,
  Check,
  ChevronRight,
  BookOpen,
} from 'lucide-react';

export default function WordPractice() {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedLevel, setSelectedLevel] = useState<string>('All');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [analysis, setAnalysis] = useState<WordAnalysisResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'practice' | 'mastered' | 'review'>('practice');
  const [stats, setStats] = useState(getWordPracticeStats());

  // Filter words based on Category and Level
  const filteredWords = useMemo(() => {
    return WORDS_DATABASE.filter((w) => {
      const matchCat = selectedCategory === 'All' || w.category === selectedCategory;
      const matchLev = selectedLevel === 'All' || w.level === selectedLevel;
      return matchCat && matchLev;
    });
  }, [selectedCategory, selectedLevel]);

  // Current active word
  const currentWord: WordItem = filteredWords[currentIndex] || WORDS_DATABASE[0];

  // Callback when a word is recognized by speech recognition
  const handleWordRecognized = useCallback((transcript: string, durationSeconds: number) => {
    setErrorMessage(null);
    const { result, error } = analyzeSingleWord(currentWord, transcript, durationSeconds);

    if (error) {
      setErrorMessage(error);
      setAnalysis(null);
      return;
    }

    if (result) {
      setAnalysis(result);

      // Save to local storage stats
      saveWordAttempt({
        wordId: currentWord.id,
        word: currentWord.word,
        score: result.overallScore,
        accuracy: result.accuracyScore,
        stress: result.stressScore,
        clarity: result.clarityScore,
        mastered: result.mastered,
        soundFocus: currentWord.soundFocus,
      });

      // Refresh stats
      setStats(getWordPracticeStats());
    }
  }, [currentWord]);

  // Audio Hook
  const {
    isListening,
    userAudioUrl,
    error: audioError,
    accent,
    isSlow,
    setAccent,
    setIsSlow,
    playNativeAudio,
    playUserAudio,
    startListening,
    stopListening,
    resetState,
  } = useSingleWordAudio(handleWordRecognized);

  // Sync index when filter changes
  useEffect(() => {
    setCurrentIndex(0);
    setAnalysis(null);
    setErrorMessage(null);
    resetState();
  }, [selectedCategory, selectedLevel, resetState]);

  // Navigation handlers
  const handleNextWord = () => {
    if (currentIndex < filteredWords.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setCurrentIndex(0);
    }
    setAnalysis(null);
    setErrorMessage(null);
    resetState();
  };

  const handlePrevWord = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    } else {
      setCurrentIndex(filteredWords.length - 1);
    }
    setAnalysis(null);
    setErrorMessage(null);
    resetState();
  };

  const handleRandomWord = () => {
    const randomIdx = Math.floor(Math.random() * filteredWords.length);
    setCurrentIndex(randomIdx);
    setAnalysis(null);
    setErrorMessage(null);
    resetState();
  };

  const handleSelectWord = (wordId: string) => {
    const idx = filteredWords.findIndex((w) => w.id === wordId);
    if (idx !== -1) {
      setCurrentIndex(idx);
    } else {
      // Find in full db and reset filters
      setSelectedCategory('All');
      setSelectedLevel('All');
      const allIdx = WORDS_DATABASE.findIndex((w) => w.id === wordId);
      if (allIdx !== -1) setCurrentIndex(allIdx);
    }
    setActiveTab('practice');
    setAnalysis(null);
    setErrorMessage(null);
    resetState();
  };

  const categories = ['All', 'Hard-to-pronounce', 'Business', 'Interview', 'Academic'];
  const levels = ['All', 'Easy', 'Medium', 'Hard'];

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem 1.5rem 5rem' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary-600)', fontSize: '0.8125rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <Sparkles size={16} />
            Word Pronunciation Practice
          </div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 800, letterSpacing: '-0.02em', margin: '0.25rem 0 0' }}>
            Master Every Syllable
          </h1>
        </div>

        {/* Stats Pill Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.875rem' }}>
            <Flame size={18} color="var(--color-warning-500)" />
            <span style={{ fontSize: '0.875rem', fontWeight: 700 }}>{stats.streak} Day Streak</span>
          </div>
          <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.875rem' }}>
            <Award size={18} color="var(--color-success-500)" />
            <span style={{ fontSize: '0.875rem', fontWeight: 700 }}>{stats.masteredCount} Mastered</span>
          </div>
        </div>
      </div>

      {/* View Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
        <button
          onClick={() => setActiveTab('practice')}
          style={{
            padding: '0.625rem 1.25rem',
            borderBottom: activeTab === 'practice' ? '2px solid var(--color-primary-500)' : '2px solid transparent',
            color: activeTab === 'practice' ? 'var(--color-primary-500)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'practice' ? 700 : 500,
            background: 'none',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            cursor: 'pointer',
            fontSize: '0.9375rem',
          }}
        >
          Practice Mode
        </button>
        <button
          onClick={() => setActiveTab('mastered')}
          style={{
            padding: '0.625rem 1.25rem',
            borderBottom: activeTab === 'mastered' ? '2px solid var(--color-primary-500)' : '2px solid transparent',
            color: activeTab === 'mastered' ? 'var(--color-primary-500)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'mastered' ? 700 : 500,
            background: 'none',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            cursor: 'pointer',
            fontSize: '0.9375rem',
          }}
        >
          Mastered Words ({stats.masteredCount})
        </button>
        <button
          onClick={() => setActiveTab('review')}
          style={{
            padding: '0.625rem 1.25rem',
            borderBottom: activeTab === 'review' ? '2px solid var(--color-primary-500)' : '2px solid transparent',
            color: activeTab === 'review' ? 'var(--color-primary-500)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'review' ? 700 : 500,
            background: 'none',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            cursor: 'pointer',
            fontSize: '0.9375rem',
          }}
        >
          Needs Practice ({stats.needsPracticeCount})
        </button>
      </div>

      {activeTab === 'practice' && (
        <>
          {/* Filter Bar */}
          <div className="glass-card" style={{ padding: '1rem', marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
            {/* Category pills */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginRight: '0.25rem' }}>Topic:</span>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    padding: '0.3rem 0.75rem',
                    borderRadius: '9999px',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    border: '1px solid',
                    borderColor: selectedCategory === cat ? 'var(--color-primary-500)' : 'var(--border-color)',
                    backgroundColor: selectedCategory === cat ? 'var(--color-primary-500)' : 'transparent',
                    color: selectedCategory === cat ? 'white' : 'var(--text-primary)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Level selection */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Level:</span>
              {levels.map((lev) => (
                <button
                  key={lev}
                  onClick={() => setSelectedLevel(lev)}
                  style={{
                    padding: '0.3rem 0.65rem',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    border: '1px solid',
                    borderColor: selectedLevel === lev ? 'var(--color-primary-500)' : 'var(--border-color)',
                    backgroundColor: selectedLevel === lev ? 'var(--color-primary-50)' : 'transparent',
                    color: selectedLevel === lev ? 'var(--color-primary-600)' : 'var(--text-secondary)',
                  }}
                >
                  {lev}
                </button>
              ))}
            </div>
          </div>

          {/* MAIN WORD CARD */}
          <div className="glass-card animate-fade-in" style={{ padding: '2.5rem 2rem', textAlign: 'center', position: 'relative', marginBottom: '1.5rem' }}>
            {/* Top Badges */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <span style={{ padding: '0.25rem 0.625rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, backgroundColor: 'var(--color-primary-50)', color: 'var(--color-primary-600)' }}>
                  {currentWord.category}
                </span>
                <span style={{ padding: '0.25rem 0.625rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, backgroundColor: 'var(--bg-surface-elevated)', color: 'var(--text-secondary)' }}>
                  {currentWord.level}
                </span>
                <span style={{ padding: '0.25rem 0.625rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: 'rgba(245, 158, 11, 0.1)', color: 'var(--color-warning-600)' }}>
                  Sound: /{currentWord.soundFocus}/
                </span>
              </div>

              <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                Word {currentIndex + 1} of {filteredWords.length}
              </div>
            </div>

            {/* THE WORD (48px - 64px bold font) */}
            <h2
              style={{
                fontSize: 'clamp(2.75rem, 6vw, 4rem)',
                fontWeight: 900,
                letterSpacing: '-0.03em',
                color: 'var(--text-primary)',
                margin: '0.5rem 0 1rem',
              }}
            >
              {currentWord.word}
            </h2>

            {/* Phonetic Pronunciation Details */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.25rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              {/* IPA */}
              <div style={{ fontFamily: 'monospace', fontSize: '1.25rem', color: 'var(--color-primary-500)', fontWeight: 600, backgroundColor: 'var(--bg-surface-elevated)', padding: '0.35rem 0.85rem', borderRadius: '8px' }}>
                {currentWord.ipa}
              </div>

              {/* Simple Phonetic */}
              <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {currentWord.simplePhonetic}
              </div>
            </div>

            {/* Meaning & Example Sentence */}
            <div style={{ maxWidth: '650px', margin: '0 auto 1.75rem' }}>
              <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', margin: '0 0 0.5rem' }}>
                <span style={{ fontStyle: 'italic', fontWeight: 600, color: 'var(--text-primary)', marginRight: '0.35rem' }}>({currentWord.partOfSpeech})</span>
                {currentWord.meaning}
              </p>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>
                "{currentWord.exampleSentence}"
              </p>
            </div>

            {/* TTS Options: Accent & Speed */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
              {/* Listen button */}
              <button
                onClick={() => playNativeAudio(currentWord.word)}
                className="btn-primary"
                style={{ padding: '0.625rem 1.25rem', fontSize: '0.875rem', borderRadius: '10px' }}
                title="Listen to native speaker pronunciation"
              >
                <Volume2 size={18} />
                Listen {isSlow ? '(Slow 0.7x)' : '(1.0x)'}
              </button>

              {/* Slow speed toggle */}
              <button
                onClick={() => setIsSlow(!isSlow)}
                style={{
                  padding: '0.625rem 1rem',
                  borderRadius: '10px',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: '1px solid var(--border-color)',
                  backgroundColor: isSlow ? 'var(--color-primary-50)' : 'transparent',
                  color: isSlow ? 'var(--color-primary-600)' : 'var(--text-secondary)',
                }}
              >
                Slow Speed {isSlow ? 'ON' : 'OFF'}
              </button>

              {/* Accent selector */}
              <div style={{ display: 'flex', border: '1px solid var(--border-color)', borderRadius: '10px', overflow: 'hidden' }}>
                {(['en-US', 'en-GB', 'en-IN'] as EnglishAccent[]).map((acc) => (
                  <button
                    key={acc}
                    onClick={() => setAccent(acc)}
                    style={{
                      padding: '0.5rem 0.75rem',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: 'none',
                      backgroundColor: accent === acc ? 'var(--color-primary-500)' : 'transparent',
                      color: accent === acc ? 'white' : 'var(--text-secondary)',
                    }}
                  >
                    {acc === 'en-US' ? '🇺🇸 US' : acc === 'en-GB' ? '🇬🇧 UK' : '🇮🇳 IN'}
                  </button>
                ))}
              </div>
            </div>

            {/* BIG MIC BUTTON WITH ANIMATED PULSE */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '1rem 0' }}>
              <button
                onClick={isListening ? stopListening : startListening}
                style={{
                  width: '84px',
                  height: '84px',
                  borderRadius: '50%',
                  border: 'none',
                  cursor: 'pointer',
                  background: isListening
                    ? 'linear-gradient(135deg, var(--color-error-500), var(--color-error-600))'
                    : 'linear-gradient(135deg, var(--color-primary-500), var(--color-primary-700))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: isListening
                    ? '0 0 0 12px rgba(239, 68, 68, 0.25), 0 0 0 24px rgba(239, 68, 68, 0.12)'
                    : 'var(--shadow-lg)',
                  transition: 'all 0.3s ease',
                  transform: isListening ? 'scale(1.08)' : 'scale(1)',
                }}
                aria-label={isListening ? 'Stop listening' : 'Start speaking'}
              >
                {isListening ? <MicOff size={36} color="white" /> : <Mic size={36} color="white" />}
              </button>

              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: isListening ? 'var(--color-error-500)' : 'var(--text-secondary)', marginTop: '1rem' }}>
                {isListening ? 'Listening... Speak now!' : 'Tap mic and pronounce the word'}
              </span>
            </div>

            {/* Error banner if microphone fails or no speech detected */}
            {(errorMessage || audioError) && (
              <div
                className="animate-fade-in"
                style={{
                  marginTop: '1.25rem',
                  padding: '0.875rem 1.25rem',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid var(--color-error-500)',
                  color: 'var(--color-error-600)',
                  fontSize: '0.875rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <AlertTriangle size={18} />
                {errorMessage || audioError}
              </div>
            )}
          </div>

          {/* ANALYSIS & SCORE SECTION */}
          {analysis && (
            <div className="glass-card animate-fade-in-up" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '2.5rem', alignItems: 'center' }}>
                {/* Circular Score Ring */}
                <ScoreRing
                  score={analysis.overallScore}
                  size={150}
                  strokeWidth={12}
                  label={analysis.mastered ? 'Mastered ⭐' : analysis.needsRetry ? 'Needs Practice' : 'Good Effort'}
                />

                {/* Score Breakdown & Syllable Analysis */}
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.75rem' }}>
                    Pronunciation Breakdown
                  </h3>

                  {/* 3 Metrics: Accuracy, Stress, Clarity */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.25rem' }}>
                    <div style={{ backgroundColor: 'var(--bg-surface-elevated)', padding: '0.75rem', borderRadius: '8px', textAlign: 'center' }}>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-primary-500)' }}>{analysis.accuracyScore}%</div>
                      <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Accuracy</div>
                    </div>
                    <div style={{ backgroundColor: 'var(--bg-surface-elevated)', padding: '0.75rem', borderRadius: '8px', textAlign: 'center' }}>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-warning-500)' }}>{analysis.stressScore}%</div>
                      <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Syllable Stress</div>
                    </div>
                    <div style={{ backgroundColor: 'var(--bg-surface-elevated)', padding: '0.75rem', borderRadius: '8px', textAlign: 'center' }}>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-success-500)' }}>{analysis.clarityScore}%</div>
                      <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Clarity</div>
                    </div>
                  </div>

                  {/* Syllable-by-syllable Breakdown with colors */}
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                      Syllable Breakdown:
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {analysis.syllableResults.map((syl, i) => {
                        const isCorrect = syl.status === 'correct';
                        const isUnclear = syl.status === 'unclear';
                        const bg = isCorrect
                          ? 'rgba(16, 185, 129, 0.15)'
                          : isUnclear
                          ? 'rgba(245, 158, 11, 0.15)'
                          : 'rgba(239, 68, 68, 0.15)';
                        const fg = isCorrect
                          ? 'var(--color-success-600)'
                          : isUnclear
                          ? 'var(--color-warning-600)'
                          : 'var(--color-error-600)';

                        return (
                          <div
                            key={i}
                            style={{
                              padding: '0.5rem 0.875rem',
                              borderRadius: '8px',
                              backgroundColor: bg,
                              border: `1px solid ${fg}`,
                              color: fg,
                              fontWeight: syl.isStressed ? 800 : 600,
                              fontSize: '1rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                            }}
                          >
                            <span>{syl.syllable}</span>
                            {syl.isStressed && (
                              <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.3rem', borderRadius: '4px', backgroundColor: fg, color: 'white' }}>
                                STRESS
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Side-by-side: What you said vs Target */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
                <div style={{ padding: '0.875rem 1rem', borderRadius: '10px', backgroundColor: 'var(--bg-surface-elevated)' }}>
                  <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                    What You Said:
                  </div>
                  <div style={{ fontSize: '1.125rem', fontWeight: 700, color: analysis.mastered ? 'var(--color-success-600)' : 'var(--color-warning-600)', marginTop: '0.25rem' }}>
                    "{analysis.spokenWord}"
                  </div>
                </div>

                <div style={{ padding: '0.875rem 1rem', borderRadius: '10px', backgroundColor: 'var(--bg-surface-elevated)' }}>
                  <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                    Target Word:
                  </div>
                  <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-primary-500)', marginTop: '0.25rem' }}>
                    "{analysis.targetWord}"
                  </div>
                </div>
              </div>

              {/* Phoneme Feedback & Mouth/Tongue Tip */}
              <div style={{ marginTop: '1.25rem', padding: '1rem 1.25rem', borderRadius: '10px', backgroundColor: 'var(--color-primary-50)', border: '1px solid var(--color-primary-200)', color: 'var(--color-primary-900)' }}>
                <div style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                  🎯 Phonetic Tip:
                </div>
                <p style={{ margin: 0, fontSize: '0.875rem', lineHeight: 1.5 }}>
                  {analysis.phonemeFeedback}
                </p>
                {analysis.tip && (
                  <p style={{ margin: '0.5rem 0 0', fontSize: '0.8125rem', opacity: 0.9 }}>
                    💡 <strong>Mouth Position:</strong> {analysis.tip}
                  </p>
                )}
              </div>

              {/* Audio Comparison: User Voice vs Native */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {userAudioUrl && (
                    <button
                      onClick={playUserAudio}
                      className="btn-secondary"
                      style={{ fontSize: '0.8125rem', padding: '0.5rem 1rem' }}
                    >
                      <Play size={16} />
                      Play My Voice
                    </button>
                  )}
                  <button
                    onClick={() => playNativeAudio(currentWord.word)}
                    className="btn-secondary"
                    style={{ fontSize: '0.8125rem', padding: '0.5rem 1rem' }}
                  >
                    <Volume2 size={16} />
                    Play Correct Audio
                  </button>
                </div>

                {/* Action buttons: Try Again vs Next Word */}
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  {analysis.needsRetry && (
                    <button
                      onClick={() => {
                        setAnalysis(null);
                        startListening();
                      }}
                      className="btn-secondary"
                      style={{ color: 'var(--color-warning-600)', borderColor: 'var(--color-warning-500)' }}
                    >
                      <RotateCcw size={16} />
                      Try Again
                    </button>
                  )}
                  <button
                    onClick={handleNextWord}
                    className="btn-primary"
                    style={{ padding: '0.5rem 1.25rem' }}
                  >
                    Next Word
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* BOTTOM CONTROLS: PREVIOUS, RANDOM, NEXT */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1.5rem' }}>
            <button
              onClick={handlePrevWord}
              className="btn-secondary"
              style={{ fontSize: '0.875rem' }}
            >
              <ArrowLeft size={16} />
              Previous
            </button>

            <button
              onClick={handleRandomWord}
              className="btn-secondary"
              style={{ fontSize: '0.875rem', gap: '0.5rem' }}
            >
              <Shuffle size={16} />
              Random Word
            </button>

            <button
              onClick={handleNextWord}
              className="btn-primary"
              style={{ fontSize: '0.875rem' }}
            >
              Next
              <ArrowRight size={16} />
            </button>
          </div>
        </>
      )}

      {/* TAB: MASTERED WORDS */}
      {activeTab === 'mastered' && (
        <div className="glass-card animate-fade-in" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 1rem' }}>
            Mastered Words (Score 85+) ⭐
          </h2>

          {stats.masteredWords.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)' }}>
              <BookOpen size={40} style={{ opacity: 0.5, margin: '0 auto 1rem' }} />
              <p>No words mastered yet. Practice words and score 85+ to master them!</p>
              <button onClick={() => setActiveTab('practice')} className="btn-primary" style={{ marginTop: '1rem' }}>
                Start Practicing
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
              {stats.masteredWords.map((item) => (
                <div
                  key={item.id}
                  style={{
                    padding: '1rem',
                    borderRadius: '10px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-surface-elevated)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {item.word}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-success-600)', fontWeight: 600 }}>
                      Score: {item.score}%
                    </div>
                  </div>
                  <button
                    onClick={() => handleSelectWord(item.wordId)}
                    className="btn-secondary"
                    style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
                  >
                    Practice Again
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: NEEDS PRACTICE */}
      {activeTab === 'review' && (
        <div className="glass-card animate-fade-in" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 1rem' }}>
            Needs Practice (Score below 70) 🔄
          </h2>

          {stats.needsPracticeWords.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)' }}>
              <CheckCircle2 size={40} color="var(--color-success-500)" style={{ margin: '0 auto 1rem' }} />
              <p>Great job! You have no words flagged for practice right now.</p>
              <button onClick={() => setActiveTab('practice')} className="btn-primary" style={{ marginTop: '1rem' }}>
                Practice New Words
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
              {stats.needsPracticeWords.map((item) => (
                <div
                  key={item.id}
                  style={{
                    padding: '1rem',
                    borderRadius: '10px',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    backgroundColor: 'rgba(239, 68, 68, 0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {item.word}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-error-600)', fontWeight: 600 }}>
                      Score: {item.score}% (Sound: /{item.soundFocus}/)
                    </div>
                  </div>
                  <button
                    onClick={() => handleSelectWord(item.wordId)}
                    className="btn-primary"
                    style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
                  >
                    Retry Now
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
