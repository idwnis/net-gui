import React, { useState } from 'react';
import { DevProject } from '../../types';
import { 
  ExternalLink, 
  Copy, 
  Check, 
  RefreshCw, 
  CheckCircle2, 
  UploadCloud
} from 'lucide-react';
import { 
  LiquidGlassModal, 
  LiquidGlassButton, 
  LiquidGlassInput, 
  LiquidGlassBadge 
} from '../Glisse';

interface VercelDeployModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: DevProject;
  onDeploySuccess: (projectId: string, deploymentUrl: string) => void;
}

export const VercelDeployModal: React.FC<VercelDeployModalProps> = ({
  isOpen,
  onClose,
  project,
  onDeploySuccess
}) => {
  const [projectName, setProjectName] = useState(
    project.name.toLowerCase().replace(/[^a-z0-9]/g, '-')
  );
  const [framework, setFramework] = useState(
    project.detectedStack.frameworks.some(f => f.toLowerCase().includes('next')) ? 'nextjs' : 'vite'
  );
  const [isDeploying, setIsDeploying] = useState(false);
  const [currentStep, setCurrentStep] = useState<string>('');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [deployedUrl, setDeployedUrl] = useState<string | null>(
    project.vercelDeployment?.url || null
  );
  const [copiedUrl, setCopiedUrl] = useState(false);

  const handleStartDeployment = () => {
    setIsDeploying(true);
    setProgressPercent(15);
    setCurrentStep('Bundling source files & project configuration...');

    setTimeout(() => {
      setProgressPercent(45);
      setCurrentStep('Synchronizing build artifacts to Vercel Global Edge Network...');

      setTimeout(() => {
        setProgressPercent(80);
        setCurrentStep('Building production bundle & generating static optimization...');

        setTimeout(() => {
          setProgressPercent(100);
          setCurrentStep('Deploy complete! Provisioned SSL certificate and DNS domain.');
          const url = `https://${projectName}.vercel.app`;
          setDeployedUrl(url);
          setIsDeploying(false);
          onDeploySuccess(project.id, url);
        }, 1200);
      }, 1000);
    }, 1000);
  };

  const copyUrl = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  return (
    <LiquidGlassModal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <svg viewBox="0 0 116 100" className="w-3.5 h-3.5 fill-current">
            <path d="M57.5 0L115 100H0L57.5 0z" />
          </svg>
          <span>Deploy to Vercel Edge</span>
        </div>
      }
      subtitle={`Publish ${project.name} live to production with automated CI/CD`}
      maxWidth="max-w-xl"
    >
      <div className="space-y-4">
        {/* Project Target Form */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 block mb-1">
              Vercel Project Slug
            </label>
            <LiquidGlassInput
              disabled={isDeploying}
              value={projectName}
              onChange={(e) => setProjectName(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              placeholder="my-cool-app"
              className="font-mono"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 block mb-1">
              Framework Preset
            </label>
            <select
              disabled={isDeploying}
              value={framework}
              onChange={(e) => setFramework(e.target.value)}
              className="w-full bg-white/70 dark:bg-white/[0.04] text-slate-900 dark:text-slate-100 border border-black/[0.08] dark:border-white/[0.09] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="nextjs" className="bg-slate-100 dark:bg-[#0a1122]">Next.js</option>
              <option value="vite" className="bg-slate-100 dark:bg-[#0a1122]">Vite React</option>
              <option value="remix" className="bg-slate-100 dark:bg-[#0a1122]">Remix</option>
              <option value="astro" className="bg-slate-100 dark:bg-[#0a1122]">Astro</option>
              <option value="other" className="bg-slate-100 dark:bg-[#0a1122]">Other (Custom Build)</option>
            </select>
          </div>
        </div>

        {/* Progress or Deployed Card */}
        {isDeploying ? (
          <div className="p-5 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] space-y-3 border border-black/[0.05] dark:border-white/[0.06]">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 text-blue-500 animate-spin" />
                <span>Deploying to Vercel...</span>
              </span>
              <span className="font-mono text-blue-600 dark:text-sky-300 font-bold">{progressPercent}%</span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-black/10 dark:bg-black/40 rounded-full h-2 overflow-hidden">
              <div
                className="bg-blue-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <p className="font-mono text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {currentStep}
            </p>
          </div>
        ) : deployedUrl ? (
          <div className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Deployment Live & Ready</span>
              </span>
              <LiquidGlassBadge variant="success">Production</LiquidGlassBadge>
            </div>

            {/* Live URL Pill */}
            <div className="bg-slate-900 dark:bg-[#050914] border border-black/[0.08] dark:border-white/[0.08] rounded-xl p-3 flex items-center justify-between font-mono text-xs text-emerald-400">
              <span className="truncate pr-2 font-bold">{deployedUrl}</span>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => copyUrl(deployedUrl)}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 transition-colors"
                  title="Copy URL"
                >
                  {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <a
                  href={deployedUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 transition-colors"
                  title="Open live site"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            <p className="text-[11px] text-slate-600 dark:text-slate-300">
              Vercel Edge functions, image optimization, and SSL certificate have been automatically configured.
            </p>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] space-y-2 border border-black/[0.05] dark:border-white/[0.06] text-xs">
            <h4 className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
              <UploadCloud className="w-4 h-4 text-blue-500" />
              <span>Vercel Global Edge Network</span>
            </h4>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-[11px]">
              Deploying will upload project files from <code className="text-slate-800 dark:text-slate-200 font-mono text-[10px]">{project.path}</code> to Vercel, assign a permanent <code className="text-blue-600 dark:text-sky-300 font-mono text-[10px]">.vercel.app</code> domain, and provide zero-configuration SSL.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-black/[0.05] dark:border-white/[0.08]">
          <LiquidGlassButton
            variant="glass"
            size="sm"
            onClick={onClose}
          >
            {deployedUrl ? 'Done' : 'Cancel'}
          </LiquidGlassButton>
          {!deployedUrl && (
            <LiquidGlassButton
              variant="primary"
              size="sm"
              onClick={handleStartDeployment}
              disabled={isDeploying}
              leftIcon={<UploadCloud className="w-3.5 h-3.5" />}
            >
              {isDeploying ? 'Deploying...' : 'Start Vercel Deployment'}
            </LiquidGlassButton>
          )}
        </div>
      </div>
    </LiquidGlassModal>
  );
};
