'use client';

import { useRef, useEffect, useState } from 'react';
import { useScroll, useMotionValueEvent } from 'framer-motion';

interface Frame {
  img: HTMLImageElement;
  loaded: boolean;
}

const TOTAL_FRAMES = 202;
const FRAME_PREFIX = '/Frames/frame_';

export default function CSMTScrollScene() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);

  const imagesRef = useRef<Frame[]>([]);
  const currentFrameRef = useRef<number>(0);
  const renderedFrameRef = useRef<number>(-1);
  
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);

  // Find parent section (provided by page.tsx) and set up scroll tracking
  useEffect(() => {
    if (!wrapperRef.current) return;
    const section = wrapperRef.current.closest('section');
    if (section) {
      scrollContainerRef.current = section as HTMLElement;
    }
  }, []);

  // Framer Motion scroll tracking - target the parent section with h-[400vh]
  const { scrollYProgress } = useScroll({
    target: scrollContainerRef as any, // Ref gets populated in useEffect above
    offset: ['start end', 'end start'],
  });

  // Preload all frames before animation starts
  useEffect(() => {
    const frames: Frame[] = [];
    let loadedCount = 0;

    const preloadFrame = (index: number): Promise<void> => {
      return new Promise((resolve) => {
        const img = new Image();
        const paddedIndex = String(index + 1).padStart(4, '0');
        img.src = `${FRAME_PREFIX}${paddedIndex}.webp`;

        img.onload = () => {
          frames[index] = { img, loaded: true };
          loadedCount++;
          setLoadProgress(Math.round((loadedCount / TOTAL_FRAMES) * 100));
          resolve();
        };

        img.onerror = () => {
          console.warn(`Failed to load frame ${paddedIndex}`);
          frames[index] = { img, loaded: false };
          loadedCount++;
          setLoadProgress(Math.round((loadedCount / TOTAL_FRAMES) * 100));
          resolve();
        };
      });
    };

    // Load all frames in parallel
    (async () => {
      const promises = Array.from({ length: TOTAL_FRAMES }, (_, i) => preloadFrame(i));
      await Promise.all(promises);
      imagesRef.current = frames;
      setIsLoaded(true);
    })();
  }, []);

  // Setup canvas and RAF animation loop
  useEffect(() => {
    if (!canvasRef.current || !isLoaded) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Enable high-quality rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    contextRef.current = ctx;

    // Initialize canvas to fill viewport (fullscreen)
    const initializeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;

      // Force canvas to fill entire viewport
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;

      // Set CSS size to viewport
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;

      // Scale context to account for DPR
      ctx.scale(dpr, dpr);
    };

    initializeCanvas();

    // Handle window resize
    const handleResize = () => {
      initializeCanvas();
    };

    window.addEventListener('resize', handleResize);

    // RAF animation loop - only render when frame changes
    let animationFrameId: number;

    const render = () => {
      // Skip if frame hasn't changed (prevents flicker and unnecessary renders)
      if (renderedFrameRef.current === currentFrameRef.current) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      const frame = imagesRef.current[currentFrameRef.current];
      if (frame?.loaded && ctx) {
        const img = frame.img;
        const dpr = window.devicePixelRatio || 1;
        const canvasW = window.innerWidth;
        const canvasH = window.innerHeight;

        // Clear canvas
        ctx.clearRect(0, 0, canvasW, canvasH);

        // COVER scaling: fill viewport, crop image as needed (cinematic full-bleed)
        const scale = Math.max(canvasW / img.width, canvasH / img.height);
        const drawWidth = img.width * scale;
        const drawHeight = img.height * scale;

        // Center align image
        const dx = (canvasW - drawWidth) / 2;
        const dy = (canvasH - drawHeight) / 2;

        // Draw image with cinematic crop
        ctx.drawImage(img, dx, dy, drawWidth, drawHeight);

        // Update rendered frame reference
        renderedFrameRef.current = currentFrameRef.current;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [isLoaded]);

  // Map scroll progress to frame index
  useMotionValueEvent(scrollYProgress, 'change', (latest) => {
    const frameIndex = Math.floor(latest * (TOTAL_FRAMES - 1));
    currentFrameRef.current = Math.max(0, Math.min(frameIndex, TOTAL_FRAMES - 1));
  });

  return (
    <div ref={wrapperRef} className="relative w-screen h-screen">
      {!isLoaded ? (
        // Loading state
        <div className="flex items-center justify-center w-screen h-screen bg-black">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white text-sm font-medium">
              Loading frames... {loadProgress}%
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Canvas: Image sequence renderer - fullscreen with COVER scaling */}
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 w-screen h-screen block bg-black"
            style={{ display: 'block', zIndex: 0 }}
          />

          {/* Grain overlay - subtle film grain for cinematic feel */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' seed='2'/%3E%3C/filter%3E%3Crect width='400' height='400' filter='url(%23noise)'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'repeat',
              opacity: 0.03,
              mixBlendMode: 'multiply',
            }}
          />

          {/* Vignette overlay - subtle darkening at edges */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse at center, rgba(0,0,0,0) 0%, rgba(0,0,0,0.4) 100%)',
              opacity: 0.4,
            }}
          />
        </>
      )}
    </div>
  );
}
