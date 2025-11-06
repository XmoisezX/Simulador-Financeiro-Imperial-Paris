"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

export interface LightboxImage {
  url: string;
  rotation?: number;
  legend?: string | null;
}

interface ImageLightboxProps {
  images: LightboxImage[];
  initialIndex?: number;
  onClose: () => void;
}

const ImageLightbox: React.FC<ImageLightboxProps> = ({ images, initialIndex = 0, onClose }) => {
  const [index, setIndex] = useState(initialIndex);

  const prev = useCallback(() => {
    setIndex((i) => (i - 1 + images.length) % images.length);
  }, [images.length]);

  const next = useCallback(() => {
    setIndex((i) => (i + 1) % images.length);
  }, [images.length]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose, prev, next]);

  if (!images || images.length === 0) return null;
  const current = images[index];

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      {/* Conteúdo */}
      <div className="relative w-full h-full flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
        {/* Botão fechar */}
        <button
          aria-label="Fechar"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Seta esquerda */}
        {images.length > 1 && (
          <button
            aria-label="Anterior"
            onClick={prev}
            className="absolute left-4 md:left-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
          >
            <ChevronLeft className="w-7 h-7" />
          </button>
        )}

        {/* Imagem */}
        <div className="max-w-[95vw] max-h-[85vh] flex items-center justify-center">
          <img
            src={current.url}
            alt={current.legend || `Imagem ${index + 1}`}
            className="object-contain max-h-[85vh] max-w-[95vw] transition-transform"
            style={{ transform: `rotate(${current.rotation || 0}deg)` }}
          />
        </div>

        {/* Seta direita */}
        {images.length > 1 && (
          <button
            aria-label="Próxima"
            onClick={next}
            className="absolute right-4 md:right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
          >
            <ChevronRight className="w-7 h-7" />
          </button>
        )}

        {/* Rodapé com contador e legenda */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center text-white/90">
          <div className="text-sm mb-1">{index + 1} / {images.length}</div>
          {current.legend && (
            <div className="text-xs max-w-[90vw] truncate px-2">{current.legend}</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageLightbox;