"use client";

import { Home, Building2, Users, Wallet, MoreHorizontal } from "lucide-react";
import Link from "next/link";

export default function BottomNav() {
  return (
    <div className="fixed bottom-0 left-0 right-0 border-t bg-white shadow-md">
      <div className="flex justify-around py-2 text-xs">
        <Link href="/" className="flex flex-col items-center">
          <Home size={20} />
          <span>Dashboard</span>
        </Link>

        <Link href="/properties" className="flex flex-col items-center">
          <Building2 size={20} />
          <span>Properties</span>
        </Link>

        <Link href="/tenants" className="flex flex-col items-center">
          <Users size={20} />
          <span>Tenants</span>
        </Link>

        <Link href="/finance" className="flex flex-col items-center">
          <Wallet size={20} />
          <span>Finance</span>
        </Link>

        <Link href="/more" className="flex flex-col items-center">
          <MoreHorizontal size={20} />
          <span>More</span>
        </Link>
      </div>
    </div>
  );
}
