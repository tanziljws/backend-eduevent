import React, { useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const brands = [
  { name: 'Google', slug: 'google', color: '4285F4' },
  { name: 'AWS', slug: 'amazonaws', color: 'FF9900' },
  { name: 'Microsoft', slug: 'microsoft', color: '111827' },
  { name: 'Cloudflare', slug: 'cloudflare', color: 'F38020' },
  { name: 'Vercel', slug: 'vercel', color: '000000' },
  { name: 'GitHub', slug: 'github', color: '000000' },
  { name: 'MongoDB', slug: 'mongodb', color: 'F2C94C' },
];

export default function PartnersCarousel() {
  const scrollerRef = useRef(null);
  const hoverRef = useRef(false);
  const triedFallback = {};
  const dataUriFallback = {
    // SVG fallbacks for brands when external CDN fails
    google: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="%234285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="%2334A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="%23FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="%23EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>',
    amazonaws: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="%23FF9900" d="M0 18.9l3-.6.2-2.5L0 15.7v3.2zm16.5-13.5l-.9 5.6-1.5-1.3-2.7 2.7c-.3-.2-.6-.4-1-.4H2.5v-1.4h7.8c.4 0 .8.1 1.1.3l1.3-1.3-3.3-3.4c-.3-.3-.8-.5-1.2-.5H2.5C1.1 4 0 5.1 0 6.5v10.2l5-1v-5.5c0-.8.6-1.4 1.4-1.4h8.1c.8 0 1.4.6 1.4 1.4v5.5l5 1V6.5c0-1.4-1.1-2.5-2.5-2.5h-2.4zm-1 3.6c-.8 0-1.4.6-1.4 1.4s.6 1.4 1.4 1.4 1.4-.6 1.4-1.4-.6-1.4-1.4-1.4z"/></svg>',
    microsoft: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 23 23"><path fill="%23F25022" d="M0 0h11.377v11.372H0z"/><path fill="%2300A4EF" d="M12.623 0H24v11.372H12.623z"/><path fill="%23FFB900" d="M0 12.628h11.377V24H0z"/><path fill="%237A7A7A" d="M12.623 12.628H24V24H12.623z"/></svg>',
    cloudflare: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="%23F38020" d="M15.31 2.837a6.667 6.667 0 0 0-9.438 9.43c.089-.588.089-1.183 0-1.771l-.022-.002a4.842 4.842 0 0 1 6.849-6.85l.002.001c.587-.088 1.182-.088 1.771 0l.002-.001a6.662 6.662 0 0 0-.164-1.807zm1.477 1.477l-.001.002a6.662 6.662 0 0 0 .165 1.807 4.833 4.833 0 0 1-.001 6.846l-.001.002c-.588.088-1.184.088-1.772 0a4.842 4.842 0 0 1-6.849-6.849l.001-.001c-.588-.089-1.184-.089-1.772 0a6.667 6.667 0 0 0 9.438 9.438c.089-.588.089-1.184 0-1.772l.002-.001a4.842 4.842 0 0 1 6.849-6.849l-.002-.001c.588-.089 1.184-.089 1.772 0a6.667 6.667 0 0 0-9.438-9.438z"/></svg>',
    vercel: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="%23000000" d="M24 22.525H0l12-21.05 12 21.05z"/></svg>',
    github: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="%23000000" d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>',
    mongodb: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="%2347A248" d="M17.193 9.555c-1.264-5.58-4.252-7.414-4.573-8.115-.28-.394-.53-.954-.735-1.44-.036.495-.055.685-.523 1.184-.723.566-4.514 3.682-4.514 8.016 0 4.556 3.818 8.018 4.243 8.32.424.302 1.12.34 1.12.34s.659-.038 1.102-.34c.444-.302 4.231-3.764 4.231-8.32 0-1.32-.263-2.421-.359-2.965zm-5.113 8.717s-.062.038-.164.038c-.062 0-.119-.038-.119-.038V8.238c0-.72.563-1.303 1.263-1.303.69 0 1.263.583 1.263 1.303v10.034z"/></svg>'
  };
  const sources = (slug, color) => [
    `https://cdn.simpleicons.org/${slug}/${color}`,
    `https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/${slug}.svg`,
    `https://unpkg.com/simple-icons@latest/icons/${slug}.svg`,
    `https://raw.githubusercontent.com/simple-icons/simple-icons/develop/icons/${slug}.svg`,
  ];
  const scrollByAmount = (dir) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * 320, behavior: 'smooth' });
  };

  // Auto-scroll marquee effect
  useEffect(() => {
    let rafId;
    const speed = 0.6; // px per frame (~36 px/s at 60fps)
    const step = () => {
      const el = scrollerRef.current;
      if (!el || hoverRef.current) {
        rafId = requestAnimationFrame(step);
        return;
      }
      el.scrollLeft += speed;
      // Loop when reaching end
      if (el.scrollLeft >= el.scrollWidth - el.clientWidth - 1) {
        el.scrollLeft = 0;
      }
      rafId = requestAnimationFrame(step);
    };
    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, []);
  const onImgError = (e, slug, color) => {
    const idx = (triedFallback[slug] ?? 0) + 1;
    triedFallback[slug] = idx;
    const list = sources(slug, color);
    
    // Try next external source first
    if (idx < list.length) {
      e.currentTarget.src = list[idx];
      // If the source is monochrome SVG, keep brand-like visibility
      if (idx > 0) {
        e.currentTarget.style.filter = 'none';
      }
    } else if (dataUriFallback[slug]) {
      // Use SVG fallback if all external sources fail
      e.currentTarget.src = dataUriFallback[slug];
      e.currentTarget.style.opacity = '1';
    } else {
      // If no fallback, hide the image and show text placeholder
      e.currentTarget.style.display = 'none';
      const parent = e.currentTarget.parentElement;
      if (parent && !parent.querySelector('.fallback-text')) {
        const fallback = document.createElement('div');
        fallback.className = 'fallback-text text-gray-400 text-xs font-semibold';
        fallback.textContent = brands.find(b => b.slug === slug)?.name || slug.toUpperCase();
        parent.appendChild(fallback);
      }
    }
  };

  return (
    <div className="mb-12">
      <div className="text-center mb-6">
        <h3 className="text-sm tracking-widest text-gray-500 font-semibold">OUR PARTNERS</h3>
      </div>

      <div className="relative">
        {/* Left Arrow */}
        <button
          type="button"
          aria-label="Previous"
          onClick={() => scrollByAmount(-1)}
          className="absolute left-0 top-1/2 -translate-y-1/2 p-2 rounded-full border border-teal-300 text-teal-500 bg-white hover:bg-teal-50 shadow-sm"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Logos scroller */}
        <div
          ref={scrollerRef}
          className="mx-10 flex gap-10 overflow-x-auto no-scrollbar py-2"
          onMouseEnter={() => (hoverRef.current = true)}
          onMouseLeave={() => (hoverRef.current = false)}
        >
          {[...brands, ...brands].map((b, idx) => (
            <div key={b.slug} className="shrink-0 flex items-center justify-center h-24 w-40">
              <img
                src={sources(b.slug, b.color)[0]}
                alt={b.name}
                className="h-16 w-auto object-contain drop-shadow-sm bg-white opacity-90 hover:opacity-100 transition-opacity"
                loading="lazy"
                onError={(e) => onImgError(e, b.slug, b.color)}
                style={{ imageRendering: 'auto' }}
              />
            </div>
          ))}
        </div>

        {/* Right Arrow */}
        <button
          type="button"
          aria-label="Next"
          onClick={() => scrollByAmount(1)}
          className="absolute right-0 top-1/2 -translate-y-1/2 p-2 rounded-full border border-teal-300 text-teal-500 bg-white hover:bg-teal-50 shadow-sm"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Social follow buttons */}
      <div className="mt-8 text-center">
        <div className="text-xs tracking-widest text-gray-500 font-semibold mb-4">FOLLOW US IN SOCIAL NETWORKS</div>
        <div className="flex items-center justify-center gap-4">
          {['FACEBOOK', 'TWITTER'].map((s) => (
            <a
              key={s}
              href="/events"
              className="px-5 py-2 text-xs font-semibold tracking-wide border border-teal-400 text-teal-600 rounded-sm hover:bg-teal-50"
            >
              {s}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
