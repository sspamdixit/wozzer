import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Layout } from "@/components/layout";
import { PostCard } from "@/components/post-card";
import { RoleBadge } from "@/components/role-badge";
import {
  useGetFeed, useCreatePost, getGetFeedQueryKey,
  useGetSuggestedUsers, UserProfile,
  useFollowUser, useUnfollowUser,
  getGetFollowStatusQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Loader2 } from "lucide-react";

function SuggestedUser({ user, onFollow }: { user: UserProfile; onFollow: (username: string) => void }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "10px 0",
        borderBottom: "1px solid #EDE8DE",
      }}
    >
      <Link href={`/profile/${user.username}`}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            border: "1.5px solid #1A1A1A",
            background: user.avatarUrl ? undefined : "#C8BFA8",
            backgroundImage: user.avatarUrl ? `url(${user.avatarUrl})` : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "'Fraunces', serif",
            fontSize: "0.85rem",
            fontWeight: 700,
            color: "#6B6355",
            cursor: "pointer",
          }}
        >
          {!user.avatarUrl && user.displayName.charAt(0).toUpperCase()}
        </div>
      </Link>
      <div style={{ flex: 1, minWidth: 0 }}>
        <Link href={`/profile/${user.username}`} style={{ textDecoration: "none" }}>
          <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: "0.88rem", color: "#1A1A1A", lineHeight: 1.2 }}>
            {user.displayName}
          </div>
        </Link>
        <div><RoleBadge role={user.role} level={user.level ?? undefined} /></div>
      </div>
      <button
        onClick={() => onFollow(user.username)}
        className="btn-ghost"
        style={{ padding: "2px 10px", fontSize: "0.85rem" }}
      >
        Follow
      </button>
    </div>
  );
}

export default function Feed() {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const queryClient = useQueryClient();

  const { data: feedData, isLoading: isLoadingFeed } = useGetFeed();
  const { data: suggestedUsers } = useGetSuggestedUsers();
  const createPost = useCreatePost();
  const followMutation = useFollowUser();

  const handlePost = async () => {
    if (!content.trim()) return;
    try {
      await createPost.mutateAsync({ data: { content } });
      setContent("");
      queryClient.invalidateQueries({ queryKey: getGetFeedQueryKey() });
    } catch (_) {}
  };

  const handleFollow = async (username: string) => {
    try {
      await followMutation.mutateAsync({ username });
      queryClient.invalidateQueries({ queryKey: getGetFollowStatusQueryKey(username) });
      queryClient.invalidateQueries({ queryKey: getGetFeedQueryKey() });
    } catch (_) {}
  };

  return (
    <Layout>
      <div style={{ display: "flex", minHeight: "100vh" }}>
        {/* Main feed */}
        <div style={{ flex: 1, maxWidth: 600, borderRight: "1.5px solid #C8BFA8" }}>
          {/* Composer */}
          <div style={{ padding: "1rem 1.25rem", borderBottom: "2px solid #1A1A1A", background: "#FDFAF4" }}>
            <div style={{ display: "flex", gap: "12px" }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  border: "1.5px solid #1A1A1A",
                  background: user?.avatarUrl ? undefined : "#C8BFA8",
                  backgroundImage: user?.avatarUrl ? `url(${user.avatarUrl})` : undefined,
                  backgroundSize: "cover",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "'Fraunces', serif",
                  fontWeight: 700,
                  color: "#6B6355",
                  fontSize: "0.9rem",
                }}
              >
                {!user?.avatarUrl && user?.displayName?.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <textarea
                  placeholder="What are you building?"
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  style={{
                    width: "100%",
                    minHeight: 80,
                    background: "#EDE8DE",
                    border: "1.5px solid #C8BFA8",
                    borderRadius: "2px",
                    padding: "10px 12px",
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "0.9rem",
                    color: "#1A1A1A",
                    outline: "none",
                    resize: "none",
                    boxSizing: "border-box",
                    marginBottom: "8px",
                  }}
                />
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button
                    onClick={handlePost}
                    disabled={!content.trim() || createPost.isPending}
                    className="btn-primary"
                    style={{ opacity: !content.trim() ? 0.5 : 1 }}
                  >
                    {createPost.isPending ? <Loader2 size={14} className="animate-spin" /> : "Post"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Feed posts */}
          {isLoadingFeed ? (
            <div style={{ padding: "3rem", textAlign: "center" }}>
              <p className="font-accent" style={{ color: "#6B6355" }}>Loading...</p>
            </div>
          ) : feedData?.posts.length === 0 ? (
            <div style={{ padding: "3rem 1.5rem", textAlign: "center" }}>
              <div className="scrap-card p-6" style={{ transform: "rotate(-0.5deg)" }}>
                <div className="washi washi-top washi-yellow" style={{ width: 70 }} />
                <p className="font-serif mt-4" style={{ fontSize: "1.1rem", fontWeight: 700, color: "#1A1A1A", marginBottom: 6 }}>
                  Empty feed
                </p>
                <p className="font-accent" style={{ color: "#6B6355", fontSize: "0.95rem" }}>
                  Follow people you liked in Discover to see their posts here.
                </p>
              </div>
            </div>
          ) : (
            feedData?.posts.map(post => <PostCard key={post.id} post={post} />)
          )}
        </div>

        {/* Suggested sidebar */}
        {suggestedUsers && suggestedUsers.length > 0 && (
          <div
            className="hidden md:block"
            style={{ width: 280, padding: "1.25rem", flexShrink: 0 }}
          >
            <div className="scrap-card p-4" style={{ transform: "rotate(0.5deg)" }}>
              <div className="washi washi-top washi-green" style={{ width: 60 }} />
              <p className="font-accent mt-3 mb-3" style={{ color: "#6B6355", fontSize: "0.9rem", fontWeight: 600 }}>
                Suggested builders
              </p>
              {suggestedUsers.slice(0, 5).map(u => (
                <SuggestedUser key={u.id} user={u} onFollow={handleFollow} />
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
