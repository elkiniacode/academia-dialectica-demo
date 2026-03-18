"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

export function NavBar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  if (!session) return null;

  const links = [
    { href: "/admin/dashboard", label: "Dashboard" },
    { href: "/admin/balance", label: "Balance" },
    { href: "/admin/clients", label: "Clientes" },
    { href: "/admin/testimonials", label: "Testimonios" },
    { href: "/admin/stories", label: "Historias" },
    { href: "/admin/leads", label: "Leads" },
  ];

  const linkClass = (href: string) =>
    pathname.startsWith(href)
      ? "text-blue-600 font-medium"
      : "text-gray-600 hover:text-gray-900";

  return (
    <nav className="relative bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <span className="font-bold text-gray-800">Clases</span>
        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-6">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm ${linkClass(link.href)}`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Desktop logout */}
      <button
        onClick={() => signOut({ callbackUrl: "/" })}
        className="hidden md:block text-sm text-gray-500 hover:text-gray-700"
      >
        Cerrar sesión
      </button>

      {/* Mobile hamburger */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="md:hidden p-2 text-gray-600 hover:text-gray-900 transition-colors"
        aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d={isOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
          />
        </svg>
      </button>

      {/* Mobile dropdown */}
      {isOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-white border-b border-gray-200 shadow-lg z-50">
          <div className="flex flex-col p-4 gap-2">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={`text-sm py-2 px-2 rounded ${linkClass(link.href)}`}
              >
                {link.label}
              </Link>
            ))}
            <button
              onClick={() => {
                setIsOpen(false);
                signOut({ callbackUrl: "/" });
              }}
              className="text-sm text-left py-2 px-2 text-gray-500 hover:text-gray-700 border-t border-gray-100 mt-2 pt-3"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
