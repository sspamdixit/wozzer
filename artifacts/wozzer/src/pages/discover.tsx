import { useRef, useState, useCallback } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout";
import { useGetDiscoverDeck, useRecordSwipe, getGetDiscoverDeckQueryKey } from "@workspace/api-client-react";
import type { DiscoverCard } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { RoleBadge } from "@/components/role-badge";
import { Link } from "wouter";

function PersonCard({ card }: { card: NonNullable<DiscoverCard["person"]> }) {
  return (
    <div style={{ padding: "1.5rem", height: "100%", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <div className="washi washi-top washi-blue" style={{ width: 70, transform: "translateX(-50%) rotate(-2deg)" }} />
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "0.5rem" }}>
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: "50%",
            border: "2px solid #1A1A1A",
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
        <div>
          <div className="font-serif" style={{ fontWeight: 700, fontSize: "1.2rem", color: "#1A1A1A" }}>{card.displayName}</div>
          <div className="font-accent" style={{ color: "#6B6355", fontSize: "0.9rem" }}>@{card.username}</div>
        </div>
        <div style={{ marginLeft: "auto" }}>
          <RoleBadge role={card.role} level={card.level ?? undefined} />
        </div>
      </div>

      {card.bio && (
        <p style={{ color: "#6B6355", fontSize: "0.88rem", fontFamily: "'Inter', sans-serif", lineHeight: 1.6 }}>
          {card.bio}
        </p>
      )}

      {card.skills && card.skills.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
          {card.skills.slice(0, 5).map(s => (
            <span
              key={s}
              className="font-accent"
              style={{
                fontSize: "0.85rem",
                padding: "1px 8px",
                background: "#EDE8DE",
                border: "1px solid #C8BFA8",
                borderRadius: "2px",
                color: "#6B6355",
              }}
            >
              {s}
            </span>
          ))}
        </div>
      )}

      <div style={{ marginTop: "auto" }}>
        <div className="font-accent" style={{ color: "#C8BFA8", fontSize: "0.85rem" }}>
          {card.followersCount} followers
        </div>
      </div>
    </div>
  );
}

function ProjectCard({ card }: { card: NonNullable<DiscoverCard["project"]> }) {
  return (
    <div style={{ padding: "1.5rem", height: "100%", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <div className="washi washi-top washi-orange" style={{ width: 70, transform: "translateX(-50%) rotate(2deg)" }} />
      <div style={{ marginTop: "0.5rem" }}>
        <span
          className="font-accent"
          style={{
            fontSize: "0.8rem",
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
        <h3 className="font-serif" style={{ fontSize: "1.4rem", fontWeight: 700, color: "#1A1A1A", marginTop: 4 }}>
          {card.name}
        </h3>
      </div>

      <p style={{ color: "#6B6355", fontSize: "0.88rem", fontFamily: "'Inter', sans-serif", lineHeight: 1.6 }}>
        {card.description}
      </p>

      {card.tags && card.tags.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
          {card.tags.slice(0, 4).map(t => (
            <span
              key={t}
              className="font-accent"
              style={{
                fontSize: "0.85rem",
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

      <div style={{ marginTop: "auto" }}>
        <div className="font-accent" style={{ color: "#6B6355", fontSize: "0.9rem" }}>
          by @{card.authorUsername}
          {card.authorLevel && <span style={{ marginLeft: 6, opacity: 0.7, textTransform: "capitalize" }}>· {card.authorLevel}</span>}
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

  // Touch/mouse drag
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
              {/* Stack of 3 background cards */}
              <div style={{ position: "relative", height: 420 }}>
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

                {/* Active swipe card */}
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
                    border: "2px solid #1A1A1A",
                    boxShadow: "4px 4px 0 #1A1A1A",
                    borderRadius: "3px",
                    transform: swipeDir
                      ? undefined
                      : `rotate(${totalRotation}deg) translateX(${dragState.x * 0.4}px)`,
                    transition: dragState.active ? "none" : "transform 0.2s ease-out",
                    cursor: "grab",
                    userSelect: "none",
                    touchAction: "none",
                  }}
                >
                  {/* Swipe indicators */}
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

              {/* Action buttons */}
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
                    fontFamily: "'Fraunces', serif",
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
