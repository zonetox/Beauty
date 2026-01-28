
import React from 'react';

const ContactInfo: React.FC = () => (
    <div className="space-y-6">
        <h2 className="text-3xl font-bold font-serif text-neutral-dark">Thông tin liên hệ</h2>
        <div>
            <h3 className="font-semibold">Địa chỉ</h3>
            <p className="text-gray-600">123 Đường ABC, Quận 1, TP. Hồ Chí Minh</p>
        </div>
         <div>
            <h3 className="font-semibold">Email</h3>
            <p className="text-gray-600"><a href="mailto:hi@1beauty.asia" className="text-primary hover:underline">hi@1beauty.asia</a></p>
        </div>
         <div>
            <h3 className="font-semibold">Số điện thoại</h3>
            <p className="text-gray-600"><a href="tel:0123456789" className="text-primary hover:underline">0123 456 789</a></p>
        </div>
    </div>
);

export default ContactInfo;
