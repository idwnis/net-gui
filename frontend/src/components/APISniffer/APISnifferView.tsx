import React, { useState, useEffect } from 'react';
import { SnifferPacket, ThrottleProfile } from '../../types';
import * as api from '../../services/api';
import { createSnifferSocket } from '../../services/sockets';
import { 
  Radio, 
  Search, 
  Copy, 
  Check, 
  Wand2, 
  Filter, 
  Trash2, 
  Gauge, 
  WifiOff 
} from 'lucide-react';
import { 
  LiquidGlassCard, 
  LiquidGlassButton, 
  LiquidGlassBadge, 
  LiquidGlassInput 
} from '../Glisse';

const DEFAULT_THROTTLE: ThrottleProfile = {
  id: 'none',
  name: 'No Throttling (Gigabit)',
  downloadKbps: 1000000,
  uploadKbps: 1000000,
  latencyMs: 0,
  packetLossPercent: 0
};

export const APISnifferView: React.FC = () => {
  const [packets, setPackets] = useState<SnifferPacket[]>([]);
  const [selectedPacket, setSelectedPacket] = useState<SnifferPacket | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterErrorsOnly, setFilterErrorsOnly] = useState(false);
  const [copiedData, setCopiedData] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [throttleProfile, setThrottleProfile] = useState<ThrottleProfile>(DEFAULT_THROTTLE);
  const [throttlePresets, setThrottlePresets] = useState<ThrottleProfile[]>([DEFAULT_THROTTLE]);

  useEffect(() => {
    // 1. Fetch live captured packets from backend
    api.fetchSnifferPackets().then(res => {
      if (res && res.packets) {
        setPackets(res.packets);
        if (res.packets.length > 0) setSelectedPacket(res.packets[0]);
      }
    }).catch(e => console.error('Error fetching sniffer packets:', e));

    // 2. Fetch live throttle profile and presets
    api.fetchThrottleProfiles().then(res => {
      if (res) {
        if (res.activeProfile) setThrottleProfile(res.activeProfile);
        if (res.presets && res.presets.length > 0) setThrottlePresets(res.presets);
      }
    }).catch(e => console.error('Error fetching throttle profiles:', e));

    // 3. Connect to live WebSocket for real-time packet stream
    const snifferSocket = createSnifferSocket((msg) => {
      if (msg && msg.packet) {
        setPackets(prev => [msg.packet, ...prev.slice(0, 99)]);
        setSelectedPacket(prev => prev || msg.packet);
      }
    });

    return () => {
      snifferSocket.close();
    };
  }, []);

  const handleSetThrottle = async (profileId: string) => {
    try {
      const res = await api.setThrottleProfile(profileId);
      if (res && res.profile) {
        setThrottleProfile(res.profile);
      } else {
        const found = throttlePresets.find(p => p.id === profileId);
        if (found) setThrottleProfile(found);
      }
    } catch (e) {
      console.error('Failed to set throttle profile:', e);
      const found = throttlePresets.find(p => p.id === profileId);
      if (found) setThrottleProfile(found);
    }
  };

  const handleClearPackets = () => {
    setPackets([]);
    setSelectedPacket(null);
    api.clearSnifferTraffic().catch(e => console.error('Clear sniffer error:', e));
  };

  const filteredPackets = packets.filter(p => {
    const matchesSearch = 
      p.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.method.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sourceApp.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesError = filterErrorsOnly ? p.status >= 400 : true;
    return matchesSearch && matchesError;
  });

  const getStatusVariant = (status: number): 'success' | 'info' | 'warning' | 'danger' => {
    if (status >= 200 && status < 300) return 'success';
    if (status >= 300 && status < 400) return 'info';
    if (status >= 400 && status < 500) return 'warning';
    return 'danger';
  };

  const getMethodVariant = (method: string): 'info' | 'success' | 'warning' | 'danger' | 'purple' | 'neutral' => {
    switch (method) {
      case 'GET': return 'info';
      case 'POST': return 'success';
      case 'PUT': return 'warning';
      case 'DELETE': return 'danger';
      case 'WS': return 'purple';
      default: return 'neutral';
    }
  };

  const handleExplainWithAI = () => {
    if (!selectedPacket) return;
    setAiAnalysis("Analyzing packet trace with AI...");
    api.explainPacketError(selectedPacket.method, selectedPacket.url, selectedPacket.status)
      .then(res => {
        if (res && res.explanation) {
          setAiAnalysis(res.explanation);
        }
      })
      .catch(() => {
        setAiAnalysis(
          `AI Diagnosis for ${selectedPacket.method} ${selectedPacket.url} (${selectedPacket.status}):\n\n` +
          `Root Cause: The remote host responded with HTTP ${selectedPacket.status}.\n` +
          `Fix Recommendation: Check server endpoint routing and request payload parameters.`
        );
      });
  };

  const copyInspector = () => {
    if (!selectedPacket) return;
    navigator.clipboard.writeText(JSON.stringify(selectedPacket, null, 2));
    setCopiedData(true);
    setTimeout(() => setCopiedData(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 tracking-tight">
            <Radio className="w-5 h-5 text-blue-500 dark:text-sky-400" />
            Live API Sniffer & Latency Throttle Simulator
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time HTTP/HTTPS/WebSocket request telemetry with network conditions profiling (3G, 4G, packet drop).
          </p>
        </div>

        {/* Network Throttle Simulator Selector */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/[0.08] text-xs">
            <Gauge className="w-3.5 h-3.5 text-blue-500 dark:text-sky-400" />
            <span className="text-slate-500 dark:text-slate-400 font-medium">Throttle:</span>
            <select
              value={throttleProfile.id}
              onChange={(e) => handleSetThrottle(e.target.value)}
              className="bg-transparent text-slate-900 dark:text-white font-semibold focus:outline-none cursor-pointer"
            >
              {throttlePresets.map(tp => (
                <option key={tp.id} value={tp.id} className="bg-slate-100 dark:bg-[#0a1122] text-slate-900 dark:text-white">
                  {tp.name}
                </option>
              ))}
            </select>
          </div>

          <LiquidGlassButton
            variant="glass"
            size="md"
            onClick={handleClearPackets}
            leftIcon={<Trash2 className="w-3.5 h-3.5 text-rose-500" />}
          >
            Clear Traffic
          </LiquidGlassButton>
        </div>
      </div>

      {/* Throttle Active Alert */}
      {throttleProfile.id !== 'none' && (
        <LiquidGlassCard className="p-4 border-amber-500/40 bg-amber-500/10 dark:bg-amber-500/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200">
            <WifiOff className="w-4 h-4 text-amber-500" />
            <span>
              Simulating <strong>{throttleProfile.name}</strong> (+{throttleProfile.latencyMs || 0}ms latency, {throttleProfile.downloadKbps || 0} Kbps cap, {throttleProfile.packetLossPercent || 0}% packet loss).
            </span>
          </div>
          <button
            onClick={() => handleSetThrottle('none')}
            className="px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 font-bold text-[10px] active:scale-95 transition-transform"
          >
            Reset
          </button>
        </LiquidGlassCard>
      )}

      {/* Toolbar / Search & Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex-1 max-w-md">
          <LiquidGlassInput
            leftIcon={<Search className="w-3.5 h-3.5" />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClear={() => setSearchQuery('')}
            placeholder="Filter by URL, HTTP method, or source app..."
          />
        </div>

        <div className="flex items-center gap-2">
          <LiquidGlassButton
            variant={filterErrorsOnly ? 'danger' : 'glass'}
            size="md"
            onClick={() => setFilterErrorsOnly(!filterErrorsOnly)}
            leftIcon={<Filter className="w-3.5 h-3.5" />}
          >
            Errors Only (4xx / 5xx)
          </LiquidGlassButton>
        </div>
      </div>

      {/* Main Split Pane: Stream Left, Packet Inspector Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Packet Stream */}
        <div className="lg:col-span-6 space-y-2.5 max-h-[620px] overflow-y-auto pr-1">
          {filteredPackets.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 italic border border-dashed border-black/[0.1] dark:border-white/[0.1] rounded-2xl">
              No network packets captured yet. Intercepting live traffic...
            </div>
          ) : (
            filteredPackets.map(packet => {
              const isSelected = selectedPacket?.id === packet.id;
              const effectiveLatency = packet.durationMs + throttleProfile.latencyMs;

              return (
                <LiquidGlassCard
                  key={packet.id}
                  interactive
                  onClick={() => { setSelectedPacket(packet); setAiAnalysis(null); }}
                  className={`p-3.5 border transition-all ${
                    isSelected
                      ? 'border-blue-500 dark:border-blue-400 bg-blue-500/10 dark:bg-blue-500/15 shadow-sm'
                      : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <LiquidGlassBadge variant={getMethodVariant(packet.method)}>
                        {packet.method}
                      </LiquidGlassBadge>
                      <LiquidGlassBadge variant={getStatusVariant(packet.status)}>
                        {packet.status}
                      </LiquidGlassBadge>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">{packet.timestamp}</span>
                  </div>

                  <p className="text-xs font-mono font-bold text-slate-900 dark:text-white truncate mt-2">{packet.url}</p>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-2 pt-2 border-t border-black/[0.05] dark:border-white/[0.06]">
                    <span className="truncate">{packet.sourceApp}</span>
                    <div className="flex items-center gap-2 font-mono text-[10px]">
                      <span className={throttleProfile.latencyMs > 0 ? 'text-amber-600 dark:text-amber-300 font-bold' : ''}>
                        {effectiveLatency}ms
                      </span>
                      <span>•</span>
                      <span>{packet.sizeBytes} B</span>
                    </div>
                  </div>
                </LiquidGlassCard>
              );
            })
          )}
        </div>

        {/* Right Column: Packet Inspector */}
        <LiquidGlassCard className="lg:col-span-6 p-5 sm:p-6 space-y-4">
          {selectedPacket ? (
            <>
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <LiquidGlassBadge variant={getMethodVariant(selectedPacket.method)}>
                      {selectedPacket.method}
                    </LiquidGlassBadge>
                    <LiquidGlassBadge variant={getStatusVariant(selectedPacket.status)}>
                      {selectedPacket.status}
                    </LiquidGlassBadge>
                  </div>
                  <p className="font-mono text-xs font-semibold text-slate-900 dark:text-white break-all mt-2.5">{selectedPacket.url}</p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                  {selectedPacket.status >= 400 && (
                    <LiquidGlassButton
                      variant="primary"
                      size="sm"
                      onClick={handleExplainWithAI}
                      leftIcon={<Wand2 className="w-3.5 h-3.5" />}
                    >
                      AI Diagnose
                    </LiquidGlassButton>
                  )}
                  <LiquidGlassButton
                    variant="glass"
                    size="sm"
                    onClick={copyInspector}
                    leftIcon={copiedData ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    title="Copy Packet JSON"
                  />
                </div>
              </div>

              {/* AI Explanation Callout */}
              {aiAnalysis && (
                <LiquidGlassCard className="p-4 border-blue-500/30 bg-blue-500/10 text-xs space-y-2">
                  <div className="flex items-center gap-2 text-blue-600 dark:text-sky-300 font-bold">
                    <Wand2 className="w-4 h-4 text-blue-500 dark:text-sky-400" />
                    <span>AI Error Diagnosis</span>
                  </div>
                  <p className="text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap font-sans text-xs">
                    {aiAnalysis}
                  </p>
                </LiquidGlassCard>
              )}

              {/* Request Headers */}
              <div className="space-y-1.5">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Request Headers</span>
                <div className="bg-slate-900 dark:bg-black/80 p-3.5 rounded-xl font-mono text-[11px] text-blue-300 dark:text-sky-300 space-y-1.5 border border-black/[0.08] dark:border-white/[0.08]">
                  {Object.entries(selectedPacket.requestHeaders || {}).map(([k, v]) => (
                    <div key={k} className="flex">
                      <span className="text-slate-400 w-32 shrink-0">{k}:</span>
                      <span className="text-white truncate">{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Body Preview */}
              {selectedPacket.responseBodyPreview && (
                <div className="space-y-1.5">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Response Body Preview</span>
                  <div className="bg-slate-900 dark:bg-black/80 p-3.5 rounded-xl font-mono text-[11px] text-slate-200 max-h-48 overflow-y-auto border border-black/[0.08] dark:border-white/[0.08]">
                    <pre className="whitespace-pre-wrap leading-relaxed">{selectedPacket.responseBodyPreview}</pre>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-500 dark:text-slate-400 space-y-2">
              <Radio className="w-8 h-8 opacity-40 animate-pulse text-blue-500" />
              <p className="text-xs font-medium">Listening for network traffic...</p>
              <p className="text-[11px] max-w-xs text-slate-400">Select an intercepted HTTP frame from the stream on the left to inspect headers and body.</p>
            </div>
          )}
        </LiquidGlassCard>
      </div>
    </div>
  );
};
