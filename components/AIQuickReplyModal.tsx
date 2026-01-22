import React, { useState, useEffect } from 'react';
import { Appointment } from '../types.ts';
import { generateWithGemini, isGeminiAvailable } from '../lib/geminiService.ts';

interface AIQuickReplyModalProps {
    isOpen: boolean;
    onClose: () => void;
    appointment: Appointment;
    context: 'confirm' | 'cancel' | 'suggest_reschedule';
}

const AIQuickReplyModal: React.FC<AIQuickReplyModalProps> = ({ isOpen, onClose, appointment, context }) => {
    const [replies, setReplies] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

    const contextToActionMap = {
        'confirm': 'Confirming the appointment and expressing excitement to welcome the customer.',
        'cancel': 'Informing the customer that their requested appointment has been cancelled.',
        'suggest_reschedule': 'Informing the customer their requested time is unavailable and suggesting an alternative time.',
    };

    const generateReplies = React.useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            if (!isGeminiAvailable()) {
                throw new Error("Gemini API key chưa được cấu hình. Vui lòng set VITE_GEMINI_API_KEY");
            }

            const prompt = `Bạn là trợ lý hữu ích cho chủ salon làm đẹp tại Việt Nam. Tạo 3 tin nhắn phản hồi chuyên nghiệp và thân thiện bằng tiếng Việt cho tình huống sau:
            - Tên khách hàng: ${appointment.customerName}
            - Dịch vụ: ${appointment.serviceName}
            - Ngày: ${new Date(appointment.date).toLocaleDateString('vi-VN')}
            - Giờ: ${appointment.timeSlot}
            - Hành động mong muốn từ chủ salon: ${contextToActionMap[context]}
            
            Giữ các phản hồi ngắn gọn, lịch sự và sẵn sàng gửi. Format: Danh sách đánh số. Ví dụ:
            1. [Phản hồi đầu tiên]
            2. [Phản hồi thứ hai]
            3. [Phản hồi thứ ba]`;

            const response = await generateWithGemini({ prompt });

            if (!response) {
                throw new Error('Không nhận được phản hồi từ AI');
            }

            const generatedReplies = response
                .split('\n')
                .filter(line => line.match(/^\d+[.)]/))
                .map(line => line.replace(/^\d+[.)]\s*/, '').trim())
                .filter(line => line.length > 0);

            setReplies(generatedReplies);

        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'Không thể tạo phản hồi. Vui lòng thử lại.';
            setError(errorMessage);
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [appointment, context]); // Removed dependency on 'contextToActionMap' if it's constant, else move it inside or memoize it.

    useEffect(() => {
        if (isOpen) {
            generateReplies();
        } else {
            // Reset state when closed
            setReplies([]);
            setLoading(false);
            setError('');
            setCopiedIndex(null);
        }
    }, [isOpen, generateReplies]);

    const handleCopy = (text: string, index: number) => {
        navigator.clipboard.writeText(text);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b flex justify-between items-center">
                    <h3 className="text-lg font-bold font-serif text-neutral-dark">AI Quick Reply Suggestions</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl font-bold">&times;</button>
                </div>
                <div className="p-6 min-h-[200px]">
                    {loading && <div className="flex items-center justify-center h-full"><p>Generating suggestions...</p></div>}
                    {error && <p className="text-red-500">{error}</p>}
                    {!loading && !error && (
                        <div className="space-y-3">
                            {replies.map((reply, index) => (
                                <div key={index} className="p-3 bg-gray-50 rounded-md border flex justify-between items-start gap-2">
                                    <p className="text-sm text-gray-700">{reply}</p>
                                    <button onClick={() => handleCopy(reply, index)} className="text-xs font-semibold bg-primary text-white px-2 py-1 rounded hover:bg-primary-dark flex-shrink-0">
                                        {copiedIndex === index ? 'Copied!' : 'Copy'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
export default AIQuickReplyModal;