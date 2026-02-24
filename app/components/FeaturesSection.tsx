"use client";

import { useEffect, useRef } from "react";

const features = [
  {
    icon: "▶",
    title: "MP4 Video Download",
    desc: "Download any public YouTube video in high quality — up to 720p with full audio.",
    color: "var(--cyan)",
    bg: "rgba(0,229,255,0.07)",
    border: "rgba(0,229,255,0.15)",
  },
  {
    icon: "♪",
    title: "MP3 Audio Extraction",
    desc: "Strip audio-only tracks with perfect fidelity. Great for podcasts, music, and lectures.",
    color: "var(--emerald)",
    bg: "rgba(0,255,157,0.07)",
    border: "rgba(0,255,157,0.15)",
  },
  {
    icon: "⚡",
    title: "Blazing Fast",
    desc: "Optimized download pipeline. Most videos processed in under 30 seconds.",
    color: "var(--amber)",
    bg: "rgba(251,191,36,0.07)",
    border: "rgba(251,191,36,0.15)",
  },
  {
    icon: "🛡",
    title: "Privacy First",
    desc: "No storage, no tracking. Your downloads stay yours. Sign in only to prevent abuse.",
    color: "var(--violet)",
    bg: "rgba(168,85,247,0.07)",
    border: "rgba(168,85,247,0.15)",
  },
];

export default function FeaturesSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let ctx: { revert: () => void };
    const init = async () => {
      const { gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      gsap.registerPlugin(ScrollTrigger);

      ctx = gsap.context(() => {
        gsap.from(headingRef.current, {
          y: 40, opacity: 0, duration: 0.8, ease: "power3.out",
          scrollTrigger: { trigger: headingRef.current, start: "top 85%", once: true }
        });

        const cards = gridRef.current ? Array.from(gridRef.current.children) : [];
        gsap.from(cards, {
          y: 50, opacity: 0, duration: 0.7, stagger: 0.1, ease: "power3.out",
          scrollTrigger: { trigger: gridRef.current, start: "top 80%", once: true }
        });
      }, sectionRef);
    };
    init();
    return () => ctx?.revert();
  }, []);

  return (
    <section ref={sectionRef} id="features" className="relative py-28 px-4">
      <div className="max-w-6xl mx-auto">
        <div ref={headingRef} className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full font-mono text-xs mb-4"
            style={{ background: "rgba(0,229,255,0.06)", border: "1px solid rgba(0,229,255,0.15)", color: "var(--cyan)" }}>
            ◆ Everything You Need
          </div>
          <h2 className="font-display font-black text-4xl md:text-5xl tracking-tight mb-4 text-gradient-main">
            One tool, every format.
          </h2>
          <p className="text-lg max-w-lg mx-auto" style={{ color: "var(--dim)" }}>
            Download video and audio from YouTube — without juggling five different websites.
          </p>
        </div>

        <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {features.map((f) => (
            <div
              key={f.title}
              className="feature-card rounded-2xl p-6"
              style={{ background: f.bg, border: `1px solid ${f.border}` }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg mb-4"
                style={{ background: "rgba(0,0,0,0.3)", color: f.color }}>
                {f.icon}
              </div>
              <h3 className="font-display font-bold text-lg mb-2" style={{ color: "var(--text-bright)" }}>
                {f.title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--dim)" }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
