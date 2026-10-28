import React, { useState, useRef } from 'react';
import {
  Atom,
  FlaskConical,
  Calculator,
  Layers,
  Globe2,
  Users2,
  Play,
  ArrowLeft,
  GraduationCap,
  Sparkles,
  PenTool,
  FileText,
  UploadCloud,
  CheckCircle,
  Zap,
} from 'lucide-react';
import { TOPICS, LANGUAGES, TopicType, LanguageType, SetupTab } from '../types/quiz';

interface GameSetupModalProps {
  mode: 'KBC' | 'BATTLE';
  onStart: (
    topic: TopicType,
    language: LanguageType,
    customTopic?: string,
    notesText?: string,
    pdfBase64?: string,
    p1Name?: string,
    p2Name?: string
  ) => void;
  onBack: () => void;
}

export const GameSetupModal: React.FC<GameSetupModalProps> = ({ mode, onStart, onBack }) => {
  const [activeTab, setActiveTab] = useState<SetupTab>('SUBJECTS');
  const [selectedTopic, setSelectedTopic] = useState<TopicType>('JEE Mixed (PCM)');
  const [customTopicInput, setCustomTopicInput] = useState<string>('');
  const [notesInput, setNotesInput] = useState<string>('');
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [pdfBase64, setPdfBase64] = useState<string | undefined>(undefined);

  const [selectedLang, setSelectedLang] = useState<LanguageType>('English');

  const [player1Name, setPlayer1Name] = useState<string>('Aspirant 1');
  const [player2Name, setPlayer2Name] = useState<string>('Aspirant 2');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // File upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);

    if (file.type === 'application/pdf') {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Strip data:application/pdf;base64,
        const base64 = result.split(',')[1];
        setPdfBase64(base64);
      };
      reader.readAsDataURL(file);
    } else {
      // Text or markdown file
      const reader = new FileReader();
      reader.onload = () => {
        const text = reader.result as string;
        setNotesInput(text);
      };
      reader.readAsText(file);
    }
  };

  const getTopicMeta = (topic: TopicType) => {
    switch (topic) {
      case 'JEE Physics':
        return {
          icon: <Atom className="w-6 h-6" />,
          desc: 'Mechanics, Electrodynamics, Optics & Modern Physics',
          badge: 'NTA & IIT-JEE',
        };
      case 'JEE Chemistry':
        return {
          icon: <FlaskConical className="w-6 h-6" />,
          desc: 'Physical, Organic Mechanisms & Inorganic Coordination',
          badge: 'NTA & IIT-JEE',
        };
      case 'JEE Mathematics':
        return {
          icon: <Calculator className="w-6 h-6" />,
          desc: 'Calculus, Algebra, Coordinate Geometry, Vectors & 3D',
          badge: 'NTA & IIT-JEE',
        };
      case 'JEE Mixed (PCM)':
      default:
        return {
          icon: <Layers className="w-6 h-6" />,
          desc: 'Complete PCM Trio: Balanced Physics, Chemistry & Math PYQs',
          badge: 'Full Mock Test',
        };
    }
  };

  const handleStart = () => {
    let finalCustomTopic: string | undefined = undefined;
    let finalNotes: string | undefined = undefined;
    let finalPdf: string | undefined = undefined;

    if (activeTab === 'CUSTOM') {
      finalCustomTopic = customTopicInput.trim() || 'General Knowledge';
    } else if (activeTab === 'NOTES') {
      finalNotes = notesInput.trim();
      finalPdf = pdfBase64;
      finalCustomTopic = uploadedFileName ? `Study Notes: ${uploadedFileName}` : 'Personal Notes';
    }

    onStart(
      selectedTopic,
      selectedLang,
      finalCustomTopic,
      finalNotes,
      finalPdf,
      player1Name.trim() || 'Aspirant 1',
      player2Name.trim() || 'Aspirant 2'
    );
  };

  const sampleCustomTopics = [
    'Indian Constitution & Polity',
    'Organic Chemistry Mechanisms',
    'Modern History & Revolutions',
    'Quantum Computing & AI',
    'Ancient Indian Dynasties',
    'Astrophysics & Black Holes',
  ];

  return (
    <div className="w-full max-w-4xl mx-auto p-3 sm:p-6 lg:p-8 animate-fade-in">
      <div className="bg-slate-900/95 border-2 border-amber-500/60 rounded-3xl p-5 sm:p-8 shadow-2xl shadow-amber-500/20 backdrop-blur-xl relative overflow-hidden">
        {/* Glow ambient background */}
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Back and Title Header */}
        <div className="flex items-center justify-between pb-5 border-b border-amber-500/20">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-semibold text-amber-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-amber-500/30 transition"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Menu
          </button>
          <div className="text-right">
            <span className="text-xs uppercase tracking-widest text-amber-400 font-bold block flex items-center justify-end gap-1">
              <GraduationCap className="w-3.5 h-3.5" /> Powered by Gemini AI
            </span>
            <h2 className="font-cinzel text-xl sm:text-2xl font-black text-amber-200">
              {mode === 'KBC' ? 'CROREPATI SOLO SETUP' : '2-PLAYER BATTLE SETUP'}
            </h2>
          </div>
        </div>

        {/* 3 Main Setup Tabs */}
        <div className="flex rounded-2xl bg-slate-950/80 p-1.5 border border-amber-500/30 my-5 gap-1">
          <button
            onClick={() => setActiveTab('SUBJECTS')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'SUBJECTS'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-amber-300'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>JEE Subjects</span>
          </button>

          <button
            onClick={() => setActiveTab('CUSTOM')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'CUSTOM'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-amber-300'
            }`}
          >
            <PenTool className="w-4 h-4" />
            <span>Custom Topic</span>
          </button>

          <button
            onClick={() => setActiveTab('NOTES')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'NOTES'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-amber-300'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>From Notes / PDF</span>
          </button>
        </div>

        {/* Battle Player Names Input if Battle Mode */}
        {mode === 'BATTLE' && (
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-blue-950/60 via-slate-900/80 to-purple-950/60 border border-indigo-500/30">
            <div className="flex items-center gap-2 text-indigo-300 text-sm font-bold uppercase tracking-wider mb-3">
              <Users2 className="w-4 h-4" /> Enter Challenger Names (100 HP Each)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-blue-300 font-semibold mb-1">
                  PLAYER 1 (Blue Corner)
                </label>
                <input
                  type="text"
                  maxLength={16}
                  value={player1Name}
                  onChange={(e) => setPlayer1Name(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl bg-slate-950/80 border border-blue-500/50 text-white font-semibold focus:outline-none focus:border-blue-400"
                  placeholder="Player 1"
                />
              </div>
              <div>
                <label className="block text-xs text-purple-300 font-semibold mb-1">
                  PLAYER 2 (Red/Purple Corner)
                </label>
                <input
                  type="text"
                  maxLength={16}
                  value={player2Name}
                  onChange={(e) => setPlayer2Name(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl bg-slate-950/80 border border-purple-500/50 text-white font-semibold focus:outline-none focus:border-purple-400"
                  placeholder="Player 2"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 1: JEE SUBJECTS */}
        {activeTab === 'SUBJECTS' && (
          <div className="space-y-4">
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-400/30 flex items-center justify-between text-xs">
              <span className="text-amber-300 font-bold flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" /> Progression Ladder:
              </span>
              <span className="text-amber-200/90 font-mono text-[11px]">
                Q1-5: Easy Main PYQ → Q6-10: Mod Main → Q11-14: Hard Adv → Q15: Crore Adv PYQ
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {TOPICS.map((topic) => {
                const isSelected = selectedTopic === topic;
                const meta = getTopicMeta(topic);

                return (
                  <button
                    key={topic}
                    onClick={() => setSelectedTopic(topic)}
                    className={`flex items-start gap-3.5 p-4 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? 'bg-gradient-to-r from-amber-500/20 to-yellow-500/10 border-amber-400 text-white shadow-xl shadow-amber-500/20 ring-2 ring-amber-400/50'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className={`p-3 rounded-xl flex-shrink-0 ${isSelected ? 'bg-amber-400 text-slate-950 font-bold' : 'bg-slate-800 text-amber-400'}`}>
                      {meta.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="font-cinzel text-base font-bold text-amber-200 truncate">
                          {topic}
                        </h4>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-amber-300 border border-slate-700">
                          {meta.badge}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                        {meta.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: CUSTOM TOPIC */}
        {activeTab === 'CUSTOM' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-amber-500/40 space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-amber-300">
                Type Any Custom Topic or Special Focus:
              </label>
              <input
                type="text"
                value={customTopicInput}
                onChange={(e) => setCustomTopicInput(e.target.value)}
                placeholder="e.g. Indian Constitution, Organic Chemistry, World War II, Taylor Swift..."
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-amber-500/50 text-white text-sm font-medium focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/30"
              />

              <div>
                <span className="text-xs text-slate-400 block mb-2">Or click a trending topic:</span>
                <div className="flex flex-wrap gap-2">
                  {sampleCustomTopics.map((item) => (
                    <button
                      key={item}
                      onClick={() => setCustomTopicInput(item)}
                      className="px-3 py-1 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 transition"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: QUIZ FROM YOUR NOTES / PDF */}
        {activeTab === 'NOTES' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-amber-500/40 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                  <UploadCloud className="w-4 h-4 text-amber-400" />
                  Paste Study Notes or Upload a Document / PDF
                </label>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-amber-300 text-xs font-bold transition flex items-center gap-1.5"
                >
                  <UploadCloud className="w-3.5 h-3.5" /> Upload PDF / TXT
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt,.md"
                onChange={handleFileUpload}
                className="hidden"
              />

              {uploadedFileName && (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-semibold">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>Attached: {uploadedFileName}</span>
                </div>
              )}

              <textarea
                rows={5}
                value={notesInput}
                onChange={(e) => setNotesInput(e.target.value)}
                placeholder="Paste your lecture notes, textbook summary, formula sheets, or revision bullets here... Gemini will generate all quiz questions based strictly on your notes!"
                className="w-full p-3.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>
        )}

        {/* Game Rules: Increasing Timer & 3 Lives Allowed */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-5 pt-3 border-t border-amber-500/20">
          {/* Language Selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-amber-300 mb-2">
              Language / माध्यम
            </label>
            <div className="grid grid-cols-2 gap-2">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang}
                  onClick={() => setSelectedLang(lang)}
                  className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 transition-all ${
                    selectedLang === lang
                      ? 'bg-amber-500/20 border-amber-400 text-amber-200 font-bold ring-2 ring-amber-400/40'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400'
                  }`}
                >
                  <Globe2 className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold">{lang}</span>
                </button>
              ))}
            </div>
          </div>

          {/* New Game Perks: 3 Lives & Increasing Timer */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-amber-300 mb-2">
              Game Rules & Lifeline
            </label>
            <div className="p-2.5 rounded-xl border border-amber-500/40 bg-amber-500/10 text-xs text-amber-200 space-y-1">
              <div className="flex items-center justify-between font-bold text-amber-300">
                <span className="flex items-center gap-1.5">
                  <span className="text-rose-400">❤️❤️❤️</span> 3 Lives Allowed
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                  3 Strikes
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                ⏱️ <strong>Increasing Timer:</strong> 30s at base up to 120s for the 1 Crore question!
              </p>
            </div>
          </div>
        </div>

        {/* Start Game Action */}
        <div className="pt-4 border-t border-amber-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-400 text-center sm:text-left">
            ⚡ Powered by Gemini 3.8 Flash • AI Quiz Host Amitabh in session
          </div>
          <button
            onClick={handleStart}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl font-cinzel font-black text-slate-950 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 shadow-xl shadow-amber-500/30 text-base tracking-wider flex items-center justify-center gap-3 transition-all transform active:scale-95"
          >
            <Play className="w-5 h-5 fill-slate-950" />
            START GAME
          </button>
        </div>
      </div>
    </div>
  );
};
