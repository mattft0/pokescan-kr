'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="bottom-nav" id="main-nav">
      <Link
        href="/"
        className={`nav-item ${pathname === '/' ? 'active' : ''}`}
        id="nav-collection"
      >
        <span className="nav-icon">📦</span>
        <span className="nav-label">Collection</span>
      </Link>

      <Link
        href="/scan"
        className="nav-item scan-btn"
        id="nav-scan"
      >
        <span className="scan-btn-inner">📸</span>
        <span className="nav-label">Scanner</span>
      </Link>

      <Link
        href="/search"
        className={`nav-item ${pathname === '/search' ? 'active' : ''}`}
        id="nav-search"
      >
        <span className="nav-icon">🔍</span>
        <span className="nav-label">Recherche</span>
      </Link>
    </nav>
  );
}
