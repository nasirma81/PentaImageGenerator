import React, { useState } from 'react';
import { Copy, Check, Terminal, ImageIcon, Loader2 } from 'lucide-react';

interface PromptDisplayProps {
  promptText: string;
  onGenerateImage: () => void;
  isGeneratingImage: boolean;
}

export const PromptDisplay: React.FC<PromptDisplayProps> = ({ promptText, onGenerateImage, isGeneratingImage }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(promptText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div className="w-full animate-fade-in mt-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-3">
        <div className="flex items-center gap-2 text-indigo-400">
          <Terminal size={18} />
          <h3 className="font-semibold tracking-wide text-sm uppercase">Generated Prompt</h3>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 rounded-md text-xs font-medium transition-all duration-200 border ${
              copied
                ? 'bg-green-500/10 border-green-500/50 text-green-400'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
          
          <button
            onClick={onGenerateImage}
            disabled={isGeneratingImage}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-md text-xs font-bold transition-all duration-200 bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/20 disabled:opacity-50 disabled:cursor-not-allowed border border-transparent"
          >
            {isGeneratingImage ? <Loader2 size={14} className="animate-spin" /> : <ImageIcon size={14} />}
            {isGeneratingImage ? 'Generating...' : 'Generate Image'}
          </button>
        </div>
      </div>

      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg blur opacity-30 group-hover:opacity-50 transition duration-1000"></div>
        <div className="relative bg-slate-900 border border-slate-700 rounded-lg p-6 shadow-xl">
          <p className="font-mono text-sm leading-relaxed text-slate-300 whitespace-pre-wrap break-words">
            {promptText}
          </p>
        </div>
      </div>
      
      <div className="mt-2 text-right">
        <span className="text-xs text-slate-500">Optimized for Gemini, Midjourney & Stable Diffusion</span>
      </div>
    </div>
  );
};