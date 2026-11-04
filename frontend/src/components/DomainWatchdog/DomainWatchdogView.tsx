import React, { useState } from 'react';
import { DomainWatchdogItem } from '../../types';
import { MOCK_WATCHDOG_DOMAINS } from '../../mock/data';
import { 
  Lock, 
  ExternalLink, 
  Plus 
} from 'lucide-react';
import { 
  LiquidGlassCard, 
  LiquidGlassButton, 
  LiquidGlassBadge, 
  LiquidGlassInput 
} from '../Glisse';

export const DomainWatchdogView: React.FC = () => {
  const [domains, setDomains] = useState<DomainWatchdogItem[]>(MOCK_WATCHDOG_DOMAINS);
  const [newDomain, setNewDomain] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAddDomain = () => {
    if (!newDomain.trim()) return;
    const clean = newDomain.trim().toLowerCase().replace(/^https?:\/\//, '');

    const added: DomainWatchdogItem = {
      id: `dom-${Date.now()}`,
      domain: clean,
      status: 'valid',
      sslIssuer: "Let's Encrypt Authority X3",
      sslExpiryDays: 88,
      validUntil: '2027-02-01',
      autoRenew: true,
      dnsRecords: [
        { type: 'A', value: '76.76.21.21', ttl: 300 }
      ],
      uptimePercent: 100.0,
      lastChecked: 'Just now'
    };

    setDomains(prev => [added, ...prev]);
    setNewDomain('');
    setIsAdding(false);
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
            className="w-full sm:w-auto"
          >
            Add Watchdog
          </LiquidGlassButton>
        </LiquidGlassCard>
      )}

      {/* Domains Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {domains.map(dom => {
          const isExpiring = dom.sslExpiryDays <= 14;

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

                  <span className="text-[10px] font-mono text-slate-400">{dom.lastChecked}</span>
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
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                  <span className="text-[11px] text-slate-400">DNS Resolution:</span>
                  <span className="font-mono text-blue-600 dark:text-sky-300 text-[11px] font-medium">
                    {dom.dnsRecords[0].type} ➔ {dom.dnsRecords[0].value}
                  </span>
                </div>

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
    </div>
  );
};
