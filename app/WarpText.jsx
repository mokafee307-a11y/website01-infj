'use client';

// Adapted from the supplied React Bits WarpText (JavaScript + CSS).
import { useEffect, useRef } from 'react';
import { Renderer, Program, Mesh, Triangle, Texture } from 'ogl';
import './WarpText.css';

const vertex = `#version 300 es
in vec2 position;
in vec2 uv;
out vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fragment = `#version 300 es
precision highp float;
uniform sampler2D uTextTexture;
uniform vec2 uResolution;
uniform vec2 uPointer;
uniform float uPointerActive;
uniform float uTime;
uniform float uWarpStrength;
uniform float uWarpScale;
uniform float uSpeed;
uniform float uPointerInfluence;
uniform float uPointerStrength;
uniform float uRefraction;
uniform float uRipple;
uniform float uMotion;
in vec2 vUv;
out vec4 fragColor;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 4; i++) {
    value += amplitude * noise(p);
    p *= 2.02;
    amplitude *= 0.5;
  }
  return value;
}
vec4 sampleText(vec2 uv) {
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) return vec4(0.0);
  return texture(uTextTexture, uv);
}
void main() {
  vec2 uv = vUv;
  float aspect = uResolution.x / max(uResolution.y, 1.0);
  float time = uTime * uSpeed;
  float scale = max(uWarpScale, 0.001);
  vec2 drift = vec2(time * 0.055, -time * 0.045);
  float n1 = fbm(uv * scale * 3.1 + drift);
  float n2 = fbm((uv + 19.17) * scale * 3.4 - drift.yx);
  vec2 ambient = (vec2(n1, n2) - 0.5) * uWarpStrength * 0.045 * uMotion;
  vec2 pointerDelta = uv - uPointer;
  vec2 aspectDelta = vec2(pointerDelta.x * aspect, pointerDelta.y);
  float dist = length(aspectDelta);
  float radius = max(uPointerInfluence, 0.001);
  float t = clamp(dist / radius, 0.0, 1.0);
  float lens = (1.0 - smoothstep(0.0, radius, dist)) * uPointerActive;
  float bulge = t * (1.0 - t) * (1.0 - t) * 6.75 * uPointerActive;
  vec2 dir = dist > 0.0001 ? vec2(aspectDelta.x / aspect, aspectDelta.y) / dist : vec2(0.0);
  float rippleWave = sin(dist * 28.0 - time * 4.2) * 0.5 + 0.5;
  float rippleRing = (rippleWave - 0.5) * uRipple;
  vec2 pointerWarp = -dir * bulge * uPointerStrength * 0.045;
  pointerWarp += dir * rippleRing * bulge * uPointerStrength * 0.016;
  vec2 displaced = uv + ambient + pointerWarp;
  vec2 splitDir = ambient + pointerWarp;
  float splitLen = length(splitDir);
  splitDir = splitLen > 0.00001 ? splitDir / splitLen : vec2(0.7071, 0.7071);
  vec2 split = splitDir * uRefraction * 0.16 * (0.35 + lens * 1.65);
  vec4 base = sampleText(displaced);
  float r = sampleText(displaced + split).r;
  float g = base.g;
  float b = sampleText(displaced - split).b;
  float a = max(max(sampleText(displaced + split).a, base.a), sampleText(displaced - split).a);
  vec3 color = vec3(r, g, b) + lens * base.a * 0.055;
  fragColor = vec4(color, a);
}
`;

const fontValue = value => typeof value === 'number' ? `${value}px` : value;

/**
 * @param {{
 * text?: string, color?: string, warpStrength?: number, warpScale?: number,
 * speed?: number, pointerInfluence?: number, pointerStrength?: number,
 * refraction?: number, ripple?: boolean, fontSize?: string | number,
 * fontWeight?: string | number, fontFamily?: string, letterSpacing?: string | number,
 * lineHeight?: string | number, className?: string,
 * style?: import('react').CSSProperties, hoverOnly?: boolean
 * }} props
 */
export default function WarpText({
  text = 'Bend the moment', color = '#f8f5ff',
  warpStrength = 0.08, warpScale = 1.7, speed = 0.55,
  pointerInfluence = 0.42, pointerStrength = 0.38, refraction = 0.018,
  ripple = true, fontSize = 'clamp(3rem, 10vw, 9rem)', fontWeight = 800,
  fontFamily = 'inherit', letterSpacing = '-0.06em', lineHeight = 0.9,
  className = '', style = {}, hoverOnly = false,
}) {
  const containerRef = useRef(null);
  const fallbackRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    const fallback = fallbackRef.current;
    if (!container || !fallback) return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let reduceMotion = mediaQuery.matches;
    let disposed = false;
    let contextLost = false;
    let visible = true;
    let ready = false;
    let raf = 0;
    let rasterVersion = 0;
    let renderer;
    try {
      renderer = new Renderer({ webgl: 2, alpha: true, premultipliedAlpha: false,
        antialias: true, dpr: Math.min(window.devicePixelRatio || 1, 2) });
    } catch {
      // Keep real, accessible HTML text when WebGL is unavailable.
      return;
    }
    const gl = renderer.gl;
    const canvas = gl.canvas;
    canvas.setAttribute('aria-hidden', 'true');
    container.appendChild(canvas);
    gl.clearColor(0, 0, 0, 0);
    const texture = new Texture(gl, { generateMipmaps: false, minFilter: gl.LINEAR,
      magFilter: gl.LINEAR, wrapS: gl.CLAMP_TO_EDGE, wrapT: gl.CLAMP_TO_EDGE });
    const geometry = new Triangle(gl);
    const program = new Program(gl, { vertex, fragment, transparent: true,
      depthTest: false, depthWrite: false, uniforms: {
        uTextTexture: { value: texture }, uResolution: { value: new Float32Array([1, 1]) },
        uPointer: { value: new Float32Array([0.5, 0.5]) }, uPointerActive: { value: 0 },
        uTime: { value: 0 }, uWarpStrength: { value: warpStrength },
        uWarpScale: { value: warpScale }, uSpeed: { value: speed },
        uPointerInfluence: { value: pointerInfluence }, uPointerStrength: { value: pointerStrength },
        uRefraction: { value: hoverOnly ? 0 : refraction }, uRipple: { value: ripple ? 1 : 0 },
        uMotion: { value: hoverOnly ? 0 : 1 },
      } });
    const mesh = new Mesh(gl, { geometry, program });
    const pointer = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5, active: 0, target: 0 };
    const startTime = performance.now();

    const render = () => {
      if (!disposed && !contextLost && ready) renderer.render({ scene: mesh });
    };
    const loop = now => {
      raf = 0;
      if (disposed || contextLost || reduceMotion || !visible || document.hidden || !ready) return;
      const elapsed = (now - startTime) * 0.001;
      const idleX = hoverOnly ? pointer.tx : 0.5 + Math.sin(elapsed * 0.33) * 0.12;
      const idleY = hoverOnly ? pointer.ty : 0.5 + Math.cos(elapsed * 0.27) * 0.1;
      pointer.x += ((pointer.target ? pointer.tx : idleX) - pointer.x) * 0.12;
      pointer.y += ((pointer.target ? pointer.ty : idleY) - pointer.y) * 0.12;
      pointer.active += ((pointer.target || (hoverOnly ? 0 : 0.18)) - pointer.active) * 0.09;
      if (hoverOnly && !pointer.target && pointer.active < 0.001) pointer.active = 0;
      program.uniforms.uPointer.value.set([pointer.x, pointer.y]);
      program.uniforms.uPointerActive.value = pointer.active;
      program.uniforms.uMotion.value = hoverOnly ? pointer.active : 1;
      program.uniforms.uRefraction.value = refraction * (hoverOnly ? pointer.active : 1);
      program.uniforms.uTime.value = elapsed;
      render();
      if (!hoverOnly || pointer.target || pointer.active) raf = requestAnimationFrame(loop);
    };
    const resume = () => {
      if (!raf && ready && !disposed && !contextLost && !reduceMotion && visible && !document.hidden)
        raf = requestAnimationFrame(loop);
    };
    const rasterize = async () => {
      const version = ++rasterVersion;
      await document.fonts.ready;
      if (disposed || contextLost || version !== rasterVersion) return;
      const rect = container.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      renderer.dpr = dpr;
      renderer.setSize(rect.width, rect.height);
      program.uniforms.uResolution.value.set([gl.drawingBufferWidth, gl.drawingBufferHeight]);
      const raster = document.createElement('canvas');
      raster.width = Math.max(1, Math.round(rect.width * dpr));
      raster.height = Math.max(1, Math.round(rect.height * dpr));
      const ctx = raster.getContext('2d');
      if (!ctx) return;
      // Measure the real title, so replacing HTML never shrinks or shifts the layout.
      const computed = getComputedStyle(fallback);
      const size = parseFloat(computed.fontSize);
      const tracking = parseFloat(computed.letterSpacing) || 0;
      const leading = parseFloat(computed.lineHeight) || size * 1.2;
      ctx.scale(dpr, dpr);
      ctx.font = `${computed.fontWeight} ${computed.fontSize} ${computed.fontFamily}`;
      ctx.fillStyle = computed.color;
      ctx.textBaseline = 'alphabetic';
      const lines = text.split('\n');
      const metrics = ctx.measureText(text);
      const ascent = metrics.fontBoundingBoxAscent ?? size * 0.8;
      const descent = metrics.fontBoundingBoxDescent ?? size * 0.2;
      const baseline = (rect.height - leading * lines.length) / 2 + (leading - ascent - descent) / 2 + ascent;
      lines.forEach((line, index) => {
        const chars = Array.from(line);
        const widths = chars.map(char => ctx.measureText(char).width);
        // CSS includes tracking after the last glyph as well.
        const width = widths.reduce((sum, width) => sum + width, 0) + chars.length * tracking;
        let x = (rect.width - width) / 2;
        chars.forEach((char, i) => {
          ctx.fillText(char, x, baseline + index * leading);
          x += widths[i] + tracking;
        });
      });
      texture.image = raster;
      texture.needsUpdate = true;
      ready = true;
      render();
      container.classList.toggle('warp-text-ready', !reduceMotion);
      resume();
    };
    const onPointerMove = event => {
      if (event.pointerType === 'touch' || reduceMotion) return;
      const rect = container.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      pointer.tx = (event.clientX - rect.left) / rect.width;
      pointer.ty = 1 - (event.clientY - rect.top) / rect.height;
      pointer.target = 1;
      resume();
    };
    const onPointerLeave = () => { pointer.target = 0; resume(); };
    const onContextLost = event => {
      event.preventDefault();
      contextLost = true;
      cancelAnimationFrame(raf);
      raf = 0;
      container.classList.remove('warp-text-ready');
    };
    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(raf); raf = 0; pointer.target = 0;
      } else resume();
    };
    const onReducedMotion = event => {
      reduceMotion = event.matches;
      container.classList.toggle('warp-text-ready', ready && !reduceMotion && !contextLost);
      if (reduceMotion) { cancelAnimationFrame(raf); raf = 0; pointer.target = 0; }
      else resume();
    };
    const resizeObserver = new ResizeObserver(rasterize);
    resizeObserver.observe(container);
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) resume();
      else { cancelAnimationFrame(raf); raf = 0; }
    });
    intersectionObserver.observe(container);
    container.addEventListener('pointermove', onPointerMove);
    container.addEventListener('pointerleave', onPointerLeave);
    canvas.addEventListener('webglcontextlost', onContextLost);
    document.addEventListener('visibilitychange', onVisibility);
    document.fonts.addEventListener('loadingdone', rasterize);
    mediaQuery.addEventListener('change', onReducedMotion);
    void rasterize();
    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      container.removeEventListener('pointermove', onPointerMove);
      container.removeEventListener('pointerleave', onPointerLeave);
      canvas.removeEventListener('webglcontextlost', onContextLost);
      document.removeEventListener('visibilitychange', onVisibility);
      document.fonts.removeEventListener('loadingdone', rasterize);
      mediaQuery.removeEventListener('change', onReducedMotion);
      container.classList.remove('warp-text-ready');
      if (!contextLost) {
        gl.deleteTexture(texture.texture);
        geometry.remove();
        program.remove();
        gl.getExtension('WEBGL_lose_context')?.loseContext();
      }
      canvas.remove();
    };
  }, [text, color, fontSize, fontWeight, fontFamily, letterSpacing, lineHeight,
    warpStrength, warpScale, speed, pointerInfluence, pointerStrength, refraction, ripple, hoverOnly]);

  return (
    <span ref={containerRef} className={`warp-text ${className}`.trim()}
      style={{ color, fontSize: fontValue(fontSize), fontWeight, fontFamily,
        letterSpacing: fontValue(letterSpacing), lineHeight, ...style }}>
      <span ref={fallbackRef} className="warp-text-fallback">{text}</span>
    </span>
  );
}
