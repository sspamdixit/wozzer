const LEVEL_THRESHOLDS = [0, 75, 200, 400, 700, 1200];

function xpToLevel(xp: number): number {
  let level = 0;
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) {
      level = i;
      break;
    }
  }
  if (xp >= 1200) {
    level = 5 + Math.floor((xp - 1200) / 1000);
  }
  return level;
}

function xpProgressInLevel(xp: number): { current: number; total: number; pct: number } {
  const level = xpToLevel(xp);
  const currentThreshold = level < LEVEL_THRESHOLDS.length ? LEVEL_THRESHOLDS[level] : 1200 + (level - 5) * 1000;
  const nextThreshold = level + 1 < LEVEL_THRESHOLDS.length
    ? LEVEL_THRESHOLDS[level + 1]
    : 1200 + (level - 4) * 1000;
  const current = xp - currentThreshold;
  const total = nextThreshold - currentThreshold;
  const pct = Math.min(current / total, 1);
  return { current, total, pct };
}

interface XpBarProps {
  xp: number;
  xpLevel: number;
}

export function XpBar({ xp, xpLevel }: XpBarProps) {
  const { current, total, pct } = xpProgressInLevel(xp);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span className="font-accent" style={{ fontSize: "0.8rem", color: "#6B6355", fontWeight: 600 }}>
          Level {xpLevel} → Level {xpLevel + 1}
        </span>
        <span className="font-accent" style={{ fontSize: "0.8rem", color: "#6B6355" }}>
          {current} / {total} XP
        </span>
      </div>
      <div
        style={{
          width: "100%",
          height: 14,
          background: "#EDE8DE",
          border: "1.5px solid #1A1A1A",
          borderRadius: "2px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            width: `${pct * 100}%`,
            background: "#E8450A",
            borderRight: pct < 1 ? "1.5px solid #1A1A1A" : "none",
            transition: "width 0.6s ease-out",
            backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(255,255,255,0.15) 4px, rgba(255,255,255,0.15) 8px)",
          }}
        />
      </div>
    </div>
  );
}
