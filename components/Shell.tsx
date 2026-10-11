'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { docs, href } from '@/content/docs';

export function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const match = (t: string) => t.toLowerCase().includes(q.toLowerCase());

  return (
    <>
      <header className="topbar">
        <button className="menu" aria-label="Toggle navigation" onClick={() => setOpen(!open)}>☰</button>
        <Link href="/" className="brand"><span className="logo">◆</span> Relay <span className="ver">v2.4</span></Link>
        <input className="search" placeholder="Search docs…" value={q} onChange={(e) => setQ(e.target.value)} />
        <a className="gh" href="https://github.com/harshilp24/nextjs-docs-sample">GitHub</a>
      </header>
      <div className="layout">
        <nav className={`sidebar ${open ? 'open' : ''}`} onClick={() => setOpen(false)}>
          {(['Guides', 'Reference'] as const).map((section) => {
            const items = docs.filter((d) => d.section === section && match(d.title + d.description));
            if (!items.length) return null;
            return (
              <div key={section}>
                <p className="nav-h">{section}</p>
                {items.map((d) => (
                  <Link key={href(d)} href={href(d)} className={path === href(d) ? 'active' : ''}>{d.title}</Link>
                ))}
              </div>
            );
          })}
        </nav>
        <div className="main">{children}</div>
      </div>
    </>
  );
}
