const ACHIEVEMENT_META: Record<string, { label: string; icon: string; color: string }> = {
  first_post: { label: "First Post", icon: "✏️", color: "#D8F0E0" },
  first_match: { label: "First Match", icon: "🤝", color: "#F5E6D0" },
  first_project: { label: "First Project", icon: "🚀", color: "#D8E8F0" },
  streak_7: { label: "On a Roll", icon: "🔥", color: "#FFF3D8" },
  streak_30: { label: "Consistent", icon: "🔥", color: "#FFE5B4" },
  streak_100: { label: "Legend", icon: "⚡", color: "#FFD700" },
  level_up: { label: "Level Up", icon: "⬆️", color: "#E8D8F0" },
  challenge_complete: { label: "Builder", icon: "⚙️", color: "#D8F0E8" },
  interview_complete: { label: "Thinker", icon: "💡", color: "#F0E8D8" },
  collaboration_complete: { label: "Collaborator", icon: "🤜", color: "#D8E0F0" },
};

interface AchievementBadgesProps {
  achievements: string[];
}

export function AchievementBadges({ achievements }: AchievementBadgesProps) {
  if (!achievements || achievements.length === 0) return null;

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {achievements.map(type => {
        const meta = ACHIEVEMENT_META[type] ?? { label: type, icon: "🏅", color: "#EDE8DE" };
        return (
          <div
            key={type}
            title={meta.label}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
              background: meta.color,
              border: "1.5px solid #1A1A1A",
              borderRadius: "6px",
              padding: "6px 10px",
              boxShadow: "2px 2px 0 #1A1A1A",
              minWidth: 56,
            }}
          >
            <span style={{ fontSize: "1.2rem", lineHeight: 1 }}>{meta.icon}</span>
            <span
              className="font-accent"
              style={{ fontSize: "0.65rem", color: "#1A1A1A", fontWeight: 700, textAlign: "center", lineHeight: 1.2 }}
            >
              {meta.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
