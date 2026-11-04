import React, { useState } from 'react';
import { SystemTelemetry } from '../../types';
import { MOCK_SYSTEM_TELEMETRY } from '../../mock/data';
import { 
  Activity, 
  Cpu, 
  HardDrive, 
  ArrowDown, 
  ArrowUp, 
  RefreshCw, 
  Sparkles, 
  Check, 
  SlidersHorizontal 
} from 'lucide-react';
import { 
  LiquidGlassCard, 
  LiquidGlassButton, 
  LiquidGlassBadge 
} from '../Glisse';

export const SystemMonitorView: React.FC = () => {
  const [telemetry, setTelemetry] = useState<SystemTelemetry>(MOCK_SYSTEM_TELEMETRY);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizedDone, setOptimizedDone] = useState(false);

  const handleOptimizeRAM = () => {
    setIsOptimizing(true);
    setTimeout(() => {
      setTelemetry(prev => ({
        ...prev,
        cpuUsagePercent: 18,
        memoryUsedGb: 7.2
      }));
      setIsOptimizing(false);
      setOptimizedDone(true);
      setTimeout(() => setOptimizedDone(false), 3000);
    }, 1200);
  };

  const memPercent = Math.round((telemetry.memoryUsedGb / telemetry.memoryTotalGb) * 100);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 tracking-tight">
            <Activity className="w-5 h-5 text-blue-500 dark:text-sky-400" />
            System Vitals & Optical Telemetry
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time CPU cores distribution, unified memory pressure, I/O bandwidth, and process tree.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <LiquidGlassButton
            variant="primary"
            size="md"
            onClick={handleOptimizeRAM}
            disabled={isOptimizing}
            leftIcon={
              isOptimizing ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : optimizedDone ? (
                <Check className="w-3.5 h-3.5 text-emerald-300" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-blue-200" />
              )
            }
          >
            {isOptimizing ? 'Purging Inactive Cache...' : optimizedDone ? 'Freed 2.2 GB RAM' : 'Optimize System RAM'}
          </LiquidGlassButton>
        </div>
      </div>

      {/* Concentric Triple Radial Rings & Metrics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left Column: Concentric CleanMyMac Radial Aura */}
        <LiquidGlassCard className="lg:col-span-5 p-5 sm:p-6 flex flex-col items-center justify-center text-center">
          {/* Unified Concentric Radial Ring Cluster */}
          <div className="relative w-52 h-52 sm:w-60 sm:h-60 flex items-center justify-center mx-auto my-2">
            <svg viewBox="0 0 240 240" className="w-full h-full">
              <defs>
                <linearGradient id="cpuGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="100%" stopColor="#0284c7" />
                </linearGradient>

                <linearGradient id="ramGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#60a5fa" />
                  <stop offset="100%" stopColor="#2563eb" />
                </linearGradient>
              </defs>

              {/* Outer Track: CPU Dim Background Circle */}
              <circle
                cx="120"
                cy="120"
                r="96"
                fill="none"
                stroke="currentColor"
                className="text-black/[0.06] dark:text-white/[0.08]"
                strokeWidth="8"
              />

              {/* Middle Track: RAM Dim Background Circle */}
              <circle
                cx="120"
                cy="120"
                r="78"
                fill="none"
                stroke="currentColor"
                className="text-black/[0.06] dark:text-white/[0.08]"
                strokeWidth="8"
              />

              {/* Outer Active Arc: CPU Usage */}
              <circle
                cx="120"
                cy="120"
                r="96"
                fill="none"
                stroke="url(#cpuGradient)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 96}
                strokeDashoffset={2 * Math.PI * 96 * (1 - telemetry.cpuUsagePercent / 100)}
                transform="rotate(-90 120 120)"
                className="transition-all duration-700 ease-out"
              />

              {/* Middle Active Arc: RAM Pressure */}
              <circle
                cx="120"
                cy="120"
                r="78"
                fill="none"
                stroke="url(#ramGradient)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 78}
                strokeDashoffset={2 * Math.PI * 78 * (1 - memPercent / 100)}
                transform="rotate(-90 120 120)"
                className="transition-all duration-700 ease-out"
              />
            </svg>

            {/* Central Core Display */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-white dark:bg-[#0f121a] flex flex-col items-center justify-center p-2 sm:p-3 border border-black/[0.08] dark:border-white/[0.1] shadow-xs text-center">
                <span className="text-[11px] font-medium text-slate-400">System Load</span>
                <span className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-white tracking-tight mt-0.5">{telemetry.cpuUsagePercent}%</span>
                <span className="text-[11px] font-mono text-blue-600 dark:text-sky-400 font-semibold">{telemetry.temperatureC}°C</span>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-6 text-xs font-semibold text-slate-600 dark:text-slate-300 mt-2">
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
              <span>CPU ({telemetry.cpuUsagePercent}%)</span>
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span>RAM ({memPercent}%)</span>
            </span>
          </div>
        </LiquidGlassCard>

        {/* Right Column: 8-Core Activity + Bandwidth Cards */}
        <div className="lg:col-span-7 flex flex-col justify-between gap-4">
          {/* Top Row: CPU Cores */}
          <LiquidGlassCard className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Cpu className="w-4 h-4 text-blue-500 dark:text-sky-400" />
                Apple Silicon Core Load Distribution
              </span>
              <span className="text-[10px] font-mono text-slate-400">8 Cores Active</span>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {telemetry.cpuCores.map((load, i) => (
                <div key={i} className="bg-black/[0.03] dark:bg-white/[0.04] p-2 rounded-xl text-center space-y-1.5 border border-black/[0.05] dark:border-white/[0.06]">
                  <span className="text-[9px] font-mono text-slate-400">C{i + 1}</span>
                  <div className="h-14 w-2 bg-black/10 dark:bg-black/40 rounded-full mx-auto relative overflow-hidden">
                    <div
                      className="absolute bottom-0 inset-x-0 bg-blue-500 rounded-full"
                      style={{ height: `${load}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono font-medium text-slate-700 dark:text-slate-300">{load}%</span>
                </div>
              ))}
            </div>
          </LiquidGlassCard>

          {/* Bottom Row: Memory & Throughput */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <LiquidGlassCard className="p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-blue-500 dark:text-sky-400" />
                  Unified RAM
                </span>
                <span className="text-xs font-mono font-medium text-blue-600 dark:text-sky-300">
                  {telemetry.memoryUsedGb} / {telemetry.memoryTotalGb} GB
                </span>
              </div>
              <div className="w-full bg-black/10 dark:bg-black/40 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${memPercent}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Pressure: Low • App 4.8 GB • Wired 2.4 GB</p>
            </LiquidGlassCard>

            <LiquidGlassCard className="p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-emerald-500" />
                  Wi-Fi I/O Throughput
                </span>
                <LiquidGlassBadge variant="success">en0</LiquidGlassBadge>
              </div>
              <div className="flex items-center justify-between pt-1 font-mono text-xs">
                <span className="flex items-center gap-1.5 text-blue-600 dark:text-sky-300">
                  <ArrowDown className="w-3.5 h-3.5 text-blue-500 dark:text-sky-400" />
                  <span>{(telemetry.networkInKbps / 1024).toFixed(2)} MB/s</span>
                </span>
                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-300">
                  <ArrowUp className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{(telemetry.networkOutKbps / 1024).toFixed(2)} MB/s</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Zero dropped frames • Gigabit duplex</p>
            </LiquidGlassCard>
          </div>
        </div>
      </div>

      {/* Process Tree: High Resource PID Listeners */}
      <LiquidGlassCard className="p-5 space-y-3.5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-slate-900 dark:text-white">
            Port-Listening Process Tree
          </h3>
          <LiquidGlassBadge variant="neutral">5 active sockets</LiquidGlassBadge>
        </div>

        <div className="divide-y divide-black/[0.05] dark:divide-white/[0.04]">
          {telemetry.topProcesses.map(p => (
            <div key={p.pid} className="py-2.5 flex items-center justify-between text-xs font-mono gap-2">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <span className="font-semibold text-slate-900 dark:text-white font-sans truncate max-w-[120px] sm:max-w-none">{p.name}</span>
                <span className="text-slate-400 text-[11px] shrink-0">PID {p.pid}</span>
                {p.port && (
                  <LiquidGlassBadge variant="info">
                    :{p.port}
                  </LiquidGlassBadge>
                )}
              </div>

              <div className="flex items-center gap-3 sm:gap-4 text-slate-600 dark:text-slate-300 text-[11px] shrink-0">
                <span>CPU: {p.cpu}%</span>
                <span>RAM: {p.memory} MB</span>
              </div>
            </div>
          ))}
        </div>
      </LiquidGlassCard>
    </div>
  );
};
