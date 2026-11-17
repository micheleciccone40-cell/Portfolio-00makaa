"use client";
/* three.js si anima mutando materiali e oggetti in useFrame: è il modello di react-three-fiber. */
/* eslint-disable react-hooks/immutability */

import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";

type Ref<T> = { current: T };

export interface CapModel {
  id: string;
  /** STL del tappo (mm, Z verso l'alto come nello slicer). */
  url: string;
  /** true se la piastra sta in basso nell'STL e l'innesto sopra: va capovolto per averlo montato. */
  flip?: boolean;
  /** Specchia il logo, se visto dal lato esterno risulta rovesciato. */
  mirror?: boolean;
}

/** Elevazione della camera: abbastanza alta da leggere il logo traforato, abbastanza bassa da vedere lo spessore. */
const ELEVATION = THREE.MathUtils.degToRad(64);
const CAP_DIAMETER_MM = 93.2;
const GLOW_OFF = new THREE.Color("#2a211a");
const GLOW_ON = new THREE.Color("#ffc677");

/** Centra il tappo e lo porta in coordinate three (Y in alto), con la faccia esterna a y = 0. */
function prepare(source: THREE.BufferGeometry, cap: CapModel): THREE.BufferGeometry {
  const g = source.clone();
  g.computeBoundingBox();
  const box = g.boundingBox!;
  g.translate(-(box.min.x + box.max.x) / 2, -(box.min.y + box.max.y) / 2, 0);
  if (cap.mirror) g.scale(-1, 1, 1);
  // Piastra sopra: Z→Y. Piastra sotto (innesto in alto nell'STL): capovolto, così l'innesto scende.
  g.rotateX(cap.flip ? Math.PI / 2 : -Math.PI / 2);
  g.computeBoundingBox();
  g.translate(0, -g.boundingBox!.max.y, 0);
  if (cap.mirror) {
    // Lo scale negativo rovescia l'ordine dei vertici: si ricalcolano le normali.
    g.computeVertexNormals();
  }
  return g;
}

function Cap({
  index,
  geometry,
  lampScreenX,
  litTarget,
  phase,
}: {
  index: number;
  geometry: THREE.BufferGeometry;
  lampScreenX: Ref<number[]>;
  litTarget: Ref<number[]>;
  phase: number;
}) {
  const size = useThree((s) => s.size);
  const camera = useThree((s) => s.camera) as THREE.OrthographicCamera;
  const material = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#A4633A",
        roughness: 0.5,
        clearcoat: 0.28,
        clearcoatRoughness: 0.5,
        sheen: 0.4,
        sheenRoughness: 0.5,
        sheenColor: "#FFC99A",
        side: THREE.DoubleSide,
      }),
    [],
  );
  // Il LED sotto il tappo: si vede solo attraverso il logo traforato.
  const glowMat = useMemo(() => new THREE.MeshBasicMaterial({ color: GLOW_ON.clone(), toneMapped: false }), []);
  const glowGeo = useMemo(() => new THREE.CircleGeometry(38, 64).rotateX(-Math.PI / 2), []);
  useEffect(
    () => () => {
      material.dispose();
      glowMat.dispose();
      glowGeo.dispose();
    },
    [material, glowMat, glowGeo],
  );

  const group = useRef<THREE.Group>(null);
  const spin = useRef<THREE.Group>(null);
  const glow = useRef(1);
  const clock = useRef(0);

  useFrame((_, dt) => {
    clock.current += dt;
    glow.current += (litTarget.current[index] - glow.current) * (1 - Math.exp(-dt * 3));
    glowMat.color.copy(GLOW_OFF).lerp(GLOW_ON, glow.current);
    // Stessa rotazione della lampada sopra.
    if (spin.current) spin.current.rotation.y = phase + clock.current * 0.32;
    if (group.current) group.current.position.x = (lampScreenX.current[index] * size.width) / 2 / camera.zoom;
  });

  return (
    <group ref={group}>
      <group ref={spin}>
        <mesh geometry={geometry} material={material} />
        <mesh geometry={glowGeo} material={glowMat} position-y={-6.2} />
      </group>
    </group>
  );
}

function Caps({
  caps,
  lampScreenX,
  litTarget,
}: {
  caps: CapModel[];
  lampScreenX: Ref<number[]>;
  litTarget: Ref<number[]>;
}) {
  const sources = useLoader(STLLoader, caps.map((c) => c.url));
  const geometries = useMemo(() => sources.map((g, i) => prepare(g, caps[i])), [sources, caps]);
  useEffect(() => () => geometries.forEach((g) => g.dispose()), [geometries]);
  return (
    <>
      {geometries.map((g, i) => (
        <Cap
          key={caps[i].id}
          index={i}
          geometry={g}
          lampScreenX={lampScreenX}
          litTarget={litTarget}
          phase={-0.35 + i * 0.35}
        />
      ))}
    </>
  );
}

/** Camera ortografica inclinata: il tappo occupa sempre circa metà della colonna della sua lampada. */
function Rig() {
  const camera = useThree((s) => s.camera) as THREE.OrthographicCamera;
  const size = useThree((s) => s.size);
  useEffect(() => {
    const footprintH = CAP_DIAMETER_MM * Math.sin(ELEVATION) + 9 * Math.cos(ELEVATION);
    const px = Math.min((size.width / 3) * 0.8, (size.height * 0.9 * CAP_DIAMETER_MM) / footprintH);
    camera.zoom = px / CAP_DIAMETER_MM;
    const d = 400;
    camera.position.set(0, Math.sin(ELEVATION) * d, Math.cos(ELEVATION) * d);
    camera.lookAt(0, -4, 0);
    camera.near = 1;
    camera.far = 2000;
    camera.updateProjectionMatrix();
  }, [camera, size]);
  return null;
}

export default function CapTrio({
  caps,
  active,
  lampScreenX,
  litTarget,
}: {
  caps: CapModel[];
  active: boolean;
  lampScreenX: Ref<number[]>;
  litTarget: Ref<number[]>;
}) {
  return (
    <Canvas
      orthographic
      dpr={[1, 2]}
      frameloop={active ? "always" : "never"}
      camera={{ position: [0, 330, 220], zoom: 2 }}
      gl={{ antialias: true, alpha: true }}
      style={{ background: "transparent" }}
    >
      <ambientLight intensity={0.35} />
      <directionalLight position={[120, 300, 200]} intensity={1.6} color="#FFF0DA" />
      <directionalLight position={[-200, 120, -150]} intensity={0.6} color="#FFC58A" />
      <Environment resolution={128} frames={1} environmentIntensity={0.5}>
        <Lightformer form="rect" intensity={2.6} color="#FFF3E2" position={[0, 5, 4]} scale={[7, 2.5, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={1.2} color="#FFC890" position={[-6, 2, -1]} scale={[2, 7, 1]} target={[0, 0, 0]} />
      </Environment>
      <Rig />
      <Suspense fallback={null}>
        <Caps caps={caps} lampScreenX={lampScreenX} litTarget={litTarget} />
      </Suspense>
    </Canvas>
  );
}
