import React, { useState } from 'react';
import { SystemPort } from '../../types';
import { 
  Search, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Terminal, 
  RefreshCw
} from 'lucide-react';
import { 
  LiquidGlassCard, 
  LiquidGlassButton, 
  LiquidGlassBadge, 
  LiquidGlassInput, 
  LiquidGlassTabs 
} from '../Glisse';

interface LocalPortsViewProps {
  ports: SystemPort[];
  onKillProcess: (pid: number, port: number) => void;
  onRefresh: () => void;
  isLoading: boolean;
}

export const LocalPortsView: React.FC<LocalPortsViewProps> = ({
  ports,
  onKillProcess,
  onRefresh,
  isLoading
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [protocolFilter, setProtocolFilter] = useState<'all' | 'TCP' | 'UDP'>('all');
  const [checkPortInput, setCheckPortInput] = useState('');
  const [checkPortResult, setCheckPortResult] = useState<{ port: number; occupied: boolean; portInfo?: SystemPort } | null>(null);

  const filteredPorts = ports.filter(p => {
    const matchesSearch = 
      p.port.toString().includes(searchQuery) ||
      p.processName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.pid.toString().includes(searchQuery) ||
      p.address.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesProto = protocolFilter === 'all' || p.protocol === protocolFilter;
    return matchesSearch && matchesProto;
  });

  const handleCheckPort = (e: React.FormEvent) => {
    e.preventDefault();
    const portNum = parseInt(checkPortInput.trim(), 10);
    if (isNaN(portNum)) return;

    const existing = ports.find(p => p.port === portNum);
    if (existing) {
      setCheckPortResult({ port: portNum, occupied: true, portInfo: existing });
    } else {
      setCheckPortResult({ port: portNum, occupied: false });
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Header & Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <LiquidGlassButton
            variant="primary"
            size="md"
            onClick={onRefresh}
            isLoading={isLoading}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            {isLoading ? 'Scanning Sockets...' : 'Refresh Sockets'}
          </LiquidGlassButton>

          <div className="h-4 w-[1px] bg-black/[0.08] dark:bg-white/[0.1] hidden sm:block" />

          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
            {ports.length} sockets active on <span className="text-slate-900 dark:text-white font-medium">127.0.0.1 / 0.0.0.0</span>
          </span>
        </div>

        {/* Port Availability Checker Form */}
        <form onSubmit={handleCheckPort} className="flex items-center gap-2">
          <LiquidGlassInput
            type="number"
            placeholder="Probe port (e.g. 3000)..."
            value={checkPortInput}
            onChange={(e) => setCheckPortInput(e.target.value)}
            className="w-48 font-mono"
          />
          <LiquidGlassButton
            type="submit"
            variant="glass"
            size="md"
          >
            Check
          </LiquidGlassButton>
        </form>
      </div>

      {/* Port Check Result Toast */}
      {checkPortResult && (
        <LiquidGlassCard className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            {checkPortResult.occupied ? (
              <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
            ) : (
              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
            )}
            <span className="text-slate-700 dark:text-slate-200">
              {checkPortResult.occupied ? (
                <>Port <strong className="font-mono text-slate-900 dark:text-white">{checkPortResult.port}</strong> is in use by <strong>{checkPortResult.portInfo?.processName}</strong> (PID {checkPortResult.portInfo?.pid}).</>
              ) : (
                <>Port <strong className="font-mono text-slate-900 dark:text-white">{checkPortResult.port}</strong> is free and ready to bind.</>
              )}
            </span>
          </div>
          <button
            onClick={() => setCheckPortResult(null)}
            className="text-blue-600 dark:text-sky-300 hover:underline text-xs font-medium"
          >
            Dismiss
          </button>
        </LiquidGlassCard>
      )}

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex-1 max-w-sm">
          <LiquidGlassInput
            leftIcon={<Search className="w-3.5 h-3.5" />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClear={() => setSearchQuery('')}
            placeholder="Search port number, process name, or PID..."
          />
        </div>

        <LiquidGlassTabs
          value={protocolFilter}
          onChange={(val) => setProtocolFilter(val as 'all' | 'TCP' | 'UDP')}
          size="sm"
          options={[
            { id: 'all', label: 'All Protocols' },
            { id: 'TCP', label: 'TCP' },
            { id: 'UDP', label: 'UDP' }
          ]}
        />
      </div>

      {/* Ports Table Container */}
      <LiquidGlassCard className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[640px]">
            <thead className="bg-black/[0.02] dark:bg-white/[0.03] border-b border-black/[0.06] dark:border-white/[0.08] text-slate-600 dark:text-slate-400 font-medium text-xs">
              <tr>
                <th className="py-3 px-4">Port</th>
                <th className="py-3 px-4">Address</th>
                <th className="py-3 px-4">Process & PID</th>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Binary Location</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.04]">
              {filteredPorts.map((item) => (
                <tr key={item.id} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition-colors group">
                  {/* Port */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-900 dark:text-white bg-black/[0.04] dark:bg-white/[0.08] px-2 py-0.5 rounded-lg border border-black/[0.06] dark:border-white/[0.1]">
                        {item.port}
                      </span>
                      <span className="text-[10px] font-mono text-blue-600 dark:text-sky-300 font-semibold">{item.protocol}</span>
                    </div>
                  </td>

                  {/* Binding Address */}
                  <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300">
                    <span>{item.address}</span>
                    {item.address === '0.0.0.0' && (
                      <span className="ml-1.5 text-[10px] text-amber-600 dark:text-amber-300 font-sans font-medium">(Public)</span>
                    )}
                  </td>

                  {/* Process Name & PID */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <Terminal className="w-3.5 h-3.5 text-blue-500 dark:text-sky-400 shrink-0" />
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white tracking-tight">{item.processName}</p>
                        <span className="font-mono text-slate-400 text-[11px]">PID {item.pid}</span>
                      </div>
                    </div>
                  </td>

                  {/* User */}
                  <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                    {item.user}
                  </td>

                  {/* Binary Path */}
                  <td className="py-3 px-4 font-mono text-slate-500 dark:text-slate-400 max-w-[200px] truncate" title={item.binaryPath}>
                    {item.binaryPath}
                  </td>

                  {/* State */}
                  <td className="py-3 px-4">
                    <LiquidGlassBadge variant="success" dot>
                      {item.state}
                    </LiquidGlassBadge>
                  </td>

                  {/* Kill Action */}
                  <td className="py-3 px-4 text-right">
                    <LiquidGlassButton
                      variant="danger"
                      size="sm"
                      onClick={() => {
                        if (confirm(`Kill process "${item.processName}" (PID ${item.pid}) to release port ${item.port}?`)) {
                          onKillProcess(item.pid, item.port);
                        }
                      }}
                      leftIcon={<Trash2 className="w-3 h-3" />}
                    >
                      Release
                    </LiquidGlassButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </LiquidGlassCard>
    </div>
  );
};
