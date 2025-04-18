'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

const ImageSlider = ({ images, height = 'h-48', objectFit = 'object-cover' }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMobileView, setIsMobileView] = useState(false);
  const [touchStartX, setTouchStartX] = useState(0);
  const [touchEndX, setTouchEndX] = useState(0);
  
  // Detect mobile view
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    
    // Check on mount
    checkIfMobile();
    
    // Check on resize
    window.addEventListener('resize', checkIfMobile);
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);
  
  if (!images || images.length === 0) return null;
  
  const isFirstImage = currentIndex === 0;
  const isLastImage = currentIndex === images.length - 1;
  
  const handlePrev = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };
  
  const handleNext = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };
  
  const goToSlide = (index, e) => {
    e.stopPropagation();
    setCurrentIndex(index);
  };
  
  // Handle touch events for swipe functionality
  const handleTouchStart = (e) => {
    setTouchStartX(e.touches[0].clientX);
  };
  
  const handleTouchMove = (e) => {
    setTouchEndX(e.touches[0].clientX);
  };
  
  const handleTouchEnd = (e) => {
    e.stopPropagation(); // Prevent triggering parent events
    
    // Min swipe distance threshold (in pixels)
    const minSwipeDistance = 50;
    
    if (touchStartX && touchEndX) {
      const distance = touchStartX - touchEndX;
      
      if (Math.abs(distance) > minSwipeDistance) {
        if (distance > 0) {
          // Swipe left - show next image
          if (!isLastImage) handleNext(e);
        } else {
          // Swipe right - show previous image
          if (!isFirstImage) handlePrev(e);
        }
      }
    }
    
    // Reset values
    setTouchStartX(0);
    setTouchEndX(0);
  };
  
  return (
    <div 
      className={`relative w-full ${height} mb-2 rounded-lg overflow-hidden`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Current image */}
      <Image 
        src={images[currentIndex]} 
        alt={`Image ${currentIndex + 1}`}
        fill 
        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
        className={`rounded-lg ${objectFit}`}
      />
      
      {/* Image counter */}
      <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-md">
        {currentIndex + 1} / {images.length}
      </div>
      
      {/* Navigation controls (only show if multiple images) */}
      {images.length > 1 && (
        <>
          {/* Previous button - hidden on first image */}
          {!isFirstImage && (
            <button 
              onClick={handlePrev}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 rounded-full p-1 md:p-1.5 text-white hover:bg-black/70 transition-colors"
              aria-label="Previous image"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          
          {/* Next button - hidden on last image */}
          {!isLastImage && (
            <button 
              onClick={handleNext}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 rounded-full p-1 md:p-1.5 text-white hover:bg-black/70 transition-colors"
              aria-label="Next image"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
          
          {/* Image indicator dots */}
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-2">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={(e) => goToSlide(index, e)}
                className={`w-2 h-2 md:w-2.5 md:h-2.5 rounded-full transition-all ${
                  index === currentIndex 
                    ? 'bg-white scale-110' 
                    : 'bg-white/50 hover:bg-white/80'
                }`}
                aria-label={`Go to image ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
      
      {/* Swipe hint for mobile users - shown on first view */}
      {images.length > 1 && isMobileView && (
        <div className="absolute bottom-10 left-0 right-0 flex justify-center pointer-events-none">
          <div className="bg-black/60 text-white text-xs px-3 py-1.5 rounded-full animate-pulse">
            Swipe to navigate
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageSlider;