/**
 * Net GUI WebSocket Manager
 * Manages resilient bidirectional WebSocket streams across all Net GUI views.
 */

const getWsBaseUrl = (): string => {
  if (typeof window === 'undefined') return 'ws://127.0.0.1:8000';

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.hostname;

  if (window.location.port === '5173') {
    // In Vite dev mode, connect to Django default port 8000
    return `${protocol}//${host}:8000`;
  }
  return `${protocol}//${window.location.host}`;
};

export class NetGUIWebSocket {
  private url: string;
  private ws: WebSocket | null = null;
  private onMessageCallback: (data: any) => void;
  private reconnectInterval: number;
  private shouldReconnect: boolean = true;

  constructor(endpoint: string, onMessage: (data: any) => void, reconnectInterval = 3000) {
    const base = getWsBaseUrl();
    this.url = `${base}${endpoint}`;
    this.onMessageCallback = onMessage;
    this.reconnectInterval = reconnectInterval;
    this.connect();
  }

  private connect() {
    try {
      this.ws = new WebSocket(this.url);

      this.ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          this.onMessageCallback(parsed);
        } catch (e) {
          console.debug('Raw WS message received:', event.data);
        }
      };

      this.ws.onclose = () => {
        if (this.shouldReconnect) {
          setTimeout(() => this.connect(), this.reconnectInterval);
        }
      };

      this.ws.onerror = (error) => {
        console.debug('Net GUI WS error:', error);
      };
    } catch (e) {
      if (this.shouldReconnect) {
        setTimeout(() => this.connect(), this.reconnectInterval);
      }
    }
  }

  public send(payload: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(typeof payload === 'string' ? payload : JSON.stringify(payload));
    }
  }

  public close() {
    this.shouldReconnect = false;
    if (this.ws) {
      this.ws.close();
    }
  }
}

// Backward-compatible alias
export const NetPulseWebSocket = NetGUIWebSocket;

// Convenience Factory functions
export const createTelemetrySocket = (onData: (data: any) => void) =>
  new NetGUIWebSocket('/ws/telemetry/', onData);

export const createRadarSocket = (onData: (data: any) => void) =>
  new NetGUIWebSocket('/ws/radar/', onData);

export const createServiceLogsSocket = (serviceId: string, onData: (data: any) => void) =>
  new NetGUIWebSocket(`/ws/runner/logs/${serviceId}/`, onData);

export const createDnsSocket = (onData: (data: any) => void) =>
  new NetGUIWebSocket('/ws/gateway/dns/', onData);

export const createSnifferSocket = (onData: (data: any) => void) =>
  new NetGUIWebSocket('/ws/sniffer/', onData);

export const createLandropSocket = (onData: (data: any) => void) =>
  new NetGUIWebSocket('/ws/landrop/', onData);
