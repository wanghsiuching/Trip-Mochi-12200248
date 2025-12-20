
import React, { useState, useRef, useEffect } from 'react';

interface LightboxProps {
    images: string[];
    initialIndex?: number;
    onClose: () => void;
}

export const Lightbox: React.FC<LightboxProps> = ({ images, initialIndex = 0, onClose }) => {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    
    // Zoom & Pan State
    const [scale, setScale] = useState(1);
    const [translate, setTranslate] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    
    // Swipe State (Horizontal navigation when not zoomed)
    const [swipeOffset, setSwipeOffset] = useState(0);
    const [isSwiping, setIsSwiping] = useState(false);

    // Refs for gesture handling
    const containerRef = useRef<HTMLDivElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);
    
    // Gesture state refs (mutable without re-render)
    const lastTouchDistance = useRef<number | null>(null);
    const dragStart = useRef<{ x: number, y: number } | null>(null);
    const startTranslate = useRef<{ x: number, y: number }>({ x: 0, y: 0 });
    const swipeStart = useRef<{ x: number, y: number } | null>(null);
    
    // Double tap timing
    const lastTapTime = useRef<number>(0);

    // Reset on open
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    // Helper: Reset zoom when changing images
    const resetZoom = () => {
        setScale(1);
        setTranslate({ x: 0, y: 0 });
        setSwipeOffset(0);
    };

    const handlePrev = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
            resetZoom();
        }
    };

    const handleNext = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (currentIndex < images.length - 1) {
            setCurrentIndex(prev => prev + 1);
            resetZoom();
        }
    };

    const clamp = (num: number, min: number, max: number) => Math.min(Math.max(num, min), max);
    const getDistance = (touches: React.TouchList) => {
        return Math.hypot(
            touches[0].clientX - touches[1].clientX,
            touches[0].clientY - touches[1].clientY
        );
    };

    // --- Event Handlers ---

    // 1. Wheel Zoom (Desktop)
    const handleWheel = (e: React.WheelEvent) => {
        e.stopPropagation();
        const delta = -e.deltaY * 0.005;
        const newScale = clamp(scale + delta, 1, 5);
        setScale(newScale);
        if (newScale === 1) setTranslate({ x: 0, y: 0 });
    };

    // 2. Touch Start (Mobile)
    const handleTouchStart = (e: React.TouchEvent) => {
        e.stopPropagation(); // Prevent background scroll
        
        if (e.touches.length === 2) {
            // Pinch Start
            lastTouchDistance.current = getDistance(e.touches);
            setIsDragging(false);
            setIsSwiping(false);
        } else if (e.touches.length === 1) {
            // Check Double Tap
            const now = Date.now();
            if (now - lastTapTime.current < 300) {
                handleDoubleTap(e);
            } else {
                // If Zoomed -> Pan Mode
                if (scale > 1) {
                    setIsDragging(true);
                    dragStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
                    startTranslate.current = { ...translate };
                } 
                // If Not Zoomed -> Swipe Mode Check
                else {
                    setIsSwiping(true);
                    swipeStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
                }
            }
            lastTapTime.current = now;
        }
    };

    // 3. Touch Move (Mobile)
    const handleTouchMove = (e: React.TouchEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (e.touches.length === 2 && lastTouchDistance.current !== null) {
            // Pinch Zooming
            const dist = getDistance(e.touches);
            const delta = dist - lastTouchDistance.current;
            const newScale = clamp(scale + delta * 0.005, 1, 5);
            setScale(newScale);
            lastTouchDistance.current = dist;
        } else if (e.touches.length === 1) {
            if (scale > 1 && isDragging && dragStart.current) {
                // Panning Zoomed Image
                const dx = e.touches[0].clientX - dragStart.current.x;
                const dy = e.touches[0].clientY - dragStart.current.y;
                setTranslate({ x: startTranslate.current.x + dx, y: startTranslate.current.y + dy });
            } else if (scale === 1 && isSwiping && swipeStart.current) {
                // Horizontal Swipe for Navigation
                const dx = e.touches[0].clientX - swipeStart.current.x;
                // Only swipe if mostly horizontal movement to prevent accidental swipes when scrolling vertically (though body is locked)
                setSwipeOffset(dx);
            }
        }
    };

    // 4. Touch End (Mobile)
    const handleTouchEnd = () => {
        lastTouchDistance.current = null;
        setIsDragging(false);
        dragStart.current = null;

        // Handle Zoom Bounce Back
        if (scale < 1) {
            setScale(1);
            setTranslate({ x: 0, y: 0 });
        }

        // Handle Swipe Navigation
        if (isSwiping) {
            const threshold = 50; // min distance to trigger swipe
            if (swipeOffset > threshold && currentIndex > 0) {
                handlePrev();
            } else if (swipeOffset < -threshold && currentIndex < images.length - 1) {
                handleNext();
            }
            setSwipeOffset(0);
            setIsSwiping(false);
            swipeStart.current = null;
        }
    };

    // 5. Double Tap Logic
    const handleDoubleTap = (e: React.TouchEvent | React.MouseEvent) => {
        if (scale > 1) {
            resetZoom();
        } else {
            setScale(2.5);
            setTranslate({ x: 0, y: 0 }); // Center zoom for simplicity
        }
    };

    const currentImage = images[currentIndex];

    return (
        <div 
            className="fixed inset-0 bg-black/95 z-[9999] flex items-center justify-center touch-none overflow-hidden"
            onClick={onClose}
        >
            {/* Top Bar */}
            <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-50 pointer-events-none">
                <span className="text-white font-bold bg-black/30 px-3 py-1 rounded-full backdrop-blur-md">
                    {currentIndex + 1} / {images.length}
                </span>
                <button 
                    className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-full text-white flex items-center justify-center hover:bg-white/20 transition-colors pointer-events-auto"
                    onClick={(e) => { e.stopPropagation(); onClose(); }}
                >
                    <i className="fa-solid fa-xmark text-lg"></i>
                </button>
            </div>

            {/* Navigation Arrows (Desktop) */}
            {currentIndex > 0 && (
                <button 
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white flex items-center justify-center z-50 hidden lg:flex transition-all"
                    onClick={handlePrev}
                >
                    <i className="fa-solid fa-chevron-left"></i>
                </button>
            )}
            {currentIndex < images.length - 1 && (
                <button 
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white flex items-center justify-center z-50 hidden lg:flex transition-all"
                    onClick={handleNext}
                >
                    <i className="fa-solid fa-chevron-right"></i>
                </button>
            )}

            {/* Bottom Hint */}
            <div className="absolute bottom-10 left-0 right-0 text-center pointer-events-none text-white/50 text-xs font-bold">
                {scale === 1 ? '左右滑動切換 • 雙擊縮放' : '雙擊還原'}
            </div>

            {/* Image Container */}
            <div 
                ref={containerRef}
                className="relative w-full h-full flex items-center justify-center p-2"
                onWheel={handleWheel}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                <img 
                    ref={imageRef}
                    src={currentImage} 
                    alt={`Preview ${currentIndex + 1}`}
                    className="max-w-full max-h-full object-contain transition-transform ease-out origin-center select-none"
                    style={{ 
                        transform: `translate(${translate.x + swipeOffset}px, ${translate.y}px) scale(${scale})`,
                        transitionDuration: isDragging || isSwiping ? '0ms' : '200ms',
                        cursor: scale > 1 ? 'grab' : 'default' 
                    }}
                    onClick={(e) => e.stopPropagation()} 
                    draggable={false}
                />
            </div>
        </div>
    );
};
