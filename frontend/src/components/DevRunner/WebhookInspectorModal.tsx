import React, { useState } from 'react';
import { DevProject, WebhookEvent } from '../../types';
import * as api from '../../services/api';
import { 
  Webhook, 
  Play, 
  Copy, 
  Check, 
  CheckCircle2,
  Send,
  Radio
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
  const [webhooks, setWebhooks] = useState<WebhookEvent[]>(project.webhooks || []);
  const [selectedWebhook, setSelectedWebhook] = useState<WebhookEvent | null>(
    project.webhooks && project.webhooks.length > 0 ? project.webhooks[0] : null
  );
  const [copiedPayload, setCopiedPayload] = useState(false);
  const [replaySuccess, setReplaySuccess] = useState<string | null>(null);
  const [isSendingTest, setIsSendingTest] = useState(false);

  const handleReplay = (wh: WebhookEvent) => {
    setReplaySuccess(wh.id);
    api.replayWebhook(wh.id).catch(e => console.error('Replay failed:', e));
    setWebhooks(prev => prev.map(w => w.id === wh.id ? { ...w, replayedCount: w.replayedCount + 1 } : w));
    setTimeout(() => {
      setReplaySuccess(null);
    }, 2500);
  };

  const handleSendTestWebhook = async () => {
    setIsSendingTest(true);
    try {
      const res = await fetch(`${api.API_BASE_URL}/api/runner/webhooks/catch/test/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-github-event': 'ping',
        },
        body: JSON.stringify({
          zen: 'Real-time telemetry and zero mock data.',
          hook_id: Math.floor(Math.random() * 1000000),
          action: 'test_dispatch',
          sender: { login: 'netgui-local' }
        })
      });
      if (res.ok) {
        const data = await res.json();
        setWebhooks(prev => [data, ...prev]);
        setSelectedWebhook(data);
      }
    } catch (e) {
      console.error('Failed to dispatch test webhook:', e);
    } finally {
      setIsSendingTest(false);
    }
  };

  const copyPayload = () => {
    if (!selectedWebhook) return;
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
        {webhooks.length === 0 ? (
          <div className="py-10 px-6 text-center rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-dashed border-black/[0.08] dark:border-white/[0.08] space-y-3">
            <Radio className="w-8 h-8 text-purple-500 mx-auto opacity-70 animate-pulse" />
            <div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white">No Webhooks Captured Yet</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                Ingestion endpoint is live and listening on HTTP POST at:
              </p>
              <div className="my-2 py-1.5 px-3 rounded-lg bg-black/[0.04] dark:bg-white/[0.05] inline-block font-mono text-xs text-purple-600 dark:text-purple-300">
                http://127.0.0.1:8000/api/runner/webhooks/catch/&lt;source&gt;/
              </div>
              <p className="text-[11px] text-slate-400">
                Send webhooks from Stripe CLI, GitHub Webhooks, or cURL to inspect and replay payloads in real-time.
              </p>
            </div>
            <div className="pt-2">
              <LiquidGlassButton
                variant="primary"
                size="sm"
                onClick={handleSendTestWebhook}
                isLoading={isSendingTest}
                leftIcon={<Send className="w-3.5 h-3.5" />}
              >
                Send Test Webhook
              </LiquidGlassButton>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Feed Column */}
            <div className="md:col-span-5 space-y-2 max-h-[420px] overflow-y-auto pr-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">
                  Captured Events ({webhooks.length})
                </span>
                <button
                  onClick={handleSendTestWebhook}
                  disabled={isSendingTest}
                  className="text-[11px] text-purple-600 dark:text-purple-400 hover:underline font-medium"
                >
                  + Test Event
                </button>
              </div>

              {webhooks.map(wh => {
                const isSelected = selectedWebhook?.id === wh.id;

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
            {selectedWebhook ? (
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
                  <div className="bg-slate-900 dark:bg-[#050914] p-2.5 rounded-xl font-mono text-[11px] text-blue-300 dark:text-sky-300 border border-black/[0.08] dark:border-white/[0.08] space-y-1 max-h-32 overflow-y-auto">
                    {Object.entries(selectedWebhook.headers || {}).map(([k, v]) => (
                      <div key={k} className="flex">
                        <span className="text-slate-400 w-32 shrink-0">{k}:</span>
                        <span className="text-white truncate">{String(v)}</span>
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
            ) : (
              <div className="md:col-span-7 flex items-center justify-center p-8 text-xs text-slate-400">
                Select an event from the list to inspect headers and payload.
              </div>
            )}
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
