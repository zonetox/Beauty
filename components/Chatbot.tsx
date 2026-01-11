import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CATEGORIES, LOCATIONS_HIERARCHY, CITIES } from '../constants.ts';
import { BusinessCategory } from '../types.ts';

interface Message {
    id: number;
    text: string;
    sender: 'user' | 'bot';
}

const Chatbot: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const navigate = useNavigate();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const timeoutRefs = useRef<NodeJS.Timeout[]>([]); // Track all timeouts for cleanup

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);
    
    useEffect(() => {
        if (isOpen) {
            setMessages([{
                id: 1,
                text: "Xin chào! Tôi có thể giúp bạn tìm kiếm địa điểm làm đẹp. Bạn muốn tìm gì hôm nay? (Ví dụ: 'spa ở Hà Nội', 'nail Quận 1', 'nhuộm tóc')",
                sender: 'bot'
            }]);
        }
        
        // Cleanup: Clear all timeouts when component unmounts or chat closes
        return () => {
            timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
            timeoutRefs.current = [];
        };
    }, [isOpen]);

    const processUserMessage = (text: string) => {
        const lowerText = text.toLowerCase();
        const params = new URLSearchParams();
        
        // 1. Find Category
        for (const category of Object.values(BusinessCategory)) {
            if (lowerText.includes(category.toLowerCase().split(' ')[0])) {
                params.set('category', category);
                break;
            }
        }
        if (lowerText.includes('spa')) params.set('category', BusinessCategory.SPA);
        if (lowerText.includes('nail')) params.set('category', BusinessCategory.NAIL);
        if (lowerText.includes('tóc') || lowerText.includes('salon')) params.set('category', BusinessCategory.SALON);

        // 2. Find Location (City and District)
        for (const city of CITIES) {
            if (lowerText.includes(city.toLowerCase())) {
                params.set('location', city);
                const districts = LOCATIONS_HIERARCHY[city as keyof typeof LOCATIONS_HIERARCHY] || [];
                for (const district of districts) {
                    if (lowerText.includes(district.toLowerCase())) {
                        params.set('district', district);
                        break;
                    }
                }
                break; 
            }
        }
        
        // 3. Use the rest as keyword
        const keywords = lowerText
            .replace(/spa|nail|tóc|salon/g, '')
            .replace(/ở|tại|khu vực/g, '')
            .replace(/hà nội|tp. hồ chí minh|đà nẵng|hải phòng|cần thơ/g, '')
            .replace(/quận \d+/g, '')
            .trim();
        
        if (keywords) {
            params.set('keyword', keywords);
        }

        const timeout1 = setTimeout(() => {
            if (params.toString()) {
                const searchUrl = `/directory?${params.toString()}`;
                addBotMessage(`Tuyệt vời! Dựa trên yêu cầu của bạn, tôi sẽ tìm kiếm ngay bây giờ...`);
                const timeout2 = setTimeout(() => {
                    // Check if component is still mounted before navigating
                    if (messagesEndRef.current) {
                        navigate(searchUrl);
                        setIsOpen(false);
                    }
                }, 1000);
                timeoutRefs.current.push(timeout2);
            } else {
                addBotMessage("Tôi chưa hiểu rõ yêu cầu. Bạn có thể thử tìm theo tên dịch vụ (ví dụ: 'massage'), và địa điểm (ví dụ: 'Quận 1') không?");
            }
        }, 800);
        timeoutRefs.current.push(timeout1);
    };

    const addBotMessage = (text: string) => {
        setMessages(prev => [...prev, { id: Date.now(), text, sender: 'bot' }]);
    };

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim()) return;

        const userMessage: Message = {
            id: Date.now(),
            text: inputValue,
            sender: 'user'
        };
        setMessages(prev => [...prev, userMessage]);
        setInputValue('');

        addBotMessage("Để tôi xem nào...");
        processUserMessage(inputValue);
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-primary text-white rounded-full shadow-lg flex items-center justify-center hover:bg-primary-dark transition-transform transform hover:scale-110"
                aria-label="Open search assistant"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                    <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h1a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
                </svg>
            </button>

            {isOpen && (
                <div className="fixed bottom-24 right-6 z-50 w-[calc(100vw-3rem)] max-w-sm h-[60vh] bg-white rounded-lg shadow-xl flex flex-col">
                    <header className="bg-primary text-white p-4 rounded-t-lg">
                        <h3 className="font-bold text-lg">Trợ lý tìm kiếm</h3>
                    </header>
                    <main className="flex-1 p-4 overflow-y-auto bg-gray-50">
                        <div className="space-y-4">
                            {messages.map(msg => (
                                <div key={msg.id} className={`flex items-end gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] p-3 rounded-lg ${msg.sender === 'user' ? 'bg-primary text-white' : 'bg-gray-200 text-neutral-dark'}`}>
                                        <p className="text-sm">{msg.text}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                         <div ref={messagesEndRef} />
                    </main>
                    <footer className="p-2 border-t">
                        <form onSubmit={handleSendMessage} className="flex gap-2">
                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder="Nhập yêu cầu của bạn..."
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                                autoFocus
                            />
                            <button type="submit" className="px-4 py-2 bg-primary text-white rounded-md font-semibold hover:bg-primary-dark">Gửi</button>
                        </form>
                    </footer>
                </div>
            )}
        </>
    );
};

export default Chatbot;