'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, Layout, Settings, User } from 'lucide-react';

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-blur]:bg-background/80">
      <div className="flex h-12 items-center justify-between px-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-xl font-bold tracking-tight"
        >
          <Layout className="h-5 w-5" />
          <span>SpareLab Document Builder</span>
        </Link>
        <div className="flex items-center gap-4">
          <button className="md:hidden p-1" onClick={() => setOpen((o) => !o)}>
            <Menu className="h-6 w-6" />
          </button>
          <Link href="/documents" className="px-3 py-2 text-sm font-medium rounded-md hover:bg-muted">
            Documents
          </Link>
          <Link href="/settings" className="px-3 py-2 text-sm font-medium rounded-md hover:bg-muted">
            Settings
          </Link>
        </div>
      </div>
    </header>
  );
}
