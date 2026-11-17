"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { TrioLamp } from "./LampTrio";

const LampTrio = dynamic(() => import("./LampTrio"), { ssr: false });

const SITE_URL = "https://lytoprint.it";

const LAMPS: (TrioLamp & { code: string; name: string })[] = [
  { id: "yugioh", code: "L.01", name: "Yu-Gi-Oh!", litho: "/lyto/litho-yugioh.webp" },
  { id: "charizard", code: "L.02", name: "Charizard", litho: "/lyto/litho-charizard.webp" },
  { id: "spiderman", code: "L.03", name: "Spider-Man", litho: "/lyto/litho-spiderman.webp" },
];

const SITE_SHOTS = [
  { src: "/lyto/site-00.webp", label: "HOME" },
  { src: "/lyto/site-01.webp", label: "MONTAGGIO" },
  { src: "/lyto/site-02.webp", label: "CORPO INTERCAMBIABILE" },
  { src: "/lyto/site-03.webp", label: "CONFIGURATORE 3D" },
];

function ArrowNE() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
      <path d="M1 9L9 1M9 1H2.5M9 1V7.5" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

/** Litofanie statiche: mostrate se WebGL non è disponibile. */
function StaticFallback() {
  return (
    <div className="absolute inset-0 grid grid-cols-3 gap-4 p-8">
      {LAMPS.map((l) => (
        <div key={l.id} className="relative overflow-hidden rounded-[2px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={l.litho} alt={`Litofania ${l.name}`} className="h-full w-full object-cover sepia" />
        </div>
      ))}
    </div>
  );
}

export default function LytoShowcase() {
  const stageRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [lit, setLit] = useState([true, true, true]);
  const litTarget = useRef([1, 1, 1]);
  const [shot, setShot] = useState(0);

  // Il canvas nasce solo quando la sezione si avvicina, e si ferma quando esce dallo schermo.
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
        if (entry.isIntersecting) setMounted(true);
      },
      { rootMargin: "200px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Il mini-browser sfoglia le pagine del sito.
  useEffect(() => {
    if (!inView) return;
    const id = window.setInterval(() => setShot((s) => (s + 1) % SITE_SHOTS.length), 3200);
    return () => window.clearInterval(id);
  }, [inView]);

  const toggle = (i: number) => {
    litTarget.current[i] = litTarget.current[i] > 0.5 ? 0 : 1;
    setLit(litTarget.current.map((v) => v > 0.5));
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* ─── Sinistra: tre LYTOLAMP reali in 3D ─── */}
      <div className="reveal lg:col-span-8">
        <div className="frame-caption">
          <span>LYTOLAMP — LITOFANIE STAMPATE IN 3D</span>
          <span className="hidden sm:block">TOCCA UNA LAMPADA PER SPEGNERLA</span>
        </div>
        <div
          ref={stageRef}
          className="relative aspect-[4/3] w-full overflow-hidden border border-line sm:aspect-[16/10]"
          style={{
            background:
              "radial-gradient(ellipse 70% 55% at 50% 62%, rgba(255,170,90,0.16), rgba(255,170,90,0) 70%), #0e0d0b",
          }}
        >
          {mounted && (
            <div className="absolute inset-0">
              <LampTrio
                lamps={LAMPS}
                active={inView}
                fallback={<StaticFallback />}
                litTarget={litTarget}
                onToggle={toggle}
              />
            </div>
          )}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 grid grid-cols-3 px-2 pb-4 sm:pb-6">
            {LAMPS.map((l, i) => (
              <button
                key={l.id}
                onClick={() => toggle(i)}
                className="pointer-events-auto mx-auto flex flex-col items-center gap-1 font-mono text-[9px] tracking-[0.2em] text-[#e9dcc6]/70 transition-colors hover:text-[#ffcf96] sm:text-[10px]"
                aria-pressed={lit[i]}
                aria-label={`${lit[i] ? "Spegni" : "Accendi"} la lampada ${l.name}`}
              >
                <span className={lit[i] ? "text-accent" : ""}>{l.code}</span>
                <span className="uppercase">{l.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Destra: il sito lytoprint.it in miniatura ─── */}
      <div className="reveal flex flex-col lg:col-span-4">
        <div className="frame-caption">
          <span className="text-accent">SITO</span>
          <span>NEXT.JS · THREE.JS · STRIPE</span>
        </div>
        <a
          href={SITE_URL}
          target="_blank"
          rel="noopener"
          className="group block overflow-hidden border border-line bg-[#0e0d0b]"
          aria-label="Apri lytoprint.it in una nuova scheda"
        >
          {/* Barra del browser */}
          <div className="flex items-center gap-3 border-b border-white/10 bg-[#1a1916] px-3 py-2">
            <span className="flex gap-1.5" aria-hidden="true">
              <span className="h-2 w-2 rounded-full bg-white/20"></span>
              <span className="h-2 w-2 rounded-full bg-white/20"></span>
              <span className="h-2 w-2 rounded-full bg-white/20"></span>
            </span>
            <span className="flex-1 truncate rounded-sm bg-white/[0.06] px-2.5 py-1 font-mono text-[10px] tracking-[0.08em] text-white/60">
              lytoprint.it
            </span>
            <span className="text-white/50 transition-colors group-hover:text-accent">
              <ArrowNE />
            </span>
          </div>
          {/* Schermate del sito, in dissolvenza */}
          <div className="relative aspect-[1264/720] w-full overflow-hidden">
            {SITE_SHOTS.map((s, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={s.src}
                src={s.src}
                alt={`lytoprint.it — ${s.label.toLowerCase()}`}
                loading="lazy"
                className={`absolute inset-0 h-full w-full object-cover transition-all duration-[1200ms] ease-out group-hover:scale-[1.03] ${
                  i === shot ? "opacity-100" : "opacity-0"
                }`}
              />
            ))}
          </div>
          <div className="flex items-center justify-between border-t border-white/10 px-3 py-2 font-mono text-[9px] tracking-[0.18em] text-white/50">
            <span>{SITE_SHOTS[shot].label}</span>
            <span className="flex gap-1">
              {SITE_SHOTS.map((s, i) => (
                <span key={s.src} className={`h-[2px] w-4 transition-colors ${i === shot ? "bg-accent" : "bg-white/20"}`}></span>
              ))}
            </span>
          </div>
        </a>

        <div className="mt-6 flex flex-1 flex-col">
          <span className="mb-3 block font-mono text-[11px] tracking-[0.2em] text-muted">CASE 03 — BRAND + PRODOTTO</span>
          <h3 className="headline mb-4 text-[clamp(1.8rem,3vw,2.6rem)] leading-[0.95]">LytoPrint</h3>
          <p className="text-sm leading-relaxed text-muted md:text-base">
            Il mio brand di lampade litofaniche: una foto diventa luce, strato dopo strato. Ho progettato la
            lampada, il generatore che trasforma un&apos;immagine in un modello stampabile e il sito con il
            configuratore 3D in tempo reale. Le tre qui accanto sono lampade vere, renderizzate con lo stesso
            motore del sito.
          </p>
          <div className="mt-6 grid grid-cols-3 divide-x divide-line border border-line">
            {[
              { label: "RUOLO", value: "Prodotto + Sito" },
              { label: "STAMPA", value: "PLA · FDM" },
              { label: "STATO", value: "Online · beta" },
            ].map((m) => (
              <div key={m.label} className="px-3 py-3">
                <span className="block font-mono text-[9px] tracking-[0.2em] text-muted">{m.label}</span>
                <span className="mt-1 block text-[12px] leading-snug font-semibold text-ink">{m.value}</span>
              </div>
            ))}
          </div>
          <a href={SITE_URL} target="_blank" rel="noopener" className="btn-solid mt-6 w-max">
            Visita lytoprint.it <ArrowNE />
          </a>
        </div>
      </div>
    </div>
  );
}
