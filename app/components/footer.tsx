"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import { BufferAttribute, Color } from "three";
import { ImprovedNoise } from "three/examples/jsm/math/ImprovedNoise.js";

const PRIMARY_ITEMS = [
  { label: "Solutions" },
  { label: "Documentation", href: "/" },
  { label: "Blog" },
  { label: "Book Meeting" },
  { label: "Open Source" },
  { label: "Careers" },
  { label: "About Us" },
  { label: "contact@dottxt.co" },
] as const;

const LEGAL_ITEMS = [
  { label: "Privacy Policy" },
  { label: "Cookie Policy" },
  { label: "Your Privacy Choices" },
  { label: "Notice at Collection" },
] as const;

const SOCIAL_ITEMS = [
  { label: "LinkedIn", kind: "linkedin" },
  { label: "X (Twitter)", kind: "x", href: "https://x.com/floatdesks" },
  { label: "Discord", kind: "discord" },
  { label: "GitHub", kind: "github" },
] as const;

export function Footer() {
  return (
    <footer className="float-footer">
      <div className="float-footer__container">
        {/* This link belongs to the iframe's document and is handled by its local router. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a className="float-footer__logo" href="/" aria-label="Float documentation home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/sailboat-white-300_1_1.png" width={300} height={300} alt="Float logo" />
        </a>

        <div className="float-footer__bottom">
          <FooterNavigation label="Site navigation" items={PRIMARY_ITEMS} />
          <FooterNavigation label="Legal links and policies" items={LEGAL_ITEMS} />

          <nav aria-label="Social media">
            <ul className="float-footer__social-list">
              {SOCIAL_ITEMS.map((item) => (
                <li key={item.label}>
                  {"href" in item ? (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Follow us on ${item.label}`}
                    >
                      <SocialIcon kind={item.kind} />
                    </a>
                  ) : (
                    <span aria-label={item.label}>
                      <SocialIcon kind={item.kind} />
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </nav>

          <div className="float-footer__copyright">
            © {new Date().getFullYear()} Float. All rights reserved
          </div>
        </div>
      </div>

      <FooterParticleField />
    </footer>
  );
}

function FooterNavigation({
  label,
  items,
}: {
  label: string;
  items: ReadonlyArray<{ label: string; href?: string }>;
}) {
  return (
    <nav className="float-footer__navigation" aria-label={label}>
      <ul>
        {items.map((item) => (
          <li key={item.label}>
            {item.href ? <a href={item.href}>{item.label}</a> : <span>{item.label}</span>}
          </li>
        ))}
      </ul>
    </nav>
  );
}

function SocialIcon({ kind }: { kind: (typeof SOCIAL_ITEMS)[number]["kind"] }) {
  const paths = {
    linkedin:
      "M216 24H40a16 16 0 0 0-16 16v176a16 16 0 0 0 16 16h176a16 16 0 0 0 16-16V40a16 16 0 0 0-16-16ZM96 176a8 8 0 0 1-16 0v-64a8 8 0 0 1 16 0Zm-8-80a12 12 0 1 1 12-12 12 12 0 0 1-12 12Zm96 80a8 8 0 0 1-16 0v-36a20 20 0 0 0-40 0v36a8 8 0 0 1-16 0v-64a8 8 0 0 1 15.79-1.78A36 36 0 0 1 184 140Z",
    x: "M215 219.85A8 8 0 0 1 208 224h-48a8 8 0 0 1-6.75-3.71l-40.49-63.63-58.84 64.72a8 8 0 0 1-11.84-10.76l61.77-68L41.25 44.3A8 8 0 0 1 48 32h48a8 8 0 0 1 6.75 3.71l40.49 63.63 58.84-64.72a8 8 0 0 1 11.84 10.76l-61.77 67.95 62.6 98.38a8 8 0 0 1 .25 8.14Z",
    discord:
      "M247.51 174.39 218 58a16.08 16.08 0 0 0-13-11.88l-36.06-5.92a16.22 16.22 0 0 0-18.26 11.88l-.21.85a4 4 0 0 0 3.27 4.93 155.62 155.62 0 0 1 24.41 5.62 8.2 8.2 0 0 1 5.62 9.7 8 8 0 0 1-10.19 5.64 155.4 155.4 0 0 0-90.8-.1 8.22 8.22 0 0 1-10.28-4.81 8 8 0 0 1 5.08-10.33 156.85 156.85 0 0 1 24.72-5.72 4 4 0 0 0 3.27-4.93l-.21-.85A16.21 16.21 0 0 0 87.08 40.21L51 46.13A16.08 16.08 0 0 0 38 58L8.49 174.39a15.94 15.94 0 0 0 9.06 18.51l67 29.71a16.17 16.17 0 0 0 21.71-9.1l3.49-9.45a4 4 0 0 0-3.27-5.35 158.13 158.13 0 0 1-28.63-6.2 8.2 8.2 0 0 1-5.61-9.67 8 8 0 0 1 10.2-5.66 155.59 155.59 0 0 0 91.12 0 8 8 0 0 1 10.19 5.65 8.19 8.19 0 0 1-5.61 9.68 157.84 157.84 0 0 1-28.62 6.2 4 4 0 0 0-3.27 5.35l3.49 9.45a16.18 16.18 0 0 0 21.71 9.1l67-29.71a15.94 15.94 0 0 0 9.06-18.51ZM92 152a12 12 0 1 1 12-12 12 12 0 0 1-12 12Zm72 0a12 12 0 1 1 12-12 12 12 0 0 1-12 12Z",
    github:
      "M216 104v8a56.06 56.06 0 0 1-48.44 55.47A39.8 39.8 0 0 1 176 192v40a8 8 0 0 1-8 8h-64a8 8 0 0 1-8-8v-16H72a40 40 0 0 1-40-40 24 24 0 0 0-24-24 8 8 0 0 1 0-16 40 40 0 0 1 40 40 24 24 0 0 0 24 24h24v-8a39.8 39.8 0 0 1 8.44-24.53A56.06 56.06 0 0 1 56 112v-8a58.14 58.14 0 0 1 7.69-28.32A59.78 59.78 0 0 1 69.07 28 8 8 0 0 1 76 24a59.75 59.75 0 0 1 48 24h24a59.75 59.75 0 0 1 48-24 8 8 0 0 1 6.93 4 59.74 59.74 0 0 1 5.37 47.68A58 58 0 0 1 216 104Z",
  } as const;

  return (
    <svg width="25" height="25" fill="currentColor" viewBox="0 0 256 256" aria-hidden="true">
      <path d={paths[kind]} />
    </svg>
  );
}

function FooterParticleField() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [isDocumentVisible, setIsDocumentVisible] = useState(true);

  useEffect(() => {
    const container = containerRef.current;
    const ownerDocument = container?.ownerDocument;
    const view = ownerDocument?.defaultView;
    if (!container || !ownerDocument || !view) return;

    const onVisibilityChange = () => setIsDocumentVisible(!ownerDocument.hidden);
    const observer = new view.IntersectionObserver(
      ([entry]) => setIsIntersecting(entry.isIntersecting),
      { threshold: 0.1 },
    );

    onVisibilityChange();
    ownerDocument.addEventListener("visibilitychange", onVisibilityChange);
    observer.observe(container);
    return () => {
      ownerDocument.removeEventListener("visibilitychange", onVisibilityChange);
      observer.disconnect();
    };
  }, []);

  return (
    <div ref={containerRef} className="float-footer__animation" aria-hidden="true">
      <FooterParticles isActive={isIntersecting && isDocumentVisible} />
    </div>
  );
}

function FooterParticles({ isActive }: { isActive: boolean }) {
  return (
    <Canvas
      camera={{ fov: 75, near: 0.1, far: 1000, position: [0, 0, 6.45] }}
      dpr={isActive ? [1, 2] : 1}
      frameloop={isActive ? "demand" : "never"}
      gl={{ antialias: false, powerPreference: "high-performance" }}
      linear
      flat
    >
      <ParticleGrid isActive={isActive} />
    </Canvas>
  );
}

function ParticleGrid({ isActive }: { isActive: boolean }) {
  const { size, invalidate } = useThree();
  const noiseGenerator = useRef(new ImprovedNoise());
  const colorOffset = useRef(0);
  const updateStride = useMemo(() => {
    if (typeof navigator === "undefined") return 1;
    return /Safari/i.test(navigator.userAgent) &&
      !/Chrome|Chromium|CriOS|Edg\//i.test(navigator.userAgent)
      ? 3
      : 1;
  }, []);
  const black = useMemo(() => new Color(0, 0, 0).convertLinearToSRGB(), []);
  const cream = useMemo(() => new Color("#f1eedb").convertLinearToSRGB(), []);
  const blue = useMemo(() => new Color("#2563eb").convertLinearToSRGB(), []);
  const sage = useMemo(() => new Color("#a6b4a3").convertLinearToSRGB(), []);

  const [positions, colors, xPositions, yPositions, pointCount] = useMemo(() => {
    const positions = new Float32Array(300_000);
    const colors = new Float32Array(300_000);
    const xPositions = new Float32Array(100_000);
    const yPositions = new Float32Array(100_000);
    let pointCount = 0;

    for (
      let x = (-32 * size.width) / size.height;
      x < (32 * size.width) / size.height && pointCount < 100_000;
      x += 1
    ) {
      for (let y = -32; y < 32 && pointCount < 100_000; y += 1) {
        const pointX = 0.16 * x;
        const pointY = 0.16 * y;
        positions[3 * pointCount] = pointX;
        positions[3 * pointCount + 1] = pointY;
        positions[3 * pointCount + 2] = 0;
        xPositions[pointCount] = pointX;
        yPositions[pointCount] = pointY;
        // eslint-disable-next-line react-hooks/purity
        colors[3 * pointCount] = Math.random();
        // eslint-disable-next-line react-hooks/purity
        colors[3 * pointCount + 1] = Math.random();
        // eslint-disable-next-line react-hooks/purity
        colors[3 * pointCount + 2] = Math.random();
        pointCount += 1;
      }
    }

    return [positions, colors, xPositions, yPositions, pointCount] as const;
  }, [size.width, size.height]);

  const positionAttribute = useRef<BufferAttribute>(null);
  const colorAttribute = useRef<BufferAttribute>(null);

  useEffect(() => {
    if (positionAttribute.current && colorAttribute.current) {
      positionAttribute.current.needsUpdate = true;
      colorAttribute.current.needsUpdate = true;
    }
  }, [size.width, size.height]);

  useEffect(() => {
    if (!isActive) return;
    const interval = window.setInterval(() => invalidate(), 50);
    return () => window.clearInterval(interval);
  }, [invalidate, isActive]);

  useFrame((state) => {
    if (!isActive || !positionAttribute.current || !colorAttribute.current) return;

    const elapsedTime = state.clock.elapsedTime;
    const noiseTime = 0.1 * elapsedTime;
    const colorArray = colorAttribute.current.array;
    const start = colorOffset.current;

    for (let index = start; index < pointCount; index += updateStride) {
      const x = xPositions[index];
      const y = yPositions[index];
      const firstNoise = noiseGenerator.current.noise(x, y, noiseTime);
      const secondNoise = noiseGenerator.current.noise(y, x, noiseTime);
      const noise = noiseGenerator.current.noise(
        x * firstNoise * secondNoise * 0.1,
        y * firstNoise * secondNoise * 0.1,
        firstNoise,
      );
      const color =
        noise > 0
          ? noise > 0.15 && noise < 0.2
            ? cream
            : noise > 0.25 && noise < 0.3
              ? sage
              : black
          : noise > -0.2 && noise < -0.15
            ? blue
            : noise > -0.3 && noise < -0.25
              ? cream
              : black;
      const colorIndex = 3 * index;
      colorArray[colorIndex] = color.r;
      colorArray[colorIndex + 1] = color.g;
      colorArray[colorIndex + 2] = color.b;
    }

    colorOffset.current = (colorOffset.current + 1) % updateStride;
    colorAttribute.current.needsUpdate = true;
  });

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          ref={positionAttribute}
          attach="attributes-position"
          args={[positions, 3]}
          count={pointCount}
        />
        <bufferAttribute
          ref={colorAttribute}
          attach="attributes-color"
          args={[colors, 3]}
          count={pointCount}
        />
      </bufferGeometry>
      <pointsMaterial size={0.32} vertexColors />
    </points>
  );
}
