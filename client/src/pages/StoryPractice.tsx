import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { STORIES_DATABASE, StoryItem } from '../data/stories';
import {
  analyzeStoryParagraph,
  computeFinalStoryReport,
  ParagraphResult,
  FinalStoryReport,
  StoryWordFeedback,
} from '../services/storyAnalysis';
import {
  saveStoryReport,
  saveActiveProgress,
  getActiveProgress,
  clearActiveProgress,
  getPreviousStoryScore,
  getStoryStats,
  StoryStats,
} from '../services/storyStorage';
import { IDEAL_WPM_RANGE } from '../config/scoringConfig';
import ScoreRing from '../components/ScoreRing';
import {
  BookOpen,
  Volume2,
  Mic,
  MicOff,
  RotateCcw,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Play,
  Flame,
  Award,
  ListFilter,
  Check,
  ChevronRight,
  Clock,
  Share2,
  HelpCircle,
  BarChart2,
  Trophy,
  RefreshCw,
} from 'lucide-react';

const GENRES: Array<StoryItem['genre']> = [
  'Moral story',
  'Daily life',
  'Travel',
  'Business',
  'Motivation',
  'Mystery',
];

const LEVELS: Array<StoryItem['level']> = ['Beginner', 'Intermediate', 'Advanced'];

export default function StoryPractice() {
  // Navigation / View state
  const [view, setView] = useState<'library' | 'reading' | 'finalReport'>('library');

  // Filters
  const [selectedGenre, setSelectedGenre] = useState<string>('All');
  const [selectedLevel, setSelectedLevel] = useState<string>('All');

  // Active Story & Flow state
  const [currentStory, setCurrentStory] = useState<StoryItem | null>(null);
  const [currentParagraphIdx, setCurrentParagraphIdx] = useState(0);
  const [paragraphResults, setParagraphResults] = useState<ParagraphResult[]>([]);
  const [activeReportModal, setActiveReportModal] = useState<ParagraphResult | null>(null);
  const [finalReport, setFinalReport] = useState<FinalStoryReport | null>(null);

  // Resume notification
  const [resumePrompt, setResumePrompt] = useState<{
    storyId: string;
    storyTitle: string;
    paragraphIndex: number;
    results: ParagraphResult[];
  } | null>(null);

  // User stats
  const [stats, setStats] = useState<StoryStats>(getStoryStats());

  // Speech recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordedTranscript, setRecordedTranscript] = useState('');
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Audio Playback / TTS
  const [isPlayingTTS, setIsPlayingTTS] = useState(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [activeSentenceIndex, setActiveSentenceIndex] = useState<number>(-1);

  // AI Story Generator Modal
  const [isGeneratingStory, setIsGeneratingStory] = useState(false);
  const [customStories, setCustomStories] = useState<StoryItem[]>([]);

  // Refs for speech recognition & timer
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<any>(null);
  const startTimeRef = useRef<number>(0);
  const transcriptBufferRef = useRef<string>('');

  // Check for saved progress on initial load
  useEffect(() => {
    const saved = getActiveProgress();
    if (saved && saved.currentParagraphIndex > 0) {
      setResumePrompt({
        storyId: saved.storyId,
        storyTitle: saved.storyTitle,
        paragraphIndex: saved.currentParagraphIndex,
        results: saved.paragraphResults,
      });
    }
  }, []);

  // Filtered stories library
  const allStories = useMemo(() => {
    return [...customStories, ...STORIES_DATABASE];
  }, [customStories]);

  const filteredStories = useMemo(() => {
    return allStories.filter((s) => {
      const matchGenre = selectedGenre === 'All' || s.genre === selectedGenre;
      const matchLevel = selectedLevel === 'All' || s.level === selectedLevel;
      return matchGenre && matchLevel;
    });
  }, [allStories, selectedGenre, selectedLevel]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Resume unfinished story
  const handleResumeStory = (storyId: string) => {
    const target = allStories.find((s) => s.id === storyId);
    if (!target || !resumePrompt) return;

    setCurrentStory(target);
    setCurrentParagraphIdx(resumePrompt.paragraphIndex);
    setParagraphResults(resumePrompt.results);
    setView('reading');
    setResumePrompt(null);
  };

  const handleDismissResume = () => {
    clearActiveProgress();
    setResumePrompt(null);
  };

  // Start reading a story
  const handleSelectStory = (story: StoryItem) => {
    setCurrentStory(story);
    setCurrentParagraphIdx(0);
    setParagraphResults([]);
    setActiveReportModal(null);
    setFinalReport(null);
    setErrorMessage(null);
    setRecordedTranscript('');
    setView('reading');

    // Save initial progress
    saveActiveProgress({
      storyId: story.id,
      storyTitle: story.title,
      level: story.level,
      genre: story.genre,
      currentParagraphIndex: 0,
      paragraphResults: [],
      savedAt: new Date().toISOString(),
    });
  };

  // Speech TTS Player
  const handlePlayTTS = (text: string, rate: number = 1.0) => {
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported in this browser.');
      return;
    }

    window.speechSynthesis.cancel();

    if (isPlayingTTS) {
      setIsPlayingTTS(false);
      setActiveSentenceIndex(-1);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rate;
    utterance.pitch = 1.0;
    utterance.lang = 'en-US';

    // Break into sentences to track highlighting
    const sentences = text.match(/[^.!?]+[.!?]+(\s|$)/g) || [text];

    utterance.onstart = () => {
      setIsPlayingTTS(true);
      setActiveSentenceIndex(0);
    };

    utterance.onboundary = (e: SpeechSynthesisEvent) => {
      if (e.name === 'sentence' || e.charIndex !== undefined) {
        let charAcc = 0;
        for (let i = 0; i < sentences.length; i++) {
          charAcc += sentences[i].length;
          if (e.charIndex < charAcc) {
            setActiveSentenceIndex(i);
            break;
          }
        }
      }
    };

    utterance.onend = () => {
      setIsPlayingTTS(false);
      setActiveSentenceIndex(-1);
    };

    utterance.onerror = () => {
      setIsPlayingTTS(false);
      setActiveSentenceIndex(-1);
    };

    window.speechSynthesis.speak(utterance);
  };

  // Single word TTS preview
  const handlePlayWord = (word: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(word);
    utt.rate = 0.85;
    utt.lang = 'en-US';
    window.speechSynthesis.speak(utt);
  };

  // Speech Recognition logic
  const startRecording = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setErrorMessage(
        'Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.'
      );
      return;
    }

    // Cancel TTS if running
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsPlayingTTS(false);
    }

    setErrorMessage(null);
    setRecordedTranscript('');
    transcriptBufferRef.current = '';
    setRecordingSeconds(0);
    startTimeRef.current = Date.now();

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        let finalStr = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const res = event.results[i];
          if (res.isFinal) {
            finalStr += res[0].transcript + ' ';
          } else {
            interim += res[0].transcript;
          }
        }

        if (finalStr) {
          transcriptBufferRef.current += finalStr;
        }
        setRecordedTranscript(transcriptBufferRef.current + interim);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setErrorMessage('Microphone access was denied. Please allow microphone permissions.');
        } else if (event.error === 'network') {
          setErrorMessage('Network connection lost. Please verify your internet connection.');
        } else if (event.error !== 'no-speech') {
          setErrorMessage(`Speech recognition error: ${event.error}`);
        }
        stopRecording(false);
      };

      recognition.onend = () => {
        // Automatically handled
      };

      recognitionRef.current = recognition;
      recognition.start();

      // Start duration counter
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Failed to initialize speech recognition:', err);
      setErrorMessage(err.message || 'Could not start microphone.');
      setIsRecording(false);
    }
  }, []);

  const stopRecording = useCallback(
    (performAnalysis = true) => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
      setIsRecording(false);

      if (!performAnalysis) return;

      const fullTranscript = transcriptBufferRef.current.trim() || recordedTranscript.trim();
      const duration = Math.max(1, (Date.now() - startTimeRef.current) / 1000);

      if (!fullTranscript) {
        setErrorMessage('No speech detected, please try again.');
        return;
      }

      if (!currentStory) return;

      setIsAnalyzing(true);
      setErrorMessage(null);

      // Perform speech analysis using the scoring engine
      setTimeout(() => {
        const expectedParagraph = currentStory.paragraphs[currentParagraphIdx];
        const result = analyzeStoryParagraph(expectedParagraph, fullTranscript, duration);
        result.paragraphIndex = currentParagraphIdx + 1;

        // Store result for this paragraph (replace if retried)
        setParagraphResults((prev) => {
          const updated = [...prev];
          updated[currentParagraphIdx] = result;
          return updated;
        });

        // Save active progress
        const currentUpdatedResults = [...paragraphResults];
        currentUpdatedResults[currentParagraphIdx] = result;

        saveActiveProgress({
          storyId: currentStory.id,
          storyTitle: currentStory.title,
          level: currentStory.level,
          genre: currentStory.genre,
          currentParagraphIndex: currentParagraphIdx,
          paragraphResults: currentUpdatedResults,
          savedAt: new Date().toISOString(),
        });

        setIsAnalyzing(false);
        setActiveReportModal(result);
      }, 400);
    },
    [currentStory, currentParagraphIdx, paragraphResults, recordedTranscript]
  );

  // Next Paragraph button handler
  const handleProceedNextParagraph = () => {
    if (!currentStory) return;

    setActiveReportModal(null);
    setRecordedTranscript('');
    setRecordingSeconds(0);
    setErrorMessage(null);

    const nextIdx = currentParagraphIdx + 1;

    if (nextIdx < currentStory.paragraphs.length) {
      // Advance to next paragraph
      setCurrentParagraphIdx(nextIdx);
      saveActiveProgress({
        storyId: currentStory.id,
        storyTitle: currentStory.title,
        level: currentStory.level,
        genre: currentStory.genre,
        currentParagraphIndex: nextIdx,
        paragraphResults: paragraphResults,
        savedAt: new Date().toISOString(),
      });
    } else {
      // Completed all paragraphs -> Generate Final Story Report!
      const prevScore = getPreviousStoryScore(currentStory.id);
      const finalRep = computeFinalStoryReport(
        currentStory.id,
        currentStory.title,
        currentStory.level,
        currentStory.genre,
        paragraphResults,
        prevScore
      );

      setFinalReport(finalRep);
      saveStoryReport(finalRep);
      setStats(getStoryStats());
      setView('finalReport');
    }
  };

  // Try Again on paragraph
  const handleTryAgain = () => {
    setActiveReportModal(null);
    setRecordedTranscript('');
    setRecordingSeconds(0);
    setErrorMessage(null);
  };

  // Offline AI Story Generator based on selected level & genre
  const handleGenerateAIStory = () => {
    setIsGeneratingStory(true);
    setTimeout(() => {
      const genre = selectedGenre === 'All' ? 'Motivation' : (selectedGenre as StoryItem['genre']);
      const level = selectedLevel === 'All' ? 'Intermediate' : (selectedLevel as StoryItem['level']);

      const generatedId = `ai-story-${Date.now()}`;
      const newStory: StoryItem = {
        id: generatedId,
        title: `The Spark of ${genre} (${level})`,
        genre,
        level,
        description: `An AI generated short reading passage focusing on natural rhythm and vocabulary in ${genre.toLowerCase()}.`,
        paragraphs: [
          'Early morning sunlight filtered through the tall pine trees as Clara stepped outside. She took a deep breath of crisp mountain air and prepared herself for the challenging journey ahead.',
          'The rocky trail was steeper than she had anticipated, requiring full concentration with every single step. Small pebbles rolled away under her boots, testing her balance and resolve.',
          'Halfway up the ridge, she paused near a crystal mountain brook to catch her breath. Looking back down at the peaceful valley below, she realized how far determination had brought her.',
          'Standing proudly at the summit under the bright blue sky, Clara smiled with immense joy. Every difficult obstacle on the path had transformed into quiet inner confidence.',
        ],
      };

      setCustomStories((prev) => [newStory, ...prev]);
      setIsGeneratingStory(false);
      handleSelectStory(newStory);
    }, 700);
  };

  // Share result to clipboard
  const handleShareResult = () => {
    if (!finalReport) return;
    const text = `📖 I just completed "${finalReport.storyTitle}" on English Speaking Practice!\nOverall Communication Score: ${finalReport.overallScore}/100 (${finalReport.communicationLevel})\nAverage WPM: ${finalReport.fluencySummary.averageWpm}\nCheck out your English pronunciation!`;
    navigator.clipboard.writeText(text);
    alert('Story report copied to clipboard!');
  };

  // Render current paragraph sentences for reading view
  const currentParagraphText = currentStory?.paragraphs[currentParagraphIdx] || '';
  const paragraphSentences = useMemo(() => {
    if (!currentParagraphText) return [];
    return currentParagraphText.match(/[^.!?]+[.!?]+(\s|$)/g) || [currentParagraphText];
  }, [currentParagraphText]);

  // ============================================================
  // RENDER: VIEW 1 - STORY LIBRARY / SELECTOR
  // ============================================================
  if (view === 'library') {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header Title & Stats */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary-500/10 text-primary-500">
                <BookOpen className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
                  Story Reading Practice
                </h1>
                <p className="text-muted-foreground text-sm mt-0.5">
                  Read immersive short stories paragraph-by-paragraph and master English fluency
                </p>
              </div>
            </div>
          </div>

          {/* Quick stats pills */}
          <div className="flex items-center gap-3">
            <div className="glass-card px-4 py-2 flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-500" />
              <div>
                <div className="text-xs text-muted-foreground font-medium">Streak</div>
                <div className="text-sm font-bold text-foreground">{stats.streakDays} Days</div>
              </div>
            </div>

            <div className="glass-card px-4 py-2 flex items-center gap-2">
              <Award className="w-5 h-5 text-primary-500" />
              <div>
                <div className="text-xs text-muted-foreground font-medium">Stories Read</div>
                <div className="text-sm font-bold text-foreground">{stats.totalStoriesRead}</div>
              </div>
            </div>

            <button
              onClick={handleGenerateAIStory}
              disabled={isGeneratingStory}
              className="btn btn-primary flex items-center gap-2 py-2.5 px-4 shadow-md shadow-primary-500/20"
            >
              <Sparkles className={`w-4 h-4 ${isGeneratingStory ? 'animate-spin' : ''}`} />
              <span className="font-semibold text-sm">
                {isGeneratingStory ? 'Generating...' : 'AI Story'}
              </span>
            </button>
          </div>
        </div>

        {/* Resume Banner if there is unfinished progress */}
        {resumePrompt && (
          <div className="glass-card p-4 mb-6 border-l-4 border-primary-500 bg-primary-500/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Clock className="w-6 h-6 text-primary-500 flex-shrink-0" />
              <div>
                <div className="text-sm font-bold text-foreground">
                  Resume Story in Progress: "{resumePrompt.storyTitle}"
                </div>
                <div className="text-xs text-muted-foreground">
                  You left off at Paragraph {resumePrompt.paragraphIndex + 1}. Continue where you
                  stopped!
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleResumeStory(resumePrompt.storyId)}
                className="btn btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
              >
                <span>Resume</span>
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={handleDismissResume}
                className="btn btn-outline text-xs py-1.5 px-3 text-muted-foreground hover:text-foreground"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Filters bar */}
        <div className="glass-card p-4 mb-8 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          {/* Genre tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-2 md:pb-0">
            <span className="text-xs font-semibold text-muted-foreground mr-1 flex items-center gap-1">
              <ListFilter className="w-3.5 h-3.5" /> Genre:
            </span>
            {['All', ...GENRES].map((genre) => (
              <button
                key={genre}
                onClick={() => setSelectedGenre(genre)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  selectedGenre === genre
                    ? 'bg-primary-500 text-white shadow-sm'
                    : 'bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground'
                }`}
              >
                {genre}
              </button>
            ))}
          </div>

          {/* Level filter */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="text-xs font-semibold text-muted-foreground mr-1">Level:</span>
            {['All', ...LEVELS].map((level) => (
              <button
                key={level}
                onClick={() => setSelectedLevel(level)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedLevel === level
                    ? 'bg-primary-500 text-white shadow-sm'
                    : 'bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        {/* Story Grid Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStories.map((story) => {
            const prevScore = getPreviousStoryScore(story.id);
            const totalWords = story.paragraphs.reduce(
              (acc, p) => acc + p.split(/\s+/).filter(Boolean).length,
              0
            );

            return (
              <div
                key={story.id}
                className="glass-card p-5 flex flex-col justify-between hover:border-primary-500/50 hover:shadow-lg transition-all group cursor-pointer"
                onClick={() => handleSelectStory(story)}
              >
                <div>
                  {/* Badges */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-primary-500/10 text-primary-500">
                      {story.genre}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        story.level === 'Beginner'
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : story.level === 'Intermediate'
                          ? 'bg-amber-500/10 text-amber-500'
                          : 'bg-rose-500/10 text-rose-500'
                      }`}
                    >
                      {story.level}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-bold text-foreground mb-1 group-hover:text-primary-500 transition-colors">
                    {story.title}
                  </h3>

                  {/* Description */}
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-4 leading-relaxed">
                    {story.description}
                  </p>
                </div>

                {/* Footer metadata */}
                <div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border/40 mb-3">
                    <span>{story.paragraphs.length} Paragraphs</span>
                    <span>~{totalWords} words (2 min)</span>
                  </div>

                  <div className="flex items-center justify-between">
                    {prevScore !== null ? (
                      <span className="text-xs font-bold text-emerald-500 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Best: {prevScore}%
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Not started</span>
                    )}

                    <div className="flex items-center gap-1 text-xs font-semibold text-primary-500 group-hover:translate-x-1 transition-transform">
                      <span>Start Reading</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredStories.length === 0 && (
          <div className="text-center py-16">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-40" />
            <h3 className="text-base font-semibold text-foreground">No stories found</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Try selecting a different genre or difficulty level.
            </p>
          </div>
        )}
      </div>
    );
  }

  // ============================================================
  // RENDER: VIEW 2 - ACTIVE PARAGRAPH READING SCREEN
  // ============================================================
  if (view === 'reading' && currentStory) {
    const totalParagraphs = currentStory.paragraphs.length;
    const progressPercent = Math.round(((currentParagraphIdx + 1) / totalParagraphs) * 100);

    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Navigation & Header */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setView('library')}
            className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Stories Library</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary-500/10 text-primary-500">
              {currentStory.genre}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-secondary text-foreground">
              {currentStory.level}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center text-xs font-bold text-muted-foreground mb-1.5">
            <span className="text-foreground text-sm font-semibold">{currentStory.title}</span>
            <span>
              Paragraph {currentParagraphIdx + 1} of {totalParagraphs} ({progressPercent}%)
            </span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-primary-500 h-2.5 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Main Paragraph Reading Card */}
        <div className="glass-card p-6 md:p-8 mb-6 relative overflow-hidden border border-border/80">
          {/* Audio Tooling: Listen First & Slow Speed */}
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-border/40">
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePlayTTS(currentParagraphText, playbackRate)}
                className={`btn btn-secondary text-xs py-1.5 px-3 flex items-center gap-2 ${
                  isPlayingTTS ? 'bg-primary-500 text-white' : ''
                }`}
              >
                <Volume2 className="w-4 h-4" />
                <span>{isPlayingTTS ? 'Stop Audio' : 'Listen First'}</span>
              </button>

              <button
                onClick={() => setPlaybackRate((prev) => (prev === 1.0 ? 0.8 : 1.0))}
                className="btn btn-outline text-xs py-1.5 px-2.5 text-muted-foreground hover:text-foreground"
                title="Toggle slow playback speed"
              >
                Speed: {playbackRate}x
              </button>
            </div>

            <div className="text-xs text-muted-foreground flex items-center gap-1.5">
              <span>Read aloud clearly into your microphone</span>
            </div>
          </div>

          {/* Large Readable Text (22px) with Karaoke sentence highlight */}
          <div className="text-xl md:text-2xl font-medium leading-relaxed tracking-normal text-foreground space-y-2 py-4">
            {paragraphSentences.map((sentence, idx) => {
              const isHighlighted = isPlayingTTS && activeSentenceIndex === idx;
              return (
                <span
                  key={idx}
                  className={`transition-all duration-200 inline ${
                    isHighlighted
                      ? 'bg-primary-500/20 text-primary-600 dark:text-primary-400 font-semibold rounded px-1'
                      : ''
                  }`}
                >
                  {sentence}{' '}
                </span>
              );
            })}
          </div>

          {/* Live transcript preview while recording */}
          {isRecording && (
            <div className="mt-6 p-4 rounded-xl bg-secondary/50 border border-primary-500/30 animate-pulse">
              <div className="flex items-center justify-between text-xs font-bold text-primary-500 mb-1">
                <span>Listening Live...</span>
                <span>{recordingSeconds}s</span>
              </div>
              <p className="text-sm text-foreground italic">
                {recordedTranscript || 'Speak the paragraph aloud now...'}
              </p>
            </div>
          )}

          {/* Error Message banner */}
          {errorMessage && (
            <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Recording Controls */}
        <div className="flex flex-col items-center justify-center gap-4 py-4">
          {!isRecording ? (
            <button
              onClick={startRecording}
              disabled={isAnalyzing}
              className="group relative flex items-center justify-center w-20 h-20 rounded-full bg-primary-500 text-white shadow-xl hover:bg-primary-600 hover:scale-105 active:scale-95 transition-all"
            >
              <div className="absolute inset-0 rounded-full bg-primary-500/30 animate-ping group-hover:block" />
              <Mic className="w-8 h-8 relative z-10" />
            </button>
          ) : (
            <button
              onClick={() => stopRecording(true)}
              className="flex items-center justify-center w-20 h-20 rounded-full bg-rose-500 text-white shadow-xl hover:bg-rose-600 hover:scale-105 active:scale-95 transition-all animate-pulse"
            >
              <MicOff className="w-8 h-8" />
            </button>
          )}

          <div className="text-center">
            <div className="text-sm font-bold text-foreground">
              {isAnalyzing
                ? 'Analyzing your pronunciation & fluency...'
                : isRecording
                ? `Recording... Tap button when finished (${recordingSeconds}s)`
                : 'Tap the mic to read this paragraph'}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              Ideal reading pace: {IDEAL_WPM_RANGE.min}-{IDEAL_WPM_RANGE.max} WPM
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* PARAGRAPH REPORT MODAL / DRAWER (Immediately after reading)  */}
        {/* ============================================================ */}
        {activeReportModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="glass-card max-w-2xl w-full p-6 md:p-8 bg-card shadow-2xl rounded-2xl border border-border/80 my-8">
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-border/50 mb-6">
                <div>
                  <h3 className="text-xl font-black text-foreground">
                    Paragraph {currentParagraphIdx + 1} Report
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Detailed pronunciation, accuracy, and fluency feedback
                  </p>
                </div>

                <div className="text-right">
                  <div className="text-2xl font-black text-primary-500">
                    {activeReportModal.scores.communication}%
                  </div>
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Communication
                  </div>
                </div>
              </div>

              {/* Score Warning Rule: < 60 prompt Try Again */}
              {activeReportModal.scores.communication < 60 && (
                <div className="p-3 mb-6 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>
                    Your score is below 60. We recommend reading this paragraph again to polish
                    your clarity.
                  </span>
                </div>
              )}

              {/* 5 Scoring Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mb-6 text-center">
                <div className="p-2.5 rounded-xl bg-secondary/50">
                  <div className="text-[10px] font-bold text-muted-foreground uppercase">
                    Pronunciation
                  </div>
                  <div className="text-base font-extrabold text-foreground mt-0.5">
                    {activeReportModal.scores.pronunciation}%
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-secondary/50">
                  <div className="text-[10px] font-bold text-muted-foreground uppercase">
                    Fluency
                  </div>
                  <div className="text-base font-extrabold text-foreground mt-0.5">
                    {activeReportModal.scores.fluency}%
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-secondary/50">
                  <div className="text-[10px] font-bold text-muted-foreground uppercase">
                    Accuracy
                  </div>
                  <div className="text-base font-extrabold text-foreground mt-0.5">
                    {activeReportModal.scores.accuracy}%
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-secondary/50">
                  <div className="text-[10px] font-bold text-muted-foreground uppercase">
                    Completeness
                  </div>
                  <div className="text-base font-extrabold text-foreground mt-0.5">
                    {activeReportModal.scores.completeness}%
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-secondary/50 col-span-2 sm:col-span-1">
                  <div className="text-[10px] font-bold text-muted-foreground uppercase">
                    Intonation
                  </div>
                  <div className="text-base font-extrabold text-foreground mt-0.5">
                    {activeReportModal.scores.intonation}%
                  </div>
                </div>
              </div>

              {/* Word-by-word Highlight Analysis */}
              <div className="mb-6">
                <div className="flex items-center justify-between text-xs font-bold text-muted-foreground mb-2">
                  <span>Word Accuracy Breakdown (tap to listen):</span>
                  <div className="flex items-center gap-3 text-[11px]">
                    <span className="flex items-center gap-1 text-emerald-500">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Correct
                    </span>
                    <span className="flex items-center gap-1 text-amber-500">
                      <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> Unclear
                    </span>
                    <span className="flex items-center gap-1 text-rose-500">
                      <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" /> Missed
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-secondary/40 border border-border/50 flex flex-wrap gap-1.5 leading-loose">
                  {activeReportModal.words.map((item, idx) => {
                    let colorClass =
                      'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10';
                    if (item.status === 'unclear') {
                      colorClass = 'text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 underline decoration-amber-400 decoration-wavy';
                    } else if (item.status === 'wrong' || item.status === 'missing') {
                      colorClass = 'text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 line-through';
                    }

                    return (
                      <button
                        key={idx}
                        onClick={() => handlePlayWord(item.word)}
                        className={`px-1.5 py-0.5 rounded text-sm font-semibold transition-colors cursor-pointer ${colorClass}`}
                        title={`${item.word} (${item.status}) - Tap to hear correct audio`}
                      >
                        {item.word}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Fluency Metrics Summary (WPM + Pauses + Fillers) */}
              <div className="grid grid-cols-3 gap-3 mb-6 p-3 rounded-xl bg-secondary/20 border border-border/40 text-center">
                <div>
                  <div className="text-[10px] font-bold text-muted-foreground uppercase">
                    Speed (WPM)
                  </div>
                  <div className="text-sm font-extrabold text-foreground mt-0.5">
                    {activeReportModal.wpm}{' '}
                    <span className="text-[10px] font-normal text-muted-foreground">
                      (Ideal: 110-150)
                    </span>
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-bold text-muted-foreground uppercase">
                    Pauses
                  </div>
                  <div className="text-sm font-extrabold text-foreground mt-0.5">
                    {activeReportModal.pauseCount}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-bold text-muted-foreground uppercase">
                    Filler Words
                  </div>
                  <div className="text-sm font-extrabold text-foreground mt-0.5">
                    {activeReportModal.fillerWordsCount}
                  </div>
                </div>
              </div>

              {/* Mispronounced Words with IPA */}
              {activeReportModal.mispronouncedWords.length > 0 && (
                <div className="mb-6">
                  <div className="text-xs font-bold text-foreground mb-2">
                    Words Needing Practice:
                  </div>
                  <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                    {activeReportModal.mispronouncedWords.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg bg-secondary/50 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handlePlayWord(item.word)}
                            className="p-1 rounded bg-primary-500/10 text-primary-500 hover:bg-primary-500/20"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                          <div>
                            <span className="font-bold text-foreground">{item.word}</span>
                            <span className="text-muted-foreground ml-2 font-mono">{item.ipa}</span>
                            <div className="text-[11px] text-muted-foreground mt-0.5">
                              {item.tip}
                            </div>
                          </div>
                        </div>
                        <span className="text-[11px] font-semibold text-rose-500">
                          {item.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 2 Improvement Tips */}
              <div className="mb-6 space-y-1.5">
                <div className="text-xs font-bold text-foreground">Personalized Tips:</div>
                {activeReportModal.tips.map((tip, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded-lg bg-primary-500/5 border border-primary-500/10 text-xs text-foreground flex items-center gap-2"
                  >
                    <Check className="w-3.5 h-3.5 text-primary-500 flex-shrink-0" />
                    <span>{tip}</span>
                  </div>
                ))}
              </div>

              {/* Buttons: Try Again, Listen First, Next Paragraph */}
              <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-border/50">
                <button
                  onClick={handleTryAgain}
                  className="btn btn-outline text-xs py-2 px-4 w-full sm:w-auto flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Try Again</span>
                </button>

                <button
                  onClick={() => handlePlayTTS(currentParagraphText, playbackRate)}
                  className="btn btn-secondary text-xs py-2 px-4 w-full sm:w-auto flex items-center justify-center gap-1.5"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Listen First</span>
                </button>

                <button
                  onClick={handleProceedNextParagraph}
                  className="btn btn-primary text-xs py-2 px-5 w-full sm:w-auto flex items-center justify-center gap-1.5 font-bold shadow-md shadow-primary-500/20"
                >
                  <span>
                    {currentParagraphIdx + 1 < currentStory.paragraphs.length
                      ? 'Next Paragraph'
                      : 'View Final Report'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ============================================================
  // RENDER: VIEW 3 - FINAL STORY REPORT
  // ============================================================
  if (view === 'finalReport' && finalReport) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Top Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => setView('library')}
            className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Stories</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShareResult}
              className="btn btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share Result</span>
            </button>
          </div>
        </div>

        {/* Big Overall Speaking Score Card */}
        <div className="glass-card p-8 mb-8 text-center flex flex-col items-center justify-center border border-border/80 relative overflow-hidden">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <h2 className="text-2xl font-black text-foreground">{finalReport.storyTitle}</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-6">
            Completed all {finalReport.paragraphScores.length} paragraphs • Level: {finalReport.level} • Genre: {finalReport.genre}
          </p>

          <div className="my-2">
            <ScoreRing
              score={finalReport.overallScore}
              size={170}
              strokeWidth={12}
              label={finalReport.communicationLevel}
            />
          </div>

          {/* Previous Attempt Delta Comparison */}
          <div className="mt-4 px-4 py-2 rounded-full bg-secondary/80 border border-border/50 text-xs font-semibold text-foreground">
            {finalReport.previousScoreComparison.message}
          </div>
        </div>

        {/* Average Scores Across All Paragraphs */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
          <div className="glass-card p-3 text-center">
            <div className="text-[10px] font-bold text-muted-foreground uppercase">
              Pronunciation
            </div>
            <div className="text-lg font-black text-foreground mt-1">
              {finalReport.averageScores.pronunciation}%
            </div>
          </div>

          <div className="glass-card p-3 text-center">
            <div className="text-[10px] font-bold text-muted-foreground uppercase">Fluency</div>
            <div className="text-lg font-black text-foreground mt-1">
              {finalReport.averageScores.fluency}%
            </div>
          </div>

          <div className="glass-card p-3 text-center">
            <div className="text-[10px] font-bold text-muted-foreground uppercase">Accuracy</div>
            <div className="text-lg font-black text-foreground mt-1">
              {finalReport.averageScores.accuracy}%
            </div>
          </div>

          <div className="glass-card p-3 text-center">
            <div className="text-[10px] font-bold text-muted-foreground uppercase">
              Completeness
            </div>
            <div className="text-lg font-black text-foreground mt-1">
              {finalReport.averageScores.completeness}%
            </div>
          </div>

          <div className="glass-card p-3 text-center col-span-2 sm:col-span-1">
            <div className="text-[10px] font-bold text-muted-foreground uppercase">Intonation</div>
            <div className="text-lg font-black text-foreground mt-1">
              {finalReport.averageScores.intonation}%
            </div>
          </div>
        </div>

        {/* Paragraph-by-Paragraph Bar Chart (Best vs Weakest) */}
        <div className="glass-card p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-primary-500" />
              <h3 className="text-base font-bold text-foreground">Paragraph Performance Chart</h3>
            </div>
            <div className="text-xs text-muted-foreground">Score comparison by paragraph</div>
          </div>

          <div className="space-y-3">
            {finalReport.paragraphScores.map((p) => {
              let barColor = 'bg-primary-500';
              if (p.isBest) barColor = 'bg-emerald-500';
              if (p.isWeakest) barColor = 'bg-amber-500';

              return (
                <div key={p.index} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground flex items-center gap-2">
                      Paragraph {p.index}
                      {p.isBest && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-500">
                          Best ⭐
                        </span>
                      )}
                      {p.isWeakest && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-500">
                          Needs Practice
                        </span>
                      )}
                    </span>
                    <span className="font-bold text-foreground">
                      {p.score}%{' '}
                      <span className="text-[11px] font-normal text-muted-foreground">
                        ({p.wpm} WPM)
                      </span>
                    </span>
                  </div>

                  <div className="w-full bg-secondary rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-3 rounded-full transition-all duration-700 ${barColor}`}
                      style={{ width: `${p.score}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Grid: Fluency Summary & Weakest Sounds */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Fluency & Pauses Summary */}
          <div className="glass-card p-6">
            <h4 className="text-sm font-bold text-foreground mb-4">Fluency & Rhythm Summary</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/40 text-xs">
                <span className="text-muted-foreground">Average Speaking Pace</span>
                <span className="font-bold text-foreground">
                  {finalReport.fluencySummary.averageWpm} WPM
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/40 text-xs">
                <span className="text-muted-foreground">Total Hesitation Pauses</span>
                <span className="font-bold text-foreground">
                  {finalReport.fluencySummary.totalPauses}
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/40 text-xs">
                <span className="text-muted-foreground">Total Filler Words ("um", "uh")</span>
                <span className="font-bold text-foreground">
                  {finalReport.fluencySummary.totalFillerWords}
                </span>
              </div>
            </div>
          </div>

          {/* Weakest Sounds */}
          <div className="glass-card p-6">
            <h4 className="text-sm font-bold text-foreground mb-4">Target Phonetic Sounds</h4>
            <div className="space-y-3">
              {finalReport.weakestSounds.map((item, idx) => (
                <div key={idx} className="p-2.5 rounded-lg bg-secondary/40 text-xs">
                  <div className="flex items-center justify-between font-bold text-foreground mb-1">
                    <span>Sound: "{item.sound}"</span>
                    <span className="text-muted-foreground">{item.count} issues</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground">{item.advice}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top 5 Mispronounced Words in Whole Story */}
        {finalReport.topMispronouncedWords.length > 0 && (
          <div className="glass-card p-6 mb-8">
            <h4 className="text-sm font-bold text-foreground mb-4">
              Top Mispronounced Words (tap to hear pronunciation)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {finalReport.topMispronouncedWords.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-secondary/40 border border-border/40 flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-sm text-foreground">{item.word}</div>
                    <div className="text-xs text-muted-foreground font-mono">{item.ipa}</div>
                  </div>
                  <button
                    onClick={() => handlePlayWord(item.word)}
                    className="p-2 rounded-lg bg-primary-500/10 text-primary-500 hover:bg-primary-500/20"
                    title="Tap to hear correct audio"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions: Read Again, Next Story, Share */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 py-4">
          <button
            onClick={() => {
              if (currentStory) handleSelectStory(currentStory);
            }}
            className="btn btn-outline py-2.5 px-6 w-full sm:w-auto flex items-center justify-center gap-2 font-semibold"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Read Again</span>
          </button>

          <button
            onClick={() => setView('library')}
            className="btn btn-primary py-2.5 px-8 w-full sm:w-auto flex items-center justify-center gap-2 font-bold shadow-lg shadow-primary-500/25"
          >
            <span>Next Story</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return null;
}
