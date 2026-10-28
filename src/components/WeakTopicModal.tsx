import React from 'react';
import {
  Brain,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Sparkles,
  X,
  Target,
  ArrowRight,
} from 'lucide-react';
import { WeakTopicReport } from '../types/quiz';

interface WeakTopicModalProps {
  report: WeakTopicReport;
  onClose: () => void;
  onPlayAgain?: () => void;
}

export const WeakTopicModal: React.FC<WeakTopicModalProps> = ({
  report,
  onClose,
  onPlayAgain,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-xl animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-3xl my-8 bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-950 border-2 border-amber-500 rounded-3xl p-5 sm:p-8 shadow-2xl shadow-amber-500/30 text-slate-100">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-amber-500/25">
          <div className="p-3 bg-gradient-to-br from-purple-500/20 to-indigo-600/30 rounded-2xl border border-indigo-400/50 text-indigo-300">
            <Brain className="w-7 h-7" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[11px] font-bold uppercase tracking-wider mb-1 border border-amber-500/30">
              <Sparkles className="w-3 h-3 text-amber-400" />
              Powered by Gemini AI Diagnostic Engine
            </div>
            <h2 className="font-cinzel text-xl sm:text-2xl font-black text-amber-200">
              WEAK-TOPIC ANALYSIS & REVISION ROADMAP
            </h2>
          </div>
        </div>

        {/* Score & Summary Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 my-5">
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-center flex flex-col justify-center">
            <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">
              Accuracy Score
            </span>
            <span className="font-cinzel text-3xl font-black text-gold-gradient mt-1">
              {report.overallScore}%
            </span>
            <span className="text-[11px] text-amber-200/70 mt-1">
              {report.correctCount} of {report.totalQuestions} Solved Correctly
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-center sm:col-span-2 flex flex-col justify-center text-left">
            <div className="flex items-center gap-1.5 text-xs uppercase font-bold text-emerald-400 mb-1.5">
              <CheckCircle2 className="w-4 h-4" /> Strong / Mastered Concepts
            </div>
            <div className="flex flex-wrap gap-1.5">
              {report.masteredTopics && report.masteredTopics.length > 0 ? (
                report.masteredTopics.map((topic, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-semibold"
                  >
                    {topic}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400">Keep practicing to build your master list!</span>
              )}
            </div>
          </div>
        </div>

        {/* Amitabh Host Verdict Bubble */}
        {report.hostVerdict && (
          <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-500/10 border border-amber-400/40 mb-6 text-xs sm:text-sm text-amber-100 italic leading-relaxed flex items-start gap-2.5">
            <span className="text-lg flex-shrink-0">🎙️</span>
            <div>
              <strong className="text-amber-300 not-italic block mb-0.5 font-cinzel text-xs uppercase">
                Host Amitabh's Mentorship Note:
              </strong>
              "{report.hostVerdict}"
            </div>
          </div>
        )}

        {/* Detailed Weak Topics & What to Revise */}
        <div>
          <h3 className="font-cinzel text-base font-bold text-amber-300 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Target className="w-4 h-4 text-rose-400" />
            Concepts Requiring Revision ({report.weakTopics.length})
          </h3>

          <div className="space-y-3 max-h-[42vh] overflow-y-auto pr-1">
            {report.weakTopics.length === 0 ? (
              <div className="p-6 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 text-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                <h4 className="font-bold text-emerald-300 text-base">Phenomenal Mastery!</h4>
                <p className="text-xs text-slate-300 mt-1">
                  You did not get any questions wrong in this session. All tested concepts were solid!
                </p>
              </div>
            ) : (
              report.weakTopics.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-slate-950/80 border border-rose-500/30 hover:border-rose-400/50 transition-all space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-rose-300 flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-rose-400" />
                      {item.topic}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-500/30 uppercase">
                      Action Required
                    </span>
                  </div>

                  <p className="text-xs text-slate-300">
                    <span className="font-semibold text-amber-200/90">Diagnosis: </span>
                    {item.mistakeReason}
                  </p>

                  <p className="text-xs text-slate-300">
                    <span className="font-semibold text-emerald-300">Revision Plan: </span>
                    {item.revisionTip}
                  </p>

                  {item.formula && (
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-amber-500/30 text-amber-200 text-xs font-mono flex items-start gap-2">
                      <BookOpen className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[10px] text-amber-300/70 block uppercase font-sans">
                          Must-Know Formula / Key Rule:
                        </span>
                        <span>{item.formula}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Modal Actions */}
        <div className="mt-6 pt-4 border-t border-amber-500/25 flex flex-col sm:flex-row gap-3 justify-end">
          {onPlayAgain && (
            <button
              onClick={onPlayAgain}
              className="py-3 px-6 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 font-cinzel font-bold text-slate-950 text-sm shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-2"
            >
              <span>Play Again with Revision</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="py-3 px-6 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-sm font-semibold transition"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
};
