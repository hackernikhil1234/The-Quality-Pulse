// client/src/services/socket.js - SIMPLIFIED VERSION
import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
  }

  connect(userId) {
    // Don't require token for basic socket connection
    // The authentication will happen on the server side
    if (!userId) {
      console.log('No userId provided for socket connection');
      return null;
    }

    // If already connected, return existing socket
    if (this.socket && this.isConnected) {
      console.log('Socket already connected');
      return this.socket;
    }

    console.log(`Connecting socket for user ${userId}`);
    
    try {
      // Get token if available, but don't fail if it's not there
      const token = localStorage.getItem('token');
      
      this.socket = io(SOCKET_URL, {
        withCredentials: true,
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 10000,
        query: token ? { token, userId } : { userId }
      });

      this.setupEventListeners();
      
      return this.socket;
    } catch (error) {
      console.error('Failed to create socket connection:', error);
      return null;
    }
  }

  setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ Socket connected:', this.socket.id);
      this.isConnected = true;
    });

    this.socket.on('newNotification', (notification) => {
      console.log('🔔 Socket notification:', notification);
      // Dispatch custom event
      window.dispatchEvent(new CustomEvent('socket-notification', { detail: notification }));
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
      this.isConnected = false;
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  getSocket() {
    return this.socket;
  }

  isConnected() {
    return this.isConnected;
  }
}

const socketService = new SocketService();
export default socketService;