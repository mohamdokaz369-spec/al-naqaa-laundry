"use client";

import { useState } from "react";
import Link from "next/link";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 right-0 left-0 z-50 bg-white/95 backdrop-blur-sm shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex flex-col leading-tight">
          <span className="text-xl font-bold text-[#1a5f7a]">مغسلة النقاء</span>
          <span className="text-xs text-[#57c5b6] tracking-wide">AL Naqaa Laundry</span>
        </Link>

        <ul className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-700">
          <li><a href="#services" className="hover:text-[#1a5f7a] transition-colors">خدماتنا</a></li>
          <li><a href="#why-us" className="hover:text-[#1a5f7a] transition-colors">لماذا نحن</a></li>
          <li><a href="#contact" className="hover:text-[#1a5f7a] transition-colors">تواصل معنا</a></li>
          <li>
            <a
              href="https://wa.me/972000000000"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#1a5f7a] text-white px-4 py-2 rounded-full hover:bg-[#159895] transition-colors"
            >
              اطلب الآن
            </a>
          </li>
        </ul>

        <button
          className="md:hidden p-2 text-[#1a5f7a]"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="فتح القائمة"
        >
          {menuOpen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-white border-t px-4 pb-4">
          <ul className="flex flex-col gap-3 pt-3 text-sm font-medium text-gray-700">
            <li><a href="#services" onClick={() => setMenuOpen(false)} className="block py-1 hover:text-[#1a5f7a]">خدماتنا</a></li>
            <li><a href="#why-us" onClick={() => setMenuOpen(false)} className="block py-1 hover:text-[#1a5f7a]">لماذا نحن</a></li>
            <li><a href="#contact" onClick={() => setMenuOpen(false)} className="block py-1 hover:text-[#1a5f7a]">تواصل معنا</a></li>
            <li>
              <a
                href="https://wa.me/972000000000"
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-[#1a5f7a] text-white text-center px-4 py-2 rounded-full hover:bg-[#159895] transition-colors"
              >
                اطلب الآن
              </a>
            </li>
          </ul>
        </div>
      )}
    </nav>
  );
}
