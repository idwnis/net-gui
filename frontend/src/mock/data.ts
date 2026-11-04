import { 
  NetworkDevice, 
  SystemPort, 
  DevProject, 
  PingTarget, 
  DropFileItem, 
  DropDevice, 
  SnifferPacket, 
  SystemTelemetry,
  LocalLLMModel,
  DNSSinkholeStats,
  DNSQueryLog,
  DomainWatchdogItem,
  ThrottleProfile,
  APIEndpointDoc
} from '../types';

export const MOCK_DEVICES: NetworkDevice[] = [
  {
    id: 'dev-1',
    ip: '192.168.1.1',
    mac: 'E4:C3:2A:8B:11:00',
    vendor: 'AsusTek Computer',
    hostname: 'router.asus.lan',
    deviceType: 'router',
    status: 'online',
    latencyMs: 1.2,
    openPorts: [53, 80, 443, 8080],
    osHint: 'Linux / AsusWRT',
    lastSeen: 'Just now',
    isTrusted: true,
    supportsWol: false,
    downloadRateKbps: 45200, // 45.2 Mbps
    uploadRateKbps: 8400
  },
  {
    id: 'dev-2',
    ip: '192.168.1.105',
    mac: '3C:06:30:4A:21:BC',
    vendor: 'Apple, Inc.',
    hostname: 'Den-MacBook-Pro.local',
    deviceType: 'computer',
    status: 'online',
    latencyMs: 0.1,
    openPorts: [22, 5173, 8000],
    osHint: 'macOS Sonoma',
    lastSeen: 'Just now',
    isLocalHost: true,
    isTrusted: true,
    supportsWol: true,
    downloadRateKbps: 18500, // 18.5 Mbps
    uploadRateKbps: 4200
  },
  {
    id: 'dev-3',
    ip: '192.168.1.112',
    mac: 'DC:A6:32:98:EF:01',
    vendor: 'Raspberry Pi Foundation',
    hostname: 'home-assistant.local',
    deviceType: 'server',
    status: 'online',
    latencyMs: 3.4,
    openPorts: [22, 80, 8123],
    osHint: 'Debian / Home Assistant OS',
    lastSeen: '2 min ago',
    isTrusted: true,
    supportsWol: true,
    downloadRateKbps: 45,
    uploadRateKbps: 85
  },
  {
    id: 'dev-4',
    ip: '192.168.1.140',
    mac: 'BC:D0:74:10:44:88',
    vendor: 'Samsung Electronics',
    hostname: 'Samsung-QLED-LivingRoom',
    deviceType: 'smart-tv',
    status: 'online',
    latencyMs: 6.8,
    openPorts: [8001, 8002],
    osHint: 'Tizen OS',
    lastSeen: 'Just now',
    isTrusted: true,
    supportsWol: true,
    downloadRateKbps: 24800, // 24.8 Mbps 4K Netflix
    uploadRateKbps: 320
  },
  {
    id: 'dev-5',
    ip: '192.168.1.155',
    mac: 'F0:18:98:4C:55:A2',
    vendor: 'Apple, Inc.',
    hostname: 'iPhone-15-Pro.local',
    deviceType: 'mobile',
    status: 'online',
    latencyMs: 12.1,
    openPorts: [62078],
    osHint: 'iOS 18.2',
    lastSeen: '1 min ago',
    isTrusted: true,
    supportsWol: false,
    downloadRateKbps: 3200,
    uploadRateKbps: 1100
  },
  {
    id: 'dev-6',
    ip: '192.168.1.189',
    mac: '30:AE:A4:71:02:44',
    vendor: 'Espressif Inc.',
    hostname: 'esp32-temp-sensor',
    deviceType: 'iot',
    status: 'online',
    latencyMs: 15.3,
    openPorts: [80],
    osHint: 'FreeRTOS / MicroPython',
    lastSeen: 'Just now',
    isTrusted: false, // ROGUE / UNTRUSTED ALERT
    supportsWol: false,
    downloadRateKbps: 4,
    uploadRateKbps: 12
  },
  {
    id: 'dev-7',
    ip: '192.168.1.200',
    mac: '00:1E:8F:5B:3C:99',
    vendor: 'Canon, Inc.',
    hostname: 'Canon-i-SENSYS-MF',
    deviceType: 'printer',
    status: 'offline',
    latencyMs: 0,
    openPorts: [515, 631, 9100],
    osHint: 'Embedded Canon Printer',
    lastSeen: '2 hours ago',
    isTrusted: true,
    supportsWol: true,
    downloadRateKbps: 0,
    uploadRateKbps: 0
  }
];

export const MOCK_PING_TARGETS: PingTarget[] = [
  {
    id: 'ping-gateway',
    name: 'Local Gateway (Router)',
    host: '192.168.1.1',
    latencyMs: 1.4,
    history: [1.8, 1.5, 1.2, 1.6, 1.3, 1.4],
    jitterMs: 0.3,
    packetLossPercent: 0,
    status: 'excellent'
  },
  {
    id: 'ping-cloudflare',
    name: 'Cloudflare Edge (1.1.1.1)',
    host: '1.1.1.1',
    latencyMs: 12.4,
    history: [14.1, 13.0, 11.8, 12.5, 12.0, 12.4],
    jitterMs: 0.8,
    packetLossPercent: 0,
    status: 'excellent'
  },
  {
    id: 'ping-google',
    name: 'Google DNS (8.8.8.8)',
    host: '8.8.8.8',
    latencyMs: 16.8,
    history: [18.2, 17.0, 16.5, 17.1, 16.2, 16.8],
    jitterMs: 1.2,
    packetLossPercent: 0,
    status: 'good'
  }
];

export const MOCK_SYSTEM_PORTS: SystemPort[] = [
  {
    id: 'port-1',
    port: 5173,
    protocol: 'TCP',
    address: '0.0.0.0',
    state: 'LISTEN',
    pid: 48921,
    processName: 'node (vite)',
    binaryPath: '/Users/den/.nvm/versions/node/v24.16.0/bin/node',
    user: 'den',
    cpuPercent: 0.8,
    memoryMb: 84.5
  },
  {
    id: 'port-2',
    port: 8080,
    protocol: 'TCP',
    address: '127.0.0.1',
    state: 'LISTEN',
    pid: 50411,
    processName: 'python3 (uvicorn)',
    binaryPath: '/usr/local/bin/python3',
    user: 'den',
    cpuPercent: 0.3,
    memoryMb: 45.2
  },
  {
    id: 'port-3',
    port: 3000,
    protocol: 'TCP',
    address: '127.0.0.1',
    state: 'LISTEN',
    pid: 31089,
    processName: 'node (next-server)',
    binaryPath: '/usr/local/bin/node',
    user: 'den',
    cpuPercent: 1.4,
    memoryMb: 112.0
  },
  {
    id: 'port-4',
    port: 5432,
    protocol: 'TCP',
    address: '0.0.0.0',
    state: 'LISTEN',
    pid: 1102,
    processName: 'postgres',
    binaryPath: '/opt/homebrew/opt/postgresql@15/bin/postgres',
    user: 'postgres',
    cpuPercent: 0.2,
    memoryMb: 78.4
  },
  {
    id: 'port-5',
    port: 6379,
    protocol: 'TCP',
    address: '0.0.0.0',
    state: 'LISTEN',
    pid: 1450,
    processName: 'redis-server',
    binaryPath: '/opt/homebrew/opt/redis/bin/redis-server',
    user: 'den',
    cpuPercent: 0.1,
    memoryMb: 24.1
  },
  {
    id: 'port-6',
    port: 7890,
    protocol: 'TCP',
    address: '0.0.0.0',
    state: 'LISTEN',
    pid: 51200,
    processName: 'netpulse-proxy',
    binaryPath: '/Users/den/Documents/net ui/bin/proxy',
    user: 'den',
    cpuPercent: 0.4,
    memoryMb: 32.0
  }
];

export const MOCK_API_ENDPOINTS: APIEndpointDoc[] = [
  {
    id: 'ep-1',
    method: 'GET',
    path: '/api/network/hosts',
    description: 'Returns active ARP/mDNS discovered devices on local subnet',
    parameters: [
      { name: 'refresh', type: 'boolean', required: false, description: 'Force real-time ARP probe sweep' }
    ],
    responseSample: JSON.stringify({
      status: 'ok',
      total: 7,
      devices: [{ ip: '192.168.1.1', vendor: 'AsusTek', status: 'online' }]
    }, null, 2),
    tags: ['Network Scanner']
  },
  {
    id: 'ep-2',
    method: 'POST',
    path: '/api/services/{id}/rebind',
    description: 'Auto-rebinds a dev server to the next available listening port',
    parameters: [
      { name: 'id', type: 'string', required: true, description: 'Service identifier' },
      { name: 'targetPort', type: 'integer', required: false, description: 'Desired fallback port' }
    ],
    requestBodySample: JSON.stringify({ targetPort: 3001, updateEnv: true }, null, 2),
    responseSample: JSON.stringify({ status: 'rebound', oldPort: 3000, newPort: 3001 }, null, 2),
    tags: ['Dev Supervisor']
  },
  {
    id: 'ep-3',
    method: 'POST',
    path: '/api/webhooks/replay',
    description: 'Replays a captured webhook payload to local endpoints',
    parameters: [
      { name: 'webhookId', type: 'string', required: true, description: 'ID of captured webhook' }
    ],
    responseSample: JSON.stringify({ status: 'delivered', statusCode: 200, latencyMs: 14 }, null, 2),
    tags: ['Webhooks']
  }
];

export const MOCK_PROJECTS: DevProject[] = [
  {
    id: 'proj-netpulse',
    name: 'Net GUI Core Suite',
    description: 'Vite React + Tailwind CSS liquid glass client with Python FastAPI engine',
    sourceType: 'local_folder',
    path: '/Users/den/Documents/net ui',
    detectedStack: {
      frameworks: ['React 18', 'Tailwind CSS', 'Vite', 'FastAPI'],
      runtimes: ['Node.js v24', 'Python 3.15'],
      filesFound: ['package.json', 'vite.config.ts', 'requirements.txt', 'Dockerfile']
    },
    createdAt: 'Local Workspace',
    apiEndpoints: MOCK_API_ENDPOINTS,
    cloudDeployment: {
      platform: 'railway',
      url: 'https://netpulse-production.up.railway.app',
      status: 'live',
      region: 'us-west (Oregon)'
    },
    healthChecks: [
      {
        id: 'hc-1',
        serviceId: 'svc-vite-client',
        name: 'Frontend Ping',
        endpoint: 'http://localhost:5173/',
        intervalSec: 10,
        status: 'passing',
        lastLatencyMs: 8,
        uptimePercent: 99.9,
        history: [8, 9, 7, 8, 8, 8]
      },
      {
        id: 'hc-2',
        serviceId: 'svc-python-api',
        name: 'Backend API Health',
        endpoint: 'http://localhost:8080/health',
        intervalSec: 15,
        status: 'passing',
        lastLatencyMs: 14,
        uptimePercent: 100,
        history: [14, 15, 12, 14, 13, 14]
      }
    ],
    envVariables: [
      { key: 'VITE_API_URL', value: 'http://localhost:8000', isSecret: false, status: 'valid' },
      { key: 'VITE_WS_HOST', value: 'ws://127.0.0.1:8000/ws', isSecret: false, status: 'valid' },
      { key: 'NETPULSE_AUTH_TOKEN', value: 'np_sec_991823abce128790184a', isSecret: true, status: 'valid' },
      { key: 'GEMINI_API_KEY', value: 'AIzaSyA8192739182740918237', isSecret: true, status: 'valid' }
    ],
    webhooks: [
      {
        id: 'wh-1',
        source: 'stripe',
        event: 'payment_intent.succeeded',
        timestamp: '10:41:02',
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
        timestamp: '10:38:15',
        method: 'POST',
        path: '/api/webhooks/github',
        headers: { 'x-github-event': 'push', 'content-type': 'application/json' },
        payload: { ref: 'refs/heads/main', repository: { name: 'net-ui', owner: 'den' } },
        statusCode: 200,
        replayedCount: 0
      }
    ],
    databaseInstances: [
      {
        id: 'db-postgres',
        type: 'postgres',
        name: 'Local PostgreSQL 15',
        port: 5432,
        status: 'online',
        databases: ['netpulse_dev', 'storefront_db', 'postgres'],
        totalConnections: 8,
        memoryUsageMb: 78.4,
        sampleTables: [
          { name: 'users', rowCount: 1420, sizeKb: 256 },
          { name: 'devices_cache', rowCount: 78, sizeKb: 64 },
          { name: 'audit_logs', rowCount: 18450, sizeKb: 4096 }
        ]
      },
      {
        id: 'db-redis',
        type: 'redis',
        name: 'In-Memory Cache (Redis 7)',
        port: 6379,
        status: 'online',
        databases: ['db0'],
        totalConnections: 12,
        memoryUsageMb: 24.1,
        sampleRedisKeys: [
          { key: 'session:auth:den_mac', type: 'hash', ttl: 3600, value: '{"userId":"usr_1","role":"admin"}' },
          { key: 'cache:devices_online', type: 'set', ttl: 300, value: '["192.168.1.1","192.168.1.105"]' },
          { key: 'rate_limit:ip:192.168.1.105', type: 'string', ttl: 58, value: '14' }
        ]
      }
    ],
    services: [
      {
        id: 'svc-vite-client',
        name: 'Vite Frontend Client',
        category: 'node',
        command: 'npm run dev',
        cwd: '/Users/den/Documents/net ui/frontend',
        port: 5173,
        status: 'running',
        pid: 48921,
        customDomain: {
          enabled: true,
          domain: 'netpulse.test',
          targetPort: 5173,
          sslActive: true,
          certExpiry: '364 days left'
        },
        logs: [
          { timestamp: '10:30:00', type: 'system', message: 'VITE v6.4.5 ready in 214 ms' },
          { timestamp: '10:30:01', type: 'stdout', message: '➜  Local:   http://localhost:5173/' },
          { timestamp: '10:30:01', type: 'stdout', message: '➜  Network: http://192.168.1.105:5173/' },
          { timestamp: '10:30:01', type: 'stdout', message: '➜  Custom:  https://netpulse.test/ (SSL trusted)' }
        ]
      },
      {
        id: 'svc-python-api',
        name: 'FastAPI Backend Scanner',
        category: 'python',
        command: 'uvicorn app.main:app --reload --port 8080',
        cwd: '/Users/den/Documents/net ui/backend',
        port: 8080,
        status: 'running',
        pid: 50411,
        customDomain: {
          enabled: true,
          domain: 'api.netpulse.test',
          targetPort: 8080,
          sslActive: true,
          certExpiry: '364 days left'
        },
        logs: [
          { timestamp: '10:30:02', type: 'system', message: 'Uvicorn running on http://127.0.0.1:8080 (Press CTRL+C to quit)' },
          { timestamp: '10:30:03', type: 'stdout', message: 'Started reloader process [50411] using WatchFiles' },
          { timestamp: '10:30:05', type: 'stdout', message: 'INFO: Application startup complete. ARP/mDNS scanners bound to en0.' }
        ]
      }
    ]
  },
  {
    id: 'proj-django-shop',
    name: 'Django Storefront API',
    description: 'Django 5.1 e-commerce REST engine with PostgreSQL & Celery worker',
    sourceType: 'github_repo',
    githubUrl: 'https://github.com/company/django-storefront',
    path: '/Users/den/Documents/projects/django-storefront',
    detectedStack: {
      frameworks: ['Django 5.1', 'Celery', 'PostgreSQL', 'Redis'],
      runtimes: ['Python 3.12'],
      filesFound: ['manage.py', 'requirements.txt', 'docker-compose.yml']
    },
    createdAt: 'Cloned from GitHub',
    cloudDeployment: {
      platform: 'flyio',
      url: 'https://django-storefront.fly.dev',
      status: 'live',
      region: 'fra (Frankfurt)'
    },
    envVariables: [
      { key: 'DEBUG', value: 'True', isSecret: false, status: 'valid' },
      { key: 'DATABASE_URL', value: 'postgres://postgres:postgres@localhost:5432/storefront_db', isSecret: true, status: 'valid' },
      { key: 'STRIPE_SECRET_KEY', value: 'sk_test_51Mz98124791823791823', isSecret: true, status: 'valid' }
    ],
    services: [
      {
        id: 'svc-django-web',
        name: 'Django Web Server',
        category: 'django',
        command: 'python manage.py runserver 0.0.0.0:8000',
        cwd: '/Users/den/Documents/projects/django-storefront',
        port: 8000,
        status: 'error',
        pid: 39120,
        customDomain: {
          enabled: false,
          domain: 'store.test',
          targetPort: 8000,
          sslActive: false
        },
        logs: [
          { timestamp: '10:28:10', type: 'system', message: 'Watching for file changes with StatReloader' },
          { timestamp: '10:28:12', type: 'stderr', message: 'Error: That port is already in use (EADDRINUSE: 0.0.0.0:8000).' },
          { timestamp: '10:28:12', type: 'stderr', message: 'Hint: Run kill -9 $(lsof -t -i:8000) or auto-rebind to :8001.' }
        ]
      },
      {
        id: 'svc-celery-worker',
        name: 'Celery Async Task Worker',
        category: 'python',
        command: 'celery -A storefront worker -l info',
        cwd: '/Users/den/Documents/projects/django-storefront',
        status: 'stopped',
        logs: []
      }
    ]
  },
  {
    id: 'proj-ai-agent',
    name: 'AI Agent & LLM Interface',
    description: 'Next.js 15 UI powered by local Ollama LLM engine',
    sourceType: 'custom_instructions',
    customInstructions: 'Launch Next.js on port 3000 and ensure Ollama local daemon is running on port 11434',
    path: '/Users/den/Documents/projects/ai-agent',
    detectedStack: {
      frameworks: ['Next.js 15', 'Ollama API', 'TypeScript'],
      runtimes: ['Node.js v24', 'Ollama Engine'],
      filesFound: ['package.json', 'next.config.js']
    },
    createdAt: 'Custom Instruction',
    services: [
      {
        id: 'svc-ai-ollama',
        name: 'Ollama Inference Engine',
        category: 'custom',
        command: 'ollama serve',
        cwd: '/Users/den',
        port: 11434,
        status: 'running',
        pid: 2450,
        logs: [
          { timestamp: '09:00:00', type: 'system', message: 'Ollama server listening on 127.0.0.1:11434' },
          { timestamp: '09:00:02', type: 'stdout', message: 'Models loaded: llama3.2:3b, deepseek-r1:8b' }
        ]
      },
      {
        id: 'svc-ai-next',
        name: 'Web Chat Interface (Next.js)',
        category: 'node',
        command: 'npm run dev -- -p 3000',
        cwd: '/Users/den/Documents/projects/ai-agent',
        port: 3000,
        status: 'stopped',
        logs: [
          { timestamp: '08:50:00', type: 'system', message: 'Ready on http://localhost:3000' }
        ]
      }
    ]
  }
];

export const MOCK_DROP_DEVICES: DropDevice[] = [
  { id: 'drop-mac', name: "Den's MacBook Pro (This Mac)", type: 'mac', ip: '192.168.1.105', lastSeen: 'Active', isSelf: true },
  { id: 'drop-iphone', name: 'iPhone 15 Pro (Den)', type: 'iphone', ip: '192.168.1.155', lastSeen: 'Ready' },
  { id: 'drop-tv', name: 'Living Room Samsung QLED', type: 'tv', ip: '192.168.1.140', lastSeen: 'Ready' },
  { id: 'drop-linux', name: 'Home Assistant Hub', type: 'mac', ip: '192.168.1.112', lastSeen: 'Ready' }
];

export const MOCK_DROP_ITEMS: DropFileItem[] = [
  {
    id: 'drop-1',
    name: 'IMG_20261104_104230.RAW',
    size: 48200000, // 48.2 MB
    type: 'image/raw',
    sender: 'iPhone 15 Pro',
    senderDevice: 'iPhone',
    timestamp: '10:43 AM',
    status: 'completed',
    progress: 100
  },
  {
    id: 'drop-2',
    name: 'netpulse-architecture.pdf',
    size: 4300000, // 4.3 MB
    type: 'application/pdf',
    sender: "Den's MacBook Pro",
    senderDevice: 'MacBook',
    timestamp: '10:45 AM',
    status: 'completed',
    progress: 100
  }
];

export const MOCK_SNIFFER_PACKETS: SnifferPacket[] = [
  {
    id: 'sniff-1',
    timestamp: '10:46:12.302',
    method: 'GET',
    url: 'http://localhost:8080/api/network/hosts',
    status: 200,
    durationMs: 14,
    sizeBytes: 2480,
    sourceApp: 'Vite Frontend (5173)',
    contentType: 'application/json',
    requestHeaders: { 'accept': 'application/json', 'user-agent': 'Net GUI/2.0' },
    responseHeaders: { 'content-type': 'application/json', 'x-process-time': '0.012' },
    responseBodyPreview: '{"status":"ok","total":7,"devices":[{"ip":"192.168.1.1","status":"online"}]}'
  },
  {
    id: 'sniff-2',
    timestamp: '10:46:11.110',
    method: 'POST',
    url: 'https://api.openai.com/v1/chat/completions',
    status: 401,
    durationMs: 182,
    sizeBytes: 420,
    sourceApp: 'AI Agent Service (3000)',
    contentType: 'application/json',
    requestHeaders: { 'authorization': 'Bearer invalid_or_expired_key', 'content-type': 'application/json' },
    responseHeaders: { 'content-type': 'application/json' },
    requestBodyPreview: '{"model":"gpt-4o","messages":[{"role":"user","content":"Diagnose error"}]}',
    responseBodyPreview: '{"error":{"message":"Incorrect API key provided: invalid_***. Check your settings.","type":"invalid_request_error"}}'
  },
  {
    id: 'sniff-3',
    timestamp: '10:46:08.820',
    method: 'POST',
    url: 'http://127.0.0.1:8000/api/checkout/session',
    status: 500,
    durationMs: 44,
    sizeBytes: 1240,
    sourceApp: 'Django Storefront (8000)',
    contentType: 'application/json',
    requestHeaders: { 'content-type': 'application/json' },
    responseHeaders: { 'content-type': 'text/html' },
    responseBodyPreview: 'OperationalError: could not connect to server: Connection refused (PostgreSQL :5432)'
  },
  {
    id: 'sniff-4',
    timestamp: '10:46:04.510',
    method: 'WS',
    url: 'ws://localhost:5173/',
    status: 101,
    durationMs: 0,
    sizeBytes: 310,
    sourceApp: 'Vite HMR WebSocket',
    contentType: 'websocket/binary',
    requestHeaders: { 'upgrade': 'websocket', 'connection': 'Upgrade' },
    responseHeaders: { 'upgrade': 'websocket' },
    responseBodyPreview: '{"type":"connected"}'
  }
];

export const MOCK_SYSTEM_TELEMETRY: SystemTelemetry = {
  cpuUsagePercent: 24,
  cpuCores: [18, 22, 34, 16, 28, 26, 20, 30],
  memoryUsedGb: 9.4,
  memoryTotalGb: 16.0,
  networkInKbps: 1840,
  networkOutKbps: 760,
  temperatureC: 46,
  topProcesses: [
    { pid: 48921, name: 'node (vite)', cpu: 1.8, memory: 84.5, port: 5173 },
    { pid: 31089, name: 'node (next-server)', cpu: 2.1, memory: 112.0, port: 3000 },
    { pid: 50411, name: 'python3 (uvicorn)', cpu: 0.6, memory: 45.2, port: 8080 },
    { pid: 1102, name: 'postgres', cpu: 0.2, memory: 78.4, port: 5432 },
    { pid: 1450, name: 'redis-server', cpu: 0.1, memory: 24.1, port: 6379 }
  ]
};

export const MOCK_LOCAL_MODELS: LocalLLMModel[] = [
  {
    id: 'llm-deepseek-r1',
    name: 'DeepSeek-R1 Distill Llama',
    tag: 'deepseek-r1:8b',
    family: 'llama',
    parameterSize: '8B',
    quantization: 'Q4_K_M',
    sizeGb: 4.9,
    vramUsageGb: 5.4,
    status: 'loaded_in_vram',
    contextLength: 32768,
    lastUsed: '2 min ago'
  },
  {
    id: 'llm-llama32',
    name: 'Llama 3.2 Lightweight',
    tag: 'llama3.2:3b',
    family: 'llama',
    parameterSize: '3B',
    quantization: 'Q4_K_M',
    sizeGb: 2.0,
    vramUsageGb: 2.2,
    status: 'loaded_in_vram',
    contextLength: 131072,
    lastUsed: '10 min ago'
  },
  {
    id: 'llm-qwen-coder',
    name: 'Qwen 2.5 Coder',
    tag: 'qwen2.5-coder:7b',
    family: 'qwen2',
    parameterSize: '7B',
    quantization: 'Q4_K_M',
    sizeGb: 4.7,
    vramUsageGb: 0,
    status: 'on_disk',
    contextLength: 32768,
    lastUsed: 'Yesterday'
  },
  {
    id: 'llm-nomic-embed',
    name: 'Nomic Text Embeddings',
    tag: 'nomic-embed-text:latest',
    family: 'nomic-bert',
    parameterSize: '137M',
    quantization: 'F16',
    sizeGb: 0.27,
    vramUsageGb: 0,
    status: 'on_disk',
    contextLength: 8192,
    lastUsed: '3 days ago'
  }
];

export const MOCK_DNS_SINKHOLE_STATS: DNSSinkholeStats = {
  isEnabled: true,
  totalQueries: 4120,
  blockedQueries: 1024,
  blockPercent: 24.8,
  domainsOnBlocklist: 142850,
  activeListenPort: 53
};

export const MOCK_DNS_QUERIES: DNSQueryLog[] = [
  { id: 'dns-1', timestamp: '11:04:12', domain: 'telemetry.samsung.com', clientIp: '192.168.1.140', clientName: 'Samsung QLED TV', type: 'A', status: 'blocked', category: 'telemetry' },
  { id: 'dns-2', timestamp: '11:04:09', domain: 'googleads.g.doubleclick.net', clientIp: '192.168.1.155', clientName: 'iPhone 15 Pro', type: 'HTTPS', status: 'blocked', category: 'ad' },
  { id: 'dns-3', timestamp: '11:03:55', domain: 'api.github.com', clientIp: '192.168.1.105', clientName: 'MacBook Pro', type: 'A', status: 'forwarded' },
  { id: 'dns-4', timestamp: '11:03:40', domain: 'metrics.icloud.com', clientIp: '192.168.1.155', clientName: 'iPhone 15 Pro', type: 'AAAA', status: 'blocked', category: 'tracker' },
  { id: 'dns-5', timestamp: '11:03:10', domain: 'registry.npmjs.org', clientIp: '192.168.1.105', clientName: 'MacBook Pro', type: 'A', status: 'forwarded' }
];

export const MOCK_WATCHDOG_DOMAINS: DomainWatchdogItem[] = [
  {
    id: 'dom-1',
    domain: 'netgui.dev',
    status: 'valid',
    sslIssuer: "Let's Encrypt Authority X3",
    sslExpiryDays: 184,
    validUntil: '2027-05-10',
    autoRenew: true,
    dnsRecords: [
      { type: 'A', value: '76.76.21.21', ttl: 300 },
      { type: 'CNAME', value: 'cname.vercel-dns.com', ttl: 300 }
    ],
    uptimePercent: 99.98,
    lastChecked: '3 min ago'
  },
  {
    id: 'dom-2',
    domain: 'api.storefront-hub.com',
    status: 'expiring_soon',
    sslIssuer: 'DigiCert Global TLS RSA CA',
    sslExpiryDays: 12,
    validUntil: '2026-11-16',
    autoRenew: false,
    dnsRecords: [
      { type: 'A', value: '143.198.112.90', ttl: 600 }
    ],
    uptimePercent: 99.91,
    lastChecked: 'Just now'
  },
  {
    id: 'dom-3',
    domain: 'auth.internal-company.io',
    status: 'valid',
    sslIssuer: 'Cloudflare Inc ECC CA-3',
    sslExpiryDays: 89,
    validUntil: '2027-02-01',
    autoRenew: true,
    dnsRecords: [
      { type: 'CNAME', value: 'auth-gateway.cf.net', ttl: 120 }
    ],
    uptimePercent: 100.0,
    lastChecked: '5 min ago'
  }
];

export const MOCK_THROTTLE_PROFILES: ThrottleProfile[] = [
  { id: 'none', name: 'No Throttling (Gigabit)', downloadKbps: 1000000, uploadKbps: 500000, latencyMs: 0, packetLossPercent: 0 },
  { id: 'fast4g', name: 'Fast 4G (40 Mbps)', downloadKbps: 40000, uploadKbps: 15000, latencyMs: 20, packetLossPercent: 0 },
  { id: 'slow3g', name: 'Slow 3G (400 Kbps)', downloadKbps: 400, uploadKbps: 100, latencyMs: 320, packetLossPercent: 1.5 },
  { id: 'flaky', name: 'Flaky Connection (High Jitter)', downloadKbps: 2000, uploadKbps: 500, latencyMs: 180, packetLossPercent: 5.0 }
];
