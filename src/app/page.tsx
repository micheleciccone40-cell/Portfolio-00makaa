"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/* ─── Types ─── */
interface VideoData {
  videoId: string;
  title: string;
  views: number;
  embedUrl: string;
}

/* ─── Fallback Video Data (shown while API loads) ─── */
const fallbackVideos: VideoData[] = [
  { videoId: "3M59E7aQeIs", title: "Maes: il primo rapper ricercato dall'Interpol", views: 394069, embedUrl: "https://www.youtube.com/embed/3M59E7aQeIs" },
  { videoId: "YKQp8Ncj8Hw", title: "Michael Jackson è ancora vivo", views: 290070, embedUrl: "https://www.youtube.com/embed/YKQp8Ncj8Hw" },
  { videoId: "ZLbaSpFQ_LY", title: "DEATH ROW: l'etichetta discografica più pericolosa di sempre", views: 86099, embedUrl: "https://www.youtube.com/embed/ZLbaSpFQ_LY" },
  { videoId: "_FjjohhodPM", title: "Come NLE Choppa ha distrutto la sua reputazione", views: 85193, embedUrl: "https://www.youtube.com/embed/_FjjohhodPM" },
  { videoId: "BCgCvOU98yQ", title: "La Tragica Morte di The Notorious B.I.G.", views: 66386, embedUrl: "https://www.youtube.com/embed/BCgCvOU98yQ" },
  { videoId: "hp4vxRc2Fog", title: "Il CROLLO di Lil Baby", views: 29137, embedUrl: "https://www.youtube.com/embed/hp4vxRc2Fog" },
  { videoId: "1-yo3i5g4Bs", title: "Perché il mondo si è rivoltato contro Kanye West", views: 0, embedUrl: "https://www.youtube.com/embed/1-yo3i5g4Bs" },
];

/* ─── Helpers ─── */
function formatViews(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace('.0', '') + 'M';
  if (n >= 1_000) return Math.floor(n / 1_000).toLocaleString() + 'K';
  return n.toLocaleString();
}

function formatViewsFull(n: number): string {
  return n.toLocaleString('it-IT');
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/* ─── North-east arrow (SVG — the ↗ char renders as emoji on Windows) ─── */
function ArrowNE({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      width="10"
      height="10"
      viewBox="0 0 10 10"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M1 9L9 1M9 1H2.5M9 1V7.5" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

/* ─── Custom Cursor ─── */
function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) return;
    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    const dotX = gsap.quickTo(dot, 'x', { duration: 0.08, ease: 'power2.out' });
    const dotY = gsap.quickTo(dot, 'y', { duration: 0.08, ease: 'power2.out' });
    const ringX = gsap.quickTo(ring, 'x', { duration: 0.4, ease: 'power3.out' });
    const ringY = gsap.quickTo(ring, 'y', { duration: 0.4, ease: 'power3.out' });

    const onMove = (e: MouseEvent) => {
      dotX(e.clientX); dotY(e.clientY);
      ringX(e.clientX); ringY(e.clientY);
    };
    const onOver = (e: MouseEvent) => {
      const interactive = (e.target as HTMLElement).closest('a, button, [data-cursor="hover"]');
      gsap.to(ring, { scale: interactive ? 2.1 : 1, opacity: interactive ? 0.9 : 0.45, duration: 0.3 });
      gsap.to(dot, { scale: interactive ? 0.4 : 1, duration: 0.3 });
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseover', onOver);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseover', onOver);
    };
  }, []);

  return (
    <>
      <div ref={dotRef} className="cursor-dot" aria-hidden="true"></div>
      <div ref={ringRef} className="cursor-ring" aria-hidden="true"></div>
    </>
  );
}

/* ─── Animated Counter ─── */
function AnimatedCounter({ value }: { value: number }) {
  const counterRef = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!counterRef.current || hasAnimated.current || value === 0) return;

    hasAnimated.current = true;
    const target = { val: 0 };

    gsap.to(target, {
      val: value,
      duration: 2.5,
      ease: "power3.out",
      onUpdate: () => {
        if (counterRef.current) {
          counterRef.current.textContent = formatViewsFull(Math.floor(target.val));
        }
      }
    });
  }, [value]);

  return (
    <span
      ref={counterRef}
      className="headline text-[clamp(2.8rem,6.5vw,6rem)] leading-none tabular-nums text-ink"
    >
      {formatViewsFull(value)}
    </span>
  );
}

/* ─── Case Study ─── */
interface CaseStudyData {
  id: string;
  kicker: string;
  title: string;
  desc: string;
  meta: { label: string; value: string }[];
  link?: { href: string; label: string };
  hero: { src: string; alt: string; captionL: string; captionR: string; priority?: boolean };
  features: { tag: string; caption: string; src: string; alt: string; desc: string; fit?: 'cover' | 'contain' }[];
  split?: { tag: string; title: string; desc: string; src: string; alt: string };
}

function CaseStudy({ data }: { data: CaseStudyData }) {
  return (
    <div>
      {/* Title + description + meta */}
      <div className="reveal mb-10 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-7">
          <span className="mb-3 block font-mono text-[11px] tracking-[0.2em] text-muted">{data.kicker}</span>
          <h3 className="headline mb-6 text-[clamp(2.2rem,5.5vw,4.5rem)] leading-[0.95]">{data.title}</h3>
          <p className="max-w-2xl text-base leading-relaxed text-muted md:text-lg">{data.desc}</p>
        </div>
        <div className="flex flex-col gap-6 lg:col-span-5 lg:items-end">
          <div className="grid w-full grid-cols-3 divide-x divide-line border border-line lg:max-w-md">
            {data.meta.map((m) => (
              <div key={m.label} className="px-4 py-3">
                <span className="block font-mono text-[9px] tracking-[0.2em] text-muted">{m.label}</span>
                <span className="mt-1 block text-[12px] leading-snug font-semibold text-ink">{m.value}</span>
              </div>
            ))}
          </div>
          {data.link && (
            <a href={data.link.href} target="_blank" className="btn-solid w-max">
              {data.link.label} <ArrowNE />
            </a>
          )}
        </div>
      </div>

      {/* Hero frame */}
      <div className="reveal mb-10">
        <div className="frame-caption">
          <span>{data.hero.captionL}</span>
          <span className="hidden sm:block">{data.hero.captionR}</span>
        </div>
        <div className="relative aspect-[16/9] w-full border border-line bg-ink">
          <Image
            src={data.hero.src}
            alt={data.hero.alt}
            fill
            className="object-cover"
            priority={data.hero.priority}
          />
        </div>
      </div>

      {/* Feature two-up */}
      <div className="mb-10 grid grid-cols-1 gap-10 md:grid-cols-2">
        {data.features.map((f) => (
          <div key={f.tag} className="reveal">
            <div className="frame-caption">
              <span className="text-accent">{f.tag}</span>
              <span>{f.caption}</span>
            </div>
            <div className="relative aspect-video w-full overflow-hidden border border-line bg-ink">
              <img
                src={f.src}
                alt={f.alt}
                className={`absolute inset-0 h-full w-full ${f.fit === 'contain' ? 'object-contain' : 'object-cover object-center'}`}
              />
            </div>
            <p className="border border-t-0 border-line bg-paper px-5 py-4 text-sm leading-relaxed text-muted">
              {f.desc}
            </p>
          </div>
        ))}
      </div>

      {/* Split panel */}
      {data.split && (
        <div className="reveal flex flex-col overflow-hidden border border-line bg-panel md:flex-row">
          <div className="flex flex-1 flex-col justify-center p-8 md:p-16">
            <span className="mb-4 block font-mono text-[11px] tracking-[0.2em] text-accent">{data.split.tag}</span>
            <h4 className="headline mb-5 text-2xl md:text-4xl">{data.split.title}</h4>
            <p className="max-w-md text-base leading-relaxed text-muted md:text-lg">{data.split.desc}</p>
          </div>
          <div className="relative min-h-[320px] flex-[1.2] border-t border-line bg-ink md:min-h-[440px] md:border-t-0 md:border-l">
            <Image
              src={data.split.src}
              alt={data.split.alt}
              fill
              className="object-cover object-left-top"
            />
          </div>
        </div>
      )}
    </div>
  );
}

const berryCase: CaseStudyData = {
  id: "berry",
  kicker: "CASE 01 — SITO UFFICIALE ARTISTA",
  title: "Berry La Voix",
  desc: "Sito ufficiale di Berry La Voix, hip-hop vulgarisateur. Un'esperienza scrollytelling costruita attorno al vinile: 192 frame renderizzati sincronizzati allo scroll, drop calendar interattivo collegato alle uscite YouTube e store per il merchandising 4DAKULTURE integrato con Shopify. Progettato, sviluppato e pubblicato in produzione.",
  meta: [
    { label: "RUOLO", value: "Design + Sviluppo" },
    { label: "STACK", value: "Next.js · GSAP · Shopify" },
    { label: "STATO", value: "Online" },
  ],
  link: { href: "https://berry-site.vercel.app/", label: "Visita il sito live" },
  hero: {
    src: "/berry-live-hero.webp",
    alt: "Hero del sito di Berry La Voix: giradischi in teca di vetro con sequenza scroll",
    captionL: "BERRY-SITE.VERCEL.APP — HOMEPAGE",
    captionR: "NEXT.JS · GSAP · E-COMMERCE",
    priority: true,
  },
  features: [
    {
      tag: "F.01",
      caption: "VINYL SCROLL — 192 FRAME / GSAP",
      src: "/berry-vinyl-anim.webp",
      alt: "Sequenza di apertura del vinile guidata dallo scroll",
      desc: "Sequenza cinematica di 192 frame renderizzati, sincronizzata allo scroll con GSAP: la teca si apre e il vinile si sblocca mentre l'utente scorre.",
    },
    {
      tag: "F.02",
      caption: "DROP CALENDAR — HOVER PREVIEW",
      src: "/berry-calendar-anim.webp",
      alt: "Drop calendar: anteprima video al passaggio del mouse sulle date di uscita",
      desc: "Calendario delle uscite settimanali: al passaggio del mouse le date passate mostrano l'anteprima del drop, quelle future una spoiler area collegata allo shop.",
      fit: "contain",
    },
  ],
  split: {
    tag: "F.03 — SHOP",
    title: "E-commerce integrato",
    desc: "Store nativo collegato a Shopify per il merchandising 4DAKULTURE: flusso d'acquisto senza attriti, anteprime 3D dei capi e un'estetica coerente con l'identità dell'artista.",
    src: "/berry-live-shop.webp",
    alt: "Store del sito Berry La Voix: sezione 4DAKULTURE con t-shirt La Voix",
  },
};

const braceCase: CaseStudyData = {
  id: "brace",
  kicker: "CASE 02 — CONCEPT RISTORANTE",
  title: "Brace",
  desc: "Concept completo per un fine dining napoletano costruito attorno alla cucina al carbone: identità, direzione artistica e interfaccia. La stessa impostazione editoriale del progetto Berry — gerarchie tipografiche forti, dettagli in monospazio, micro-interazioni — declinata su una palette fumo e ottone con serif ad alto contrasto. Progetto dimostrativo, non pubblicato online.",
  meta: [
    { label: "RUOLO", value: "Concept + UI Design" },
    { label: "STACK", value: "HTML · CSS · Type" },
    { label: "STATO", value: "Demo interna" },
  ],
  hero: {
    src: "/brace-hero.webp",
    alt: "Hero del concept Brace: titolo serif gigante con bagliore di brace",
    captionL: "BRACE — CUCINA DI FUOCO · NAPOLI",
    captionR: "FRAUNCES · EMBER GLOW · UI CONCEPT",
  },
  features: [
    {
      tag: "F.01",
      caption: "MENU DEGUSTAZIONE — HOVER STATES",
      src: "/brace-menu-anim.webp",
      alt: "Menu degustazione con stati hover tipografici",
      desc: "Lista piatti con stati hover tipografici: la portata attiva scivola verso destra e passa al corsivo in ottone, con prezzi e numerazione in monospazio.",
    },
    {
      tag: "F.02",
      caption: "PRENOTAZIONE — WIDGET TAVOLI",
      src: "/brace-booking-anim.webp",
      alt: "Widget di prenotazione tavoli con selezione di giorno e orario",
      desc: "Prenotazione in due pannelli: settimana e slot orari con disponibilità reale, orari esauriti barrati e riepilogo del tavolo aggiornato a ogni selezione.",
    },
  ],
};

/* ─── Section Header ─── */
function SectionHeader({ index, title, desc }: { index: string; title: string; desc: string }) {
  return (
    <div className="reveal mb-14 flex flex-col gap-5 border-b border-line pb-10 md:mb-20">
      <span className="block font-mono text-[11px] tracking-[0.2em] text-accent">({index})</span>
      <h2 className="headline text-[clamp(2.5rem,7vw,5.5rem)] leading-[0.9] text-ink">{title}</h2>
      <p className="max-w-xl text-base leading-relaxed text-muted md:text-lg">{desc}</p>
    </div>
  );
}

/* ─── Live dot ─── */
function LiveDot() {
  return (
    <span className="relative flex h-1.5 w-1.5">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-70"></span>
      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent"></span>
    </span>
  );
}

/* ─── Main Page ─── */
export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [videos, setVideos] = useState<VideoData[]>(fallbackVideos);
  const [totalViews, setTotalViews] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeVideo, setActiveVideo] = useState<VideoData | null>(null);
  const [activeWebCase, setActiveWebCase] = useState<string | null>(null);
  const [showMusicVideos, setShowMusicVideos] = useState(false);

  const closeLightbox = useCallback(() => setActiveVideo(null), []);

  // Fetch realtime video data from API
  useEffect(() => {
    async function fetchVideos() {
      try {
        const res = await fetch('/api/videos');
        const data = await res.json();
        if (data.videos && data.videos.length > 0) {
          setVideos(data.videos);
          setTotalViews(data.totalViews);
        }
      } catch {
        const total = fallbackVideos.reduce((sum, v) => sum + v.views, 0);
        setTotalViews(total);
      } finally {
        setIsLoaded(true);
      }
    }
    fetchVideos();
  }, []);

  // Lightbox: Esc to close + scroll lock
  useEffect(() => {
    if (!activeVideo) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeLightbox(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [activeVideo, closeLightbox]);

  // GSAP Animations
  useEffect(() => {
    const tl = gsap.timeline();
    tl.from('.hero-line', {
      yPercent: 110,
      duration: 1.3,
      ease: 'power4.out',
      stagger: 0.12
    })
    .from('.hero-meta', {
      y: 30,
      opacity: 0,
      duration: 0.9,
      ease: 'power3.out',
      stagger: 0.08
    }, "-=0.9")
    .from('header', {
      yPercent: -100,
      duration: 0.9,
      ease: 'power3.out'
    }, "-=0.9");

    gsap.utils.toArray('.reveal').forEach((elem: unknown) => {
      gsap.from(elem as HTMLElement, {
        scrollTrigger: {
          trigger: elem as HTMLElement,
          start: 'top 88%'
        },
        y: 50,
        opacity: 0,
        duration: 1.1,
        ease: 'power3.out'
      });
    });

    // Analytics bars fill on scroll
    gsap.from('.bar-fill', {
      scrollTrigger: {
        trigger: '.analytics-panel',
        start: 'top 80%'
      },
      scaleX: 0,
      transformOrigin: 'left center',
      duration: 1.2,
      ease: 'power3.out',
      stagger: 0.08
    });

    return () => {
      tl.kill();
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, []);

  const maxViews = Math.max(...videos.map(v => v.views), 1);
  const avgViews = videos.length > 0 ? Math.round(videos.reduce((s, v) => s + v.views, 0) / videos.length) : 0;

  return (
    <main ref={containerRef} className="relative min-h-screen w-full bg-paper">
      <div className="grain" aria-hidden="true"></div>
      <CustomCursor />

      {/* ─── Header ─── */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-line bg-paper/85 backdrop-blur-md">
        <nav className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-6 md:px-10">
          <a href="#" className="font-mono text-xs font-medium tracking-[0.2em] text-ink">
            MICHELE CICCONE<span className="text-accent">*</span>
          </a>
          <ul className="hidden items-center gap-9 font-mono text-[11px] tracking-[0.18em] md:flex">
            <li><a href="#video" className="text-muted transition-colors hover:text-ink"><span className="text-accent">01</span> VIDEO</a></li>
            <li><a href="#music-videos" className="text-muted transition-colors hover:text-ink"><span className="text-accent">02</span> MUSIC VIDEO</a></li>
            <li><a href="#web" className="text-muted transition-colors hover:text-ink"><span className="text-accent">03</span> WEB</a></li>
            <li><a href="#3d" className="text-muted transition-colors hover:text-ink"><span className="text-accent">04</span> 3D</a></li>
          </ul>
          <a href="#contact" className="inline-flex items-center gap-2 font-mono text-[11px] font-medium tracking-[0.18em] text-ink transition-colors hover:text-accent">
            CONTATTAMI <ArrowNE />
          </a>
        </nav>
      </header>

      {/* ─── Hero ─── */}
      <section className="px-6 pt-36 pb-0 md:px-10 md:pt-48">
        <div className="mx-auto max-w-[1440px]">

          <div className="mb-6 flex items-center justify-between font-mono text-[11px] tracking-[0.2em] text-muted">
            <span className="hero-meta">PORTFOLIO — 2026</span>
            <span className="hero-meta hidden md:block">VIDEO / WEB / 3D</span>
            <span className="hero-meta flex items-center gap-2.5">
              <LiveDot />
              DISPONIBILE
            </span>
          </div>

          <h1 className="headline text-[clamp(3.4rem,12.5vw,11rem)] leading-[0.84] tracking-[-0.03em] text-ink">
            <span className="block overflow-hidden"><span className="hero-line block">Michele</span></span>
            <span className="block overflow-hidden"><span className="hero-line text-stroke block">Ciccone</span></span>
          </h1>

          <div className="mt-12 grid grid-cols-1 gap-10 md:mt-16 md:grid-cols-12 md:gap-8">
            <p className="hero-meta max-w-xl text-lg leading-relaxed text-muted md:col-span-7 md:text-xl">
              Racconto storie con il montaggio e le costruisco con il codice.
              Video editing e motion design per YouTube, piattaforme web sviluppate
              con Next.js e GSAP, 3D in produzione.
            </p>
            <div className="hero-meta font-mono text-[11px] leading-loose tracking-[0.16em] text-muted md:col-span-5 md:text-right">
              <p>EDITING — PREMIERE / AFTER EFFECTS</p>
              <p>WEB — NEXT.JS / GSAP / API</p>
              <p>3D — MODELLAZIONE / STAMPA ADDITIVA</p>
            </div>
          </div>

          {/* Stats strip */}
          <div className="reveal mt-16 grid grid-cols-1 divide-y divide-line border-y border-line sm:grid-cols-3 sm:divide-x sm:divide-y-0 md:mt-24">
            <div className="flex items-baseline justify-between gap-4 py-6 sm:block sm:px-2 sm:py-8">
              <span className="headline block text-3xl md:text-5xl">{isLoaded && totalViews > 0 ? formatViews(totalViews) : '—'}</span>
              <span className="mt-2 block font-mono text-[10px] tracking-[0.2em] text-muted">VISUALIZZAZIONI GENERATE</span>
            </div>
            <div className="flex items-baseline justify-between gap-4 py-6 sm:block sm:px-8 sm:py-8">
              <span className="headline block text-3xl md:text-5xl">{pad(videos.length)}</span>
              <span className="mt-2 block font-mono text-[10px] tracking-[0.2em] text-muted">VIDEO EDITATI</span>
            </div>
            <div className="flex items-baseline justify-between gap-4 py-6 sm:block sm:px-8 sm:py-8">
              <span className="headline block text-3xl md:text-5xl">02</span>
              <span className="mt-2 block font-mono text-[10px] tracking-[0.2em] text-muted">PIATTAFORME SVILUPPATE</span>
            </div>
          </div>

        </div>
      </section>

      {/* ─── Title marquee ─── */}
      <div className="marquee reveal mt-16 border-y border-line py-4 md:mt-24" aria-hidden="true">
        <div className="marquee-track font-mono text-[11px] tracking-[0.2em] text-muted uppercase">
          {[...videos, ...videos].map((v, i) => (
            <span key={i} className="inline-flex items-center gap-12">
              <span>{v.title}</span>
              <span className="text-accent">✳</span>
            </span>
          ))}
        </div>
      </div>

      {/* ─── 01 / Video Editing ─── */}
      <section id="video" className="px-6 py-24 md:px-10 md:py-36">
        <div className="mx-auto max-w-[1440px]">

          <SectionHeader
            index="01"
            title="Video Editing"
            desc="Montaggio, motion graphics e storytelling per il canale YouTube di Berry La Voix. Ogni video è costruito per trattenere: ritmo, sound design e struttura narrativa."
          />

          {/* Analytics panel */}
          <div className="analytics-panel reveal mb-16 grid grid-cols-1 border border-line bg-panel lg:grid-cols-5 md:mb-20">

            {/* Total counter */}
            <div className="flex flex-col justify-between border-b border-line lg:col-span-2 lg:border-r lg:border-b-0">
              <div className="frame-caption border-0 border-b border-line">
                <span>DATI IN TEMPO REALE — YOUTUBE</span>
                <span className="flex items-center gap-2 text-ink">
                  <LiveDot />
                  LIVE
                </span>
              </div>
              <div className="flex flex-1 flex-col justify-center px-6 py-12 md:px-8">
                <AnimatedCounter value={isLoaded ? totalViews : 0} />
                <span className="mt-4 font-mono text-[10px] tracking-[0.25em] text-muted">
                  VISUALIZZAZIONI TOTALI
                </span>
              </div>
              <div className="grid grid-cols-2 divide-x divide-line border-t border-line">
                <div className="px-6 py-5 md:px-8">
                  <span className="headline block text-xl md:text-2xl">{isLoaded && avgViews > 0 ? formatViews(avgViews) : '—'}</span>
                  <span className="mt-1 block font-mono text-[9px] tracking-[0.2em] text-muted">MEDIA / VIDEO</span>
                </div>
                <div className="px-6 py-5 md:px-8">
                  <span className="headline block text-xl md:text-2xl">{isLoaded ? formatViews(maxViews) : '—'}</span>
                  <span className="mt-1 block font-mono text-[9px] tracking-[0.2em] text-muted">TOP VIDEO</span>
                </div>
              </div>
            </div>

            {/* Per-video performance bars */}
            <div className="lg:col-span-3">
              <div className="frame-caption border-0 border-b border-line">
                <span>PERFORMANCE PER VIDEO</span>
                <span>VIEWS</span>
              </div>
              <div className="flex flex-col gap-2.5 px-6 py-5 md:px-8">
                {videos.map((video, i) => (
                  <div key={video.videoId} className="group/bar">
                    <div className="mb-1 flex items-baseline justify-between gap-4">
                      <span className="truncate text-[12px] font-semibold text-ink">
                        <span className="mr-2 font-mono text-[9px] font-normal text-accent">{pad(i + 1)}</span>
                        {video.title}
                      </span>
                      <span className="shrink-0 font-mono text-[9px] tracking-[0.15em] text-muted tabular-nums">
                        {video.views > 0 ? formatViewsFull(video.views) : '—'}
                      </span>
                    </div>
                    <div className="h-[3px] w-full bg-line/60">
                      <div
                        className="bar-fill h-full bg-ink transition-colors group-hover/bar:bg-accent"
                        style={{ width: `${Math.max((video.views / maxViews) * 100, 1.5)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Compact video grid — click to play */}
          <div className="grid grid-cols-2 gap-px border border-line bg-line md:grid-cols-3 lg:grid-cols-4">
            {videos.map((video, i) => (
              <button
                key={video.videoId}
                onClick={() => setActiveVideo(video)}
                className="reveal group bg-paper text-left"
                aria-label={`Guarda: ${video.title}`}
              >
                <div className="relative w-full overflow-hidden bg-ink pt-[56.25%]">
                  <img
                    src={`https://i.ytimg.com/vi/${video.videoId}/maxresdefault.jpg`}
                    onError={(e) => {
                      const img = e.currentTarget;
                      if (!img.src.includes('hqdefault')) {
                        img.src = `https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg`;
                      }
                    }}
                    alt={video.title}
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover transition-all duration-500 group-hover:scale-[1.04]"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-ink/0 transition-colors duration-300 group-hover:bg-ink/35">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-paper opacity-0 transition-all duration-300 group-hover:opacity-100">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <path d="M3 1.5L12 7L3 12.5V1.5Z" fill="var(--color-ink)" />
                      </svg>
                    </span>
                  </div>
                </div>
                <div className="px-4 py-4">
                  <div className="mb-1.5 flex items-center justify-between font-mono text-[9px] tracking-[0.18em]">
                    <span className="text-accent">V.{pad(i + 1)}</span>
                    <span className="text-muted tabular-nums">{video.views > 0 ? `${formatViews(video.views)} VIEWS` : '—'}</span>
                  </div>
                  <h3 className="line-clamp-2 text-[13px] leading-snug font-semibold text-ink">
                    {video.title}
                  </h3>
                </div>
              </button>
            ))}
          </div>

          {/* Music Videos Toggle */}
          <div id="music-videos" className="mt-20 border-t border-line pt-12 reveal">
            <button
              onClick={() => setShowMusicVideos(!showMusicVideos)}
              className="group flex w-full items-center justify-between font-mono text-[13px] tracking-[0.2em] font-bold text-ink hover:text-accent transition-colors"
            >
              <span className="flex items-center gap-4">
                <span className="text-accent">(02)</span>
                MUSIC VIDEO
              </span>
              <span className="text-2xl font-light leading-none">{showMusicVideos ? '−' : '+'}</span>
            </button>
            
            <div className={`grid grid-cols-1 md:grid-cols-2 items-start gap-8 transition-all duration-700 ease-in-out ${showMusicVideos ? 'mt-12 opacity-100' : 'h-0 opacity-0 overflow-hidden mt-0'}`}>
              {[
                { src: '/music-videos/2flared.mp4', title: '@2FLARED', format: '16:9' },
                { src: '/music-videos/pessima.mov', title: 'PESSIMA FREESTYLE', format: '16:9' },
                { src: '/music-videos/siko.mp4', title: 'SIKO FREESTYLE', format: '9:16' },
                { src: '/music-videos/big26k.mp4', title: 'X @BIG26K', format: '16:9' }
              ].map((vid, i) => (
                <div key={i} className={`flex flex-col gap-3 ${vid.format === '9:16' ? 'md:col-span-1 md:row-span-2' : ''}`}>
                  <video 
                    controls 
                    className={`w-full object-cover bg-ink border border-line ${vid.format === '9:16' ? 'aspect-[9/16] max-h-[700px] w-auto mx-auto' : 'aspect-video'}`} 
                    preload="metadata"
                  >
                    <source src={vid.src} />
                    Il tuo browser non supporta il tag video.
                  </video>
                  <span className={`font-mono text-[10px] tracking-[0.15em] text-muted ${vid.format === '9:16' ? 'text-center' : ''}`}>{vid.title}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* ─── Video Lightbox ─── */}
      {activeVideo && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-ink/95 p-4 md:p-10"
          onClick={closeLightbox}
          role="dialog"
          aria-modal="true"
          aria-label={activeVideo.title}
        >
          <div className="w-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between gap-4 border border-b-0 border-paper/20 px-5 py-3 font-mono text-[10px] tracking-[0.16em] text-paper/70 uppercase">
              <span className="truncate">{activeVideo.title}</span>
              <button
                onClick={closeLightbox}
                className="shrink-0 text-paper transition-colors hover:text-accent"
              >
                CHIUDI ✕
              </button>
            </div>
            <div className="relative aspect-video w-full border border-paper/20 bg-black">
              <iframe
                className="absolute inset-0 h-full w-full border-0"
                src={`https://www.youtube.com/embed/${activeVideo.videoId}?autoplay=1`}
                title={activeVideo.title}
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        </div>
      )}

      {/* ─── 03 / Web Development ─── */}
      <section id="web" className="border-t border-line px-6 py-24 md:px-10 md:py-36">
        <div className="mx-auto max-w-[1440px]">

          <SectionHeader
            index="03"
            title="Web Development"
            desc="Piattaforme interattive progettate per scalare, connettere e convertire. Dalla direzione creativa al deploy: identità visiva, animazioni GSAP sincronizzate allo scroll, API custom e integrazioni e-commerce. Due casi studio, lo stesso metodo — ogni interfaccia nasce dal mondo che deve raccontare."
          />

          {/* Case Studies Selection */}
          <div className="mb-20 grid grid-cols-1 gap-6 md:grid-cols-2">
            {[berryCase, braceCase].map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveWebCase(activeWebCase === c.id ? null : c.id)}
                className={`group flex flex-col text-left border transition-colors ${activeWebCase === c.id ? 'border-accent bg-panel/50 ring-1 ring-accent' : 'border-line bg-paper hover:bg-panel'}`}
              >
                <div className="relative aspect-video w-full overflow-hidden border-b border-line bg-ink">
                  <Image src={c.hero.src} alt={c.hero.alt} fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
                </div>
                <div className="p-6 md:p-8 flex-1 flex flex-col">
                  <span className="mb-3 block font-mono text-[10px] tracking-[0.2em] text-accent">{c.kicker}</span>
                  <h3 className="headline text-3xl text-ink mb-4">{c.title}</h3>
                  <p className="text-sm md:text-base leading-relaxed text-muted line-clamp-3 mb-8">{c.desc}</p>
                  <div className="mt-auto flex items-center gap-2 font-mono text-[10px] tracking-[0.2em] font-semibold text-ink group-hover:text-accent transition-colors">
                    {activeWebCase === c.id ? 'CHIUDI CASO STUDIO ✕' : 'ESPLORA CASO STUDIO →'}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Active Case Study Content */}
          <div className={`transition-all duration-700 ease-in-out ${activeWebCase ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>
            {activeWebCase === 'berry' && <CaseStudy data={berryCase} />}
            {activeWebCase === 'brace' && <CaseStudy data={braceCase} />}
          </div>

        </div>
      </section>

      {/* ─── 04 / 3D ─── */}
      <section id="3d" className="border-t border-line px-6 py-24 md:px-10 md:py-36">
        <div className="mx-auto max-w-[1440px]">

          <SectionHeader
            index="04"
            title="3D"
            desc="Modellazione organica, hard surface e configurazioni ottimizzate per la stampa 3D additiva. I primi lavori sono in produzione."
          />

          {/* 3D Categories */}
          <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
            {[
              { src: '/3d-prints/lithophane-dog.jpeg', title: 'LYTOLAMP', desc: 'Lampade litofaniche personalizzate. Un mix di stampa 3D e luce che rivela foto e ricordi in modo unico.' },
              { src: '/3d-prints/batman.jpeg', title: 'FUNKO POP', desc: 'Riproduzioni in stile Funko Pop stampate in 3D con materiali speciali (es. filamento effetto legno).' },
              { src: '/3d-prints/nfc-card.jpeg', title: 'GADGET NFC', desc: 'Business card e smart tag NFC integrati in supporti stampati in 3D, come legno e bambù.' },
            ].map((item, i) => (
              <div key={i} className="reveal flex flex-col">
                <div className="relative aspect-[4/5] w-full overflow-hidden border border-line bg-ink mb-6">
                  <Image src={item.src} alt={item.title} fill className="object-cover transition-transform duration-700 hover:scale-105" />
                </div>
                <h3 className="font-mono text-[12px] tracking-[0.2em] font-semibold text-ink mb-3">{item.title}</h3>
                <p className="text-sm leading-relaxed text-muted">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-20 text-center reveal flex flex-col items-center">
            <a href="https://3dspark.it" target="_blank" className="btn-solid inline-flex items-center gap-2">
              VAI A 3D SPARK <ArrowNE />
            </a>
            <p className="mt-5 font-mono text-[10px] tracking-[0.2em] text-muted bg-panel border border-line px-4 py-2">
              NOTA: IL SITO È ATTUALMENTE IN LAVORAZIONE
            </p>
          </div>

        </div>
      </section>

      {/* ─── 04 / Contact ─── */}
      <footer id="contact" className="bg-accent px-6 pt-20 pb-10 text-ink md:px-10 md:pt-28">
        <div className="mx-auto max-w-[1440px]">

          <div className="mb-12 flex items-center justify-between font-mono text-[11px] font-medium tracking-[0.2em] md:mb-16">
            <span>(04) — CONTATTO</span>
            <span className="hidden sm:block">RISPONDO ENTRO 24H</span>
          </div>

          <h2 className="headline text-[clamp(2.1rem,10.5vw,11rem)] leading-[0.82]">
            Parliamone.
          </h2>

          <div className="mt-14 grid grid-cols-1 items-start gap-16 md:mt-20 md:grid-cols-2">
            <div className="flex flex-col gap-8">
              <p className="max-w-md text-lg leading-relaxed text-ink/80 md:text-xl">
                Un video da montare, una piattaforma da costruire o un&apos;idea ancora da definire — scrivimi.
              </p>
              <div className="flex flex-col gap-5">
                <a
                  href="mailto:micheleciccone40@gmail.com"
                  className="w-max border-b-2 border-ink/25 pb-1 text-xl font-bold tracking-tight transition-colors hover:border-ink md:text-3xl"
                >
                  micheleciccone40@gmail.com
                </a>
                <a
                  href="https://www.instagram.com/00makaa"
                  target="_blank"
                  className="inline-flex items-center gap-2 font-mono text-xs font-medium tracking-[0.18em] transition-opacity hover:opacity-60"
                >
                  INSTAGRAM — @00MAKAA <ArrowNE />
                </a>
              </div>
            </div>

            {/* Contact Form */}
            <form action="https://formsubmit.co/micheleciccone40@gmail.com" method="POST" className="flex flex-col gap-6 bg-white p-6 md:p-8 border border-line shadow-sm">
              {/* Opzioni FormSubmit */}
              <input type="hidden" name="_captcha" value="false" />
              <input type="hidden" name="_template" value="box" />
              
              <div className="flex flex-col gap-2">
                <label htmlFor="name" className="font-mono text-[10px] tracking-[0.2em] font-semibold text-ink">NOME</label>
                <input type="text" name="name" id="name" required className="w-full bg-transparent border-b border-ink/30 py-2 font-sans text-base outline-none focus:border-ink transition-colors placeholder:text-ink/30" placeholder="Il tuo nome" />
              </div>
              
              <div className="flex flex-col gap-2">
                <label htmlFor="email" className="font-mono text-[10px] tracking-[0.2em] font-semibold text-ink">EMAIL</label>
                <input type="email" name="email" id="email" required className="w-full bg-transparent border-b border-ink/30 py-2 font-sans text-base outline-none focus:border-ink transition-colors placeholder:text-ink/30" placeholder="La tua email" />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="service" className="font-mono text-[10px] tracking-[0.2em] font-semibold text-ink">TIPOLOGIA DI SERVIZIO</label>
                <select name="_subject" id="service" required className="w-full bg-transparent border-b border-ink/30 py-2 font-sans text-base outline-none focus:border-ink transition-colors text-ink cursor-pointer">
                  <option value="Nuova Richiesta: Video Editing">Video Editing</option>
                  <option value="Nuova Richiesta: Video Musicale">Video Musicale</option>
                  <option value="Nuova Richiesta: Web Developing">Web Developing</option>
                  <option value="Nuova Richiesta: 3D">3D</option>
                  <option value="Nuova Richiesta: Altro">Altro</option>
                </select>
              </div>
              
              <div className="flex flex-col gap-2">
                <label htmlFor="message" className="font-mono text-[10px] tracking-[0.2em] font-semibold text-ink">MESSAGGIO</label>
                <textarea name="message" id="message" rows={3} required className="w-full bg-transparent border-b border-ink/30 py-2 font-sans text-base outline-none focus:border-ink transition-colors resize-none placeholder:text-ink/30" placeholder="Parlami del tuo progetto..."></textarea>
              </div>
              
              <button type="submit" className="mt-2 w-full md:w-auto bg-ink text-paper px-8 py-4 font-mono text-[11px] tracking-[0.2em] font-semibold hover:bg-accent transition-colors">
                INVIA MESSAGGIO
              </button>
            </form>
          </div>

          <div className="mt-20 flex flex-col justify-between gap-2 border-t border-ink/20 pt-6 font-mono text-[10px] font-medium tracking-[0.2em] sm:flex-row md:mt-28">
            <span>© 2026 MICHELE CICCONE</span>
            <span>00MAKAA — ITALIA</span>
          </div>

        </div>
      </footer>

    </main>
  );
}
