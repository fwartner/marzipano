'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`sticky top-0 z-50 transition-all duration-300 ${
      scrolled
        ? 'bg-white/98 backdrop-blur-lg border-b border-gray-200 shadow-md'
        : 'bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm'
    }`}>
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo/Brand */}
          <Link 
            href="/" 
            className="flex items-center gap-3 group"
          >
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-black tracking-tight group-hover:text-gray-800 transition-colors">
                Marzipano-TS
              </span>
              <span className="text-[10px] text-gray-500 group-hover:text-gray-600 transition-colors font-medium uppercase tracking-wider leading-tight">
                by Pixel & Process
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            <Link
              href="/"
              className="px-4 py-2 text-gray-700 hover:text-black hover:bg-gray-50 rounded-lg transition-all duration-200 font-medium text-sm"
            >
              Home
            </Link>
            <a
              href="#installation"
              className="px-4 py-2 text-gray-700 hover:text-black hover:bg-gray-50 rounded-lg transition-all duration-200 font-medium text-sm"
            >
              Installation
            </a>
            <a
              href="https://github.com/Pixel-Process-UG/marzipano-ts"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 text-gray-700 hover:text-black hover:bg-gray-50 rounded-lg transition-all duration-200 font-medium text-sm"
            >
              GitHub
            </a>
            <div className="h-4 w-px bg-gray-300 mx-2" />
            <a
              href="https://pixelandprocess.de/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-all duration-200 text-xs font-medium"
            >
              Pixel & Process
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-gray-700 hover:text-black hover:bg-gray-50 rounded-lg transition-all duration-200"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {mobileMenuOpen ? (
                <path d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        <div className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          mobileMenuOpen ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'
        }`}>
          <div className="py-4 space-y-1 border-t border-gray-200">
            <Link
              href="/"
              className="block px-4 py-3 text-gray-700 hover:text-black hover:bg-gray-50 rounded-lg transition-all duration-200 font-medium"
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>
            <a
              href="#installation"
              className="block px-4 py-3 text-gray-700 hover:text-black hover:bg-gray-50 rounded-lg transition-all duration-200 font-medium"
              onClick={() => setMobileMenuOpen(false)}
            >
              Installation
            </a>
            <a
              href="https://github.com/Pixel-Process-UG/marzipano-ts"
              target="_blank"
              rel="noopener noreferrer"
              className="block px-4 py-3 text-gray-700 hover:text-black hover:bg-gray-50 rounded-lg transition-all duration-200 font-medium"
            >
              GitHub
            </a>
            <div className="h-px bg-gray-200 my-2 mx-4" />
            <a
              href="https://pixelandprocess.de/"
              target="_blank"
              rel="noopener noreferrer"
              className="block px-4 py-3 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-all duration-200 text-sm font-medium"
            >
              Pixel & Process
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}
