import React, { useState } from 'react';

const AIBlogIdeaGenerator: React.FC = () => {
    const [topic, setTopic] = useState('');
    const [ideas, setIdeas] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isAvailable, setIsAvailable] = useState<boolean | null>(null);

    // Check if Gemini is available on mount
    React.useEffect(() => {
        const checkAvailability = async () => {
            try {
                const geminiModule = await import('../../lib/geminiService.ts');
                setIsAvailable(geminiModule.isGeminiAvailable());
            } catch (e) {
                console.warn('Failed to load Gemini service:', e);
                setIsAvailable(false);
            }
        };
        checkAvailability();
    }, []);

    const generateIdeas = async () => {
        if (!topic) {
            setError('Vui lòng nhập chủ đề.');
            return;
        }
        setLoading(true);
        setError('');
        setIdeas([]);
        try {
            const geminiModule = await import('../../lib/geminiService.ts');

            if (!geminiModule.isGeminiAvailable()) {
                setError("Gemini API key chưa được cấu hình.");
                return;
            }

            const prompt = `Tạo 5 tiêu đề bài viết blog hấp dẫn về chủ đề "${topic}" cho một nền tảng thư mục làm đẹp bằng tiếng Việt. Các tiêu đề nên thân thiện với SEO và thu hút độc giả quan tâm đến spa, salon và mẹo làm đẹp. Format: Danh sách đánh số.`;
            const response = await geminiModule.generateWithGemini({ prompt });

            if (!response) {
                setError('Không nhận được phản hồi từ AI. Vui lòng thử lại.');
                return;
            }

            const generatedIdeas = response
                .split('\n')
                .filter(line => line.match(/^\d+[.)]/))
                .map(line => line.replace(/^\d+[.)]\s*/, '').trim())
                .filter(line => line.length > 0);

            if (generatedIdeas.length === 0) {
                setError('Không thể phân tích phản hồi từ AI. Vui lòng thử lại.');
                return;
            }
            setIdeas(generatedIdeas);
        } catch (e) {
            setError('Lỗi khi kết nối với AI. Vui lòng thử lại sau.');
            console.error('AI generation error:', e);
        } finally {
            setLoading(false);
        }
    };

    if (isAvailable === false) return null;

    return (
        <div className="bg-primary/5 p-4 rounded-lg border border-primary/20 mt-6">
            <h3 className="text-md font-semibold mb-3 text-primary flex items-center gap-2">
                <span className="text-lg">✨</span> Ý tưởng bài viết từ AI
            </h3>
            <div className="flex gap-2">
                <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Nhập chủ đề (VD: chăm sóc da, spa...)"
                    className="flex-grow w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-sm"
                    onKeyPress={(e) => e.key === 'Enter' && !loading && generateIdeas()}
                />
                <button
                    onClick={generateIdeas}
                    disabled={loading || isAvailable === null}
                    className="bg-primary text-white px-4 py-2 rounded-md font-semibold hover:bg-opacity-80 disabled:bg-gray-400 transition-colors text-sm whitespace-nowrap"
                >
                    {loading ? 'Đang tạo...' : 'Tạo ý tưởng'}
                </button>
            </div>
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            {ideas.length > 0 && (
                <ul className="mt-4 space-y-2">
                    {ideas.map((idea, index) => (
                        <li key={index} className="text-sm text-neutral-dark p-2 bg-white rounded border border-gray-100 flex gap-2">
                            <span className="text-primary font-bold">{index + 1}.</span> {idea}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default AIBlogIdeaGenerator;
