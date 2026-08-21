/* Componente de carrusel reutilizable con flechas de navegación */

import { useRef, useState, useEffect, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

type CarouselContainerProps = {
  children: ReactNode;
  className?: string;
};

export function CarouselContainer({ 
  children, 
  className
}: CarouselContainerProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollButtons = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -400, behavior: 'smooth' });
      setTimeout(updateScrollButtons, 300);
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 400, behavior: 'smooth' });
      setTimeout(updateScrollButtons, 300);
    }
  };

  useEffect(() => {
    updateScrollButtons();
    const handleResize = () => updateScrollButtons();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [children]);

  return (
    <div className="relative">
      {/* Botón izquierdo */}
      {canScrollLeft && (
        <Button
          onClick={scrollLeft}
          variant="secondary"
          size="icon"
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-slate-900 hover:bg-slate-700 text-white rounded-full shadow-lg"
          aria-label="Scroll izquierda"
        >
          <ChevronLeft className="w-6 h-6" />
        </Button>
      )}

      {/* Contenedor con scroll horizontal */}
      <div
        ref={scrollContainerRef}
        onScroll={updateScrollButtons}
        className={cn(
          "flex gap-4 overflow-x-auto scroll-smooth scrollbar-hide pb-2",
          className
        )}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {children}
      </div>

      {/* Botón derecho */}
      {canScrollRight && (
        <Button
          onClick={scrollRight}
          variant="secondary"
          size="icon"
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-slate-900 hover:bg-slate-700 text-white rounded-full shadow-lg"
          aria-label="Scroll derecha"
        >
          <ChevronRight className="w-6 h-6" />
        </Button>
      )}
    </div>
  );
}

// Componente para envolver cada item del carrusel
type CarouselItemProps = {
  children: ReactNode;
  width?: string;
  className?: string;
};

export function CarouselItem({ 
  children, 
  width = "350px",
  className 
}: CarouselItemProps) {
  return (
    <div 
      className={cn("flex-shrink-0", className)} 
      style={{ width }}
    >
      {children}
    </div>
  );
}
