import React, { useRef, useState, useEffect } from 'react';
import { UploadCloud, Image as ImageIcon, ShieldCheck, Zap, Layers, Plus } from 'lucide-react';

interface UploadDropzoneProps {
  onFilesSelected: (files: File[]) => void;
  currentCount: number;
  maxCount: number;
  compact?: boolean;
}

export const UploadDropzone: React.FC<UploadDropzoneProps> = ({
  onFilesSelected,
  currentCount,
  maxCount,
  compact = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const availableSlots = Math.max(0, maxCount - currentCount);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(Array.from(e.target.files));
      // Reset input value so re-selecting the same file fires onChange
      e.target.value = '';
    }
  };

  const processFiles = (files: File[]) => {
    // Filter for PNG files only
    const pngFiles = files.filter(
      (f) => f.type === 'image/png' || f.name.toLowerCase().endsWith('.png')
    );

    if (pngFiles.length === 0) {
      alert('Please select PNG files. Crystal Clear is optimized for preserving PNG transparency.');
      return;
    }

    const limited = pngFiles.slice(0, availableSlots);
    if (limited.length > 0) {
      onFilesSelected(limited);
    }
  };

  // Support clipboard paste for PNGs
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (!e.clipboardData || !e.clipboardData.items) return;
      const files: File[] = [];
      for (let i = 0; i < e.clipboardData.items.length; i++) {
        const item = e.clipboardData.items[i];
        if (item.type.indexOf('image/png') !== -1) {
          const blob = item.getAsFile();
          if (blob) {
            const pastedFile = new File([blob], `pasted_image_${Date.now()}.png`, { type: 'image/png' });
            files.push(pastedFile);
          }
        }
      }
      if (files.length > 0) {
        processFiles(files);
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [availableSlots]);

  if (compact) {
    return (
      <div className="relative">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png"
          multiple
          className="hidden"
          onChange={handleInputChange}
          disabled={availableSlots <= 0}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={availableSlots <= 0}
          className="flex items-center justify-center gap-2 py-3 px-4 w-full rounded-2xl border-2 border-dashed border-blue-400 dark:border-blue-700 bg-blue-50/60 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 font-bold text-xs hover:bg-blue-100/70 transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer"
        >
          <Plus className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span>Add More PNGs ({availableSlots} slots left)</span>
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png"
        multiple
        className="hidden"
        onChange={handleInputChange}
        disabled={availableSlots <= 0}
      />

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative group rounded-3xl border-2 border-dashed p-6 sm:p-10 transition-all cursor-pointer select-none text-center ${
          isDragging
            ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 scale-[1.01] shadow-xl shadow-blue-500/10'
            : 'border-slate-300 dark:border-slate-700/80 bg-white/80 dark:bg-slate-800/60 hover:border-blue-400 dark:hover:border-blue-600 hover:bg-blue-50/30 dark:hover:bg-slate-800/90 shadow-sm'
        }`}
      >
        {/* Glow accent */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none" />

        {/* Upload Icon Circle */}
        <div className="relative mx-auto w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-b from-blue-50 to-blue-100 dark:from-slate-800 dark:to-slate-700 border border-blue-200/80 dark:border-slate-600 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-105 group-hover:shadow-lg group-hover:shadow-blue-500/20 transition-all duration-300">
          <UploadCloud className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600 dark:text-blue-400 animate-bounce duration-1000" />
        </div>

        {/* Text descriptions */}
        <div className="mt-4 space-y-1.5">
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Drop your PNG images here
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-sm mx-auto font-medium">
            Tap to open Android file picker or drag & drop. Batch up to <span className="font-bold text-blue-600 dark:text-blue-400">100 PNGs</span> at once.
          </p>
        </div>

        {/* Mobile touch trigger button */}
        <div className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-blue-600 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-600/25 group-hover:bg-blue-700 active:scale-95 transition-all">
          <ImageIcon className="w-4 h-4" />
          <span>Browse Photos & Files</span>
        </div>

        {/* Feature Badges */}
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-700/60 grid grid-cols-3 gap-2 text-slate-600 dark:text-slate-400 text-[11px] font-semibold">
          <div className="flex flex-col items-center gap-1">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span className="truncate">100% Alpha Intact</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Zap className="w-4 h-4 text-amber-500" />
            <span className="truncate">2x & 4x AI Upscale</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Layers className="w-4 h-4 text-blue-500" />
            <span className="truncate">ZIP Batch Export</span>
          </div>
        </div>
      </div>
    </div>
  );
};
