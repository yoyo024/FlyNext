'use client';
import * as React from 'react'
import { useState } from 'react';
import Image from 'next/image';

export default function ImageCarousel({ images }: { images: string[] }) {
  const [current, setCurrent] = useState(0);

  const prev = () => {
    setCurrent((prev) => (prev - 1 + images.length) % images.length);
  };

  const next = () => {
    setCurrent((prev) => (prev + 1) % images.length);
  };

  return (
    <div className="relative w-80 h-50 flex-shrink-0 rounded-lg overflow-hidden shadow-lg border-4 border-gray-500 hover:ring-2 hover:ring-blue-400 transition duration-300 ease-in-out">
      <Image
        width={500}
        height={300}
        src={images[current]}
        alt={`Room image ${current + 1}`}
        className="w-full h-full object-cover"
      />

      {/* Buttons */}
      {images.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-1 top-1/2 transform -translate-y-1/2 bg-white/70 rounded px-1 text-xs"
          >
            ‹
          </button>
          <button
            onClick={next}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 bg-white/70 rounded px-1 text-xs"
          >
            ›
          </button>
        </>
      )}
    </div>
  );
}
