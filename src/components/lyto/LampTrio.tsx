"use client";
/* three.js si anima mutando materiali e texture fuori dal ciclo di render di React (useFrame):
   è il modello di react-three-fiber, non uno stato React. */
/* eslint-disable react-hooks/immutability */

import { Component, Suspense, useEffect, useMemo, useRef, type ReactNode } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer, useGLTF, useTexture } from "@react-three/drei";
import * as THREE from "three";
import { ASSEMBLY, BODY, LAMP_CENTER_Y, SCENE_SCALE, createBodyMaterial, setBodyImage, setBodyLit } from "./lamp";

const MODEL_URL = "/lyto/lamp.glb";

export interface TrioLamp {
  id: string;
  litho: string;
}

type Ref<T> = { current: T };
type PartId = "base" | "ring" | "body" | "cap";
const PART_IDS: readonly PartId[] = ["base", "ring", "body", "cap"];

const SPACING = 1.62;
const INNER_OFF = new THREE.Color("#3A3129");
const INNER_ON = new THREE.Color("#FFD7A3");

/* ─── Scomposizione (come su lytoprint.it, src/three/explode.ts) ─── */

/** Spostamento verticale a lampada aperta (mm): la base resta a terra, gli altri pezzi salgono. */
const EXPLODE_GAP_MM: Record<PartId, number> = { base: 0, ring: 34, body: 70, cap: 122 };
/** Rotazione massima dei pezzi che si avvitano: corpo sull'aggancio, tappo sul corpo. */
const TWIST: Record<PartId, number> = { base: 0, ring: 0, body: 0.9, cap: 1.4 };
/** Altezza della lampada aperta, in unità di scena (serve alla camera per inquadrarla tutta). */
const EXPLODED_TOP = (ASSEMBLY.cap + 5.2 + EXPLODE_GAP_MM.cap) * SCENE_SCALE;

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeOutCubic = (t: number) => 1 - Math.pow(1 - clamp01(t), 3);
const easeInOutCubic = (t: number) => {
  const x = clamp01(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};
/** Montaggio in sequenza dal basso: ogni pezzo parte 0.2 dopo il precedente e dura 0.4. */
const partAssembled = (t: number, i: number) => clamp01((clamp01(t) * 5 - i) / 2);

/* ─── Una lampada: base + anello dal GLB, corpo litofania generato come tubo, tappo ─── */
function Lamp({
  index,
  texture,
  x,
  phase,
  delay,
  litTarget,
  explodeTarget,
  explodeNow,
  onPress,
  onDoublePress,
}: {
  index: number;
  texture: THREE.Texture;
  x: number;
  phase: number;
  delay: number;
  litTarget: Ref<number[]>;
  explodeTarget: Ref<number[]>;
  /** Scomposizione attuale di ogni lampada, letta dalla camera. */
  explodeNow: Ref<number[]>;
  onPress: () => void;
  onDoublePress: () => void;
}) {
  const { nodes } = useGLTF(MODEL_URL) as unknown as { nodes: Record<string, THREE.Mesh> };

  const materials = useMemo(
    () => ({
      base: new THREE.MeshPhysicalMaterial({ color: "#BE9364", roughness: 0.58, clearcoat: 0.22, clearcoatRoughness: 0.55, sheen: 0.4, sheenRoughness: 0.5, sheenColor: "#FFD9A8" }),
      ring: new THREE.MeshPhysicalMaterial({ color: "#1B1917", roughness: 0.36, metalness: 0.05, clearcoat: 0.5, clearcoatRoughness: 0.3 }),
      cap: new THREE.MeshPhysicalMaterial({ color: "#A4633A", roughness: 0.5, clearcoat: 0.28, clearcoatRoughness: 0.5, sheen: 0.4, sheenRoughness: 0.5, sheenColor: "#FFC99A" }),
      body: createBodyMaterial(),
      inner: new THREE.MeshBasicMaterial({ color: INNER_OFF.clone(), side: THREE.BackSide }),
      rim: new THREE.MeshStandardMaterial({ color: "#EAE0CC", roughness: 0.85, emissive: "#FFC27A", emissiveIntensity: 0 }),
    }),
    [],
  );

  const geometries = useMemo(() => {
    const outer = new THREE.CylinderGeometry(BODY.radiusMm, BODY.radiusMm, BODY.heightMm, 128, 1, true);
    outer.translate(0, BODY.heightMm / 2, 0);
    const inner = new THREE.CylinderGeometry(BODY.innerRadiusMm, BODY.innerRadiusMm, BODY.heightMm, 96, 1, true);
    inner.translate(0, BODY.heightMm / 2, 0);
    const rim = new THREE.RingGeometry(BODY.innerRadiusMm, BODY.radiusMm, 128, 1);
    rim.rotateX(-Math.PI / 2);
    return { outer, inner, rim };
  }, []);

  useEffect(() => {
    setBodyImage(materials.body, texture);
  }, [materials, texture]);

  useEffect(
    () => () => {
      Object.values(materials).forEach((m) => m.dispose());
      Object.values(geometries).forEach((g) => g.dispose());
    },
    [materials, geometries],
  );

  const spin = useRef<THREE.Group>(null);
  const baseG = useRef<THREE.Group>(null);
  const ringG = useRef<THREE.Group>(null);
  const bodyG = useRef<THREE.Group>(null);
  const capG = useRef<THREE.Group>(null);
  const light = useRef<THREE.PointLight>(null);
  const baseLight = useRef<THREE.PointLight>(null);
  const glow = useRef(0);
  const explode = useRef(0);
  const clock = useRef(0);

  useFrame((_, dt) => {
    clock.current += dt;

    // Accensione a cascata: ogni lampada aspetta il suo turno.
    const target = clock.current > delay ? litTarget.current[index] : 0;
    glow.current += (target - glow.current) * (1 - Math.exp(-dt * 3));
    const g = glow.current;
    setBodyLit(materials.body, g);
    materials.inner.color.copy(INNER_OFF).lerp(INNER_ON, g);
    materials.rim.emissiveIntensity = g * 0.55;
    if (light.current) light.current.intensity = g * 6;
    if (baseLight.current) baseLight.current.intensity = g * 1.5;

    // Scomposizione a cascata con uno smorzamento lento, che dà peso ai pezzi.
    explode.current += (explodeTarget.current[index] - explode.current) * (1 - Math.exp(-dt * 2.2));
    explodeNow.current[index] = explode.current;
    const assembled = 1 - explode.current;
    const groups: Record<PartId, THREE.Group | null> = { base: baseG.current, ring: ringG.current, body: bodyG.current, cap: capG.current };
    PART_IDS.forEach((id, i) => {
      const grp = groups[id];
      if (!grp) return;
      const a = partAssembled(assembled, i);
      grp.position.y = ASSEMBLY[id] + (1 - easeInOutCubic(a)) * EXPLODE_GAP_MM[id];
      grp.rotation.y = TWIST[id] * (1 - easeOutCubic(a));
    });

    // Gira su se stessa; aperta rallenta, così i pezzi si leggono.
    if (spin.current) spin.current.rotation.y += dt * lerp(0.32, 0.12, explode.current);
  });

  return (
    <group
      position={[x, 0, 0]}
      onClick={(e) => {
        e.stopPropagation();
        onPress();
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onDoublePress();
      }}
      onPointerOver={() => (document.body.style.cursor = "pointer")}
      onPointerOut={() => (document.body.style.cursor = "")}
    >
      <group ref={spin} rotation-y={phase} scale={SCENE_SCALE}>
        <group ref={baseG} position-y={ASSEMBLY.base}>
          <PartMesh node={nodes.base} material={materials.base} />
          <pointLight ref={baseLight} position={[0, 75, 0]} color="#FFC98A" distance={3} decay={2} />
        </group>
        <group ref={ringG} position-y={ASSEMBLY.ring}>
          <PartMesh node={nodes.ring} material={materials.ring} />
        </group>
        <group ref={bodyG} position-y={ASSEMBLY.body}>
          <mesh geometry={geometries.outer} material={materials.body} />
          <mesh geometry={geometries.inner} material={materials.inner} />
          <mesh geometry={geometries.rim} material={materials.rim} position={[0, BODY.heightMm, 0]} />
          <mesh geometry={geometries.rim} material={materials.rim} rotation={[Math.PI, 0, 0]} />
          <pointLight ref={light} position={[0, BODY.heightMm * 0.3, 0]} color="#FFB566" distance={6} decay={2} />
        </group>
        <group ref={capG} position-y={ASSEMBLY.cap}>
          <PartMesh node={nodes.cap} material={materials.cap} />
        </group>
      </group>
    </group>
  );
}

/** Il GLB è quantizzato (meshopt): la trasformazione reale sta sul nodo. */
function PartMesh({ node, material }: { node: THREE.Mesh; material: THREE.Material }) {
  return <mesh geometry={node.geometry} material={material} position={node.position} quaternion={node.quaternion} scale={node.scale} />;
}

function Trio({
  lamps,
  litTarget,
  explodeTarget,
  explodeNow,
  onPress,
  onDoublePress,
}: {
  lamps: TrioLamp[];
  litTarget: Ref<number[]>;
  explodeTarget: Ref<number[]>;
  explodeNow: Ref<number[]>;
  onPress: (i: number) => void;
  onDoublePress: (i: number) => void;
}) {
  const loaded = useTexture(lamps.map((l) => l.litho));
  const textures = useMemo(() => {
    const list = Array.isArray(loaded) ? loaded : [loaded];
    for (const t of list) {
      t.colorSpace = THREE.SRGBColorSpace;
      t.wrapS = THREE.RepeatWrapping;
      t.offset.x = 0.5; // centro dell'immagine davanti alla camera
      t.anisotropy = 4;
      t.needsUpdate = true;
    }
    return list;
  }, [loaded]);

  return (
    <>
      {lamps.map((l, i) => (
        <Lamp
          key={l.id}
          index={i}
          texture={textures[i]}
          x={(i - 1) * SPACING}
          phase={-0.35 + i * 0.35}
          delay={0.35 + i * 0.45}
          litTarget={litTarget}
          explodeTarget={explodeTarget}
          explodeNow={explodeNow}
          onPress={() => onPress(i)}
          onDoublePress={() => onDoublePress(i)}
        />
      ))}
    </>
  );
}

/**
 * Inquadra sempre le tre lampade, qualunque sia il rapporto d'aspetto del pannello. Quando una lampada si
 * apre la camera arretra e sale quanto basta per tenerla tutta in quadro.
 */
const projected = new THREE.Vector3();

function Rig({ explodeNow, lampScreenX }: { explodeNow: Ref<number[]>; lampScreenX?: Ref<number[]> }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const aspect = useThree((s) => s.size.width / s.size.height);
  const open = useRef(0);
  useFrame(() => {
    const k = easeInOutCubic(Math.max(...explodeNow.current));
    if (Math.abs(k - open.current) < 1e-4 && camera.userData.aspect === aspect) return;
    open.current = k;
    camera.userData.aspect = aspect;
    const half = THREE.MathUtils.degToRad(camera.fov / 2);
    const needW = SPACING * 2 + 2.1;
    const needH = lerp(3.25, EXPLODED_TOP + 1.5, k);
    const centerY = lerp(LAMP_CENTER_Y - 0.32, EXPLODED_TOP / 2 - 0.3, k);
    const dist = Math.max(needH / 2 / Math.tan(half), needW / 2 / (Math.tan(half) * aspect));
    const tilt = 0.13;
    camera.position.set(0, centerY + Math.sin(tilt) * dist, Math.cos(tilt) * dist);
    camera.lookAt(0, centerY, 0);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
    // Dove cade ogni lampada sullo schermo (-1…1): i tappi sotto il palco si allineano qui.
    if (lampScreenX) {
      for (let i = 0; i < 3; i++) {
        projected.set((i - 1) * SPACING, LAMP_CENTER_Y, 0).project(camera);
        lampScreenX.current[i] = projected.x;
      }
    }
  });
  return null;
}

function Lights() {
  return (
    <>
      <ambientLight intensity={0.06} />
      <directionalLight position={[3.5, 6, 4]} intensity={1.0} color="#FFF0DA" />
      <directionalLight position={[-5, 2.5, -3]} intensity={0.5} color="#FFC58A" />
      <Environment resolution={256} frames={1} environmentIntensity={0.45}>
        <Lightformer form="rect" intensity={2.6} color="#FFF3E2" position={[0, 5, 4]} scale={[7, 2.5, 1]} target={[0, 1, 0]} />
        <Lightformer form="rect" intensity={1.4} color="#FFC890" position={[-6, 2, -1]} scale={[2, 7, 1]} target={[0, 1, 0]} />
        <Lightformer form="rect" intensity={0.9} color="#FFE2C0" position={[6, 1.5, 2]} scale={[2, 5, 1]} target={[0, 1, 0]} />
        <Lightformer form="ring" intensity={1.2} color="#FFB566" position={[0, 3, -6]} scale={3} target={[0, 1, 0]} />
      </Environment>
      <ContactShadows position={[0, 0.002, 0]} opacity={0.6} scale={7} blur={2.6} far={2.2} resolution={512} color="#000000" />
    </>
  );
}

class ErrorBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export default function LampTrio({
  lamps,
  active,
  litTarget,
  explodeTarget,
  onPress,
  onDoublePress,
  lampScreenX,
  fallback,
}: {
  lamps: TrioLamp[];
  /** false quando la sezione è fuori schermo: il rendering si ferma. */
  active: boolean;
  litTarget: Ref<number[]>;
  explodeTarget: Ref<number[]>;
  onPress: (i: number) => void;
  onDoublePress: (i: number) => void;
  /** Riempito con la posizione orizzontale di ogni lampada sullo schermo (-1…1). */
  lampScreenX?: Ref<number[]>;
  fallback: ReactNode;
}) {
  const explodeNow = useRef([0, 0, 0]);
  return (
    <ErrorBoundary fallback={fallback}>
      <Canvas
        dpr={[1, 2]}
        frameloop={active ? "always" : "never"}
        camera={{ position: [0, 1.4, 7], fov: 30 }}
        gl={{ antialias: true, alpha: true }}
      >
        <Lights />
        <Rig explodeNow={explodeNow} lampScreenX={lampScreenX} />
        <Suspense fallback={null}>
          <Trio
            lamps={lamps}
            litTarget={litTarget}
            explodeTarget={explodeTarget}
            explodeNow={explodeNow}
            onPress={onPress}
            onDoublePress={onDoublePress}
          />
        </Suspense>
      </Canvas>
    </ErrorBoundary>
  );
}

useGLTF.preload(MODEL_URL);
