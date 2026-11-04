import React, { useState } from 'react';
import { ProjectService } from '../../types';
import { 
  Lock, 
  ShieldCheck, 
  ExternalLink, 
  Copy, 
  Check, 
  Terminal
} from 'lucide-react';
import { 
  LiquidGlassModal, 
  LiquidGlassButton, 
  LiquidGlassInput, 
  LiquidGlassBadge 
} from '../Glisse';

interface CustomDomainModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: ProjectService;
  onSaveDomain: (domain: string, enabled: boolean) => void;
}

export const CustomDomainModal: React.FC<CustomDomainModalProps> = ({
  isOpen,
  onClose,
  service,
  onSaveDomain
}) => {
  const [domainName, setDomainName] = useState(
    service.customDomain?.domain || `${service.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}.test`
  );
  const [isEnabled] = useState(service.customDomain?.enabled ?? true);
  const [copiedHostsCmd, setCopiedHostsCmd] = useState(false);

  const targetPort = service.port || 3000;
  const hostsCmd = `echo "127.0.0.1 ${domainName}" | sudo tee -a /etc/hosts`;

  const copyHostsCmd = () => {
    navigator.clipboard.writeText(hostsCmd);
    setCopiedHostsCmd(true);
    setTimeout(() => setCopiedHostsCmd(false), 2000);
  };

  const handleSave = () => {
    onSaveDomain(domainName, isEnabled);
    onClose();
  };

  return (
    <LiquidGlassModal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <span>Local Custom Domain & SSL</span>
          <LiquidGlassBadge variant="success">mkcert HTTPS</LiquidGlassBadge>
        </div>
      }
      subtitle={`Map localhost:${targetPort} to a clean .test domain with valid local SSL`}
      maxWidth="max-w-lg"
    >
      <div className="space-y-4">
        {/* Domain Configuration */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
            Assigned Domain Name
          </label>
          <div className="flex items-center gap-2">
            <LiquidGlassInput
              value={domainName}
              onChange={(e) => setDomainName(e.target.value.toLowerCase())}
              placeholder="myapp.test"
              className="font-mono flex-1"
            />
            <a
              href={`https://${domainName}`}
              target="_blank"
              rel="noreferrer"
              className="p-2.5 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-black/[0.06] dark:border-white/[0.08]"
              title="Test in browser"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Proxy Mapping Detail Card */}
        <div className="p-4 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] space-y-2.5 border border-black/[0.05] dark:border-white/[0.06]">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">Reverse Proxy Target:</span>
            <span className="font-mono text-blue-600 dark:text-sky-300 font-semibold">http://127.0.0.1:{targetPort}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">SSL Certificate:</span>
            <span className="font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
              <Lock className="w-3 h-3" />
              Trusted Local CA (mkcert)
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">HSTS Compatible:</span>
            <span className="font-mono text-slate-800 dark:text-white font-medium">Yes (Port 443 ➔ {targetPort})</span>
          </div>
        </div>

        {/* /etc/hosts setup instruction */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Terminal className="w-3 h-3 text-blue-500" />
              Local DNS Hosts Entry
            </span>
            <button
              onClick={copyHostsCmd}
              className="text-[11px] text-blue-600 dark:text-sky-300 hover:underline inline-flex items-center gap-1"
            >
              {copiedHostsCmd ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
              <span>{copiedHostsCmd ? 'Copied' : 'Copy command'}</span>
            </button>
          </div>
          <div className="bg-slate-900 dark:bg-[#050914] p-3 rounded-xl font-mono text-[11px] text-blue-300 dark:text-sky-300 border border-black/[0.08] dark:border-white/[0.08] truncate">
            {hostsCmd}
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Run this in Terminal once to map <strong className="text-slate-700 dark:text-slate-300">{domainName}</strong> to your loopback adapter.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-black/[0.05] dark:border-white/[0.08]">
          <LiquidGlassButton
            variant="glass"
            size="sm"
            onClick={onClose}
          >
            Cancel
          </LiquidGlassButton>
          <LiquidGlassButton
            variant="primary"
            size="sm"
            onClick={handleSave}
            leftIcon={<ShieldCheck className="w-3.5 h-3.5" />}
          >
            Apply & Enable SSL
          </LiquidGlassButton>
        </div>
      </div>
    </LiquidGlassModal>
  );
};
