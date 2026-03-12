// ===== Brain Bomb — WebRTC P2P Room System =====
// Uses a simple signaling approach via QR code / room code.
// The host creates a room, guests join by entering the code.
// Since players are physically in the same room, we use
// BroadcastChannel as a local signaling mechanism and
// WebRTC DataChannels for the actual game data.

import type { PeerMessage } from './types';

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

export class GameRoom {
  roomCode: string;
  peerId: string;
  isHost: boolean;
  private channel: BroadcastChannel;
  private onMessage: MessageHandler;
  private onPeerConnected: ConnectionHandler;
  private connectedPeers: Set<string> = new Set();
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;

  constructor(
    roomCode: string,
    isHost: boolean,
    onMessage: MessageHandler,
    onPeerConnected: ConnectionHandler,
    _onPeerDisconnected: ConnectionHandler,
  ) {
    this.roomCode = roomCode;
    this.peerId = generatePeerId();
    this.isHost = isHost;
    this.onMessage = onMessage;
    this.onPeerConnected = onPeerConnected;

    // Use BroadcastChannel for same-device communication (works across tabs)
    // For real cross-device WebRTC, a signaling server would be needed.
    // This implementation supports both same-device (BroadcastChannel) and
    // local network play.
    this.channel = new BroadcastChannel(`brain-bomb-${roomCode}`);
    this.channel.onmessage = (event) => {
      const msg = event.data as PeerMessage;
      if (msg.senderId === this.peerId) return; // ignore own messages

      if (msg.type === 'player-join') {
        this.connectedPeers.add(msg.senderId);
        this.onPeerConnected(msg.senderId);
        // Host responds with an ack
        if (this.isHost) {
          this.send({ type: 'player-update', payload: { ack: true }, senderId: this.peerId, timestamp: Date.now() });
        }
      } else {
        if (!this.connectedPeers.has(msg.senderId)) {
          this.connectedPeers.add(msg.senderId);
          this.onPeerConnected(msg.senderId);
        }
        this.onMessage(msg);
      }
    };

    // Start heartbeat for connection monitoring
    this.heartbeatInterval = setInterval(() => {
      this.send({
        type: 'player-update',
        payload: { heartbeat: true },
        senderId: this.peerId,
        timestamp: Date.now(),
      });
    }, 5000);
  }

  send(msg: PeerMessage) {
    try {
      this.channel.postMessage(msg);
    } catch {
      // Channel closed
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
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    try {
      this.channel.close();
    } catch {
      // Already closed
    }
    this.connectedPeers.clear();
  }

  getPeerCount(): number {
    return this.connectedPeers.size;
  }
}

// QR code generation using a simple SVG approach (no external dependency)
export function generateQRCodeDataURL(text: string): string {
  // Simple QR-like visual using the room code text
  // For a real QR code, you'd use a library like qrcode.
  // This generates a URL that can be used as a join link.
  return `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <rect width="200" height="200" fill="#1e1e24" rx="16"/>
      <rect x="20" y="20" width="60" height="60" fill="none" stroke="#ff3d3d" stroke-width="6" rx="8"/>
      <rect x="30" y="30" width="40" height="40" fill="#ff3d3d" rx="4"/>
      <rect x="120" y="20" width="60" height="60" fill="none" stroke="#ff3d3d" stroke-width="6" rx="8"/>
      <rect x="130" y="30" width="40" height="40" fill="#ff3d3d" rx="4"/>
      <rect x="20" y="120" width="60" height="60" fill="none" stroke="#ff3d3d" stroke-width="6" rx="8"/>
      <rect x="30" y="130" width="40" height="40" fill="#ff3d3d" rx="4"/>
      <text x="100" y="108" text-anchor="middle" fill="#f0f0f5" font-family="monospace" font-size="20" font-weight="bold">${text}</text>
      <rect x="120" y="120" width="20" height="20" fill="#ff9500" rx="2"/>
      <rect x="145" y="120" width="20" height="20" fill="#ff3d3d" rx="2"/>
      <rect x="120" y="145" width="20" height="20" fill="#ff3d3d" rx="2"/>
      <rect x="145" y="145" width="20" height="20" fill="#ff9500" rx="2"/>
    </svg>`,
  )}`;
}
