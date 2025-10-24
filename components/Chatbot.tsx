
import React, { useState, useRef, useEffect } from 'react';
import { Product } from '../types';
import { getAIRecommendations } from '../services/geminiService';

interface ChatbotProps {
  allProducts: Product[];
}

interface Message {
  sender: 'user' | 'ai';
  text?: string;
  products?: Product[];
}

const BotIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
    <path fillRule="evenodd" d="M4.5 3.75a3 3 0 0 0-3 3v10.5a3 3 0 0 0 3 3h15a3 3 0 0 0 3-3V6.75a3 3 0 0 0-3-3h-15Zm4.125 3a.75.75 0 0 0 0 1.5h.375a.75.75 0 0 0 0-1.5h-.375ZM11.25 6a.75.75 0 0 1 .75.75v.375a.75.75 0 0 1-1.5 0V6.75a.75.75 0 0 1 .75-.75Zm3.375 0a.75.75 0 0 0 0 1.5h.375a.75.75 0 0 0 0-1.5h-.375Z" clipRule="evenodd" />
    <path d="M14.25 10.5a.75.75 0 0 0-1.5 0v4.5a.75.75 0 0 0 1.5 0v-4.5Z" />
    <path d="M7.5 12.75a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 0 1.5h-3a.75.75 0 0 1-.75-.75Z" />
  </svg>
);
const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
    <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
  </svg>
);
const PaperAirplaneIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
  </svg>
);


const Chatbot: React.FC<ChatbotProps> = ({ allProducts }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { sender: 'ai', text: "Hello! I'm your personal shopping assistant. How can I help you find the perfect product today?" },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = async () => {
    if (inputValue.trim() === '' || isLoading) return;

    const userMessage: Message = { sender: 'user', text: inputValue };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const { recommendedProducts, reasoning } = await getAIRecommendations(inputValue, allProducts);
      const aiResponse: Message = { sender: 'ai', text: reasoning, products: recommendedProducts };
      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      const errorResponse: Message = { sender: 'ai', text: 'Sorry, I encountered an error. Please try again.' };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className={`fixed bottom-0 right-0 m-4 sm:m-6 lg:m-8 transition-transform duration-300 ease-out ${isOpen ? 'translate-y-full opacity-0' : 'translate-y-0 opacity-100'}`}>
        <button onClick={() => setIsOpen(true)} className="bg-indigo-600 text-white rounded-full p-4 shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
          <BotIcon />
        </button>
      </div>
      <div className={`fixed bottom-0 right-0 sm:m-6 lg:m-8 w-full sm:max-w-md h-full sm:h-[70vh] flex flex-col bg-white rounded-t-lg sm:rounded-lg shadow-2xl transition-transform duration-300 ease-out ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}>
        <header className="flex items-center justify-between p-4 bg-indigo-600 text-white rounded-t-lg">
          <h3 className="text-lg font-semibold">AI Assistant</h3>
          <button onClick={() => setIsOpen(false)} className="hover:bg-indigo-700 p-1 rounded-full">
            <CloseIcon />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {messages.map((msg, index) => (
            <div key={index} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
              {msg.sender === 'ai' && <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center flex-shrink-0 text-white"><BotIcon /></div>}
              <div className={`p-3 rounded-lg max-w-xs md:max-w-sm ${msg.sender === 'user' ? 'bg-indigo-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
                <p className="text-sm">{msg.text}</p>
                {msg.products && msg.products.length > 0 && (
                  <div className="mt-2 space-y-2 border-t border-gray-300 pt-2">
                    {msg.products.map(p => (
                      <div key={p.id} className="flex items-center gap-2 text-xs p-1 bg-white rounded">
                        <img src={p.images[0]} alt={p.name} className="w-8 h-8 rounded object-cover"/>
                        <span className="font-medium">{p.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
             <div className="flex items-start gap-3">
               <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center flex-shrink-0 text-white"><BotIcon /></div>
               <div className="p-3 rounded-lg bg-gray-200">
                  <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                  </div>
               </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <div className="p-4 border-t bg-white">
          <div className="relative">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask for recommendations..."
              className="w-full pr-12 pl-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
              disabled={isLoading}
            />
            <button onClick={handleSend} disabled={isLoading} className="absolute right-1 top-1/2 -translate-y-1/2 bg-indigo-600 text-white p-2 rounded-full hover:bg-indigo-700 disabled:bg-indigo-300">
              <PaperAirplaneIcon />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Chatbot;
