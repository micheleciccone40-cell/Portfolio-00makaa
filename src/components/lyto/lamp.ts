import * as THREE from "three";

/*
 * Misure e materiale della LYTOLAMP, portati dal sito lytoprint.it (src/config/assembly.ts e
 * src/three/litophaneMaterial.ts). 1 unità di scena = 100 mm.
 */

export const SCENE_SCALE = 0.01;

/** Corpo litofania: tubo Ø esterno 93 mm, Ø interno 85,38 mm, alto 159 mm. */
export const BODY = { radiusMm: 46.5, innerRadiusMm: 42.69, heightMm: 159 } as const;

/** Altezze reali misurate dagli STL (mm). */
const PART_HEIGHTS = { base: 51.44, ring: 6.5, cap: 5.2 } as const;
const RING_SEAT_MM = 3.3;

/** Quota del fondo di ogni pezzo a lampada montata (mm). */
export const ASSEMBLY = {
  base: 0,
  ring: PART_HEIGHTS.base - RING_SEAT_MM,
  body: PART_HEIGHTS.base,
  cap: PART_HEIGHTS.base + BODY.heightMm,
} as const;

export const LAMP_HEIGHT_MM = ASSEMBLY.cap + PART_HEIGHTS.cap;
export const LAMP_CENTER_Y = (LAMP_HEIGHT_MM / 2) * SCENE_SCALE;

const CREAM = new THREE.Color("#EFE6D2");
const SHADOW = new THREE.Color("#5C4634");

/**
 * PLA bianco: crema satinato da spento, litofania luminosa da acceso. Dove la parete è sottile (chiaro
 * nell'immagine) passa luce quasi bianca, dove è spessa resta un'ambra profonda.
 */
export function createBodyMaterial(): THREE.MeshPhysicalMaterial {
  const mat = new THREE.MeshPhysicalMaterial({
    color: CREAM.clone(),
    roughness: 0.78,
    metalness: 0,
    sheen: 0.35,
    sheenRoughness: 0.6,
    sheenColor: new THREE.Color("#FFF4E0"),
    side: THREE.FrontSide,
    emissive: new THREE.Color("#FFB566"),
    emissiveIntensity: 1,
  });
  mat.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying float vLitoHeight;")
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>\nvLitoHeight = clamp(position.y / ${BODY.heightMm.toFixed(1)}, 0.0, 1.0);`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\nvarying float vLitoHeight;")
      .replace(
        "#include <emissivemap_fragment>",
        `
        #ifdef USE_EMISSIVEMAP
          float litoThin = texture2D( emissiveMap, vEmissiveMapUv ).r;
          litoThin = pow( litoThin, 1.25 );
          vec3 litoTone = mix( vec3( 0.66, 0.24, 0.05 ), vec3( 1.0, 0.82, 0.58 ), litoThin );
          litoTone = mix( litoTone, vec3( 1.0, 0.92, 0.78 ), smoothstep( 0.75, 1.0, litoThin ) );
          totalEmissiveRadiance = litoTone * ( 0.3 + 0.78 * litoThin ) * emissiveIntensityLito;
        #else
          totalEmissiveRadiance = vec3( 1.0, 0.78, 0.5 ) * emissiveIntensityLito;
        #endif
        float litoFacing = clamp( abs( dot( normalize( normal ), normalize( vViewPosition ) ) ), 0.0, 1.0 );
        totalEmissiveRadiance *= mix( 1.5, 0.6, smoothstep( 0.0, 1.0, vLitoHeight ) ) * mix( 0.5, 1.0, pow( litoFacing, 0.7 ) );
        `,
      )
      .replace("uniform vec3 emissive;", "uniform vec3 emissive;\nuniform float emissiveIntensityLito;");
    shader.uniforms.emissiveIntensityLito = litUniform(mat);
  };
  return mat;
}

function litUniform(mat: THREE.Material): { value: number } {
  return (mat.userData.lit ??= { value: 0 }) as { value: number };
}

export function setBodyImage(mat: THREE.MeshPhysicalMaterial, tex: THREE.Texture | null): void {
  mat.bumpMap = tex;
  mat.emissiveMap = tex;
  mat.needsUpdate = true;
}

/** glow 0–1: luce interna. Con l'immagine, da accesa le zone scure (più spesse) sporgono. */
export function setBodyLit(mat: THREE.MeshPhysicalMaterial, glow: number): void {
  litUniform(mat).value = glow * 1.4;
  mat.color.copy(CREAM).lerp(SHADOW, glow * 0.9);
  mat.bumpScale = -1.8;
}
