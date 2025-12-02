import React, { useState } from 'react';

const ContactForm: React.FC = () => {
  const [isMessageSent, setIsMessageSent] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName || !contactEmail || !contactMessage) return;

    // Simulate submission
    console.log({
      name: contactName,
      email: contactEmail,
      message: contactMessage,
    });
    
    setIsMessageSent(true);
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-md">
        {isMessageSent ? (
          <div role="alert" className="flex flex-col items-center justify-center h-full text-center min-h-[300px]">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-500 mb-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <h2 className="text-xl font-bold font-serif text-green-800">Cảm ơn bạn!</h2>
            <p className="mt-2 text-green-700">
                Tin nhắn của bạn đã được gửi. Chúng tôi sẽ phản hồi sớm nhất có thể.
            </p>
          </div>
        ) : (
          <form onSubmit={handleContactSubmit} className="space-y-4">
            <h2 className="text-2xl font-bold font-serif text-neutral-dark mb-4">Gửi tin nhắn cho chúng tôi</h2>
            <div>
              <label htmlFor="contact-name" className="block text-sm font-medium text-gray-700">Tên của bạn</label>
              <input
                type="text"
                id="contact-name"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              />
            </div>
            <div>
              <label htmlFor="contact-email" className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                id="contact-email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              />
            </div>
            <div>
              <label htmlFor="contact-message" className="block text-sm font-medium text-gray-700">Tin nhắn</label>
              <textarea
                id="contact-message"
                rows={5}
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              />
            </div>
            <div>
              <button type="submit" className="w-full bg-primary text-white py-3 px-4 rounded-md font-semibold hover:bg-primary-dark transition-colors">
                Gửi tin nhắn
              </button>
            </div>
          </form>
        )}
      </div>
  );
};

export default ContactForm;
