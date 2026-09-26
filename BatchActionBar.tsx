import React from 'react';
import {
  Play,
  Square,
  Download,
  Trash2,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Layers,
  Settings2
} from 'lucide-react';
import { BatchStats, UpscaleFactor } from '../types';

interface BatchActionBarProps {
  stats: BatchStats;
  isProcessing: boolean;
  onStartBatch: () => void;
  onCancelBatch: () => void;
  onDownloadZip: () => void;
  onClearAll: () => void;
  onClearCompleted: () => void;
  onSetGlobalScale: (factor: UpscaleFactor) => void;
  isZipGenerating: boolean;
}

export const BatchActionBar: React.FC<BatchActionBarProps> = ({
  stats,
  isProcessing,
  onStartBatch,
  onCancelBatch,
  onDownloadZip,
  onClearAll,
  onClearCompleted,
  onSetGlobalScale,
  isZipGenerating,
}) => {
  const percentCompleted = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
  const hasCompleted = stats.completed > 0;
  const hasRemaining = stats.pending > 0 || stats.error > 0;

  return (
    <div className="sticky bottom-4 z-20 w-full max-w-4xl mx-auto px-2 sm:px-0">
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-3xl p-3 sm:p-4 shadow-xl border border-slate-200/90 dark:border-slate-800 transition-all">
        
        {/* Progress & Status Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Batch Progress:
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {stats.completed} / {stats.total} Completed
            </span>
            {stats.error > 0 && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {stats.error} failed
              </span>
            )}
          </div>

          {/* Quick scale batch switchers & clear actions */}
          <div className="flex items-center gap-1.5 text-xs">
            <div className="hidden sm:flex items-center gap-1 text-[11px] font-semibold text-slate-500 mr-1">
              <span>All:</span>
              <button
                type="button"
                onClick={() => onSetGlobalScale(2)}
                disabled={isProcessing}
                className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 disabled:opacity-50"
              >
                2x
              </button>
              <button
                type="button"
                onClick={() => onSetGlobalScale(4)}
                disabled={isProcessing}
                className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 disabled:opacity-50"
              >
                4x
              </button>
            </div>

            {hasCompleted && (
              <button
                type="button"
                onClick={onClearCompleted}
                disabled={isProcessing}
                className="px-2 py-1 text-[11px] font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40"
              >
                Clear Done
              </button>
            )}

            <button
              type="button"
              onClick={onClearAll}
              disabled={isProcessing}
              className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40"
              title="Clear all images"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden mb-3">
          <div
            className={`h-full transition-all duration-300 ${
              stats.completed === stats.total && stats.total > 0
                ? 'bg-emerald-500'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600'
            }`}
            style={{ width: `${percentCompleted}%` }}
          />
        </div>

        {/* Main Action Buttons Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {/* Start / Cancel processing button */}
          {isProcessing ? (
            <button
              type="button"
              onClick={onCancelBatch}
              className="w-full py-3 px-4 rounded-2xl bg-amber-600 hover:bg-amber-700 active:scale-[0.98] text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-md shadow-amber-600/20 transition-all cursor-pointer"
            >
              <Square className="w-4 h-4 fill-white" />
              <span>Stop / Cancel Queue</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onStartBatch}
              disabled={!hasRemaining}
              className="w-full py-3 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-md shadow-blue-600/25 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>
                {stats.completed > 0 && hasRemaining
                  ? `Upscale Remaining (${stats.pending + stats.error})`
                  : `Start Upscaling (${stats.total} PNGs)`}
              </span>
            </button>
          )}

          {/* Download All ZIP */}
          <button
            type="button"
            onClick={onDownloadZip}
            disabled={!hasCompleted || isZipGenerating}
            className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            {isZipGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Creating ZIP Archive...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>
                  Download All ZIP {hasCompleted ? `(${stats.completed})` : ''}
                </span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
