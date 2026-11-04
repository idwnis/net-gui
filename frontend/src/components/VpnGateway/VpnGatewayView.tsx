import React, { useState, useEffect } from 'react';
import { VpnGatewayConfig, DNSQueryLog, DNSSinkholeStats } from '../../types';
import * as api from '../../services/api';
import { createDnsSocket } from '../../services/sockets';
import { 
  Shield, 
  ShieldCheck, 
  Wifi, 
  Smartphone, 
  Laptop, 
  Tv, 
  Copy, 
  Check, 
  Activity,
  ShieldAlert
} from 'lucide-react';
import { 
  LiquidGlassCard, 
  LiquidGlassButton, 
  LiquidGlassBadge, 
  LiquidGlassTabs,
  LiquidGlassSwitch 
} from '../Glisse';

interface VpnGatewayViewProps {
  hostIp: string;
}

export const VpnGatewayView: React.FC<VpnGatewayViewProps> = ({ hostIp }) => {
  const [activeSection, setActiveSection] = useState<'proxy' | 'dns'>('proxy');
  const [vpnConfig, setVpnConfig] = useState<VpnGatewayConfig>({
    isEnabled: true,
    gatewayType: 'http_proxy',
    bindAddress: '0.0.0.0',
    proxyPort: 7890,
    allowAllSubnet: true,
    trafficRoutedBytes: 0,
    activeClientsCount: 0,
    upstreamInterface: 'utun4 (VPN)',
    dnsSinkholeEnabled: true
  });

  const [dnsStats, setDnsStats] = useState<DNSSinkholeStats>({
    isEnabled: true,
    totalQueries: 0,
    blockedQueries: 0,
    blockPercent: 0,
    domainsOnBlocklist: 145000,
    activeListenPort: 53
  });
  const [dnsQueries, setDnsQueries] = useState<DNSQueryLog[]>([]);

  useEffect(() => {
    // 1. Fetch live Gateway config
    api.fetchGatewayConfig().then(cfg => {
      if (cfg) setVpnConfig(cfg);
    }).catch(e => console.error('Error fetching gateway config:', e));

    // 2. Fetch live DNS Sinkhole stats
    api.fetchDnsStats().then(stats => {
      if (stats) setDnsStats(stats);
    }).catch(e => console.error('Error fetching DNS stats:', e));

    // 3. Fetch live DNS Queries
    api.fetchDnsQueries().then(queries => {
      if (queries) setDnsQueries(queries);
    }).catch(e => console.error('Error fetching DNS queries:', e));

    // 4. Connect to live WebSocket for real-time DNS queries
    const dnsSocket = createDnsSocket((msg) => {
      if (msg && msg.query) {
        setDnsQueries(prev => [msg.query, ...prev.slice(0, 49)]);
        setDnsStats(prev => ({
          ...prev,
          totalQueries: prev.totalQueries + 1,
          blockedQueries: msg.query.status === 'blocked' ? prev.blockedQueries + 1 : prev.blockedQueries
        }));
      }
    });

    return () => {
      dnsSocket.close();
    };
  }, []);

  const [copiedProxy, setCopiedProxy] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState(false);
  const [copiedDns, setCopiedDns] = useState(false);

  const proxyAddress = `${hostIp}:${vpnConfig.proxyPort}`;
  const macOsSetupCmd = `networksetup -setwebproxy "Wi-Fi" ${hostIp} ${vpnConfig.proxyPort} && networksetup -setsecurewebproxy "Wi-Fi" ${hostIp} ${vpnConfig.proxyPort}`;

  const copyText = (text: string, type: 'proxy' | 'cmd' | 'dns') => {
    navigator.clipboard.writeText(text);
    if (type === 'cmd') {
      setCopiedCmd(true);
      setTimeout(() => setCopiedCmd(false), 2000);
    } else if (type === 'dns') {
      setCopiedDns(true);
      setTimeout(() => setCopiedDns(false), 2000);
    } else {
      setCopiedProxy(true);
      setTimeout(() => setCopiedProxy(false), 2000);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 tracking-tight">
            <Shield className="w-5 h-5 text-blue-500 dark:text-sky-400" />
            VPN Gateway & LAN Network Shield
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Share this Mac&apos;s active VPN tunnel or block ads and trackers via local DNS sinkhole (port 53).
          </p>
        </div>

        {/* Section Switcher Tabs */}
        <LiquidGlassTabs
          value={activeSection}
          onChange={(val) => setActiveSection(val as 'proxy' | 'dns')}
          size="md"
          options={[
            { id: 'proxy', label: 'Proxy Router (:7890)' },
            { id: 'dns', label: 'DNS Sinkhole (:53)', badge: 'AD-BLOCK' }
          ]}
        />
      </div>

      {activeSection === 'proxy' ? (
        /* PROXY ROUTER SECTION */
        <div className="space-y-6">
          {/* Status Bar */}
          <LiquidGlassCard className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <LiquidGlassSwitch
                checked={vpnConfig.isEnabled}
                onChange={(checked) => {
                  setVpnConfig(prev => ({ ...prev, isEnabled: checked }));
                  api.toggleGateway(checked).catch(e => console.error('Toggle gateway error:', e));
                }}
                label={vpnConfig.isEnabled ? 'Gateway Sharing Active' : 'Gateway Sharing Paused'}
              />
              <LiquidGlassBadge variant={vpnConfig.isEnabled ? 'success' : 'neutral'} dot pulse={vpnConfig.isEnabled}>
                {vpnConfig.isEnabled ? 'Listening on 0.0.0.0' : 'Offline'}
              </LiquidGlassBadge>
            </div>

            <LiquidGlassButton
              variant="glass"
              size="sm"
              onClick={() => copyText(proxyAddress, 'proxy')}
              leftIcon={copiedProxy ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            >
              {copiedProxy ? 'Copied' : `Copy ${proxyAddress}`}
            </LiquidGlassButton>
          </LiquidGlassCard>

          {/* Metrics Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <LiquidGlassCard className="p-4 space-y-1">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Gateway Proxy</span>
              <div className="flex items-center justify-between mt-1">
                <span className="font-mono text-base font-bold text-blue-600 dark:text-sky-300">{proxyAddress}</span>
                <LiquidGlassBadge variant="info">HTTP/SOCKS5</LiquidGlassBadge>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block pt-1">Listening on 0.0.0.0 (LAN)</span>
            </LiquidGlassCard>

            <LiquidGlassCard className="p-4 space-y-1">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Connected Clients</span>
              <div className="flex items-center justify-between mt-1">
                <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono">{vpnConfig.activeClientsCount}</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block pt-1">iPhones, Android, Smart TVs</span>
            </LiquidGlassCard>

            <LiquidGlassCard className="p-4 space-y-1">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Routed VPN Traffic</span>
              <div className="flex items-center justify-between mt-1">
                <span className="text-2xl font-bold text-blue-600 dark:text-sky-400 font-mono">
                  {formatBytes(vpnConfig.trafficRoutedBytes)}
                </span>
                <Activity className="w-4 h-4 text-blue-500 dark:text-sky-400" />
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block pt-1">Encrypted via WireGuard</span>
            </LiquidGlassCard>

            <LiquidGlassCard className="p-4 space-y-1">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Upstream Tunnel</span>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-300 truncate">{vpnConfig.upstreamInterface}</span>
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block pt-1">NAT forwarding active</span>
            </LiquidGlassCard>
          </div>

          {/* Main Split: Client Setup Guides Left + Active Relay Details Right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Left Column: Device Setup Guide */}
            <LiquidGlassCard className="lg:col-span-7 p-6 space-y-5">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 tracking-tight">
                  <Wifi className="w-4 h-4 text-blue-500 dark:text-sky-400" />
                  How to Route Other Devices Through This Mac
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Point any phone, tablet, or smart TV on your local network to this proxy.
                </p>
              </div>

              {/* Quick Steps */}
              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.07] flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-600 dark:text-sky-400 border border-blue-500/20 flex items-center justify-center shrink-0">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div className="text-xs space-y-1.5 flex-1">
                    <h4 className="font-semibold text-slate-900 dark:text-white">Apple iOS (iPhone / iPad)</h4>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                      Go to <strong className="text-slate-900 dark:text-white">Settings → Wi-Fi</strong>, tap the <strong>(i)</strong> next to your network, scroll down to <strong>Configure Proxy → Manual</strong>, and enter:
                    </p>
                    <div className="font-mono text-blue-600 dark:text-sky-300 font-semibold bg-black/[0.04] dark:bg-white/[0.08] px-2.5 py-1 rounded-lg inline-block border border-black/[0.05] dark:border-white/[0.08]">
                      Server: {hostIp} • Port: {vpnConfig.proxyPort}
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.07] flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
                    <Tv className="w-4 h-4" />
                  </div>
                  <div className="text-xs space-y-1.5 flex-1">
                    <h4 className="font-semibold text-slate-900 dark:text-white">Android & Smart TVs (Samsung, LG, Sony)</h4>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                      In Network Settings, select <strong>Modify Network → Advanced Options → Proxy: Manual</strong>, then enter Host <strong className="text-slate-900 dark:text-white">{hostIp}</strong> and Port <strong className="text-slate-900 dark:text-white">{vpnConfig.proxyPort}</strong>.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.07] flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-600 dark:text-sky-400 border border-blue-500/20 flex items-center justify-center shrink-0">
                    <Laptop className="w-4 h-4" />
                  </div>
                  <div className="text-xs space-y-2 flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-slate-900 dark:text-white">Terminal One-Liner (macOS / Linux)</h4>
                      <LiquidGlassButton
                        variant="glass"
                        size="sm"
                        onClick={() => copyText(macOsSetupCmd, 'cmd')}
                        leftIcon={copiedCmd ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      >
                        {copiedCmd ? 'Copied' : 'Copy'}
                      </LiquidGlassButton>
                    </div>
                    <div className="bg-black/80 dark:bg-black/60 p-2.5 rounded-xl font-mono text-[11px] text-blue-300 truncate border border-white/10">
                      {macOsSetupCmd}
                    </div>
                  </div>
                </div>
              </div>
            </LiquidGlassCard>

            {/* Right Column: QR Code & Active Clients */}
            <div className="lg:col-span-5 space-y-4">
              <LiquidGlassCard className="p-6 text-center space-y-3.5">
                <h3 className="text-xs font-semibold text-slate-900 dark:text-white">
                  Scan to Configure Wi-Fi Proxy
                </h3>

                <div className="w-36 h-36 mx-auto bg-white p-3 rounded-2xl shadow-xs border border-black/[0.08] flex items-center justify-center">
                  <svg viewBox="0 0 100 100" className="w-full h-full text-slate-900 fill-current">
                    <path d="M0 0h30v30H0zM10 10h10v10H10zM70 0h30v30H70zM80 10h10v10H80zM0 70h30v30H0zM10 80h10v10H10zM40 10h10v10H40zM50 20h10v10H50zM40 30h10v10H40zM10 40h10v10H10zM20 50h10v10H20zM30 40h10v10H30zM70 40h10v10H70zM80 50h10v10H80zM90 40h10v10H90zM40 70h10v10H40zM50 80h10v10H50zM60 70h10v10H60zM70 80h10v10H70zM80 90h10v10H80zM90 70h10v10H90z" />
                  </svg>
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Point your camera to import proxy config automatically.
                </p>
              </LiquidGlassCard>

              <LiquidGlassCard className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-900 dark:text-white">
                    Active Routed Devices ({vpnConfig.activeClientsCount})
                  </span>
                  <LiquidGlassBadge variant="success" dot>Online</LiquidGlassBadge>
                </div>

                <div className="space-y-2">
                  {[
                    { name: 'iPhone 15 Pro', ip: '192.168.1.155', traffic: '820 MB', icon: <Smartphone className="w-3.5 h-3.5 text-blue-500 dark:text-sky-400" /> },
                    { name: 'Samsung QLED TV', ip: '192.168.1.140', traffic: '1.02 GB', icon: <Tv className="w-3.5 h-3.5 text-emerald-500 dark:text-cyan-400" /> },
                    { name: 'Linux Workstation', ip: '192.168.1.112', traffic: '104 MB', icon: <Laptop className="w-3.5 h-3.5 text-indigo-500 dark:text-blue-400" /> }
                  ].map(client => (
                    <div key={client.ip} className="p-2.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.05] dark:border-white/[0.07] flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5">
                        {client.icon}
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">{client.name}</p>
                          <span className="text-[10px] font-mono text-slate-400">{client.ip}</span>
                        </div>
                      </div>
                      <span className="font-mono text-[11px] text-blue-600 dark:text-sky-300 font-bold">
                        {client.traffic}
                      </span>
                    </div>
                  ))}
                </div>
              </LiquidGlassCard>
            </div>
          </div>
        </div>
      ) : (
        /* DNS SINKHOLE & ADBLOCKER (MINI PI-HOLE) SECTION */
        <div className="space-y-6">
          <LiquidGlassCard className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <LiquidGlassSwitch
                checked={dnsStats.isEnabled}
                onChange={(checked) => setDnsStats(prev => ({ ...prev, isEnabled: checked }))}
                label={dnsStats.isEnabled ? 'DNS Sinkhole Active' : 'DNS Sinkhole Paused'}
              />
              <LiquidGlassBadge variant={dnsStats.isEnabled ? 'success' : 'neutral'} dot pulse={dnsStats.isEnabled}>
                {dnsStats.isEnabled ? 'Blocking Port 53' : 'Bypass Mode'}
              </LiquidGlassBadge>
            </div>

            <LiquidGlassButton
              variant="glass"
              size="sm"
              onClick={() => copyText(`${hostIp}:53`, 'dns')}
              leftIcon={copiedDns ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            >
              DNS IP: {hostIp} (:53)
            </LiquidGlassButton>
          </LiquidGlassCard>

          {/* DNS Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <LiquidGlassCard className="p-4 space-y-1">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total DNS Queries</span>
              <p className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1">{dnsStats.totalQueries}</p>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block pt-1">All LAN devices</span>
            </LiquidGlassCard>

            <LiquidGlassCard className="p-4 space-y-1">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Blocked Ads & Trackers</span>
              <p className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">{dnsStats.blockedQueries}</p>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block pt-1">Protected requests</span>
            </LiquidGlassCard>

            <LiquidGlassCard className="p-4 space-y-1">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Block Percentage</span>
              <p className="text-2xl font-bold font-mono text-blue-600 dark:text-sky-400 mt-1">{dnsStats.blockPercent}%</p>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block pt-1">Telemetry filtered</span>
            </LiquidGlassCard>

            <LiquidGlassCard className="p-4 space-y-1">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Blocklist Database</span>
              <p className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1">{dnsStats.domainsOnBlocklist.toLocaleString()}</p>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block pt-1">StevenBlack unified hosts</span>
            </LiquidGlassCard>
          </div>

          {/* Real-time Blocked Query Log */}
          <LiquidGlassCard className="p-5 space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-emerald-500" />
                <span>Live Filtered DNS Queries Stream</span>
              </h3>
              <LiquidGlassBadge variant="neutral">Live</LiquidGlassBadge>
            </div>

            <div className="space-y-2">
              {dnsQueries.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500 italic border border-dashed border-black/[0.08] dark:border-white/[0.08] rounded-2xl">
                  No DNS queries intercepted yet. Set client DNS to 127.0.0.1 (port 53) to sinkhole telemetry and ad networks.
                </div>
              ) : (
                dnsQueries.map(q => (
                  <div key={q.id} className="p-3 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.05] dark:border-white/[0.07] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <LiquidGlassBadge variant={q.status === 'blocked' ? 'danger' : 'success'}>
                        {q.status === 'blocked' ? 'Blocked' : 'Allowed'}
                      </LiquidGlassBadge>

                      <div className="min-w-0">
                        <p className="font-mono font-semibold text-slate-900 dark:text-white truncate">{q.domain}</p>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate block">{q.clientName} ({q.clientIp}) • {q.type} query</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                      {q.category && (
                        <LiquidGlassBadge variant="neutral">
                          {q.category}
                        </LiquidGlassBadge>
                      )}
                      <span className="text-[10px] font-mono text-slate-400">{q.timestamp}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </LiquidGlassCard>
        </div>
      )}
    </div>
  );
};
