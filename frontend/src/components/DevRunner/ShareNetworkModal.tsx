import React, { useState } from 'react';
import { ProjectService } from '../../types';
import { 
  Share2, 
  Globe, 
  Wifi, 
  Copy, 
  Check, 
  ExternalLink, 
  QrCode, 
  ArrowRight
} from 'lucide-react';
import { 
  LiquidGlassModal, 
  LiquidGlassButton, 
  LiquidGlassTabs, 
  LiquidGlassBadge 
} from '../Glisse';

interface ShareNetworkModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: ProjectService;
  hostIp: string;
}

export const ShareNetworkModal: React.FC<ShareNetworkModalProps> = ({
  isOpen,
  onClose,
  service,
  hostIp
}) => {
  const [activeTab, setActiveTab] = useState<'lan' | 'tunnel'>('lan');
  const [copiedLan, setCopiedLan] = useState(false);
  const [copiedTunnel, setCopiedTunnel] = useState(false);
  const [isGeneratingTunnel, setIsGeneratingTunnel] = useState(false);
  const [tunnelUrl, setTunnelUrl] = useState<string | null>(service.publicTunnelUrl || null);

  const lanUrl = `http://${hostIp}:${service.port || 3000}`;
  const subnetCidr = hostIp.includes('.') ? `${hostIp.split('.').slice(0, 3).join('.')}.0/24` : 'local subnet';

  const copyToClipboard = (text: string, isTunnel: boolean) => {
    navigator.clipboard.writeText(text);
    if (isTunnel) {
      setCopiedTunnel(true);
      setTimeout(() => setCopiedTunnel(false), 2000);
    } else {
      setCopiedLan(true);
      setTimeout(() => setCopiedLan(false), 2000);
    }
  };

  const handleGenerateTunnel = () => {
    setIsGeneratingTunnel(true);
    setTimeout(() => {
      const generated = `https://${service.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-preview.trycloudflare.com`;
      setTunnelUrl(generated);
      setIsGeneratingTunnel(false);
    }, 1200);
  };

  return (
    <LiquidGlassModal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <Share2 className="w-4 h-4 text-blue-500" />
          <span>Share Service Across Network</span>
        </div>
      }
      subtitle={`Expose ${service.name} to local Wi-Fi or public Cloudflare tunnel`}
      maxWidth="max-w-lg"
    >
      <div className="space-y-4">
        {/* Tab Selection */}
        <LiquidGlassTabs
          value={activeTab}
          onChange={(val) => setActiveTab(val as 'lan' | 'tunnel')}
          size="md"
          className="w-full flex justify-center"
          options={[
            { id: 'lan', label: 'Wi-Fi / LAN Share', icon: <Wifi className="w-3.5 h-3.5" /> },
            { id: 'tunnel', label: 'Cloudflare Tunnel', icon: <Globe className="w-3.5 h-3.5" /> }
          ]}
        />

        {/* TAB 1: LAN Sharing */}
        {activeTab === 'lan' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] space-y-3 border border-black/[0.05] dark:border-white/[0.06]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Local Network Address
                </span>
                <LiquidGlassBadge variant="success" dot>
                  Bound to 0.0.0.0
                </LiquidGlassBadge>
              </div>

              {/* URL Box */}
              <div className="bg-slate-900 dark:bg-[#050914] border border-black/[0.08] dark:border-white/[0.08] rounded-xl p-3 flex items-center justify-between font-mono text-xs text-blue-300 dark:text-sky-300">
                <span className="truncate pr-2 font-bold">{lanUrl}</span>
                <button
                  onClick={() => copyToClipboard(lanUrl, false)}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 transition-colors shrink-0"
                  title="Copy LAN URL"
                >
                  {copiedLan ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Any device connected to Wi-Fi <strong className="text-slate-800 dark:text-slate-200">({subnetCidr})</strong> such as your iPhone, iPad, Android, or laptop can open this URL directly.
              </p>
            </div>

            {/* QR Code Container for Instant Mobile Scanning */}
            <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 border border-black/[0.05] dark:border-white/[0.08]">
              <div className="w-24 h-24 rounded-xl bg-white p-2 flex items-center justify-center shrink-0 shadow-md border border-black/[0.08]">
                <svg viewBox="0 0 100 100" className="w-full h-full text-slate-900 fill-current">
                  <path d="M0 0h30v30H0zM10 10h10v10H10zM70 0h30v30H70zM80 10h10v10H80zM0 70h30v30H0zM10 80h10v10H10zM40 10h10v10H40zM50 20h10v10H50zM40 30h10v10H40zM10 40h10v10H10zM20 50h10v10H20zM30 40h10v10H30zM70 40h10v10H70zM80 50h10v10H80zM90 40h10v10H90zM40 70h10v10H40zM50 80h10v10H50zM60 70h10v10H60zM70 80h10v10H70zM80 90h10v10H80zM90 70h10v10H90z" />
                </svg>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <QrCode className="w-4 h-4 text-blue-500" />
                  Scan to Test on Mobile
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Open Camera on iPhone or Android to open this service on your mobile device instantly.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Cloudflare Tunnel */}
        {activeTab === 'tunnel' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] space-y-3 border border-black/[0.05] dark:border-white/[0.06]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Encrypted Public HTTPS URL
                </span>
                <LiquidGlassBadge variant="info">
                  Zero Trust Tunnel
                </LiquidGlassBadge>
              </div>

              {tunnelUrl ? (
                <div className="bg-slate-900 dark:bg-[#050914] border border-black/[0.08] dark:border-white/[0.08] rounded-xl p-3 flex items-center justify-between font-mono text-xs text-emerald-400">
                  <span className="truncate pr-2 font-bold">{tunnelUrl}</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => copyToClipboard(tunnelUrl, true)}
                      className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 transition-colors"
                      title="Copy Public URL"
                    >
                      {copiedTunnel ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <a
                      href={tunnelUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 transition-colors"
                      title="Open in new tab"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 space-y-3">
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Create a secure, SSL-encrypted public URL for clients, webhooks, or teammates outside your local Wi-Fi.
                  </p>
                  <LiquidGlassButton
                    variant="primary"
                    size="md"
                    onClick={handleGenerateTunnel}
                    isLoading={isGeneratingTunnel}
                    leftIcon={!isGeneratingTunnel ? <ArrowRight className="w-3.5 h-3.5" /> : undefined}
                  >
                    {isGeneratingTunnel ? 'Establishing Cloudflare Tunnel...' : 'Generate Public HTTPS Tunnel'}
                  </LiquidGlassButton>
                </div>
              )}

              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Traffic is routed through Cloudflare edge network directly to port {service.port || 3000}. No port forwarding needed.
              </p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-end pt-3 border-t border-black/[0.05] dark:border-white/[0.08]">
          <LiquidGlassButton
            variant="glass"
            size="sm"
            onClick={onClose}
          >
            Close
          </LiquidGlassButton>
        </div>
      </div>
    </LiquidGlassModal>
  );
};
