import React from 'react';
// Import the variables for diagnostic display
import { supabaseUrlFromEnv, supabaseAnonKeyFromEnv, isSupabaseConfigured } from '../lib/supabaseClient.ts';

const SupabaseConfigErrorPage: React.FC = () => {
  // Corrected instructions for a Vite environment.
  const envFileContent = `VITE_SUPABASE_URL="https://your-project-url.supabase.co"
VITE_SUPABASE_ANON_KEY="your-public-anon-key"`;

  // Create a debug object to display the values read by the application.
  // FIX: An object literal cannot have multiple properties with the same name.
  // The duplicate '---' keys have been replaced with unique keys ('separator1', 'separator2')
  // and the rendering logic is updated to handle them as visual dividers.
  const debugInfo = {
    'VITE_SUPABASE_URL (from import.meta.env)': (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || 'Not Found',
    'VITE_SUPABASE_ANON_KEY (from import.meta.env)': (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) ? `Found, starts with "${import.meta.env.VITE_SUPABASE_ANON_KEY.substring(0, 5)}..."` : 'Not Found',
    'separator1': '---',
    'URL_FALLBACK (from process.env)': (typeof process !== 'undefined' && (process.env?.VITE_SUPABASE_URL || process.env?.SUPABASE_URL)) || 'Not Found',
    'KEY_FALLBACK (from process.env)': (typeof process !== 'undefined' && (process.env?.VITE_SUPABASE_ANON_KEY || process.env?.SUPABASE_ANON_KEY)) ? 'Found' : 'Not Found',
    'separator2': '---',
    'Final URL used': supabaseUrlFromEnv || 'Not Found',
    'Final KEY used': supabaseAnonKeyFromEnv ? 'Found' : 'Not Found',
    'Configuration check passes': String(isSupabaseConfigured)
  };

  return (
    <div className="bg-background min-h-screen flex items-center justify-center p-4 font-sans">
      <div className="max-w-3xl w-full bg-white rounded-lg shadow-2xl p-8 border-t-4 border-red-500">
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold font-serif text-neutral-dark">Yêu cầu Hành động: Cấu hình Biến Môi trường</h1>
        </div>

        <p className="mt-4 text-gray-600">
          Ứng dụng không thể kết nối với Supabase. Vui lòng cung cấp thông tin xác thực cho dự án Supabase của bạn.
        </p>
        
        {/* NEW DIAGNOSTIC SECTION */}
        <div className="mt-6">
          <h2 className="font-semibold text-lg text-neutral-dark">Thông tin Chẩn đoán</h2>
          <p className="text-gray-600 text-sm mb-2">
            Đây là các giá trị mà ứng dụng đang đọc được từ môi trường. Nguồn ưu tiên là <code className="bg-gray-200 text-xs p-1 rounded">import.meta.env</code>.
          </p>
          <pre className="bg-gray-800 text-white p-4 rounded-lg text-sm overflow-x-auto">
            <code>
              {Object.entries(debugInfo).map(([key, value]) => (
                <div key={key}>
                  {/* FIX: Conditionally render separators without their key to preserve the visual intent. */}
                  {key.startsWith('separator') ? (
                    <span className="text-gray-500">{value}</span>
                  ) : (
                    <>
                      <span className="text-cyan-400">{key}:</span> <span className="text-yellow-300">{value}</span>
                    </>
                  )}
                </div>
              ))}
            </code>
          </pre>
        </div>
        
        <div className="mt-6 p-4 bg-orange-50 border-l-4 border-orange-400">
            <h3 className="font-bold text-orange-800">Lưu ý quan trọng</h3>
            <p className="text-sm text-orange-700">
                Trang này sẽ xuất hiện nếu các biến môi trường <strong>chưa được đặt</strong>, hoặc nếu chúng được đặt bằng <strong>giá trị placeholder mặc định</strong> (ví dụ: "your-project-url"). Hãy chắc chắn rằng bạn đã thay thế chúng bằng khóa Supabase thực tế của mình.
            </p>
        </div>

        <div className="mt-6">
          <h2 className="font-semibold text-lg text-neutral-dark">Hướng dẫn sửa lỗi (cho môi trường Vite)</h2>
          <p className="text-gray-600 text-sm mb-2">
            Trong phần cài đặt của nền tảng triển khai (ví dụ: Vercel) hoặc trong tệp <code className="bg-gray-200 text-red-700 font-mono p-1 rounded text-xs">.env</code> ở local, hãy thêm các biến sau.
          </p>
          <pre className="bg-gray-800 text-white p-4 rounded-lg text-sm overflow-x-auto">
            <code dangerouslySetInnerHTML={{ __html: envFileContent.replace(/your-project-url\.supabase\.co|your-public-anon-key/g, '<span class="text-yellow-300 bg-yellow-900/50 p-1 rounded">$&</span>') }} />
          </pre>
           <p className="text-xs text-gray-400 mt-2">
            <strong>Quan trọng:</strong> Đối với các dự án Vite, biến môi trường phía client BẮT BUỘC phải bắt đầu bằng <code className="font-mono bg-gray-600 p-0.5 rounded">VITE_</code>.
          </p>
        </div>

        <div className="mt-6">
          <h2 className="font-semibold text-lg text-neutral-dark">Tìm khóa của bạn ở đâu?</h2>
          <p className="text-gray-600 text-sm">
            Bạn có thể tìm thấy URL và khóa công khai (anon key) trong trang tổng quan dự án Supabase của bạn, tại mục <span className="font-semibold">Project Settings {'>'} API</span>.
          </p>
          <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline mt-1 inline-block">Đi đến Supabase Dashboard &rarr;</a>
        </div>
        
        <p className="mt-8 text-center text-sm text-gray-500">
          Sau khi thiết lập biến môi trường, hãy triển khai lại ứng dụng của bạn.
        </p>
      </div>
    </div>
  );
};

export default SupabaseConfigErrorPage;