'use client';

import React, { useState } from 'react';
import Image from 'next/image';

const ImageSlider = ({ images, height = 'h-48', objectFit = 'object-cover' }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
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
  
  return (
    <div className={`relative w-full ${height} mb-2 rounded-lg overflow-hidden`}>
      {/* Current image */}
      <Image 
        src={images[currentIndex]} 
        alt={`Image ${currentIndex + 1}`}
        fill 
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
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 rounded-full p-1 text-white hover:bg-black/70 transition-colors"
              aria-label="Previous image"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          
          {/* Next button - hidden on last image */}
          {!isLastImage && (
            <button 
              onClick={handleNext}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 rounded-full p-1 text-white hover:bg-black/70 transition-colors"
              aria-label="Next image"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                className={`w-2.5 h-2.5 rounded-full transition-all ${
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
    </div>
  );
};

export default ImageSlider;