import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CATEGORIES, LOCATIONS_HIERARCHY, CITIES } from '../constants.ts';
import { BusinessCategory } from '../types.ts';
import { generateChatbotResponse, isGeminiAvailable } from '../lib/geminiService.ts';

interface Message {
    id: number;
    text: string;
    sender: 'user' | 'bot';
}

const Chatbot: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([{
        id: 1,
        text: "Xin chào! Tôi có thể giúp bạn tìm kiếm địa điểm làm đẹp. Bạn muốn tìm gì hôm nay? (Ví dụ: 'spa ở Hà Nội', 'nail Quận 1', 'nhuộm tóc')",
        sender: 'bot'
    }]);
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
        // Cleanup: Clear all timeouts when component unmounts or chat closes
        if (!isOpen) {
            timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
            timeoutRefs.current = [];
        }
    }, [isOpen]);

    const processUserMessage = async (text: string) => {
        const lowerText = text.toLowerCase();
        const params = new URLSearchParams();
        
        // Try to extract search parameters (category, location, keyword)
        // 1. Find Category
        for (const category of Object.values(BusinessCategory)) {
            if (category && lowerText.includes(category.toLowerCase().split(' ')[0])) {
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

        // Use AI if available, otherwise use rule-based
        if (isGeminiAvailable()) {
            try {
                // Build conversation history
                const history = messages
                    .filter(msg => msg.sender !== 'user' || msg.text !== "Để tôi xem nào...")
                    .map(msg => ({
                        role: msg.sender === 'user' ? 'user' as const : 'bot' as const,
                        text: msg.text,
                    }));

                const aiResponse = await generateChatbotResponse(text, history);
                
                if (aiResponse) {
                    addBotMessage(aiResponse);
                    
                    // If we have search parameters, offer to search
                    if (params.toString()) {
                        const timeout1 = setTimeout(() => {
                            addBotMessage(`Tôi có thể giúp bạn tìm kiếm ngay bây giờ. Bạn có muốn xem kết quả không?`);
                            const timeout2 = setTimeout(() => {
                                if (messagesEndRef.current) {
                                    const searchUrl = `/directory?${params.toString()}`;
                                    navigate(searchUrl);
                                    setIsOpen(false);
                                }
                            }, 2000);
                            timeoutRefs.current.push(timeout2);
                        }, 1000);
                        timeoutRefs.current.push(timeout1);
                    }
                } else {
                    // Fallback to rule-based if AI fails
                    handleRuleBasedResponse(params);
                }
            } catch (error) {
                console.error('AI chatbot error:', error);
                // Fallback to rule-based
                handleRuleBasedResponse(params);
            }
        } else {
            // Use rule-based logic if AI not available
            handleRuleBasedResponse(params);
        }
    };

    const handleRuleBasedResponse = (params: URLSearchParams) => {
        const timeout1 = setTimeout(() => {
            if (params.toString()) {
                const searchUrl = `/directory?${params.toString()}`;
                addBotMessage(`Tuyệt vời! Dựa trên yêu cầu của bạn, tôi sẽ tìm kiếm ngay bây giờ...`);
                const timeout2 = setTimeout(() => {
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

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim()) return;

        const userMessage: Message = {
            id: Date.now(),
            text: inputValue,
            sender: 'user'
        };
        setMessages(prev => [...prev, userMessage]);
        const messageText = inputValue;
        setInputValue('');

        // Show loading message
        addBotMessage("Để tôi xem nào...");
        
        // Process message (async)
        await processUserMessage(messageText);
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
                    <header className="bg-primary text-white p-4 rounded-t-lg flex items-center justify-between">
                        <h3 className="font-bold text-lg">Trợ lý tìm kiếm</h3>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="ml-2 p-1 rounded-full hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
                            aria-label="Đóng chatbot"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
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