"use client";

const items = [
  "⚡ Instant Download",
  "▶ MP4 Video",
  "♪ MP3 Audio",
  "🛡 Privacy First",
  "🔥 No Ads",
  "✓ Free to Use",
];

export default function FeatureTicker() {
  const doubled = [...items, ...items];
  return (
    <div className="relative overflow-hidden py-4 border-y"
      style={{ borderColor: "var(--border)", background: "rgba(0,0,0,0.3)" }}>
      <div className="ticker-track flex gap-8 whitespace-nowrap">
        {doubled.map((item, i) => (
          <span key={i} className="font-mono text-xs tracking-wide" style={{ color: "var(--muted)" }}>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
