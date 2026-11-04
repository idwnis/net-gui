export type DeviceType = 
  | 'router' 
  | 'computer' 
  | 'mobile' 
  | 'iot' 
  | 'printer' 
  | 'server' 
  | 'smart-tv' 
  | 'unknown';

export interface NetworkDevice {
  id: string;
  ip: string;
  mac: string;
  vendor: string;
  hostname: string;
  deviceType: DeviceType;
  status: 'online' | 'offline';
  latencyMs: number;
  openPorts: number[];
  osHint?: string;
  lastSeen: string;
  isLocalHost?: boolean;
  isTrusted?: boolean; // Rogue device alert whitelist
  supportsWol?: boolean; // Wake-on-LAN support
  downloadRateKbps?: number; // Per-device real-time bandwidth
  uploadRateKbps?: number;
}

export interface PingTarget {
  id: string;
  name: string;
  host: string;
  latencyMs: number;
  history: number[];
  jitterMs: number;
  packetLossPercent: number;
  status: 'excellent' | 'good' | 'poor' | 'down';
}

export interface SystemPort {
  id: string;
  port: number;
  protocol: 'TCP' | 'UDP';
  address: string;
  state: 'LISTEN' | 'ESTABLISHED' | 'CLOSE_WAIT' | 'TIME_WAIT';
  pid: number;
  processName: string;
  binaryPath: string;
  user: string;
  cpuPercent?: number;
  memoryMb?: number;
}

export interface LogEntry {
  timestamp: string;
  type: 'stdout' | 'stderr' | 'system';
  message: string;
  serviceId?: string;
  serviceName?: string;
}

export interface CustomDomainConfig {
  enabled: boolean;
  domain: string; // e.g. "storefront.test"
  targetPort: number;
  sslActive: boolean;
  certExpiry?: string;
}

export interface EnvVariable {
  key: string;
  value: string;
  isSecret: boolean;
  comment?: string;
  status: 'valid' | 'missing' | 'warning';
}

export interface WebhookEvent {
  id: string;
  source: 'stripe' | 'github' | 'shopify' | 'clerk' | 'custom';
  event: string;
  timestamp: string;
  method: 'POST' | 'GET';
  path: string;
  headers: Record<string, string>;
  payload: any;
  statusCode: number;
  replayedCount: number;
}

export interface DatabaseInstance {
  id: string;
  type: 'postgres' | 'mysql' | 'redis' | 'mongodb';
  name: string;
  port: number;
  status: 'online' | 'offline';
  databases: string[];
  totalConnections: number;
  memoryUsageMb: number;
  sampleTables?: {
    name: string;
    rowCount: number;
    sizeKb: number;
  }[];
  sampleRedisKeys?: {
    key: string;
    type: 'string' | 'hash' | 'list' | 'set';
    ttl: number;
    value: string;
  }[];
}

export interface SyntheticHealthCheck {
  id: string;
  serviceId: string;
  name: string;
  endpoint: string;
  intervalSec: number;
  status: 'passing' | 'failing' | 'pending';
  lastLatencyMs: number;
  uptimePercent: number;
  history: number[];
}

export interface APIEndpointDoc {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  description: string;
  parameters: { name: string; type: string; required: boolean; description: string }[];
  requestBodySample?: string;
  responseSample: string;
  tags: string[];
}

export interface ProjectService {
  id: string;
  name: string;
  category: 'node' | 'django' | 'docker' | 'python' | 'custom';
  command: string;
  cwd?: string;
  port?: number;
  status: 'stopped' | 'running' | 'starting' | 'error';
  pid?: number;
  logs: LogEntry[];
  publicTunnelUrl?: string;
  isSharedOnLan?: boolean;
  customDomain?: CustomDomainConfig;
}

export interface DevProject {
  id: string;
  name: string;
  description: string;
  sourceType: 'local_folder' | 'github_repo' | 'custom_instructions';
  path: string;
  githubUrl?: string;
  customInstructions?: string;
  detectedStack: {
    frameworks: string[];
    runtimes: string[];
    filesFound: string[];
  };
  services: ProjectService[];
  createdAt: string;
  envVariables?: EnvVariable[];
  webhooks?: WebhookEvent[];
  databaseInstances?: DatabaseInstance[];
  healthChecks?: SyntheticHealthCheck[];
  apiEndpoints?: APIEndpointDoc[];
  vercelDeployment?: {
    url: string;
    status: 'ready' | 'building' | 'failed';
    deployedAt: string;
  };
  cloudDeployment?: {
    platform: 'railway' | 'flyio' | 'vercel' | 'render';
    url: string;
    status: 'live' | 'deploying' | 'failed';
    region: string;
  };
}

export type AIProvider = 'gemini' | 'openai' | 'anthropic' | 'ollama' | 'custom';

export interface AISettings {
  provider: AIProvider;
  apiKey?: string;
  baseUrl?: string;
  model: string;
  autoAnalyzeOnImport: boolean;
  autoErrorAnalysis: boolean;
  temperature: number;
}

export interface VpnGatewayConfig {
  isEnabled: boolean;
  gatewayType: 'socks5' | 'http_proxy' | 'wireguard' | 'tailscale';
  bindAddress: string;
  proxyPort: number;
  allowAllSubnet: boolean;
  trafficRoutedBytes: number;
  activeClientsCount: number;
  upstreamInterface: string;
  dnsSinkholeEnabled?: boolean;
}

export interface DropFileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  sender: string;
  senderDevice: string;
  timestamp: string;
  status: 'pending' | 'uploading' | 'completed' | 'downloaded';
  progress: number;
  url?: string;
}

export interface DropDevice {
  id: string;
  name: string;
  type: 'iphone' | 'android' | 'mac' | 'windows' | 'tv';
  ip: string;
  lastSeen: string;
  isSelf?: boolean;
}

export interface SnifferPacket {
  id: string;
  timestamp: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'WS';
  url: string;
  status: number;
  durationMs: number;
  sizeBytes: number;
  sourceApp: string;
  contentType: string;
  requestHeaders: Record<string, string>;
  responseHeaders: Record<string, string>;
  requestBodyPreview?: string;
  responseBodyPreview?: string;
}

export interface SystemTelemetry {
  cpuUsagePercent: number;
  cpuCores: number[];
  memoryUsedGb: number;
  memoryTotalGb: number;
  networkInKbps: number;
  networkOutKbps: number;
  temperatureC: number;
  topProcesses: {
    pid: number;
    name: string;
    cpu: number;
    memory: number;
    port?: number;
  }[];
}

export interface LocalLLMModel {
  id: string;
  name: string;
  tag: string;
  family: string;
  parameterSize: string; // e.g. "8B"
  quantization: string; // e.g. "Q4_K_M"
  sizeGb: number;
  vramUsageGb: number;
  status: 'loaded_in_vram' | 'on_disk' | 'downloading';
  contextLength: number;
  lastUsed: string;
}

export interface DNSSinkholeStats {
  isEnabled: boolean;
  totalQueries: number;
  blockedQueries: number;
  blockPercent: number;
  domainsOnBlocklist: number;
  activeListenPort: number;
}

export interface DNSQueryLog {
  id: string;
  timestamp: string;
  domain: string;
  clientIp: string;
  clientName: string;
  type: 'A' | 'AAAA' | 'HTTPS';
  status: 'blocked' | 'forwarded';
  category?: 'ad' | 'telemetry' | 'tracker' | 'malware';
}

export interface DomainWatchdogItem {
  id: string;
  domain: string;
  status: 'valid' | 'expiring_soon' | 'expired';
  sslIssuer: string;
  sslExpiryDays: number;
  validUntil: string;
  autoRenew: boolean;
  dnsRecords: { type: string; value: string; ttl: number }[];
  uptimePercent: number;
  lastChecked: string;
}

export interface ThrottleProfile {
  id: string;
  name: string;
  downloadKbps: number;
  uploadKbps: number;
  latencyMs: number;
  packetLossPercent: number;
}
