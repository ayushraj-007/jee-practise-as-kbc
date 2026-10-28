/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Swords,
  Sparkles,
  Volume2,
  VolumeX,
  RotateCcw,
  AlertTriangle,
  Play,
  Shield,
  HelpCircle,
  Users,
  Flame,
  Zap,
} from 'lucide-react';
import { GameMode, QuizQuestion, TopicType, LanguageType } from './types/quiz';
import { soundEffects } from './utils/soundEffects';
import { getClientVaultQuestions } from './data/questionVault';
import { GameSetupModal } from './components/GameSetupModal';
import { KBCMode } from './components/KBCMode';
import { BattleMode } from './components/BattleMode';

export default function App() {
  const [currentMode, setCurrentMode] = useState<GameMode>('HOME');
  const [targetSetupMode, setTargetSetupMode] = useState<'KBC' | 'BATTLE'>('KBC');

  // Selected configurations
  const [topic, setTopic] = useState<TopicType>('JEE Mixed (PCM)');
  const [customTopic, setCustomTopic] = useState<string | undefined>(undefined);
  const [notesText, setNotesText] = useState<string | undefined>(undefined);
  const [pdfBase64, setPdfBase64] = useState<string | undefined>(undefined);
  const [language, setLanguage] = useState<LanguageType>('English');
  const [p1Name, setP1Name] = useState<string>('Aspirant 1');
  const [p2Name, setP2Name] = useState<string>('Aspirant 2');

  // Questions and Loading/Error state
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // Sound and High score
  const [isMuted, setIsMuted] = useState<boolean>(soundEffects.getMuted());
  const [highScore, setHighScore] = useState<number>(0);

  // Load high score
  useEffect(() => {
    const saved = localStorage.getItem('crorepati_high_score');
    if (saved) {
      setHighScore(parseInt(saved, 10));
    }
  }, [currentMode]);

  const toggleSound = () => {
    const muted = soundEffects.toggleMute();
    setIsMuted(muted);
  };

  const formatCurrency = (val: number) => {
    return '₹ ' + val.toLocaleString('en-IN');
  };

  // Launch Setup Modal
  const openSetup = (mode: 'KBC' | 'BATTLE') => {
    soundEffects.playLock();
    setTargetSetupMode(mode);
    setCurrentMode(mode === 'KBC' ? 'KBC_SETUP' : 'BATTLE_SETUP');
  };

  // Fetch Questions from backend Gemini service
  const startGameWithConfig = async (
    chosenTopic: TopicType,
    chosenLanguage: LanguageType,
    newCustomTopic?: string,
    newNotesText?: string,
    newPdfBase64?: string,
    customP1?: string,
    customP2?: string
  ) => {
    setTopic(chosenTopic);
    setLanguage(chosenLanguage);
    setCustomTopic(newCustomTopic);
    setNotesText(newNotesText);
    setPdfBase64(newPdfBase64);
    if (customP1) setP1Name(customP1);
    if (customP2) setP2Name(customP2);

    setIsLoading(true);
    setErrorNotice(null);

    const isKBC = targetSetupMode === 'KBC';
    const activeLabel = newCustomTopic || (newNotesText ? 'Study Notes' : chosenTopic);

    setLoadingMessage(
      isKBC
        ? `Consulting Gemini AI to prepare 15 high-stakes questions on "${activeLabel}" in ${chosenLanguage}...`
        : `Generating 20 competitive battle questions for ${customP1 || 'Player 1'} vs ${customP2 || 'Player 2'}...`
    );

    try {
      const endpoint = isKBC ? '/api/generate-kbc' : '/api/generate-battle';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: chosenTopic,
          customTopic: newCustomTopic,
          language: chosenLanguage,
          notesText: newNotesText,
          pdfBase64: newPdfBase64,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.questions && data.questions.length > 0) {
          setQuestions(data.questions);
          setCurrentMode(isKBC ? 'KBC_PLAY' : 'BATTLE_PLAY');
          return;
        }
      }
      // If response not ok or questions empty, load local vault
      const fallbackQuestions = getClientVaultQuestions(newCustomTopic || chosenTopic);
      setQuestions(fallbackQuestions);
      setCurrentMode(isKBC ? 'KBC_PLAY' : 'BATTLE_PLAY');
    } catch {
      // Graceful offline/network fallback: immediately launch from local question vault
      const fallbackQuestions = getClientVaultQuestions(newCustomTopic || chosenTopic);
      setQuestions(fallbackQuestions);
      setCurrentMode(isKBC ? 'KBC_PLAY' : 'BATTLE_PLAY');
    } finally {
      setIsLoading(false);
    }
  };

  // Retry generating questions
  const handleRetry = () => {
    startGameWithConfig(topic, language, customTopic, notesText, pdfBase64, p1Name, p2Name);
  };

  return (
    <div className="min-h-screen bg-[#050b1a] text-slate-100 flex flex-col justify-between relative overflow-hidden font-sans">
      {/* Dynamic Background Studio Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-96 studio-beam pointer-events-none" />
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Global Top Navbar */}
      <header className="relative z-20 flex items-center justify-between p-4 sm:p-6 max-w-7xl mx-auto w-full">
        <div
          onClick={() => setCurrentMode('HOME')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 p-0.5 shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-amber-400">
              <Trophy className="w-6 h-6" />
            </div>
          </div>
          <div>
            <h1 className="font-cinzel text-lg sm:text-2xl font-black text-amber-300 tracking-wider">
              QUIZ BATTLE
            </h1>
            <p className="text-[10px] sm:text-xs font-semibold text-amber-200/70 tracking-widest uppercase">
              Crorepati Edition
            </p>
          </div>
        </div>

        {/* High Score Badge & Sound Toggle */}
        <div className="flex items-center gap-3">
          {highScore > 0 && (
            <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-400/40 text-amber-300 text-xs font-mono font-bold">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>Record: {formatCurrency(highScore)}</span>
            </div>
          )}

          <button
            onClick={toggleSound}
            aria-label="Toggle sound"
            className="p-2.5 rounded-xl bg-slate-900/80 border border-amber-500/30 text-amber-300 hover:text-white hover:bg-slate-800 transition shadow-sm"
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Dynamic Content Views */}
      <div className="flex-1 flex items-center justify-center relative z-10 w-full">
        {/* Loading Overlay */}
        {isLoading && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fade-in">
            <div className="text-center max-w-md p-8 rounded-3xl bg-slate-900/90 border-2 border-amber-500/60 shadow-2xl shadow-amber-500/20">
              <div className="relative w-24 h-24 mx-auto mb-6">
                <div className="w-24 h-24 rounded-full border-4 border-amber-500/20 border-t-amber-400 animate-spin" />
                <Sparkles className="w-10 h-10 text-amber-400 absolute inset-0 m-auto animate-pulse" />
              </div>
              <h3 className="font-cinzel text-xl font-bold text-amber-300 mb-2">
                GENERATING FRESH QUESTIONS
              </h3>
              <p className="text-sm text-slate-300 mb-4">{loadingMessage}</p>
              <div className="inline-flex items-center gap-1.5 text-xs text-amber-400/80 font-mono">
                <Zap className="w-3.5 h-3.5" />
                <span>Powered by Gemini 3.8 Flash Engine</span>
              </div>
            </div>
          </div>
        )}

        {/* Error Modal */}
        {errorNotice && !isLoading && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl">
            <div className="text-center max-w-md p-8 rounded-3xl bg-slate-900 border-2 border-rose-500 shadow-2xl text-slate-100">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-rose-500/20 border-2 border-rose-400 flex items-center justify-center text-rose-400">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h3 className="font-cinzel text-xl font-bold text-rose-300 mb-2">
                QUIZ GENERATION NOTICE
              </h3>
              <p className="text-sm text-slate-300 mb-6">{errorNotice}</p>
              <div className="flex gap-3">
                <button
                  onClick={handleRetry}
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-bold hover:brightness-110 transition flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" /> Try Again
                </button>
                <button
                  onClick={() => setCurrentMode('HOME')}
                  className="flex-1 py-3 px-4 rounded-xl bg-slate-800 text-slate-300 font-bold hover:bg-slate-700 transition"
                >
                  Back Home
                </button>
              </div>
            </div>
          </div>
        )}

        {/* HOME SCREEN */}
        {currentMode === 'HOME' && (
          <div className="w-full max-w-5xl mx-auto px-4 py-8 flex flex-col items-center text-center animate-fade-in">
            {/* Grand Logo & Tagline */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/15 border border-amber-400/40 text-amber-300 font-bold text-xs uppercase tracking-widest mb-6">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>JEE MAIN & ADVANCED PYQ ARENA</span>
            </div>

            <h1 className="font-cinzel text-4xl sm:text-6xl lg:text-7xl font-black text-gold-gradient tracking-tight drop-shadow-md mb-4">
              QUIZ BATTLE
            </h1>
            <p className="font-cinzel text-lg sm:text-2xl font-bold text-amber-200/90 tracking-widest uppercase mb-4">
              CROREPATI JEE EDITION
            </p>

            <p className="max-w-xl text-slate-300 text-sm sm:text-base mb-10 leading-relaxed">
              Step onto the ultimate JEE Hot Seat! Climb from <strong className="text-amber-300">Easy JEE Main PYQs</strong> (Q1–5) through <strong className="text-amber-300">Moderate Main</strong> (Q6–10) and <strong className="text-amber-300">Hard Main/Adv</strong> (Q11–14) up to the legendary <strong className="text-rose-400">₹1 Crore JEE Advanced PYQ</strong> (Q15), or challenge a fellow aspirant in a 2-Player JEE combat!
            </p>

            {/* 2 BIG Enticing Game Mode Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl mb-12">
              {/* BUTTON 1: KBC MODE */}
              <button
                onClick={() => openSetup('KBC')}
                className="group relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900/90 via-indigo-950/90 to-slate-950 border-2 border-amber-500/60 p-6 sm:p-8 text-left transition-all duration-300 hover:border-amber-400 hover:scale-[1.02] shadow-2xl shadow-amber-500/15 hover:shadow-amber-500/30 flex flex-col justify-between"
              >
                {/* Ambient glow in button */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all pointer-events-none" />

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-400 flex items-center justify-center text-amber-400 group-hover:bg-amber-400 group-hover:text-slate-950 transition-colors">
                      <Trophy className="w-7 h-7" />
                    </div>
                    <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase">
                      Single Player Solo
                    </span>
                  </div>

                  <h2 className="font-cinzel text-2xl sm:text-3xl font-black text-amber-300 mb-2">
                    JEE KBC MODE
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6">
                    15 progressive PYQ questions: Easy JEE Main PYQs at base to tough JEE Advanced PYQs at the top. Includes 2 Safe Checkpoints, Cash-Out Quit, and 3 lifelines.
                  </p>
                </div>

                <div className="pt-4 border-t border-amber-500/20 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-amber-300/80 font-semibold">
                    <span className="flex items-center gap-1">
                      <Shield className="w-3.5 h-3.5 text-amber-400" /> Q5 & Q10 Safe
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <HelpCircle className="w-3.5 h-3.5 text-amber-400" /> 3 Lifelines
                    </span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold group-hover:translate-x-1 transition-transform">
                    <Play className="w-5 h-5 fill-slate-950" />
                  </div>
                </div>
              </button>

              {/* BUTTON 2: BATTLE MODE */}
              <button
                onClick={() => openSetup('BATTLE')}
                className="group relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900/90 via-purple-950/90 to-slate-950 border-2 border-indigo-500/60 p-6 sm:p-8 text-left transition-all duration-300 hover:border-indigo-400 hover:scale-[1.02] shadow-2xl shadow-indigo-500/15 hover:shadow-indigo-500/30 flex flex-col justify-between"
              >
                {/* Ambient glow in button */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all pointer-events-none" />

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 border border-indigo-400 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-400 group-hover:text-slate-950 transition-colors">
                      <Swords className="w-7 h-7" />
                    </div>
                    <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 uppercase">
                      2 Aspirants • Pass & Play
                    </span>
                  </div>

                  <h2 className="font-cinzel text-2xl sm:text-3xl font-black text-indigo-200 mb-2">
                    JEE BATTLE ARENA
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6">
                    Duel your rival aspirant on the same device with 100 HP! Correct JEE PYQ answers deal 10–50 damage; wrong answers inflict 50% self-damage!
                  </p>
                </div>

                <div className="pt-4 border-t border-indigo-500/20 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-indigo-300/80 font-semibold">
                    <span className="flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 text-rose-400" /> 100 HP Combat
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-indigo-400" /> 20 Rounds Total
                    </span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-indigo-400 text-slate-950 flex items-center justify-center font-bold group-hover:translate-x-1 transition-transform">
                    <Play className="w-5 h-5 fill-slate-950" />
                  </div>
                </div>
              </button>
            </div>

            {/* High Score / Best Earnings Banner */}
            {highScore > 0 && (
              <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-slate-900/80 border border-amber-500/30 text-slate-300 text-xs sm:text-sm">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>
                  All-Time Best Crorepati Prize:{' '}
                  <strong className="text-amber-300 font-mono text-base">
                    {formatCurrency(highScore)}
                  </strong>
                </span>
              </div>
            )}
          </div>
        )}

        {/* SETUP MODALS */}
        {(currentMode === 'KBC_SETUP' || currentMode === 'BATTLE_SETUP') && (
          <GameSetupModal
            mode={targetSetupMode}
            onStart={(chosenTopic, chosenLang, customT, notesT, pdfB64, p1, p2) =>
              startGameWithConfig(chosenTopic, chosenLang, customT, notesT, pdfB64, p1, p2)
            }
            onBack={() => setCurrentMode('HOME')}
          />
        )}

        {/* KBC GAMEPLAY */}
        {currentMode === 'KBC_PLAY' && (
          <KBCMode
            questions={questions}
            topic={topic}
            customTopic={customTopic}
            language={language}
            onHome={() => setCurrentMode('HOME')}
            onPlayAgain={() => startGameWithConfig(topic, language, customTopic, notesText, pdfBase64)}
          />
        )}

        {/* BATTLE GAMEPLAY */}
        {currentMode === 'BATTLE_PLAY' && (
          <BattleMode
            questions={questions}
            topic={topic}
            customTopic={customTopic}
            language={language}
            player1Name={p1Name}
            player2Name={p2Name}
            onHome={() => setCurrentMode('HOME')}
            onPlayAgain={() => startGameWithConfig(topic, language, customTopic, notesText, pdfBase64, p1Name, p2Name)}
          />
        )}
      </div>

      {/* Global Bottom Footer */}
      <footer className="relative z-10 py-4 px-6 text-center text-xs text-slate-500 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-2 max-w-7xl mx-auto w-full">
        <div>Quiz Battle: Crorepati Edition • TV Quiz Arena</div>
        <div className="flex items-center gap-3">
          <span>Topic: {topic}</span>
          <span>•</span>
          <span>Language: {language}</span>
        </div>
      </footer>
    </div>
  );
}
