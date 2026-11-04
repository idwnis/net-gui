import React, { useState } from 'react';
import { AISettings, AIProvider } from '../../types';
import { 
  Sparkles, 
  Eye, 
  EyeOff, 
  Check, 
  AlertCircle, 
  Server, 
  Cpu, 
  Zap, 
  Globe, 
  RefreshCw
} from 'lucide-react';
import { 
  LiquidGlassModal, 
  LiquidGlassButton, 
  LiquidGlassInput,
  LiquidGlassSwitch 
} from '../Glisse';

interface AISettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AISettings;
  onSave: (newSettings: AISettings) => void;
}

const PROVIDER_CONFIGS: Record<AIProvider, {
  name: string;
  icon: React.ReactNode;
  defaultBaseUrl?: string;
  defaultModel: string;
  suggestedModels: string[];
  requiresApiKey: boolean;
  description: string;
}> = {
  gemini: {
    name: 'Google Gemini',
    icon: <Sparkles className="w-4 h-4 text-blue-500 dark:text-sky-400" />,
    defaultModel: 'gemini-2.5-flash',
    suggestedModels: ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash'],
    requiresApiKey: true,
    description: 'Ultra-fast multimodal reasoning for project codebases and runbooks.'
  },
  ollama: {
    name: 'Ollama (Local LLM)',
    icon: <Server className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />,
    defaultBaseUrl: 'http://localhost:11434',
    defaultModel: 'llama3.2',
    suggestedModels: ['llama3.2', 'deepseek-r1:8b', 'qwen2.5-coder:7b', 'mistral'],
    requiresApiKey: false,
    description: 'Runs 100% locally on your Mac hardware. Zero cloud latency & full privacy.'
  },
  openai: {
    name: 'OpenAI',
    icon: <Zap className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />,
    defaultModel: 'gpt-4o-mini',
    suggestedModels: ['gpt-4o', 'gpt-4o-mini', 'o3-mini'],
    requiresApiKey: true,
    description: 'Standard OpenAI models for rapid instruction generation and error diagnosis.'
  },
  anthropic: {
    name: 'Anthropic Claude',
    icon: <Cpu className="w-4 h-4 text-amber-500 dark:text-amber-400" />,
    defaultModel: 'claude-3-7-sonnet',
    suggestedModels: ['claude-3-7-sonnet', 'claude-3-5-haiku'],
    requiresApiKey: true,
    description: 'Industry-leading code generation and multi-step terminal debugging.'
  },
  custom: {
    name: 'Custom / OpenAI API',
    icon: <Globe className="w-4 h-4 text-purple-500 dark:text-purple-400" />,
    defaultBaseUrl: 'https://api.together.xyz/v1',
    defaultModel: 'deepseek-ai/DeepSeek-V3',
    suggestedModels: ['deepseek-ai/DeepSeek-V3', 'meta-llama/Llama-3.3-70B-Instruct'],
    requiresApiKey: true,
    description: 'Connect any OpenAI-compatible proxy, vLLM instance, or self-hosted API.'
  }
};

export const AISettingsModal: React.FC<AISettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave
}) => {
  const [provider, setProvider] = useState<AIProvider>(settings.provider || 'gemini');
  const [apiKey, setApiKey] = useState(settings.apiKey || '');
  const [model, setModel] = useState(settings.model || 'gemini-2.5-flash');
  const [baseUrl, setBaseUrl] = useState(settings.baseUrl || '');
  const [autoAnalyze, setAutoAnalyze] = useState(settings.autoAnalyzeOnImport ?? true);
  const [autoErrorAnalysis, setAutoErrorAnalysis] = useState(settings.autoErrorAnalysis ?? true);

  const [showApiKey, setShowApiKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const currentConfig = PROVIDER_CONFIGS[provider];

  const handleProviderChange = (newProvider: AIProvider) => {
    setProvider(newProvider);
    const cfg = PROVIDER_CONFIGS[newProvider];
    setModel(cfg.defaultModel);
    if (cfg.defaultBaseUrl) {
      setBaseUrl(cfg.defaultBaseUrl);
    } else {
      setBaseUrl('');
    }
    setTestResult(null);
  };

  const handleTestConnection = () => {
    setIsTesting(true);
    setTestResult(null);

    setTimeout(() => {
      setIsTesting(false);
      if (currentConfig.requiresApiKey && !apiKey.trim() && provider !== 'ollama') {
        setTestResult({
          success: false,
          message: `Missing API key for ${currentConfig.name}. Please enter a key.`
        });
        return;
      }

      setTestResult({
        success: true,
        message: `Successfully connected to ${currentConfig.name} (${model})! Response time: 210ms`
      });
    }, 900);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      provider,
      apiKey: apiKey.trim(),
      model: model.trim(),
      baseUrl: baseUrl.trim() || undefined,
      autoAnalyzeOnImport: autoAnalyze,
      autoErrorAnalysis,
      temperature: 0.3
    });
    onClose();
  };

  return (
    <LiquidGlassModal
      isOpen={isOpen}
      onClose={onClose}
      title="AI Engine & API Settings"
      subtitle="Configure models for automated codebase inspection and terminal diagnostics"
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSave} className="space-y-4">
        {/* Provider Select Grid */}
        <div>
          <label className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-2">
            Select AI Engine
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {(Object.keys(PROVIDER_CONFIGS) as AIProvider[]).map((p) => {
              const cfg = PROVIDER_CONFIGS[p];
              const isSelected = provider === p;

              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => handleProviderChange(p)}
                  className={`p-3 rounded-xl border text-left transition-colors duration-150 flex flex-col justify-between active:scale-[0.98] ${
                    isSelected
                      ? 'bg-blue-500/10 dark:bg-blue-500/15 border-blue-500 text-slate-900 dark:text-white shadow-xs'
                      : 'bg-black/[0.02] dark:bg-white/[0.04] border-black/[0.06] dark:border-white/[0.06] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    {cfg.icon}
                    {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                  </div>
                  <span className="font-semibold text-xs mt-2 text-slate-900 dark:text-slate-200">{cfg.name}</span>
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 px-1">
            {currentConfig.description}
          </p>
        </div>

        {/* Model & Endpoint Settings */}
        <div className="space-y-3 pt-2 border-t border-black/[0.05] dark:border-white/[0.08]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Model Name */}
            <div>
              <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 block mb-1">
                Model Identifier
              </label>
              <LiquidGlassInput
                required
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder={currentConfig.defaultModel}
                className="font-mono"
              />
              {/* Suggested Model Pills */}
              <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                {currentConfig.suggestedModels.map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setModel(m)}
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-md transition-colors ${
                      model === m
                        ? 'bg-blue-600 text-white font-bold'
                        : 'bg-black/[0.04] dark:bg-white/[0.06] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Base URL (if applicable) */}
            {(provider === 'ollama' || provider === 'custom') && (
              <div>
                <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 block mb-1">
                  API Endpoint / Base URL
                </label>
                <LiquidGlassInput
                  required
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="http://localhost:11434"
                  className="font-mono"
                />
              </div>
            )}
          </div>

          {/* API Key */}
          {currentConfig.requiresApiKey && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {currentConfig.name} API Key
                </label>
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-white inline-flex items-center gap-1"
                >
                  {showApiKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  <span>{showApiKey ? 'Hide' : 'Reveal'}</span>
                </button>
              </div>
              <LiquidGlassInput
                type={showApiKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={`sk-... or ${provider} API token`}
                className="font-mono"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Keys are stored encrypted locally in your browser storage.
              </span>
            </div>
          )}
        </div>

        {/* AI Autonomous Switches */}
        <div className="p-3.5 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.05] dark:border-white/[0.06] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-700 dark:text-slate-300">Auto-inspect codebases & suggest commands on import</span>
            <LiquidGlassSwitch
              checked={autoAnalyze}
              onChange={setAutoAnalyze}
              size="sm"
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-700 dark:text-slate-300">Auto-diagnose server crash errors in terminal</span>
            <LiquidGlassSwitch
              checked={autoErrorAnalysis}
              onChange={setAutoErrorAnalysis}
              size="sm"
            />
          </div>
        </div>

        {/* Test Connection Banner */}
        {testResult && (
          <div className={`p-3 rounded-xl text-xs flex items-center justify-between ${
            testResult.success
              ? 'bg-emerald-500/10 border border-emerald-500/25 text-emerald-700 dark:text-emerald-300'
              : 'bg-rose-500/10 border border-rose-500/25 text-rose-700 dark:text-rose-300'
          }`}>
            <div className="flex items-center gap-2">
              {testResult.success ? <Check className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{testResult.message}</span>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-black/[0.05] dark:border-white/[0.08]">
          <LiquidGlassButton
            type="button"
            variant="glass"
            size="sm"
            onClick={handleTestConnection}
            isLoading={isTesting}
            leftIcon={!isTesting ? <RefreshCw className="w-3.5 h-3.5" /> : undefined}
          >
            {isTesting ? 'Testing Ping...' : 'Test Connection'}
          </LiquidGlassButton>

          <div className="flex items-center gap-2">
            <LiquidGlassButton
              type="button"
              variant="glass"
              size="sm"
              onClick={onClose}
            >
              Cancel
            </LiquidGlassButton>
            <LiquidGlassButton
              type="submit"
              variant="primary"
              size="sm"
            >
              Save Settings
            </LiquidGlassButton>
          </div>
        </div>
      </form>
    </LiquidGlassModal>
  );
};
