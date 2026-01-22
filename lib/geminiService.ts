// Gemini AI Service - Centralized utility for Gemini API calls
import { GoogleGenAI } from "@google/genai";

// Get API key from environment
const getApiKey = (): string | null => {
  // Try both env variable names for compatibility
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY ||
    import.meta.env.GEMINI_API_KEY ||
    (typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY : null) ||
    (typeof process !== 'undefined' ? process.env?.API_KEY : null);

  return apiKey || null;
};

// Initialize Gemini client
const getGeminiClient = (): GoogleGenAI | null => {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn('Gemini API key not found. AI features will be disabled.');
    return null;
  }

  try {
    return new GoogleGenAI({ apiKey });
  } catch (error) {
    console.error('Failed to initialize Gemini client:', error);
    return null;
  }
};

// Check if Gemini is available
export const isGeminiAvailable = (): boolean => {
  return getApiKey() !== null;
};

// Generate content with Gemini
export interface GeminiGenerateOptions {
  prompt: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export const generateWithGemini = async (
  options: GeminiGenerateOptions
): Promise<string | null> => {
  const { prompt, model = 'gemini-2.5-flash', maxTokens, temperature } = options;

  try {
    const client = getGeminiClient();
    if (!client) {
      throw new Error('Gemini API key not configured. Please set VITE_GEMINI_API_KEY in your environment variables.');
    }

    const response = await client.models.generateContent({
      model,
      contents: prompt,
      config: {
        ...(maxTokens && { maxOutputTokens: maxTokens }),
        ...(temperature !== undefined && { temperature }),
      },
    });

    return response.text || null;
  } catch (error) {
    console.error('Gemini API error:', error);
    // Re-throw with more context
    if (error instanceof Error) {
      throw new Error(`Gemini API error: ${error.message}`);
    }
    throw error;
  }
};

// Generate blog post content
export interface BlogPostGenerationOptions {
  topic: string;
  category?: string;
  tone?: 'professional' | 'casual' | 'friendly';
  length?: 'short' | 'medium' | 'long';
}

export const generateBlogPost = async (
  options: BlogPostGenerationOptions
): Promise<{
  title: string;
  excerpt: string;
  content: string;
} | null> => {
  const { topic, category, tone = 'professional', length = 'medium' } = options;

  const lengthWords = {
    short: 300,
    medium: 600,
    long: 1000,
  };

  const prompt = `Bạn là một chuyên gia viết blog về làm đẹp và spa. Hãy tạo một bài viết blog hoàn chỉnh về chủ đề "${topic}"${category ? ` trong danh mục ${category}` : ''}.

Yêu cầu:
- Giọng văn: ${tone === 'professional' ? 'chuyên nghiệp' : tone === 'casual' ? 'thân thiện, gần gũi' : 'thân thiện'}
- Độ dài: khoảng ${lengthWords[length]} từ
- Format: JSON với các trường: title, excerpt, content
- Title: Hấp dẫn, SEO-friendly, tiếng Việt
- Excerpt: Tóm tắt ngắn gọn 1-2 câu
- Content: Nội dung đầy đủ, có thể dùng HTML tags như <p>, <h2>, <ul>, <li>

Trả về JSON format:
{
  "title": "...",
  "excerpt": "...",
  "content": "..."
}`;

  try {
    const response = await generateWithGemini({ prompt });
    if (!response) return null;

    // Try to parse JSON response
    try {
      // Remove markdown code blocks if present
      const cleanedResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleanedResponse);

      return {
        title: parsed.title || '',
        excerpt: parsed.excerpt || '',
        content: parsed.content || '',
      };
    } catch (parseError) {
      // If JSON parsing fails, try to extract from text
      console.warn('Failed to parse JSON, trying to extract from text:', parseError);

      // Fallback: extract title, excerpt, and content from text
      const lines = response.split('\n').filter(line => line.trim());
      const title = lines.find(line => line.includes('title') || line.match(/^[A-ZÀ-Ỹ]/))?.replace(/title[:-]?\s*/i, '').trim() || topic;
      const excerpt = lines.find(line => line.includes('excerpt') || line.length < 150)?.replace(/excerpt[:-]?\s*/i, '').trim() || '';
      const content = response;

      return {
        title,
        excerpt,
        content,
      };
    }
  } catch (error) {
    console.error('Error generating blog post:', error);
    throw error;
  }
};

// Generate chatbot response
export const generateChatbotResponse = async (
  userMessage: string,
  conversationHistory: Array<{ role: 'user' | 'bot'; text: string }> = []
): Promise<string | null> => {
  const systemPrompt = `Bạn là trợ lý AI thông minh cho một trang web thư mục làm đẹp (beauty directory) tại Việt Nam. 
Nhiệm vụ của bạn là giúp người dùng tìm kiếm các dịch vụ làm đẹp như spa, salon, nail, clinic, v.v.

Hướng dẫn:
1. Trả lời bằng tiếng Việt, thân thiện và chuyên nghiệp
2. Hỏi rõ về loại dịch vụ (spa, nail, salon, clinic) và địa điểm (thành phố, quận)
3. Nếu người dùng đã cung cấp đủ thông tin, hướng dẫn họ tìm kiếm
4. Giữ câu trả lời ngắn gọn, không quá 2-3 câu
5. Nếu không hiểu, hỏi lại một cách lịch sự

Lịch sử hội thoại:
${conversationHistory.slice(-5).map(msg => `${msg.role === 'user' ? 'Người dùng' : 'Bot'}: ${msg.text}`).join('\n')}

Người dùng: ${userMessage}
Bot:`;

  try {
    const response = await generateWithGemini({
      prompt: systemPrompt,
      temperature: 0.7,
      maxTokens: 200,
    });

    return response;
  } catch (error) {
    console.error('Error generating chatbot response:', error);
    return null;
  }
};

// Generate search suggestions
export const generateSearchSuggestions = async (
  query: string
): Promise<string[] | null> => {
  const prompt = `Người dùng đang tìm kiếm trên một trang web thư mục làm đẹp. Họ đã nhập: "${query}"

Hãy đề xuất 3-5 từ khóa tìm kiếm liên quan, ngắn gọn, bằng tiếng Việt, liên quan đến dịch vụ làm đẹp (spa, salon, nail, clinic, massage, v.v.).

Format: Mỗi đề xuất trên một dòng, không đánh số.`;

  try {
    const response = await generateWithGemini({
      prompt,
      temperature: 0.5,
      maxTokens: 100,
    });

    if (!response) return null;

    const suggestions = response
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && !line.match(/^\d+[.)]/))
      .slice(0, 5);

    return suggestions.length > 0 ? suggestions : null;
  } catch (error) {
    console.error('Error generating search suggestions:', error);
    return null;
  }
};
