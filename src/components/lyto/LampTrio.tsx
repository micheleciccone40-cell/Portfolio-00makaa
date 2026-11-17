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

const SPACING = 1.62;
const INNER_OFF = new THREE.Color("#3A3129");
const INNER_ON = new THREE.Color("#FFD7A3");

/* ─── Una lampada: base + anello dal GLB, corpo litofania generato come tubo, tappo ─── */
function Lamp({
  index,
  texture,
  x,
  phase,
  litTarget,
  delay,
  onToggle,
}: {
  index: number;
  texture: THREE.Texture;
  x: number;
  phase: number;
  litTarget: { current: number[] };
  delay: number;
  onToggle: () => void;
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

  const group = useRef<THREE.Group>(null);
  const light = useRef<THREE.PointLight>(null);
  const baseLight = useRef<THREE.PointLight>(null);
  const glow = useRef(0);
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
    if (group.current) group.current.rotation.y = phase + clock.current * 0.32;
  });

  return (
    <group
      position={[x, 0, 0]}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      onPointerOver={() => (document.body.style.cursor = "pointer")}
      onPointerOut={() => (document.body.style.cursor = "")}
    >
      <group ref={group} scale={SCENE_SCALE}>
        <group position-y={ASSEMBLY.base}>
          <PartMesh node={nodes.base} material={materials.base} />
          <pointLight ref={baseLight} position={[0, 75, 0]} color="#FFC98A" distance={3} decay={2} />
        </group>
        <group position-y={ASSEMBLY.ring}>
          <PartMesh node={nodes.ring} material={materials.ring} />
        </group>
        <group position-y={ASSEMBLY.body}>
          <mesh geometry={geometries.outer} material={materials.body} />
          <mesh geometry={geometries.inner} material={materials.inner} />
          <mesh geometry={geometries.rim} material={materials.rim} position={[0, BODY.heightMm, 0]} />
          <mesh geometry={geometries.rim} material={materials.rim} rotation={[Math.PI, 0, 0]} />
          <pointLight ref={light} position={[0, BODY.heightMm * 0.3, 0]} color="#FFB566" distance={6} decay={2} />
        </group>
        <group position-y={ASSEMBLY.cap}>
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
  onToggle,
}: {
  lamps: TrioLamp[];
  litTarget: { current: number[] };
  onToggle: (i: number) => void;
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
          onToggle={() => onToggle(i)}
        />
      ))}
    </>
  );
}

/** Inquadra sempre le tre lampade, qualunque sia il rapporto d'aspetto del pannello. */
function Rig() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const aspect = useThree((s) => s.size.width / s.size.height);
  useEffect(() => {
    const half = THREE.MathUtils.degToRad(camera.fov / 2);
    const needW = SPACING * 2 + 2.1;
    const needH = 3.25;
    const dist = Math.max(needH / 2 / Math.tan(half), needW / 2 / (Math.tan(half) * aspect));
    const tilt = 0.13;
    camera.position.set(0, LAMP_CENTER_Y + Math.sin(tilt) * dist, Math.cos(tilt) * dist);
    camera.lookAt(0, LAMP_CENTER_Y - 0.32, 0);
    camera.updateProjectionMatrix();
  }, [camera, aspect]);
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
  onToggle,
  fallback,
}: {
  lamps: TrioLamp[];
  /** false quando la sezione è fuori schermo: il rendering si ferma. */
  active: boolean;
  litTarget: { current: number[] };
  onToggle: (i: number) => void;
  fallback: ReactNode;
}) {
  return (
    <ErrorBoundary fallback={fallback}>
      <Canvas
        dpr={[1, 2]}
        frameloop={active ? "always" : "never"}
        camera={{ position: [0, 1.4, 7], fov: 30 }}
        gl={{ antialias: true, alpha: true }}
      >
        <Lights />
        <Rig />
        <Suspense fallback={null}>
          <Trio lamps={lamps} litTarget={litTarget} onToggle={onToggle} />
        </Suspense>
      </Canvas>
    </ErrorBoundary>
  );
}

useGLTF.preload(MODEL_URL);
