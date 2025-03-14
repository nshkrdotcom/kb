// src/components/conversation/StreamingMessage.tsx
import React, { useEffect, useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { nord as codeTheme } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface StreamingMessageProps {
  content: string;
}

const StreamingMessage: React.FC<StreamingMessageProps> = ({ content }) => {
  const [visibleContent, setVisibleContent] = useState('');
  const contentRef = useRef('');
  const cursorRef = useRef<HTMLSpanElement>(null);
  
  // Update content with typewriter effect
  useEffect(() => {
    contentRef.current = content;
    
    // If the content length has decreased, reset the visible content
    if (content.length < visibleContent.length) {
      setVisibleContent('');
    }
    
    // Only animate if we have new content to show
    if (content.length > visibleContent.length) {
      const interval = setInterval(() => {
        if (visibleContent.length < contentRef.current.length) {
          setVisibleContent(prev => contentRef.current.substring(0, prev.length + 1));
        } else {
          clearInterval(interval);
        }
      }, 10); // Adjust speed here
      
      return () => clearInterval(interval);
    }
  }, [content, visibleContent]);
  
  // Blinking cursor animation
  useEffect(() => {
    if (!cursorRef.current) return;
    
    const blink = () => {
      if (cursorRef.current) {
        cursorRef.current.style.opacity = cursorRef.current.style.opacity === '0' ? '1' : '0';
      }
    };
    
    const interval = setInterval(blink, 500);
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div>
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
        {visibleContent}
      </ReactMarkdown>
      <span ref={cursorRef} className="text-gray-500">▎</span>
    </div>
  );
};

export default StreamingMessage;