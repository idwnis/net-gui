/**
 * Net GUI Core Client API Service Layer
 * Dynamically binds to Django 5.1 ASGI backend in dev & production.
 */

// Determine base API URL:
// In Vite Dev mode (port 5173), target the Django backend port (8000 or 8001).
// In Production / Server / Electron mode, use relative URL ('').
const getBaseApiUrl = (): string => {
  if (typeof window === 'undefined') return 'http://127.0.0.1:8000';
  
  if (window.location.port === '5173') {
    // If running in Vite dev server, point to local Django
    return 'http://127.0.0.1:8000';
  }
  return '';
};

export const API_BASE_URL = getBaseApiUrl();

// Optional Master Access Token from localStorage (Server Authentication Shield)
const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('netgui_auth_token') || localStorage.getItem('netpulse_auth_token') || '';
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['X-NetGUI-Key'] = token;
    headers['X-NetPulse-Key'] = token;
  }
  return headers;
};

// Generic Fetch Wrapper
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = { ...getAuthHeaders(), ...(options.headers as Record<string, string> || {}) };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || `Request failed with status ${response.status}`);
  }

  return response.json();
}

/* =========================================================================
   1. TELEMETRY & HARDWARE APIS
   ========================================================================= */
export const fetchTelemetry = () => request<any>('/api/telemetry/overview/');
export const optimizeRAM = () => request<any>('/api/telemetry/optimize-ram/', { method: 'POST' });

/* =========================================================================
   2. SYSTEM PORTS & SOCKETS APIS
   ========================================================================= */
export const fetchSystemPorts = (listenOnly = true) => 
  request<{ status: string; total: number; ports: any[] }>(`/api/ports/?listen_only=${listenOnly}`);

export const probePort = (port: number) =>
  request<{ port: number; occupied: boolean; portInfo?: any }>('/api/ports/check/', {
    method: 'POST',
    body: JSON.stringify({ port }),
  });

export const killProcess = (pid: number) =>
  request<{ success: boolean; message: string }>('/api/ports/kill/', {
    method: 'POST',
    body: JSON.stringify({ pid }),
  });

/* =========================================================================
   3. NETWORK RADAR, ARP & WOL APIS
   ========================================================================= */
export const fetchNetworkDevices = (type?: string, search?: string) => {
  const params = new URLSearchParams();
  if (type && type !== 'all') params.append('type', type);
  if (search) params.append('search', search);
  return request<{ status: string; total: number; devices: any[] }>(`/api/radar/devices/?${params.toString()}`);
};

export const triggerSubnetScan = () =>
  request<{ status: string; total: number; devices: any[] }>('/api/radar/scan/', { method: 'POST' });

export const toggleDeviceTrust = (deviceId: string, isTrusted?: boolean) =>
  request<any>(`/api/radar/devices/${deviceId}/trust/`, {
    method: 'POST',
    body: JSON.stringify(isTrusted !== undefined ? { isTrusted } : {}),
  });

export const sendWakeOnLan = (mac: string, broadcastIp = '255.255.255.255', port = 9) =>
  request<{ success: boolean; message: string }>('/api/radar/wol/', {
    method: 'POST',
    body: JSON.stringify({ mac, broadcastIp, port }),
  });

export const fetchPingTargets = () =>
  request<{ status: string; targets: any[] }>('/api/radar/ping-targets/');

export const testPingTargets = () =>
  request<{ status: string; targets: any[] }>('/api/radar/ping-targets/test/', { method: 'POST' });

export const inspectDevicePorts = (deviceId: string) =>
  request<{ deviceId: string; ip: string; openPorts: number[] }>(`/api/radar/devices/${deviceId}/ports/`, { method: 'POST' });

/* =========================================================================
   4. DEV RUNNER & PROCESS SUPERVISOR APIS
   ========================================================================= */
export const fetchProjects = () => request<any[]>('/api/runner/projects/');

export const createProject = (projectData: any) =>
  request<any>('/api/runner/projects/', {
    method: 'POST',
    body: JSON.stringify(projectData),
  });

export const detectStack = (path: string) =>
  request<any>('/api/runner/projects/detect/', {
    method: 'POST',
    body: JSON.stringify({ path }),
  });

export const controlService = (serviceId: string, action: 'start' | 'stop' | 'restart') =>
  request<any>(`/api/runner/services/${serviceId}/${action}/`, { method: 'POST' });

export const batchControlProject = (projectId: string, action: 'start-all' | 'stop-all') =>
  request<any>(`/api/runner/projects/${projectId}/${action}/`, { method: 'POST' });

export const rebindService = (serviceId: string, targetPort?: number) =>
  request<any>(`/api/runner/services/${serviceId}/rebind/`, {
    method: 'POST',
    body: JSON.stringify(targetPort ? { targetPort } : {}),
  });

export const clearServiceLogs = (serviceId: string) =>
  request<any>(`/api/runner/services/${serviceId}/clear-logs/`, { method: 'POST' });

export const diagnoseLogsWithAI = (serviceId: string, logs: any[], aiSettings: any) =>
  request<any>('/api/runner/diagnose/', {
    method: 'POST',
    body: JSON.stringify({ serviceId, logs, aiSettings }),
  });

export const replayWebhook = (webhookId: string, targetUrl?: string) =>
  request<any>(`/api/runner/webhooks/${webhookId}/replay/`, {
    method: 'POST',
    body: JSON.stringify(targetUrl ? { targetUrl } : {}),
  });

export const fetchDatabaseInstances = () =>
  request<any[]>('/api/runner/database/instances/');

export const runDatabaseQuery = (query: string) =>
  request<any>('/api/runner/database/query/', {
    method: 'POST',
    body: JSON.stringify({ query }),
  });

export const updateProjectEnv = (projectId: string, envVariables: any[]) =>
  request<any>(`/api/runner/projects/${projectId}/env/`, {
    method: 'POST',
    body: JSON.stringify({ envVariables }),
  });

/* =========================================================================
   5. VPN GATEWAY & DNS SINKHOLE APIS
   ========================================================================= */
export const fetchGatewayConfig = () => request<any>('/api/gateway/config/');

export const toggleGateway = (isEnabled?: boolean) =>
  request<any>('/api/gateway/toggle/', {
    method: 'POST',
    body: JSON.stringify(isEnabled !== undefined ? { isEnabled } : {}),
  });

export const fetchDnsStats = () => request<any>('/api/gateway/dns/stats/');
export const fetchDnsQueries = () => request<any[]>('/api/gateway/dns/queries/');

/* =========================================================================
   6. API SNIFFER & THROTTLER APIS
   ========================================================================= */
export const fetchSnifferPackets = () =>
  request<{ status: string; total: number; packets: any[] }>('/api/sniffer/packets/');

export const clearSnifferTraffic = () =>
  request<any>('/api/sniffer/clear/', { method: 'POST' });

export const fetchThrottleProfiles = () =>
  request<{ activeProfile: any; presets: any[] }>('/api/sniffer/throttle/');

export const setThrottleProfile = (profileId: string) =>
  request<any>('/api/sniffer/throttle/', {
    method: 'POST',
    body: JSON.stringify({ profileId }),
  });

export const explainPacketError = (method: string, url: string, status: number) =>
  request<{ explanation: string }>('/api/sniffer/explain/', {
    method: 'POST',
    body: JSON.stringify({ method, url, status }),
  });

/* =========================================================================
   7. LAN DROP APIS
   ========================================================================= */
export const fetchLandropDevices = () => request<any[]>('/api/landrop/devices/');
export const fetchLandropFiles = () => request<any[]>('/api/landrop/files/');

export const uploadLandropFile = async (file: File, sender = 'Local Host', senderDevice = 'Workstation') => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('sender', sender);
  formData.append('senderDevice', senderDevice);

  const url = `${API_BASE_URL}/api/landrop/upload/`;
  const headers: Record<string, string> = {};
  const token = localStorage.getItem('netgui_auth_token') || localStorage.getItem('netpulse_auth_token');
  if (token) {
    headers['X-NetGUI-Key'] = token;
    headers['X-NetPulse-Key'] = token;
  }

  const res = await fetch(url, { method: 'POST', headers, body: formData });
  if (!res.ok) throw new Error('File upload failed.');
  return res.json();
};

/* =========================================================================
   8. AI SWITCHBOARD APIS
   ========================================================================= */
export const fetchSwitchboardModels = () =>
  request<{ totalVramGb: number; maxVramGb: number; models: any[] }>('/api/switchboard/models/');

export const loadModelInVram = (modelId: string) =>
  request<any>(`/api/switchboard/models/${modelId}/load/`, { method: 'POST' });

export const unloadModelFromVram = (modelId: string) =>
  request<any>(`/api/switchboard/models/${modelId}/unload/`, { method: 'POST' });

export const benchmarkModel = (modelId: string, prompt: string) =>
  request<any>('/api/switchboard/benchmark/', {
    method: 'POST',
    body: JSON.stringify({ modelId, prompt }),
  });

/* =========================================================================
   9. DOMAIN WATCHDOG APIS
   ========================================================================= */
export const fetchWatchdogDomains = () => request<any[]>('/api/watchdog/domains/');

export const addWatchdogDomain = (domain: string) =>
  request<any>('/api/watchdog/domains/', {
    method: 'POST',
    body: JSON.stringify({ domain }),
  });

export const checkWatchdogDomain = (domainId: string) =>
  request<any>(`/api/watchdog/domains/${domainId}/check/`, { method: 'POST' });

export const deleteWatchdogDomain = (domainId: string) =>
  request<any>(`/api/watchdog/domains/${domainId}/`, { method: 'DELETE' });
