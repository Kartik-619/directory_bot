import { Message } from '../../types/chat';
import { MessageBubble } from '../chat/MessageBubble';

interface MessageListProps {
  messages: Message[];
  isTyping: boolean;
}

export const MessageList = ({ messages, isTyping }: MessageListProps) => {
  return (
    <div className="message-list">
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
      
      {isTyping && (
        <div className="typing-indicator">
          <div className="typing-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <span>AI is thinking...</span>
        </div>
      )}
    </div>
  );
};