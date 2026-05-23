import React from 'react';
import { FaWhatsapp } from 'react-icons/fa';
import ChatWidget from './ChatWidget';

const FloatingButtons = () => {
  const waNumber = import.meta.env.VITE_WHATSAPP_NUMBER || '5491100000000';

  return (
    <div className="fixed bottom-6 right-4 z-50 flex flex-col gap-3">
      {/* WhatsApp */}
      <a
        href={`https://wa.me/${waNumber}`}
        target="_blank"
        rel="noopener noreferrer"
        className="w-12 h-12 bg-green-500 rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-110 active:scale-95 hover:bg-green-400"
        aria-label="WhatsApp"
      >
        <FaWhatsapp size={24} color="white" />
      </a>

      {/* AI Chat */}
      <ChatWidget />
    </div>
  );
};

export default FloatingButtons;
