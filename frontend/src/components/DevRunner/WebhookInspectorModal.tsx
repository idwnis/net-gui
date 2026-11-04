import React, { useState } from 'react';
import { DevProject, WebhookEvent } from '../../types';
import { 
  Webhook, 
  Play, 
  Copy, 
  Check, 
  CheckCircle2
} from 'lucide-react';
import { 
  LiquidGlassModal, 
  LiquidGlassButton, 
  LiquidGlassBadge 
} from '../Glisse';

interface WebhookInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: DevProject;
}

export const WebhookInspectorModal: React.FC<WebhookInspectorModalProps> = ({
  isOpen,
  onClose,
  project
}) => {
  const [webhooks, setWebhooks] = useState<WebhookEvent[]>(
    project.webhooks || [
      {
        id: 'wh-1',
        source: 'stripe',
        event: 'payment_intent.succeeded',
        timestamp: '10:41:02 AM',
        method: 'POST',
        path: '/api/webhooks/stripe',
        headers: { 'stripe-signature': 't=1700000000,v1=98234abcf...', 'content-type': 'application/json' },
        payload: { id: 'pi_3MtwBwLkdIwHu7ix28q3tqZf', amount: 4900, currency: 'usd', status: 'succeeded' },
        statusCode: 200,
        replayedCount: 2
      },
      {
        id: 'wh-2',
        source: 'github',
        event: 'push',
        timestamp: '10:38:15 AM',
        method: 'POST',
        path: '/api/webhooks/github',
        headers: { 'x-github-event': 'push', 'content-type': 'application/json' },
        payload: { ref: 'refs/heads/main', repository: { name: 'net-ui', owner: 'den' } },
        statusCode: 200,
        replayedCount: 0
      }
    ]
  );

  const [selectedWebhook, setSelectedWebhook] = useState<WebhookEvent>(webhooks[0]);
  const [copiedPayload, setCopiedPayload] = useState(false);
  const [replaySuccess, setReplaySuccess] = useState<string | null>(null);

  const handleReplay = (wh: WebhookEvent) => {
    setReplaySuccess(wh.id);
    setWebhooks(prev => prev.map(w => w.id === wh.id ? { ...w, replayedCount: w.replayedCount + 1 } : w));
    setTimeout(() => {
      setReplaySuccess(null);
    }, 2500);
  };

  const copyPayload = () => {
    navigator.clipboard.writeText(JSON.stringify(selectedWebhook.payload, null, 2));
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  return (
    <LiquidGlassModal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <Webhook className="w-4 h-4 text-purple-500" />
          <span>Webhook Inspector & Replayer</span>
        </div>
      }
      subtitle={`Intercept and replay incoming webhooks to ${project.name}`}
      maxWidth="max-w-3xl"
    >
      <div className="space-y-4">
        {/* Split Grid: Webhook Feed Left, Payload Detail Right */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Feed Column */}
          <div className="md:col-span-5 space-y-2 max-h-[420px] overflow-y-auto pr-1">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">
              Captured Events ({webhooks.length})
            </span>
            {webhooks.map(wh => {
              const isSelected = selectedWebhook.id === wh.id;

              return (
                <div
                  key={wh.id}
                  onClick={() => setSelectedWebhook(wh)}
                  className={`p-3 rounded-2xl cursor-pointer transition-all border ${
                    isSelected
                      ? 'bg-blue-500/10 dark:bg-blue-500/15 border-blue-500 dark:border-blue-400 shadow-xs'
                      : 'bg-black/[0.02] dark:bg-white/[0.04] border-black/[0.05] dark:border-white/[0.06] hover:bg-black/[0.04]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <LiquidGlassBadge variant="neutral">
                      {wh.source.toUpperCase()}
                    </LiquidGlassBadge>
                    <span className="text-[10px] font-mono text-slate-400">{wh.timestamp}</span>
                  </div>

                  <p className="font-semibold text-xs text-slate-900 dark:text-white truncate mt-1.5">{wh.event}</p>
                  <p className="font-mono text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">{wh.path}</p>

                  <div className="flex items-center justify-between pt-2 mt-2 border-t border-black/[0.04] dark:border-white/[0.05] text-[10px]">
                    <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">HTTP {wh.statusCode}</span>
                    {wh.replayedCount > 0 && (
                      <span className="text-slate-400 font-mono">Replayed {wh.replayedCount}x</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Payload Detail Column */}
          <div className="md:col-span-7 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-xs text-slate-900 dark:text-white">{selectedWebhook.event}</h4>
                <span className="font-mono text-[11px] text-blue-600 dark:text-sky-300">{selectedWebhook.path}</span>
              </div>

              <div className="flex items-center gap-2">
                <LiquidGlassButton
                  variant="primary"
                  size="sm"
                  onClick={() => handleReplay(selectedWebhook)}
                  leftIcon={replaySuccess === selectedWebhook.id ? <CheckCircle2 className="w-3.5 h-3.5 text-white" /> : <Play className="w-3 h-3 fill-current" />}
                >
                  {replaySuccess === selectedWebhook.id ? 'Replayed (200 OK)' : 'Replay Webhook'}
                </LiquidGlassButton>
                <LiquidGlassButton
                  variant="glass"
                  size="sm"
                  onClick={copyPayload}
                  leftIcon={copiedPayload ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  title="Copy JSON Payload"
                />
              </div>
            </div>

            {/* Headers Box */}
            <div className="space-y-1">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">Headers</span>
              <div className="bg-slate-900 dark:bg-[#050914] p-2.5 rounded-xl font-mono text-[11px] text-blue-300 dark:text-sky-300 border border-black/[0.08] dark:border-white/[0.08] space-y-1">
                {Object.entries(selectedWebhook.headers).map(([k, v]) => (
                  <div key={k} className="flex">
                    <span className="text-slate-400 w-32 shrink-0">{k}:</span>
                    <span className="text-white truncate">{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Payload Box */}
            <div className="space-y-1">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">Body Payload</span>
              <div className="bg-slate-900 dark:bg-[#050914] p-3 rounded-xl font-mono text-[11px] text-slate-200 border border-black/[0.08] dark:border-white/[0.08] max-h-52 overflow-y-auto">
                <pre className="whitespace-pre-wrap leading-relaxed">
                  {JSON.stringify(selectedWebhook.payload, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>

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
