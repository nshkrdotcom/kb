// src/store/slices/conversationSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';
import apiClient from '../../services/api-client';
import { 
  ConversationState, 
  Conversation, 
  Message, 
  QueryRequest, 
  QueryResponse 
} from '../../types/conversation';

const initialState: ConversationState = {
  conversations: {},
  activeConversationId: null,
  isLoading: false,
  isStreaming: false,
  error: null,
};

// Async thunks
export const sendMessage = createAsyncThunk(
  'conversation/sendMessage',
  async ({ message, conversationId, contextId }: { 
    message: string, 
    conversationId: string, 
    contextId: string 
  }, { rejectWithValue, getState }) => {
    try {
      // Create request payload
      const request: QueryRequest = {
        query: message,
        contextId,
        options: {
          includeMetadata: true,
        },
      };

      // Send the query to the API
      const response = await apiClient.post<QueryResponse>('/queries', request);
      
      return {
        conversationId,
        userMessage: {
          id: uuidv4(),
          role: 'user',
          content: message,
          timestamp: new Date().toISOString(),
          status: 'sent',
        } as Message,
        aiMessage: {
          id: uuidv4(),
          role: 'assistant',
          content: response.response,
          timestamp: new Date().toISOString(),
          status: 'sent',
          metadata: response.metadata,
        } as Message,
      };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const sendStreamingMessage = createAsyncThunk(
  'conversation/sendStreamingMessage',
  async ({ message, conversationId, contextId, onChunk }: { 
    message: string, 
    conversationId: string, 
    contextId: string,
    onChunk: (chunk: string) => void 
  }, { rejectWithValue, dispatch }) => {
    try {
      // Create user message immediately
      const userMessage: Message = {
        id: uuidv4(),
        role: 'user',
        content: message,
        timestamp: new Date().toISOString(),
        status: 'sent',
      };

      // Create placeholder for AI response
      const aiMessageId = uuidv4();
      const aiMessage: Message = {
        id: aiMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString(),
        status: 'sending',
      };

      // Add both messages to the state
      dispatch(addMessage({ conversationId, message: userMessage }));
      dispatch(addMessage({ conversationId, message: aiMessage }));

      // Create request payload
      const request: QueryRequest = {
        query: message,
        contextId,
        options: {
          includeMetadata: true,
          stream: true,
        },
      };

      let fullContent = '';

      // Start streaming request
      await apiClient.streamRequest<any>(
        '/queries', 
        request, 
        (eventData) => {
          if (eventData.type === 'chunk') {
            fullContent += eventData.content;
            onChunk(eventData.content);
            dispatch(updateMessageContent({ 
              conversationId, 
              messageId: aiMessageId, 
              content: fullContent 
            }));
          } else if (eventData.type === 'end') {
            // Complete the message
            dispatch(updateMessageStatus({ 
              conversationId, 
              messageId: aiMessageId, 
              status: 'sent' 
            }));
          }
        }
      );

      return { conversationId, success: true };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const createConversation = createAsyncThunk(
  'conversation/createConversation',
  async ({ title, contextId }: { title: string, contextId: string }, { rejectWithValue }) => {
    try {
      // In a real app, you might create this via API
      const conversation: Conversation = {
        id: uuidv4(),
        title,
        messages: [],
        contextId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      return conversation;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const loadConversations = createAsyncThunk(
  'conversation/loadConversations',
  async (_, { rejectWithValue }) => {
    try {
      // In a real app, this would fetch from API
      // For now, we'll just return empty
      return [];
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Slice
const conversationSlice = createSlice({
  name: 'conversation',
  initialState,
  reducers: {
    setActiveConversation: (state, action: PayloadAction<string>) => {
      state.activeConversationId = action.payload;
    },
    addMessage: (state, action: PayloadAction<{ conversationId: string, message: Message }>) => {
      const { conversationId, message } = action.payload;
      
      if (state.conversations[conversationId]) {
        state.conversations[conversationId].messages.push(message);
        state.conversations[conversationId].updatedAt = new Date().toISOString();
      }
    },
    updateMessageContent: (state, action: PayloadAction<{ 
      conversationId: string, 
      messageId: string, 
      content: string 
    }>) => {
      const { conversationId, messageId, content } = action.payload;
      const conversation = state.conversations[conversationId];
      
      if (conversation) {
        const messageIndex = conversation.messages.findIndex(m => m.id === messageId);
        if (messageIndex !== -1) {
          conversation.messages[messageIndex].content = content;
        }
      }
    },
    updateMessageStatus: (state, action: PayloadAction<{ 
      conversationId: string, 
      messageId: string, 
      status: 'sending' | 'sent' | 'error' 
    }>) => {
      const { conversationId, messageId, status } = action.payload;
      const conversation = state.conversations[conversationId];
      
      if (conversation) {
        const messageIndex = conversation.messages.findIndex(m => m.id === messageId);
        if (messageIndex !== -1) {
          conversation.messages[messageIndex].status = status;
        }
      }
    },
    clearConversations: (state) => {
      state.conversations = {};
      state.activeConversationId = null;
    },
  },
  extraReducers: (builder) => {
    // Create conversation
    builder.addCase(createConversation.fulfilled, (state, action: PayloadAction<Conversation>) => {
      state.conversations[action.payload.id] = action.payload;
      state.activeConversationId = action.payload.id;
    });

    // Send message
    builder.addCase(sendMessage.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(sendMessage.fulfilled, (state, action) => {
      state.isLoading = false;
      const { conversationId, userMessage, aiMessage } = action.payload;
      
      if (state.conversations[conversationId]) {
        state.conversations[conversationId].messages.push(userMessage);
        state.conversations[conversationId].messages.push(aiMessage);
        state.conversations[conversationId].updatedAt = new Date().toISOString();
      }
    });
    builder.addCase(sendMessage.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Send streaming message
    builder.addCase(sendStreamingMessage.pending, (state) => {
      state.isStreaming = true;
      state.error = null;
    });
    builder.addCase(sendStreamingMessage.fulfilled, (state) => {
      state.isStreaming = false;
    });
    builder.addCase(sendStreamingMessage.rejected, (state, action) => {
      state.isStreaming = false;
      state.error = action.payload as string;
    });

    // Load conversations
    builder.addCase(loadConversations.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(loadConversations.fulfilled, (state, action: PayloadAction<Conversation[]>) => {
      state.isLoading = false;
      
      // Convert array to record
      const conversationsRecord: Record<string, Conversation> = {};
      action.payload.forEach(conversation => {
        conversationsRecord[conversation.id] = conversation;
      });
      
      state.conversations = conversationsRecord;
      
      // Set active conversation to the most recent one if none is selected
      if (!state.activeConversationId && action.payload.length > 0) {
        // Sort by updatedAt and get most recent
        const sortedConversations = [...action.payload].sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
        state.activeConversationId = sortedConversations[0].id;
      }
    });
    builder.addCase(loadConversations.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });
  },
});

export const { 
  setActiveConversation, 
  addMessage, 
  updateMessageContent,
  updateMessageStatus,
  clearConversations 
} = conversationSlice.actions;
export default conversationSlice.reducer;