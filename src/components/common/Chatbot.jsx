import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageCircle, 
  X, 
  Send, 
  Bot, 
  User, 
  Loader2, 
  ThumbsUp, 
  ThumbsDown,
  RotateCcw,
  HelpCircle,
  Calendar,
  MapPin,
  Heart,
  Shield,
  LogIn
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Link, useLocation } from 'react-router-dom';
import apiClient from '../../api/client';
import './Chatbot.css';

const Chatbot = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Check if current route is an admin route
  const isAdminRoute = location.pathname.startsWith('/admin');

  // Quick action buttons
  const quickActions = [
    { text: "Am I eligible to donate?", icon: <Shield className="w-4 h-4" />, intent: "eligibility" },
    { text: "Schedule appointment", icon: <Calendar className="w-4 h-4" />, intent: "appointment" },
    { text: "Find blood bank", icon: <MapPin className="w-4 h-4" />, intent: "location" },
    { text: "Preparation tips", icon: <Heart className="w-4 h-4" />, intent: "preparation" }
  ];

  // Welcome message
  const welcomeMessage = {
    id: 'welcome',
    type: 'bot',
    content: user 
      ? "Hi! I'm your blood donation assistant. I can help you with eligibility questions, appointment scheduling, finding locations, and more. How can I assist you today?"
      : "Hi! I'm your blood donation assistant. I can help you with eligibility questions, appointment scheduling, finding locations, and more. How can I assist you today?\n\n💡 You can use me without logging in, but creating an account will give you personalized responses and save your chat history!",
    timestamp: new Date()
  };

  useEffect(() => {
    if (isOpen) {
      // Load chat history and suggestions when chatbot opens
      loadChatHistory();
      loadSuggestions();
      inputRef.current?.focus();
      
      // Prevent body scroll on mobile
      if (window.innerWidth < 640) {
        document.body.classList.add('chatbot-open');
      }
    } else {
      // Re-enable body scroll
      document.body.classList.remove('chatbot-open');
    }
    
    // Cleanup on unmount
    return () => {
      document.body.classList.remove('chatbot-open');
    };
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChatHistory = async () => {
    // Only load chat history if user is logged in
    if (!user) {
      setMessages([welcomeMessage]);
      return;
    }

    try {
      const response = await apiClient.get('/chatbot/history?limit=10');
      if (response.data.success) {
        const historyMessages = response.data.conversations.map(conv => [
          {
            id: `user-${conv.created_at}`,
            type: 'user',
            content: conv.user_message,
            timestamp: new Date(conv.created_at)
          },
          {
            id: `bot-${conv.created_at}`,
            type: 'bot',
            content: conv.bot_response,
            timestamp: new Date(conv.created_at),
            intent: conv.intent
          }
        ]).flat();
        
        setMessages([welcomeMessage, ...historyMessages]);
      } else {
        setMessages([welcomeMessage]);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
      setMessages([welcomeMessage]);
    }
  };

  const loadSuggestions = async () => {
    try {
      const response = await apiClient.get('/chatbot/suggestions');
      if (response.data.success) {
        setSuggestions(response.data.suggestions);
      }
    } catch (error) {
      console.error('Error loading suggestions:', error);
    }
  };

  const sendMessage = async (message = inputMessage) => {
    if (!message.trim()) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: message.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setShowSuggestions(false);

    try {
      const response = await apiClient.post('/chatbot/chat', {
        message: message.trim()
      });

      if (response.data.success) {
        const botMessage = {
          id: `bot-${Date.now()}`,
          type: 'bot',
          content: response.data.response,
          timestamp: new Date(),
          intent: response.data.intent,
          userInfo: response.data.userInfo
        };

        setMessages(prev => [...prev, botMessage]);
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        id: `error-${Date.now()}`,
        type: 'bot',
        content: "I'm sorry, I encountered an error. Please try again or contact our support team.",
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (action) => {
    sendMessage(action.text);
  };

  const handleSuggestionClick = (suggestion) => {
    sendMessage(suggestion.text);
  };

  const clearChat = () => {
    setMessages([welcomeMessage]);
    setShowSuggestions(true);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const MessageBubble = ({ message }) => (
    <div className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'} items-start gap-2`}>
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          message.type === 'user' 
            ? 'bg-red-600 text-white' 
            : 'bg-gray-200 text-gray-600'
        }`}>
          {message.type === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
        </div>
        <div className={`rounded-2xl px-4 py-2 ${
          message.type === 'user'
            ? 'bg-red-600 text-white'
            : message.isError
            ? 'bg-red-100 text-red-800 border border-red-200'
            : 'bg-white text-gray-800 border border-gray-200'
        } shadow-sm`}>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
          <p className={`text-xs mt-1 ${
            message.type === 'user' ? 'text-red-100' : 'text-gray-500'
          }`}>
            {formatTime(message.timestamp)}
          </p>
          {message.userInfo && message.userInfo.donationCount > 0 && (
            <div className="mt-2 p-2 bg-green-50 rounded-lg border border-green-200">
              <p className="text-xs text-green-700">
                💝 You've donated {message.userInfo.donationCount} times! Thank you for saving lives.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Don't render chatbot on admin routes
  if (isAdminRoute) {
    return null;
  }

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 chatbot-backdrop sm:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      {/* Chatbot Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 chatbot-toggle w-14 h-14 rounded-full shadow-lg transition-all duration-300 ${
          isOpen 
            ? 'bg-red-600 hover:bg-red-700' 
            : 'bg-red-600 hover:bg-red-700 hover:scale-110'
        } flex items-center justify-center text-white`}
        aria-label="Open chatbot"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>

      {/* Chatbot Window */}
      {isOpen && (
        <div className="chatbot-window fixed bottom-6 right-6 top-20 left-6 sm:bottom-24 sm:right-6 sm:top-auto sm:left-auto bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-4 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold">Blood Donation Assistant</h3>
                  <p className="text-xs text-red-100">Always here to help</p>
                </div>
              </div>
              <button
                onClick={clearChat}
                className="p-1 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
                title="Clear chat"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2 chatbot-messages">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            
            {isLoading && (
              <div className="flex justify-start mb-4">
                <div className="flex items-center gap-2 bg-gray-100 rounded-2xl px-4 py-2">
                  <Bot className="w-4 h-4 text-gray-600" />
                  <div className="flex items-center gap-1">
                    <Loader2 className="w-4 h-4 animate-spin text-gray-600" />
                    <span className="text-sm text-gray-600">Thinking...</span>
                  </div>
                </div>
              </div>
            )}

                         {/* Login Prompt for Non-Authenticated Users */}
             {!user && showSuggestions && messages.length <= 1 && (
               <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                 <div className="flex items-center gap-2 mb-2">
                   <LogIn className="w-4 h-4 text-blue-600" />
                   <span className="text-sm font-medium text-blue-800">Get Personalized Experience</span>
                 </div>
                 <p className="text-xs text-blue-700 mb-3">
                   Create an account to get personalized responses, save your chat history, and track your donation journey!
                 </p>
                 <div className="flex gap-2">
                   <Link
                     to="/register"
                     className="flex-1 text-center px-3 py-2 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors"
                   >
                     Sign Up
                   </Link>
                   <Link
                     to="/login"
                     className="flex-1 text-center px-3 py-2 bg-white text-blue-600 text-xs rounded-lg border border-blue-300 hover:bg-blue-50 transition-colors"
                   >
                     Login
                   </Link>
                 </div>
               </div>
             )}

             {/* Quick Actions */}
             {showSuggestions && messages.length <= 1 && (
               <div className="space-y-3">
                 <p className="text-sm text-gray-600 font-medium">Quick actions:</p>
                 <div className="grid grid-cols-2 gap-2">
                   {quickActions.map((action, index) => (
                     <button
                       key={index}
                       onClick={() => handleQuickAction(action)}
                       className="flex items-center gap-2 p-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors text-sm"
                     >
                       {action.icon}
                       <span className="text-gray-700">{action.text}</span>
                     </button>
                   ))}
                 </div>
               </div>
             )}

            {/* Suggestions */}
            {suggestions.length > 0 && showSuggestions && messages.length > 1 && (
              <div className="space-y-2">
                <p className="text-sm text-gray-600 font-medium">You might also ask:</p>
                {suggestions.slice(0, 3).map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="block w-full text-left p-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    {suggestion.text}
                  </button>
                ))}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything about blood donation..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                  disabled={isLoading}
                />
              </div>
              <button
                onClick={() => sendMessage()}
                disabled={!inputMessage.trim() || isLoading}
                className="w-10 h-10 bg-red-600 text-white rounded-full flex items-center justify-center hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Press Enter to send • Shift+Enter for new line
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default Chatbot;
