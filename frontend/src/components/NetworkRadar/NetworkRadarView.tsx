import React, { useState, useEffect } from 'react';
import { NetworkDevice, PingTarget } from '../../types';
import * as api from '../../services/api';
import { 
  Laptop, 
  Smartphone, 
  Router as RouterIcon, 
  Server, 
  Tv, 
  Printer, 
  Cpu, 
  HelpCircle, 
  RefreshCw, 
  Search, 
  ShieldCheck, 
  X, 
  LayoutGrid, 
  List, 
  Check, 
  Copy,
  Zap,
  ShieldAlert,
  Activity,
  Wifi
} from 'lucide-react';
import { 
  LiquidGlassCard, 
  LiquidGlassButton, 
  LiquidGlassBadge, 
  LiquidGlassInput, 
  LiquidGlassTabs, 
  LiquidGlassModal 
} from '../Glisse';

interface NetworkRadarViewProps {
  devices: NetworkDevice[];
  onScanNetwork: () => void;
  isScanning: boolean;
  onToggleTrust?: (deviceId: string) => void;
}

export const NetworkRadarView: React.FC<NetworkRadarViewProps> = ({
  devices,
  onScanNetwork,
  isScanning,
  onToggleTrust
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [copiedIp, setCopiedIp] = useState<string | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<NetworkDevice | null>(null);
  const [isPortModalOpen, setIsPortModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [pingTargets, setPingTargets] = useState<PingTarget[]>([]);
  const [isPinging, setIsPinging] = useState(false);
  const [wolStatusMessage, setWolStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    // Fetch live baseline ping targets & jitter from backend
    api.fetchPingTargets()
      .then(res => {
        if (res && res.targets) setPingTargets(res.targets);
      })
      .catch(e => console.error('Failed to fetch ping targets:', e));
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIp(text);
    setTimeout(() => setCopiedIp(null), 1800);
  };

  const handleWakeOnLan = (device: NetworkDevice, e: React.MouseEvent) => {
    e.stopPropagation();
    api.sendWakeOnLan(device.mac)
      .then(res => {
        setWolStatusMessage(res.message || `⚡ WoL Magic Packet broadcasted to ${device.mac}`);
      })
      .catch(err => {
        setWolStatusMessage(`WoL error: ${err.message || 'Transmission failed'}`);
      })
      .finally(() => {
        setTimeout(() => setWolStatusMessage(null), 4000);
      });
  };

  const handleRunPingTest = () => {
    setIsPinging(true);
    api.testPingTargets()
      .then(res => {
        if (res && res.targets) setPingTargets(res.targets);
      })
      .catch(e => console.error('Ping test error:', e))
      .finally(() => setIsPinging(false));
  };

  const getDeviceBadge = (device: NetworkDevice) => {
    switch (device.deviceType) {
      case 'router':
        return {
          container: 'bg-blue-500/10 text-blue-600 dark:text-sky-400 border border-blue-500/20',
          icon: <RouterIcon className="w-5 h-5" />
        };
      case 'computer':
        return {
          container: 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border border-slate-500/20',
          icon: <Laptop className="w-5 h-5" />
        };
      case 'mobile':
        return {
          container: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
          icon: <Smartphone className="w-5 h-5" />
        };
      case 'server':
        return {
          container: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20',
          icon: <Server className="w-5 h-5" />
        };
      case 'smart-tv':
        return {
          container: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20',
          icon: <Tv className="w-5 h-5" />
        };
      case 'printer':
        return {
          container: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20',
          icon: <Printer className="w-5 h-5" />
        };
      case 'iot':
        return {
          container: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
          icon: <Cpu className="w-5 h-5" />
        };
      default:
        return {
          container: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20',
          icon: <HelpCircle className="w-5 h-5" />
        };
    }
  };

  const untrustedDevices = devices.filter(d => d.isTrusted === false);

  const filteredDevices = devices.filter(d => {
    const matchesSearch = 
      d.ip.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.hostname.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.vendor.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = selectedType === 'all' || d.deviceType === selectedType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-5">
      {/* WoL Toast Notification */}
      {wolStatusMessage && (
        <div className="p-3.5 rounded-xl bg-blue-600 text-white text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5 font-medium">
            <Zap className="w-4 h-4 text-amber-300" />
            <span>{wolStatusMessage}</span>
          </div>
          <button 
            onClick={() => setWolStatusMessage(null)} 
            className="text-white/80 hover:text-white p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Rogue Device Alert Banner */}
      {untrustedDevices.length > 0 && (
        <LiquidGlassCard className="p-4 border-amber-500/40 bg-amber-500/10 dark:bg-amber-500/10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
                <ShieldAlert className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-2">
                  <span>Rogue Device Detected: {untrustedDevices.length} Untrusted Host</span>
                  <LiquidGlassBadge variant="warning">ALERT</LiquidGlassBadge>
                </h4>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                  Host <strong className="font-mono text-slate-900 dark:text-white">{untrustedDevices[0].ip}</strong> ({untrustedDevices[0].vendor}) is not in your trusted whitelist.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <LiquidGlassButton
                variant="primary"
                size="sm"
                onClick={() => {
                  if (onToggleTrust) onToggleTrust(untrustedDevices[0].id);
                }}
              >
                Mark as Trusted
              </LiquidGlassButton>
              <LiquidGlassButton
                variant="glass"
                size="sm"
                onClick={() => {
                  setSelectedDevice(untrustedDevices[0]);
                  setIsPortModalOpen(true);
                }}
              >
                Inspect Ports
              </LiquidGlassButton>
            </div>
          </div>
        </LiquidGlassCard>
      )}

      {/* Wi-Fi Health & Real-Time Ping Heatmap */}
      <LiquidGlassCard className="p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-sky-400 border border-blue-500/20 flex items-center justify-center shrink-0">
              <Wifi className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-900 dark:text-white tracking-tight">Gateway & Wi-Fi Health</span>
                <LiquidGlassBadge variant="success" dot>99.8% Stable</LiquidGlassBadge>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Direct interface en0 • Zero packet drops detected</p>
            </div>
          </div>

          {/* Targets Ping Metrics */}
          <div className="flex items-center gap-2 overflow-x-auto self-end sm:self-auto">
            {pingTargets.map(target => (
              <div key={target.id} className="h-8 px-2.5 rounded-lg bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.05] dark:border-white/[0.08] flex items-center gap-2 shrink-0">
                <Activity className="w-3.5 h-3.5 text-blue-500 dark:text-sky-400 shrink-0" />
                <div className="text-[11px] flex items-center gap-1.5 leading-none">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">{target.name.split(' ')[0]}</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{target.latencyMs}ms</span>
                  <span className="text-[9px] text-slate-400 font-mono">±{target.jitterMs}ms</span>
                </div>
              </div>
            ))}

            <LiquidGlassButton
              variant="glass"
              size="sm"
              onClick={handleRunPingTest}
              disabled={isPinging}
              className="w-8 h-8 p-0 rounded-lg shrink-0 flex items-center justify-center"
              title="Ping Benchmark"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isPinging ? 'animate-spin text-blue-500' : ''}`} />
            </LiquidGlassButton>
          </div>
        </div>
      </LiquidGlassCard>

      {/* Action Bar & Filter Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          <LiquidGlassButton
            variant="primary"
            size="md"
            onClick={onScanNetwork}
            isLoading={isScanning}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            {isScanning ? 'Scanning...' : 'Scan Subnet'}
          </LiquidGlassButton>

          {/* Search bar */}
          <div className="flex-1 w-full sm:max-w-xs">
            <LiquidGlassInput
              leftIcon={<Search className="w-3.5 h-3.5" />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClear={() => setSearchQuery('')}
              placeholder="Search host, vendor, or IP..."
            />
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <div className="flex items-center p-1 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/[0.08]">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs transition-all active:scale-95 ${
                viewMode === 'grid' 
                  ? 'bg-white dark:bg-white/20 text-slate-900 dark:text-white shadow-xs' 
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-white'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs transition-all active:scale-95 ${
                viewMode === 'table' 
                  ? 'bg-white dark:bg-white/20 text-slate-900 dark:text-white shadow-xs' 
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-white'
              }`}
              title="Table View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Hero Showcase Radar Spotlight */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* Left Hero Card: Deep Concentric Aura */}
        <LiquidGlassCard className="lg:col-span-5 p-5 sm:p-6 flex flex-col justify-between relative overflow-hidden">
          <div className="relative my-2 flex flex-col items-center justify-center">
            <div className="relative w-44 h-44 rounded-full flex items-center justify-center p-[2px] bg-gradient-to-tr from-cyan-400 via-sky-400 to-blue-600 shadow-[0_0_35px_rgba(56,189,248,0.25)]">
              <div className="w-full h-full rounded-full bg-slate-100/90 dark:bg-[#0a1122]/95 backdrop-blur-xl flex items-center justify-center p-3 border border-blue-400/20">
                <div className={`w-32 h-32 rounded-full bg-gradient-to-b from-blue-500/10 dark:from-white/[0.06] to-transparent flex flex-col items-center justify-center shadow-inner ${
                  isScanning ? 'animate-pulse' : ''
                }`}>
                  <Laptop className="w-10 h-10 text-blue-500 dark:text-sky-400 mb-1 drop-shadow-sm" />
                  <span className="text-[11px] font-bold text-slate-900 dark:text-white tracking-tight">MacBook Pro</span>
                  <span className="text-[10px] font-mono text-blue-600 dark:text-sky-300/90 font-medium">192.168.1.105</span>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-2">
              <LiquidGlassBadge variant="info">Host Zero (Local)</LiquidGlassBadge>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between text-xs">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Subnet Broadcast</p>
              <p className="font-mono text-slate-900 dark:text-white text-xs mt-0.5 font-semibold">192.168.1.255</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Discovered</p>
              <p className="font-mono text-blue-600 dark:text-sky-300 text-xs mt-0.5 font-semibold">{devices.length} Live Hosts</p>
            </div>
          </div>
        </LiquidGlassCard>

        {/* Right Hero Card: Stacked Discovery Telemetry */}
        <LiquidGlassCard className="lg:col-span-7 p-5 sm:p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-sky-400 border border-blue-500/20 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white tracking-tight">LAN Discovery & Security Engine</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">ARP sweeps, mDNS Bonjour broadcast & OUI vendor resolution</p>
              </div>
            </div>
            <LiquidGlassBadge variant="success" dot>Active</LiquidGlassBadge>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3 my-4">
            <div className="p-2.5 sm:p-3.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.07] text-center">
              <span className="text-[11px] sm:text-xs font-medium text-slate-500 dark:text-slate-400">Trusted</span>
              <p className="text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                {devices.filter(d => d.isTrusted !== false).length}
              </p>
            </div>
            <div className="p-2.5 sm:p-3.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.07] text-center">
              <span className="text-[11px] sm:text-xs font-medium text-slate-500 dark:text-slate-400">Untrusted</span>
              <p className="text-base sm:text-lg font-bold text-amber-600 dark:text-amber-400 font-mono mt-0.5">
                {untrustedDevices.length}
              </p>
            </div>
            <div className="p-2.5 sm:p-3.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.07] text-center">
              <span className="text-[11px] sm:text-xs font-medium text-slate-500 dark:text-slate-400">Open Sockets</span>
              <p className="text-base sm:text-lg font-bold text-blue-600 dark:text-sky-400 font-mono mt-0.5">
                {devices.reduce((acc, d) => acc + d.openPorts.length, 0)}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-black/[0.05] dark:border-white/[0.07]">
            <span>Zero configuration required for local subnet sweeps</span>
            <button
              onClick={onScanNetwork}
              className="text-blue-600 dark:text-sky-400 hover:underline font-semibold"
            >
              Rescan ARP Sweep →
            </button>
          </div>
        </LiquidGlassCard>
      </div>

      {/* Filter Category Segmented Control */}
      <div className="overflow-x-auto pb-1">
        <LiquidGlassTabs
          value={selectedType}
          onChange={setSelectedType}
          size="sm"
          options={[
            { id: 'all', label: 'All Hosts' },
            { id: 'computer', label: 'Computers' },
            { id: 'mobile', label: 'Mobile' },
            { id: 'server', label: 'Servers' },
            { id: 'router', label: 'Routers' },
            { id: 'smart-tv', label: 'Smart TV' },
            { id: 'iot', label: 'IoT' }
          ]}
        />
      </div>

      {/* Discovered Hosts Cards */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredDevices.map((device) => {
            const badge = getDeviceBadge(device);

            return (
              <LiquidGlassCard
                key={device.id}
                interactive
                onClick={() => {
                  setSelectedDevice(device);
                  setIsPortModalOpen(true);
                }}
                className={`p-4 flex flex-col justify-between gap-3 ${
                  device.isTrusted === false
                    ? 'border-amber-500/50 bg-amber-500/10'
                    : device.isLocalHost
                    ? 'border-blue-500/40'
                    : ''
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  {/* Left: Device icon & Host Details */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-xl ${badge.container} flex items-center justify-center shrink-0`}>
                      {badge.icon}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-semibold text-slate-900 dark:text-white text-xs truncate tracking-tight" title={device.hostname}>
                          {device.hostname || device.ip}
                        </h4>
                        {device.isLocalHost && (
                          <LiquidGlassBadge variant="info">Local</LiquidGlassBadge>
                        )}
                        {device.isTrusted === false && (
                          <LiquidGlassBadge variant="warning">Untrusted</LiquidGlassBadge>
                        )}
                      </div>
                      <p className="text-[11px] font-mono text-slate-600 dark:text-slate-300 truncate mt-0.5">
                        {device.ip} • <span className="text-slate-400">{device.vendor}</span>
                      </p>
                    </div>
                  </div>

                  {/* Right: Port Count & Latency */}
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <div className="flex items-center gap-1.5">
                      <LiquidGlassBadge variant="neutral">
                        {device.openPorts.length > 0 ? `${device.openPorts.length} ports` : '0 ports'}
                      </LiquidGlassBadge>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-xs shadow-emerald-500/50" />
                    </div>

                    {device.downloadRateKbps !== undefined && device.downloadRateKbps > 0 && (
                      <span className="font-mono text-[9px] text-blue-600 dark:text-sky-300 font-bold bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">
                        ↓{(device.downloadRateKbps / 1024).toFixed(1)} Mbps
                      </span>
                    )}
                  </div>
                </div>

                {/* Bottom Row Actions: WoL & Trust Whitelist */}
                <div className="flex items-center justify-between pt-2.5 border-t border-black/[0.05] dark:border-white/[0.06] text-[11px]">
                  <span className="text-slate-400 dark:text-slate-500 font-mono text-[10px]">{device.mac}</span>

                  <div className="flex items-center gap-1.5">
                    {/* Wake on LAN button */}
                    {device.supportsWol && (
                      <LiquidGlassButton
                        variant="glass"
                        size="sm"
                        onClick={(e) => handleWakeOnLan(device, e)}
                        title="Send Wake-on-LAN Magic Packet"
                        leftIcon={<Zap className="w-3 h-3 text-amber-500" />}
                      >
                        WoL
                      </LiquidGlassButton>
                    )}

                    {/* Whitelist Toggle */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onToggleTrust) onToggleTrust(device.id);
                      }}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-medium inline-flex items-center gap-1 transition-all active:scale-95 ${
                        device.isTrusted !== false
                          ? 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                          : 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                      }`}
                      title={device.isTrusted !== false ? 'Device is trusted' : 'Click to whitelist'}
                    >
                      <ShieldCheck className="w-3 h-3" />
                      <span>{device.isTrusted !== false ? 'Trusted' : 'Trust'}</span>
                    </button>
                  </div>
                </div>
              </LiquidGlassCard>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <LiquidGlassCard className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[620px]">
              <thead className="bg-black/[0.02] dark:bg-white/[0.03] border-b border-black/[0.06] dark:border-white/[0.08] text-slate-600 dark:text-slate-400 font-medium text-xs">
                <tr>
                  <th className="py-3 px-4">Host</th>
                  <th className="py-3 px-4">IP Address</th>
                  <th className="py-3 px-4">Vendor & MAC</th>
                  <th className="py-3 px-4">Trust Status</th>
                  <th className="py-3 px-4">Open Ports</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.04]">
                {filteredDevices.map(device => (
                  <tr key={device.id} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                      {device.hostname || 'Unknown'}
                    </td>
                    <td className="py-3 px-4 font-mono text-blue-600 dark:text-sky-300 font-medium">
                      {device.ip}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300 font-mono">
                      {device.mac} ({device.vendor})
                    </td>
                    <td className="py-3 px-4">
                      <LiquidGlassBadge variant={device.isTrusted !== false ? 'success' : 'warning'}>
                        {device.isTrusted !== false ? 'Trusted' : 'Untrusted'}
                      </LiquidGlassBadge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        {device.openPorts.map(p => (
                          <span key={p} className="px-2 py-0.5 rounded-full bg-black/[0.05] dark:bg-white/[0.08] font-mono text-[10px] text-slate-700 dark:text-slate-200">
                            {p}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <LiquidGlassButton
                        variant="glass"
                        size="sm"
                        onClick={() => {
                          setSelectedDevice(device);
                          setIsPortModalOpen(true);
                        }}
                      >
                        Audit
                      </LiquidGlassButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </LiquidGlassCard>
      )}

      {/* Target Device Port Modal via LiquidGlassModal */}
      {selectedDevice && (
        <LiquidGlassModal
          isOpen={isPortModalOpen}
          onClose={() => setIsPortModalOpen(false)}
          title={selectedDevice.hostname}
          subtitle={`${selectedDevice.ip} • ${selectedDevice.vendor} • ${selectedDevice.mac}`}
          maxWidth="max-w-md"
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Discovered Services & Ports
              </label>
              <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                {[
                  { port: 22, name: 'SSH Remote Shell' },
                  { port: 80, name: 'HTTP Web Server' },
                  { port: 443, name: 'HTTPS Encrypted Web' },
                  { port: 5173, name: 'Vite Frontend Server' },
                  { port: 8000, name: 'Django REST API' },
                  { port: 53, name: 'DNS Server' }
                ].map(item => {
                  const isOpen = selectedDevice.openPorts.includes(item.port);
                  return (
                    <div 
                      key={item.port}
                      className="p-2.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.05] dark:border-white/[0.07] flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">Port {item.port}</span>
                        <span className="text-slate-500 dark:text-slate-300 ml-2">{item.name}</span>
                      </div>
                      <LiquidGlassBadge variant={isOpen ? 'success' : 'neutral'}>
                        {isOpen ? 'Online' : 'Closed'}
                      </LiquidGlassBadge>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-black/[0.06] dark:border-white/[0.08]">
              <LiquidGlassButton
                variant="glass"
                size="sm"
                onClick={() => setIsPortModalOpen(false)}
              >
                Close
              </LiquidGlassButton>
              <LiquidGlassButton
                variant="primary"
                size="sm"
                onClick={() => copyToClipboard(selectedDevice.ip)}
                leftIcon={copiedIp === selectedDevice.ip ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              >
                {copiedIp === selectedDevice.ip ? 'Copied' : 'Copy IP'}
              </LiquidGlassButton>
            </div>
          </div>
        </LiquidGlassModal>
      )}
    </div>
  );
};
