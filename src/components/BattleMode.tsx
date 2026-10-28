import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Swords,
  Heart,
  ShieldAlert,
  Crown,
  RotateCcw,
  Home,
  CheckCircle,
  Volume2,
  VolumeX,
  Flame,
  Zap,
  Baby,
  Brain,
  Sparkles,
} from 'lucide-react';
import {
  QuizQuestion,
  BattlePlayer,
  TopicType,
  LanguageType,
  QuestionSessionResult,
  WeakTopicReport,
} from '../types/quiz';
import { soundEffects } from '../utils/soundEffects';
import { AIHostCorner } from './AIHostCorner';
import { WeakTopicModal } from './WeakTopicModal';
import { generateClientWeakAnalysis } from '../data/questionVault';

interface BattleModeProps {
  questions: QuizQuestion[];
  topic: TopicType;
  customTopic?: string;
  language: LanguageType;
  player1Name: string;
  player2Name: string;
  onHome: () => void;
  onPlayAgain: () => void;
}

export const BattleMode: React.FC<BattleModeProps> = ({
  questions,
  topic,
  customTopic,
  language,
  player1Name,
  player2Name,
  onHome,
  onPlayAgain,
}) => {
  const [battleState, setBattleState] = useState<'VS_INTRO' | 'FIGHTING' | 'WINNER'>('VS_INTRO');
  const [currentRound, setCurrentRound] = useState<number>(0); // 0 to 19

  const activePlayerId: 'p1' | 'p2' = currentRound % 2 === 0 ? 'p1' : 'p2';

  const [p1, setP1] = useState<BattlePlayer>({
    id: 'p1',
    name: player1Name || 'Player 1',
    hp: 100,
    maxHp: 100,
    correctCount: 0,
    damageDealt: 0,
    avatarSeed: 1,
  });

  const [p2, setP2] = useState<BattlePlayer>({
    id: 'p2',
    name: player2Name || 'Player 2',
    hp: 100,
    maxHp: 100,
    correctCount: 0,
    damageDealt: 0,
    avatarSeed: 2,
  });

  const currentQ: QuizQuestion = questions[currentRound] || questions[0];

  const getPointsForDifficulty = (diff: string): number => {
    switch (diff) {
      case 'basic': return 10;
      case 'intermediate': return 20;
      case 'advanced': return 30;
      case 'expert': return 50;
      default: return 20;
    }
  };

  const currentPoints = getPointsForDifficulty(currentQ.difficulty);

  // Turn States
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerLocked, setIsAnswerLocked] = useState<boolean>(false);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState<boolean>(false);
  const [turnDamageOutcome, setTurnDamageOutcome] = useState<{
    targetName: string;
    damage: number;
    isSelfDamage: boolean;
  } | null>(null);

  const [p1Hurt, setP1Hurt] = useState<boolean>(false);
  const [p2Hurt, setP2Hurt] = useState<boolean>(false);

  const [winner, setWinner] = useState<BattlePlayer | 'DRAW' | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(soundEffects.getMuted());

  // "Explain like I'm 10" state
  const [eli10Open, setEli10Open] = useState<boolean>(false);
  const [eli10Text, setEli10Text] = useState<string>('');
  const [isEli10Loading, setIsEli10Loading] = useState<boolean>(false);

  // Weak Topic Analysis
  const [battleHistory, setBattleHistory] = useState<QuestionSessionResult[]>([]);
  const [weakReport, setWeakReport] = useState<WeakTopicReport | null>(null);
  const [showWeakModal, setShowWeakModal] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  // Host Dialogue
  const [hostLine, setHostLine] = useState<string>(
    'Dono maharati aamne-saamne hain! 100 HP ke sath yeh ghamasan yuddh shuru hota hai!'
  );
  const [isHostSpeaking, setIsHostSpeaking] = useState<boolean>(false);

  const updateHostDialogue = (line: string) => {
    setHostLine(line);
    setIsHostSpeaking(true);
    setTimeout(() => setIsHostSpeaking(false), 2500);
  };

  const getTimeForRound = (roundIdx: number): number => {
    if (roundIdx < 5) return 30; // Rounds 1-5: 30s (Basic)
    if (roundIdx < 10) return 45; // Rounds 6-10: 45s (Intermediate)
    if (roundIdx < 16) return 60; // Rounds 11-16: 60s (Advanced)
    return 90; // Rounds 17-20: 90s (Expert)
  };

  const [timeLeft, setTimeLeft] = useState<number>(getTimeForRound(0));
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    soundEffects.playBattleStart();
  }, []);

  useEffect(() => {
    if (battleState !== 'FIGHTING' || isAnswerLocked || isAnswerRevealed) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleTurnTimeout();
          return 0;
        }
        if (prev <= 7) {
          soundEffects.playTick(prev % 2 === 0);
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [battleState, currentRound, isAnswerLocked, isAnswerRevealed]);

  const handleTurnTimeout = () => {
    handleAnswerEvaluation(null);
  };

  const handleSelectOption = (idx: number) => {
    if (isAnswerLocked || isAnswerRevealed || battleState !== 'FIGHTING') return;

    setSelectedOption(idx);
    setIsAnswerLocked(true);
    soundEffects.playLock();
    updateHostDialogue(`Taala lagaya ja raha hai! Kya yeh hamla seedha dharashayi karega?`);

    setTimeout(() => {
      handleAnswerEvaluation(idx);
    }, 1200);
  };

  const handleAnswerEvaluation = (chosenIdx: number | null) => {
    setIsAnswerRevealed(true);
    const isCorrect = chosenIdx !== null && chosenIdx === currentQ.correctIndex;
    const isP1Turn = activePlayerId === 'p1';
    const activeAttacker = isP1Turn ? p1 : p2;

    const record: QuestionSessionResult = {
      questionNumber: currentRound + 1,
      question: currentQ.question,
      topicTag: currentQ.topicTag || 'Core Topic',
      difficulty: currentQ.difficulty,
      userChoice: chosenIdx !== null ? currentQ.options[chosenIdx] : 'Timeout',
      correctChoice: currentQ.options[currentQ.correctIndex],
      isCorrect,
      explanation: currentQ.explanation,
    };
    const updated = [...battleHistory, record];
    setBattleHistory(updated);

    if (isCorrect) {
      soundEffects.playCorrect();
      soundEffects.playAttack();

      const damage = currentPoints;
      setTurnDamageOutcome({
        targetName: isP1Turn ? p2.name : p1.name,
        damage,
        isSelfDamage: false,
      });

      updateHostDialogue(`SATEEK PRAHAAR! ${activeAttacker.name} ne lagaya ${damage} HP ka zordar jhatka!`);

      if (isP1Turn) {
        setP2Hurt(true);
        setTimeout(() => setP2Hurt(false), 800);
        setP1((prev) => ({
          ...prev,
          correctCount: prev.correctCount + 1,
          damageDealt: prev.damageDealt + damage,
        }));
        setP2((prev) => ({ ...prev, hp: Math.max(0, prev.hp - damage) }));
      } else {
        setP1Hurt(true);
        setTimeout(() => setP1Hurt(false), 800);
        setP2((prev) => ({
          ...prev,
          correctCount: prev.correctCount + 1,
          damageDealt: prev.damageDealt + damage,
        }));
        setP1((prev) => ({ ...prev, hp: Math.max(0, prev.hp - damage) }));
      }
    } else {
      soundEffects.playWrong();
      const selfDamage = Math.round(currentPoints / 2);
      setTurnDamageOutcome({
        targetName: isP1Turn ? p1.name : p2.name,
        damage: selfDamage,
        isSelfDamage: true,
      });

      updateHostDialogue(`CHOUK! Missfire hua! ${activeAttacker.name} ko laga ${selfDamage} HP aatmaghati nuksaan!`);

      if (isP1Turn) {
        setP1Hurt(true);
        setTimeout(() => setP1Hurt(false), 800);
        setP1((prev) => ({ ...prev, hp: Math.max(0, prev.hp - selfDamage) }));
      } else {
        setP2Hurt(true);
        setTimeout(() => setP2Hurt(false), 800);
        setP2((prev) => ({ ...prev, hp: Math.max(0, prev.hp - selfDamage) }));
      }
    }
  };

  const handleNextTurn = () => {
    if (p1.hp <= 0 || p2.hp <= 0 || currentRound >= 19) {
      concludeBattle();
      return;
    }

    const nextRound = currentRound + 1;
    setCurrentRound(nextRound);
    setSelectedOption(null);
    setIsAnswerLocked(false);
    setIsAnswerRevealed(false);
    setTurnDamageOutcome(null);
    setEli10Open(false);
    setEli10Text('');
    setTimeLeft(getTimeForRound(nextRound));

    const nextAttackerName = nextRound % 2 === 0 ? p1.name : p2.name;
    updateHostDialogue(`Ab baari hai ${nextAttackerName} ki! Dhyan se vikalp chuniye.`);
  };

  const concludeBattle = () => {
    soundEffects.playVictoryFanfare();
    triggerWinnerConfetti();

    let battleWinner: BattlePlayer | 'DRAW' = 'DRAW';
    if (p1.hp > p2.hp) {
      battleWinner = p1;
    } else if (p2.hp > p1.hp) {
      battleWinner = p2;
    }
    setWinner(battleWinner);
    setBattleState('WINNER');

    if (battleWinner !== 'DRAW') {
      updateHostDialogue(`KYA SHANDAAR JEET! ${battleWinner.name} ne Crorepati Battle jeet li hai!`);
    } else {
      updateHostDialogue('Dono yoddha barabar rahe! Ek aitihasik barabari!');
    }

    // Trigger weak topic analysis
    triggerBattleWeakAnalysis(battleHistory);
  };

  const triggerBattleWeakAnalysis = async (history: QuestionSessionResult[]) => {
    setIsAnalyzing(true);
    try {
      const res = await fetch('/api/analyze-weak-topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionResults: history,
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
      setWeakReport(generateClientWeakAnalysis(history, customTopic || topic));
    } catch {
      setWeakReport(generateClientWeakAnalysis(history, customTopic || topic));
    } finally {
      setIsAnalyzing(false);
    }
  };

  // ELI10 Toggle
  const handleToggleEli10 = async () => {
    if (eli10Open) {
      setEli10Open(false);
      return;
    }

    setEli10Open(true);
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
      setEli10Text(data.eli10 || 'Like sharing candies with friends!');
    } catch {
      setEli10Text(`It's like a balanced see-saw! "${currentQ.options[currentQ.correctIndex]}" keeps both sides steady.`);
    } finally {
      setIsEli10Loading(false);
    }
  };

  useEffect(() => {
    if (isAnswerRevealed && (p1.hp <= 0 || p2.hp <= 0)) {
      const t = setTimeout(() => {
        concludeBattle();
      }, 2500);
      return () => clearTimeout(t);
    }
  }, [p1.hp, p2.hp, isAnswerRevealed]);

  const triggerWinnerConfetti = () => {
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#3b82f6', '#f59e0b', '#ec4899', '#10b981'],
      });
    } catch {}
  };

  const handleToggleMute = () => {
    const muted = soundEffects.toggleMute();
    setIsMuted(muted);
  };

  const optionLetters = ['A', 'B', 'C', 'D'];

  // VS Intro
  if (battleState === 'VS_INTRO') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-4xl bg-slate-900/90 border-2 border-amber-500 rounded-3xl p-6 sm:p-10 shadow-2xl shadow-amber-500/20 text-center backdrop-blur-xl relative overflow-hidden">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-400 text-amber-300 font-cinzel text-xs sm:text-sm font-bold uppercase tracking-widest mb-6">
            <Swords className="w-4 h-4" /> 2-Player Pass & Play Battle
          </div>

          <h1 className="font-cinzel text-3xl sm:text-5xl font-black text-amber-300 tracking-wider mb-6">
            DUEL OF MINDS
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center my-6">
            <div className="p-6 rounded-2xl bg-gradient-to-b from-blue-950/80 to-slate-900 border-2 border-blue-500/60 shadow-xl shadow-blue-500/20">
              <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-blue-600/30 border border-blue-400 flex items-center justify-center text-blue-300 font-black text-2xl">
                {p1.name.slice(0, 2).toUpperCase()}
              </div>
              <h3 className="font-cinzel text-xl font-bold text-blue-300">{p1.name}</h3>
              <div className="mt-3 flex items-center justify-center gap-2 text-rose-400 font-mono font-bold text-sm">
                <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
                <span>100 HP</span>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 via-rose-500 to-amber-600 flex items-center justify-center shadow-2xl shadow-rose-500/50 animate-pulse">
                  <span className="font-cinzel text-3xl font-black text-slate-950 tracking-tighter">
                    VS
                  </span>
                </div>
                <Flame className="w-8 h-8 text-amber-400 absolute -top-4 -right-2 animate-bounce" />
              </div>
              <p className="text-xs text-amber-200/80 mt-3 font-semibold">20 Rounds Total</p>
            </div>

            <div className="p-6 rounded-2xl bg-gradient-to-b from-purple-950/80 to-slate-900 border-2 border-purple-500/60 shadow-xl shadow-purple-500/20">
              <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-purple-600/30 border border-purple-400 flex items-center justify-center text-purple-300 font-black text-2xl">
                {p2.name.slice(0, 2).toUpperCase()}
              </div>
              <h3 className="font-cinzel text-xl font-bold text-purple-300">{p2.name}</h3>
              <div className="mt-3 flex items-center justify-center gap-2 text-rose-400 font-mono font-bold text-sm">
                <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
                <span>100 HP</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              soundEffects.playBattleStart();
              setBattleState('FIGHTING');
            }}
            className="px-10 py-4 rounded-2xl font-cinzel font-black text-slate-950 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 shadow-xl shadow-amber-500/40 text-xl tracking-wider transition-all transform active:scale-95"
          >
            COMMENCE BATTLE!
          </button>
        </div>
      </div>
    );
  }

  // Winner Screen
  if (battleState === 'WINNER') {
    const isP1Win = winner !== 'DRAW' && winner?.id === 'p1';
    const isP2Win = winner !== 'DRAW' && winner?.id === 'p2';

    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-2xl bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-950 border-2 border-amber-500 rounded-3xl p-6 sm:p-10 shadow-2xl shadow-amber-500/30 text-center backdrop-blur-xl animate-fade-in">
          <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-tr from-amber-400 via-yellow-300 to-amber-500 flex items-center justify-center text-slate-950 shadow-2xl shadow-amber-500/50">
            <Crown className="w-14 h-14 text-slate-950" />
          </div>

          <h2 className="font-cinzel text-3xl sm:text-4xl font-black text-amber-300 tracking-wider mb-2">
            {winner === 'DRAW'
              ? 'HONORABLE DRAW!'
              : `${winner?.name.toUpperCase()} WINS!`}
          </h2>

          <p className="text-sm text-slate-300 mb-6">
            {winner === 'DRAW'
              ? 'Both players fought with tremendous intellect!'
              : `A glorious triumph! ${winner?.name} proved their intellectual supremacy!`}
          </p>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className={`p-4 rounded-2xl border-2 ${isP1Win ? 'bg-blue-950/60 border-amber-400 shadow-lg shadow-blue-500/30' : 'bg-slate-950/60 border-slate-800'}`}>
              <div className="text-sm font-bold text-blue-300">{p1.name}</div>
              <div className="text-2xl font-black text-white font-mono mt-1">{p1.hp} HP</div>
              <div className="text-xs text-slate-400 mt-2">Correct: {p1.correctCount} • Damage: {p1.damageDealt}</div>
            </div>

            <div className={`p-4 rounded-2xl border-2 ${isP2Win ? 'bg-purple-950/60 border-amber-400 shadow-lg shadow-purple-500/30' : 'bg-slate-950/60 border-slate-800'}`}>
              <div className="text-sm font-bold text-purple-300">{p2.name}</div>
              <div className="text-2xl font-black text-white font-mono mt-1">{p2.hp} HP</div>
              <div className="text-xs text-slate-400 mt-2">Correct: {p2.correctCount} • Damage: {p2.damageDealt}</div>
            </div>
          </div>

          {/* AI Weak Topic Analysis Button for Battle */}
          <div className="mb-6">
            <button
              onClick={() => setShowWeakModal(true)}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-500/30 transition flex items-center justify-center gap-2 border border-purple-400/50"
            >
              <Brain className="w-5 h-5 text-purple-200 animate-pulse" />
              <span>{isAnalyzing ? 'Analyzing Battle Concepts...' : 'View Battle Weak-Topic Analysis & Formulas'}</span>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onPlayAgain}
              className="flex-1 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 font-cinzel font-black text-slate-950 shadow-lg shadow-amber-500/30 transition flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" /> Rematch
            </button>
            <button
              onClick={onHome}
              className="flex-1 py-3.5 px-6 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold transition flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4" /> Back to Home
            </button>
          </div>
        </div>

        {showWeakModal && weakReport && (
          <WeakTopicModal
            report={weakReport}
            onClose={() => setShowWeakModal(false)}
            onPlayAgain={onPlayAgain}
          />
        )}
      </div>
    );
  }

  // Fighting Screen
  const activePlayer = activePlayerId === 'p1' ? p1 : p2;

  return (
    <div className="min-h-screen flex flex-col justify-between p-3 sm:p-5 lg:p-6 select-none max-w-6xl mx-auto w-full">
      <header className="pb-4 border-b border-amber-500/20">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Swords className="w-6 h-6 text-amber-400" />
            <h2 className="font-cinzel text-lg sm:text-xl font-black text-amber-300">
              BATTLE ARENA
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              Round {currentRound + 1}/20
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div
              className={`px-3 py-1 rounded-xl font-mono text-sm font-bold border ${timeLeft <= 7 ? 'bg-rose-950 border-rose-500 text-rose-300 animate-pulse' : 'bg-slate-900 border-amber-500/40 text-amber-300'}`}
              title={`Timer: ${timeLeft}s remaining out of ${getTimeForRound(currentRound)}s for this round`}
            >
              ⏱️ {timeLeft}s <span className="text-[10px] text-amber-400/60 font-normal">/{getTimeForRound(currentRound)}s</span>
            </div>

            <button
              onClick={handleToggleMute}
              className="p-2 rounded-xl bg-slate-900 border border-amber-500/30 text-amber-300 hover:text-white"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <button
              onClick={onHome}
              className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700"
            >
              Exit
            </button>
          </div>
        </div>

        {/* 2 Health Bars */}
        <div className="grid grid-cols-2 gap-4 sm:gap-6">
          <div
            className={`p-3 sm:p-4 rounded-2xl border-2 transition-all ${
              activePlayerId === 'p1'
                ? 'bg-blue-950/60 border-blue-400 shadow-lg shadow-blue-500/30'
                : 'bg-slate-950/60 border-slate-800 opacity-80'
            } ${p1Hurt ? 'animate-shake border-red-500 bg-red-950/60' : ''}`}
          >
            <div className="flex items-center justify-between text-xs sm:text-sm font-bold mb-1.5">
              <span className="flex items-center gap-1.5 text-blue-300">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                {p1.name} {activePlayerId === 'p1' && '(ATTACKING)'}
              </span>
              <span className="font-mono text-rose-400 flex items-center gap-1">
                <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                {p1.hp}/100 HP
              </span>
            </div>
            <div className="h-3 sm:h-3.5 bg-slate-950 rounded-full border border-slate-700 overflow-hidden p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  p1.hp > 50
                    ? 'bg-gradient-to-r from-blue-500 to-emerald-400'
                    : p1.hp > 25
                    ? 'bg-gradient-to-r from-yellow-500 to-amber-500'
                    : 'bg-gradient-to-r from-rose-600 to-red-600 animate-pulse'
                }`}
                style={{ width: `${Math.max(0, p1.hp)}%` }}
              />
            </div>
          </div>

          <div
            className={`p-3 sm:p-4 rounded-2xl border-2 transition-all ${
              activePlayerId === 'p2'
                ? 'bg-purple-950/60 border-purple-400 shadow-lg shadow-purple-500/30'
                : 'bg-slate-950/60 border-slate-800 opacity-80'
            } ${p2Hurt ? 'animate-shake border-red-500 bg-red-950/60' : ''}`}
          >
            <div className="flex items-center justify-between text-xs sm:text-sm font-bold mb-1.5">
              <span className="flex items-center gap-1.5 text-purple-300">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
                {p2.name} {activePlayerId === 'p2' && '(ATTACKING)'}
              </span>
              <span className="font-mono text-rose-400 flex items-center gap-1">
                <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                {p2.hp}/100 HP
              </span>
            </div>
            <div className="h-3 sm:h-3.5 bg-slate-950 rounded-full border border-slate-700 overflow-hidden p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  p2.hp > 50
                    ? 'bg-gradient-to-r from-purple-500 to-pink-400'
                    : p2.hp > 25
                    ? 'bg-gradient-to-r from-yellow-500 to-amber-500'
                    : 'bg-gradient-to-r from-rose-600 to-red-600 animate-pulse'
                }`}
                style={{ width: `${Math.max(0, p2.hp)}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Arena */}
      <main className="my-auto py-4 space-y-4 max-w-3xl mx-auto w-full">
        {/* AI Host Commentary Box */}
        <AIHostCorner hostLine={hostLine} isHostSpeaking={isHostSpeaking} />

        {/* Turn Prompt Banner */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/15 border border-amber-400 text-amber-300 text-xs sm:text-sm font-bold uppercase tracking-wider">
            <Zap className="w-4 h-4 text-amber-400 animate-bounce" />
            <span>It's {activePlayer.name}'s Turn to Strike!</span>
            <span>•</span>
            <span className="text-amber-200">
              Difficulty: {currentQ.difficulty.toUpperCase()} ({currentPoints} PTS)
            </span>
          </div>
        </div>

        {/* Question Box */}
        <div className="bg-slate-900/90 border-2 border-amber-500/70 rounded-3xl p-5 sm:p-7 text-center shadow-2xl shadow-amber-500/15 backdrop-blur-md">
          <h2 className="text-base sm:text-xl font-bold text-slate-100 font-cinzel leading-snug">
            {currentQ.question}
          </h2>
        </div>

        {/* 4 Interactive Option Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {currentQ.options.map((opt, idx) => {
            const isSelected = selectedOption === idx;
            const isCorrect = idx === currentQ.correctIndex;

            let btnStyle = 'bg-slate-900/80 border-amber-500/40 text-slate-200 hover:border-amber-400 hover:text-white';
            let badgeStyle = 'bg-slate-800 border-amber-500/40 text-amber-300';

            if (isAnswerRevealed) {
              if (isCorrect) {
                btnStyle = 'bg-gradient-to-r from-emerald-600 to-green-700 border-emerald-300 text-white shadow-xl shadow-emerald-500/40 font-bold scale-[1.02] correct-glow';
                badgeStyle = 'bg-emerald-950 border-emerald-300 text-emerald-200';
              } else if (isSelected && !isCorrect) {
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
                disabled={isAnswerLocked || isAnswerRevealed}
                className={`flex items-center gap-3 p-3.5 sm:p-4 rounded-2xl border-2 text-left transition-all duration-200 transform active:scale-98 ${btnStyle}`}
              >
                <span className={`w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-xl border text-sm font-extrabold font-mono ${badgeStyle}`}>
                  {optionLetters[idx]}
                </span>
                <span className="text-sm sm:text-base font-medium flex-1">
                  {opt}
                </span>
              </button>
            );
          })}
        </div>

        {/* Turn Evaluation with "Explain like I'm 10" Button */}
        {isAnswerRevealed && (
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/95 border-2 border-amber-500/50 shadow-2xl backdrop-blur-md animate-fade-in space-y-3">
            <div className="flex items-start gap-3">
              {selectedOption === currentQ.correctIndex ? (
                <CheckCircle className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-0.5" />
              ) : (
                <ShieldAlert className="w-6 h-6 text-rose-400 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-cinzel text-sm sm:text-base font-bold text-amber-300">
                    {selectedOption === currentQ.correctIndex
                      ? `DIRECT HIT! ${activePlayer.name} deals ${turnDamageOutcome?.damage} Damage!`
                      : `MISSFIRE! ${activePlayer.name} takes ${turnDamageOutcome?.damage} Self-Damage!`}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  <span className="font-semibold text-amber-200">Fact: </span>
                  {currentQ.explanation}
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <button
                onClick={handleToggleEli10}
                className="px-3 py-1.5 rounded-xl bg-purple-950/60 hover:bg-purple-900/80 border border-purple-400/40 text-purple-200 text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
              >
                <Baby className="w-4 h-4 text-purple-300" />
                <span>{eli10Open ? 'Hide Simple Explanation' : "Explain like I'm 10"}</span>
              </button>

              <button
                onClick={handleNextTurn}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 font-cinzel font-black text-slate-950 text-xs sm:text-sm tracking-wider flex items-center gap-2 shadow-lg shadow-amber-500/30 transition-all active:scale-95"
              >
                <span>Pass to Next Turn</span>
                <Swords className="w-4 h-4" />
              </button>
            </div>

            {eli10Open && (
              <div className="p-3.5 rounded-xl bg-purple-950/40 border border-purple-500/40 text-xs sm:text-sm text-purple-100 animate-fade-in space-y-1">
                <div className="flex items-center gap-1.5 text-purple-300 font-bold uppercase tracking-wider text-[11px]">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  Simple Analogy:
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
      </main>

      <footer className="text-center text-xs text-slate-500 py-2">
        Quiz Battle: Crorepati Edition • 2-Player Pass and Play Showdown
      </footer>
    </div>
  );
};
