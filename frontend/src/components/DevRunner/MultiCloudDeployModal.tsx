import React, { useState } from 'react';
import { DevProject } from '../../types';
import { 
  Copy, 
  Check, 
  RefreshCw, 
  CheckCircle2, 
  UploadCloud, 
  Server, 
  Cloud 
} from 'lucide-react';
import { 
  LiquidGlassModal, 
  LiquidGlassButton, 
  LiquidGlassBadge 
} from '../Glisse';

interface MultiCloudDeployModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: DevProject;
  onDeploySuccess: (projectId: string, platform: 'railway' | 'flyio' | 'vercel', deploymentUrl: string) => void;
}

export const MultiCloudDeployModal: React.FC<MultiCloudDeployModalProps> = ({
  isOpen,
  onClose,
  project,
  onDeploySuccess
}) => {
  const [platform, setPlatform] = useState<'railway' | 'flyio' | 'vercel'>('railway');
  const [region] = useState('us-west (Oregon)');
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentStep, setDeploymentStep] = useState<number>(0);
  const [liveUrl, setLiveUrl] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const handleStartDeploy = () => {
    setIsDeploying(true);
    setDeploymentStep(1);

    setTimeout(() => setDeploymentStep(2), 700);
    setTimeout(() => setDeploymentStep(3), 1400);
    setTimeout(() => {
      setDeploymentStep(4);
      const url = platform === 'railway'
        ? `https://${project.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-prod.up.railway.app`
        : platform === 'flyio'
        ? `https://${project.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}.fly.dev`
        : `https://${project.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}.vercel.app`;

      setLiveUrl(url);
      setIsDeploying(false);
      onDeploySuccess(project.id, platform, url);
    }, 2200);
  };

  const copyLiveUrl = () => {
    if (!liveUrl) return;
    navigator.clipboard.writeText(liveUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const platforms = [
    { id: 'railway' as const, name: 'Railway', desc: 'Containerized PaaS with zero config', icon: <Server className="w-4 h-4 text-purple-500" /> },
    { id: 'flyio' as const, name: 'Fly.io', desc: 'Global edge micro-VMs near users', icon: <Cloud className="w-4 h-4 text-blue-500" /> },
    { id: 'vercel' as const, name: 'Vercel Edge', desc: 'Serverless frontend & edge lambdas', icon: <UploadCloud className="w-4 h-4 text-slate-800 dark:text-slate-200" /> }
  ];

  return (
    <LiquidGlassModal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <UploadCloud className="w-4 h-4 text-blue-500" />
          <span>Multi-Cloud Deployment Engine</span>
        </div>
      }
      subtitle={`Deploy ${project.name} to Railway, Fly.io, or Vercel with 1 click`}
      maxWidth="max-w-xl"
    >
      <div className="space-y-4">
        {/* Platform Selection */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-slate-500 dark:text-slate-400 block">
            Target Cloud Infrastructure
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {platforms.map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPlatform(p.id)}
                className={`p-3 rounded-xl border text-left transition-colors active:scale-95 ${
                  platform === p.id
                    ? 'bg-blue-500/10 dark:bg-blue-500/15 border-blue-500 text-slate-900 dark:text-white shadow-xs'
                    : 'bg-black/[0.02] dark:bg-white/[0.04] border-black/[0.05] dark:border-white/[0.06] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  {p.icon}
                  {platform === p.id && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                </div>
                <h4 className="font-semibold text-xs mt-2 text-slate-900 dark:text-white">{p.name}</h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">{p.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Region & Target Service Summary */}
        <div className="p-3.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.07] flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-400 block text-xs font-medium">Region Allocation</span>
            <span className="font-mono text-slate-800 dark:text-white font-medium">{region}</span>
          </div>
          <div className="text-right">
            <span className="text-slate-400 block text-xs font-medium">Services Packaging</span>
            <span className="font-mono text-blue-600 dark:text-sky-300 font-medium">{project.services.length} services (Dockerized)</span>
          </div>
        </div>

        {/* Deployment Status */}
        {isDeploying ? (
          <div className="p-4 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] space-y-2.5 border border-black/[0.06] dark:border-white/[0.07]">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-900 dark:text-white">
              <span className="flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-500" />
                <span>
                  {deploymentStep === 1 && 'Building multi-stage container image...'}
                  {deploymentStep === 2 && 'Pushing layers to global container registry...'}
                  {deploymentStep === 3 && 'Routing DNS & generating Edge SSL certs...'}
                </span>
              </span>
              <span className="font-mono text-blue-600 dark:text-sky-300">{deploymentStep * 25}%</span>
            </div>
            <div className="w-full bg-black/10 dark:bg-black/40 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-blue-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${deploymentStep * 25}%` }}
              />
            </div>
          </div>
        ) : liveUrl ? (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Multi-Cloud Release Live</span>
              </span>
              <LiquidGlassBadge variant="success">Online</LiquidGlassBadge>
            </div>
            <div className="bg-slate-900 dark:bg-[#050914] p-3 rounded-xl flex items-center justify-between font-mono text-xs text-emerald-400 border border-black/[0.08] dark:border-white/[0.08]">
              <span className="truncate pr-2 font-bold">{liveUrl}</span>
              <button
                onClick={copyLiveUrl}
                className="p-1 rounded bg-white/10 text-slate-200"
                title="Copy URL"
              >
                {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        ) : null}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-black/[0.05] dark:border-white/[0.08]">
          <LiquidGlassButton
            variant="glass"
            size="sm"
            onClick={onClose}
          >
            {liveUrl ? 'Done' : 'Cancel'}
          </LiquidGlassButton>
          {!liveUrl && (
            <LiquidGlassButton
              variant="primary"
              size="sm"
              onClick={handleStartDeploy}
              disabled={isDeploying}
              leftIcon={<UploadCloud className="w-3.5 h-3.5" />}
            >
              {isDeploying ? 'Deploying...' : `Deploy to ${platform.toUpperCase()}`}
            </LiquidGlassButton>
          )}
        </div>
      </div>
    </LiquidGlassModal>
  );
};
