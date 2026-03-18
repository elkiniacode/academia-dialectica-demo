"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

export function NavBar() {
  const { data: session } = useSession();
  const pathname = usePathname();

  if (!session) return null;

  const links = [
    { href: "/admin/dashboard", label: "Dashboard" },
    { href: "/admin/balance", label: "Balance" },
    { href: "/admin/clients", label: "Clientes" },
    { href: "/admin/testimonials", label: "Testimonios" },
    { href: "/admin/stories", label: "Historias" },
    { href: "/admin/leads", label: "Leads" },
  ];

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <span className="font-bold text-gray-800">Clases</span>
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`text-sm ${
              pathname.startsWith(link.href)
                ? "text-blue-600 font-medium"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {link.label}
          </Link>
        ))}
      </div>
      <button
        onClick={() => signOut({ callbackUrl: "/" })}
        className="text-sm text-gray-500 hover:text-gray-700"
      >
        Cerrar sesion
      </button>
    </nav>
  );
}
