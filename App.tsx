/**
 * Crystal Clear PNG Upscaler
 * 
 * Mobile-first batch PNG image upscaler with transparency preservation,
 * 2x and 4x AI scaling, before/after comparison, and Hugging Face
 * ZeroGPU Gradio integration.
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import JSZip from 'jszip';
import {
  UploadCloud,
  Sparkles,
  Layers,
  Settings,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Zap,
  Info,
  Sliders,
  FolderArchive,
  RefreshCw,
  Plus
} from 'lucide-react';

import { ImageFile, AppSettings, UpscaleFactor, BatchStats } from './types';
import { Navbar } from './components/Navbar';
import { UploadDropzone } from './components/UploadDropzone';
import { ImageCard } from './components/ImageCard';
import { BatchActionBar } from './components/BatchActionBar';
import { BeforeAfterModal } from './components/BeforeAfterModal';
import { SettingsModal } from './components/SettingsModal';
import {
  upscaleImage,
  getImageDimensions,
  isBackendConfigured,
  downloadFile
} from './services/upscaleService';
import { createSamplePngFiles } from './utils/sampleImages';

const MAX_BATCH_IMAGES = 100;
const SETTINGS_STORAGE_KEY = 'crystal_clear_settings_v1';
const THEME_STORAGE_KEY = 'crystal_clear_theme';

const DEFAULT_SETTINGS: AppSettings = {
  // Configurable Hugging Face Gradio ZeroGPU Backend URL
  backendUrl: '', // Connect your Hugging Face Space URL here (or in Settings UI)
  apiEndpoint: '/predict',
  defaultScaleFactor: 2,
  concurrency: 1,
  hfToken: '',
};

export default function App() {
  // Theme state
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Settings state
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    } catch (e) {
      console.error('Failed to parse saved settings', e);
    }
    return DEFAULT_SETTINGS;
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [images, setImages] = useState<ImageFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isZipGenerating, setIsZipGenerating] = useState(false);
  const [previewImage, setPreviewImage] = useState<ImageFile | null>(null);

  // Cancellation ref to halt batch processing
  const abortBatchRef = useRef<boolean>(false);

  // Apply dark mode class to root document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem(THEME_STORAGE_KEY, 'light');
    }
  }, [darkMode]);

  // Persist settings
  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
  };

  // Batch Statistics calculation
  const stats: BatchStats = useMemo(() => {
    const total = images.length;
    let pending = 0;
    let processing = 0;
    let completed = 0;
    let error = 0;
    let totalOriginalSize = 0;
    let totalOutputSize = 0;

    for (const img of images) {
      totalOriginalSize += img.size;
      if (img.status === 'completed') {
        completed++;
        totalOutputSize += img.outputSize || 0;
      } else if (img.status === 'processing') {
        processing++;
      } else if (img.status === 'error') {
        error++;
      } else {
        pending++;
      }
    }

    return {
      total,
      pending,
      processing,
      completed,
      error,
      totalOriginalSize,
      totalOutputSize,
    };
  }, [images]);

  // Handle addition of new PNG files
  const handleFilesSelected = async (newFiles: File[]) => {
    const slotsLeft = MAX_BATCH_IMAGES - images.length;
    if (slotsLeft <= 0) return;

    const filesToProcess = newFiles.slice(0, slotsLeft);
    const newEntries: ImageFile[] = [];

    for (const file of filesToProcess) {
      const id = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const previewUrl = URL.createObjectURL(file);

      // Create entry with temporary 0 dimensions
      const entry: ImageFile = {
        id,
        file,
        preview: previewUrl,
        width: 0,
        height: 0,
        size: file.size,
        status: 'idle',
        progress: 0,
        scaleFactor: settings.defaultScaleFactor,
      };

      newEntries.push(entry);

      // Async calculate natural dimensions
      getImageDimensions(previewUrl)
        .then((dims) => {
          setImages((prev) =>
            prev.map((item) =>
              item.id === id ? { ...item, width: dims.width, height: dims.height } : item
            )
          );
        })
        .catch(() => {
          // If fail to parse dimensions, keep 0
        });
    }

    setImages((prev) => [...prev, ...newEntries]);
  };

  // Load sample transparent PNGs for testing
  const handleLoadSamples = async () => {
    const sampleFiles = await createSamplePngFiles();
    handleFilesSelected(sampleFiles);
  };

  // Remove individual image
  const handleRemoveImage = (id: string) => {
    setImages((prev) => {
      const target = prev.find((img) => img.id === id);
      if (target?.preview) URL.revokeObjectURL(target.preview);
      if (target?.outputUrl && target.outputUrl.startsWith('blob:')) {
        URL.revokeObjectURL(target.outputUrl);
      }
      return prev.filter((img) => img.id !== id);
    });
  };

  // Scale factor change per image
  const handleScaleChange = (id: string, factor: UpscaleFactor) => {
    setImages((prev) =>
      prev.map((img) => (img.id === id ? { ...img, scaleFactor: factor } : img))
    );
  };

  // Change all images scale factor
  const handleSetGlobalScale = (factor: UpscaleFactor) => {
    setImages((prev) =>
      prev.map((img) => (img.status !== 'completed' ? { ...img, scaleFactor: factor } : img))
    );
  };

  // Retry failed image
  const handleRetryImage = (id: string) => {
    setImages((prev) =>
      prev.map((img) =>
        img.id === id ? { ...img, status: 'idle', error: undefined, progress: 0 } : img
      )
    );
  };

  // Clear all images
  const handleClearAll = () => {
    images.forEach((img) => {
      if (img.preview) URL.revokeObjectURL(img.preview);
      if (img.outputUrl && img.outputUrl.startsWith('blob:')) {
        URL.revokeObjectURL(img.outputUrl);
      }
    });
    setImages([]);
  };

  // Clear completed only
  const handleClearCompleted = () => {
    setImages((prev) => {
      const remaining: ImageFile[] = [];
      prev.forEach((img) => {
        if (img.status === 'completed') {
          if (img.preview) URL.revokeObjectURL(img.preview);
          if (img.outputUrl && img.outputUrl.startsWith('blob:')) {
            URL.revokeObjectURL(img.outputUrl);
          }
        } else {
          remaining.push(img);
        }
      });
      return remaining;
    });
  };

  // Start Batch Upscaling Queue
  const handleStartBatch = async () => {
    if (!isBackendConfigured(settings.backendUrl)) {
      setIsSettingsOpen(true);
      return;
    }

    setIsProcessing(true);
    abortBatchRef.current = false;

    // Get list of IDs that need processing
    const pendingIds = images
      .filter((img) => img.status === 'idle' || img.status === 'error' || img.status === 'queued')
      .map((img) => img.id);

    if (pendingIds.length === 0) {
      setIsProcessing(false);
      return;
    }

    // Mark pending images as queued
    setImages((prev) =>
      prev.map((img) =>
        pendingIds.includes(img.id) && img.status !== 'completed'
          ? { ...img, status: 'queued', progress: 0, error: undefined }
          : img
      )
    );

    // Controlled concurrency queue
    const queue = [...pendingIds];
    const concurrency = Math.max(1, Math.min(2, settings.concurrency || 1));

    const worker = async () => {
      while (queue.length > 0 && !abortBatchRef.current) {
        const nextId = queue.shift();
        if (!nextId) break;

        // Current image ref
        const currentItem = images.find((i) => i.id === nextId);
        if (!currentItem) continue;

        // Mark as processing
        setImages((prev) =>
          prev.map((img) => (img.id === nextId ? { ...img, status: 'processing', progress: 10 } : img))
        );

        try {
          const result = await upscaleImage(
            currentItem.file,
            currentItem.scaleFactor,
            settings.backendUrl,
            {
              endpoint: settings.apiEndpoint,
              hfToken: settings.hfToken,
              onProgress: (p) => {
                setImages((prev) =>
                  prev.map((img) => (img.id === nextId ? { ...img, progress: p } : img))
                );
              },
            }
          );

          if (abortBatchRef.current) {
            setImages((prev) =>
              prev.map((img) =>
                img.id === nextId ? { ...img, status: 'canceled', progress: 0 } : img
              )
            );
            break;
          }

          setImages((prev) =>
            prev.map((img) =>
              img.id === nextId
                ? {
                    ...img,
                    status: 'completed',
                    progress: 100,
                    outputUrl: result.outputUrl,
                    outputBlob: result.outputBlob,
                    outputWidth: result.outputWidth,
                    outputHeight: result.outputHeight,
                    outputSize: result.outputSize,
                    completedAt: Date.now(),
                  }
                : img
            )
          );
        } catch (err: any) {
          console.error(`Error processing image ${currentItem.file.name}:`, err);
          setImages((prev) =>
            prev.map((img) =>
              img.id === nextId
                ? {
                    ...img,
                    status: 'error',
                    progress: 0,
                    error: err?.message || 'Inference error on ZeroGPU backend',
                  }
                : img
            )
          );
        }
      }
    };

    // Run workers
    const activeWorkers: Promise<void>[] = [];
    for (let i = 0; i < concurrency; i++) {
      activeWorkers.push(worker());
    }

    await Promise.all(activeWorkers);
    setIsProcessing(false);
  };

  // Stop/Cancel batch processing
  const handleCancelBatch = () => {
    abortBatchRef.current = true;
    setIsProcessing(false);
    setImages((prev) =>
      prev.map((img) =>
        img.status === 'processing' || img.status === 'queued'
          ? { ...img, status: 'canceled', progress: 0 }
          : img
      )
    );
  };

  // Generate and download all completed images as a single ZIP archive
  const handleDownloadZip = async () => {
    const completedItems = images.filter((img) => img.status === 'completed' && (img.outputBlob || img.outputUrl));
    if (completedItems.length === 0) return;

    setIsZipGenerating(true);
    try {
      const zip = new JSZip();
      const folder = zip.folder('crystal_clear_upscaled');

      for (const item of completedItems) {
        let blob = item.outputBlob;

        // If blob is not cached directly, fetch from outputUrl
        if (!blob && item.outputUrl) {
          const res = await fetch(item.outputUrl);
          blob = await res.blob();
        }

        if (blob) {
          const cleanName = item.file.name.replace(/\.[^/.]+$/, '');
          const filename = `upscaled_${item.scaleFactor}x_${cleanName}.png`;
          folder?.file(filename, blob);
        }
      }

      const zipBlob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 },
      });

      const zipUrl = URL.createObjectURL(zipBlob);
      downloadFile(zipUrl, `crystal_clear_batch_${Date.now()}.zip`);
      setTimeout(() => URL.revokeObjectURL(zipUrl), 5000);
    } catch (e) {
      console.error('Failed to create ZIP', e);
      alert('Could not generate ZIP archive. You can still download individual PNG files.');
    } finally {
      setIsZipGenerating(false);
    }
  };

  const backendReady = isBackendConfigured(settings.backendUrl);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      
      {/* Top Navigation */}
      <Navbar
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        backendUrl={settings.backendUrl}
        totalImages={stats.total}
        completedImages={stats.completed}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 pb-28 space-y-6">
        
        {/* Backend Alert Banner if not configured */}
        {!backendReady && (
          <div className="rounded-3xl p-4 sm:p-5 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-transparent border border-blue-200/80 dark:border-blue-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-2xl bg-blue-600 text-white shrink-0 shadow-md shadow-blue-500/20">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  Connect Hugging Face ZeroGPU Space
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Real AI inference runs on your Hugging Face ZeroGPU Gradio Space. Paste your direct space URL in settings to begin batch upscaling.
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs shrink-0 shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Settings className="w-4 h-4" />
              <span>Configure Backend</span>
            </button>
          </div>
        )}

        {/* Hero Title and Subhead (PixcraftAI inspired clean layout) */}
        <div className="text-center sm:text-left space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100/70 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-[11px] font-bold text-blue-700 dark:text-blue-300 mb-1">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>Preserves 100% Alpha Transparency</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            High Precision PNG Upscaler
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium max-w-xl">
            Batch upscale PNG images up to 4x resolution using Hugging Face ZeroGPU AI models. Retains crisp borders and transparent cutouts.
          </p>
        </div>

        {/* Upload Dropzone Area */}
        <section aria-label="Upload Area">
          <UploadDropzone
            onFilesSelected={handleFilesSelected}
            currentCount={images.length}
            maxCount={MAX_BATCH_IMAGES}
            compact={images.length > 0}
          />
        </section>

        {/* Quick Sample Trigger if empty */}
        {images.length === 0 && (
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={handleLoadSamples}
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Don't have a PNG right now? Click to load 2 transparent test badges</span>
            </button>
          </div>
        )}

        {/* Batch Queue List */}
        {images.length > 0 && (
          <section className="space-y-3" aria-label="Image List">
            
            {/* List Header Bar */}
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white uppercase tracking-wider">
                  Queue ({images.length} / {MAX_BATCH_IMAGES})
                </span>
                {stats.completed > 0 && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    {stats.completed} Done
                  </span>
                )}
              </div>

              {/* Quick info */}
              <span className="text-[11px] text-slate-400 hidden sm:inline">
                Tap image thumbnail to open Before / After slider
              </span>
            </div>

            {/* Image Cards */}
            <div className="grid grid-cols-1 gap-2.5">
              {images.map((img) => (
                <ImageCard
                  key={img.id}
                  image={img}
                  onRemove={handleRemoveImage}
                  onRetry={handleRetryImage}
                  onScaleChange={handleScaleChange}
                  onOpenPreview={(selected) => setPreviewImage(selected)}
                  isBatchRunning={isProcessing}
                />
              ))}
            </div>

          </section>
        )}

      </main>

      {/* Sticky Bottom Batch Action Bar */}
      {images.length > 0 && (
        <BatchActionBar
          stats={stats}
          isProcessing={isProcessing}
          onStartBatch={handleStartBatch}
          onCancelBatch={handleCancelBatch}
          onDownloadZip={handleDownloadZip}
          onClearAll={handleClearAll}
          onClearCompleted={handleClearCompleted}
          onSetGlobalScale={handleSetGlobalScale}
          isZipGenerating={isZipGenerating}
        />
      )}

      {/* Floating Add Button for Mobile when scrolled down and images exist */}
      {images.length > 0 && images.length < MAX_BATCH_IMAGES && (
        <label
          className="fixed bottom-24 right-4 sm:bottom-28 sm:right-8 z-30 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-600/30 flex items-center justify-center cursor-pointer active:scale-90 transition-transform"
          title="Add more PNGs"
        >
          <Plus className="w-6 h-6" />
          <input
            type="file"
            multiple
            accept="image/png"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleFilesSelected(Array.from(e.target.files));
                e.target.value = '';
              }
            }}
          />
        </label>
      )}

      {/* Before / After Comparison Modal */}
      <BeforeAfterModal
        image={previewImage}
        onClose={() => setPreviewImage(null)}
      />

      {/* Backend Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={handleSaveSettings}
      />

    </div>
  );
}
