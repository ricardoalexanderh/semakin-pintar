// ===== Brain Bomb — WebRTC P2P Room System =====
// Uses PeerJS for WebRTC signaling and DataChannels.
// The host creates a room, guests join by entering the code or scanning QR.
// PeerJS provides a free cloud signaling server so peers on different
// devices can discover each other and establish direct P2P connections.

import Peer, { DataConnection } from 'peerjs';
import QRCode from 'qrcode';
import type { PeerMessage } from './types';

// Prefix for PeerJS IDs to avoid collisions
const PEER_PREFIX = 'brain-bomb-';

// TURN server credentials from environment variables
const TURN_HOST = import.meta.env.VITE_TURN_HOST || 'sg.relay.metered.ca';
const TURN_USER = import.meta.env.VITE_TURN_USER || '';
const TURN_PASS = import.meta.env.VITE_TURN_PASS || '';

function buildIceServers(): RTCIceServer[] {
  const servers: RTCIceServer[] = [
    { urls: 'stun:stun.relay.metered.ca:80' },
    { urls: 'stun:stun.l.google.com:19302' },
  ];
  if (TURN_USER && TURN_PASS) {
    servers.push(
      { urls: `turn:${TURN_HOST}:80`, username: TURN_USER, credential: TURN_PASS },
      { urls: `turn:${TURN_HOST}:80?transport=tcp`, username: TURN_USER, credential: TURN_PASS },
      { urls: `turn:${TURN_HOST}:443`, username: TURN_USER, credential: TURN_PASS },
      { urls: `turns:${TURN_HOST}:443?transport=tcp`, username: TURN_USER, credential: TURN_PASS },
    );
  }
  return servers;
}

function buildPeerOptions(forceRelay = false): Record<string, unknown> {
  const config: Record<string, unknown> = { iceServers: buildIceServers() };
  if (forceRelay) {
    config.iceTransportPolicy = 'relay';
  }
  return { debug: 0, config };
}

// Generate a short room code (6 chars)
export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// Generate a unique peer ID
export function generatePeerId(): string {
  return `peer_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

type MessageHandler = (msg: PeerMessage) => void;
type ConnectionHandler = (peerId: string) => void;
type ReadyHandler = () => void;
type ErrorHandler = (errorType: 'room-not-found' | 'connection-failed', message: string) => void;

export class GameRoom {
  roomCode: string;
  peerId: string;
  isHost: boolean;
  private peer: Peer | null = null;
  private connections: Map<string, DataConnection> = new Map();
  private onMessage: MessageHandler;
  private onPeerConnected: ConnectionHandler;
  private onPeerDisconnected: ConnectionHandler;
  private onReady: ReadyHandler;
  private onError: ErrorHandler;
  private destroyed = false;
  private initRetries = 0;
  private forceRelay = false;
  private pendingConn: DataConnection | null = null;

  constructor(
    roomCode: string,
    isHost: boolean,
    onMessage: MessageHandler,
    onPeerConnected: ConnectionHandler,
    onPeerDisconnected: ConnectionHandler,
    onReady?: ReadyHandler,
    onError?: ErrorHandler,
  ) {
    this.roomCode = roomCode;
    this.peerId = generatePeerId();
    this.isHost = isHost;
    this.onMessage = onMessage;
    this.onPeerConnected = onPeerConnected;
    this.onPeerDisconnected = onPeerDisconnected;
    this.onReady = onReady || (() => {});
    this.onError = onError || (() => {});

    this.init();
  }

  private init() {
    // Host registers with a deterministic ID based on room code so guests can find it.
    // Guests register with a random ID.
    const peerjsId = this.isHost
      ? `${PEER_PREFIX}${this.roomCode}`
      : `${PEER_PREFIX}${this.peerId}`;

    this.peer = new Peer(peerjsId, buildPeerOptions(this.forceRelay) as ConstructorParameters<typeof Peer>[1]);

    this.peer.on('open', () => {
      if (this.destroyed) return;

      if (!this.isHost) {
        // Guest: connect to the host
        const hostId = `${PEER_PREFIX}${this.roomCode}`;
        const conn = this.peer!.connect(hostId, { reliable: true });
        this.pendingConn = conn;
        this.setupConnection(conn);
        // Guest onReady is deferred until the data connection actually opens
        // (see conn.on('open') in setupConnection) to avoid broadcasting
        // to an empty connections map if the user clicks JOIN too quickly.
      } else {
        this.onReady();
      }
    });

    this.peer.on('error', (err) => {
      if (this.destroyed) return;
      console.warn('[Brain Bomb WebRTC] Peer error:', err.type, err.message);

      // If host ID is taken (e.g. from React StrictMode double-mount), retry after a delay
      if (err.type === 'unavailable-id' && this.isHost) {
        if (this.initRetries < 3) {
          this.initRetries++;
          console.warn('[Brain Bomb WebRTC] Room ID taken, retrying...', this.initRetries);
          try { this.peer?.destroy(); } catch { /* already destroyed */ }
          this.peer = null;
          setTimeout(() => {
            if (!this.destroyed) this.init();
          }, 800 * this.initRetries);
        } else {
          this.onError('connection-failed', 'Could not create room. Please try again.');
        }
        return;
      }

      // If peer not found, host might not be ready yet — retry connection
      if (err.type === 'peer-unavailable' && !this.isHost && this.initRetries < 5) {
        this.initRetries++;
        console.warn('[Brain Bomb WebRTC] Host not found, retrying...', this.initRetries);
        // Close previous pending connection to avoid orphaned connections
        if (this.pendingConn) {
          try { this.pendingConn.close(); } catch { /* already closed */ }
          this.pendingConn = null;
        }
        setTimeout(() => {
          if (!this.destroyed && this.peer && !this.peer.destroyed) {
            const hostId = `${PEER_PREFIX}${this.roomCode}`;
            const conn = this.peer.connect(hostId, { reliable: true });
            this.pendingConn = conn;
            this.setupConnection(conn);
          }
        }, 1500 * this.initRetries);
      } else if (err.type === 'peer-unavailable' && !this.isHost && this.initRetries >= 5) {
        this.onError('room-not-found', `Could not find room ${this.roomCode}. Check the code and try again.`);
      }
    });

    // Host listens for incoming connections
    if (this.isHost) {
      this.peer.on('connection', (conn) => {
        if (this.destroyed) return;
        this.setupConnection(conn);
      });
    }
  }

  private setupConnection(conn: DataConnection) {
    // Timeout if DataChannel never opens (ICE negotiation stalled)
    const timeout = !this.isHost ? setTimeout(() => {
      if (!conn.open && !this.destroyed) {
        try { conn.close(); } catch { /* */ }
        // If not already in relay mode, retry with forced TURN relay
        if (!this.forceRelay) {
          console.warn('[Brain Bomb WebRTC] Direct connection timed out, retrying with forced relay mode...');
          this.forceRelay = true;
          this.initRetries = 0;
          // Generate new peer ID to avoid signaling server conflicts
          this.peerId = generatePeerId();
          try { this.peer?.destroy(); } catch { /* */ }
          this.peer = null;
          this.init();
        } else {
          console.warn('[Brain Bomb WebRTC] Relay connection also timed out');
          this.onError('connection-failed', 'Connection timed out. The host may be unreachable.');
        }
      }
    }, 15000) : null;

    // Host-side timeout: if a guest connection never opens, clean it up
    const hostTimeout = this.isHost ? setTimeout(() => {
      if (!conn.open && !this.destroyed) {
        console.warn('[Brain Bomb WebRTC] Host-side connection timed out, closing stale connection');
        try { conn.close(); } catch { /* */ }
      }
    }, 30000) : null;

    conn.on('open', () => {
      if (timeout) clearTimeout(timeout);
      if (hostTimeout) clearTimeout(hostTimeout);
      if (this.destroyed) return;
      if (this.pendingConn === conn) this.pendingConn = null;
      const remotePeerId = conn.peer.replace(PEER_PREFIX, '');
      this.connections.set(remotePeerId, conn);
      this.onPeerConnected(remotePeerId);
      // For guests, signal ready only after the data connection to host is open
      // so that broadcast() has a live connection to send to.
      if (!this.isHost) this.onReady();
    });

    conn.on('data', (data) => {
      if (this.destroyed) return;
      // Validate message structure before processing
      if (!data || typeof data !== 'object' || !('type' in data) || !('senderId' in data)) {
        console.warn('[Brain Bomb WebRTC] Received malformed message, ignoring');
        return;
      }
      const msg = data as PeerMessage;
      if (msg.senderId === this.peerId) return;

      this.onMessage(msg);

      // Host relays messages to all other connected peers
      if (this.isHost) {
        const senderConnId = conn.peer.replace(PEER_PREFIX, '');
        for (const [id, c] of this.connections) {
          if (id !== senderConnId && c.open) {
            try { c.send(data); } catch { /* closed */ }
          }
        }
      }
    });

    conn.on('close', () => {
      const remotePeerId = conn.peer.replace(PEER_PREFIX, '');
      this.connections.delete(remotePeerId);
      if (!this.destroyed) {
        this.onPeerDisconnected(remotePeerId);
      }
    });

    conn.on('error', (err) => {
      console.warn('[Brain Bomb WebRTC] Connection error:', err);
      const remotePeerId = conn.peer.replace(PEER_PREFIX, '');
      this.connections.delete(remotePeerId);
      if (!this.destroyed) {
        this.onPeerDisconnected(remotePeerId);
      }
    });
  }

  send(msg: PeerMessage) {
    for (const [, conn] of this.connections) {
      if (conn.open) {
        try { conn.send(msg); } catch { /* closed */ }
      }
    }
  }

  broadcast(type: PeerMessage['type'], payload: unknown) {
    this.send({
      type,
      payload,
      senderId: this.peerId,
      timestamp: Date.now(),
    });
  }

  destroy() {
    this.destroyed = true;
    if (this.pendingConn) {
      try { this.pendingConn.close(); } catch { /* already closed */ }
      this.pendingConn = null;
    }
    for (const [, conn] of this.connections) {
      try { conn.close(); } catch { /* already closed */ }
    }
    this.connections.clear();
    if (this.peer) {
      try { this.peer.destroy(); } catch { /* already destroyed */ }
      this.peer = null;
    }
  }

  getPeerCount(): number {
    return this.connections.size;
  }
}

// Generate a real scannable QR code as a data URL
export async function generateQRCodeDataURL(roomCode: string): Promise<string> {
  const joinUrl = `${window.location.origin}${window.location.pathname}?room=${roomCode}`;
  return QRCode.toDataURL(joinUrl, {
    width: 360,
    margin: 2,
    color: { dark: '#ff3d3dff', light: '#1e1e24ff' },
    errorCorrectionLevel: 'M',
  });
}
