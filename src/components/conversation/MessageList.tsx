// src/components/conversation/MessageList.tsx
import React, { useRef, useEffect } from 'react';
import { Message } from '../../types/conversation';
import StreamingMessage from './StreamingMessage';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { nord as codeTheme } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface MessageListProps {
  messages: Message[];
  isTyping: boolean;
}

const MessageList: React.FC<MessageListProps> = ({ messages, isTyping }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // If there are no messages, show a welcome message
  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-8">
        <div className="text-center max-w-md">
          <h3 className="text-lg font-medium text-gray-900">Welcome to ContextNexus</h3>
          <p className="mt-2 text-sm text-gray-500">
            I'm ready to help you with your questions and tasks.
            Start by sending a message below.
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <div 
          key={message.id}
          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div 
            className={`max-w-3xl rounded-lg px-4 py-2 ${
              message.role === 'user' 
                ? 'bg-primary-100 text-primary-800'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {message.status === 'sending' ? (
              <StreamingMessage content={message.content} />
            ) : (
              <ReactMarkdown
                components={{
                  // Render code blocks with syntax highlighting
                  code({ node, inline, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '');
                    return !inline && match ? (
                      <SyntaxHighlighter
                        language={match[1]}
                        style={codeTheme}
                        PreTag="div"
                        {...props}
                      >
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    ) : (
                      <code className={`${className} px-1 py-0.5 rounded bg-gray-200`} {...props}>
                        {children}
                      </code>
                    );
                  },
                  // Customize other elements
                  p: ({ node, ...props }) => <p className="mb-2" {...props} />,
                  ul: ({ node, ...props }) => <ul className="list-disc pl-6 mb-2" {...props} />,
                  ol: ({ node, ...props }) => <ol className="list-decimal pl-6 mb-2" {...props} />,
                  li: ({ node, ...props }) => <li className="mb-1" {...props} />,
                  h1: ({ node, ...props }) => <h1 className="text-xl font-bold mb-2" {...props} />,
                  h2: ({ node, ...props }) => <h2 className="text-lg font-bold mb-2" {...props} />,
                  h3: ({ node, ...props }) => <h3 className="text-md font-bold mb-2" {...props} />,
                  a: ({ node, ...props }) => <a className="text-primary-600 hover:underline" {...props} />,
                }}
              >
                {message.content}
              </ReactMarkdown>
            )}
            
            {/* Message metadata */}
            <div className="mt-1 text-xs text-gray-500 flex justify-end">
              {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              {message.status === 'error' && (
                <span className="ml-2 text-red-500">Error</span>
              )}
            </div>
          </div>
        </div>
      ))}
      
      {/* AI typing indicator */}
      {isTyping && (
        <div className="flex justify-start">
          <div className="bg-gray-100 text-gray-800 rounded-lg px-4 py-2">
            <div className="flex space-x-1">
              <div className="animate-bounce h-2 w-2 bg-gray-500 rounded-full"></div>
              <div className="animate-bounce h-2 w-2 bg-gray-500 rounded-full delay-100"></div>
              <div className="animate-bounce h-2 w-2 bg-gray-500 rounded-full delay-200"></div>
            </div>
          </div>
        </div>
      )}
      
      {/* Invisible element for scrolling to bottom */}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;