import React from 'react';

export default function PhoneMock({ className = '', ctaLabel = 'Download Here' }) {
  return (
    <div className={`relative w-full ${className}`}>
      {/* Device with clear phone silhouette (portrait, rounded corners, bezel) */}
      <div className="relative mx-auto w-full max-w-[280px] sm:max-w-[320px] md:max-w-[360px] aspect-[9/16] rounded-[2.4rem]" style={{ boxShadow: '0 18px 35px rgba(0,0,0,0.18)' }}>
        {/* Bezel */}
        <div className="absolute inset-0 rounded-[2.4rem] bg-[#111]" />
        {/* Frame highlight */}
        <div className="absolute inset-[4px] rounded-[2.2rem] bg-[#0f0f0f] ring-1 ring-black/20" />
        {/* Screen */}
        <div className="absolute inset-[10px] rounded-[2rem] overflow-hidden bg-white">
          {/* Status bar */}
          <div className="relative h-8">
            {/* Slim pill notch */}
            <div className="absolute left-1/2 -translate-x-1/2 top-1 h-4 w-24 bg-[#111] rounded-b-2xl" />
            <div className="absolute left-3 top-1.5 text-[10px] font-semibold text-gray-600">9:41</div>
            <div className="absolute right-3 top-2 flex items-center gap-1">
              <div className="h-1.5 w-8 rounded-full bg-gray-400/80" />
              <div className="h-1.5 w-1.5 rounded-full bg-gray-500/90" />
            </div>
          </div>

          {/* Wallpaper */}
          <div className="relative h-full -mt-1">
            <div className="absolute inset-0 bg-white" />

            {/* CTA */}
            <div className="relative h-full flex items-center justify-center">
              <button className="px-5 py-2.5 rounded-full bg-blue-600 text-white text-sm font-semibold shadow-md hover:bg-blue-700 transition">
                {ctaLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
