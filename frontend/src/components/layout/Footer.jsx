import React from 'react';
import { Link } from 'react-router-dom';
import { FaInstagram, FaWhatsapp } from 'react-icons/fa';
import { HiMail, HiPhone } from 'react-icons/hi';
import config from '../../config/app';

const Footer = () => {
  const waNumber = config.whatsappNumber;
  const instagramUrl = config.instagramUrl;
  const storeName = config.storeName;
  const logoUrl = config.logoUrl;
  const email = config.contactEmail;
  const phone = config.contactPhone;

  return (
    <footer className="bg-[#0D0D0D] text-gray-300 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            {logoUrl && (
              <div className="flex items-center gap-3 mb-6">
                <img src={logoUrl} alt="Logo" className="h-64 w-auto object-contain" />
              </div>
            )}
            <p className="text-xl font-extrabold text-white tracking-widest mb-6 text-center md:text-left uppercase drop-shadow-lg">
              {storeName}
            </p>
            <div className="flex gap-6">
              <a
                href={`https://wa.me/${waNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center hover:bg-green-500 transition-all transform hover:scale-110 shadow-lg"
                aria-label="WhatsApp"
              >
                <FaWhatsapp size={40} className="text-white" />
              </a>
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-20 h-20 bg-gradient-to-br from-purple-600 to-pink-500 rounded-full flex items-center justify-center hover:opacity-90 transition-all transform hover:scale-110 shadow-lg"
                aria-label="Instagram"
              >
                <FaInstagram size={40} className="text-white" />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-semibold text-white mb-4">Tienda</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/productos" className="hover:text-white transition-colors">Productos</Link></li>
              <li><Link to="/productos?sort=popular" className="hover:text-white transition-colors">Más vendidos</Link></li>
              <li><Link to="/mis-ordenes" className="hover:text-white transition-colors">Mis pedidos</Link></li>
              <li><Link to="/favoritos" className="hover:text-white transition-colors">Favoritos</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-white mb-4">Contacto</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <FaWhatsapp size={14} className="text-green-400" />
                <a href={`https://wa.me/${waNumber}`} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  WhatsApp
                </a>
              </li>
              <li className="flex items-center gap-2">
                <FaInstagram size={14} className="text-pink-400" />
                <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  Instagram
                </a>
              </li>
              {email && (
                <li className="flex items-center gap-2">
                  <HiMail size={14} className="text-blue-400" />
                  <a href={`mailto:${email}`} className="hover:text-white transition-colors">
                    Email
                  </a>
                </li>
              )}
              {phone && (
                <li className="flex items-center gap-2">
                  <HiPhone size={14} className="text-orange-400" />
                  <a href={`tel:${phone}`} className="hover:text-white transition-colors">
                    Llamar
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-800 py-4">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-gray-500">
          © {new Date().getFullYear()} {storeName}. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
