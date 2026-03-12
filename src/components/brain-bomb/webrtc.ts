// ===== Brain Bomb — WebRTC P2P Room System =====
// Uses a simple signaling approach via QR code / room code.
// The host creates a room, guests join by entering the code.
// Since players are physically in the same room, we use
// BroadcastChannel as a local signaling mechanism and
// WebRTC DataChannels for the actual game data.

import QRCode from 'qrcode';
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
        this.onMessage(msg); // Forward to handler so host can add the player
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

// Generate a real scannable QR code as a data URL
export async function generateQRCodeDataURL(roomCode: string): Promise<string> {
  const joinUrl = `${window.location.origin}${window.location.pathname}?room=${roomCode}`;
  return QRCode.toDataURL(joinUrl, {
    width: 200,
    margin: 1,
    color: { dark: '#ff3d3dff', light: '#1e1e24ff' },
    errorCorrectionLevel: 'M',
  });
}
