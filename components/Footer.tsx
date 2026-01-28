import React from 'react';
import { Link } from 'react-router-dom';

// --- Social Icons ---
const FacebookIcon: React.FC = () => <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" /></svg>;
const InstagramIcon: React.FC = () => <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 16c-2.209 0-4-1.791-4-4s1.791-4 4-4 4 1.791 4 4-1.791 4-4 4zm4-9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>;
const ZaloIcon: React.FC = () => <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12.001.001C5.373.001 0 5.374 0 12.001c0 4.254 2.215 7.994 5.567 10.033l-1.42 4.823 5.09-2.616c.91.173 1.847.26 2.764.26 6.628 0 12.001-5.373 12.001-12.001C24.001 5.374 18.628.001 12.001.001zM8.5 14.5c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5zm7 0c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5z" /></svg>;


const Footer: React.FC = () => {
  const socialLinks = {
    facebook: 'https://facebook.com/1beauty.asia',
    instagram: 'https://instagram.com/1beauty.asia',
    zalo: 'https://zalo.me/1beauty.asia',
  };

  return (
    <footer className="bg-neutral-dark text-white border-t border-white/5">
      <div className="container mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
          {/* Column 1: Info */}
          <div className="md:col-span-4">
            <h3 className="text-2xl font-bold font-outfit text-gradient mb-6">1Beauty.asia</h3>
            <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
              Nền tảng danh bạ làm đẹp hàng đầu Châu Á, nơi kết nối sự tinh tế và vẻ đẹp đích thực.
            </p>
            <div className="mt-8 flex space-x-5">
              {socialLinks.facebook && (
                <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-primary transition-all duration-300 hover:-translate-y-1" aria-label="Facebook">
                  <FacebookIcon />
                </a>
              )}
              {socialLinks.instagram && (
                <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-primary transition-all duration-300 hover:-translate-y-1" aria-label="Instagram">
                  <InstagramIcon />
                </a>
              )}
              {socialLinks.zalo && (
                <a href={socialLinks.zalo} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-primary transition-all duration-300 hover:-translate-y-1" aria-label="Zalo">
                  <ZaloIcon />
                </a>
              )}
            </div>
          </div>

          {/* Column 2: Explore */}
          <div className="md:col-span-2">
            <h4 className="font-outfit font-semibold text-lg mb-6">Khám phá</h4>
            <ul className="space-y-4 text-sm">
              <li><Link to="/directory" className="text-gray-400 hover:text-primary transition-colors">Danh bạ Spa</Link></li>
              <li><Link to="/directory" className="text-gray-400 hover:text-primary transition-colors">Danh bạ Salon</Link></li>
              <li><Link to="/directory" className="text-gray-400 hover:text-primary transition-colors">Danh bạ Nha khoa</Link></li>
              <li><Link to="/blog" className="text-gray-400 hover:text-primary transition-colors">Cảm hứng</Link></li>
            </ul>
          </div>

          {/* Column 3: Policy */}
          <div className="md:col-span-3">
            <h4 className="font-outfit font-semibold text-lg mb-6">Chính sách</h4>
            <ul className="space-y-4 text-sm">
              <li><Link to="/about" className="text-gray-400 hover:text-primary transition-colors">Về chúng tôi</Link></li>
              <li><Link to="/contact" className="text-gray-400 hover:text-primary transition-colors">Liên hệ</Link></li>
              <li><Link to="#" className="text-gray-400 hover:text-primary transition-colors">Điều khoản dịch vụ</Link></li>
              <li><Link to="#" className="text-gray-400 hover:text-primary transition-colors">Bảo mật thông tin</Link></li>
            </ul>
          </div>

          {/* Column 4: Join Us */}
          <div className="md:col-span-3">
            <h4 className="font-outfit font-semibold text-lg mb-6">Dành cho đối tác</h4>
            <p className="text-gray-400 text-sm mb-6">
              Bạn là chủ doanh nghiệp làm đẹp? Hãy đồng hành cùng chúng tôi.
            </p>
            <Link
              to="/for-business"
              className="inline-block px-6 py-3 rounded-xl bg-primary text-secondary font-bold text-sm transition-all duration-300 hover:bg-white hover:scale-105"
            >
              Đăng ký ngay
            </Link>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center text-xs text-gray-500">
          <p>&copy; {new Date().getFullYear()} 1Beauty.asia. Tất cả quyền được bảo lưu.</p>
          <div className="mt-4 md:mt-0 space-x-6">
            <Link to="#" className="hover:text-primary transition-colors">Sitemap</Link>
            <Link to="#" className="hover:text-primary transition-colors">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
