import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Appointment } from '../types.ts';

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
    }, [isOpen]);

    const generateReplies = async () => {
        setLoading(true);
        setError('');
        try {
            if (!process.env.API_KEY) {
                throw new Error("API_KEY environment variable not set.");
            }
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = `You are a helpful assistant for a beauty salon owner in Vietnam. Generate 3 professional and friendly reply messages in Vietnamese for the following situation.
            - Customer Name: ${appointment.customerName}
            - Service: ${appointment.serviceName}
            - Date: ${new Date(appointment.date).toLocaleDateString('vi-VN')}
            - Time: ${appointment.timeSlot}
            - Desired action from the owner: ${contextToActionMap[context]}
            
            Keep the replies concise, polite, and ready to be sent. Format the output as a numbered list. For example:
            1. [First reply]
            2. [Second reply]
            3. [Third reply]`;
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });

            const text = response.text ?? '';
            const generatedReplies = text.split('\n').filter(line => line.match(/^\d+\./)).map(line => line.replace(/^\d+\.\s*/, '').trim());
            setReplies(generatedReplies);

        } catch (e) {
            setError('Failed to generate replies. Please try again.');
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

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