"use client";

import { useState } from 'react';
import { useChat } from '../../hooks/useChat';
import { MessageList } from '../../component/chat/MessageList';
import { ChatInput } from '../../component/chat/ChatInput';

interface ChatInterfaceProps {
  siteUrl?: string;
  siteName?: string;
}

export const ChatInterface = ({ siteUrl, siteName }: ChatInterfaceProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { messages, isTyping, error, sendMessage, clearChat } = useChat(siteUrl);

  const handleSendMessage = async (content: string) => {
    await sendMessage(content);
  };

  return (
    <div className="chat-interface">
      {/* Chat Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="chat-toggle-button"
      >
        {isOpen ? '✕' : '💬'}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="chat-window">
          <div className="chat-header">
            <h3>AI Assistant {siteName && `- ${siteName}`}</h3>
            <div className="chat-actions">
              <button onClick={clearChat} className="clear-button">
                Clear
              </button>
              <button onClick={() => setIsOpen(false)} className="close-button">
                ✕
              </button>
            </div>
          </div>

          <MessageList messages={messages} isTyping={isTyping} />

          {error && (
            <div className="chat-error">
              {error}
            </div>
          )}

          <ChatInput onSendMessage={handleSendMessage} disabled={isTyping} />
        </div>
      )}
    </div>
  );
};