import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  Download,
  Split,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
  Layers,
  ArrowLeftRight
} from 'lucide-react';
import { ImageFile } from '../types';
import { formatBytes, downloadFile } from '../services/upscaleService';

interface BeforeAfterModalProps {
  image: ImageFile | null;
  onClose: () => void;
}

export const BeforeAfterModal: React.FC<BeforeAfterModalProps> = ({
  image,
  onClose,
}) => {
  const [sliderPos, setSliderPos] = useState<number>(50); // percentage 0 - 100
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [bgStyle, setBgStyle] = useState<'checker' | 'white' | 'dark'>('checker');
  const [isDragging, setIsDragging] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Reset zoom & slider when image changes
  useEffect(() => {
    if (image) {
      setSliderPos(50);
      setZoomLevel(1);
    }
  }, [image]);

  const handlePointerMove = useCallback(
    (clientX: number) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const clampedX = Math.max(0, Math.min(x, rect.width));
      const percentage = (clampedX / rect.width) * 100;
      setSliderPos(percentage);
    },
    []
  );

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    handlePointerMove(e.clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      handlePointerMove(e.touches[0].clientX);
    }
  };

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        handlePointerMove(e.clientX);
      }
    };

    const handleGlobalMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, handlePointerMove]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!image || !image.outputUrl) return null;

  const handleDownload = () => {
    const cleanName = image.file.name.replace(/\.[^/.]+$/, '');
    downloadFile(image.outputUrl!, `upscaled_${image.scaleFactor}x_${cleanName}.png`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-4xl max-h-[96vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/60">
          <div className="min-w-0 pr-2">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                <Split className="w-4 h-4" />
              </span>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                {image.file.name}
              </h2>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Drag the center slider left/right to compare Before (Original) vs After ({image.scaleFactor}x AI)
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm active:scale-95 transition-all"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Download PNG</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40 flex flex-wrap items-center justify-between gap-2 text-xs">
          {/* Resolution pills */}
          <div className="flex items-center gap-2 text-[11px] font-semibold">
            <span className="px-2 py-0.5 rounded-md bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              Before: {image.width}×{image.height} ({formatBytes(image.size)})
            </span>
            <span className="text-slate-400">→</span>
            <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              After: {image.outputWidth || image.width * image.scaleFactor}×{image.outputHeight || image.height * image.scaleFactor} ({formatBytes(image.outputSize || 0)})
            </span>
          </div>

          {/* Background & Zoom controls */}
          <div className="flex items-center gap-2">
            {/* Background Style Toggle (Checkerboard vs White vs Dark) */}
            <div className="flex items-center p-0.5 rounded-lg bg-slate-200/70 dark:bg-slate-800 border border-slate-300/60 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setBgStyle('checker')}
                className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all ${
                  bgStyle === 'checker' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-2xs' : 'text-slate-600 dark:text-slate-400'
                }`}
                title="Checkerboard (Alpha inspection)"
              >
                Alpha
              </button>
              <button
                type="button"
                onClick={() => setBgStyle('white')}
                className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all ${
                  bgStyle === 'white' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 dark:text-slate-400'
                }`}
                title="White Background"
              >
                White
              </button>
              <button
                type="button"
                onClick={() => setBgStyle('dark')}
                className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all ${
                  bgStyle === 'dark' ? 'bg-slate-950 text-white shadow-2xs' : 'text-slate-600 dark:text-slate-400'
                }`}
                title="Dark Background"
              >
                Dark
              </button>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-1 bg-slate-200/70 dark:bg-slate-800 p-0.5 rounded-lg">
              <button
                onClick={() => setZoomLevel((z) => Math.max(0.5, +(z - 0.25).toFixed(2)))}
                className="p-1 rounded-md text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] font-mono px-1 font-semibold text-slate-700 dark:text-slate-300">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                onClick={() => setZoomLevel((z) => Math.min(3, +(z + 0.25).toFixed(2)))}
                className="p-1 rounded-md text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              {zoomLevel !== 1 && (
                <button
                  onClick={() => setZoomLevel(1)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  title="Reset Zoom"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Interactive Comparison Canvas Area */}
        <div 
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onTouchMove={handleTouchMove}
          className={`relative flex-1 min-h-[350px] sm:min-h-[460px] overflow-hidden select-none cursor-ew-resize ${
            bgStyle === 'checker'
              ? 'checkerboard-pattern'
              : bgStyle === 'white'
              ? 'bg-white'
              : 'bg-slate-950'
          }`}
        >
          {/* Container scaling for Zoom */}
          <div 
            className="w-full h-full flex items-center justify-center p-4 transition-transform duration-100 ease-out"
            style={{ transform: `scale(${zoomLevel})` }}
          >
            {/* The Before Image (Left / Background layer) */}
            <div className="relative max-w-full max-h-full flex items-center justify-center">
              <img
                src={image.preview}
                alt="Before upscale"
                className="max-h-[50vh] sm:max-h-[60vh] max-w-full object-contain pointer-events-none"
              />

              {/* The After Image (Right / Clipped overlay layer) */}
              <div 
                className="absolute inset-0 overflow-hidden flex items-center justify-center pointer-events-none"
                style={{
                  clipPath: `inset(0 0 0 ${sliderPos}%)`
                }}
              >
                <img
                  src={image.outputUrl}
                  alt="After upscale"
                  className="max-h-[50vh] sm:max-h-[60vh] max-w-full object-contain"
                />
              </div>

              {/* Vertical Divider Line with Grab Handle */}
              <div
                className="absolute top-0 bottom-0 pointer-events-none"
                style={{ left: `${sliderPos}%` }}
              >
                {/* Thin vertical line with glow */}
                <div className="w-0.5 h-full bg-white shadow-lg drop-shadow-md relative -translate-x-1/2">
                  {/* Floating Circular Handle */}
                  <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white dark:bg-slate-900 border-2 border-blue-600 shadow-xl flex items-center justify-center text-blue-600 pointer-events-auto cursor-ew-resize hover:scale-110 active:scale-95 transition-transform">
                    <ArrowLeftRight className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Badges on left/right for clarity */}
              <div className="absolute top-3 left-3 pointer-events-none">
                <span className="px-2.5 py-1 rounded-lg bg-slate-900/70 backdrop-blur-xs text-white text-[11px] font-bold uppercase tracking-wider shadow-md">
                  Original
                </span>
              </div>
              <div className="absolute top-3 right-3 pointer-events-none">
                <span className="px-2.5 py-1 rounded-lg bg-blue-600/90 backdrop-blur-xs text-white text-[11px] font-bold uppercase tracking-wider shadow-md flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  AI {image.scaleFactor}x
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
          Tip: You can pan/drag on mobile with your finger or use the zoom buttons to inspect fine pixel sharpness and alpha transparency.
        </div>
      </div>
    </div>
  );
};
