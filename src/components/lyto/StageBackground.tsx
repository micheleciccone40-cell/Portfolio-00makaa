"use client";

import { useEffect, useRef } from "react";
import { FULLSCREEN_VERTEX, PLASMA_FRAGMENT, PLASMA_UNIFORMS } from "./plasmaShader";

/*
 * Lo sfondo di lytoprint.it (plasma nero + pulviscolo caldo), portato da src/components/effects del sito
 * e adattato a un riquadro: si dimensiona sul contenitore invece che sulla finestra e si ferma quando
 * il riquadro è fuori schermo.
 */

function compile(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function Plasma({ active }: { active: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const activeRef = useRef(active);
  const playRef = useRef<() => void>(() => {});

  useEffect(() => {
    activeRef.current = active;
    playRef.current();
  }, [active]);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { antialias: false, alpha: false, premultipliedAlpha: false, powerPreference: "low-power" });
    if (!gl) return;
    const vs = compile(gl, gl.VERTEX_SHADER, FULLSCREEN_VERTEX);
    const fs = compile(gl, gl.FRAGMENT_SHADER, PLASMA_FRAGMENT);
    if (!vs || !fs) return;
    const program = gl.createProgram()!;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const u = (name: string) => gl.getUniformLocation(program, name);
    const U = PLASMA_UNIFORMS;
    const colors = new Float32Array(8 * 3);
    U.colors.forEach((c, i) => colors.set(c, i * 3));
    gl.uniform3fv(u("u_colors"), colors);
    gl.uniform4fv(u("u_shape"), U.shape);
    gl.uniform4fv(u("u_surface"), U.surface);
    gl.uniform4fv(u("u_finish"), U.finish);
    gl.uniform4fv(u("u_transform"), U.transform);
    gl.uniform4f(u("u_space"), 0, 0, 0, 0);
    gl.uniform4fv(u("u_cursor"), U.cursor);
    const uScene = u("u_scene");

    // Il plasma è morbido: a metà risoluzione è identico alla vista e costa 4 volte meno.
    const RENDER_SCALE = 0.5;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2) * RENDER_SCALE;
      const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
      const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    };
    const draw = (seconds: number) => {
      resize();
      gl.uniform4f(uScene, canvas.width, canvas.height, seconds * U.timeScale, U.colorCount);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const start = performance.now();
    let raf = 0;
    let lastDraw = 0;
    const loop = (now: number) => {
      if (now - lastDraw >= 33) {
        lastDraw = now;
        draw((now - start) / 1000);
      }
      raf = requestAnimationFrame(loop);
    };
    const play = () => {
      cancelAnimationFrame(raf);
      if (reduced || !activeRef.current || document.hidden) draw(12 + (reduced ? 0 : (performance.now() - start) / 1000));
      else raf = requestAnimationFrame(loop);
    };
    playRef.current = play;
    const ro = new ResizeObserver(() => draw((performance.now() - start) / 1000));
    ro.observe(canvas);
    document.addEventListener("visibilitychange", play);
    play();
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener("visibilitychange", play);
      playRef.current = () => {};
      gl.deleteProgram(program);
      gl.deleteBuffer(buffer);
    };
  }, []);

  return <canvas ref={ref} aria-hidden="true" className="absolute inset-0 h-full w-full" />;
}

interface Mote {
  x: number;
  y: number;
  r: number;
  vy: number;
  vx: number;
  phase: number;
  speed: number;
}

/** Pulviscolo nella luce: particelle calde che salgono lente e scintillano. */
function Sparkles({ active, count = 46 }: { active: boolean; count?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const activeRef = useRef(active);
  const playRef = useRef<() => void>(() => {});

  useEffect(() => {
    activeRef.current = active;
    playRef.current();
  }, [active]);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let w = 0;
    let h = 0;
    const motes: Mote[] = [];
    const spawn = (anywhere: boolean): Mote => ({
      x: Math.random() * w,
      y: anywhere ? Math.random() * h : h + 10,
      r: 0.5 + Math.random() * 1.4,
      vy: -(0.06 + Math.random() * 0.22),
      vx: (Math.random() - 0.5) * 0.08,
      phase: Math.random() * Math.PI * 2,
      speed: 0.4 + Math.random() * 1.2,
    });
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const n = w < 500 ? Math.round(count * 0.6) : count;
    for (let i = 0; i < n; i++) motes.push(spawn(true));

    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(50, now - last) / 16.7;
      last = now;
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < motes.length; i++) {
        const m = motes[i];
        m.y += m.vy * dt;
        m.x += m.vx * dt + Math.sin(now * 0.0004 + m.phase) * 0.05;
        if (m.y < -10) motes[i] = spawn(false);
        const twinkle = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(now * 0.001 * m.speed + m.phase));
        const a = 0.12 + 0.38 * twinkle;
        const g = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.r * 4);
        g.addColorStop(0, `rgba(255, 214, 160, ${a})`);
        g.addColorStop(1, "rgba(255, 190, 120, 0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.r * 4, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(loop);
    };
    const play = () => {
      cancelAnimationFrame(raf);
      if (!activeRef.current || document.hidden) return;
      last = performance.now();
      raf = requestAnimationFrame(loop);
    };
    playRef.current = play;
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    document.addEventListener("visibilitychange", play);
    play();
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener("visibilitychange", play);
      playRef.current = () => {};
    };
  }, [count]);

  return <canvas ref={ref} aria-hidden="true" className="absolute inset-0 h-full w-full" />;
}

export default function StageBackground({ active }: { active: boolean }) {
  return (
    <div className="pointer-events-none absolute inset-0 bg-[#050505]" aria-hidden="true">
      <Plasma active={active} />
      <Sparkles active={active} />
    </div>
  );
}
