// src/components/conversation/ChatInterface.tsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { 
  createConversation, 
  sendStreamingMessage, 
  setActiveConversation 
} from '../../store/slices/conversationSlice';
import MessageList from './MessageList';
import MessageInput from './MessageInput';

interface ChatInterfaceProps {
  contextId: string;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ contextId }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { 
    conversations, 
    activeConversationId, 
    isLoading, 
    isStreaming 
  } = useSelector((state: RootState) => state.conversation);
  
  const [error, setError] = useState<string | null>(null);
  
  // Create a new conversation when component mounts if no active conversation
  useEffect(() => {
    if (!activeConversationId && contextId) {
      dispatch(createConversation({
        title: 'New Conversation',
        contextId
      }));
    }
  }, [activeConversationId, contextId, dispatch]);
  
  const handleSendMessage = async (message: string) => {
    if (!activeConversationId) {
      setError('No active conversation');
      return;
    }
    
    setError(null);
    
    try {
      await dispatch(sendStreamingMessage({
        message,
        conversationId: activeConversationId,
        contextId,
        onChunk: () => { /* handled by the slice */ }
      })).unwrap();
    } catch (err: any) {
      setError(err.toString());
    }
  };
  
  // Get the active conversation
  const activeConversation = activeConversationId 
    ? conversations[activeConversationId] 
    : null;
  
  return (
    <div className="flex flex-col h-full bg-white shadow-sm rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">
          {activeConversation?.title || 'New Conversation'}
        </h3>
        <div className="flex items-center space-x-2">
          {isLoading && (
            <svg className="animate-spin h-5 w-5 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
          {/* Menu or additional controls can go here */}
        </div>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 m-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Message List */}
      <div className="flex-1 overflow-y-auto px-4 py-2">
        {activeConversation ? (
          <MessageList 
            messages={activeConversation.messages} 
            isTyping={isStreaming}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Loading conversation...</p>
          </div>
        )}
      </div>
      
      {/* Message Input */}
      <div className="border-t border-gray-200 px-4 py-3">
        <MessageInput 
          onSendMessage={handleSendMessage} 
          isDisabled={isLoading || isStreaming || !activeConversationId}
        />
      </div>
    </div>
  );
};

export default ChatInterface;