interface StreakIndicatorProps {
  streak: number;
  size?: "sm" | "md" | "lg";
}

export function StreakIndicator({ streak, size = "md" }: StreakIndicatorProps) {
  if (streak < 3) return null;

  const isLegend = streak >= 100;
  const isConsistent = streak >= 30;

  const sizes = {
    sm: { fontSize: "0.75rem", gap: 3 },
    md: { fontSize: "0.85rem", gap: 4 },
    lg: { fontSize: "1rem", gap: 5 },
  };

  const flameColor = isLegend ? "#FF6B00" : isConsistent ? "#E8450A" : "#E8450A";
  const labelColor = isLegend ? "#FF6B00" : "#E8450A";

  return (
    <span
      className="font-accent"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: sizes[size].gap,
        fontSize: sizes[size].fontSize,
        color: labelColor,
        fontWeight: 700,
      }}
    >
      <span
        style={{
          display: "inline-block",
          animation: "flamePulse 2s ease-in-out infinite",
          fontSize: size === "lg" ? "1.1em" : "1em",
        }}
      >
        🔥
      </span>
      {streak}
      {isLegend && <span style={{ fontSize: "0.7em", opacity: 0.8 }}>LEGEND</span>}
    </span>
  );
}
