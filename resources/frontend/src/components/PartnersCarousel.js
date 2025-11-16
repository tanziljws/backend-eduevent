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
    // Minimal brand-like placeholders (last-resort)
    amazonaws: 'data:image/svg+xml;utf8,\
      <svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">\
        <rect width="256" height="256" fill="white"/>\
        <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"\
         font-family="Arial, Helvetica, sans-serif" font-size="90" fill="%23FF9900">aws</text>\
      </svg>' ,
    microsoft: 'data:image/svg+xml;utf8,\
      <svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">\
        <rect width="256" height="256" fill="white"/>\
        <g transform="translate(48,48)">\
          <rect width="72" height="72" fill="%23F25022"/>\
          <rect x="88" width="72" height="72" fill="%237A7A7A"/>\
          <rect y="88" width="72" height="72" fill="%23F3C300"/>\
          <rect x="88" y="88" width="72" height="72" fill="%2300A4EF"/>\
        </g>\
      </svg>'
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
    if (idx < list.length) {
      e.currentTarget.src = list[idx];
      // If the source is monochrome SVG, keep brand-like visibility
      if (idx > 0) {
        e.currentTarget.style.filter = 'none';
      }
    } else if (dataUriFallback[slug]) {
      e.currentTarget.src = dataUriFallback[slug];
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
                className="h-16 w-auto object-contain drop-shadow-sm bg-white"
                loading="lazy"
                crossOrigin="anonymous"
                referrerPolicy="no-referrer"
                onError={(e) => onImgError(e, b.slug, b.color)}
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
