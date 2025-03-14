// frontend/src/services/websocket-service.ts
import { getAccessToken } from './auth/token-service';
import { store } from '../store/store';
import {
  wsConnected,
  wsDisconnected,
  wsError,
  wsMessageReceived
} from '../store/slices/websocket-slice';

export class WebSocketService {
  private socket: WebSocket | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 3000; // 3 seconds

  constructor(private url: string) {}

  // Connect to WebSocket server
  public connect(): void {
    if (this.socket) {
      this.disconnect();
    }

    const token = getAccessToken();
    if (!token) {
      console.error('Cannot connect to WebSocket: No auth token');
      return;
    }

    try {
      // Connect with authentication token
      this.socket = new WebSocket(`${this.url}?token=${token}`);
      
      // Set up event handlers
      this.socket.onopen = this.handleOpen.bind(this);
      this.socket.onclose = this.handleClose.bind(this);
      this.socket.onerror = this.handleError.bind(this);
      this.socket.onmessage = this.handleMessage.bind(this);
    } catch (error) {
      console.error('WebSocket connection error:', error);
      this.attemptReconnect();
    }
  }

  // Disconnect from WebSocket server
  public disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.reconnectAttempts = 0;
    store.dispatch(wsDisconnected());
  }

  // Send message to WebSocket server
  public send(type: string, payload: any): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.error('Cannot send message: WebSocket is not connected');
      return;
    }

    const message = JSON.stringify({ type, payload });
    this.socket.send(message);
  }

  // Handle WebSocket open event
  private handleOpen(event: Event): void {
    console.log('WebSocket connected');
    this.reconnectAttempts = 0;
    store.dispatch(wsConnected());
  }

  // Handle WebSocket close event
  private handleClose(event: CloseEvent): void {
    console.log(`WebSocket closed: ${event.code} ${event.reason}`);
    store.dispatch(wsDisconnected());
    
    // Attempt to reconnect if not a clean close
    if (event.code !== 1000) {
      this.attemptReconnect();
    }
  }

  // Handle WebSocket error event
  private handleError(event: Event): void {
    console.error('WebSocket error:', event);
    store.dispatch(wsError('Connection error'));
  }

  // Handle WebSocket message event
  private handleMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data);
      store.dispatch(wsMessageReceived(data));
      
      // Handle specific message types
      this.handleSpecificMessageTypes(data);
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }

  // Handle specific message types with custom logic
  private handleSpecificMessageTypes(data: any): void {
    switch (data.type) {
      case 'CONTEXT_UPDATED':
        // Dispatch context update action
        store.dispatch({
          type: 'contexts/contextUpdated',
          payload: data.payload
        });
        break;
        
      case 'SELECTION_CHANGED':
        // Dispatch selection change action
        store.dispatch({
          type: 'contexts/selectionChanged',
          payload: data.payload
        });
        break;
        
      case 'USER_JOINED':
      case 'USER_LEFT':
        // Handle user presence updates
        store.dispatch({
          type: 'collaboration/presenceChanged',
          payload: data.payload
        });
        break;
        
      // Add more message type handlers as needed
    }
  }

  // Attempt to reconnect with exponential backoff
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnect attempts reached, giving up');
      return;
    }

    const delay = this.reconnectInterval * Math.pow(1.5, this.reconnectAttempts);
    console.log(`Attempting to reconnect in ${delay}ms...`);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect();
    }, delay);
  }
}

// Create and export the WebSocket service instance
export const wsService = new WebSocketService(
  process.env.REACT_APP_WS_URL || 'wss://api.contextnexus.io/ws'
);