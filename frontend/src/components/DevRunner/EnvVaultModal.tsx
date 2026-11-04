import React, { useState } from 'react';
import { DevProject, EnvVariable } from '../../types';
import { 
  KeyRound, 
  Eye, 
  EyeOff, 
  Copy, 
  Check, 
  Plus, 
  Trash2, 
  ShieldCheck 
} from 'lucide-react';
import { 
  LiquidGlassModal, 
  LiquidGlassButton, 
  LiquidGlassInput, 
  LiquidGlassBadge 
} from '../Glisse';

interface EnvVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: DevProject;
  onSaveEnv: (projectId: string, envs: EnvVariable[]) => void;
}

export const EnvVaultModal: React.FC<EnvVaultModalProps> = ({
  isOpen,
  onClose,
  project,
  onSaveEnv
}) => {
  const [envs, setEnvs] = useState<EnvVariable[]>(
    project.envVariables || [
      { key: 'PORT', value: '3000', isSecret: false, status: 'valid' },
      { key: 'DATABASE_URL', value: 'postgres://postgres:postgres@localhost:5432/db', isSecret: true, status: 'valid' },
      { key: 'API_SECRET_KEY', value: 'sk_live_984719283749182374', isSecret: true, status: 'valid' }
    ]
  );
  const [revealedKeys, setRevealedKeys] = useState<Record<string, boolean>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  const toggleReveal = (key: string) => {
    setRevealedKeys(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const copyVal = (key: string, val: string) => {
    navigator.clipboard.writeText(val);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  const handleAddVariable = () => {
    if (!newKey.trim()) return;
    const isSec = newKey.toLowerCase().includes('key') || 
                  newKey.toLowerCase().includes('secret') || 
                  newKey.toLowerCase().includes('token') || 
                  newKey.toLowerCase().includes('password');

    const added: EnvVariable = {
      key: newKey.trim().toUpperCase(),
      value: newValue.trim(),
      isSecret: isSec,
      status: 'valid'
    };

    setEnvs(prev => [...prev, added]);
    setNewKey('');
    setNewValue('');
  };

  const handleDeleteVariable = (index: number) => {
    setEnvs(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    onSaveEnv(project.id, envs);
    onClose();
  };

  return (
    <LiquidGlassModal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-emerald-500" />
          <span>.env Secrets & Configuration Vault</span>
        </div>
      }
      subtitle={`Encrypted in-memory environment variables for ${project.name}`}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-4">
        {/* Variables List */}
        <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
          {envs.map((env, idx) => {
            const isRevealed = revealedKeys[env.key];
            const displayVal = env.isSecret && !isRevealed ? '••••••••••••••••••••••••' : env.value;

            return (
              <div
                key={idx}
                className="p-3 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.05] dark:border-white/[0.06] flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900 dark:text-white truncate">{env.key}</span>
                    {env.isSecret && (
                      <LiquidGlassBadge variant="warning">Secret</LiquidGlassBadge>
                    )}
                  </div>
                  <p className="font-mono text-slate-500 dark:text-slate-400 text-[11px] truncate mt-1">
                    {displayVal}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {env.isSecret && (
                    <button
                      onClick={() => toggleReveal(env.key)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10"
                      title={isRevealed ? 'Mask secret' : 'Reveal secret'}
                    >
                      {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  )}
                  <button
                    onClick={() => copyVal(env.key, env.value)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10"
                    title="Copy value"
                  >
                    {copiedKey === env.key ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => handleDeleteVariable(idx)}
                    className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10"
                    title="Delete variable"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add Variable Row */}
        <div className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.05] dark:border-white/[0.06] space-y-2">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">Add Environment Variable</span>
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <LiquidGlassInput
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              placeholder="VARIABLE_NAME"
              className="font-mono flex-1"
            />
            <LiquidGlassInput
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              placeholder="value or secret"
              className="font-mono flex-1"
            />
            <LiquidGlassButton
              variant="primary"
              size="md"
              onClick={handleAddVariable}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Add
            </LiquidGlassButton>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-black/[0.05] dark:border-white/[0.08]">
          <LiquidGlassButton
            variant="glass"
            size="sm"
            onClick={onClose}
          >
            Cancel
          </LiquidGlassButton>
          <LiquidGlassButton
            variant="primary"
            size="sm"
            onClick={handleSave}
            leftIcon={<ShieldCheck className="w-3.5 h-3.5" />}
          >
            Save to Project Vault
          </LiquidGlassButton>
        </div>
      </div>
    </LiquidGlassModal>
  );
};
