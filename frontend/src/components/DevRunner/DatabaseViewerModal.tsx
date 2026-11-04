import React, { useState } from 'react';
import { DatabaseInstance, DevProject } from '../../types';
import { 
  Database, 
  Table, 
  Key, 
  Play, 
  Copy, 
  Check
} from 'lucide-react';
import { 
  LiquidGlassModal, 
  LiquidGlassButton, 
  LiquidGlassInput, 
  LiquidGlassBadge 
} from '../Glisse';

interface DatabaseViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: DevProject;
}

export const DatabaseViewerModal: React.FC<DatabaseViewerModalProps> = ({
  isOpen,
  onClose,
  project
}) => {
  const instances = project.databaseInstances || [
    {
      id: 'db-postgres',
      type: 'postgres' as const,
      name: 'Local PostgreSQL 15',
      port: 5432,
      status: 'online' as const,
      databases: ['netpulse_dev', 'postgres'],
      totalConnections: 6,
      memoryUsageMb: 68.2,
      sampleTables: [
        { name: 'users', rowCount: 1420, sizeKb: 256 },
        { name: 'devices_cache', rowCount: 78, sizeKb: 64 },
        { name: 'audit_logs', rowCount: 18450, sizeKb: 4096 }
      ]
    },
    {
      id: 'db-redis',
      type: 'redis' as const,
      name: 'Redis 7 Cache',
      port: 6379,
      status: 'online' as const,
      databases: ['db0'],
      totalConnections: 12,
      memoryUsageMb: 24.1,
      sampleRedisKeys: [
        { key: 'session:auth:den_mac', type: 'hash' as const, ttl: 3600, value: '{"userId":"usr_1","role":"admin"}' },
        { key: 'cache:devices_online', type: 'set' as const, ttl: 300, value: '["192.168.1.1","192.168.1.105"]' },
        { key: 'rate_limit:ip:192.168.1.105', type: 'string' as const, ttl: 58, value: '14' }
      ]
    }
  ];

  const [activeInstance, setActiveInstance] = useState<DatabaseInstance>(instances[0]);
  const [sqlQuery, setSqlQuery] = useState('SELECT * FROM users LIMIT 10;');
  const [queryRunning, setQueryRunning] = useState(false);
  const [queryResult, setQueryResult] = useState<any[] | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleRunQuery = () => {
    setQueryRunning(true);
    setTimeout(() => {
      setQueryRunning(false);
      setQueryResult([
        { id: 1, email: 'alex@example.com', role: 'admin', created_at: '2026-03-01' },
        { id: 2, email: 'den@macbook.local', role: 'owner', created_at: '2026-03-04' },
        { id: 3, email: 'sarah@design.team', role: 'member', created_at: '2026-03-09' }
      ]);
    }, 450);
  };

  const copyVal = (k: string, v: string) => {
    navigator.clipboard.writeText(v);
    setCopiedKey(k);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  return (
    <LiquidGlassModal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-cyan-500" />
          <span>Local Database Micro-Viewer</span>
        </div>
      }
      subtitle={`Instant query runner & schema inspector for ${project.name}`}
      maxWidth="max-w-3xl"
    >
      <div className="space-y-4">
        {/* Database Selector Tabs */}
        <div className="flex items-center gap-2">
          {instances.map(inst => (
            <button
              key={inst.id}
              onClick={() => { setActiveInstance(inst); setQueryResult(null); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all active:scale-95 ${
                activeInstance.id === inst.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-black/[0.04] dark:bg-white/[0.06] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>{inst.name}</span>
              <LiquidGlassBadge variant="info">:{inst.port}</LiquidGlassBadge>
            </button>
          ))}
        </div>

        {/* PostgreSQL View */}
        {activeInstance.type === 'postgres' && (
          <div className="space-y-3">
            {/* Tables Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {activeInstance.sampleTables?.map(tbl => (
                <div
                  key={tbl.name}
                  onClick={() => setSqlQuery(`SELECT * FROM ${tbl.name} LIMIT 10;`)}
                  className="p-3 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.05] dark:border-white/[0.06] cursor-pointer hover:border-blue-500/40 transition-colors"
                >
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 dark:text-white">
                    <Table className="w-3.5 h-3.5 text-blue-500" />
                    <span>{tbl.name}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mt-1">
                    <span>{tbl.rowCount} rows</span>
                    <span>{tbl.sizeKb} KB</span>
                  </div>
                </div>
              ))}
            </div>

            {/* SQL Query Runner */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">Execute SQL</span>
                <LiquidGlassButton
                  variant="primary"
                  size="sm"
                  onClick={handleRunQuery}
                  isLoading={queryRunning}
                  leftIcon={!queryRunning ? <Play className="w-3 h-3 fill-current" /> : undefined}
                >
                  {queryRunning ? 'Running...' : 'Run Query'}
                </LiquidGlassButton>
              </div>

              <LiquidGlassInput
                value={sqlQuery}
                onChange={(e) => setSqlQuery(e.target.value)}
                className="font-mono text-xs"
              />
            </div>

            {/* Result Grid */}
            {queryResult && (
              <div className="rounded-2xl border border-black/[0.06] dark:border-white/[0.08] overflow-x-auto">
                <table className="w-full text-left text-xs font-mono min-w-[360px]">
                  <thead className="bg-black/[0.03] dark:bg-white/[0.04] border-b border-black/[0.06] dark:border-white/[0.08] text-slate-500 dark:text-slate-400 text-[10px]">
                    <tr>
                      {Object.keys(queryResult[0]).map(k => (
                        <th key={k} className="py-2 px-3">{k}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.04]">
                    {queryResult.map((row, i) => (
                      <tr key={i} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
                        {Object.values(row).map((val: any, j) => (
                          <td key={j} className="py-2 px-3 text-slate-800 dark:text-slate-200">{String(val)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Redis View */}
        {activeInstance.type === 'redis' && (
          <div className="space-y-2.5">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">Sample Redis Keys</span>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {activeInstance.sampleRedisKeys?.map(rk => (
                <div key={rk.key} className="p-3 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.05] dark:border-white/[0.06] flex items-center justify-between text-xs font-mono">
                  <div className="flex-1 min-w-0 pr-3">
                    <div className="flex items-center gap-2">
                      <Key className="w-3.5 h-3.5 text-amber-500" />
                      <span className="font-bold text-slate-900 dark:text-white truncate">{rk.key}</span>
                      <LiquidGlassBadge variant="neutral">{rk.type}</LiquidGlassBadge>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-1">{rk.value}</p>
                  </div>
                  <button
                    onClick={() => copyVal(rk.key, rk.value)}
                    className="p-1.5 rounded-lg bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-slate-600 dark:text-slate-300"
                    title="Copy value"
                  >
                    {copiedKey === rk.key ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              ))}
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
