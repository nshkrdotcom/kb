// frontend/src/store/slices/websocket-slice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface WebSocketState {
  isConnected: boolean;
  error: string | null;
  lastMessage: any | null;
}

const initialState: WebSocketState = {
  isConnected: false,
  error: null,
  lastMessage: null
};

const websocketSlice = createSlice({
  name: 'websocket',
  initialState,
  reducers: {
    wsConnected: (state) => {
      state.isConnected = true;
      state.error = null;
    },
    wsDisconnected: (state) => {
      state.isConnected = false;
    },
    wsError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },
    wsMessageReceived: (state, action: PayloadAction<any>) => {
      state.lastMessage = action.payload;
    }
  }
});

export const {
  wsConnected,
  wsDisconnected,
  wsError,
  wsMessageReceived
} = websocketSlice.actions;

export default websocketSlice.reducer;