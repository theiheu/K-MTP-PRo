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

const ChatBubbleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.056 3 12c0 2.228.87 4.25 2.28 5.834a8.96 8.96 0 0 0 1.898 2.05A9.013 9.013 0 0 0 9 21.75c1.112 0 2.18-.24 3.162-.682A8.95 8.95 0 0 0 12 20.25Z" />
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
  const [messages, setMessages] = useState<Message[]>([]);
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
      const errorResponse: Message = { sender: 'ai', text: 'Xin lỗi, tôi đã gặp lỗi. Vui lòng thử lại.' };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className={`fixed bottom-20 right-4 sm:bottom-6 sm:right-6 lg:bottom-8 transition-transform duration-300 ease-out ${isOpen ? 'translate-y-full opacity-0' : 'translate-y-0 opacity-100'} z-50`}>
        <button onClick={() => setIsOpen(true)} className="bg-indigo-600 text-white rounded-full p-4 shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
          <ChatBubbleIcon />
        </button>
      </div>
      <div className={`fixed bottom-[-25] right-0 sm:m-6 lg:m-8 w-full sm:max-w-md h-full sm:h-[70vh] flex flex-col bg-white rounded-t-lg sm:rounded-lg shadow-2xl transition-transform duration-300 ease-out ${isOpen ? 'translate-y-0' : 'translate-y-full'} z-50`}>
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 relative">
            <button 
                onClick={() => setIsOpen(false)} 
                className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400 rounded-full p-1 z-10"
                aria-label="Đóng chat"
            >
                <CloseIcon />
            </button>
           {messages.length === 0 && !isLoading ? (
            <div className="flex flex-col h-full items-center justify-center text-center text-gray-500 p-4">
              <div className="text-indigo-300">
                <ChatBubbleIcon className="w-12 h-12" />
              </div>
              <p className="mt-4 text-sm">Tôi có thể giúp gì cho bạn? <br /> Hãy bắt đầu bằng cách nhập câu hỏi của bạn vào bên dưới.</p>
            </div>
          ) : (
            messages.map((msg, index) => (
              <div key={index} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                {msg.sender === 'ai' && <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center flex-shrink-0 text-white"><ChatBubbleIcon /></div>}
                <div className={`p-3 rounded-lg max-w-xs md:max-w-sm ${msg.sender === 'user' ? 'bg-indigo-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
                  <p className="text-sm">{msg.text}</p>
                  {msg.products && msg.products.length > 0 && (
                    <div className="mt-2 space-y-2 border-t border-gray-300 pt-2">
                      {msg.products.map(p => (
                        <div key={p.id} className="flex items-center gap-2 text-xs p-1 bg-white rounded">
                          <img src={p.images[0]} alt={p.name} className="w-8 h-8 rounded object-cover"/>
                          <div className="flex flex-col">
                              <span className="font-medium">{p.name}</span>
                              <span className="text-gray-600">Tồn kho: {p.stock}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          {isLoading && (
             <div className="flex items-start gap-3">
               <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center flex-shrink-0 text-white"><ChatBubbleIcon /></div>
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
              placeholder="Hỏi tôi để tìm một vật tư..."
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