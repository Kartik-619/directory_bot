"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface AppInfo {
  url: string;
  name: string;
  type: string;
  description: string;
  targetAudience: string;
  mainFeatures: string[];
}

export default function Dashboard() {
  const router = useRouter();
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedAppInfo = localStorage.getItem('appInfo');
    console.log('Stored app info:', storedAppInfo);
    
    if (!storedAppInfo) {
      router.push('/');
      return;
    }
    
    try {
      setAppInfo(JSON.parse(storedAppInfo));
    } catch (error) {
      console.error('Error parsing app info:', error);
    }
    
    setLoading(false);
  }, [router]);

  // Chat component inside the same file
  const ChatInterface = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Array<{id: string, text: string, isUser: boolean}>>([]);
    const [input, setInput] = useState('');

    const sendMessage = () => {
      if (input.trim()) {
        const newMessage = {
          id: Date.now().toString(),
          text: input,
          isUser: true
        };
        setMessages(prev => [...prev, newMessage]);
        setInput('');
        
        // Generate AI response using the custom analysis
        setTimeout(async () => {
          try {
            // For now, provide a contextual response based on the app info
            let responseText = `Thanks for your question about ${appInfo?.name || 'your app'}! `;
            
            if (appInfo) {
              responseText += `As a ${appInfo.type} application targeting ${appInfo.targetAudience}, `;
              responseText += `I can help you with insights about ${appInfo.mainFeatures.slice(0, 2).join(' and ')}. `;
              responseText += `For detailed AI-powered analysis, please use the "Generate AI Analysis" button above.`;
            } else {
              responseText += `I can provide insights about your application. Please complete the onboarding process for personalized recommendations.`;
            }
            
            const aiResponse = {
              id: (Date.now() + 1).toString(),
              text: responseText,
              isUser: false
            };
            setMessages(prev => [...prev, aiResponse]);
          } catch (error) {
            const errorResponse = {
              id: (Date.now() + 1).toString(),
              text: "I'm sorry, I encountered an error. Please try using the AI Analysis feature for detailed insights.",
              isUser: false
            };
            setMessages(prev => [...prev, errorResponse]);
          }
        }, 1000);
      }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    };

    return (
      <div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors z-50 flex items-center justify-center text-xl"
        >
          {isOpen ? '✕' : '💬'}
        </button>

        {isOpen && (
          <div className="fixed bottom-24 right-6 w-80 h-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 flex flex-col">
            <div className="bg-blue-600 text-white p-4 rounded-t-lg">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold">
                  AI Assistant {appInfo?.name && `- ${appInfo.name}`}
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-white hover:text-gray-200"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="flex-1 p-4 overflow-y-auto">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 mt-8">
                  <p>Ask me anything about your app!</p>
                </div>
              ) : (
                messages.map(message => (
                  <div
                    key={message.id}
                    className={`mb-3 ${message.isUser ? 'text-right' : 'text-left'}`}
                  >
                    <div
                      className={`inline-block px-4 py-2 rounded-lg max-w-[80%] ${
                        message.isUser
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {message.text}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-gray-200">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask a question..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner"></div>
          <p className="text-gray-600 mt-4">Loading your app information...</p>
        </div>
      </div>
    );
  }

  if (!appInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-red-600 text-xl mb-4">No app data found</h1>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Analysis for {appInfo.name}
              </h1>
              <p className="text-gray-600">Personalized insights based on your app</p>
            </div>
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </header>

      {/* App Summary */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Your App Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Type:</span>
              <div className="font-medium capitalize">{appInfo.type}</div>
            </div>
            <div>
              <span className="text-gray-500">URL:</span>
              <div className="font-medium truncate">{appInfo.url}</div>
            </div>
            <div>
              <span className="text-gray-500">Audience:</span>
              <div className="font-medium">{appInfo.targetAudience}</div>
            </div>
            <div>
              <span className="text-gray-500">Features:</span>
              <div className="font-medium">{appInfo.mainFeatures.length} selected</div>
            </div>
          </div>
          
          {appInfo.description && (
            <div className="mt-4 pt-4 border-t">
              <span className="text-gray-500">Description:</span>
              <p className="font-medium mt-1 text-gray-700">{appInfo.description}</p>
            </div>
          )}
        </div>

        {/* Custom Analysis Section */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            AI-Powered Analysis
          </h2>
          <p className="text-gray-600 mb-6">
            Get personalized insights and recommendations for {appInfo.name} based on your app profile.
          </p>
          
          <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🤖</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Custom Analysis for {appInfo.name}
              </h3>
              <p className="text-gray-600 mb-4">
                Generate AI-powered insights tailored to your {appInfo.type} application, 
                target audience ({appInfo.targetAudience}), and specific features.
              </p>
              <div className="text-sm text-gray-500 mb-6">
                <p><strong>Features:</strong> {appInfo.mainFeatures.join(', ')}</p>
              </div>
            </div>
            
            <button 
              onClick={() => {
                const customUrl = appInfo.url || `custom-analysis-${appInfo.name.toLowerCase().replace(/\s+/g, '-')}`;
                router.push(`/site/${encodeURIComponent(customUrl)}`);
              }}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg text-lg hover:bg-blue-700 transition-colors"
            >
              Generate AI Analysis
            </button>
          </div>
        </div>
      </div>

      {/* Chat Interface */}
      <ChatInterface />
    </div>
  );
}