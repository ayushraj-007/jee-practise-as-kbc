import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  Trophy,
  Clock,
  Shield,
  HelpCircle,
  Users,
  FastForward,
  LogOut,
  ChevronRight,
  RotateCcw,
  Home,
  CheckCircle,
  XCircle,
  Sparkles,
  Volume2,
  VolumeX,
  Brain,
  Baby,
  Zap,
  Heart,
  AlertTriangle,
} from 'lucide-react';
import {
  QuizQuestion,
  PrizeLevel,
  LifelineState,
  PRIZE_LADDER,
  TopicType,
  LanguageType,
  QuestionSessionResult,
  WeakTopicReport,
} from '../types/quiz';
import { soundEffects } from '../utils/soundEffects';
import { PrizeLadder } from './PrizeLadder';
import { AudiencePollModal } from './AudiencePollModal';
import { QuitConfirmModal } from './QuitConfirmModal';
import { AIHostCorner } from './AIHostCorner';
import { WeakTopicModal } from './WeakTopicModal';
import { generateClientWeakAnalysis } from '../data/questionVault';

export const getTimeForLevel = (lvl: number): number => {
  if (lvl <= 3) return 30; // Q1-3: 30s (Basic facts)
  if (lvl <= 6) return 45; // Q4-6: 45s (Conceptual)
  if (lvl <= 9) return 60; // Q7-9: 60s (Intermediate)
  if (lvl <= 12) return 75; // Q10-12: 75s (Advanced)
  if (lvl <= 14) return 90; // Q13-14: 90s (Complex multi-step)
  return 120; // Q15: 120s (The ₹1 Crore Mega Question)
};

interface KBCModeProps {
  questions: QuizQuestion[];
  topic: TopicType;
  customTopic?: string;
  language: LanguageType;
  onHome: () => void;
  onPlayAgain: () => void;
}

export const KBCMode: React.FC<KBCModeProps> = ({
  questions: initialQuestions,
  topic,
  customTopic,
  language,
  onHome,
  onPlayAgain,
}) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>(initialQuestions);
  const [currentLevelIndex, setCurrentLevelIndex] = useState<number>(0); // 0 = Q1, 14 = Q15
  const [lives, setLives] = useState<number>(3); // 3 Lives (3 strikes allowed)
  const [lifelines, setLifelines] = useState<LifelineState>({
    fiftyFifty: true,
    audiencePoll: true,
    skipQuestion: true,
  });

  // 50-50 eliminated options indices for current question
  const [hiddenOptions, setHiddenOptions] = useState<number[]>([]);

  // Modals & Analysis
  const [showAudienceModal, setShowAudienceModal] = useState<boolean>(false);
  const [showQuitModal, setShowQuitModal] = useState<boolean>(false);
  const [showWeakAnalysisModal, setShowWeakAnalysisModal] = useState<boolean>(false);
  const [isLadderMobileOpen, setIsLadderMobileOpen] = useState<boolean>(false);

  // Answering & Evaluation State
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerLocked, setIsAnswerLocked] = useState<boolean>(false);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [gameOverReason, setGameOverReason] = useState<'WON' | 'WRONG' | 'TIMEOUT' | 'QUIT'>('WRONG');
  const [finalEarnings, setFinalEarnings] = useState<number>(0);
  const [finalFormattedEarnings, setFinalFormattedEarnings] = useState<string>('₹ 0');

  // "Explain like I'm 10" state
  const [eli10Open, setEli10Open] = useState<boolean>(false);
  const [eli10Text, setEli10Text] = useState<string>('');
  const [isEli10Loading, setIsEli10Loading] = useState<boolean>(false);

  // Session Results & Weak Topic Analysis state
  const [sessionResults, setSessionResults] = useState<QuestionSessionResult[]>([]);
  const [weakReport, setWeakReport] = useState<WeakTopicReport | null>(null);
  const [isAnalyzingWeakTopics, setIsAnalyzingWeakTopics] = useState<boolean>(false);

  // AI Host Amitabh Dialogue
  const [hostLine, setHostLine] = useState<string>(
    'Deviyo aur sajjano! Aapka swagat hai KBC Hot Seat par. Dhyan kendrit kijiye, prashna shuru ho rahe hain!'
  );
  const [isHostSpeaking, setIsHostSpeaking] = useState<boolean>(false);

  // Sound state
  const [isMuted, setIsMuted] = useState<boolean>(soundEffects.getMuted());

  // Timer logic: Scales with level (30s up to 120s for ₹1 Crore)
  const currentLevelNumber = currentLevelIndex + 1;
  const maxTimer = getTimeForLevel(currentLevelNumber);
  const [timeLeft, setTimeLeft] = useState<number>(maxTimer);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const currentQ: QuizQuestion = questions[currentLevelIndex] || questions[0];
  const currentPrize: PrizeLevel = PRIZE_LADDER[currentLevelIndex] || PRIZE_LADDER[0];

  const updateHostDialogue = (line: string) => {
    setHostLine(line);
    setIsHostSpeaking(true);
    setTimeout(() => setIsHostSpeaking(false), 2500);
  };

  // Safe checkpoint amounts
  const getSafeCheckpointAmount = useCallback((levelIdx: number): { amount: number; formatted: string } => {
    if (levelIdx >= 10) {
      return { amount: 320000, formatted: '₹ 3,20,000' };
    }
    if (levelIdx >= 5) {
      return { amount: 10000, formatted: '₹ 10,000' };
    }
    return { amount: 0, formatted: '₹ 0' };
  }, []);

  // Guaranteed earnings if quitting
  const getCurrentGuaranteedEarnings = useCallback((): { amount: number; formatted: string } => {
    if (currentLevelIndex === 0) return { amount: 0, formatted: '₹ 0' };
    const prevPrize = PRIZE_LADDER[currentLevelIndex - 1];
    return { amount: prevPrize.amount, formatted: prevPrize.formattedAmount };
  }, [currentLevelIndex]);

  const updateHighScore = (winnings: number) => {
    const existing = parseInt(localStorage.getItem('crorepati_high_score') || '0', 10);
    if (winnings > existing) {
      localStorage.setItem('crorepati_high_score', winnings.toString());
    }
  };

  // Reset states on question change
  useEffect(() => {
    setTimeLeft(getTimeForLevel(currentLevelNumber));
    setSelectedOption(null);
    setIsAnswerLocked(false);
    setIsAnswerRevealed(false);
    setHiddenOptions([]);
    setEli10Open(false);
    setEli10Text('');

    // Host greets each new question
    const introLines = [
      `Dhyan se padhiye, yeh prashna sankhya ${currentLevelNumber} aapko ${currentPrize.formattedAmount} ke kareeb le jaayega!`,
      `Yeh raha Prashna ${currentLevelNumber}! Samay (${maxTimer}s) ka dhyan rakhiye aur uttar chuniye.`,
      `Agla padav, ${currentPrize.formattedAmount} ke liye! Computerji ne chunauti pesh ki hai!`,
      `Hot seat par shanti aur aatamvishwas sabse bada hathiyar hai. Prashna ${currentLevelNumber} aapke saamne hai.`,
    ];
    updateHostDialogue(introLines[currentLevelIndex % introLines.length]);
  }, [currentLevelIndex, maxTimer, currentLevelNumber, currentPrize.formattedAmount]);

  // Countdown timer
  useEffect(() => {
    if (isAnswerLocked || isAnswerRevealed || isGameOver) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleTimeOut();
          return 0;
        }
        if (prev <= 7) {
          soundEffects.playTick(prev % 2 === 0);
          if (prev === 7) {
            updateHostDialogue('Ghadiki sui tezi se ghoom rahi hai, dhyan kendrit kijiye!');
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isAnswerLocked, isAnswerRevealed, isGameOver]);

  // Timeout handler with 3 Lives system
  const handleTimeOut = () => {
    soundEffects.playWrong();
    setIsAnswerRevealed(true);
    const nextLives = lives - 1;
    setLives(nextLives);

    // Record session result
    const record: QuestionSessionResult = {
      questionNumber: currentLevelNumber,
      question: currentQ.question,
      topicTag: currentQ.topicTag || 'Core Topic',
      difficulty: currentQ.difficulty,
      userChoice: 'Time Out (No Answer)',
      correctChoice: currentQ.options[currentQ.correctIndex],
      isCorrect: false,
      explanation: currentQ.explanation,
    };
    const updated = [...sessionResults, record];
    setSessionResults(updated);

    if (nextLives > 0) {
      updateHostDialogue(
        nextLives === 2
          ? 'Samay samapt! Pehli chook hui hai, par 2 zindagiyan abhi bhi bachi hain. Agle sawaal par dhyan kendrit kijiye!'
          : 'Samay samapt! Khatre ki ghanti! Ab kewal 1 aakhri jeevan bacha hai. Agle prashna par bohot sambhal kar faisla lijiye!'
      );
    } else {
      const safe = getSafeCheckpointAmount(currentLevelIndex);
      setFinalEarnings(safe.amount);
      setFinalFormattedEarnings(safe.formatted);
      updateHighScore(safe.amount);
      setGameOverReason('TIMEOUT');
      updateHostDialogue('Afsos! Teeno jeevan samapt ho chuke hain aur samay bhi! Par aapka saahas kabil-e-tareef tha.');
      setIsGameOver(true);
      triggerWeakTopicAnalysis(updated);
    }
  };

  // Option selection
  const handleSelectOption = (idx: number) => {
    if (isAnswerLocked || isAnswerRevealed || isGameOver || hiddenOptions.includes(idx)) {
      return;
    }
    setSelectedOption(idx);
    setIsAnswerLocked(true);
    soundEffects.playLock();

    const lockLines = [
      'Toh kya computer mahashay se kaha jaaye, taala laga diya jaaye?',
      'Kya baat hai! Poore aatamvishwas ke sath vikalp chuna gaya hai. Computerji, lock kijiye!',
      'Taala lagane ka aadesh mil chuka hai... dekhte hain kya yeh sahi faisla hai!',
    ];
    updateHostDialogue(lockLines[Math.floor(Math.random() * lockLines.length)]);

    // Dramatic TV delay
    setTimeout(() => {
      revealAnswer(idx);
    }, 1400);
  };

  // Reveal Answer with 3 Lives system
  const revealAnswer = (chosenIdx: number) => {
    setIsAnswerRevealed(true);
    const isCorrect = chosenIdx === currentQ.correctIndex;

    const record: QuestionSessionResult = {
      questionNumber: currentLevelNumber,
      question: currentQ.question,
      topicTag: currentQ.topicTag || 'Core Topic',
      difficulty: currentQ.difficulty,
      userChoice: currentQ.options[chosenIdx],
      correctChoice: currentQ.options[currentQ.correctIndex],
      isCorrect,
      explanation: currentQ.explanation,
    };
    const updatedResults = [...sessionResults, record];
    setSessionResults(updatedResults);

    if (isCorrect) {
      soundEffects.playCorrect();
      const currentWinning = currentPrize.amount;
      updateHighScore(currentWinning);

      if (currentLevelNumber === 15) {
        soundEffects.playVictoryFanfare();
        triggerGrandConfetti();
        setFinalEarnings(10000000);
        setFinalFormattedEarnings('₹ 1,00,00,000');
        setGameOverReason('WON');
        updateHostDialogue('AITIHASIK PAL! Koti koti badhaaiyan! Aap ban chuke hain MAHA CROREPATI!');
        setIsGameOver(true);
        triggerWeakTopicAnalysis(updatedResults);
      } else {
        const correctHostLines = [
          'Adbhut! Kya soojh-boojh ka pradarshan kiya hai aapne! Bilkul sahi uttar!',
          'Shandaar! Ekdam sahi uttar! Aap agle padav par poore aatamvishwas ke sath pahunch chuke hain!',
          'Bohot hi umda! Is prashna ko aapne asani se paar kar liya!',
        ];
        updateHostDialogue(correctHostLines[Math.floor(Math.random() * correctHostLines.length)]);
      }
    } else {
      soundEffects.playWrong();
      const nextLives = lives - 1;
      setLives(nextLives);

      if (nextLives > 0) {
        updateHostDialogue(
          nextLives === 2
            ? 'Afsos, galat uttar! Par ghabraiye nahi, 3 mein se 2 lives abhi bhi bachi hain. Agle sawaal par bazi palat sakte hain!'
            : 'Chintajanak! Dusra jhatka! Ab kewal 1 antim jeevan bacha hai. Soch-samajh kar aage badhiye!'
        );
      } else {
        const safe = getSafeCheckpointAmount(currentLevelIndex);
        setFinalEarnings(safe.amount);
        setFinalFormattedEarnings(safe.formatted);
        updateHighScore(safe.amount);
        setGameOverReason('WRONG');
        updateHostDialogue('Afsos! Teeno jeevan samapt ho chuke hain! Par ghabraiye nahi, sikhne ka naam hi zindagi hai. Hausla buland rakhiye!');
        setIsGameOver(true);
        triggerWeakTopicAnalysis(updatedResults);
      }
    }
  };

  // Trigger Gemini Weak Topic Analysis
  const triggerWeakTopicAnalysis = async (results: QuestionSessionResult[]) => {
    setIsAnalyzingWeakTopics(true);
    try {
      const res = await fetch('/api/analyze-weak-topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionResults: results,
          subject: customTopic || topic,
          language,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.analysis) {
          setWeakReport(data.analysis);
          return;
        }
      }
      setWeakReport(generateClientWeakAnalysis(results, customTopic || topic));
    } catch {
      setWeakReport(generateClientWeakAnalysis(results, customTopic || topic));
    } finally {
      setIsAnalyzingWeakTopics(false);
    }
  };

  // Fetch or toggle "Explain Like I'm 10"
  const handleToggleEli10 = async () => {
    if (eli10Open) {
      setEli10Open(false);
      return;
    }

    setEli10Open(true);

    // If pre-loaded in question
    if (currentQ.eli10) {
      setEli10Text(currentQ.eli10);
      return;
    }

    setIsEli10Loading(true);
    try {
      const res = await fetch('/api/eli10', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: currentQ.question,
          correctAnswer: currentQ.options[currentQ.correctIndex],
          explanation: currentQ.explanation,
          language,
        }),
      });
      const data = await res.json();
      setEli10Text(data.eli10 || 'Like balancing toys on a seesaw!');
    } catch {
      setEli10Text(`Think of it like sharing lunchboxes with friends: "${currentQ.options[currentQ.correctIndex]}" balances the equation perfectly!`);
    } finally {
      setIsEli10Loading(false);
    }
  };

  // Next question
  const handleNextQuestion = () => {
    if (currentLevelIndex < 14) {
      setCurrentLevelIndex((prev) => prev + 1);
    }
  };

  // Lifelines
  const useFiftyFifty = () => {
    if (!lifelines.fiftyFifty || isAnswerLocked || isAnswerRevealed) return;
    soundEffects.playLifeline();
    updateHostDialogue('Computerji, 50-50 lifeline prastut kijiye! Do galat vikalp gayab kar diye jaayein.');

    const correct = currentQ.correctIndex;
    const wrongIndices = [0, 1, 2, 3].filter((i) => i !== correct);
    const shuffled = wrongIndices.sort(() => Math.random() - 0.5);
    setHiddenOptions(shuffled.slice(0, 2));
    setLifelines((prev) => ({ ...prev, fiftyFifty: false }));
  };

  const useAudiencePoll = () => {
    if (!lifelines.audiencePoll || isAnswerLocked || isAnswerRevealed) return;
    soundEffects.playLifeline();
    updateHostDialogue('Chaliye audience ki rai lete hain! Dekhte hain hamare darshak kis vikalp ke sath hain.');
    setShowAudienceModal(true);
    setLifelines((prev) => ({ ...prev, audiencePoll: false }));
  };

  const useSkipQuestion = async () => {
    if (!lifelines.skipQuestion || isAnswerLocked || isAnswerRevealed) return;
    soundEffects.playLifeline();
    updateHostDialogue('Aapne prashna badalne ka faisla kiya hai. Computerji, ek naya prashna laya jaaye!');

    if (questions.length > 15 && currentLevelIndex < 15) {
      const spareQ = questions[15];
      const updated = [...questions];
      updated[currentLevelIndex] = spareQ;
      setQuestions(updated);
    } else {
      try {
        const res = await fetch('/api/generate-single', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topic,
            customTopic,
            language,
            difficulty: currentQ.difficulty,
          }),
        });
        const data = await res.json();
        if (data.question) {
          const updated = [...questions];
          updated[currentLevelIndex] = data.question;
          setQuestions(updated);
        }
      } catch {}
    }

    setHiddenOptions([]);
    setTimeLeft(maxTimer);
    setLifelines((prev) => ({ ...prev, skipQuestion: false }));
  };

  const handleConfirmQuit = () => {
    const guaranteed = getCurrentGuaranteedEarnings();
    soundEffects.playLifeline();
    setFinalEarnings(guaranteed.amount);
    setFinalFormattedEarnings(guaranteed.formatted);
    updateHighScore(guaranteed.amount);
    setGameOverReason('QUIT');
    updateHostDialogue(`Bohot hi samajhdari bhara faisla! Aap surakshit dhanrashi ${guaranteed.formatted} lekar jaa rahe hain.`);
    setShowQuitModal(false);
    setIsGameOver(true);
    triggerWeakTopicAnalysis(sessionResults);
  };

  const triggerGrandConfetti = () => {
    try {
      const end = Date.now() + 3.5 * 1000;
      const colors = ['#f59e0b', '#fbbf24', '#ffffff', '#10b981', '#3b82f6'];
      (function frame() {
        confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors });
        confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors });
        if (Date.now() < end) requestAnimationFrame(frame);
      })();
    } catch {}
  };

  const optionLetters = ['A', 'B', 'C', 'D'];

  const handleToggleMute = () => {
    const muted = soundEffects.toggleMute();
    setIsMuted(muted);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between p-3 sm:p-5 lg:p-6 relative select-none">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-64 studio-beam pointer-events-none" />

      {/* Top Header Bar */}
      <header className="flex items-center justify-between gap-3 pb-3 border-b border-amber-500/25 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/30 border border-amber-500/50 text-amber-400">
            <Trophy className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h1 className="font-cinzel text-base sm:text-xl font-black text-amber-300 tracking-wider">
              KBC CROREPATI
            </h1>
            <p className="text-[11px] text-amber-200/70 hidden sm:block truncate max-w-md">
              {customTopic ? (
                <>Topic: <span className="text-white font-semibold">{customTopic}</span></>
              ) : (
                <>Subject: <span className="text-white font-semibold">{topic}</span></>
              )}{' '}
              • Lang: <span className="text-white font-semibold">{language}</span>
            </p>
          </div>
        </div>

        {/* Current Stage, Lives, Timer & Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* 3 Lives Counter */}
          <div
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-900/90 border border-rose-500/40 shadow-sm shadow-rose-500/20"
            title={`${lives} of 3 lives left`}
          >
            {[0, 1, 2].map((i) => (
              <Heart
                key={i}
                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-all duration-300 ${
                  i < lives
                    ? 'fill-rose-500 text-rose-500 scale-100 drop-shadow-[0_0_6px_rgba(244,63,94,0.7)]'
                    : 'fill-slate-800 text-slate-600 scale-90'
                }`}
              />
            ))}
            <span className="text-[11px] sm:text-xs font-mono font-bold text-rose-300 ml-0.5">
              {lives}/3
            </span>
          </div>

          {/* Increasing Timer */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-sm sm:text-base font-extrabold border transition-all ${
              timeLeft <= 10
                ? 'bg-rose-950/80 border-rose-500 text-rose-300 shadow-lg shadow-rose-500/30 animate-pulse'
                : 'bg-slate-900/80 border-amber-500/40 text-amber-300'
            }`}
            title={`Timer: ${timeLeft}s left out of ${maxTimer}s allocated for Q${currentLevelNumber}`}
          >
            <Clock className={`w-4 h-4 ${timeLeft <= 10 ? 'text-rose-400 animate-spin' : 'text-amber-400'}`} />
            <span>{timeLeft}s</span>
            <span className="text-[10px] text-amber-400/60 font-normal">/{maxTimer}s</span>
          </div>

          <button
            onClick={handleToggleMute}
            aria-label="Toggle sound"
            className="p-2 rounded-xl bg-slate-900/80 border border-amber-500/30 text-amber-300 hover:text-white hover:bg-slate-800 transition"
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>

          <button
            onClick={() => setIsLadderMobileOpen(!isLadderMobileOpen)}
            className="lg:hidden px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold hover:bg-amber-500/30"
          >
            Ladder ({currentLevelNumber}/15)
          </button>

          <button
            onClick={() => setShowQuitModal(true)}
            disabled={isAnswerLocked || isAnswerRevealed || isGameOver}
            className="px-3.5 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 border border-rose-500/40 text-rose-200 text-xs sm:text-sm font-bold flex items-center gap-1.5 transition disabled:opacity-40"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Quit</span>
          </button>
        </div>
      </header>

      {/* Main Game Arena */}
      <main className="flex-1 flex flex-col lg:flex-row gap-6 my-4 items-center justify-center max-w-7xl mx-auto w-full relative z-10">
        <div className="flex-1 w-full max-w-3xl flex flex-col justify-center space-y-4 sm:space-y-5">
          {/* AI Quiz Host Dialogue Corner */}
          <AIHostCorner hostLine={hostLine} isHostSpeaking={isHostSpeaking} />

          {/* 3 Iconic Lifelines Bar */}
          <div className="flex items-center justify-center gap-3 sm:gap-6 bg-slate-950/60 p-2.5 sm:p-3 rounded-2xl border border-amber-500/30 backdrop-blur-md">
            <button
              onClick={useFiftyFifty}
              disabled={!lifelines.fiftyFifty || isAnswerLocked || isAnswerRevealed}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3 sm:px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
                lifelines.fiftyFifty
                  ? 'bg-gradient-to-b from-blue-900/60 to-indigo-950/90 border-2 border-blue-400 text-blue-200 hover:border-amber-400 hover:text-amber-300 shadow-md shadow-blue-500/20 hover:scale-105 active:scale-95'
                  : 'bg-slate-900/40 border border-slate-800 text-slate-600 line-through opacity-50 cursor-not-allowed'
              }`}
            >
              <HelpCircle className="w-4 h-4" />
              <span>50 : 50</span>
            </button>

            <button
              onClick={useAudiencePoll}
              disabled={!lifelines.audiencePoll || isAnswerLocked || isAnswerRevealed}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3 sm:px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
                lifelines.audiencePoll
                  ? 'bg-gradient-to-b from-blue-900/60 to-indigo-950/90 border-2 border-blue-400 text-blue-200 hover:border-amber-400 hover:text-amber-300 shadow-md shadow-blue-500/20 hover:scale-105 active:scale-95'
                  : 'bg-slate-900/40 border border-slate-800 text-slate-600 line-through opacity-50 cursor-not-allowed'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Audience Poll</span>
            </button>

            <button
              onClick={useSkipQuestion}
              disabled={!lifelines.skipQuestion || isAnswerLocked || isAnswerRevealed}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3 sm:px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
                lifelines.skipQuestion
                  ? 'bg-gradient-to-b from-blue-900/60 to-indigo-950/90 border-2 border-blue-400 text-blue-200 hover:border-amber-400 hover:text-amber-300 shadow-md shadow-blue-500/20 hover:scale-105 active:scale-95'
                  : 'bg-slate-900/40 border border-slate-800 text-slate-600 line-through opacity-50 cursor-not-allowed'
              }`}
            >
              <FastForward className="w-4 h-4" />
              <span>Skip Question</span>
            </button>
          </div>

          {/* Current Question Stage Box */}
          <div className="relative">
            <div className="relative bg-gradient-to-b from-slate-900/95 via-indigo-950/95 to-slate-950 border-2 border-amber-500/70 rounded-3xl p-5 sm:p-7 shadow-2xl shadow-amber-500/15 text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-bold uppercase tracking-wider mb-3">
                <span>Question {currentLevelNumber} of 15</span>
                <span>•</span>
                <span>For {currentPrize.formattedAmount}</span>
                {currentPrize.isCheckpoint && (
                  <span className="flex items-center gap-1 text-amber-200">
                    <Shield className="w-3 h-3 text-amber-400" /> Safe Padav
                  </span>
                )}
                <span className="hidden sm:inline-flex items-center gap-1 text-amber-300/80 font-mono text-[11px]">
                  <Clock className="w-3 h-3" /> {maxTimer}s
                </span>
                <span className="hidden md:inline-flex items-center gap-1 text-emerald-300 text-[11px]">
                  <Zap className="w-3 h-3" /> {currentQ.difficulty.toUpperCase()}
                </span>
              </div>

              <h2 className="text-base sm:text-xl font-bold text-slate-100 leading-snug font-cinzel tracking-wide min-h-[3.5rem] flex items-center justify-center">
                {currentQ.question}
              </h2>
            </div>
          </div>

          {/* 4 Interactive Option Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {currentQ.options.map((optText, idx) => {
              const isHidden = hiddenOptions.includes(idx);
              const isSelected = selectedOption === idx;
              const isCorrectAnswer = idx === currentQ.correctIndex;

              let btnStyle = 'bg-slate-900/80 border-amber-500/40 text-slate-200 hover:border-amber-400 hover:text-white';
              let badgeStyle = 'bg-slate-800 border-amber-500/40 text-amber-300';

              if (isHidden) {
                return (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl border border-dashed border-slate-800 bg-slate-950/30 opacity-20 pointer-events-none text-center text-xs text-slate-600 font-mono"
                  >
                    [Eliminated by 50:50]
                  </div>
                );
              }

              if (isAnswerRevealed) {
                if (isCorrectAnswer) {
                  btnStyle = 'bg-gradient-to-r from-emerald-600 to-green-700 border-emerald-300 text-white shadow-xl shadow-emerald-500/40 font-bold scale-[1.02] correct-glow';
                  badgeStyle = 'bg-emerald-950 border-emerald-300 text-emerald-200';
                } else if (isSelected && !isCorrectAnswer) {
                  btnStyle = 'bg-gradient-to-r from-rose-700 to-red-800 border-rose-300 text-white shadow-xl shadow-rose-500/40 font-bold animate-shake wrong-glow';
                  badgeStyle = 'bg-rose-950 border-rose-300 text-rose-200';
                } else {
                  btnStyle = 'bg-slate-950/60 border-slate-800 text-slate-500 opacity-60';
                  badgeStyle = 'bg-slate-900 border-slate-800 text-slate-500';
                }
              } else if (isSelected && isAnswerLocked) {
                btnStyle = 'bg-gradient-to-r from-amber-500 to-yellow-400 border-yellow-200 text-slate-950 font-black animate-lock-pulse shadow-xl shadow-amber-500/50 scale-[1.02]';
                badgeStyle = 'bg-slate-950 border-slate-900 text-amber-400';
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(idx)}
                  disabled={isAnswerLocked || isAnswerRevealed || isGameOver}
                  className={`flex items-center gap-3 p-3.5 sm:p-4 rounded-2xl border-2 text-left transition-all duration-200 transform active:scale-98 ${btnStyle}`}
                >
                  <span className={`w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-xl border text-sm font-extrabold font-mono ${badgeStyle}`}>
                    {optionLetters[idx]}
                  </span>
                  <span className="text-sm sm:text-base font-medium flex-1">
                    {optText}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Explanation Banner with "Explain Like I'm 10" Button */}
          {isAnswerRevealed && (
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/95 border-2 border-amber-500/50 shadow-xl backdrop-blur-md animate-fade-in space-y-3">
              <div className="flex items-start gap-3">
                {selectedOption === currentQ.correctIndex ? (
                  <CheckCircle className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-6 h-6 text-rose-400 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-cinzel text-sm sm:text-base font-bold text-amber-300">
                      {selectedOption === currentQ.correctIndex ? 'Sahi Jawab! (Correct Answer)' : 'Galat Jawab! (Incorrect Answer)'}
                    </span>
                    <span className="text-xs text-amber-200/80 font-mono">
                      Level {currentLevelNumber} Prize: {currentPrize.formattedAmount}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    <span className="font-semibold text-amber-200">Fact: </span>
                    {currentQ.explanation}
                  </p>
                </div>
              </div>

              {/* Strike Warning if answered wrong or timed out but lives remain */}
              {selectedOption !== currentQ.correctIndex && lives > 0 && !isGameOver && (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-950/70 border border-rose-500/40 text-rose-200 text-xs font-semibold animate-fade-in">
                  <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span>
                    Strike recorded! You still have <strong className="text-rose-300 font-bold">{lives} of 3 lives</strong> remaining. Keep your focus and proceed to the next question!
                  </span>
                </div>
              )}

              {/* Action Buttons Row */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-3">
                <button
                  onClick={handleToggleEli10}
                  className="px-3 py-1.5 rounded-xl bg-purple-950/60 hover:bg-purple-900/80 border border-purple-400/40 text-purple-200 text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                >
                  <Baby className="w-4 h-4 text-purple-300" />
                  <span>{eli10Open ? 'Hide Simple Explanation' : "Explain like I'm 10"}</span>
                </button>

                {!isGameOver && currentLevelNumber < 15 && (
                  <button
                    onClick={handleNextQuestion}
                    className={`px-5 py-2.5 rounded-xl font-cinzel font-black text-xs sm:text-sm tracking-wider flex items-center gap-2 shadow-lg transition-all active:scale-95 ${
                      selectedOption === currentQ.correctIndex
                        ? 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 text-slate-950 shadow-amber-500/30'
                        : 'bg-gradient-to-r from-rose-500 via-amber-500 to-yellow-500 hover:from-rose-400 hover:to-amber-400 text-slate-950 shadow-rose-500/30'
                    }`}
                  >
                    <span>
                      {selectedOption === currentQ.correctIndex
                        ? `Next for ${PRIZE_LADDER[currentLevelIndex + 1]?.formattedAmount}`
                        : `Next Question (${lives} Lives Remaining)`}
                    </span>
                    <ChevronRight className="w-4 h-4 stroke-[3]" />
                  </button>
                )}
              </div>

              {/* ELI10 Expanded Card */}
              {eli10Open && (
                <div className="p-3.5 rounded-xl bg-purple-950/40 border border-purple-500/40 text-xs sm:text-sm text-purple-100 animate-fade-in space-y-1">
                  <div className="flex items-center gap-1.5 text-purple-300 font-bold uppercase tracking-wider text-[11px]">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    Simple Analogy for a 10-Year-Old:
                  </div>
                  {isEli10Loading ? (
                    <div className="text-xs text-purple-300 italic animate-pulse">
                      Consulting friendly teacher...
                    </div>
                  ) : (
                    <p className="leading-relaxed">{eli10Text}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Desktop Prize Ladder */}
        <div className="hidden lg:block">
          <PrizeLadder currentLevel={currentLevelNumber} />
        </div>
      </main>

      {/* Mobile Drawer Prize Ladder */}
      {isLadderMobileOpen && (
        <PrizeLadder
          currentLevel={currentLevelNumber}
          isMobileOpen={isLadderMobileOpen}
          onCloseMobile={() => setIsLadderMobileOpen(false)}
        />
      )}

      {/* Audience Poll Modal */}
      {showAudienceModal && (
        <AudiencePollModal
          options={currentQ.options}
          correctIndex={currentQ.correctIndex}
          difficulty={currentQ.difficulty}
          onClose={() => setShowAudienceModal(false)}
        />
      )}

      {/* Quit Confirmation Modal */}
      {showQuitModal && (
        <QuitConfirmModal
          currentAmount={getCurrentGuaranteedEarnings().formatted}
          onConfirm={handleConfirmQuit}
          onCancel={() => setShowQuitModal(false)}
        />
      )}

      {/* Game Over Screen */}
      {isGameOver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-fade-in overflow-y-auto">
          <div className="relative w-full max-w-lg my-8 bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-950 border-2 border-amber-500 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-amber-500/30 text-center text-slate-100">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 shadow-xl shadow-amber-500/40">
              {gameOverReason === 'WON' ? (
                <Sparkles className="w-12 h-12 text-slate-950 animate-spin" />
              ) : (
                <Trophy className="w-10 h-10 text-slate-950" />
              )}
            </div>

            <h2 className="font-cinzel text-2xl sm:text-3xl font-black text-amber-300 tracking-wider mb-2">
              {gameOverReason === 'WON'
                ? 'MAHA CROREPATI!'
                : gameOverReason === 'QUIT'
                ? 'GAME OVER - CASHED OUT'
                : gameOverReason === 'TIMEOUT'
                ? 'SAMAY SAMAPT! (TIME UP)'
                : 'AFSOS! GALAT JAWAB'}
            </h2>

            {/* Total Prize Won Box */}
            <div className="bg-amber-500/15 border-2 border-amber-400/50 rounded-2xl p-4 sm:p-5 mb-5 shadow-inner">
              <span className="text-xs uppercase font-bold text-amber-300 tracking-widest block">
                Total Cash Winnings
              </span>
              <span className="font-cinzel text-3xl sm:text-4xl font-black text-gold-gradient block mt-1">
                {finalFormattedEarnings}
              </span>
              <div className="mt-1 text-xs text-amber-200/70">
                Reached Level {currentLevelNumber} of 15
              </div>
            </div>

            {/* AI Weak-Topic Analysis Button */}
            <div className="mb-6">
              <button
                onClick={() => setShowWeakAnalysisModal(true)}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-500/30 transition flex items-center justify-center gap-2 border border-purple-400/50"
              >
                <Brain className="w-5 h-5 text-purple-200 animate-pulse" />
                <span>
                  {isAnalyzingWeakTopics ? 'Analyzing Weak Topics...' : 'View AI Weak-Topic Analysis & Revision Tips'}
                </span>
              </button>
            </div>

            {/* Action Buttons: Play Again & Home */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={onPlayAgain}
                className="flex-1 py-3 px-6 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 font-cinzel font-black text-slate-950 text-sm shadow-lg shadow-amber-500/30 transition flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" /> Play Again
              </button>
              <button
                onClick={onHome}
                className="flex-1 py-3 px-6 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-sm font-bold transition flex items-center justify-center gap-2"
              >
                <Home className="w-4 h-4" /> Back to Home
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Weak Topic Report Modal */}
      {showWeakAnalysisModal && weakReport && (
        <WeakTopicModal
          report={weakReport}
          onClose={() => setShowWeakAnalysisModal(false)}
          onPlayAgain={onPlayAgain}
        />
      )}
    </div>
  );
};
