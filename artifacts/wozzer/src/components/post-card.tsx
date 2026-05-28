import { Post } from "@workspace/api-client-react";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { RoleBadge } from "./role-badge";

export function PostCard({ post }: { post: Post }) {
  return (
    <div
      style={{
        borderBottom: "1.5px solid #C8BFA8",
        padding: "1rem 1.25rem",
        background: "#FDFAF4",
      }}
    >
      <div style={{ display: "flex", gap: "12px" }}>
        <Link href={`/profile/${post.author.username}`}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              border: "1.5px solid #1A1A1A",
              background: post.author.avatarUrl ? undefined : "#C8BFA8",
              backgroundImage: post.author.avatarUrl ? `url(${post.author.avatarUrl})` : undefined,
              backgroundSize: "cover",
              backgroundPosition: "center",
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "'Fraunces', serif",
              fontWeight: 700,
              color: "#6B6355",
              cursor: "pointer",
            }}
          >
            {!post.author.avatarUrl && post.author.displayName.charAt(0).toUpperCase()}
          </div>
        </Link>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "4px" }}>
            <Link
              href={`/profile/${post.author.username}`}
              style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, color: "#1A1A1A", textDecoration: "none", fontSize: "0.95rem" }}
            >
              {post.author.displayName}
            </Link>
            <span className="font-accent" style={{ color: "#6B6355", fontSize: "0.85rem" }}>@{post.author.username}</span>
            <span style={{ color: "#C8BFA8" }}>·</span>
            <span className="font-accent" style={{ color: "#C8BFA8", fontSize: "0.85rem", whiteSpace: "nowrap" }}>
              {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
            </span>
          </div>

          <div style={{ marginBottom: "6px" }}>
            <RoleBadge role={post.author.role} level={post.author.level ?? undefined} />
          </div>

          <p style={{ color: "#1A1A1A", whiteSpace: "pre-wrap", wordBreak: "break-word", lineHeight: 1.6, fontSize: "0.9rem", fontFamily: "'Inter', sans-serif" }}>
            {post.content}
          </p>

          {post.imageUrl && (
            <div style={{ marginTop: "10px", borderRadius: "2px", overflow: "hidden", border: "1.5px solid #C8BFA8" }}>
              <img src={post.imageUrl} alt="Post" style={{ width: "100%", height: "auto", objectFit: "cover", maxHeight: 360 }} />
            </div>
          )}

          {post.linkUrl && (
            <a
              href={post.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "block",
                marginTop: "10px",
                padding: "10px 12px",
                border: "1.5px solid #C8BFA8",
                borderRadius: "2px",
                background: "#EDE8DE",
                textDecoration: "none",
                boxShadow: "2px 2px 0 #C8BFA8",
              }}
            >
              <div className="font-accent" style={{ color: "#6D28D9", fontWeight: 600, marginBottom: 2 }}>{post.linkTitle || post.linkUrl}</div>
              <div style={{ fontSize: "0.78rem", color: "#6B6355", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "'Inter', sans-serif" }}>{post.linkUrl}</div>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
