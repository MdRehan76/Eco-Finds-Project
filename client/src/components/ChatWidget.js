import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, 
  X, 
  Send, 
  Bot,
  Minimize2
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [sending, setSending] = useState(false);
  const { isAuthenticated } = useAuth();

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || sending) return;

    const userMessage = message.trim();
    setMessage('');
    setSending(true);

    // Add user message to chat
    setChatHistory(prev => [...prev, {
      id: Date.now(),
      type: 'user',
      message: userMessage,
      timestamp: new Date().toISOString()
    }]);

    try {
      const response = await axios.post('/api/messages/chatbot', {
        message: userMessage
      });

      // Add bot response to chat
      setChatHistory(prev => [...prev, {
        id: Date.now() + 1,
        type: 'bot',
        message: response.data.response,
        timestamp: response.data.timestamp
      }]);
    } catch (error) {
      console.error('Failed to send message to chatbot:', error);
      setChatHistory(prev => [...prev, {
        id: Date.now() + 1,
        type: 'bot',
        message: 'Sorry, I encountered an error. Please try again later.',
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setSending(false);
    }
  };

  const clearChat = () => {
    setChatHistory([]);
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // 🔒 Restrict chat to authenticated users only
  if (!isAuthenticated) {
    return null; 
  }

  return (
    <>
      {/* Chat Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 w-14 h-14 bg-primary-600 hover:bg-primary-700 text-white rounded-full shadow-lg flex items-center justify-center z-50 transition-colors duration-200"
          >
            <MessageCircle className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Widget */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className={`fixed bottom-6 right-6 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 ${
              isMinimized ? 'h-12' : 'h-96'
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                  <Bot className="w-4 h-4 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                    EcoFinds Support
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Customer Service Bot
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <Minimize2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 h-64">
                  {chatHistory.length === 0 ? (
                    <div className="text-center py-8">
                      <Bot className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        Hi! I'm here to help with EcoFinds questions.
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        Ask me about selling, buying, shipping, or our eco-friendly mission!
                      </p>
                    </div>
                  ) : (
                    chatHistory.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                            msg.type === 'user'
                              ? 'bg-primary-600 text-white'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                          }`}
                        >
                          <p>{msg.message}</p>
                          <p className={`text-xs mt-1 ${
                            msg.type === 'user' ? 'text-primary-100' : 'text-gray-500 dark:text-gray-400'
                          }`}>
                            {formatTime(msg.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                  {sending && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded-lg text-sm">
                        <div className="flex items-center space-x-1">
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-600"></div>
                          <span>Typing...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                  <form onSubmit={handleSendMessage} className="flex space-x-2">
                    <input
                      type="text"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Ask me anything about EcoFinds..."
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      disabled={sending}
                    />
                    <button
                      type="submit"
                      disabled={sending || !message.trim()}
                      className="p-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                  
                  {chatHistory.length > 0 && (
                    <button
                      onClick={clearChat}
                      className="mt-2 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                    >
                      Clear chat
                    </button>
                  )}
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatWidget;
