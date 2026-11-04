import React, { useState, useEffect } from 'react';
import { DatabaseInstance, DevProject } from '../../types';
import * as api from '../../services/api';
import { 
  Database, 
  Table, 
  Key, 
  Play, 
  Copy, 
  Check,
  AlertCircle
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
  const [instances, setInstances] = useState<DatabaseInstance[]>(project.databaseInstances || []);
  const [activeInstance, setActiveInstance] = useState<DatabaseInstance | null>(null);
  const [sqlQuery, setSqlQuery] = useState('');
  const [queryRunning, setQueryRunning] = useState(false);
  const [queryResult, setQueryResult] = useState<any[] | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setIsLoading(true);
    api.fetchDatabaseInstances()
      .then(dbInstances => {
        if (dbInstances && dbInstances.length > 0) {
          setInstances(dbInstances);
          setActiveInstance(dbInstances[0]);
          const firstTable = dbInstances[0].sampleTables?.[0]?.name;
          if (firstTable) {
            setSqlQuery(`SELECT * FROM ${firstTable} LIMIT 10;`);
          } else {
            setSqlQuery('SELECT name FROM sqlite_master WHERE type="table" LIMIT 10;');
          }
        }
      })
      .catch(err => {
        console.error('Failed to load database instances:', err);
      })
      .finally(() => setIsLoading(false));
  }, [isOpen]);

  const handleRunQuery = () => {
    if (!sqlQuery.trim()) return;
    setQueryRunning(true);
    setQueryError(null);

    api.runDatabaseQuery(sqlQuery)
      .then(res => {
        if (res.success) {
          setQueryResult(res.data || []);
        } else {
          setQueryError(res.error || 'Query execution failed.');
          setQueryResult(null);
        }
      })
      .catch(err => {
        setQueryError(err.message || 'Execution error.');
        setQueryResult(null);
      })
      .finally(() => setQueryRunning(false));
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
        {instances.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {instances.map(inst => (
              <button
                key={inst.id}
                onClick={() => { 
                  setActiveInstance(inst); 
                  setQueryResult(null); 
                  setQueryError(null);
                  if (inst.sampleTables?.[0]?.name) {
                    setSqlQuery(`SELECT * FROM ${inst.sampleTables[0].name} LIMIT 10;`);
                  }
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shrink-0 active:scale-95 ${
                  activeInstance?.id === inst.id
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
        )}

        {isLoading ? (
          <div className="py-12 text-center text-xs text-slate-400">
            Connecting to local database engine...
          </div>
        ) : activeInstance?.type === 'postgres' || activeInstance?.id === 'db-sqlite' ? (
          <div className="space-y-3">
            {/* Tables Grid */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                Introspected Database Tables ({activeInstance.sampleTables?.length || 0})
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                {activeInstance.sampleTables?.map(tbl => (
                  <div
                    key={tbl.name}
                    onClick={() => {
                      setSqlQuery(`SELECT * FROM ${tbl.name} LIMIT 10;`);
                      setQueryResult(null);
                      setQueryError(null);
                    }}
                    className="p-2.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.05] dark:border-white/[0.06] cursor-pointer hover:border-blue-500/40 transition-colors"
                  >
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 dark:text-white truncate">
                      <Table className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span className="truncate">{tbl.name}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mt-1">
                      <span>{tbl.rowCount} rows</span>
                      <span>{tbl.sizeKb} KB</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SQL Query Runner */}
            <div className="space-y-2 pt-2 border-t border-black/[0.05] dark:border-white/[0.08]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">Execute SQL (Safe Read-Only)</span>
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
                placeholder="SELECT * FROM table LIMIT 10;"
              />
            </div>

            {/* Query Error */}
            {queryError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="font-mono">{queryError}</span>
              </div>
            )}

            {/* Result Grid */}
            {queryResult && queryResult.length > 0 && (
              <div className="rounded-xl border border-black/[0.06] dark:border-white/[0.08] overflow-x-auto max-h-56">
                <table className="w-full text-left text-xs font-mono min-w-[360px]">
                  <thead className="bg-black/[0.03] dark:bg-white/[0.04] border-b border-black/[0.06] dark:border-white/[0.08] text-slate-500 dark:text-slate-400 text-[10px] sticky top-0">
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
                          <td key={j} className="py-2 px-3 text-slate-800 dark:text-slate-200 whitespace-nowrap">
                            {val === null ? <span className="text-slate-400 italic">null</span> : String(val)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {queryResult && queryResult.length === 0 && (
              <div className="p-4 text-center rounded-xl bg-black/[0.02] dark:bg-white/[0.02] text-xs text-slate-400 font-mono">
                Query executed successfully. 0 rows returned.
              </div>
            )}
          </div>
        ) : activeInstance?.type === 'redis' ? (
          <div className="space-y-2.5">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">Active Redis In-Memory Keys</span>
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
        ) : (
          <div className="py-8 text-center text-xs text-slate-400">
            No active database instances detected for this service.
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
