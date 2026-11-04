import React, { useState, useEffect } from 'react';
import { DomainWatchdogItem } from '../../types';
import * as api from '../../services/api';
import { 
  Lock, 
  ExternalLink, 
  Plus,
  RefreshCw,
  Trash2
} from 'lucide-react';
import { 
  LiquidGlassCard, 
  LiquidGlassButton, 
  LiquidGlassBadge, 
  LiquidGlassInput 
} from '../Glisse';

export const DomainWatchdogView: React.FC = () => {
  const [domains, setDomains] = useState<DomainWatchdogItem[]>([]);
  const [newDomain, setNewDomain] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkingId, setCheckingId] = useState<string | null>(null);

  const loadDomains = () => {
    api.fetchWatchdogDomains().then(data => {
      if (data) setDomains(data);
    }).catch(e => console.error('Error fetching watchdog domains:', e));
  };

  useEffect(() => {
    loadDomains();
  }, []);

  const handleAddDomain = async () => {
    if (!newDomain.trim()) return;
    const clean = newDomain.trim().toLowerCase().replace(/^https?:\/\//, '');

    setIsSubmitting(true);
    try {
      const added = await api.addWatchdogDomain(clean);
      if (added) {
        setDomains(prev => [added, ...prev.filter(d => d.id !== added.id)]);
        setNewDomain('');
        setIsAdding(false);
      }
    } catch (e) {
      console.error('Failed to add watchdog domain:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckDomain = async (domainId: string) => {
    setCheckingId(domainId);
    try {
      const updated = await api.checkWatchdogDomain(domainId);
      if (updated) {
        setDomains(prev => prev.map(d => d.id === domainId ? updated : d));
      }
    } catch (e) {
      console.error('Failed to check domain:', e);
    } finally {
      setCheckingId(null);
    }
  };

  const handleDeleteDomain = async (domainId: string) => {
    try {
      await api.deleteWatchdogDomain(domainId);
      setDomains(prev => prev.filter(d => d.id !== domainId));
    } catch (e) {
      console.error('Failed to delete watchdog domain:', e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 tracking-tight">
            <Lock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            Production SSL & Domain Expiry Watchdog
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Monitor production hosts, SSL certificate expiration countdowns, and DNS record uptime.
          </p>
        </div>

        <LiquidGlassButton
          variant="primary"
          size="md"
          onClick={() => setIsAdding(!isAdding)}
          leftIcon={<Plus className="w-3.5 h-3.5" />}
        >
          Monitor Domain
        </LiquidGlassButton>
      </div>

      {/* Add Domain Input Bar */}
      {isAdding && (
        <LiquidGlassCard className="p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 animate-in fade-in">
          <LiquidGlassInput
            value={newDomain}
            onChange={(e) => setNewDomain(e.target.value)}
            placeholder="api.yourcompany.com"
            className="flex-1 font-mono"
          />
          <LiquidGlassButton
            variant="primary"
            size="md"
            onClick={handleAddDomain}
            isLoading={isSubmitting}
            className="w-full sm:w-auto"
          >
            {isSubmitting ? 'Verifying SSL & DNS...' : 'Add Watchdog'}
          </LiquidGlassButton>
        </LiquidGlassCard>
      )}

      {/* Domains Grid or Clean Empty State */}
      {domains.length === 0 ? (
        <LiquidGlassCard className="p-8 text-center space-y-3 border-dashed border-black/[0.1] dark:border-white/[0.1]">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">No Monitored Domains</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
            Track production SSL expiration countdowns and DNS resolution uptime. Click <strong>Monitor Domain</strong> above to add your domains (e.g. <code>github.com</code> or your production API).
          </p>
        </LiquidGlassCard>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {domains.map(dom => {
            const isExpiring = dom.sslExpiryDays <= 14;
            const isChecking = checkingId === dom.id;

            return (
              <LiquidGlassCard
                key={dom.id}
                className={`p-5 flex flex-col justify-between gap-4 border ${
                  isExpiring ? 'border-amber-500/50 bg-amber-500/10' : ''
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <LiquidGlassBadge variant={isExpiring ? 'warning' : 'success'}>
                      {isExpiring ? `Expires in ${dom.sslExpiryDays} days` : `${dom.sslExpiryDays} days valid`}
                    </LiquidGlassBadge>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono text-slate-400">{dom.lastChecked}</span>
                      <button
                        onClick={() => handleCheckDomain(dom.id)}
                        disabled={isChecking}
                        className="p-1 text-slate-400 hover:text-blue-500 rounded transition-colors"
                        title="Re-check SSL Certificate & DNS"
                      >
                        <RefreshCw className={`w-3 h-3 ${isChecking ? 'animate-spin text-blue-500' : ''}`} />
                      </button>
                      <button
                        onClick={() => handleDeleteDomain(dom.id)}
                        className="p-1 text-slate-400 hover:text-red-500 rounded transition-colors"
                        title="Remove Domain"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-3">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-1.5 tracking-tight">
                      <a
                        href={`https://${dom.domain}`}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:underline flex items-center gap-1.5"
                      >
                        <span>{dom.domain}</span>
                        <ExternalLink className="w-3 h-3 text-slate-400" />
                      </a>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{dom.sslIssuer}</p>
                  </div>
                </div>

                {/* DNS Records & Uptime */}
                <div className="space-y-2 pt-3 border-t border-black/[0.05] dark:border-white/[0.06] text-xs">
                  {dom.dnsRecords && dom.dnsRecords.length > 0 && (
                    <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                      <span className="text-[11px] text-slate-400">DNS Resolution:</span>
                      <span className="font-mono text-blue-600 dark:text-sky-300 text-[11px] font-medium">
                        {dom.dnsRecords[0].type} ➔ {dom.dnsRecords[0].value}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span className="text-[11px] text-slate-400">Uptime Score:</span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
                      {dom.uptimePercent}%
                    </span>
                  </div>
                </div>
              </LiquidGlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
};
