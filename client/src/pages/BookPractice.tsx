import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { BOOKS_DATABASE, BookItem, BookChapter, ChapterVocabulary } from '../data/books';
import {
  chunkIntoSpeakingParagraphs,
  readTextFromFile,
  SplitResult,
} from '../services/textSplitting';
import {
  analyzeBookParagraph,
  computeBookSessionReport,
  BookParagraphResult,
  BookSessionReport,
} from '../services/bookAnalysis';
import {
  saveActiveBookProgress,
  getActiveBookProgress,
  clearActiveBookProgress,
  saveUserCopyParagraphs,
  getUserCopyParagraphs,
  saveBookSessionReport,
  getPreviousChapterScore,
  getBookStats,
  BookStats,
} from '../services/bookStorage';
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
  FileText,
  Upload,
  BookMarked,
  BarChart2,
  Trophy,
  Layers,
  HelpCircle,
  Search,
  X,
} from 'lucide-react';

export default function BookPractice() {
  // Navigation / View state
  const [view, setView] = useState<'library' | 'chapterSelect' | 'reading' | 'finalReport'>(
    'library'
  );

  // Active book & chapter
  const [selectedBook, setSelectedBook] = useState<BookItem | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<BookChapter | null>(null);
  const [activeMode, setActiveMode] = useState<'my-copy' | 'key-ideas'>('key-ideas');

  // Mode A: "My Copy" user input state
  const [userPastedText, setUserPastedText] = useState('');
  const [splitResult, setSplitResult] = useState<SplitResult | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Active reading state
  const [activeParagraphs, setActiveParagraphs] = useState<string[]>([]);
  const [currentParagraphIdx, setCurrentParagraphIdx] = useState(0);
  const [paragraphResults, setParagraphResults] = useState<BookParagraphResult[]>([]);
  const [activeReportModal, setActiveReportModal] = useState<BookParagraphResult | null>(null);
  const [finalReport, setFinalReport] = useState<BookSessionReport | null>(null);

  // Stats & Resume prompt
  const [stats, setStats] = useState<BookStats>(getBookStats());
  const [resumePrompt, setResumePrompt] = useState<{
    bookId: string;
    bookTitle: string;
    chapterId: string;
    chapterTitle: string;
    mode: 'my-copy' | 'key-ideas';
    paragraphIndex: number;
    results: BookParagraphResult[];
    customParagraphs?: string[];
  } | null>(null);

  // Audio / Speech Recognition
  const [isRecording, setIsRecording] = useState(false);
  const [recordedTranscript, setRecordedTranscript] = useState('');
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Audio TTS
  const [isPlayingTTS, setIsPlayingTTS] = useState(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [activeSentenceIndex, setActiveSentenceIndex] = useState<number>(-1);

  // Single word drill for vocabulary
  const [activeDrillWord, setActiveDrillWord] = useState<ChapterVocabulary | null>(null);

  // Refs
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<any>(null);
  const startTimeRef = useRef<number>(0);
  const transcriptBufferRef = useRef<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('All');
  const [chapterSearchQuery, setChapterSearchQuery] = useState('');

  // Filtered books based on Search query & Category
  const filteredBooks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return BOOKS_DATABASE.filter((book) => {
      // Category match
      let matchesCat = true;
      if (activeCategoryFilter === 'People Smart') {
        matchesCat = book.id === 'book-people-smart';
      } else if (activeCategoryFilter === 'Communication') {
        matchesCat = book.theme.toLowerCase().includes('communication') || book.id === 'book-people-smart';
      } else if (activeCategoryFilter === 'Crucial') {
        matchesCat = book.id === 'book-crucial-conversations';
      } else if (activeCategoryFilter === 'Habits') {
        matchesCat = book.id === 'book-atomic-habits';
      }

      if (!matchesCat) return false;
      if (!q) return true;

      // Deep search across Title, Author, Theme, Description, Chapters, and Vocabulary
      const titleMatch = book.title.toLowerCase().includes(q);
      const authorMatch = book.author.toLowerCase().includes(q);
      const themeMatch = book.theme.toLowerCase().includes(q);
      const descMatch = book.description.toLowerCase().includes(q);
      const chapterMatch = book.chapters.some(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.vocabulary.some((v) => v.word.toLowerCase().includes(q))
      );

      return titleMatch || authorMatch || themeMatch || descMatch || chapterMatch;
    });
  }, [searchQuery, activeCategoryFilter]);

  // Filtered chapters for active book
  const filteredChapters = useMemo(() => {
    if (!selectedBook) return [];
    const q = chapterSearchQuery.trim().toLowerCase();
    if (!q) return selectedBook.chapters;
    return selectedBook.chapters.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.vocabulary.some((v) => v.word.toLowerCase().includes(q))
    );
  }, [selectedBook, chapterSearchQuery]);

  // Check for saved ongoing session on initial load
  useEffect(() => {
    const saved = getActiveBookProgress();
    if (saved && saved.currentParagraphIndex > 0) {
      setResumePrompt({
        bookId: saved.bookId,
        bookTitle: saved.bookTitle,
        chapterId: saved.chapterId,
        chapterTitle: saved.chapterTitle,
        mode: saved.mode,
        paragraphIndex: saved.currentParagraphIndex,
        results: saved.paragraphResults,
        customParagraphs: saved.customParagraphs,
      });
    }
  }, []);

  // Cleanup on unmount
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

  // Resume unfinished book session
  const handleResumeSession = () => {
    if (!resumePrompt) return;
    const book = BOOKS_DATABASE.find((b) => b.id === resumePrompt.bookId);
    if (!book) return;
    const chapter = book.chapters.find((c) => c.id === resumePrompt.chapterId);
    if (!chapter) return;

    setSelectedBook(book);
    setSelectedChapter(chapter);
    setActiveMode(resumePrompt.mode);

    let paragraphs = chapter.keyIdeaParagraphs;
    if (resumePrompt.mode === 'my-copy' && resumePrompt.customParagraphs?.length) {
      paragraphs = resumePrompt.customParagraphs;
    }

    setActiveParagraphs(paragraphs);
    setCurrentParagraphIdx(resumePrompt.paragraphIndex);
    setParagraphResults(resumePrompt.results);
    setView('reading');
    setResumePrompt(null);
  };

  const handleDismissResume = () => {
    clearActiveBookProgress();
    setResumePrompt(null);
  };

  // Open chapter select for a book
  const handleSelectBook = (book: BookItem) => {
    setSelectedBook(book);
    const defaultChapter = book.chapters[0] || null;
    setSelectedChapter(defaultChapter);
    setActiveMode('key-ideas');

    // Check if user previously saved a custom copy for this chapter
    if (defaultChapter) {
      const savedUserCopy = getUserCopyParagraphs(book.id, defaultChapter.id);
      if (savedUserCopy && savedUserCopy.length > 0) {
        setUserPastedText(savedUserCopy.join('\n\n'));
        setSplitResult({
          paragraphs: savedUserCopy,
          totalSentences: savedUserCopy.length * 3,
          totalWords: savedUserCopy.reduce((acc, p) => acc + p.split(/\s+/).length, 0),
          cleanedText: savedUserCopy.join(' '),
        });
      } else {
        setUserPastedText('');
        setSplitResult(null);
      }
    }

    setView('chapterSelect');
  };

  // Switch active chapter in chapter selector
  const handleSwitchChapter = (chapter: BookChapter) => {
    if (!selectedBook) return;
    setSelectedChapter(chapter);
    const savedUserCopy = getUserCopyParagraphs(selectedBook.id, chapter.id);
    if (savedUserCopy && savedUserCopy.length > 0) {
      setUserPastedText(savedUserCopy.join('\n\n'));
      setSplitResult({
        paragraphs: savedUserCopy,
        totalSentences: savedUserCopy.length * 3,
        totalWords: savedUserCopy.reduce((acc, p) => acc + p.split(/\s+/).length, 0),
        cleanedText: savedUserCopy.join(' '),
      });
    } else {
      setUserPastedText('');
      setSplitResult(null);
    }
  };

  // Mode A: File upload handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    try {
      const text = await readTextFromFile(file);
      if (!text.trim()) {
        setUploadError('The selected file appears to be empty.');
        return;
      }
      setUserPastedText(text);
      const split = chunkIntoSpeakingParagraphs(text);
      if (split.paragraphs.length === 0) {
        setUploadError('Could not find enough sentences to create speaking paragraphs.');
        return;
      }
      setSplitResult(split);
    } catch (err: any) {
      setUploadError(err.message || 'Failed to parse file.');
    }
  };

  // Mode A: Text change handler
  const handlePastedTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setUserPastedText(text);
    setUploadError(null);
    if (text.trim().length > 60) {
      const split = chunkIntoSpeakingParagraphs(text);
      setSplitResult(split);
    } else {
      setSplitResult(null);
    }
  };

  // Start Reading Session
  const handleStartSession = () => {
    if (!selectedBook || !selectedChapter) return;

    let paragraphsToRead: string[] = [];

    if (activeMode === 'key-ideas') {
      paragraphsToRead = selectedChapter.keyIdeaParagraphs;
    } else {
      // Mode A - "My Copy"
      if (!splitResult || splitResult.paragraphs.length === 0) {
        setUploadError('Please paste your book excerpt or upload a document to begin.');
        return;
      }
      paragraphsToRead = splitResult.paragraphs.slice(0, 6); // standard 5-6 paragraphs session
      // Save user copy to device storage
      saveUserCopyParagraphs(selectedBook.id, selectedChapter.id, paragraphsToRead);
    }

    setActiveParagraphs(paragraphsToRead);
    setCurrentParagraphIdx(0);
    setParagraphResults([]);
    setActiveReportModal(null);
    setFinalReport(null);
    setRecordedTranscript('');
    setErrorMessage(null);
    setView('reading');

    // Save initial progress
    saveActiveBookProgress({
      bookId: selectedBook.id,
      bookTitle: selectedBook.title,
      chapterId: selectedChapter.id,
      chapterTitle: selectedChapter.title,
      mode: activeMode,
      currentParagraphIndex: 0,
      totalParagraphs: paragraphsToRead.length,
      paragraphResults: [],
      customParagraphs: activeMode === 'my-copy' ? paragraphsToRead : undefined,
      savedAt: new Date().toISOString(),
    });
  };

  // Audio Playback / TTS
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

  // Play single word pronunciation
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
          setErrorMessage('Network connection lost. Please check your internet connection.');
        } else if (event.error !== 'no-speech') {
          setErrorMessage(`Speech recognition error: ${event.error}`);
        }
        stopRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();

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
        setErrorMessage('No speech detected, try again.');
        return;
      }

      const expectedParagraph = activeParagraphs[currentParagraphIdx];
      if (!expectedParagraph || !selectedBook || !selectedChapter) return;

      setIsAnalyzing(true);
      setErrorMessage(null);

      setTimeout(() => {
        const result = analyzeBookParagraph(expectedParagraph, fullTranscript, duration);
        result.paragraphIndex = currentParagraphIdx + 1;

        setParagraphResults((prev) => {
          const updated = [...prev];
          updated[currentParagraphIdx] = result;
          return updated;
        });

        const currentUpdatedResults = [...paragraphResults];
        currentUpdatedResults[currentParagraphIdx] = result;

        saveActiveBookProgress({
          bookId: selectedBook.id,
          bookTitle: selectedBook.title,
          chapterId: selectedChapter.id,
          chapterTitle: selectedChapter.title,
          mode: activeMode,
          currentParagraphIndex: currentParagraphIdx,
          totalParagraphs: activeParagraphs.length,
          paragraphResults: currentUpdatedResults,
          customParagraphs: activeMode === 'my-copy' ? activeParagraphs : undefined,
          savedAt: new Date().toISOString(),
        });

        setIsAnalyzing(false);
        setActiveReportModal(result);
      }, 400);
    },
    [activeParagraphs, currentParagraphIdx, selectedBook, selectedChapter, activeMode, paragraphResults, recordedTranscript]
  );

  // Next Paragraph button handler
  const handleProceedNextParagraph = () => {
    if (!selectedBook || !selectedChapter) return;

    setActiveReportModal(null);
    setRecordedTranscript('');
    setRecordingSeconds(0);
    setErrorMessage(null);

    const nextIdx = currentParagraphIdx + 1;

    if (nextIdx < activeParagraphs.length) {
      setCurrentParagraphIdx(nextIdx);
      saveActiveBookProgress({
        bookId: selectedBook.id,
        bookTitle: selectedBook.title,
        chapterId: selectedChapter.id,
        chapterTitle: selectedChapter.title,
        mode: activeMode,
        currentParagraphIndex: nextIdx,
        totalParagraphs: activeParagraphs.length,
        paragraphResults: paragraphResults,
        customParagraphs: activeMode === 'my-copy' ? activeParagraphs : undefined,
        savedAt: new Date().toISOString(),
      });
    } else {
      // Completed all 5-6 paragraphs in this session!
      const prevScore = getPreviousChapterScore(selectedBook.id, selectedChapter.id);
      const report = computeBookSessionReport(
        selectedBook.id,
        selectedBook.title,
        selectedChapter.id,
        selectedChapter.title,
        activeMode,
        paragraphResults,
        prevScore,
        selectedChapter.vocabulary || []
      );

      setFinalReport(report);
      saveBookSessionReport(report);
      setStats(getBookStats());
      setView('finalReport');
    }
  };

  const handleTryAgain = () => {
    setActiveReportModal(null);
    setRecordedTranscript('');
    setRecordingSeconds(0);
    setErrorMessage(null);
  };

  // Next Chapter navigation from final report
  const handleNextChapter = () => {
    if (!selectedBook || !selectedChapter) return;
    const currentIdx = selectedBook.chapters.findIndex((c) => c.id === selectedChapter.id);
    const nextChapter = selectedBook.chapters[currentIdx + 1] || selectedBook.chapters[0];
    handleSwitchChapter(nextChapter);
    setView('chapterSelect');
  };

  // Share session report
  const handleShareResult = () => {
    if (!finalReport) return;
    const text = `📚 Book Speaking Practice: "${finalReport.bookTitle}" (${finalReport.chapterTitle})\nScore: ${finalReport.overallScore}/100 (${finalReport.communicationLevel})\nAvg Pace: ${finalReport.fluencySummary.averageWpm} WPM\nPractice books aloud to build master communication!`;
    navigator.clipboard.writeText(text);
    alert('Session report copied to clipboard!');
  };

  // Current paragraph breakdown for reading screen
  const currentParagraphText = activeParagraphs[currentParagraphIdx] || '';
  const paragraphSentences = useMemo(() => {
    if (!currentParagraphText) return [];
    return currentParagraphText.match(/[^.!?]+[.!?]+(\s|$)/g) || [currentParagraphText];
  }, [currentParagraphText]);

  // ============================================================
  // RENDER: VIEW 1 - BOOK LIBRARY
  // ============================================================
  if (view === 'library') {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header Title & Global Stats */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary-500/10 text-primary-500">
                <BookMarked className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
                  Book Reading Practice
                </h1>
                <p className="text-muted-foreground text-sm mt-0.5">
                  Read books aloud paragraph-by-paragraph to master speaking, vocabulary, and idea synthesis
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
                <div className="text-xs text-muted-foreground font-medium">Sessions</div>
                <div className="text-sm font-bold text-foreground">{stats.sessionsCompleted}</div>
              </div>
            </div>

            <div className="glass-card px-4 py-2 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-emerald-500" />
              <div>
                <div className="text-xs text-muted-foreground font-medium">Best Score</div>
                <div className="text-sm font-bold text-foreground">
                  {stats.bestScore ? `${stats.bestScore}%` : 'N/A'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Resume Banner */}
        {resumePrompt && (
          <div className="glass-card p-4 mb-6 border-l-4 border-primary-500 bg-primary-500/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Clock className="w-6 h-6 text-primary-500 flex-shrink-0" />
              <div>
                <div className="text-sm font-bold text-foreground">
                  Resume Book Session: "{resumePrompt.bookTitle}" - {resumePrompt.chapterTitle}
                </div>
                <div className="text-xs text-muted-foreground">
                  You left off at Paragraph {resumePrompt.paragraphIndex + 1}. Continue where you stopped!
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleResumeSession}
                className="btn btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
              >
                <span>Resume Session</span>
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

        {/* Search & Filter Bar */}
        <div className="glass-card p-4 mb-8 space-y-3 border border-border/80">
          <div className="relative flex items-center">
            <Search className="w-5 h-5 text-muted-foreground absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder='Search books or topics: "How to Be People Smart", "communication", "listening", "empathy", "body language"...'
              className="w-full pl-11 pr-10 py-3 rounded-xl bg-secondary/60 border border-border/60 text-sm text-foreground focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all placeholder:text-muted-foreground/60"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-semibold">
            <span className="text-muted-foreground text-[11px] uppercase tracking-wider mr-1 flex items-center gap-1 flex-shrink-0">
              <ListFilter className="w-3.5 h-3.5" /> Quick Filters:
            </span>
            {[
              { id: 'All', label: 'All Books' },
              { id: 'People Smart', label: '⭐ How to Be People Smart' },
              { id: 'Communication', label: 'Communication & Listening' },
              { id: 'Crucial', label: 'Crucial Conversations' },
              { id: 'Habits', label: 'Atomic Habits' },
            ].map((chip) => (
              <button
                key={chip.id}
                onClick={() => {
                  setActiveCategoryFilter(chip.id);
                  if (chip.id === 'People Smart') setSearchQuery('');
                }}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                  activeCategoryFilter === chip.id
                    ? 'bg-primary-500 text-white shadow-sm'
                    : 'bg-secondary/70 text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>

          {searchQuery && (
            <div className="text-xs text-muted-foreground flex items-center justify-between pt-1 border-t border-border/40">
              <span>
                Found {filteredBooks.length} book{filteredBooks.length === 1 ? '' : 's'} matching "{searchQuery}"
              </span>
              <button
                onClick={() => setSearchQuery('')}
                className="text-primary-500 hover:underline font-semibold"
              >
                Clear search
              </button>
            </div>
          )}
        </div>

        {/* FEATURED FIRST BOOK: "How to Be People Smart" */}
        {filteredBooks.some((b) => b.id === 'book-people-smart') && (
          <div className="mb-10">
            <div className="text-xs font-bold uppercase tracking-wider text-primary-500 mb-3 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" /> First Book • How to Be People Smart
            </div>

            <div
              className="glass-card p-6 md:p-8 flex flex-col gap-6 border-2 border-primary-500/40 hover:border-primary-500 hover:shadow-xl transition-all rounded-2xl bg-gradient-to-br from-primary-500/5 via-transparent to-transparent"
            >
              <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                  {/* Book Cover */}
                  <div
                    className="w-28 h-36 rounded-xl flex flex-col justify-between p-3.5 text-white shadow-lg flex-shrink-0 cursor-pointer hover:scale-105 transition-transform"
                    style={{ background: BOOKS_DATABASE[0].coverGradient }}
                    onClick={() => handleSelectBook(BOOKS_DATABASE[0])}
                  >
                    <div className="text-[10px] uppercase font-bold tracking-wider opacity-90">
                      Speaking Mastery
                    </div>
                    <div>
                      <div className="text-xs font-black leading-tight mb-1">
                        {BOOKS_DATABASE[0].title}
                      </div>
                      <div className="text-[9px] opacity-80">{BOOKS_DATABASE[0].author}</div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-primary-500/15 text-primary-600 dark:text-primary-400">
                        {BOOKS_DATABASE[0].theme}
                      </span>
                      <span className="text-xs text-muted-foreground font-semibold">
                        {BOOKS_DATABASE[0].chapters.length} Chapters Complete
                      </span>
                    </div>

                    <h2
                      onClick={() => handleSelectBook(BOOKS_DATABASE[0])}
                      className="text-2xl md:text-3xl font-black text-foreground hover:text-primary-500 transition-colors cursor-pointer mb-2"
                    >
                      {BOOKS_DATABASE[0].title}
                    </h2>

                    <p className="text-xs text-muted-foreground font-medium mb-1">
                      By {BOOKS_DATABASE[0].author}
                    </p>

                    <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed mb-3">
                      {BOOKS_DATABASE[0].description}
                    </p>

                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="px-2.5 py-1 rounded-md bg-secondary text-foreground font-semibold">
                        Mode A: Upload or Paste Your Copy
                      </span>
                      <span className="px-2.5 py-1 rounded-md bg-primary-500/10 text-primary-500 font-semibold">
                        Mode B: Original AI Key Ideas
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleSelectBook(BOOKS_DATABASE[0])}
                  className="btn btn-primary py-2.5 px-6 flex items-center gap-2 font-bold shadow-md shadow-primary-500/25 flex-shrink-0"
                >
                  <span>Open Chapters</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Quick Chapter Launcher for "How to Be People Smart" */}
              <div className="pt-4 border-t border-border/50">
                <div className="text-xs font-bold text-foreground mb-3 flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 text-primary-500" />
                  <span>Chapters in "How to Be People Smart" (click any to practice):</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {BOOKS_DATABASE[0].chapters.map((ch, idx) => (
                    <button
                      key={ch.id}
                      onClick={() => {
                        setSelectedBook(BOOKS_DATABASE[0]);
                        handleSwitchChapter(ch);
                        setView('chapterSelect');
                      }}
                      className="text-left p-2.5 rounded-xl bg-secondary/50 hover:bg-primary-500/10 border border-border/60 hover:border-primary-500/50 transition-all group/ch"
                    >
                      <div className="text-[10px] font-bold text-primary-500 uppercase tracking-wide">
                        Chapter {idx + 1}
                      </div>
                      <div className="text-xs font-bold text-foreground group-hover/ch:text-primary-500 transition-colors line-clamp-1">
                        {ch.title}
                      </div>
                      <div className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                        {ch.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Other Matching Books */}
        {filteredBooks.filter((b) => b.id !== 'book-people-smart').length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-bold text-foreground mb-4">
              {filteredBooks.some((b) => b.id === 'book-people-smart')
                ? 'More Books in Library'
                : 'Search Results'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredBooks
                .filter((b) => b.id !== 'book-people-smart')
                .map((book) => (
                  <div
                    key={book.id}
                    onClick={() => handleSelectBook(book)}
                    className="glass-card p-5 flex gap-4 hover:border-primary-500/50 hover:shadow-lg transition-all group cursor-pointer rounded-xl"
                  >
                    <div
                      className="w-20 h-28 rounded-lg flex flex-col justify-between p-2.5 text-white shadow-md flex-shrink-0 group-hover:scale-105 transition-transform"
                      style={{ background: book.coverGradient }}
                    >
                      <div className="text-[9px] uppercase font-bold opacity-80">Book</div>
                      <div className="text-[11px] font-bold leading-tight">{book.title}</div>
                    </div>

                    <div className="flex flex-col justify-between flex-1">
                      <div>
                        <span className="text-[10px] font-bold text-primary-500 uppercase">
                          {book.theme}
                        </span>
                        <h4 className="text-base font-bold text-foreground group-hover:text-primary-500 transition-colors">
                          {book.title}
                        </h4>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                          {book.description}
                        </p>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-2 border-t border-border/40 mt-3">
                        <span className="text-muted-foreground">{book.chapters.length} Chapters</span>
                        <span className="font-semibold text-primary-500 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                          Practice <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Empty Search State */}
        {filteredBooks.length === 0 && (
          <div className="text-center py-16 glass-card p-8 rounded-2xl">
            <Search className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-40" />
            <h3 className="text-lg font-bold text-foreground">
              No books found matching "{searchQuery}"
            </h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              We couldn't find any books with that title or topic. Click below to view "How to Be People Smart".
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setActiveCategoryFilter('All');
              }}
              className="btn btn-primary text-xs py-2 px-5 mt-4"
            >
              Show "How to Be People Smart"
            </button>
          </div>
        )}
      </div>
    );
  }

  // ============================================================
  // RENDER: VIEW 2 - CHAPTER & MODE SELECTOR
  // ============================================================
  if (view === 'chapterSelect' && selectedBook && selectedChapter) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Back Link */}
        <button
          onClick={() => setView('library')}
          className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Library</span>
        </button>

        {/* Book Header Card */}
        <div className="glass-card p-6 mb-8 flex flex-col md:flex-row items-start md:items-center gap-6">
          <div
            className="w-24 h-32 rounded-xl flex flex-col justify-between p-3 text-white shadow-md flex-shrink-0"
            style={{ background: selectedBook.coverGradient }}
          >
            <div className="text-[9px] uppercase font-bold opacity-80">Selected Book</div>
            <div className="text-xs font-black">{selectedBook.title}</div>
          </div>

          <div>
            <div className="text-xs font-bold text-primary-500 uppercase tracking-wide">
              {selectedBook.theme}
            </div>
            <h2 className="text-2xl font-black text-foreground mt-0.5">{selectedBook.title}</h2>
            <p className="text-xs text-muted-foreground mt-1 max-w-2xl leading-relaxed">
              {selectedBook.description}
            </p>
          </div>
        </div>

        {/* Two-Column Layout: Chapter List & Mode Settings */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Column 1: Chapter Picker */}
          <div className="lg:col-span-1 space-y-3">
            <h3 className="text-sm font-bold text-foreground mb-1 flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary-500" />
              <span>Select Chapter / Topic</span>
            </h3>

            {/* Chapter search input */}
            <div className="relative mb-2">
              <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                value={chapterSearchQuery}
                onChange={(e) => setChapterSearchQuery(e.target.value)}
                placeholder="Search chapters (listening, empathy...)"
                className="w-full pl-8 pr-7 py-1.5 rounded-lg bg-secondary/60 border border-border/70 text-xs text-foreground focus:outline-none focus:border-primary-500 transition-colors"
              />
              {chapterSearchQuery && (
                <button
                  onClick={() => setChapterSearchQuery('')}
                  className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
              {filteredChapters.map((ch, idx) => {
                const isSelected = ch.id === selectedChapter.id;
                const prevScore = getPreviousChapterScore(selectedBook.id, ch.id);
                const originalIndex = selectedBook.chapters.findIndex((c) => c.id === ch.id);

                return (
                  <button
                    key={ch.id}
                    onClick={() => handleSwitchChapter(ch)}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${
                      isSelected
                        ? 'border-primary-500 bg-primary-500/10 shadow-sm'
                        : 'border-border/60 hover:border-border hover:bg-secondary/40'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-bold mb-1">
                      <span className={isSelected ? 'text-primary-500' : 'text-muted-foreground'}>
                        Chapter {originalIndex + 1}
                      </span>
                      {prevScore !== null && (
                        <span className="text-[11px] text-emerald-500 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> {prevScore}%
                        </span>
                      )}
                    </div>
                    <div className="text-sm font-bold text-foreground line-clamp-1">{ch.title}</div>
                    <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                      {ch.description}
                    </div>
                  </button>
                );
              })}

              {filteredChapters.length === 0 && (
                <div className="text-center py-6 text-xs text-muted-foreground">
                  No chapters match "{chapterSearchQuery}".
                  <button
                    onClick={() => setChapterSearchQuery('')}
                    className="block mx-auto text-primary-500 font-semibold mt-1 hover:underline"
                  >
                    Clear filter
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Column 2: Content Mode Selector (Mode A vs Mode B) */}
          <div className="lg:col-span-2 glass-card p-6 md:p-8">
            <h3 className="text-base font-bold text-foreground mb-1">
              Chapter: {selectedChapter.title}
            </h3>
            <p className="text-xs text-muted-foreground mb-6">{selectedChapter.description}</p>

            {/* Mode Tabs */}
            <div className="grid grid-cols-2 gap-3 mb-6 p-1.5 rounded-xl bg-secondary/50 border border-border/50">
              <button
                onClick={() => setActiveMode('key-ideas')}
                className={`py-2.5 px-4 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  activeMode === 'key-ideas'
                    ? 'bg-primary-500 text-white shadow-md'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>Mode B: Key Ideas (AI)</span>
              </button>

              <button
                onClick={() => setActiveMode('my-copy')}
                className={`py-2.5 px-4 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  activeMode === 'my-copy'
                    ? 'bg-primary-500 text-white shadow-md'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Mode A: My Copy</span>
              </button>
            </div>

            {/* Mode B: Key Ideas Preview */}
            {activeMode === 'key-ideas' && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-primary-500/5 border border-primary-500/15">
                  <div className="text-xs font-bold text-primary-500 mb-1 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Original Pedagogical Key Ideas
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Practices the core principles of this chapter through 5 to 6 concise paragraphs
                    (30–50 words each). Each paragraph focuses on natural rhythm and active
                    listening vocabulary.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-bold text-foreground">Session Paragraphs Preview:</div>
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {selectedChapter.keyIdeaParagraphs.map((para, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-lg bg-secondary/40 border border-border/40 text-xs text-foreground leading-relaxed"
                      >
                        <span className="font-bold text-primary-500 mr-1.5">P{i + 1}:</span>
                        {para}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Chapter Vocabulary Preview */}
                {selectedChapter.vocabulary.length > 0 && (
                  <div className="pt-2">
                    <div className="text-xs font-bold text-foreground mb-2">
                      Key Vocabulary in this Chapter:
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedChapter.vocabulary.map((voc, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 rounded-md bg-secondary text-xs font-semibold text-foreground flex items-center gap-1.5"
                        >
                          <span>{voc.word}</span>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {voc.ipa}
                          </span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Mode A: "My Copy" Text Input & Splitting */}
            {activeMode === 'my-copy' && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-400">
                  <div className="font-bold mb-1 flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4" /> Copyright Safe (User Device Only)
                  </div>
                  <p className="leading-relaxed">
                    Paste text or upload a document of the book copy you own. The app splits it into
                    30 to 50 word chunks along sentence boundaries. Your text remains strictly on
                    your device.
                  </p>
                </div>

                {/* File Upload Button */}
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".txt,.md,.json,.text"
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="btn btn-outline text-xs py-2 px-3 flex items-center gap-2"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Text Document (.txt, .md)</span>
                  </button>
                  <span className="text-[11px] text-muted-foreground">or paste text below:</span>
                </div>

                {/* Text Area */}
                <div>
                  <textarea
                    rows={5}
                    value={userPastedText}
                    onChange={handlePastedTextChange}
                    placeholder="Paste an excerpt from your copy of the book here. It will be sanitized and split into speaking chunks of 30-50 words automatically..."
                    className="w-full p-3.5 rounded-xl bg-secondary/50 border border-border text-xs text-foreground focus:outline-none focus:border-primary-500 transition-colors leading-relaxed"
                  />
                </div>

                {uploadError && (
                  <div className="text-xs text-rose-500 font-semibold">{uploadError}</div>
                )}

                {/* Splitting Feedback */}
                {splitResult && (
                  <div className="p-3.5 rounded-xl bg-secondary/40 border border-border/50 text-xs space-y-2">
                    <div className="flex items-center justify-between font-bold text-foreground">
                      <span>
                        Splitting Status: {splitResult.paragraphs.length} Speaking Paragraphs
                      </span>
                      <span className="text-primary-500">
                        {splitResult.totalWords} words total (~
                        {Math.round(splitResult.totalWords / 130)} min)
                      </span>
                    </div>
                    <div className="text-muted-foreground text-[11px]">
                      Sentences protected from cutting: {splitResult.totalSentences}. Page numbers
                      and footnotes stripped automatically.
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Action Button: Start Reading Session */}
            <div className="pt-6 mt-6 border-t border-border/40 flex justify-end">
              <button
                onClick={handleStartSession}
                className="btn btn-primary py-2.5 px-6 flex items-center gap-2 font-bold shadow-lg shadow-primary-500/25"
              >
                <span>Start Speaking Session</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDER: VIEW 3 - ACTIVE PARAGRAPH READING SCREEN
  // ============================================================
  if (view === 'reading' && selectedBook && selectedChapter) {
    const totalParagraphs = activeParagraphs.length;
    const progressPercent = Math.round(((currentParagraphIdx + 1) / totalParagraphs) * 100);

    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Navigation & Header */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setView('chapterSelect')}
            className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Chapter Details</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary-500/10 text-primary-500">
              {activeMode === 'key-ideas' ? 'Mode B: Key Ideas' : 'Mode A: My Copy'}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-secondary text-foreground">
              {selectedChapter.title}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center text-xs font-bold text-muted-foreground mb-1.5">
            <span className="text-foreground text-sm font-semibold">{selectedBook.title}</span>
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
              <span>Read aloud with even pacing and clear diction</span>
            </div>
          </div>

          {/* Large Readable Text (20-24px) with Karaoke sentence highlight */}
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

          {/* Live recording transcript preview */}
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
                ? 'Analyzing your articulation & pacing...'
                : isRecording
                ? `Recording... Tap button when finished (${recordingSeconds}s)`
                : 'Tap mic and read paragraph aloud'}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              Ideal book reading pace: {IDEAL_WPM_RANGE.min}-{IDEAL_WPM_RANGE.max} WPM
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* PARAGRAPH REPORT MODAL (Immediately after reading)          */}
        {/* ============================================================ */}
        {activeReportModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="glass-card max-w-2xl w-full p-6 md:p-8 bg-card shadow-2xl rounded-2xl border border-border/80 my-8">
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-border/50 mb-6">
                <div>
                  <h3 className="text-xl font-black text-foreground">
                    Paragraph {currentParagraphIdx + 1} Feedback
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {selectedChapter.title} • {activeMode === 'key-ideas' ? 'Key Ideas' : 'My Copy'}
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

              {/* Below 60 suggestion */}
              {activeReportModal.scores.communication < 60 && (
                <div className="p-3 mb-6 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>
                    Your score is below 60. We suggest re-reading this paragraph to sharpen your
                    clarity before moving forward.
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

              {/* Word-by-word Highlight Breakdown */}
              <div className="mb-6">
                <div className="flex items-center justify-between text-xs font-bold text-muted-foreground mb-2">
                  <span>Word Accuracy (tap to hear correct pronunciation):</span>
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
                      colorClass =
                        'text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 underline decoration-amber-400 decoration-wavy';
                    } else if (item.status === 'wrong' || item.status === 'missing') {
                      colorClass =
                        'text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 line-through';
                    }

                    return (
                      <button
                        key={idx}
                        onClick={() => handlePlayWord(item.word)}
                        className={`px-1.5 py-0.5 rounded text-sm font-semibold transition-colors cursor-pointer ${colorClass}`}
                        title={`${item.word} (${item.status}) - Tap to listen`}
                      >
                        {item.word}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Fluency Metrics Summary */}
              <div className="grid grid-cols-3 gap-3 mb-6 p-3 rounded-xl bg-secondary/20 border border-border/40 text-center">
                <div>
                  <div className="text-[10px] font-bold text-muted-foreground uppercase">
                    Pace (WPM)
                  </div>
                  <div className="text-sm font-extrabold text-foreground mt-0.5">
                    {activeReportModal.wpm}{' '}
                    <span className="text-[10px] font-normal text-muted-foreground">
                      (Target: 110-150)
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

              {/* Mispronounced Words List */}
              {activeReportModal.mispronouncedWords.length > 0 && (
                <div className="mb-6">
                  <div className="text-xs font-bold text-foreground mb-2">
                    Words Needing Polish:
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
                <div className="text-xs font-bold text-foreground">Actionable Tips:</div>
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
                    {currentParagraphIdx + 1 < activeParagraphs.length
                      ? 'Next Paragraph'
                      : 'View Session Report'}
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
  // RENDER: VIEW 4 - FINAL SESSION REPORT
  // ============================================================
  if (view === 'finalReport' && finalReport) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Top Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => setView('chapterSelect')}
            className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Chapter</span>
          </button>

          <button
            onClick={handleShareResult}
            className="btn btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share Result</span>
          </button>
        </div>

        {/* Big Overall Speaking Score Card */}
        <div className="glass-card p-8 mb-8 text-center flex flex-col items-center justify-center border border-border/80 relative overflow-hidden">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <h2 className="text-2xl font-black text-foreground">{finalReport.bookTitle}</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-6">
            Chapter: {finalReport.chapterTitle} • Mode:{' '}
            {finalReport.mode === 'key-ideas' ? 'Key Ideas' : 'My Copy'}
          </p>

          <div className="my-2">
            <ScoreRing
              score={finalReport.overallScore}
              size={170}
              strokeWidth={12}
              label={finalReport.communicationLevel}
            />
          </div>

          <div className="mt-4 px-4 py-2 rounded-full bg-secondary/80 border border-border/50 text-xs font-semibold text-foreground">
            {finalReport.previousScoreComparison.message}
          </div>
        </div>

        {/* Average Scores Metrics */}
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

        {/* Paragraph-by-Paragraph Bar Chart */}
        <div className="glass-card p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-primary-500" />
              <h3 className="text-base font-bold text-foreground">Paragraph Performance Chart</h3>
            </div>
            <div className="text-xs text-muted-foreground">Session progress breakdown</div>
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

        {/* Fluency & Weakest Sounds Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
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

        {/* Top 5 Mispronounced Words */}
        {finalReport.topMispronouncedWords.length > 0 && (
          <div className="glass-card p-6 mb-8">
            <h4 className="text-sm font-bold text-foreground mb-4">
              Top Mispronounced Words (tap to listen)
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
                    title="Tap to listen"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* BONUS: Vocabulary Builder Card */}
        {finalReport.vocabularyBuilder.length > 0 && (
          <div className="glass-card p-6 mb-8 border border-primary-500/30">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary-500" />
                <h3 className="text-base font-bold text-foreground">
                  Bonus: Chapter Vocabulary Builder
                </h3>
              </div>
              <span className="text-xs text-primary-500 font-semibold">One-Word Drills</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {finalReport.vocabularyBuilder.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-secondary/40 border border-border/50 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-base font-extrabold text-foreground">{item.word}</span>
                      <button
                        onClick={() => handlePlayWord(item.word)}
                        className="p-1.5 rounded-lg bg-primary-500/10 text-primary-500 hover:bg-primary-500/20"
                        title="Hear pronunciation drill"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="text-xs text-muted-foreground font-mono mb-2">
                      {item.ipa} • <span className="italic">{item.phonetic}</span>
                    </div>
                    <p className="text-xs text-foreground leading-relaxed mb-3">
                      {item.definition}
                    </p>
                  </div>
                  <div className="text-[11px] text-muted-foreground italic border-t border-border/30 pt-2">
                    "{item.example}"
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons: Read Again, Next Chapter, Library */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 py-4">
          <button
            onClick={() => handleStartSession()}
            className="btn btn-outline py-2.5 px-6 w-full sm:w-auto flex items-center justify-center gap-2 font-semibold"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Read Again</span>
          </button>

          <button
            onClick={handleNextChapter}
            className="btn btn-primary py-2.5 px-8 w-full sm:w-auto flex items-center justify-center gap-2 font-bold shadow-lg shadow-primary-500/25"
          >
            <span>Next Chapter</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return null;
}
