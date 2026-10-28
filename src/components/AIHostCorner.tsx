import React, { useState } from 'react';
import { MessageSquare, Sparkles, ChevronDown, ChevronUp, Mic } from 'lucide-react';

interface AIHostCornerProps {
  hostLine: string;
  isHostSpeaking?: boolean;
}

export const AIHostCorner: React.FC<AIHostCornerProps> = ({ hostLine, isHostSpeaking = false }) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  return (
    <div className="relative z-30 transition-all duration-300">
      <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 border-2 border-amber-500/60 rounded-2xl p-3 sm:p-4 shadow-xl shadow-amber-500/15 backdrop-blur-md">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Host Avatar with animated mic / studio spotlight */}
            <div className="relative flex-shrink-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-600 p-0.5 shadow-md">
                <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center text-amber-300 font-serif font-black text-lg">
                  🎙️
                </div>
              </div>
              {isHostSpeaking && (
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500 border border-slate-950"></span>
                </span>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-cinzel text-xs sm:text-sm font-bold text-amber-300 tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  AI QUIZ HOST
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-200 border border-amber-400/40">
                  Amitabh Style
                </span>
              </div>
              <p className="text-[11px] text-amber-200/70 hidden sm:block">
                Hot Seat Master & Anchor
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-amber-300 border border-amber-500/30 transition text-xs flex items-center gap-1"
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>

        {/* Speech Bubble */}
        {!isCollapsed && (
          <div className="mt-2.5 pt-2 border-t border-amber-500/20">
            <div className="relative bg-slate-900/90 rounded-xl p-2.5 sm:p-3 border border-amber-500/30 text-xs sm:text-sm text-amber-100 italic leading-relaxed flex items-start gap-2 shadow-inner">
              <MessageSquare className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <span>"{hostLine}"</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
