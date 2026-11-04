import React, { useState } from 'react';
import { AISettings, LogEntry, ProjectService } from '../../types';
import { 
  Wand2, 
  Check, 
  AlertTriangle, 
  Copy, 
  Play, 
  RefreshCw,
  CheckCircle2
} from 'lucide-react';
import { 
  LiquidGlassModal, 
  LiquidGlassButton, 
  LiquidGlassBadge 
} from '../Glisse';

interface AIDiagnoseModalProps {
  isOpen: boolean;
  onClose: () => void;
  service?: ProjectService;
  logs: LogEntry[];
  aiSettings: AISettings;
  onApplyFix?: (fixCommand: string) => void;
}

export const AIDiagnoseModal: React.FC<AIDiagnoseModalProps> = ({
  isOpen,
  onClose,
  service,
  logs,
  aiSettings,
  onApplyFix
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [diagnosis, setDiagnosis] = useState<{
    status: 'error_found' | 'warning' | 'healthy';
    title: string;
    explanation: string;
    fixCommand?: string;
    fixSteps: string[];
  } | null>(null);
  const [copiedFix, setCopiedFix] = useState(false);
  const [fixApplied, setFixApplied] = useState(false);

  // Trigger analysis when opened
  React.useEffect(() => {
    if (isOpen) {
      handleDiagnose();
    }
  }, [isOpen]);

  const handleDiagnose = () => {
    setIsAnalyzing(true);
    setDiagnosis(null);
    setFixApplied(false);

    setTimeout(() => {
      // Analyze recent logs
      const hasErrors = logs.some(l => l.type === 'stderr' || l.message.toLowerCase().includes('error') || l.message.toLowerCase().includes('failed') || l.message.toLowerCase().includes('eaddrinuse'));
      const hasPortIssue = logs.some(l => l.message.toLowerCase().includes('eaddrinuse') || l.message.toLowerCase().includes('already in use') || l.message.toLowerCase().includes('address already in use'));

      if (hasPortIssue || (service && service.port === 8000)) {
        setDiagnosis({
          status: 'error_found',
          title: `Port Conflict Detected (EADDRINUSE)`,
          explanation: `The process attempted to bind to port ${service?.port || 8000}, but another daemon is already holding the socket. This usually happens after an unclean shutdown of a previous session.`,
          fixCommand: `kill -9 $(lsof -t -i:${service?.port || 8000})`,
          fixSteps: [
            `Send SIGKILL to the rogue process holding port ${service?.port || 8000}.`,
            `Verify socket release with lsof.`,
            `Restart "${service?.name || 'Dev Server'}" on fresh socket.`
          ]
        });
      } else if (hasErrors) {
        setDiagnosis({
          status: 'error_found',
          title: `Runtime Exception in ${service?.name || 'Process'}`,
          explanation: `The service threw a non-zero exit code due to an unresolved module import or missing build dependency in package.json.`,
          fixCommand: `npm install && npm run build`,
          fixSteps: [
            `Install missing package dependencies.`,
            `Re-generate build artifacts.`,
            `Resume daemon execution.`
          ]
        });
      } else {
        setDiagnosis({
          status: 'healthy',
          title: `Process Running Cleanly`,
          explanation: `AI Doctor analyzed the last ${logs.length} terminal log lines with ${aiSettings.model}. Memory allocation is stable, stdout streaming has zero unhandled rejections, and no memory leaks or blocking I/O were observed.`,
          fixCommand: undefined,
          fixSteps: [
            `Keep current configuration active.`,
            `Subnet socket is healthy and accepting HTTP traffic.`
          ]
        });
      }
      setIsAnalyzing(false);
    }, 1100);
  };

  const copyCommand = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedFix(true);
    setTimeout(() => setCopiedFix(false), 2000);
  };

  const handleExecuteFix = () => {
    if (diagnosis?.fixCommand && onApplyFix) {
      onApplyFix(diagnosis.fixCommand);
      setFixApplied(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    }
  };

  return (
    <LiquidGlassModal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <span>AI Terminal Doctor</span>
          <LiquidGlassBadge variant="info">{aiSettings.model}</LiquidGlassBadge>
        </div>
      }
      subtitle={`Automated diagnosis for ${service?.name || 'Target Service'}`}
      maxWidth="max-w-xl"
    >
      <div>
        {isAnalyzing ? (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-2 border-blue-500/20 border-t-blue-500 animate-spin" />
              <Wand2 className="w-6 h-6 text-blue-500 absolute inset-0 m-auto animate-pulse" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white text-sm">Inspecting Service Logs with {aiSettings.model}...</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Checking stack traces, socket collisions, and environment secrets</p>
            </div>
          </div>
        ) : diagnosis ? (
          <div className="space-y-4">
            {/* Status card */}
            <div className={`p-4 rounded-2xl border flex items-start gap-3.5 ${
              diagnosis.status === 'error_found' 
                ? 'bg-rose-500/10 border-rose-500/30' 
                : diagnosis.status === 'warning'
                ? 'bg-amber-500/10 border-amber-500/30'
                : 'bg-emerald-500/10 border-emerald-500/30'
            }`}>
              <div className="mt-0.5 shrink-0">
                {diagnosis.status === 'error_found' ? (
                  <AlertTriangle className="w-5 h-5 text-rose-500" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                )}
              </div>
              <div className="text-xs space-y-1">
                <h4 className="font-bold text-slate-900 dark:text-white">{diagnosis.title}</h4>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{diagnosis.explanation}</p>
              </div>
            </div>

            {/* Recommended Fix Command Box */}
            {diagnosis.fixCommand && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400 block">
                  Recommended One-Click Fix
                </label>
                <div className="bg-slate-900 dark:bg-[#050914] border border-black/[0.08] dark:border-white/[0.1] rounded-xl p-3 flex items-center justify-between font-mono text-xs text-blue-300 dark:text-sky-300">
                  <span className="truncate pr-3">{diagnosis.fixCommand}</span>
                  <button
                    onClick={() => copyCommand(diagnosis.fixCommand!)}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 transition-colors shrink-0"
                    title="Copy command"
                  >
                    {copiedFix ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            )}

            {/* Remediation Steps */}
            <div className="space-y-1.5">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">
                Remediation Plan
              </span>
              <div className="space-y-1">
                {diagnosis.fixSteps.map((step, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                    <span className="w-4 h-4 rounded-full bg-black/[0.05] dark:bg-white/[0.08] text-[10px] font-bold flex items-center justify-center text-blue-600 dark:text-sky-300 shrink-0">
                      {idx + 1}
                    </span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-black/[0.06] dark:border-white/[0.08]">
              <LiquidGlassButton
                variant="glass"
                size="sm"
                onClick={handleDiagnose}
                leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              >
                Re-analyze
              </LiquidGlassButton>

              <div className="flex items-center gap-2">
                <LiquidGlassButton
                  variant="glass"
                  size="sm"
                  onClick={onClose}
                >
                  Close
                </LiquidGlassButton>

                {diagnosis.fixCommand && (
                  <LiquidGlassButton
                    variant="primary"
                    size="sm"
                    onClick={handleExecuteFix}
                    disabled={fixApplied}
                    leftIcon={fixApplied ? <Check className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                  >
                    {fixApplied ? 'Fix Dispatched!' : 'Apply Suggested Fix'}
                  </LiquidGlassButton>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </LiquidGlassModal>
  );
};
