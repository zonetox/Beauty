import React from 'react';
import { Link } from 'react-router-dom';

const CtaSection: React.FC = () => (
    <div className="bg-accent/50 py-16">
        <div className="container mx-auto text-center px-4">
            <h2 className="text-3xl font-bold font-serif text-neutral-dark">Trở thành đối tác của BeautyDir</h2>
            <p className="mt-4 max-w-2xl mx-auto text-gray-600">
                Gia nhập mạng lưới của chúng tôi để tiếp cận hàng ngàn khách hàng tiềm năng và phát triển kinh doanh của bạn.
            </p>
            <Link 
                to="/for-business" 
                className="mt-8 inline-block bg-primary text-white px-8 py-3 rounded-md font-semibold hover:bg-primary-dark transition-transform transform hover:scale-105"
            >
                Đăng ký cho Doanh nghiệp
            </Link>
        </div>
    </div>
);

export default CtaSection;
