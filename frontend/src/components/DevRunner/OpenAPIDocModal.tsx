import React, { useState, useEffect } from 'react';
import { DevProject, APIEndpointDoc } from '../../types';
import * as api from '../../services/api';
import { 
  FileCode, 
  Copy, 
  Check, 
  Send
} from 'lucide-react';
import { 
  LiquidGlassModal, 
  LiquidGlassButton, 
  LiquidGlassBadge 
} from '../Glisse';

interface OpenAPIDocModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: DevProject;
}

export const OpenAPIDocModal: React.FC<OpenAPIDocModalProps> = ({
  isOpen,
  onClose,
  project
}) => {
  const [endpoints, setEndpoints] = useState<APIEndpointDoc[]>(project.apiEndpoints || []);
  const [selectedEndpoint, setSelectedEndpoint] = useState<APIEndpointDoc | null>(
    endpoints.length > 0 ? endpoints[0] : null
  );
  const [responseOutput, setResponseOutput] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [copiedResponse, setCopiedResponse] = useState(false);

  useEffect(() => {
    if (project.apiEndpoints && project.apiEndpoints.length > 0) {
      setEndpoints(project.apiEndpoints);
      setSelectedEndpoint(project.apiEndpoints[0]);
      return;
    }

    // Auto-discover live OpenAPI 3.0 schema from backend
    fetch(`${api.API_BASE_URL}/api/schema/?format=json`)
      .then(res => res.json())
      .then(schema => {
        if (schema && schema.paths) {
          const parsed: APIEndpointDoc[] = [];
          Object.entries(schema.paths).forEach(([path, methods]: [string, any]) => {
            ['get', 'post', 'put', 'patch', 'delete'].forEach(m => {
              if (methods[m]) {
                const op = methods[m];
                parsed.push({
                  id: `ep-${m}-${path.replace(/[^a-zA-Z0-9]/g, '-')}`,
                  path,
                  method: m.toUpperCase() as any,
                  description: op.summary || op.description || `${m.toUpperCase()} ${path}`,
                  parameters: (op.parameters || []).map((p: any) => ({
                    name: p.name || '',
                    type: p.schema?.type || 'string',
                    required: !!p.required,
                    description: p.description || ''
                  })),
                  requestBodySample: op.requestBody ? '{\n  "key": "value"\n}' : undefined,
                  responseSample: '{\n  "status": "200 OK"\n}',
                  tags: op.tags || ['API']
                });
              }
            });
          });
          if (parsed.length > 0) {
            setEndpoints(parsed);
            setSelectedEndpoint(parsed[0]);
          }
        }
      })
      .catch(e => console.error('Failed to auto-discover OpenAPI schema:', e));
  }, [project]);

  const handleSendLiveRequest = async () => {
    if (!selectedEndpoint) return;
    setIsSending(true);
    setResponseOutput(null);

    try {
      const fullUrl = selectedEndpoint.path.startsWith('http')
        ? selectedEndpoint.path
        : `${api.API_BASE_URL}${selectedEndpoint.path}`;

      const headers: Record<string, string> = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      };
      const token = localStorage.getItem('netgui_auth_token') || localStorage.getItem('netpulse_auth_token');
      if (token) {
        headers['X-NetGUI-Key'] = token;
        headers['X-NetPulse-Key'] = token;
      }

      const res = await fetch(fullUrl, {
        method: selectedEndpoint.method,
        headers,
        body: selectedEndpoint.method !== 'GET' && selectedEndpoint.requestBodySample
          ? selectedEndpoint.requestBodySample
          : undefined,
      });

      const text = await res.text();
      try {
        const json = JSON.parse(text);
        setResponseOutput(JSON.stringify(json, null, 2));
      } catch {
        setResponseOutput(text || `HTTP ${res.status} ${res.statusText}`);
      }
    } catch (err: any) {
      setResponseOutput(`Request Error: ${err.message || err}`);
    } finally {
      setIsSending(false);
    }
  };

  const copyResponse = () => {
    if (!responseOutput) return;
    navigator.clipboard.writeText(responseOutput);
    setCopiedResponse(true);
    setTimeout(() => setCopiedResponse(false), 2000);
  };

  const getMethodVariant = (method: string): 'info' | 'success' | 'warning' | 'danger' | 'neutral' => {
    switch (method) {
      case 'GET': return 'info';
      case 'POST': return 'success';
      case 'PUT': return 'warning';
      case 'DELETE': return 'danger';
      default: return 'neutral';
    }
  };

  return (
    <LiquidGlassModal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <FileCode className="w-4 h-4 text-blue-500" />
          <span>Interactive OpenAPI / Swagger Route Explorer</span>
        </div>
      }
      subtitle={`Auto-discovered endpoints and live HTTP testing for ${project.name}`}
      maxWidth="max-w-4xl"
    >
      <div className="space-y-4">
        {/* Split Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Endpoints List */}
          <div className="md:col-span-5 space-y-2 max-h-[460px] overflow-y-auto pr-1">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">Endpoints ({endpoints.length})</span>
            {endpoints.length === 0 ? (
              <p className="text-xs text-slate-500 italic p-3">No OpenAPI endpoints discovered.</p>
            ) : (
              endpoints.map(ep => {
                const isSelected = selectedEndpoint?.path === ep.path && selectedEndpoint?.method === ep.method;

                return (
                  <div
                    key={`${ep.method}-${ep.path}`}
                    onClick={() => { setSelectedEndpoint(ep); setResponseOutput(null); }}
                    className={`p-3 rounded-2xl cursor-pointer transition-all border ${
                      isSelected
                        ? 'bg-blue-500/10 dark:bg-blue-500/15 border-blue-500 dark:border-blue-400 shadow-xs'
                        : 'bg-black/[0.02] dark:bg-white/[0.04] border-black/[0.05] dark:border-white/[0.06] hover:bg-black/[0.04]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <LiquidGlassBadge variant={getMethodVariant(ep.method)}>
                        {ep.method}
                      </LiquidGlassBadge>
                      <span className="font-mono text-xs font-semibold text-slate-900 dark:text-white truncate">{ep.path}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">{ep.description}</p>
                  </div>
                );
              })
            )}
          </div>

          {/* Endpoint Detail & Try it out */}
          <div className="md:col-span-7 space-y-3.5">
            {selectedEndpoint ? (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <LiquidGlassBadge variant={getMethodVariant(selectedEndpoint.method)}>
                      {selectedEndpoint.method}
                    </LiquidGlassBadge>
                    <span className="font-mono text-sm font-semibold text-slate-900 dark:text-white">{selectedEndpoint.path}</span>
                  </div>
                  <LiquidGlassButton
                    variant="primary"
                    size="sm"
                    onClick={handleSendLiveRequest}
                    isLoading={isSending}
                    leftIcon={!isSending ? <Send className="w-3 h-3" /> : undefined}
                  >
                    {isSending ? 'Sending...' : 'Send Live Request'}
                  </LiquidGlassButton>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300">{selectedEndpoint.description}</p>

                {/* Request Schema */}
                {selectedEndpoint.requestBodySample && (
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">Request Parameters</span>
                    <div className="bg-slate-900 dark:bg-[#050914] p-3 rounded-xl font-mono text-[11px] text-blue-300 dark:text-sky-300 border border-black/[0.08] dark:border-white/[0.08]">
                      <pre className="whitespace-pre-wrap">{selectedEndpoint.requestBodySample}</pre>
                    </div>
                  </div>
                )}

                {/* Response Output */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">Live Response Payload</span>
                    {responseOutput && (
                      <button
                        onClick={copyResponse}
                        className="text-[11px] text-blue-600 dark:text-sky-300 hover:underline inline-flex items-center gap-1"
                      >
                        {copiedResponse ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedResponse ? 'Copied' : 'Copy'}</span>
                      </button>
                    )}
                  </div>
                  <div className="bg-slate-900 dark:bg-[#050914] p-3.5 rounded-xl font-mono text-[11px] text-slate-200 border border-black/[0.08] dark:border-white/[0.08] max-h-56 overflow-y-auto">
                    {responseOutput ? (
                      <pre className="whitespace-pre-wrap leading-relaxed">{responseOutput}</pre>
                    ) : (
                      <span className="text-slate-500">Click &quot;Send Live Request&quot; to test response.</span>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="h-48 flex items-center justify-center text-xs text-slate-500 italic">
                Select an endpoint from the left to view details and execute requests.
              </div>
            )}
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
