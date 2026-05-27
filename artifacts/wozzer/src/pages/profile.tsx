import { useRoute } from "wouter";
import { Layout } from "@/components/layout";
import { PostCard } from "@/components/post-card";
import { RoleBadge } from "@/components/role-badge";
import { LevelBadge } from "@/components/level-badge";
import { StreakIndicator } from "@/components/streak-indicator";
import { XpBar } from "@/components/xp-bar";
import { AchievementBadges } from "@/components/achievement-badge";
import {
  useGetUserProfile, useListUserPosts, useFollowUser, useUnfollowUser,
  useGetFollowStatus, getGetFollowStatusQueryKey, getGetUserProfileQueryKey,
} from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";

export default function Profile() {
  const [, params] = useRoute("/profile/:username");
  const username = params?.username;
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const isOwnProfile = currentUser?.username === username;

  const { data: profile, isLoading } = useGetUserProfile(username ?? "");
  const { data: postsData } = useListUserPosts(username ?? "");
  const { data: followStatus } = useGetFollowStatus(username ?? "", {
    query: { queryKey: getGetFollowStatusQueryKey(username ?? ""), enabled: !!username && !isOwnProfile }
  });

  const followMutation = useFollowUser();
  const unfollowMutation = useUnfollowUser();

  const handleFollowToggle = async () => {
    if (!username) return;
    if (followStatus?.isFollowing) {
      await unfollowMutation.mutateAsync({ username });
    } else {
      await followMutation.mutateAsync({ username });
    }
    queryClient.invalidateQueries({ queryKey: getGetFollowStatusQueryKey(username) });
    queryClient.invalidateQueries({ queryKey: getGetUserProfileQueryKey(username) });
  };

  if (isLoading) {
    return (
      <Layout>
        <div style={{ padding: "3rem", textAlign: "center" }}>
          <p className="font-accent" style={{ color: "#6B6355" }}>Loading...</p>
        </div>
      </Layout>
    );
  }

  if (!profile) {
    return (
      <Layout>
        <div style={{ padding: "3rem 1.5rem", textAlign: "center" }}>
          <p className="font-serif" style={{ fontSize: "1.2rem", color: "#1A1A1A" }}>User not found</p>
        </div>
      </Layout>
    );
  }

  const xpLevel = profile.xpLevel ?? 0;
  const xp = profile.xp ?? 0;
  const streakCurrent = profile.streakCurrent ?? 0;
  const streakLongest = profile.streakLongest ?? 0;
  const achievements = (profile as any).achievements ?? [];

  return (
    <Layout>
      <div style={{ maxWidth: 600 }}>
        <div style={{ padding: "1.5rem 1.25rem", borderBottom: "2px solid #1A1A1A", background: "#FDFAF4", position: "relative" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem", marginBottom: "1rem" }}>
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                border: "2px solid #1A1A1A",
                background: profile.avatarUrl ? undefined : "#C8BFA8",
                backgroundImage: profile.avatarUrl ? `url(${profile.avatarUrl})` : undefined,
                backgroundSize: "cover",
                backgroundPosition: "center",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "'Fraunces', serif",
                fontWeight: 700,
                fontSize: "1.8rem",
                color: "#6B6355",
                boxShadow: "3px 3px 0 #1A1A1A",
              }}
            >
              {!profile.avatarUrl && profile.displayName.charAt(0).toUpperCase()}
            </div>

            <div style={{ flex: 1 }}>
              <h1 className="font-serif" style={{ fontSize: "1.4rem", fontWeight: 700, color: "#1A1A1A", marginBottom: 2 }}>
                {profile.displayName}
              </h1>
              <p className="font-accent" style={{ color: "#6B6355", fontSize: "0.9rem", marginBottom: 6 }}>
                @{profile.username}
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <RoleBadge role={profile.role} />
                <LevelBadge xpLevel={xpLevel} role={profile.role} size="md" />
                {streakCurrent > 2 && <StreakIndicator streak={streakCurrent} size="md" />}
              </div>
            </div>

            {!isOwnProfile && (
              <button
                onClick={handleFollowToggle}
                disabled={followMutation.isPending || unfollowMutation.isPending}
                className={followStatus?.isFollowing ? "btn-ghost" : "btn-primary"}
                style={{ flexShrink: 0 }}
              >
                {followStatus?.isFollowing ? "Unfollow" : "Follow"}
              </button>
            )}
          </div>

          {profile.bio && (
            <p style={{ color: "#1A1A1A", fontSize: "0.9rem", fontFamily: "'Inter', sans-serif", lineHeight: 1.6, marginBottom: "0.75rem" }}>
              {profile.bio}
            </p>
          )}

          {profile.skills && profile.skills.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "0.75rem" }}>
              {profile.skills.map(s => (
                <span
                  key={s}
                  className="font-accent"
                  style={{
                    fontSize: "0.85rem",
                    padding: "2px 10px",
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

          {profile.projectLinks && profile.projectLinks.length > 0 && (
            <div style={{ marginBottom: "0.75rem" }}>
              {profile.projectLinks.map(link => (
                <a
                  key={link}
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-accent"
                  style={{ color: "#E8450A", fontSize: "0.9rem", display: "block", marginBottom: 2 }}
                >
                  {link}
                </a>
              ))}
            </div>
          )}

          <div style={{ display: "flex", gap: "1.25rem", marginBottom: "1rem" }}>
            <span className="font-accent" style={{ color: "#6B6355", fontSize: "0.9rem" }}>
              <strong style={{ color: "#1A1A1A", fontFamily: "'Fraunces', serif" }}>{profile.followersCount}</strong> followers
            </span>
            <span className="font-accent" style={{ color: "#6B6355", fontSize: "0.9rem" }}>
              <strong style={{ color: "#1A1A1A", fontFamily: "'Fraunces', serif" }}>{profile.followingCount}</strong> following
            </span>
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <XpBar xp={xp} xpLevel={xpLevel} />
          </div>

          {streakCurrent > 0 && (
            <div
              style={{
                display: "flex",
                gap: "1.25rem",
                marginBottom: "1rem",
                padding: "8px 12px",
                background: "#FFF8F0",
                border: "1.5px solid #E8450A",
                borderRadius: "3px",
              }}
            >
              <div style={{ textAlign: "center" }}>
                <div className="font-serif" style={{ fontSize: "1.2rem", fontWeight: 700, color: "#E8450A" }}>
                  🔥 {streakCurrent}
                </div>
                <div className="font-accent" style={{ fontSize: "0.7rem", color: "#6B6355" }}>current streak</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div className="font-serif" style={{ fontSize: "1.2rem", fontWeight: 700, color: "#1A1A1A" }}>
                  {streakLongest}
                </div>
                <div className="font-accent" style={{ fontSize: "0.7rem", color: "#6B6355" }}>longest ever</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div className="font-serif" style={{ fontSize: "1.2rem", fontWeight: 700, color: "#1A1A1A" }}>
                  {xp}
                </div>
                <div className="font-accent" style={{ fontSize: "0.7rem", color: "#6B6355" }}>total XP</div>
              </div>
            </div>
          )}

          {isOwnProfile && (
            <div
              style={{
                marginBottom: "1rem",
                padding: "8px 12px",
                background: "#F0EDE6",
                border: "1px dashed #C8BFA8",
                borderRadius: "3px",
              }}
            >
              <div className="font-accent" style={{ fontSize: "0.75rem", color: "#6B6355" }}>
                Visibility score (only you see this):{" "}
                <strong style={{ color: "#1A1A1A" }}>
                  {Math.round((profile.visibilityScore ?? 0) * 100)}%
                </strong>
                {" "}—{" "}
                {(profile.visibilityScore ?? 0) < 0.2
                  ? "low. Complete your profile + stay active to appear more often."
                  : (profile.visibilityScore ?? 0) < 0.5
                  ? "moderate. Keep building to climb the deck."
                  : "strong. You're showing up well."}
              </div>
            </div>
          )}

          {achievements.length > 0 && (
            <div style={{ marginBottom: "0.5rem" }}>
              <p className="font-accent" style={{ fontSize: "0.8rem", color: "#6B6355", marginBottom: 8, fontWeight: 600 }}>
                Achievements
              </p>
              <AchievementBadges achievements={achievements} />
            </div>
          )}
        </div>

        {postsData?.posts.map(post => <PostCard key={post.id} post={post} />)}

        {postsData?.posts.length === 0 && (
          <div style={{ padding: "3rem 1.5rem", textAlign: "center" }}>
            <p className="font-accent" style={{ color: "#6B6355" }}>No posts yet.</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
