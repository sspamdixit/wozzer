interface RoleBadgeProps {
  role: string | null | undefined;
  level?: string | null;
}

export function RoleBadge({ role, level }: RoleBadgeProps) {
  if (!role) return null;

  const isVisionary = role === "visionary";

  return (
    <span className="sticker" style={{
      color: isVisionary ? "#7B4F2E" : "#1A6B3A",
      borderColor: isVisionary ? "#C4845A" : "#5A9A70",
      background: isVisionary ? "#F5E6D0" : "#D8F0E0",
    }}>
      {isVisionary ? "Visionary" : "Wozniak"}
      {level && <span style={{ opacity: 0.7, fontSize: "0.75rem", marginLeft: 2 }}>· {level}</span>}
    </span>
  );
}
