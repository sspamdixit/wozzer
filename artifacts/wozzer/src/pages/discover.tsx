import { useRef, useState, useCallback } from "react";
import { Layout } from "@/components/layout";
import { useGetDiscoverDeck, useRecordSwipe, getGetDiscoverDeckQueryKey } from "@workspace/api-client-react";
import type { DiscoverCard } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { RoleBadge } from "@/components/role-badge";
import { LevelBadge } from "@/components/level-badge";
import { StreakIndicator } from "@/components/streak-indicator";

function PersonCard({ card }: { card: NonNullable<DiscoverCard["person"]> }) {
  const isLevel0 = (card.xpLevel ?? 0) === 0;
  const borderStyle = isLevel0 ? "2px dashed #C8BFA8" : "2px solid #1A1A1A";
  const bgStyle = isLevel0 ? "#F9F6EE" : "#FDFAF4";

  return (
    <div
      style={{
        padding: "1.5rem",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
        background: bgStyle,
        opacity: isLevel0 ? 0.88 : 1,
      }}
    >
      <div className="washi washi-top washi-blue" style={{ width: 70, transform: "translateX(-50%) rotate(-2deg)" }} />
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "0.5rem" }}>
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: "50%",
            border: isLevel0 ? "2px dashed #C8BFA8" : "2px solid #1A1A1A",
            background: card.avatarUrl ? undefined : "#C8BFA8",
            backgroundImage: card.avatarUrl ? `url(${card.avatarUrl})` : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.2rem",
            fontFamily: "'Fraunces', serif",
            fontWeight: 700,
            color: "#6B6355",
          }}
        >
          {!card.avatarUrl && card.displayName.charAt(0).toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="font-serif" style={{ fontWeight: 700, fontSize: "1.1rem", color: "#1A1A1A" }}>{card.displayName}</div>
          <div className="font-accent" style={{ color: "#6B6355", fontSize: "0.85rem" }}>@{card.username}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
          <RoleBadge role={card.role} />
          <LevelBadge xpLevel={card.xpLevel ?? 0} role={card.role} size="sm" faded={isLevel0} />
        </div>
      </div>

      {(card.streakCurrent ?? 0) > 2 && (
        <div>
          <StreakIndicator streak={card.streakCurrent ?? 0} size="sm" />
        </div>
      )}

      {card.bio && (
        <p style={{ color: "#6B6355", fontSize: "0.85rem", fontFamily: "'Inter', sans-serif", lineHeight: 1.6 }}>
          {card.bio.slice(0, 100)}{card.bio.length > 100 ? "…" : ""}
        </p>
      )}

      {!card.bio && isLevel0 && (
        <p style={{ color: "#C8BFA8", fontSize: "0.8rem", fontFamily: "'Caveat', cursive", fontStyle: "italic" }}>
          No bio yet — just getting started
        </p>
      )}

      {card.skills && card.skills.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
          {card.skills.slice(0, 3).map(s => (
            <span
              key={s}
              className="font-accent"
              style={{
                fontSize: "0.8rem",
                padding: "1px 8px",
                background: isLevel0 ? "#F0EDE6" : "#EDE8DE",
                border: isLevel0 ? "1px dashed #C8BFA8" : "1px solid #C8BFA8",
                borderRadius: "2px",
                color: isLevel0 ? "#A09890" : "#6B6355",
              }}
            >
              {s}
            </span>
          ))}
        </div>
      )}

      <div style={{ marginTop: "auto" }}>
        <div className="font-accent" style={{ color: "#C8BFA8", fontSize: "0.8rem" }}>
          {card.followersCount} followers
        </div>
      </div>
    </div>
  );
}

function ProjectCard({ card }: { card: NonNullable<DiscoverCard["project"]> }) {
  const authorXpLevel = card.authorXpLevel ?? 0;

  return (
    <div style={{ padding: "1.5rem", height: "100%", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <div className="washi washi-top washi-orange" style={{ width: 70, transform: "translateX(-50%) rotate(2deg)" }} />
      <div style={{ marginTop: "0.5rem" }}>
        <span
          className="font-accent"
          style={{
            fontSize: "0.75rem",
            padding: "2px 8px",
            background: "#F5E6D0",
            border: "1px solid #C4845A",
            borderRadius: "2px",
            color: "#7B4F2E",
            marginBottom: "6px",
            display: "inline-block",
          }}
        >
          Project
        </span>
        <h3 className="font-serif" style={{ fontSize: "1.3rem", fontWeight: 700, color: "#1A1A1A", marginTop: 4 }}>
          {card.name}
        </h3>
      </div>

      <p style={{ color: "#6B6355", fontSize: "0.85rem", fontFamily: "'Inter', sans-serif", lineHeight: 1.6 }}>
        {card.description.slice(0, 120)}{card.description.length > 120 ? "…" : ""}
      </p>

      {card.tags && card.tags.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
          {card.tags.slice(0, 3).map(t => (
            <span
              key={t}
              className="font-accent"
              style={{
                fontSize: "0.8rem",
                padding: "1px 8px",
                background: "#EDE8DE",
                border: "1px solid #C8BFA8",
                borderRadius: "2px",
                color: "#6B6355",
              }}
            >
              {t}
            </span>
          ))}
        </div>
      )}

      <div style={{ marginTop: "auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div className="font-accent" style={{ color: "#6B6355", fontSize: "0.85rem" }}>
          by @{card.authorUsername}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <LevelBadge xpLevel={authorXpLevel} size="sm" />
          {(card.authorStreakCurrent ?? 0) > 2 && (
            <StreakIndicator streak={card.authorStreakCurrent ?? 0} size="sm" />
          )}
        </div>
      </div>
    </div>
  );
}

const ROTATIONS = [-2, 1.5, -1, 2, -0.5, 1, -1.5, 2.5];

export default function Discover() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useGetDiscoverDeck();
  const recordSwipe = useRecordSwipe();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeDir, setSwipeDir] = useState<"left" | "right" | null>(null);
  const [dragState, setDragState] = useState({ active: false, startX: 0, x: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  const cards = data?.cards ?? [];
  const hasMore = currentIndex < cards.length;
  const current = hasMore ? cards[currentIndex] : null;

  const doSwipe = useCallback(async (dir: "left" | "right") => {
    if (!current) return;
    setSwipeDir(dir);
    await recordSwipe.mutateAsync({
      data: {
        targetId: current.id,
        targetType: current.type,
        direction: dir,
      }
    });
    setTimeout(() => {
      setSwipeDir(null);
      setCurrentIndex(i => i + 1);
    }, 300);
  }, [current, recordSwipe]);

  const onPointerDown = (e: React.PointerEvent) => {
    setDragState({ active: true, startX: e.clientX, x: 0 });
    cardRef.current?.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragState.active) return;
    setDragState(s => ({ ...s, x: e.clientX - s.startX }));
  };
  const onPointerUp = () => {
    if (!dragState.active) return;
    const threshold = 80;
    if (dragState.x > threshold) doSwipe("right");
    else if (dragState.x < -threshold) doSwipe("left");
    setDragState({ active: false, startX: 0, x: 0 });
  };

  const rotation = current ? ROTATIONS[currentIndex % ROTATIONS.length] : 0;
  const dragRotation = dragState.active ? dragState.x * 0.08 : 0;
  const totalRotation = rotation + dragRotation;

  const swipeOpacity = Math.min(Math.abs(dragState.x) / 80, 1);
  const showRight = dragState.x > 20 || swipeDir === "right";
  const showLeft = dragState.x < -20 || swipeDir === "left";

  const currentCard = current;
  const isLevel0Card = currentCard?.type === "person" && (currentCard.person?.xpLevel ?? 0) === 0;

  return (
    <Layout>
      <div
        className="min-h-screen flex flex-col items-center"
        style={{ background: "#F5F0E8", padding: "1.5rem 1rem 5rem" }}
      >
        <div style={{ maxWidth: 400, width: "100%" }}>
          <h1
            className="font-serif mb-1"
            style={{ fontSize: "1.8rem", fontWeight: 700, color: "#1A1A1A" }}
          >
            Discover
          </h1>
          <p className="font-accent mb-6" style={{ color: "#6B6355", fontSize: "0.95rem" }}>
            Swipe right to connect, left to pass
          </p>

          {isLoading ? (
            <div className="scrap-card p-8 text-center" style={{ transform: "rotate(-1deg)" }}>
              <p className="font-accent" style={{ color: "#6B6355" }}>Loading deck...</p>
            </div>
          ) : !hasMore ? (
            <div className="scrap-card p-8 text-center" style={{ transform: "rotate(-0.5deg)" }}>
              <div className="washi washi-top washi-yellow" style={{ width: 80 }} />
              <h2 className="font-serif mt-4" style={{ fontSize: "1.4rem", fontWeight: 700, color: "#1A1A1A", marginBottom: 8 }}>
                That's everyone for now
              </h2>
              <p className="font-accent" style={{ color: "#6B6355", marginBottom: "1.5rem" }}>
                Check back later for new builders
              </p>
              <button
                onClick={() => { setCurrentIndex(0); queryClient.invalidateQueries({ queryKey: getGetDiscoverDeckQueryKey() }); }}
                className="btn-ghost"
                style={{ width: "100%" }}
              >
                Refresh
              </button>
            </div>
          ) : (
            <>
              <div style={{ position: "relative", height: 440 }}>
                {[2, 1].map(offset => {
                  const bgCard = cards[currentIndex + offset];
                  if (!bgCard) return null;
                  const bgRot = ROTATIONS[(currentIndex + offset) % ROTATIONS.length];
                  return (
                    <div
                      key={offset}
                      style={{
                        position: "absolute",
                        inset: 0,
                        background: "#FDFAF4",
                        border: "1.5px solid #1A1A1A",
                        boxShadow: "3px 3px 0 #1A1A1A",
                        borderRadius: "3px",
                        transform: `rotate(${bgRot}deg) translateY(${offset * 8}px)`,
                        opacity: 0.6,
                      }}
                    />
                  );
                })}

                <div
                  ref={cardRef}
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onPointerCancel={onPointerUp}
                  className={swipeDir === "right" ? "swipe-right-anim" : swipeDir === "left" ? "swipe-left-anim" : ""}
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "#FDFAF4",
                    border: isLevel0Card ? "2px dashed #C8BFA8" : "2px solid #1A1A1A",
                    boxShadow: isLevel0Card ? "2px 2px 0 #C8BFA8" : "4px 4px 0 #1A1A1A",
                    borderRadius: "3px",
                    transform: swipeDir
                      ? undefined
                      : `rotate(${totalRotation}deg) translateX(${dragState.x * 0.4}px)`,
                    transition: dragState.active ? "none" : "transform 0.2s ease-out",
                    cursor: "grab",
                    userSelect: "none",
                    touchAction: "none",
                    overflow: "hidden",
                  }}
                >
                  {showRight && (
                    <div
                      className="font-accent"
                      style={{
                        position: "absolute",
                        top: 16,
                        left: 16,
                        fontSize: "1.4rem",
                        fontWeight: 700,
                        color: "#1A6B3A",
                        border: "2.5px solid #1A6B3A",
                        borderRadius: "4px",
                        padding: "2px 12px",
                        opacity: Math.min(swipeOpacity * 1.5, 1),
                        transform: "rotate(-8deg)",
                        zIndex: 20,
                      }}
                    >
                      YES
                    </div>
                  )}
                  {showLeft && (
                    <div
                      className="font-accent"
                      style={{
                        position: "absolute",
                        top: 16,
                        right: 16,
                        fontSize: "1.4rem",
                        fontWeight: 700,
                        color: "#CC2200",
                        border: "2.5px solid #CC2200",
                        borderRadius: "4px",
                        padding: "2px 12px",
                        opacity: Math.min(swipeOpacity * 1.5, 1),
                        transform: "rotate(8deg)",
                        zIndex: 20,
                      }}
                    >
                      PASS
                    </div>
                  )}

                  {current?.type === "person" && current.person ? (
                    <PersonCard card={current.person} />
                  ) : current?.type === "project" && current.project ? (
                    <ProjectCard card={current.project} />
                  ) : null}
                </div>
              </div>

              <div style={{ display: "flex", gap: "16px", justifyContent: "center", marginTop: "1.5rem" }}>
                <button
                  onClick={() => doSwipe("left")}
                  disabled={!!swipeDir}
                  style={{
                    width: 64,
                    height: 64,
                    background: "#FDFAF4",
                    border: "2px solid #1A1A1A",
                    boxShadow: "3px 3px 0 #1A1A1A",
                    borderRadius: "50%",
                    fontSize: "1.5rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  aria-label="Pass"
                >
                  <span style={{ color: "#CC2200" }}>✕</span>
                </button>
                <button
                  onClick={() => doSwipe("right")}
                  disabled={!!swipeDir}
                  style={{
                    width: 64,
                    height: 64,
                    background: "#E8450A",
                    border: "2px solid #1A1A1A",
                    boxShadow: "3px 3px 0 #1A1A1A",
                    borderRadius: "50%",
                    fontSize: "1.5rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  aria-label="Interested"
                >
                  <span style={{ color: "#FDFAF4" }}>✓</span>
                </button>
              </div>

              <p className="font-accent mt-4 text-center" style={{ color: "#C8BFA8", fontSize: "0.85rem" }}>
                {cards.length - currentIndex} cards left
              </p>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
