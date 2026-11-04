import React, { useState } from 'react';
import { LocalLLMModel } from '../../types';
import { MOCK_LOCAL_MODELS } from '../../mock/data';
import { 
  Cpu, 
  Sparkles, 
  Play, 
  Square, 
  Zap, 
  Check
} from 'lucide-react';
import { 
  LiquidGlassCard, 
  LiquidGlassButton, 
  LiquidGlassBadge 
} from '../Glisse';

export const AISwitchboardView: React.FC = () => {
  const [models, setModels] = useState<LocalLLMModel[]>(MOCK_LOCAL_MODELS);
  const [selectedModel, setSelectedModel] = useState<LocalLLMModel>(models[0]);
  const [promptText, setPromptText] = useState('Explain how ARP discovery works in 2 concise sentences.');
  const [benchmarkResult, setBenchmarkResult] = useState<string | null>(null);
  const [isRunningInference, setIsRunningInference] = useState(false);
  const [freedMemoryToast, setFreedMemoryToast] = useState<string | null>(null);

  const totalVramAllocated = models
    .filter(m => m.status === 'loaded_in_vram')
    .reduce((acc, m) => acc + m.vramUsageGb, 0);

  const handleUnloadFromVram = (modelId: string) => {
    const target = models.find(m => m.id === modelId);
    if (!target) return;
    const freed = target.vramUsageGb;

    setModels(prev => prev.map(m => {
      if (m.id === modelId) {
        return { ...m, status: 'on_disk', vramUsageGb: 0 };
      }
      return m;
    }));

    setFreedMemoryToast(`Reclaimed ${freed} GB Unified Memory by unloading ${target.tag}`);
    setTimeout(() => setFreedMemoryToast(null), 3000);
  };

  const handleLoadIntoVram = (modelId: string) => {
    setModels(prev => prev.map(m => {
      if (m.id === modelId) {
        const alloc = +(m.sizeGb * 1.1).toFixed(1);
        return { ...m, status: 'loaded_in_vram', vramUsageGb: alloc };
      }
      return m;
    }));
  };

  const handleRunPrompt = () => {
    setIsRunningInference(true);
    setBenchmarkResult(null);

    setTimeout(() => {
      setBenchmarkResult(
        `[${selectedModel.tag} @ Apple Metal Core]\n` +
        `ARP (Address Resolution Protocol) broadcasts a query to the LAN asking which device owns a specific IP address. ` +
        `The host with that IP replies with its MAC address, allowing Ethernet frames to be routed locally.\n\n` +
        `Stats: 48.6 tokens/sec • Time-to-first-token: 180ms • VRAM: ${selectedModel.vramUsageGb || selectedModel.sizeGb} GB`
      );
      setIsRunningInference(false);
    }, 900);
  };

  return (
    <div className="space-y-5">
      {/* Toast */}
      {freedMemoryToast && (
        <LiquidGlassCard className="p-4 border-emerald-500/40 bg-emerald-500/10 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2 font-medium">
            <Check className="w-4 h-4 text-emerald-500" />
            <span>{freedMemoryToast}</span>
          </div>
        </LiquidGlassCard>
      )}

      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 tracking-tight">
            <Cpu className="w-5 h-5 text-blue-500 dark:text-sky-400" />
            Local LLM Switchboard & Unified VRAM Inspector
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Monitor and control Ollama and local LLM models loaded in Apple Silicon Unified Memory.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <LiquidGlassBadge variant="info">
            GPU Metal: {totalVramAllocated.toFixed(1)} GB / 16.0 GB VRAM
          </LiquidGlassBadge>
        </div>
      </div>

      {/* Model Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {models.map(model => {
          const isLoaded = model.status === 'loaded_in_vram';

          return (
            <LiquidGlassCard
              key={model.id}
              interactive
              onClick={() => setSelectedModel(model)}
              className={`p-4 flex flex-col justify-between gap-3 border ${
                selectedModel.id === model.id
                  ? 'border-blue-500 dark:border-blue-400 bg-blue-500/10 dark:bg-blue-500/15'
                  : ''
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <LiquidGlassBadge variant="neutral">
                    {model.parameterSize} • {model.quantization}
                  </LiquidGlassBadge>
                  <LiquidGlassBadge variant={isLoaded ? 'success' : 'neutral'} dot={isLoaded}>
                    {isLoaded ? 'In VRAM' : 'On Disk'}
                  </LiquidGlassBadge>
                </div>

                <h4 className="font-semibold text-slate-900 dark:text-white text-xs mt-3 truncate tracking-tight" title={model.name}>
                  {model.name}
                </h4>
                <p className="font-mono text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  {model.tag}
                </p>
              </div>

              <div className="mt-3.5 pt-3 border-t border-black/[0.06] dark:border-white/[0.07] flex items-center justify-between text-[11px]">
                <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                  {isLoaded ? `${model.vramUsageGb} GB VRAM` : `${model.sizeGb} GB Disk`}
                </span>

                {isLoaded ? (
                  <LiquidGlassButton
                    variant="danger"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUnloadFromVram(model.id);
                    }}
                    title="Unload model from GPU memory to free RAM"
                    leftIcon={<Square className="w-2.5 h-2.5 fill-current" />}
                  >
                    Free VRAM
                  </LiquidGlassButton>
                ) : (
                  <LiquidGlassButton
                    variant="glass"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLoadIntoVram(model.id);
                    }}
                    title="Load model into Apple Silicon GPU memory"
                    leftIcon={<Play className="w-2.5 h-2.5 fill-current text-blue-500" />}
                  >
                    Load
                  </LiquidGlassButton>
                )}
              </div>
            </LiquidGlassCard>
          );
        })}
      </div>

      {/* Model Benchmark & Prompt Playground */}
      <LiquidGlassCard className="p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-blue-500 dark:text-sky-400" />
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                Live Inference Playground ({selectedModel.tag})
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Execute prompts and measure token generation speed on Apple Silicon Metal cores.
              </p>
            </div>
          </div>

          <LiquidGlassButton
            variant="primary"
            size="md"
            onClick={handleRunPrompt}
            isLoading={isRunningInference}
            leftIcon={!isRunningInference ? <Zap className="w-3.5 h-3.5" /> : undefined}
          >
            {isRunningInference ? 'Generating...' : 'Run Benchmark'}
          </LiquidGlassButton>
        </div>

        <textarea
          value={promptText}
          onChange={(e) => setPromptText(e.target.value)}
          rows={2}
          className="w-full bg-black/[0.03] dark:bg-black/60 border border-black/[0.08] dark:border-white/10 rounded-xl p-3 text-xs font-mono text-slate-800 dark:text-sky-200 focus:outline-none focus:border-blue-500"
          placeholder="Enter prompt to test model..."
        />

        {benchmarkResult && (
          <div className="bg-slate-900 dark:bg-black/80 p-4 rounded-2xl border border-black/[0.08] dark:border-white/[0.08] font-mono text-xs text-slate-200 space-y-2 animate-in fade-in">
            <span className="text-xs font-medium text-blue-400 dark:text-sky-400">Output Stream</span>
            <pre className="whitespace-pre-wrap leading-relaxed text-[11px] text-slate-200">{benchmarkResult}</pre>
          </div>
        )}
      </LiquidGlassCard>
    </div>
  );
};
