import { AIResponse } from '../types/chat';

export class ChatService {
  private static readonly API_BASE_URL = 'http://localhost:3001/api';

  static async sendMessage(question: string, siteUrl?: string): Promise<AIResponse> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
          siteUrl, // Optional: if you want context-specific answers
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw new Error('Failed to get AI response. Please try again.');
    }
  }

  static async generateCustomAnswer(question: string, context: string): Promise<AIResponse> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
          context,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error generating answer:', error);
      throw new Error('Failed to generate custom answer.');
    }
  }
}