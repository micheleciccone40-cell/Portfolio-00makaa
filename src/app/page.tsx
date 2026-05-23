"use client";

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Loading Screen States
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState("INIZIALIZZAZIONE CORE SYSTEM...");
  
  // Web Development Berry Site Tabs State
  const [activeChicca, setActiveChicca] = useState(0);
  
  const chicche = [
    {
      title: "Vinile Scroll-in-Page",
      desc: "Rotazione dinamica e interazione allo scroll della pagina.",
      img: "/scrolling.png"
    },
    {
      title: "Avatar Animato",
      desc: "Elementi visivi interattivi integrati nell'interfaccia.",
      img: "/avatar custom.png"
    },
    {
      title: "E-Commerce Store",
      desc: "Struttura di monetizzazione fluida e custom.",
      img: "/scrolling.png"
    },
    {
      title: "YouTube Bot Integration",
      desc: "Automazione avanzata per sincronizzare i contenuti del creator.",
      img: "/bot YT API.png"
    },
    {
      title: "Calendario Eventi",
      desc: "Sistema interattivo per la gestione e visualizzazione uscite.",
      img: "/calendario interattivo.png"
    }
  ];

  // Loader Progress Logic
  useEffect(() => {
    if (!isLoading) return;
    
    const textOptions = [
      "CARICAMENTO DRIVER GRAFICI...",
      "INIZIALIZZAZIONE LIBRERIE MULTIMEDIALI...",
      "CONVERSIONE E-COMMERCE ENGINE...",
      "DECRIPTAZIONE INTERFACCIA UTENTE...",
      "RENDERING ELEMENTI 3D...",
      "PORTFOLIO CONFIGURATO CON SUCCESSO."
    ];

    let currentTextIndex = 0;
    
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        
        if (prev % 18 === 0 && prev > 0 && currentTextIndex < textOptions.length) {
          setLoadingText(textOptions[currentTextIndex]);
          currentTextIndex++;
        }
        
        const step = Math.floor(Math.random() * 8) + 3;
        return Math.min(prev + step, 100);
      });
    }, 80);

    return () => clearInterval(interval);
  }, [isLoading]);

  // Loader Out Transition
  useEffect(() => {
    if (progress === 100) {
      const timeout = setTimeout(() => {
        const tl = gsap.timeline({
          onComplete: () => {
            setIsLoading(false);
          }
        });

        // Animate Loader Out
        tl.to(".loader-content", {
          opacity: 0,
          y: -50,
          scale: 0.95,
          duration: 0.6,
          ease: "power3.in"
        })
        .to(".loading-screen", {
          opacity: 0,
          clipPath: "polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)",
          duration: 0.8,
          ease: "power4.inOut"
        }, "-=0.2");

      }, 600);
      return () => clearTimeout(timeout);
    }
  }, [progress]);

  // Main Page GSAP Animations
  useEffect(() => {
    if (isLoading) return;

    // Ambient Glow Animations
    gsap.to('.glow-1', {
      x: 120, y: 60,
      duration: 12,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    });
    gsap.to('.glow-2', {
      x: -100, y: -60,
      duration: 14,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    });
    gsap.to('.glow-3', {
      x: 80, y: -80,
      duration: 16,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    });

    // Hero Entry Animation Timeline
    const tl = gsap.timeline();
    tl.from('.profile-wrapper', {
      scale: 0.75,
      opacity: 0,
      filter: "blur(20px)",
      duration: 1.5,
      ease: 'power4.out'
    })
    .from('.hero-title-wrapper', {
      y: 40,
      opacity: 0,
      filter: "blur(10px)",
      duration: 1,
      ease: 'power3.out'
    }, "-=1.1")
    .from('.hero-subtitle', {
      y: 30,
      opacity: 0,
      filter: "blur(5px)",
      duration: 1,
      ease: 'power3.out'
    }, "-=0.9")
    .from('.hero-links', {
      y: 20,
      opacity: 0,
      duration: 0.8,
      ease: 'power3.out'
    }, "-=0.7")
    .from('.hero-actions', {
      y: 20,
      opacity: 0,
      duration: 0.8,
      ease: 'power3.out'
    }, "-=0.6")
    .from('nav', {
      y: -50,
      opacity: 0,
      duration: 1,
      ease: 'power3.out'
    }, "-=1.2");

    // Scroll Reveals
    gsap.utils.toArray('.reveal-up').forEach((elem: any) => {
      gsap.from(elem, {
        scrollTrigger: {
          trigger: elem,
          start: 'top 85%'
        },
        y: 60,
        opacity: 0,
        filter: "blur(10px)",
        duration: 1.2,
        ease: 'power3.out'
      });
    });

    gsap.utils.toArray('.reveal-scale').forEach((elem: any, i) => {
      gsap.from(elem, {
        scrollTrigger: {
          trigger: '.glass-grid',
          start: 'top 85%'
        },
        scale: 0.85,
        opacity: 0,
        duration: 0.8,
        delay: i * 0.1,
        ease: 'back.out(1.4)'
      });
    });
    
    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, [isLoading]);

  return (
    <main ref={containerRef} className="relative w-full min-h-screen">
      {/* Loading Screen Overlay */}
      {isLoading && (
        <div className="loading-screen fixed inset-0 bg-[#0B071E] z-[9999] flex flex-col items-center justify-center p-6 clip-[polygon(0_0,_100%_0,_100%_100%,_0_100%)]">
          <div className="absolute inset-0 bg-radial-gradient(circle, rgba(176,38,255,0.05)_0%, transparent_70%) pointer-events-none"></div>
          
          <div className="loader-content flex flex-col items-center max-w-lg w-full text-center z-10">
            {/* Logo */}
            <div className="font-display font-black text-4xl md:text-5xl tracking-tighter mb-8 text-transparent bg-clip-text bg-gradient-to-r from-white to-lavender text-shadow-[0_0_15px_rgba(176,38,255,0.5)]">
              00MAKAA
            </div>
            
            {/* Sottotitolo loader */}
            <div className="text-white/40 text-[10px] tracking-[0.4em] uppercase mb-12 font-display">
              Creative System Boot
            </div>
            
            {/* Progress Percentage */}
            <div className="font-display text-5xl md:text-7xl font-black text-lavender tracking-widest mb-6">
              {progress.toString().padStart(3, '0')}%
            </div>
            
            {/* Futuristic Progress Bar */}
            <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mb-6 border border-white/10 p-[0.5px]">
              <div 
                className="h-full bg-gradient-to-r from-neon via-cyan-neon to-pink-neon rounded-full shadow-[0_0_10px_#B026FF] transition-all duration-75"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            
            {/* Status Diagnostics */}
            <div className="flex items-center justify-center gap-3 font-display text-[10px] tracking-[0.15em] text-neon uppercase h-4">
              <span className="w-1.5 h-1.5 bg-neon rounded-full animate-ping"></span>
              {loadingText}
            </div>
          </div>
        </div>
      )}

      {/* Background Ambient Glows */}
      <div className="ambient-glow glow-1"></div>
      <div className="ambient-glow glow-2"></div>
      <div className="ambient-glow glow-3"></div>

      {/* Navbar */}
      <nav className="fixed top-0 left-0 w-full z-50 bg-[#0B071E]/40 backdrop-blur-xl border-b border-white/5 py-5 transition-all duration-300">
        <div className="container mx-auto px-6 flex justify-between items-center max-w-7xl">
          <div className="font-display font-black text-xl md:text-2xl tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-lavender">
            00makaa
          </div>
          <ul className="hidden md:flex gap-8 items-center font-display text-xs tracking-wider uppercase font-bold">
            <li><a href="#video" className="text-white/60 hover:text-neon transition-all duration-300">Video</a></li>
            <li><a href="#web" className="text-white/60 hover:text-cyan-neon transition-all duration-300">Web</a></li>
            <li><a href="#3d" className="text-white/60 hover:text-pink-neon transition-all duration-300">3D</a></li>
            <li>
              <a href="#contact" className="ml-4 border border-lavender/10 rounded-full px-5 py-2.5 bg-white/5 hover:border-neon hover:shadow-[0_0_15px_rgba(176,38,255,0.25)] transition-all duration-500">
                Connect
              </a>
            </li>
          </ul>
        </div>
      </nav>

      {/* Hero Section (Minimalist, Centered & Premium) */}
      <section className="min-h-screen flex flex-col items-center justify-center pt-28 pb-16 px-6 relative overflow-hidden">
        <div className="container mx-auto max-w-4xl flex flex-col items-center text-center z-10">
          
          {/* Avatar Centerpiece */}
          <div className="profile-wrapper relative w-[230px] h-[230px] md:w-[310px] md:h-[310px] mb-10">
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-neon via-transparent to-pink-neon opacity-20 blur-xl animate-[pulse_4s_infinite]"></div>
            <video 
              src="/avatar saluto.mp4" 
              autoPlay 
              loop 
              muted 
              playsInline 
              className="w-full h-full object-cover rounded-full relative z-10 p-1 bg-[#0b071e] border border-white/10"
            />
            {/* Subtle decorative futuristic rings */}
            <div className="absolute -inset-2.5 rounded-full border border-dashed border-lavender/20 animate-[spin_40s_linear_infinite] z-0"></div>
            <div className="absolute -inset-5 rounded-full border border-double border-neon/15 animate-[spin_25s_linear_reverse_infinite] z-0"></div>
          </div>
          
          {/* Main Title Header */}
          <div className="hero-title-wrapper mb-6">
            <h2 className="text-white/40 font-display text-[10px] md:text-xs tracking-[0.4em] uppercase mb-3">Michele Ciccone</h2>
            <h1 className="text-5xl md:text-8xl font-black tracking-tighter uppercase text-transparent bg-clip-text bg-gradient-to-b from-white via-lavender to-white/90">
              00makaa
            </h1>
          </div>
          
          {/* Slogan in Italian */}
          <p className="hero-subtitle text-lg md:text-2xl text-white/80 max-w-2xl font-light leading-relaxed mb-10 px-4">
            Esperienze digitali <span className="text-neon font-normal text-shadow-[0_0_8px_rgba(176,38,255,0.4)]">fuori dall'ordinario</span>. Fondo codice, montaggio video e arte 3D per plasmare visioni ad <span className="text-neon font-normal text-shadow-[0_0_8px_rgba(176,38,255,0.4)]">altissimo impatto visivo</span>.
          </p>
          
          {/* Category Navigation Capsule */}
          <div className="hero-links flex flex-wrap justify-center gap-6 md:gap-12 mb-12 text-[10px] md:text-xs font-display tracking-[0.25em] uppercase bg-white/5 backdrop-blur-md px-8 py-3.5 rounded-full border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.3)]">
            <a href="#video" className="text-lavender/80 hover:text-neon hover:scale-105 transition-all duration-300">Video Editor</a>
            <span className="text-white/10">/</span>
            <a href="#web" className="text-lavender/80 hover:text-cyan-neon hover:scale-105 transition-all duration-300">Web Developer</a>
            <span className="text-white/10">/</span>
            <a href="#3d" className="text-lavender/80 hover:text-pink-neon hover:scale-105 transition-all duration-300">3D Artist</a>
          </div>
          
          {/* Action Button */}
          <div className="hero-actions">
            <a href="#video" className="inline-block px-10 py-4 bg-transparent text-lavender border border-neon/30 rounded-full font-display font-bold text-[10px] uppercase tracking-[0.2em] hover:bg-neon hover:text-white hover:border-neon hover:shadow-[0_0_20px_#B026FF] transition-all duration-500">
              Esplora Lavori
            </a>
          </div>

        </div>
      </section>

      {/* Video Editing Section */}
      <section id="video" className="py-32 px-6 relative">
        <div className="container mx-auto max-w-7xl">
          <div className="flex flex-col items-start mb-16 reveal-up">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-neon/10 text-lavender border border-neon/30 rounded-full text-[10px] uppercase tracking-widest font-display mb-4">
              <span className="w-1.5 h-1.5 bg-neon rounded-full shadow-[0_0_8px_#B026FF]"></span>
              Visual Creation
            </div>
            <h2 className="font-display text-3xl md:text-5xl font-black mb-4">Video Editing</h2>
            <p className="text-white/60 text-base md:text-lg max-w-2xl font-light">Contenuti video ad alto impatto emotivo. Motion graphics, Investigation Boards e montaggio dinamico professionale.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="glass-panel overflow-hidden flex flex-col reveal-up">
              <div className="relative w-full pt-[56.25%] bg-black">
                <iframe 
                  className="absolute top-0 left-0 w-full h-full border-0" 
                  src="https://www.youtube.com/embed/3M59E7aQeIs" 
                  title="Maes: The first rapper wanted by Interpol" 
                  allowFullScreen
                ></iframe>
              </div>
              <div className="p-6 flex flex-col flex-1 justify-between gap-6">
                <h3 className="font-display text-sm md:text-base leading-snug font-bold">Maes: The first rapper wanted by Interpol</h3>
                <div className="flex items-center justify-between p-3.5 bg-black/40 rounded-xl border border-white/5">
                  <span className="font-display font-bold text-lavender text-xs tracking-wider text-shadow-glow">305K+ Visualizzazioni</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m22 7-8.5 8.5-5-5L2 17"/><path d="M16 7h6v6"/></svg>
                </div>
              </div>
            </div>

            {/* Card 2 */}
            <div className="glass-panel overflow-hidden flex flex-col reveal-up">
              <div className="relative w-full pt-[56.25%] bg-black">
                <iframe 
                  className="absolute top-0 left-0 w-full h-full border-0" 
                  src="https://www.youtube.com/embed/YKQp8Ncj8Hw" 
                  title="Michael Jackson è ancora vivo" 
                  allowFullScreen
                ></iframe>
              </div>
              <div className="p-6 flex flex-col flex-1 justify-between gap-6">
                <h3 className="font-display text-sm md:text-base leading-snug font-bold">Michael Jackson è ancora vivo</h3>
                <div className="flex items-center justify-between p-3.5 bg-black/40 rounded-xl border border-white/5">
                  <span className="font-display font-bold text-lavender text-xs tracking-wider text-shadow-glow">205K+ Visualizzazioni</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m22 7-8.5 8.5-5-5L2 17"/><path d="M16 7h6v6"/></svg>
                </div>
              </div>
            </div>

            {/* Card 3 */}
            <div className="glass-panel overflow-hidden flex flex-col reveal-up">
              <div className="relative w-full pt-[56.25%] bg-black">
                <iframe 
                  className="absolute top-0 left-0 w-full h-full border-0" 
                  src="https://www.youtube.com/embed/_FjjohhodPM" 
                  title="How NLE Choppa Destroyed His Reputation" 
                  allowFullScreen
                ></iframe>
              </div>
              <div className="p-6 flex flex-col flex-1 justify-between gap-6">
                <h3 className="font-display text-sm md:text-base leading-snug font-bold">How NLE Choppa Destroyed His Reputation</h3>
                <div className="flex items-center justify-between p-3.5 bg-black/40 rounded-xl border border-white/5">
                  <span className="font-display font-bold text-lavender text-xs tracking-wider text-shadow-glow">75K+ Visualizzazioni</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m22 7-8.5 8.5-5-5L2 17"/><path d="M16 7h6v6"/></svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Web Development Section (Cyan Accents + Dot Matrix Grid) */}
      <section id="web" className="py-32 px-6 relative bg-black/40 pattern-dot-matrix border-y border-white/5">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0B071E]/80 via-transparent to-[#0B071E]/80 pointer-events-none"></div>
        
        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="flex flex-col items-start mb-20 reveal-up">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-cyan-neon/10 text-cyan-neon border border-cyan-neon/30 rounded-full text-[10px] uppercase tracking-widest font-display mb-4">
              <span className="w-1.5 h-1.5 bg-cyan-neon rounded-full shadow-[0_0_8px_#00F2FE]"></span>
              Interactive Engineering
            </div>
            <h2 className="font-display text-3xl md:text-5xl font-black mb-4">Web Development</h2>
            <p className="text-white/60 text-base md:text-lg max-w-2xl font-light">Ecosistemi web complessi, reattivi e cuciti su misura per l'utente, unendo prestazioni tecniche e design immersivi.</p>
          </div>
          
          {/* Berry Site Case Study */}
          <div className="flex flex-col lg:flex-row gap-16 items-start mb-36 reveal-up">
            <div className="flex-1 w-full">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-neon/10 text-cyan-neon border border-cyan-neon/20 rounded-full text-[9px] uppercase tracking-wider mb-5 font-display">
                Main Case Study
              </div>
              <h3 className="font-display text-2xl md:text-3xl font-black mb-2">Sito Web Ufficiale di Berry</h3>
              <a href="https://berry-site.vercel.app/" target="_blank" className="text-cyan-neon hover:text-shadow-[0_0_8px_rgba(0,242,254,0.5)] transition-all font-display text-xs tracking-wider uppercase mb-8 inline-block">
                Visita il Progetto ↗
              </a>
              
              {/* Interactive Tabs */}
              <div className="flex flex-col gap-4">
                {chicche.map((chicca, idx) => (
                  <button 
                    key={idx}
                    onClick={() => setActiveChicca(idx)}
                    className={`text-left p-4.5 rounded-2xl border transition-all duration-300 cursor-pointer ${
                      activeChicca === idx 
                        ? 'bg-cyan-neon/10 border-cyan-neon shadow-[0_0_20px_rgba(0,242,254,0.15)]' 
                        : 'bg-black/30 border-white/5 hover:border-white/15'
                    }`}
                  >
                    <h4 className={`text-xs font-display font-bold uppercase tracking-wider mb-1.5 transition-colors duration-300 ${
                      activeChicca === idx ? 'text-cyan-neon' : 'text-lavender'
                    }`}>
                      {chicca.title}
                    </h4>
                    <p className="text-white/50 text-xs font-light leading-relaxed">{chicca.desc}</p>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Tab Preview Panel (Finder Style with Cropped Top Bar) */}
            <div className="flex-[1.3] w-full lg:sticky lg:top-32">
              <div className="glass-panel overflow-hidden shadow-[0_25px_50px_-15px_rgba(0,0,0,0.7)] border-white/10 bg-[#120a2a]/60">
                {/* Custom Mac window control bar */}
                <div className="bg-black/40 p-3.5 flex items-center justify-between border-b border-white/5">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#ff5f56] opacity-90 shadow-[0_0_5px_rgba(255,95,86,0.3)]"></div>
                    <div className="w-3 h-3 rounded-full bg-[#ffbd2e] opacity-90"></div>
                    <div className="w-3 h-3 rounded-full bg-[#27c93f] opacity-90"></div>
                  </div>
                  <div className="text-[10px] text-white/30 font-display tracking-widest uppercase">
                    berry-site.app
                  </div>
                  <div className="w-12"></div> {/* Spacer to keep title centered */}
                </div>
                {/* Viewport with CSS dynamic crop to hide original Chrome toolbar */}
                <div className="relative w-full aspect-[16/10] bg-[#0c071d] overflow-hidden">
                  <Image 
                    src={chicche[activeChicca].img} 
                    alt={chicche[activeChicca].title} 
                    fill 
                    className="crop-chrome-screenshot p-0" 
                    key={activeChicca}
                    priority
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Peach Site Case Study */}
          <div className="flex flex-col-reverse lg:flex-row gap-16 items-center reveal-up">
            {/* Peach Site Preview (Finder Style with Cropped Top Bar) */}
            <div className="flex-[1.3] w-full">
              <div className="glass-panel overflow-hidden shadow-[0_25px_50px_-15px_rgba(0,0,0,0.7)] border-white/10 bg-[#120a2a]/60">
                {/* Custom Mac window control bar */}
                <div className="bg-black/40 p-3.5 flex items-center justify-between border-b border-white/5">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#ff5f56] opacity-90 shadow-[0_0_5px_rgba(255,95,86,0.3)]"></div>
                    <div className="w-3 h-3 rounded-full bg-[#ffbd2e] opacity-90"></div>
                    <div className="w-3 h-3 rounded-full bg-[#27c93f] opacity-90"></div>
                  </div>
                  <div className="text-[10px] text-white/30 font-display tracking-widest uppercase">
                    pitch-site.app
                  </div>
                  <div className="w-12"></div>
                </div>
                {/* Viewport with CSS dynamic crop to hide original Chrome toolbar */}
                <div className="relative w-full aspect-[16/10] bg-[#0c071d] overflow-hidden">
                  <Image 
                    src="/pitch site.png" 
                    alt="Peach Site Preview" 
                    fill 
                    className="crop-chrome-screenshot p-0" 
                    priority
                  />
                </div>
              </div>
            </div>
            
            <div className="flex-1 w-full">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-neon/10 text-cyan-neon border border-cyan-neon/20 rounded-full text-[9px] uppercase tracking-wider mb-5 font-display">
                Concept & B2B Pitch
              </div>
              <h3 className="font-display text-2xl md:text-3xl font-black mb-4">The Peach Site</h3>
              <p className="text-white/60 text-base font-light leading-relaxed mb-8">
                È il modello strategico che consegno direttamente al cliente come modulistica per comprendere a fondo struttura, funzionalità, hosting e prezzi del progetto. Funge da solida demo interattiva per futuri clienti commerciali o creator, evidenziando pulizia del codice, posizionamento del brand e facilità di conversione.
              </p>
              <a href="https://pitch-site-berry.vercel.app/" target="_blank" className="text-cyan-neon hover:text-shadow-[0_0_8px_rgba(0,242,254,0.5)] transition-all font-display text-xs tracking-wider uppercase inline-block">
                Visita la Demo ↗
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 3D Art Section (Pink Accents + Wireframe 3D Grid) */}
      <section id="3d" className="py-32 px-6 relative overflow-hidden pattern-wireframe border-b border-white/5">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0B071E] via-transparent to-[#0B071E] pointer-events-none"></div>
        
        <div className="container mx-auto max-w-7xl relative z-10 text-center">
          <div className="flex flex-col items-center mb-20 reveal-up">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-pink-neon/10 text-pink-neon border border-pink-neon/30 rounded-full text-[10px] uppercase tracking-widest font-display mb-4">
              <span className="w-1.5 h-1.5 bg-pink-neon rounded-full shadow-[0_0_8px_#FF007A]"></span>
              Additive Spatial Art
            </div>
            <h2 className="font-display text-3xl md:text-5xl font-black mb-4">3D Art & Modeling</h2>
            <p className="text-white/60 text-base md:text-lg max-w-xl font-light leading-relaxed">Progettazione tridimensionale, modellazione organica/geometrica e configurazioni ingegneristiche pronte per la stampa 3D additiva.</p>
          </div>
          
          {/* Sleek Interactive Wireframe Grid Block */}
          <div className="glass-grid grid grid-cols-2 md:grid-cols-3 gap-6 relative max-w-4xl mx-auto auto-rows-[140px] md:auto-rows-[180px] p-2 bg-[#120a2a]/20 backdrop-blur-md rounded-3xl border border-white/5">
            <div className="reveal-scale bg-white/[0.02] backdrop-blur-sm border border-dashed border-white/10 rounded-2xl transition-all hover:bg-white/[0.05] hover:border-pink-neon/20"></div>
            <div className="reveal-scale bg-white/[0.02] backdrop-blur-sm border border-dashed border-white/10 rounded-2xl transition-all hover:bg-white/[0.05] hover:border-pink-neon/20"></div>
            <div className="reveal-scale bg-white/[0.02] backdrop-blur-sm border border-dashed border-white/10 rounded-2xl transition-all hover:bg-white/[0.05] hover:border-pink-neon/20"></div>
            <div className="reveal-scale bg-white/[0.02] backdrop-blur-sm border border-dashed border-white/10 rounded-2xl transition-all hover:bg-white/[0.05] hover:border-pink-neon/20"></div>
            <div className="reveal-scale bg-white/[0.02] backdrop-blur-sm border border-dashed border-white/10 rounded-2xl transition-all hover:bg-white/[0.05] hover:border-pink-neon/20"></div>
            <div className="reveal-scale bg-white/[0.02] backdrop-blur-sm border border-dashed border-white/10 rounded-2xl transition-all hover:bg-white/[0.05] hover:border-pink-neon/20"></div>
            
            {/* Absolute overlay badge "Coming soon" */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#0B071E]/95 backdrop-blur-2xl border border-pink-neon/50 px-8 py-5 rounded-2xl shadow-[0_0_35px_rgba(255,0,122,0.3)] z-10 w-[88%] md:w-auto transition-transform hover:scale-105 duration-300">
              <div className="flex flex-col md:flex-row items-center justify-center gap-4 font-display text-lavender tracking-wider text-xs md:text-sm uppercase font-bold">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-pink-neon rounded-full shadow-[0_0_10px_#FF007A] animate-[pulse_1.5s_infinite]"></span>
                  3D Gallery & Configurations
                </div>
                <span className="hidden md:inline text-white/30">//</span>
                <span className="text-pink-neon">Coming Soon</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer / Contact Section */}
      <footer id="contact" className="py-28 border-t border-white/5 bg-gradient-to-b from-transparent to-[#120A2A]/50 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(176,38,255,0.05),transparent_60%)] pointer-events-none"></div>
        
        <div className="container mx-auto px-6 relative z-10">
          <h2 className="font-display text-3xl md:text-5xl font-black mb-12 tracking-tight uppercase text-transparent bg-clip-text bg-gradient-to-r from-white to-lavender">
            Fonda il tuo brand con l'etereo.
          </h2>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-20 max-w-xl mx-auto">
            <a 
              href="mailto:micheleciccone40@gmail.com" 
              className="w-full sm:w-auto flex items-center justify-center gap-3.5 px-8 py-4.5 bg-transparent text-lavender border border-neon/30 rounded-full font-display font-bold uppercase tracking-wider text-xs hover:bg-neon hover:text-white hover:border-neon hover:shadow-[0_0_20px_#B026FF] transition-all duration-300 cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
              Invia una Mail
            </a>
            
            <a 
              href="https://www.instagram.com/00makaa" 
              target="_blank" 
              className="w-full sm:w-auto flex items-center justify-center gap-3.5 px-8 py-4.5 bg-transparent text-lavender border border-neon/30 rounded-full font-display font-bold uppercase tracking-wider text-xs hover:bg-neon hover:text-white hover:border-neon hover:shadow-[0_0_20px_#B026FF] transition-all duration-300 cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
              Seguimi su IG
            </a>
          </div>
          
          <div className="h-[1px] w-16 bg-white/10 mx-auto mb-8"></div>
          <p className="text-white/40 text-xs tracking-wider font-light">© 2026 00MAKAA (Michele Ciccone). All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
