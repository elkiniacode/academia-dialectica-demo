"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

const NAV_LINKS = [
  { href: "#caracteristicas", label: "Características" },
  { href: "#modalidades", label: "Modalidades" },
  { href: "#testimonios", label: "Testimonios" },
];

export function PublicNavbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-white/20">
      <div className="max-w-6xl mx-auto px-6 flex justify-between items-center h-16">
        {/* Logo */}
        <a href="#hero">
          <Image
            src="/logo.png"
            alt="Academia Dialéctica"
            width={50}
            height={36}
            priority
          />
        </a>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-gray-600 transition-all duration-300 ease-out hover:text-blue-600"
            >
              {link.label}
            </a>
          ))}
          <Link
            href="/login"
            className="px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-full transition-all duration-300 ease-out hover:bg-blue-700 hover:-translate-y-0.5"
          >
            Acceso
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setIsOpen((prev) => !prev)}
          className="md:hidden p-2 text-gray-600 hover:text-gray-900 transition-colors"
          aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
        >
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={
                isOpen
                  ? "M6 18L18 6M6 6l12 12"
                  : "M4 6h16M4 12h16M4 18h16"
              }
            />
          </svg>
        </button>
      </div>

      {/* Mobile dropdown — absolute to overlay content without layout shift */}
      {isOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-2xl">
          <div className="flex flex-col p-6 gap-4">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="text-base font-medium text-gray-800 py-2 transition-all duration-300 ease-out hover:text-blue-600"
              >
                {link.label}
              </a>
            ))}
            <Link
              href="/login"
              onClick={() => setIsOpen(false)}
              className="mt-2 px-5 py-3 bg-blue-600 text-white text-base font-semibold rounded-full text-center transition-all duration-300 ease-out hover:bg-blue-700"
            >
              Acceso
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
