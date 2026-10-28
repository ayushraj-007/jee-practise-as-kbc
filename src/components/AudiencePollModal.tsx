import React, { useMemo } from 'react';
import { Users, CheckCircle2 } from 'lucide-react';
import { QuestionDifficulty } from '../types/quiz';

interface AudiencePollModalProps {
  options: [string, string, string, string];
  correctIndex: number;
  difficulty: QuestionDifficulty;
  onClose: () => void;
}

export const AudiencePollModal: React.FC<AudiencePollModalProps> = ({
  options,
  correctIndex,
  difficulty,
  onClose,
}) => {
  // Generate smart poll distribution that totals exactly 100%
  const percentages = useMemo(() => {
    let correctPct: number;
    // Basic: audience is very confident
    if (difficulty === 'basic') {
      correctPct = Math.floor(Math.random() * 15) + 68; // 68 - 82%
    } else if (difficulty === 'intermediate') {
      correctPct = Math.floor(Math.random() * 16) + 52; // 52 - 67%
    } else if (difficulty === 'advanced') {
      // 15% chance audience is split or slightly favors a distractor
      const trick = Math.random() < 0.15;
      correctPct = trick ? Math.floor(Math.random() * 10) + 32 : Math.floor(Math.random() * 15) + 42;
    } else {
      // Expert: audience is divided!
      const trick = Math.random() < 0.25;
      correctPct = trick ? Math.floor(Math.random() * 8) + 28 : Math.floor(Math.random() * 12) + 38;
    }

    const remaining = 100 - correctPct;
    // Distribute remaining among other 3 options
    const r1 = Math.floor(Math.random() * (remaining * 0.55));
    const r2 = Math.floor(Math.random() * (remaining - r1));
    const r3 = remaining - r1 - r2;

    const others = [r1, r2, r3];
    let otherIdx = 0;
    const result = [0, 0, 0, 0];

    for (let i = 0; i < 4; i++) {
      if (i === correctIndex) {
        result[i] = correctPct;
      } else {
        result[i] = others[otherIdx++];
      }
    }
    return result;
  }, [correctIndex, difficulty]);

  const optionLetters = ['A', 'B', 'C', 'D'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-950 border-2 border-amber-500/70 rounded-2xl p-6 shadow-2xl shadow-amber-500/20 text-slate-100">
        <div className="flex items-center justify-between pb-4 border-b border-amber-500/30">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/20 rounded-xl border border-amber-500/50 text-amber-400">
              <Users className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="font-cinzel text-xl font-bold text-amber-300 tracking-wider">
                AUDIENCE POLL RESULTS
              </h3>
              <p className="text-xs text-amber-200/70">Studio audience has cast their votes!</p>
            </div>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-amber-500/20 text-amber-300 rounded-full border border-amber-500/40 uppercase">
            {difficulty} Level
          </span>
        </div>

        {/* Bar Chart */}
        <div className="my-6 space-y-4">
          {options.map((opt, idx) => {
            const pct = percentages[idx];
            const isHighest = pct === Math.max(...percentages);

            return (
              <div key={idx} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm font-medium">
                  <div className="flex items-center gap-2 truncate max-w-[70%]">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-amber-500/20 border border-amber-400 text-amber-300 font-bold text-xs">
                      {optionLetters[idx]}
                    </span>
                    <span className="truncate text-slate-200">{opt}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {isHighest && (
                      <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Top Pick
                      </span>
                    )}
                    <span className={`font-mono text-base font-extrabold ${isHighest ? 'text-amber-300' : 'text-slate-300'}`}>
                      {pct}%
                    </span>
                  </div>
                </div>

                {/* Animated Bar */}
                <div className="h-4 bg-slate-950/80 rounded-full border border-slate-700/60 overflow-hidden p-0.5">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ease-out ${
                      isHighest
                        ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-300 shadow-sm shadow-amber-400'
                        : 'bg-gradient-to-r from-blue-600 to-indigo-400 opacity-75'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-center pt-2">
          <button
            onClick={onClose}
            className="w-full py-3 px-6 rounded-xl font-bold text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 shadow-lg shadow-amber-500/30 transition-all transform active:scale-95"
          >
            Continue with Question
          </button>
        </div>
      </div>
    </div>
  );
};
