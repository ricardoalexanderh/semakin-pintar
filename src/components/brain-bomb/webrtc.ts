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

// Optional server configuration via environment variables.
// When empty/unset, PeerJS uses its free cloud signaling server (works on same network).
// Set these in your .env file to enable cross-network play:
//   VITE_PEER_HOST=your-server.com
//   VITE_PEER_PORT=9000
//   VITE_PEER_PATH=/myapp
//   VITE_STUN_URL=stun:your-server.com:3478
//   VITE_TURN_URL=turn:your-server.com:3478
//   VITE_TURN_USER=myuser
//   VITE_TURN_PASS=mypassword
const PEER_HOST = import.meta.env.VITE_PEER_HOST || '';
const PEER_PORT = parseInt(import.meta.env.VITE_PEER_PORT || '0', 10);
const PEER_PATH = import.meta.env.VITE_PEER_PATH || '/';
const STUN_URL = import.meta.env.VITE_STUN_URL || '';
const TURN_URL = import.meta.env.VITE_TURN_URL || '';
const TURN_USER = import.meta.env.VITE_TURN_USER || '';
const TURN_PASS = import.meta.env.VITE_TURN_PASS || '';

// Default free ICE servers (used when no custom server is configured)
const DEFAULT_ICE_SERVERS = [
  // Google STUN — free, reliable, handles ~80% of connections
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  // Free TURN fallbacks for strict NAT (~20% of connections)
  { urls: 'turn:turn.bistri.com:80', username: 'homeo', credential: 'homeo' },
  { urls: 'turn:turn.anyfirewall.com:443?transport=tcp', username: 'webrtc', credential: 'webrtc' },
];

function buildPeerOptions(): Record<string, unknown> {
  const opts: Record<string, unknown> = { debug: 0 };

  // Only set host/port/path if a custom PeerJS server is configured
  if (PEER_HOST) {
    opts.host = PEER_HOST;
    opts.port = PEER_PORT || 9000;
    opts.path = PEER_PATH;
    opts.secure = PEER_HOST !== 'localhost' && PEER_HOST !== '127.0.0.1';
  }

  // Use custom ICE servers if configured, otherwise use free defaults
  if (STUN_URL || TURN_URL) {
    const iceServers: Record<string, string>[] = [];
    if (STUN_URL) iceServers.push({ urls: STUN_URL });
    if (TURN_URL) iceServers.push({ urls: TURN_URL, username: TURN_USER, credential: TURN_PASS });
    opts.config = { iceServers };
  } else {
    opts.config = { iceServers: DEFAULT_ICE_SERVERS };
  }

  return opts;
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
  private destroyed = false;

  constructor(
    roomCode: string,
    isHost: boolean,
    onMessage: MessageHandler,
    onPeerConnected: ConnectionHandler,
    onPeerDisconnected: ConnectionHandler,
    onReady?: ReadyHandler,
  ) {
    this.roomCode = roomCode;
    this.peerId = generatePeerId();
    this.isHost = isHost;
    this.onMessage = onMessage;
    this.onPeerConnected = onPeerConnected;
    this.onPeerDisconnected = onPeerDisconnected;
    this.onReady = onReady || (() => {});

    this.init();
  }

  private init() {
    // Host registers with a deterministic ID based on room code so guests can find it.
    // Guests register with a random ID.
    const peerjsId = this.isHost
      ? `${PEER_PREFIX}${this.roomCode}`
      : `${PEER_PREFIX}${this.peerId}`;

    this.peer = new Peer(peerjsId, buildPeerOptions() as ConstructorParameters<typeof Peer>[1]);

    this.peer.on('open', () => {
      if (this.destroyed) return;

      if (!this.isHost) {
        // Guest: connect to the host
        const hostId = `${PEER_PREFIX}${this.roomCode}`;
        const conn = this.peer!.connect(hostId, { reliable: true });
        this.setupConnection(conn);
      }

      this.onReady();
    });

    this.peer.on('error', (err) => {
      if (this.destroyed) return;
      console.warn('[Brain Bomb WebRTC] Peer error:', err.type, err.message);

      // If host ID is taken, the room code is already in use
      if (err.type === 'unavailable-id' && this.isHost) {
        console.warn('[Brain Bomb WebRTC] Room code already in use');
      }

      // If peer not found, host doesn't exist yet
      if (err.type === 'peer-unavailable' && !this.isHost) {
        console.warn('[Brain Bomb WebRTC] Host not found for room:', this.roomCode);
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
    conn.on('open', () => {
      if (this.destroyed) return;
      const remotePeerId = conn.peer.replace(PEER_PREFIX, '');
      this.connections.set(remotePeerId, conn);
      this.onPeerConnected(remotePeerId);
    });

    conn.on('data', (data) => {
      if (this.destroyed) return;
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

    conn.on('error', () => {
      const remotePeerId = conn.peer.replace(PEER_PREFIX, '');
      this.connections.delete(remotePeerId);
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
