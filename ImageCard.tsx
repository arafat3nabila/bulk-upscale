import React from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  Download,
  Trash2,
  Maximize2,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Clock
} from 'lucide-react';
import { ImageFile, UpscaleFactor } from '../types';
import { formatBytes, downloadFile } from '../services/upscaleService';

interface ImageCardProps {
  image: ImageFile;
  onRemove: (id: string) => void;
  onRetry: (id: string) => void;
  onScaleChange: (id: string, factor: UpscaleFactor) => void;
  onOpenPreview: (image: ImageFile) => void;
  isBatchRunning: boolean;
}

export const ImageCard: React.FC<ImageCardProps> = ({
  image,
  onRemove,
  onRetry,
  onScaleChange,
  onOpenPreview,
  isBatchRunning,
}) => {
  const isCompleted = image.status === 'completed';
  const isProcessing = image.status === 'processing';
  const isQueued = image.status === 'queued';
  const isError = image.status === 'error';

  // Projected or actual output dimensions
  const targetWidth = isCompleted && image.outputWidth ? image.outputWidth : image.width * image.scaleFactor;
  const targetHeight = isCompleted && image.outputHeight ? image.outputHeight : image.height * image.scaleFactor;

  const handleDownload = () => {
    if (!image.outputUrl) return;
    const cleanName = image.file.name.replace(/\.[^/.]+$/, '');
    downloadFile(image.outputUrl, `upscaled_${image.scaleFactor}x_${cleanName}.png`);
  };

  return (
    <div
      className={`relative rounded-2xl border transition-all duration-200 overflow-hidden ${
        isCompleted
          ? 'bg-white dark:bg-slate-800/90 border-emerald-200 dark:border-emerald-900/60 shadow-sm'
          : isProcessing
          ? 'bg-blue-50/40 dark:bg-slate-800/90 border-blue-300 dark:border-blue-700 shadow-md shadow-blue-500/5'
          : isError
          ? 'bg-red-50/30 dark:bg-slate-800/90 border-red-200 dark:border-red-900/60'
          : 'bg-white dark:bg-slate-800/70 border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 shadow-xs'
      }`}
    >
      <div className="p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
        
        {/* Thumbnail with Transparency Checkerboard */}
        <div 
          onClick={() => isCompleted && onOpenPreview(image)}
          className={`relative w-18 h-18 sm:w-20 sm:h-20 shrink-0 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 checkerboard-pattern shadow-inner group ${
            isCompleted ? 'cursor-pointer hover:ring-2 hover:ring-blue-500' : ''
          }`}
        >
          <img
            src={image.outputUrl || image.preview}
            alt={image.file.name}
            className="w-full h-full object-contain transition-transform duration-200 group-hover:scale-105"
          />

          {/* Quick preview overlay button if completed */}
          {isCompleted && (
            <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
              <Maximize2 className="w-5 h-5 drop-shadow-md" />
            </div>
          )}

          {/* Status corner badge */}
          {isCompleted && (
            <div className="absolute top-1 right-1 bg-emerald-500 text-white rounded-full p-0.5 shadow-sm">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          )}
        </div>

        {/* File Details & Metadata */}
        <div className="flex-1 min-w-0 w-full">
          <div className="flex items-start justify-between gap-2">
            <h3 
              className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate"
              title={image.file.name}
            >
              {image.file.name}
            </h3>

            {/* Scale Factor Selector (2x vs 4x) */}
            <div className="shrink-0 flex items-center bg-slate-100 dark:bg-slate-700/70 rounded-lg p-0.5 border border-slate-200 dark:border-slate-600">
              <button
                type="button"
                onClick={() => onScaleChange(image.id, 2)}
                disabled={isProcessing || isBatchRunning}
                className={`px-2 py-0.5 text-[11px] font-bold rounded-md transition-all ${
                  image.scaleFactor === 2
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                } disabled:opacity-50`}
              >
                2x
              </button>
              <button
                type="button"
                onClick={() => onScaleChange(image.id, 4)}
                disabled={isProcessing || isBatchRunning}
                className={`px-2 py-0.5 text-[11px] font-bold rounded-md transition-all ${
                  image.scaleFactor === 4
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                } disabled:opacity-50`}
              >
                4x
              </button>
            </div>
          </div>

          {/* Dimensions and Resolution Comparison */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            <span>
              {image.width > 0 ? `${image.width} × ${image.height} px` : 'Calculating...'}
            </span>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <span>{formatBytes(image.size)}</span>
            
            <div className="flex items-center gap-1 font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded-md">
              <ArrowRight className="w-3 h-3" />
              <span>{targetWidth > 0 ? `${targetWidth} × ${targetHeight} px` : `${image.scaleFactor}x`}</span>
              {isCompleted && image.outputSize && (
                <span className="font-normal text-slate-500 dark:text-slate-400">
                  ({formatBytes(image.outputSize)})
                </span>
              )}
            </div>
          </div>

          {/* Progress / Status Bar */}
          {isProcessing && (
            <div className="mt-2 space-y-1">
              <div className="flex items-center justify-between text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                <span className="flex items-center gap-1.5">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Upscaling on ZeroGPU...
                </span>
                <span>{image.progress}%</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.max(10, image.progress)}%` }}
                />
              </div>
            </div>
          )}

          {isQueued && (
            <div className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
              <Clock className="w-3 h-3" />
              <span>Waiting in queue...</span>
            </div>
          )}

          {isError && (
            <div className="mt-2 flex items-start gap-1.5 text-[11px] text-red-600 dark:text-red-400 font-medium bg-red-50 dark:bg-red-950/40 p-1.5 rounded-lg border border-red-200 dark:border-red-900/40">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span className="line-clamp-2">{image.error || 'Failed to upscale image'}</span>
            </div>
          )}
        </div>

        {/* Action Buttons for Mobile and Desktop */}
        <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 dark:border-slate-700/50">
          {isCompleted && (
            <>
              {/* Compare / Preview Button */}
              <button
                type="button"
                onClick={() => onOpenPreview(image)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 active:scale-95 transition-all shadow-2xs"
                title="Interactive Before & After slider"
              >
                <Maximize2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Compare</span>
              </button>

              {/* Genuine PNG Download Button */}
              <button
                type="button"
                onClick={handleDownload}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white shadow-xs shadow-emerald-600/20 active:scale-95 transition-all"
                title="Download original transparent PNG"
              >
                <Download className="w-3.5 h-3.5" />
                <span>PNG</span>
              </button>
            </>
          )}

          {isError && (
            <button
              type="button"
              onClick={() => onRetry(image.id)}
              disabled={isBatchRunning}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/40 text-xs font-bold text-red-700 dark:text-red-300 hover:bg-red-100 active:scale-95 transition-all disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          )}

          {/* Remove / Trash */}
          <button
            type="button"
            onClick={() => onRemove(image.id)}
            disabled={isProcessing}
            className="p-2 rounded-xl text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-700/60 active:scale-95 transition-all disabled:opacity-30"
            aria-label="Remove image"
            title="Remove from batch"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
