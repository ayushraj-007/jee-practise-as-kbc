import React from 'react';
import { DollarSign, AlertCircle, ArrowLeft } from 'lucide-react';

interface QuitConfirmModalProps {
  currentAmount: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const QuitConfirmModal: React.FC<QuitConfirmModalProps> = ({
  currentAmount,
  onConfirm,
  onCancel,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-950 border-2 border-amber-500 rounded-2xl p-6 shadow-2xl shadow-amber-500/30 text-center text-slate-100">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-amber-400">
          <DollarSign className="w-9 h-9" />
        </div>

        <h3 className="font-cinzel text-2xl font-bold text-amber-300 mb-2">
          WALK AWAY WITH CASH?
        </h3>

        <p className="text-sm text-slate-300 mb-4">
          If you are unsure of the answer, you can quit now and lock your guaranteed earnings.
        </p>

        <div className="bg-amber-500/15 border border-amber-500/40 rounded-xl py-3 px-4 mb-6">
          <p className="text-xs uppercase text-amber-300/80 font-semibold tracking-wider">
            Current Guaranteed Prize Money
          </p>
          <p className="text-2xl font-black text-amber-300 font-mono mt-1">
            {currentAmount}
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 px-4 rounded-xl border border-slate-600 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition flex items-center justify-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" /> Keep Playing
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-bold shadow-lg shadow-red-700/40 transition flex items-center justify-center gap-1.5"
          >
            <AlertCircle className="w-4 h-4" /> Quit & Take {currentAmount}
          </button>
        </div>
      </div>
    </div>
  );
};
