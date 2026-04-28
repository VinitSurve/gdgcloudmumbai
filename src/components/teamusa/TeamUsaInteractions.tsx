"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Theme = "light" | "dark";

type ModalState = {
  src: string;
  title: string;
} | null;

type SectionDef = {
  id: string;
  label: string;
  selector: string;
  theme: Theme;
};

type ToolAssetConfig = {
  x: number;
  y: number;
  scale: number;
  swirlSpeed: number;
};

type ToolVideoConfig = {
  initial: {
    x: number;
    y: number;
    scale: number;
  };
  swirlSpeed: number;
};

type ToolSwirlConfig = {
  radiusX: number;
  radiusY: number;
  rotationAmount: number;
  scaleDuringSwirl: number;
};

type ToolPhaseProgress = {
  progress: number;
  currentPhase: number;
  phase1Progress: number;
  phase2Progress: number;
  phase3Progress: number;
  stepsProgress: number;
};

type AthleteTransform = {
  translateX: string;
  translateY: string;
  rotate: string;
  scale: number;
  zIndex: number;
};

const ATHLETE_CARD_MEDIA = [
  { src: "/assets/meet-the-athletes/abhishek_sharma_RQClIHO.webp", alt: "Abhishek Sharma" },
  { src: "/assets/meet-the-athletes/rushabh%20mahale.webp", alt: "Rushabh Mahale" },
  { src: "/assets/meet-the-athletes/Niharika%20Dhanik.webp", alt: "Niharika Dhanik" },
] as const;

const SECTION_DEFS: SectionDef[] = [
  { id: "hero", label: "Hero", selector: '[data-section="hero"]', theme: "light" },
  {
    id: "challenge",
    label: "Challenge",
    selector: '[data-section="Challenge"]',
    theme: "dark",
  },
  {
    id: "athletes",
    label: "Athletes",
    selector: '[data-section="Athletes"]',
    theme: "light",
  },
  { id: "tool", label: "Tool", selector: '[data-section="Tool"]', theme: "light" },
  { id: "build", label: "Build", selector: '[data-section="Tech"]', theme: "dark" },
  {
    id: "visualizing",
    label: "Visualizing",
    selector: '[data-section="Visualiazing"]',
    theme: "light",
  },
  {
    id: "gallery",
    label: "Gallery",
    selector: '[data-section="Gallery"]',
    theme: "light",
  },
  { id: "beyond", label: "Beyond", selector: '[data-section="Beyond"]', theme: "dark" },
];

const TOOL_PHASES = {
  TITLE_IMAGES_END: 0.12,
  SWIRL_END: 0.28,
  STEPS_START: 0.29,
  STEPS_END: 0.85,
} as const;

const TOOL_ASSETS_DESKTOP: ToolAssetConfig[] = [
  { x: -425, y: 275, scale: 0.75, swirlSpeed: 1.2 },
  { x: 250, y: 150, scale: 0.9, swirlSpeed: 1.5 },
  { x: 200, y: -380, scale: 0.5, swirlSpeed: 0.8 },
  { x: -620, y: 50, scale: 0.9, swirlSpeed: 1 },
];

const TOOL_ASSETS_MOBILE: ToolAssetConfig[] = [
  { x: -225, y: -325, scale: 0.7, swirlSpeed: 1.2 },
  { x: -25, y: -250, scale: 0.85, swirlSpeed: 1.5 },
  { x: 25, y: 200, scale: 0.75, swirlSpeed: 0.8 },
  { x: -250, y: 175, scale: 0.9, swirlSpeed: 1 },
];

const TOOL_VIDEO_DESKTOP: ToolVideoConfig = {
  initial: { x: 220, y: -60, scale: 0.25 },
  swirlSpeed: 0.85,
};

const TOOL_VIDEO_MOBILE: ToolVideoConfig = {
  initial: { x: -130, y: 50, scale: 0.5 },
  swirlSpeed: 0.8,
};

const TOOL_SWIRL_DESKTOP: ToolSwirlConfig = {
  radiusX: 400,
  radiusY: 200,
  rotationAmount: 15,
  scaleDuringSwirl: 1,
};

const TOOL_SWIRL_MOBILE: ToolSwirlConfig = {
  radiusX: 200,
  radiusY: 100,
  rotationAmount: 10,
  scaleDuringSwirl: 1,
};

const ATHLETE_FRONT_STACK: Omit<AthleteTransform, "zIndex">[] = [
  { translateX: "-51%", translateY: "-58%", rotate: "2deg", scale: 0.96 },
  { translateX: "-50%", translateY: "-62%", rotate: "-3.1deg", scale: 0.9 },
  { translateX: "-43%", translateY: "-60%", rotate: "-2.59deg", scale: 0.89 },
  { translateX: "-50%", translateY: "-50%", rotate: "2.09deg", scale: 1 },
];

const ATHLETE_ACTIVE_STACK: Omit<AthleteTransform, "zIndex">[] = [
  { translateX: "-50%", translateY: "-50%", rotate: "-2deg", scale: 1 },
  { translateX: "-50%", translateY: "-50%", rotate: "-1.47deg", scale: 1 },
  { translateX: "-50%", translateY: "-50%", rotate: "1deg", scale: 1 },
  { translateX: "-50%", translateY: "-50%", rotate: "2.09deg", scale: 1 },
];

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function rangeProgress(value: number, start: number, end: number): number {
  return clamp((value - start) / (end - start), 0, 1);
}

function getSectionProgress(section: HTMLElement): number {
  const rect = section.getBoundingClientRect();
  const viewportHeight = window.innerHeight || 1;
  const total = rect.height + viewportHeight;

  if (total <= 0) {
    return 0;
  }

  const passed = viewportHeight - rect.top;
  return clamp(passed / total, 0, 1);
}

function getStickySequenceProgress(section: HTMLElement): number {
  const rect = section.getBoundingClientRect();
  const viewportHeight = window.innerHeight || 1;

  if (rect.top > 0) {
    return clamp((1 - rect.top / viewportHeight) * 0.2, 0, 1);
  }

  const overflow = rect.height - viewportHeight;
  if (overflow <= 0) {
    return 0.2;
  }

  return clamp(0.2 + (Math.abs(rect.top) / overflow) * 0.8, 0, 1);
}

function getToolPhaseProgress(progress: number, totalSteps: number): ToolPhaseProgress {
  const stepsRange = TOOL_PHASES.STEPS_END - TOOL_PHASES.STEPS_START;
  const phase1Progress = Math.min(progress / TOOL_PHASES.TITLE_IMAGES_END, 1);
  const phase2Progress = clamp(
    (progress - TOOL_PHASES.TITLE_IMAGES_END) / (TOOL_PHASES.SWIRL_END - TOOL_PHASES.TITLE_IMAGES_END),
    0,
    1
  );
  const phase3Progress = clamp(
    (progress - TOOL_PHASES.SWIRL_END) / (TOOL_PHASES.STEPS_START - TOOL_PHASES.SWIRL_END),
    0,
    1
  );
  const stepsProgress = clamp((progress - TOOL_PHASES.STEPS_START) / stepsRange, 0, 1);

  let currentPhase = 1;
  if (progress < TOOL_PHASES.TITLE_IMAGES_END) {
    currentPhase = 1;
  } else if (progress < TOOL_PHASES.SWIRL_END) {
    currentPhase = 2;
  } else if (progress < TOOL_PHASES.STEPS_START) {
    currentPhase = 3;
  } else {
    currentPhase = Math.min(3 + totalSteps, 4 + Math.floor(stepsProgress * totalSteps));
  }

  return {
    progress,
    currentPhase,
    phase1Progress,
    phase2Progress,
    phase3Progress,
    stepsProgress,
  };
}

function getAthleteTransform(index: number, activeIndex: number): AthleteTransform {
  const diff = index - activeIndex;

  if (diff > 1) {
    return {
      translateX: "-50%",
      translateY: "-50%",
      rotate: "0deg",
      scale: 0.33,
      zIndex: 0,
    };
  }

  if (diff === 1) {
    return {
      translateX: "-50%",
      translateY: "-50%",
      rotate: "0deg",
      scale: 0.33,
      zIndex: 1,
    };
  }

  if (diff === 0) {
    return {
      ...ATHLETE_ACTIVE_STACK[index % ATHLETE_ACTIVE_STACK.length],
      zIndex: 100,
    };
  }

  if (diff === -1) {
    return {
      ...ATHLETE_FRONT_STACK[index % ATHLETE_FRONT_STACK.length],
      zIndex: 99,
    };
  }

  const depth = Math.abs(diff);
  const frontIndex = ((activeIndex - 1) % ATHLETE_FRONT_STACK.length + ATHLETE_FRONT_STACK.length) % ATHLETE_FRONT_STACK.length;
  return {
    ...ATHLETE_FRONT_STACK[frontIndex],
    zIndex: 100 - depth,
  };
}

function getSourceFromContainer(container: HTMLElement): string | null {
  const source = container.querySelector<HTMLSourceElement>("video source")?.getAttribute("src");
  if (source) {
    return source;
  }

  const videoSrc = container.querySelector<HTMLVideoElement>("video")?.getAttribute("src");
  return videoSrc || null;
}

function swapAthleteCardMedia(cards: HTMLElement[]): void {
  cards.forEach((card, index) => {
    const existingVideo = card.querySelector<HTMLVideoElement>("video");
    if (!existingVideo) {
      return;
    }

    const media = ATHLETE_CARD_MEDIA[Math.min(index, ATHLETE_CARD_MEDIA.length - 1)];
    const image = document.createElement("img");
    image.src = media.src;
    image.alt = media.alt;
    image.loading = "lazy";
    image.decoding = "async";
    image.style.position = "absolute";
    image.style.top = "0";
    image.style.left = "0";
    image.style.right = "0";
    image.style.bottom = "0";
    image.style.width = "100%";
    image.style.height = "100%";
    image.style.objectFit = "cover";
    image.tabIndex = index === 0 ? 0 : -1;

    if (index !== 0) {
      image.setAttribute("aria-hidden", "true");
    }

    existingVideo.replaceWith(image);
  });
}

export default function TeamUsaInteractions() {
  const [activeSection, setActiveSection] = useState<string>(SECTION_DEFS[0].id);
  const [navTheme, setNavTheme] = useState<Theme>("light");
  const [navVisible, setNavVisible] = useState(false);
  const [motionPaused, setMotionPaused] = useState(false);
  const [modal, setModal] = useState<ModalState>(null);
  const [follower, setFollower] = useState({ left: 0, width: 0 });

  const navListRef = useRef<HTMLDivElement | null>(null);
  const navItemRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const activeSectionRef = useRef<string>(activeSection);
  const navThemeRef = useRef<Theme>(navTheme);
  const navVisibleRef = useRef<boolean>(navVisible);
  const motionPausedRef = useRef<boolean>(motionPaused);

  useEffect(() => {
    activeSectionRef.current = activeSection;
  }, [activeSection]);

  useEffect(() => {
    navThemeRef.current = navTheme;
  }, [navTheme]);

  useEffect(() => {
    navVisibleRef.current = navVisible;
  }, [navVisible]);

  useEffect(() => {
    motionPausedRef.current = motionPaused;
  }, [motionPaused]);

  useEffect(() => {
    document.documentElement.dataset.motion = motionPaused ? "paused" : "running";

    return () => {
      delete document.documentElement.dataset.motion;
    };
  }, [motionPaused]);

  useEffect(() => {
    if (!modal) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [modal]);

  useEffect(() => {
    const updateFollower = () => {
      const list = navListRef.current;
      const activeItem = navItemRefs.current[activeSectionRef.current];

      if (!list || !activeItem) {
        return;
      }

      setFollower({
        left: activeItem.offsetLeft,
        width: activeItem.offsetWidth,
      });
    };

    updateFollower();
    window.addEventListener("resize", updateFollower);

    return () => {
      window.removeEventListener("resize", updateFollower);
    };
  }, [activeSection]);

  const scrollToSection = useCallback((selector: string) => {
    const target = document.querySelector<HTMLElement>(selector);
    if (!target) {
      return;
    }

    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".teamusa-clone");
    if (!root) {
      return;
    }

    root.classList.add("teamusa-clone--interactive");

    const hero = root.querySelector<HTMLElement>('[data-section="hero"]');
    const backgroundGrid = root.querySelector<HTMLElement>(".background-grid");
    const headerGradient = root.querySelector<HTMLElement>(".header__gradient");

    const blackboxSection = root.querySelector<HTMLElement>(".section-blackbox");
    const blackboxItems = Array.from(
      root.querySelectorAll<HTMLElement>(".section-blackbox .blackbox-item")
    );
    const blackboxVideo = root.querySelector<HTMLElement>(".section-blackbox__video");

    const athletesSection = root.querySelector<HTMLElement>(".section-athletes");
    const athletesCardsContainer = root.querySelector<HTMLElement>(
      ".section-athletes__cards"
    );
    const athleteTabs = Array.from(root.querySelectorAll<HTMLElement>(".section-athletes .athlete-tab"));
    const athleteCards = Array.from(root.querySelectorAll<HTMLElement>(".section-athletes .athlete-card"));
    const athleteQuotes = Array.from(
      root.querySelectorAll<HTMLElement>(".section-athletes .athlete-quote-wrapper")
    );

    swapAthleteCardMedia(athleteCards);

    const toolSection = root.querySelector<HTMLElement>(".section-tool");
    const toolSteps = Array.from(root.querySelectorAll<HTMLElement>(".section-tool__step"));
    const toolVideos = Array.from(
      root.querySelectorAll<HTMLVideoElement>(".section-tool__video-fixed .section-tool__video")
    );
    const toolMedia = Array.from(root.querySelectorAll<HTMLElement>(".section-tool__media"));
    const toolTitle = root.querySelector<HTMLElement>(".section-tool__title");
    const toolVideoFixed = root.querySelector<HTMLElement>(".section-tool__video-fixed");

    const buildSection = root.querySelector<HTMLElement>(".section-build");
    const buildTrack = root.querySelector<HTMLElement>(".section-build__track");

    const visualizingSection = root.querySelector<HTMLElement>(".section-visualizing");
    const visualizingRepeater = root.querySelector<HTMLElement>(".section-visualizing__repeater");
    const visualizingItems = Array.from(
      root.querySelectorAll<HTMLElement>(".section-visualizing .visualizing-item")
    );
    const visualizingVideo = root.querySelector<HTMLElement>(".section-visualizing .visualizing-video");
    const visualizingCenterVideo = root.querySelector<HTMLElement>(
      ".section-visualizing .video-centered"
    );
    const visualizingSlides = Array.from(
      root.querySelectorAll<HTMLElement>(".section-visualizing__videos .video-slide")
    );

    const beyondSection = root.querySelector<HTMLElement>(".section-beyond");
    const beyondItems = Array.from(root.querySelectorAll<HTMLElement>(".section-beyond .beyond-item"));

    const sections = SECTION_DEFS.map((section) => ({
      ...section,
      element: root.querySelector<HTMLElement>(section.selector),
    }));

    let activeAthleteIndex = -1;
    const setAthleteActive = (nextIndex: number) => {
      if (!athleteTabs.length) {
        return;
      }

      const safeIndex = Math.max(0, Math.min(athleteTabs.length - 1, nextIndex));
      if (safeIndex === activeAthleteIndex) {
        return;
      }

      activeAthleteIndex = safeIndex;

      athleteTabs.forEach((tab, tabIndex) => {
        tab.classList.toggle("active", tabIndex === safeIndex);
        tab.classList.toggle("passed", tabIndex < safeIndex);

        if (tabIndex === safeIndex) {
          tab.setAttribute("aria-current", "true");
        } else {
          tab.removeAttribute("aria-current");
        }
      });

      athleteCards.forEach((card, cardIndex) => {
        const isActive = cardIndex === safeIndex;
        card.classList.toggle("active", isActive);

        const transform = getAthleteTransform(cardIndex, safeIndex);
        card.style.zIndex = String(transform.zIndex);
        card.style.transform = `translateX(${transform.translateX}) translateY(${transform.translateY}) rotate(${transform.rotate}) scale(${transform.scale})`;

        const cardVideo = card.querySelector<HTMLVideoElement>("video");
        if (cardVideo) {
          if (isActive) {
            cardVideo.tabIndex = 0;
            cardVideo.removeAttribute("aria-hidden");
            void cardVideo.play().catch(() => {});
          } else {
            cardVideo.tabIndex = -1;
            cardVideo.setAttribute("aria-hidden", "true");
            cardVideo.pause();
          }
          return;
        }

        const cardImage = card.querySelector<HTMLImageElement>("img");
        if (!cardImage) {
          return;
        }

        if (isActive) {
          cardImage.tabIndex = 0;
          cardImage.removeAttribute("aria-hidden");
        } else {
          cardImage.tabIndex = -1;
          cardImage.setAttribute("aria-hidden", "true");
        }
      });

      athleteQuotes.forEach((quote, quoteIndex) => {
        const isActive = quoteIndex === safeIndex;
        quote.classList.toggle("active", isActive);
        quote.style.opacity = isActive ? "1" : "0";
      });
    };

    const athleteTabCleanups: Array<() => void> = [];
    athleteTabs.forEach((tab, tabIndex) => {
      const onClick = () => {
        setAthleteActive(tabIndex);
      };

      const onKeyDown = (event: KeyboardEvent) => {
        if (event.key !== "Enter" && event.key !== " ") {
          return;
        }

        event.preventDefault();
        setAthleteActive(tabIndex);
      };

      tab.addEventListener("click", onClick);
      tab.addEventListener("keydown", onKeyDown);
      athleteTabCleanups.push(() => {
        tab.removeEventListener("click", onClick);
        tab.removeEventListener("keydown", onKeyDown);
      });
    });

    setAthleteActive(0);

    let activeToolStep = -1;
    let activeToolPhase = -1;
    const phaseClasses = ["phase-1", "phase-2", "phase-3", "phase-4", "phase-5", "phase-6", "phase-7"];

    const setToolStep = (nextStep: number, phase: number) => {
      if (!toolSteps.length) {
        return;
      }

      const safeStep = Math.max(0, Math.min(toolSteps.length - 1, nextStep));
      const phaseChanged = phase !== activeToolPhase;
      if (safeStep === activeToolStep && !phaseChanged) {
        return;
      }

      activeToolStep = safeStep;
      activeToolPhase = phase;

      toolSteps.forEach((step, stepIndex) => {
        step.classList.toggle("is-active", stepIndex === safeStep);
      });

      toolVideos.forEach((video, videoIndex) => {
        video.style.opacity = videoIndex === safeStep ? "1" : "0";
      });

      if (toolVideoFixed) {
        toolVideoFixed.classList.remove(...phaseClasses);
        toolVideoFixed.classList.add(`phase-${Math.max(1, Math.min(7, phase))}`);
      }

      if (toolTitle) {
        toolTitle.style.color = phase > 3 ? "var(--color-white)" : "var(--color-dark)";
      }
    };

    setToolStep(0, 1);

    const sliderCleanups: Array<() => void> = [];
    const sliders = Array.from(root.querySelectorAll<HTMLElement>(".section-edge__slider"));

    sliders.forEach((slider) => {
      const viewport = slider.querySelector<HTMLElement>(".section-edge__slider__viewport");
      if (!viewport) {
        return;
      }

      const prevButton = slider.querySelector<HTMLButtonElement>(".slider-btn--prev");
      const nextButton = slider.querySelector<HTMLButtonElement>(".slider-btn--next");

      const updateButtons = () => {
        const maxScroll = viewport.scrollWidth - viewport.clientWidth;

        if (prevButton) {
          prevButton.disabled = viewport.scrollLeft <= 2;
        }

        if (nextButton) {
          nextButton.disabled = viewport.scrollLeft >= maxScroll - 2;
        }
      };

      const scrollAmount = () => Math.max(280, Math.floor(viewport.clientWidth * 0.85));

      const onPrevClick = () => {
        viewport.scrollBy({ left: -scrollAmount(), behavior: "smooth" });
      };

      const onNextClick = () => {
        viewport.scrollBy({ left: scrollAmount(), behavior: "smooth" });
      };

      prevButton?.addEventListener("click", onPrevClick);
      nextButton?.addEventListener("click", onNextClick);
      viewport.addEventListener("scroll", updateButtons, { passive: true });

      let dragging = false;
      let startX = 0;
      let startScrollLeft = 0;

      const onPointerDown = (event: PointerEvent) => {
        dragging = true;
        startX = event.clientX;
        startScrollLeft = viewport.scrollLeft;
        viewport.setPointerCapture(event.pointerId);
      };

      const onPointerMove = (event: PointerEvent) => {
        if (!dragging) {
          return;
        }

        const delta = event.clientX - startX;
        viewport.scrollLeft = startScrollLeft - delta;
      };

      const onPointerEnd = (event: PointerEvent) => {
        if (!dragging) {
          return;
        }

        dragging = false;
        if (viewport.hasPointerCapture(event.pointerId)) {
          viewport.releasePointerCapture(event.pointerId);
        }
      };

      viewport.addEventListener("pointerdown", onPointerDown);
      viewport.addEventListener("pointermove", onPointerMove);
      viewport.addEventListener("pointerup", onPointerEnd);
      viewport.addEventListener("pointercancel", onPointerEnd);
      viewport.addEventListener("pointerleave", onPointerEnd);

      updateButtons();

      sliderCleanups.push(() => {
        prevButton?.removeEventListener("click", onPrevClick);
        nextButton?.removeEventListener("click", onNextClick);
        viewport.removeEventListener("scroll", updateButtons);
        viewport.removeEventListener("pointerdown", onPointerDown);
        viewport.removeEventListener("pointermove", onPointerMove);
        viewport.removeEventListener("pointerup", onPointerEnd);
        viewport.removeEventListener("pointercancel", onPointerEnd);
        viewport.removeEventListener("pointerleave", onPointerEnd);
      });
    });

    const onRootClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) {
        return;
      }

      const trigger = target.closest<HTMLElement>(
        ".hero__video, .video-item__wrapper.has-link, .button-video--watch"
      );

      if (!trigger) {
        return;
      }

      event.preventDefault();

      const host =
        trigger.closest<HTMLElement>(
          ".hero, .hero__video, .athlete-card, .athlete-quote-wrapper, .video-item, .section-tool, .section-visualizing, .section-blackbox"
        ) || trigger;

      const source = getSourceFromContainer(host);
      if (!source) {
        return;
      }

      const title =
        trigger.getAttribute("aria-label") ||
        host.querySelector<HTMLVideoElement>("video")?.getAttribute("title") ||
        "Team USA video";

      setModal({ src: source, title });
    };

    const onRootKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) {
        return;
      }

      const isClickable = target.closest(
        ".hero__video, .video-item__wrapper.has-link, .section-athletes .athlete-tab"
      );

      if (!isClickable) {
        return;
      }

      if (event.key !== "Enter" && event.key !== " ") {
        return;
      }

      event.preventDefault();
      target.click();
    };

    const onWindowKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setModal(null);
      }
    };

    root.addEventListener("click", onRootClick);
    root.addEventListener("keydown", onRootKeyDown);
    window.addEventListener("keydown", onWindowKeyDown);

    const toolSpiralState = new Map<number, { x: number; y: number; scale: number }>();

    const getSequenceOpacity = (progress: number, index: number, total: number): number => {
      if (total <= 0) {
        return 0;
      }

      const slice = 0.9 / total;
      const start = 0.1 + index * slice;
      const end = 0.1 + (index + 1) * slice;
      const fadeWindow = 0.1 * slice;

      if (progress >= start && progress <= end) {
        if (progress <= start + fadeWindow) {
          return (progress - start) / fadeWindow;
        }
        if (progress >= end - fadeWindow) {
          return (end - progress) / fadeWindow;
        }
        return 1;
      }

      return 0;
    };

    let rafId = 0;
    let keepAnimatingUntil = 0;

    const runFrame = () => {
      rafId = 0;

      const now = performance.now();
      const isMobile = window.innerWidth <= 900;
      const scrollMax = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const globalProgress = clamp(window.scrollY / scrollMax, 0, 1);

      if (headerGradient) {
        headerGradient.style.transform = `scaleX(${globalProgress.toFixed(4)})`;
      }

      let currentSection = SECTION_DEFS[0];
      const markerY = window.innerHeight * 0.42;

      sections.forEach((section) => {
        const element = section.element;
        if (!element) {
          return;
        }

        const rect = element.getBoundingClientRect();
        if (rect.top <= markerY && rect.bottom > markerY) {
          currentSection = section;
        }
      });

      if (activeSectionRef.current !== currentSection.id) {
        activeSectionRef.current = currentSection.id;
        setActiveSection(currentSection.id);
      }

      if (navThemeRef.current !== currentSection.theme) {
        navThemeRef.current = currentSection.theme;
        setNavTheme(currentSection.theme);
      }

      const shouldShowNav = hero
        ? hero.getBoundingClientRect().bottom < window.innerHeight * 0.65
        : window.scrollY > 160;

      if (navVisibleRef.current !== shouldShowNav) {
        navVisibleRef.current = shouldShowNav;
        setNavVisible(shouldShowNav);
      }

      if (backgroundGrid) {
        backgroundGrid.classList.toggle("background-grid--dark", currentSection.theme === "dark");
        backgroundGrid.classList.toggle("background-grid--light", currentSection.theme !== "dark");
      }

      document.documentElement.dataset.theme = currentSection.theme;

      if (!motionPausedRef.current) {
        if (blackboxSection && blackboxItems.length) {
          const progress = getStickySequenceProgress(blackboxSection);

          blackboxItems.forEach((item, index) => {
            const opacity = getSequenceOpacity(progress, index, blackboxItems.length);
            item.style.opacity = opacity.toFixed(3);
            item.style.visibility = opacity > 0 ? "visible" : "hidden";
          });

          const blackboxVideoElement = blackboxVideo?.querySelector<HTMLVideoElement>("video");
          if (
            blackboxVideoElement &&
            Number.isFinite(blackboxVideoElement.duration) &&
            blackboxVideoElement.duration > 0
          ) {
            const targetTime = progress * blackboxVideoElement.duration;
            if (Math.abs(blackboxVideoElement.currentTime - targetTime) > 0.033) {
              blackboxVideoElement.currentTime = targetTime;
            }
          }

          if (blackboxVideo) {
            blackboxVideo.style.opacity = String(Math.max(0.25, rangeProgress(progress, 0.48, 0.96)));
          }
        }

        if (athletesSection && athleteTabs.length) {
          const rect = athletesSection.getBoundingClientRect();
          const viewportHeight = window.innerHeight || 1;
          const scrollRange = rect.height - viewportHeight;
          const progress = scrollRange > 0 ? clamp(Math.abs(rect.top) / scrollRange, 0, 1) : 0;
          const sequenceProgress = Math.min(progress, 0.9999);
          const nextIndex = clamp(
            Math.floor(sequenceProgress * athleteTabs.length),
            0,
            athleteTabs.length - 1
          );
          setAthleteActive(nextIndex);

          if (athletesCardsContainer) {
            let parallaxY = 0;
            if (!isMobile) {
              if (rect.top > 0) {
                parallaxY = 80 * (rect.top / viewportHeight);
              } else if (rect.bottom <= viewportHeight && rect.bottom > 0) {
                parallaxY = -80 * (1 - rect.bottom / viewportHeight);
              } else if (rect.bottom <= 0) {
                parallaxY = -80;
              }
            }

            athletesCardsContainer.style.transform = `translate3d(0, ${parallaxY.toFixed(2)}px, 0)`;
          }
        }

        if (toolSection) {
          const progress = getSectionProgress(toolSection);
          const phase = getToolPhaseProgress(progress, toolSteps.length);
          const stepIndex =
            phase.currentPhase <= 3
              ? 0
              : clamp(Math.floor(phase.stepsProgress * toolSteps.length), 0, toolSteps.length - 1);

          setToolStep(stepIndex, phase.currentPhase);

          const toolAssetConfig = isMobile ? TOOL_ASSETS_MOBILE : TOOL_ASSETS_DESKTOP;
          const toolVideoConfig = isMobile ? TOOL_VIDEO_MOBILE : TOOL_VIDEO_DESKTOP;
          const swirlConfig = isMobile ? TOOL_SWIRL_MOBILE : TOOL_SWIRL_DESKTOP;

          toolMedia.forEach((media, index) => {
            const config = toolAssetConfig[index] || toolAssetConfig[0];
            let x = 0;
            let y = 0;
            let scale = 0;
            let opacity = 1;

            if (phase.progress < TOOL_PHASES.TITLE_IMAGES_END) {
              const threshold = 0.2 + 0.15 * index;
              const reveal = clamp((phase.phase1Progress - threshold) / (1 - threshold), 0, 1);
              x = config.x;
              y = config.y;
              scale = config.scale * reveal;
            } else if (phase.progress < TOOL_PHASES.SWIRL_END) {
              const angle =
                (phase.phase2Progress * swirlConfig.rotationAmount * Math.PI * config.swirlSpeed) / 180;
              x = config.x * Math.cos(angle) - config.y * Math.sin(angle);
              y = config.x * Math.sin(angle) + config.y * Math.cos(angle);
              scale = config.scale * swirlConfig.scaleDuringSwirl;
              toolSpiralState.set(index, { x, y, scale });
            } else {
              const easeOut = 1 - phase.phase3Progress;
              const cached = toolSpiralState.get(index);
              if (cached) {
                x = cached.x * easeOut;
                y = cached.y * easeOut;
                scale = cached.scale * easeOut;
              } else {
                x = config.x * easeOut;
                y = config.y * easeOut;
                scale = config.scale * easeOut;
              }
              opacity = clamp(easeOut, 0, 1);
            }

            media.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) scale(${scale.toFixed(4)})`;
            media.style.opacity = opacity.toFixed(3);
          });

          if (toolVideoFixed) {
            let x = 0;
            let y = 0;
            let scale = 1;

            if (phase.progress < TOOL_PHASES.TITLE_IMAGES_END) {
              x = toolVideoConfig.initial.x;
              y = toolVideoConfig.initial.y;
              scale = toolVideoConfig.initial.scale * phase.phase1Progress;
            } else if (phase.progress < TOOL_PHASES.SWIRL_END) {
              const angle =
                (phase.phase2Progress * swirlConfig.rotationAmount * Math.PI * toolVideoConfig.swirlSpeed) /
                180;
              x =
                toolVideoConfig.initial.x * Math.cos(angle) -
                toolVideoConfig.initial.y * Math.sin(angle);
              y =
                toolVideoConfig.initial.x * Math.sin(angle) +
                toolVideoConfig.initial.y * Math.cos(angle);
              scale = toolVideoConfig.initial.scale * swirlConfig.scaleDuringSwirl;
            }

            if (phase.progress >= TOOL_PHASES.SWIRL_END) {
              toolVideoFixed.style.transform = isMobile
                ? "translate(0px, 0px) scale(1)"
                : "translate(0px, -50%) scale(1)";
            } else {
              toolVideoFixed.style.transform = isMobile
                ? `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) scale(${scale.toFixed(4)})`
                : `translate(${x.toFixed(2)}px, calc(-50% + ${y.toFixed(2)}px)) scale(${scale.toFixed(
                    4
                  )})`;
            }
          }
        }

        if (buildSection && buildTrack) {
          const rect = buildSection.getBoundingClientRect();
          const viewportHeight = window.innerHeight || 1;
          const maxShift = Math.max(0, buildTrack.scrollWidth - buildTrack.clientWidth);
          let progress = 0;

          if (rect.top <= 0 && rect.bottom > viewportHeight) {
            const range = rect.height - viewportHeight;
            progress = range > 0 ? Math.min(Math.abs(rect.top) / range, 1) : 0;
          } else if (rect.top <= 0 && rect.bottom <= viewportHeight) {
            progress = 1;
          }

          buildTrack.style.transform = `translateX(${(-maxShift * progress).toFixed(2)}px)`;
        }

        if (visualizingRepeater && visualizingItems.length) {
          const progress = getStickySequenceProgress(visualizingRepeater);

          visualizingItems.forEach((item, index) => {
            const opacity = getSequenceOpacity(progress, index, visualizingItems.length);
            item.style.opacity = opacity.toFixed(3);
            item.style.visibility = opacity > 0 ? "visible" : "hidden";
          });

          if (visualizingVideo) {
            visualizingVideo.style.opacity = rangeProgress(progress, 0.45, 0.9).toFixed(3);
          }
        }

        if (visualizingSection) {
          const visualizingProgress = getSectionProgress(visualizingSection);
          const phase = Math.min(visualizingProgress / 0.3, 1);
          const scale = 1 - phase * 0.33;

          if (visualizingCenterVideo) {
            visualizingCenterVideo.style.transform = `scale(${scale.toFixed(4)})`;
          }

          visualizingSlides.forEach((slide, index) => {
            const direction = index < 2 ? -1 : 1;
            const x = isMobile ? 0 : direction * 100 * (1 - phase);
            slide.style.transform = `translateX(${x.toFixed(2)}%) scale(${scale.toFixed(4)})`;
          });
        }

        if (beyondSection && beyondItems.length) {
          const progress = getStickySequenceProgress(beyondSection);

          beyondItems.forEach((item, index) => {
            const opacity = getSequenceOpacity(progress, index, beyondItems.length);
            item.style.opacity = opacity.toFixed(3);
            item.style.visibility = opacity > 0 ? "visible" : "hidden";
          });
        }
      }

      if (now < keepAnimatingUntil) {
        rafId = window.requestAnimationFrame(runFrame);
      }
    };

    const requestFrame = () => {
      keepAnimatingUntil = performance.now() + 180;
      if (!rafId) {
        rafId = window.requestAnimationFrame(runFrame);
      }
    };

    const onScroll = () => {
      requestFrame();
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", requestFrame);
    requestFrame();

    return () => {
      root.classList.remove("teamusa-clone--interactive");

      if (rafId) {
        window.cancelAnimationFrame(rafId);
      }

      delete document.documentElement.dataset.theme;

      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", requestFrame);

      root.removeEventListener("click", onRootClick);
      root.removeEventListener("keydown", onRootKeyDown);
      window.removeEventListener("keydown", onWindowKeyDown);

      athleteTabCleanups.forEach((cleanup) => cleanup());
      sliderCleanups.forEach((cleanup) => cleanup());
    };
  }, []);

  return (
    <>
      <nav
        className={`nav ${navVisible ? "nav--visible" : ""} ${
          navTheme === "dark" ? "nav--dark" : "nav--light"
        }`}
        aria-label="Page sections"
      >
        <div className="nav__wrapper">
          <div className="nav__list" ref={navListRef}>
            {SECTION_DEFS.map((section) => (
              <button
                key={section.id}
                type="button"
                className={`nav__list__item ${activeSection === section.id ? "active" : ""}`}
                ref={(node) => {
                  navItemRefs.current[section.id] = node;
                }}
                onClick={() => {
                  scrollToSection(section.selector);
                }}
              >
                {section.label}
              </button>
            ))}
            <a
              href="https://cloud.google.com/vertex-ai"
              target="_blank"
              rel="noopener noreferrer"
              className="nav__list__link"
            >
              <span className="button-style">Start building</span>
            </a>
            <div
              className="nav__follower"
              style={{
                transform: `translateX(${follower.left}px)`,
                width: follower.width ? `${follower.width}px` : undefined,
              }}
            />
          </div>
        </div>
      </nav>

      <div className="motion-toggle">
        <button
          type="button"
          className="motion-toggle__button"
          aria-pressed={motionPaused}
          onClick={() => {
            setMotionPaused((previous) => !previous);
          }}
        >
          <span className="motion-toggle__icon" aria-hidden="true">
            {motionPaused ? ">" : "||"}
          </span>
          <span className="motion-toggle__label">
            {motionPaused ? "Resume motion" : "Pause motion"}
          </span>
        </button>
      </div>

      {modal ? (
        <div
          className="modal"
          role="dialog"
          aria-modal="true"
          aria-label={modal.title}
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setModal(null);
            }
          }}
        >
          <button
            type="button"
            className="button-video button-video--close modal__close"
            onClick={() => {
              setModal(null);
            }}
          >
            <div className="button-video__inner">
              <span className="button-video__text">Close</span>
            </div>
          </button>

          <div className="modal__wrapper">
            <div className="modal__wrapper__inner">
              <video
                key={modal.src}
                className="modal__video teamusa-modal-video"
                src={modal.src}
                controls
                autoPlay
                playsInline
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
