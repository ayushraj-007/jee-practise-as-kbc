import React from 'react';
import { Shield, Trophy, Check, Sparkles } from 'lucide-react';
import { PRIZE_LADDER } from '../types/quiz';

interface PrizeLadderProps {
  currentLevel: number; // 1 to 15
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const PrizeLadder: React.FC<PrizeLadderProps> = ({
  currentLevel,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  // Ladder is traditionally rendered top to bottom (Level 15 down to Level 1)
  const reversedLadder = [...PRIZE_LADDER].reverse();

  return (
    <div
      className={`
        fixed inset-y-0 right-0 z-40 w-72 bg-slate-950/95 lg:bg-slate-950/70 border-l border-amber-500/30 backdrop-blur-xl p-4 flex flex-col justify-between transition-transform duration-300
        lg:static lg:translate-x-0 lg:w-72 lg:rounded-2xl lg:border lg:border-amber-500/30 lg:shadow-2xl lg:shadow-amber-500/10 lg:my-auto
        ${isMobileOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-amber-500/20">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-400" />
          <h2 className="font-cinzel text-base font-bold text-amber-300 tracking-wider">
            PRIZE LADDER
          </h2>
        </div>
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="lg:hidden text-xs px-2.5 py-1 rounded bg-slate-800 text-slate-300 hover:text-white"
          >
            Close
          </button>
        )}
      </div>

      {/* Ladder Items */}
      <div className="flex-1 overflow-y-auto py-2 space-y-1 my-1">
        {reversedLadder.map((item) => {
          const isCurrent = item.level === currentLevel;
          const isPassed = item.level < currentLevel;
          const isCheckpoint = item.isCheckpoint;

          let containerStyle = 'bg-slate-900/40 text-slate-400 border border-transparent';
          let textStyle = 'text-slate-400';
          let numberBadge = 'bg-slate-800 text-slate-400';

          if (isCurrent) {
            containerStyle = 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 font-bold border-2 border-yellow-200 shadow-lg shadow-amber-500/40 animate-pulse';
            textStyle = 'text-slate-950 font-black';
            numberBadge = 'bg-slate-950 text-amber-300';
          } else if (isPassed) {
            containerStyle = 'bg-slate-900/60 text-emerald-400/90 border border-emerald-500/30';
            textStyle = 'text-emerald-400 font-semibold';
            numberBadge = 'bg-emerald-950 text-emerald-400';
          } else if (isCheckpoint) {
            containerStyle = 'bg-amber-950/30 border border-amber-500/40 text-amber-300';
            textStyle = 'text-amber-300 font-bold';
            numberBadge = 'bg-amber-500/20 text-amber-300 border border-amber-500/40';
          }

          return (
            <div
              key={item.level}
              className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-all ${containerStyle}`}
            >
              <div className="flex items-center gap-2">
                <span className={`w-5 h-5 flex items-center justify-center rounded-md font-mono text-[10px] font-bold ${numberBadge}`}>
                  {item.level}
                </span>

                {isCheckpoint ? (
                  <span className="flex items-center gap-1 text-[10px] font-semibold tracking-wide uppercase">
                    {item.level === 15 ? (
                      <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                    ) : (
                      <Shield className="w-3 h-3 text-amber-400" />
                    )}
                    {item.checkpointName || 'Safe'}
                  </span>
                ) : (
                  <span className="text-[10px] opacity-60">Level</span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <span className={`font-mono text-xs ${textStyle}`}>
                  {item.formattedAmount}
                </span>
                {isPassed && <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer / Safe Status */}
      <div className="pt-2 border-t border-amber-500/20 text-[11px] text-amber-200/80 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-amber-400" />
          <span>Safe: Q5 (₹10K) & Q10 (₹3.2L)</span>
        </div>
      </div>
    </div>
  );
};
