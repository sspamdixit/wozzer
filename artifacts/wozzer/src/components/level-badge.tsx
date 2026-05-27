interface LevelBadgeProps {
  xpLevel: number;
  role?: string | null;
  size?: "sm" | "md" | "lg";
  faded?: boolean;
}

export function LevelBadge({ xpLevel, role, size = "md", faded = false }: LevelBadgeProps) {
  const isVisionary = role === "visionary";
  const bg = faded ? "#E8E4DC" : isVisionary ? "#1A3A6B" : "#B83000";
  const color = faded ? "#A09890" : "#FDFAF4";
  const border = faded ? "#C8BFA8" : isVisionary ? "#0F2449" : "#8A2200";

  const sizes = {
    sm: { fontSize: "0.7rem", padding: "2px 7px", borderRadius: "4px" },
    md: { fontSize: "0.82rem", padding: "3px 10px", borderRadius: "5px" },
    lg: { fontSize: "1rem", padding: "5px 14px", borderRadius: "6px" },
  };

  return (
    <span
      className="font-accent"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        background: bg,
        color,
        border: `2px solid ${border}`,
        fontWeight: 700,
        letterSpacing: "0.02em",
        boxShadow: faded ? "none" : `2px 2px 0 ${border}`,
        opacity: faded ? 0.7 : 1,
        flexShrink: 0,
        ...sizes[size],
      }}
    >
      LVL {xpLevel}
    </span>
  );
}
