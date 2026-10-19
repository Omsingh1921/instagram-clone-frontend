/**
 * Lightweight Native STOMP over WebSocket Client
 */
class StompClient {
  constructor() {
    this.ws = null;
    this.connected = false;
    this.connecting = false;
    this.subscriptions = new Map();
    this.subCounter = 0;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectTimer = null;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname || 'localhost';
    const port = '8080';
    this.url = import.meta.env.VITE_WS_URL || `${protocol}//${host}:${port}/ws`;
  }

  connect(token) {
    if (this.connected || this.connecting) return;
    this.connecting = true;

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        const authToken = token || localStorage.getItem('access_token');
        let connectFrame = 'CONNECT\naccept-version:1.2,1.1,1.0\nheart-beat:10000,10000\n';
        if (authToken) {
          connectFrame += `Authorization:Bearer ${authToken}\n`;
        }
        connectFrame += '\n\x00';
        this.ws.send(connectFrame);
      };

      this.ws.onmessage = (event) => {
        this.handleFrame(event.data);
      };

      this.ws.onclose = () => {
        this.connected = false;
        this.connecting = false;
        this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        this.connected = false;
        this.connecting = false;
      };
    } catch {
      this.connected = false;
      this.connecting = false;
      this.scheduleReconnect();
    }
  }

  handleFrame(raw) {
    if (!raw) return;
    const frames = raw.split('\x00');
    for (const frameStr of frames) {
      const trimmed = frameStr.trim();
      if (!trimmed) continue;

      const lines = trimmed.split(/\r?\n/);
      const command = lines[0].trim();

      if (command === 'CONNECTED') {
        this.connected = true;
        this.connecting = false;
        this.reconnectAttempts = 0;
        for (const [subId, sub] of this.subscriptions.entries()) {
          this.sendSubscribeFrame(subId, sub.destination);
        }
      } else if (command === 'MESSAGE') {
        let destination = '';
        let subId = '';
        let bodyIndex = -1;

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i];
          if (line.trim() === '') {
            bodyIndex = i + 1;
            break;
          }
          const [key, ...vals] = line.split(':');
          if (key === 'destination') destination = vals.join(':').trim();
          if (key === 'subscription') subId = vals.join(':').trim();
        }

        const body = bodyIndex !== -1 ? lines.slice(bodyIndex).join('\n').trim() : '';
        let parsed = body;
        try {
          parsed = JSON.parse(body);
        } catch {
          // Plain text fallback
        }

        let sub = this.subscriptions.get(subId);
        if (!sub && destination) {
          for (const s of this.subscriptions.values()) {
            if (s.destination === destination) {
              sub = s;
              break;
            }
          }
        }

        if (sub && sub.callback) {
          sub.callback(parsed);
        }
      }
    }
  }

  sendSubscribeFrame(subId, destination) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const frame = `SUBSCRIBE\nid:${subId}\ndestination:${destination}\n\n\x00`;
      this.ws.send(frame);
    }
  }

  subscribe(destination, callback) {
    const subId = `sub-${++this.subCounter}`;
    this.subscriptions.set(subId, { destination, callback });

    if (this.connected) {
      this.sendSubscribeFrame(subId, destination);
    } else {
      this.connect();
    }

    return () => {
      this.subscriptions.delete(subId);
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(`UNSUBSCRIBE\nid:${subId}\n\n\x00`);
      }
    };
  }

  send(destination, body) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const payload = typeof body === 'string' ? body : JSON.stringify(body);
      const frame = `SEND\ndestination:${destination}\ncontent-type:application/json\n\n${payload}\x00`;
      this.ws.send(frame);
    }
  }

  scheduleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = setTimeout(() => {
        this.connect();
      }, delay);
    }
  }

  disconnect() {
    clearTimeout(this.reconnectTimer);
    if (this.ws) {
      try {
        if (this.ws.readyState === WebSocket.OPEN) {
          this.ws.send('DISCONNECT\n\n\x00');
        }
        this.ws.close();
      } catch {
        // Ignore
      }
    }
    this.connected = false;
    this.connecting = false;
    this.subscriptions.clear();
  }
}

export const stompClient = new StompClient();
export default stompClient;
