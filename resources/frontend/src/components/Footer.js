import React from 'react';
import { Mail, Phone, MapPin, Instagram, Facebook, Twitter, Youtube } from 'lucide-react';

function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">

        {/* Link columns */
        }
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="text-xl font-semibold text-gray-900">EduFest</div>
            <p className="mt-2 text-sm text-gray-600 max-w-xs">
              Platform manajemen event & sertifikat untuk sekolah dan komunitas.
            </p>
            <div className="mt-3 flex items-center gap-3 text-gray-500">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="hover:text-gray-700"><Instagram className="w-4 h-4" /></a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="hover:text-gray-700"><Facebook className="w-4 h-4" /></a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter" className="hover:text-gray-700"><Twitter className="w-4 h-4" /></a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="hover:text-gray-700"><Youtube className="w-4 h-4" /></a>
            </div>
          </div>

          {/* On our site */}
          <div>
            <div className="text-xs font-semibold tracking-wider text-gray-500">ON OUR SITE</div>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              <li><a href="/events" className="hover:text-gray-900">Features</a></li>
              <li><a href="/contact" className="hover:text-gray-900">Support</a></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <div className="text-xs font-semibold tracking-wider text-gray-500">RESOURCES</div>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              <li><a href="/career" className="hover:text-gray-900">Career</a></li>
              <li><a href="/blog" className="hover:text-gray-900">Blog</a></li>
              <li><a href="/legal" className="hover:text-gray-900">Legal</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <div className="text-xs font-semibold tracking-wider text-gray-500">CONTACT</div>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              <li className="flex items-center gap-2"><Mail className="w-4 h-4 text-gray-400" /> support@edufest.app</li>
              <li className="flex items-center gap-2"><Phone className="w-4 h-4 text-gray-400" /> +62 812-0000-0000</li>
              <li className="flex items-center gap-2"><MapPin className="w-4 h-4 text-gray-400" /> Indonesia</li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 text-xs text-gray-500">© {new Date().getFullYear()} EduFest. All rights reserved.</div>
      </div>
    </footer>
  );
}

export default Footer;
