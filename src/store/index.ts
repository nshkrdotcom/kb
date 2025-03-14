// src/store/index.ts
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import conversationReducer from './slices/conversationSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    conversation: conversationReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;