'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function NavBar() {
  const [mapsOpen, setMapsOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Element;
      if (!target.closest('.dropdown')) setMapsOpen(false);
    }
    if (mapsOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [mapsOpen]);

  return (
    <nav className="sticky top-0 bg-[#faf5f5] px-6 py-2 flex items-center justify-between z-50 shadow">
 
      <div className="flex items-center">
        <Link href="/"> <Image src="/logo.svg" alt="EMERGE Logo" width={35} height={35} /> </Link>
      </div>

      <button
        className="md:hidden flex flex-col justify-center items-center w-10 h-10 rounded focus:outline-none"
        onClick={() => setMobileOpen((open) => !open)}
        aria-label="Toggle navigation"
      >
        <span className={`block h-1 w-7 rounded bg-[#b92727] mb-1 transition-all duration-300 ${mobileOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
        <span className={`block h-1 w-7 rounded bg-[#b92727] mb-1 transition-all duration-300 ${mobileOpen ? 'opacity-0' : ''}`}></span>
        <span className={`block h-1 w-7 rounded bg-[#b92727] transition-all duration-300 ${mobileOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
      </button>

      <ul className="hidden md:flex list-none gap-8 flex-grow justify-center items-center">
        <li>
          <Link href="/" className="font-medium text-black hover:text-[#B92727] transition-colors">Home</Link>
        </li>
        <li className="relative group">
          <button
            className="font-medium text-black hover:text-[#B92727] transition-colors flex items-center gap-1"
            aria-expanded={mapsOpen}
            onClick={() => setMapsOpen((open) => !open)}
          >
            Maps <span className="text-xs">▼</span>
          </button>
          {mapsOpen && (
            <ul className="absolute left-0 top-8 bg-white rounded-lg shadow-lg py-2 px-2 min-w-[180px] z-50">
              <li>
                <Link href="/risk-map" className="block px-4 py-2 text-black hover:text-[#B92727]" onClick={() => setMapsOpen(false)}>
                  Risk Map
                </Link>
              </li>
              <li>
                <Link href="/hazard-visualization" className="block px-4 py-2 text-black hover:text-[#B92727]" onClick={() => setMapsOpen(false)}>
                  Hazard Visualization
                </Link>
              </li>
            </ul>
          )}
        </li>
        <li>
          <Link href="/responder-allocation" className="font-medium text-black hover:text-[#B92727] transition-colors">Responder Allocation</Link>
        </li>
        <li>
          <Link href="/about" className="font-medium text-black hover:text-[#B92727] transition-colors">About</Link>
        </li>
      </ul>

      <button className="hidden md:flex items-center bg-[#B92727] text-white rounded-xl px-4 py-2 font-bold gap-2">
        <div className="flex flex-col items-end mr-2">
          <span>Anna Freeman</span>
          <span className="text-xs font-normal opacity-85 -mt-1">Responder</span>
        </div>
        <div className="w-9 h-9 rounded-full overflow-hidden">
          <Image src="/profile.jpg" alt="Profile" width={36} height={36} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      </button>

      {mobileOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={() => setMobileOpen(false)}></div>
      )}

      <div className={`fixed top-0 right-0 h-full w-64 bg-[#faf5f5] shadow-lg z-50 transform transition-transform duration-300 md:hidden ${mobileOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex flex-col h-full p-6">
          <button className="self-end mb-6" onClick={() => setMobileOpen(false)} aria-label="Close menu">
            <span className="text-3xl text-[#b92727]">×</span>
          </button>
          <ul className="flex flex-col gap-6 text-lg">
            <li>
              <Link href="/" className="font-medium text-black hover:text-[#B92727]" onClick={() => setMobileOpen(false)}>Home</Link>
            </li>
            <li>
              <button
                className="font-medium text-black hover:text-[#B92727] flex items-center gap-1"
                onClick={() => setMapsOpen((open) => !open)}
              >
                Maps <span className="text-xs">▼</span>
              </button>
              {mapsOpen && (
                <ul className="ml-4 mt-2 flex flex-col gap-2">
                  <li>
                    <Link href="/risk-map" className="text-black hover:text-[#B92727]" onClick={() => { setMapsOpen(false); setMobileOpen(false); }}>
                      Risk Map
                    </Link>
                  </li>
                  <li>
                    <Link href="/hazard-visualization" className="text-black hover:text-[#B92727] text-center" onClick={() => { setMapsOpen(false); setMobileOpen(false); }}>
                      Hazard Visualization
                    </Link>
                  </li>
                </ul>
              )}
            </li>
            <li>
              <Link href="/responder-allocation" className="font-medium text-black hover:text-[#B92727]" onClick={() => setMobileOpen(false)}>Responder Allocation</Link>
            </li>
            <li>
              <Link href="/about" className="font-medium text-black hover:text-[#B92727]" onClick={() => setMobileOpen(false)}>About</Link>
            </li>
          </ul>
          <div className="mt-auto flex items-center bg-[#B92727] text-white rounded-xl px-4 py-2 font-bold gap-2">
            <div className="flex flex-col items-end mr-2">
              <span>Anna Freeman</span>
              <span className="text-xs font-normal opacity-85 -mt-1">Responder</span>
            </div>
            <div className="w-9 h-9 rounded-full overflow-hidden">
              <Image src="/profile.jpg" alt="Profile" width={36} height={36} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}