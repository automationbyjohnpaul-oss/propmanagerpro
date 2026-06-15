"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/properties", label: "Properties" },
  { href: "/tenants", label: "Tenants" },
  { href: "/leases", label: "Leases" },
  { href: "/payments", label: "Payments" },
  { href: "/finance", label: "Finance" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  // Preload all routes for instant navigation
  useEffect(() => {
    router.prefetch("/properties");
    router.prefetch("/tenants");
    router.prefetch("/leases");
    router.prefetch("/payments");
    router.prefetch("/finance");
  }, [router]);

  return (
    <aside className="w-56 bg-white border-r border-gray-200 min-h-screen p-4 flex flex-col">
      <h2 className="text-lg font-bold text-gray-900 mb-6">PropManager</h2>
      <nav className="flex flex-col gap-1">
        {links.map((link) => {
          const isActive =
            link.href === "/"
              ? pathname === "/"
              : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              prefetch
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
