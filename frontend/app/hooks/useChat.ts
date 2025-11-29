import { useState, useCallback } from 'react';
import { Message, ChatState } from '../types/chat';
import { ChatService } from '../services/chatService';

export const useChat = (siteUrl?: string) => {
  const [chatState, setChatState] = useState<ChatState>({
    messages: [],
    isTyping: false,
    error: null,
  });

  const addMessage = useCallback((content: string, role: 'user' | 'assistant') => {
    const newMessage: Message = {
      id: Date.now().toString(),
      content,
      role,
      timestamp: new Date(),
    };

    setChatState(prev => ({
      ...prev,
      messages: [...prev.messages, newMessage],
      error: null,
    }));
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    // Add user message immediately
    addMessage(content, 'user');

    // Set typing state
    setChatState(prev => ({ ...prev, isTyping: true, error: null }));

    try {
      // Send to AI service
      const response = await ChatService.sendMessage(content, siteUrl);
      
      // Add AI response
      addMessage(response.answer, 'assistant');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setChatState(prev => ({ ...prev, error: errorMessage }));
    } finally {
      setChatState(prev => ({ ...prev, isTyping: false }));
    }
  }, [addMessage, siteUrl]);

  const clearChat = useCallback(() => {
    setChatState({
      messages: [],
      isTyping: false,
      error: null,
    });
  }, []);

  return {
    messages: chatState.messages,
    isTyping: chatState.isTyping,
    error: chatState.error,
    sendMessage,
    clearChat,
  };
};