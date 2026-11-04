import React, { useState, useEffect } from 'react';
import { LocalLLMModel } from '../../types';
import * as api from '../../services/api';
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
  const [models, setModels] = useState<LocalLLMModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<LocalLLMModel | null>(null);
  const [promptText, setPromptText] = useState('Explain how ARP discovery works in 2 concise sentences.');
  const [benchmarkResult, setBenchmarkResult] = useState<string | null>(null);
  const [isRunningInference, setIsRunningInference] = useState(false);
  const [freedMemoryToast, setFreedMemoryToast] = useState<string | null>(null);

  useEffect(() => {
    api.fetchSwitchboardModels().then(data => {
      if (data && data.models) {
        setModels(data.models);
        if (data.models.length > 0) {
          setSelectedModel(data.models[0]);
        }
      }
    }).catch(e => console.error('Error fetching switchboard models:', e));
  }, []);

  const totalVramAllocated = models
    .filter(m => m.status === 'loaded_in_vram')
    .reduce((acc, m) => acc + (m.vramUsageGb || 0), 0);

  const handleUnloadFromVram = async (modelId: string) => {
    const target = models.find(m => m.id === modelId);
    try {
      const res = await api.unloadModelFromVram(modelId);
      if (res && res.model) {
        setModels(prev => prev.map(m => m.id === modelId ? res.model : m));
        if (selectedModel?.id === modelId) {
          setSelectedModel(res.model);
        }
        setFreedMemoryToast(`Reclaimed ${target?.vramUsageGb || 2.2} GB Unified Memory by unloading ${res.model.tag}`);
        setTimeout(() => setFreedMemoryToast(null), 3000);
      }
    } catch (e) {
      console.error('Failed to unload model from VRAM:', e);
    }
  };

  const handleLoadIntoVram = async (modelId: string) => {
    try {
      const res = await api.loadModelInVram(modelId);
      if (res && res.model) {
        setModels(prev => prev.map(m => m.id === modelId ? res.model : m));
        if (selectedModel?.id === modelId) {
          setSelectedModel(res.model);
        }
      }
    } catch (e) {
      console.error('Failed to load model into VRAM:', e);
    }
  };

  const handleRunPrompt = async () => {
    if (!selectedModel) return;
    setIsRunningInference(true);
    setBenchmarkResult(null);

    try {
      const res = await api.benchmarkModel(selectedModel.id, promptText);
      if (res && res.fullOutput) {
        setBenchmarkResult(res.fullOutput);
      } else if (res && res.response) {
        setBenchmarkResult(res.response);
      }
    } catch (e: any) {
      setBenchmarkResult(`Error running benchmark: ${e.message || e}`);
    } finally {
      setIsRunningInference(false);
    }
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

      {/* Model Cards Grid or Clean Empty State */}
      {models.length === 0 ? (
        <LiquidGlassCard className="p-8 text-center space-y-3 border-dashed border-black/[0.1] dark:border-white/[0.1]">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-blue-500/10 text-blue-500 dark:text-sky-400 flex items-center justify-center">
            <Cpu className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">No Local LLM Models Installed</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
            Net GUI integrates directly with local runtimes (Ollama, LM Studio, vLLM) at <code>http://127.0.0.1:11434</code>.
            Install Ollama and run <code className="px-1.5 py-0.5 rounded bg-black/[0.05] dark:bg-white/[0.08] font-mono text-blue-600 dark:text-sky-300">ollama pull llama3.2</code> to inspect unified memory allocation and run local GPU benchmarks.
          </p>
        </LiquidGlassCard>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {models.map(model => {
            const isLoaded = model.status === 'loaded_in_vram';

            return (
              <LiquidGlassCard
                key={model.id}
                interactive
                onClick={() => setSelectedModel(model)}
                className={`p-4 flex flex-col justify-between gap-3 border ${
                  selectedModel?.id === model.id
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
      )}

      {/* Model Benchmark & Prompt Playground */}
      <LiquidGlassCard className="p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-blue-500 dark:text-sky-400" />
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                Live Inference Playground ({selectedModel?.tag || 'Select Model'})
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
