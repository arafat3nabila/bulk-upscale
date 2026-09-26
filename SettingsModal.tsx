import React, { useState } from 'react';
import { X, Server, Check, AlertCircle, Loader2, Sparkles, ExternalLink, HelpCircle, Key, Cpu } from 'lucide-react';
import { AppSettings, UpscaleFactor } from '../types';
import { testBackendConnection, normalizeUrl } from '../services/upscaleService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSave: (newSettings: AppSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave,
}) => {
  const [formData, setFormData] = useState<AppSettings>(settings);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await testBackendConnection(formData.backendUrl, formData.hfToken);
      setTestResult(res);
    } catch (e: any) {
      setTestResult({ ok: false, message: e?.message || 'Connection test failed' });
    } finally {
      setTesting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Backend Settings
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Hugging Face ZeroGPU Gradio Space API
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Instructions Banner */}
          <div className="p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60 text-xs text-blue-950 dark:text-blue-200 space-y-1">
            <div className="font-semibold flex items-center gap-1.5 text-blue-800 dark:text-blue-300">
              <Sparkles className="w-4 h-4" />
              ZeroGPU AI Inference
            </div>
            <p className="leading-relaxed opacity-90">
              Enter your Hugging Face Gradio Space URL below. All upscaling runs on real AI hardware without local GPU heating.
            </p>
          </div>

          {/* Backend URL input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>Hugging Face Space URL</span>
              <span className="text-[10px] font-normal text-slate-400">Direct Domain (.hf.space)</span>
            </label>
            <div className="relative">
              <input
                type="url"
                value={formData.backendUrl}
                onChange={(e) => {
                  setFormData({ ...formData, backendUrl: e.target.value });
                  setTestResult(null);
                }}
                placeholder="https://your-username-upscaler.hf.space"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                required
              />
            </div>
            <p className="text-[11px] text-slate-400 flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5 shrink-0" />
              Example: <code className="text-blue-600 dark:text-blue-400">https://finegrain-image-enhancer.hf.space</code>
            </p>
          </div>

          {/* Test Connection Button & Result */}
          <div>
            <button
              type="button"
              onClick={handleTest}
              disabled={testing || !formData.backendUrl.trim()}
              className="w-full py-2.5 px-4 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-xs font-bold flex items-center justify-center gap-2 hover:bg-blue-100 dark:hover:bg-blue-900/50 disabled:opacity-50 transition-colors cursor-pointer"
            >
              {testing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  Testing Space Connection...
                </>
              ) : (
                <>
                  <Server className="w-4 h-4" />
                  Test Gradio Space Status
                </>
              )}
            </button>

            {testResult && (
              <div
                className={`mt-2 p-3 rounded-xl border text-xs flex items-start gap-2 ${
                  testResult.ok
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                    : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
                }`}
              >
                {testResult.ok ? (
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-semibold">{testResult.ok ? 'Connection Verified' : 'Connection Error'}</p>
                  <p className="text-[11px] opacity-90 mt-0.5 leading-relaxed">{testResult.message}</p>
                </div>
              </div>
            )}
          </div>

          {/* Endpoint Name & Scale Factor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Gradio Endpoint
              </label>
              <input
                type="text"
                value={formData.apiEndpoint}
                onChange={(e) => setFormData({ ...formData, apiEndpoint: e.target.value })}
                placeholder="/predict"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-[10px] text-slate-400">Usually /predict or /upscale</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Default Scale Factor
              </label>
              <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, defaultScaleFactor: 2 })}
                  className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                    formData.defaultScaleFactor === 2
                      ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  2x Scale
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, defaultScaleFactor: 4 })}
                  className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                    formData.defaultScaleFactor === 4
                      ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  4x Scale
                </button>
              </div>
              <p className="text-[10px] text-slate-400">Can also toggle per image</p>
            </div>
          </div>

          {/* Concurrency Settings */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-blue-500" />
                Queue Concurrency
              </label>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {formData.concurrency === 1 ? '1 image (Sequential)' : `${formData.concurrency} parallel`}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              ZeroGPU spaces perform best with sequential processing (1) to prevent queue rejection.
            </p>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, concurrency: 1 })}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                  formData.concurrency === 1
                    ? 'border-blue-500 bg-blue-50/50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                1 (Recommended for ZeroGPU)
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, concurrency: 2 })}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                  formData.concurrency === 2
                    ? 'border-blue-500 bg-blue-50/50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                2 (Fast Dedicated Hardware)
              </button>
            </div>
          </div>

          {/* Optional HF Token */}
          <div className="space-y-1.5 pt-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-slate-400" />
              HF User Token <span className="text-[10px] font-normal text-slate-400">(Optional - for private spaces)</span>
            </label>
            <input
              type="password"
              value={formData.hfToken || ''}
              onChange={(e) => setFormData({ ...formData, hfToken: e.target.value })}
              placeholder="hf_xxxxxxxxxxxxxxxxxxxxxxxxx"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Modal Actions */}
          <div className="pt-3 flex gap-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] font-bold text-xs text-white shadow-md shadow-blue-600/20 transition-all"
            >
              Save Configuration
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
