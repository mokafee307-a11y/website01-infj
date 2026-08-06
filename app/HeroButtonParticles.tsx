"use client";

import { useEffect, useRef } from "react";

export default function HeroButtonParticles() {
  const mountRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    let cancelled = false;
    let frame = 0;
    let cleanup = () => {};

    const setup = async () => {
      const THREE = await import("three");
      if (cancelled || !mountRef.current) return;

      const rect = mount.getBoundingClientRect();
      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(rect.width, rect.height);
      renderer.domElement.setAttribute("aria-hidden", "true");
      mount.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
      camera.position.z = 2;

      const count = 160;
      const positions = new Float32Array(count * 3);
      const seeds = new Float32Array(count * 4);

      for (let i = 0; i < count; i += 1) {
        const lane = i % 5;
        const radiusX = 1.08 + lane * 0.08 + Math.random() * 0.14;
        const radiusY = 0.42 + (lane % 3) * 0.045 + Math.random() * 0.08;
        const phase = Math.random() * Math.PI * 2;
        const speed = (Math.random() > 0.45 ? 1 : -1) * (0.32 + Math.random() * 0.22);
        positions[i * 3] = 0;
        positions[i * 3 + 1] = 0;
        positions[i * 3 + 2] = THREE.MathUtils.randFloat(-0.25, 0.25);
        seeds[i * 4] = phase;
        seeds[i * 4 + 1] = radiusX;
        seeds[i * 4 + 2] = radiusY;
        seeds[i * 4 + 3] = speed;
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute("aOrbit", new THREE.BufferAttribute(seeds, 4));

      const material = new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uTime: { value: 0 }, uHover: { value: 0 } },
        vertexShader: `
          attribute vec4 aOrbit;
          uniform float uTime;
          uniform float uHover;
          varying float vAlpha;
          void main() {
            vec3 p = position;
            float phase = aOrbit.x;
            float rx = aOrbit.y + uHover * 0.08;
            float ry = aOrbit.z + uHover * 0.035;
            float speed = aOrbit.w;
            float t = phase + uTime * speed;
            float wobble = sin(uTime * 0.45 + phase * 2.7) * 0.035;
            p.x = cos(t) * rx + sin(t * 1.7 + phase) * wobble;
            p.y = sin(t) * ry + cos(t * 1.35 + phase) * wobble;
            float edgeFade = smoothstep(1.16, 0.72, abs(p.x));
            float crossGlow = 0.5 + 0.5 * sin(t * 2.0 + phase);
            vAlpha = (0.36 + 0.5 * crossGlow) * edgeFade + uHover * 0.22;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
            gl_PointSize = 3.4 + 4.2 * crossGlow + uHover * 2.2;
          }
        `,
        fragmentShader: `
          varying float vAlpha;
          void main() {
            vec2 uv = gl_PointCoord - vec2(0.5);
            float d = length(uv);
            float core = smoothstep(0.5, 0.0, d);
            float glow = smoothstep(0.5, 0.12, d) * 0.45;
            vec3 mint = vec3(0.62, 1.0, 0.72);
            vec3 warm = vec3(1.0, 0.98, 0.72);
            vec3 color = mix(mint, warm, smoothstep(0.0, 0.5, uv.y + 0.25));
            gl_FragColor = vec4(color, (core + glow) * vAlpha);
          }
        `,
      });

      const points = new THREE.Points(geometry, material);
      scene.add(points);

      let hoverTarget = 0;
      let hover = 0;
      const clock = new THREE.Clock();
      const onPointerEnter = () => { hoverTarget = 1; };
      const onPointerLeave = () => { hoverTarget = 0; };
      mount.parentElement?.addEventListener("pointerenter", onPointerEnter);
      mount.parentElement?.addEventListener("pointerleave", onPointerLeave);

      const resizeObserver = new ResizeObserver(([entry]) => {
        const { width, height } = entry.contentRect;
        renderer.setSize(width, height);
      });
      resizeObserver.observe(mount);

      const animate = () => {
        hover += (hoverTarget - hover) * 0.06;
        material.uniforms.uTime.value = clock.getElapsedTime();
        material.uniforms.uHover.value = hover;
        renderer.render(scene, camera);
        frame = requestAnimationFrame(animate);
      };
      animate();

      cleanup = () => {
        resizeObserver.disconnect();
        mount.parentElement?.removeEventListener("pointerenter", onPointerEnter);
        mount.parentElement?.removeEventListener("pointerleave", onPointerLeave);
        geometry.dispose();
        material.dispose();
        renderer.dispose();
        renderer.domElement.remove();
      };
    };
    setup();

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      cleanup();
    };
  }, []);

  return <span ref={mountRef} className="three-button-particles" aria-hidden="true" />;
}
