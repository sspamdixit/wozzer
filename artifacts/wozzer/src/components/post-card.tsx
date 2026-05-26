import { Post } from "@workspace/api-client-react";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RoleBadge } from "./role-badge";

export function PostCard({ post }: { post: Post }) {
  return (
    <div className="p-4 md:p-6 border-b border-border bg-background hover:bg-secondary/20 transition-colors">
      <div className="flex gap-4">
        <Link href={`/profile/${post.author.username}`}>
          <Avatar className="h-10 w-10 border border-border cursor-pointer">
            <AvatarImage src={post.author.avatarUrl || undefined} />
            <AvatarFallback>{post.author.displayName.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
        </Link>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <Link href={`/profile/${post.author.username}`} className="font-semibold text-foreground hover:underline truncate">
              {post.author.displayName}
            </Link>
            <span className="text-muted-foreground text-sm truncate">@{post.author.username}</span>
            <span className="text-muted-foreground text-sm">&middot;</span>
            <span className="text-muted-foreground text-sm whitespace-nowrap">
              {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
            </span>
          </div>
          
          <div className="mb-2">
            <RoleBadge role={post.author.role} />
          </div>

          <p className="text-foreground whitespace-pre-wrap break-words leading-relaxed">
            {post.content}
          </p>

          {post.imageUrl && (
            <div className="mt-3 rounded-lg overflow-hidden border border-border">
              <img src={post.imageUrl} alt="Post attachment" className="w-full h-auto object-cover max-h-[400px]" />
            </div>
          )}

          {post.linkUrl && (
            <a href={post.linkUrl} target="_blank" rel="noopener noreferrer" className="block mt-3 p-3 rounded-lg border border-border hover:bg-secondary/50 transition-colors">
              <div className="font-medium text-primary mb-1">{post.linkTitle || post.linkUrl}</div>
              <div className="text-sm text-muted-foreground truncate">{post.linkUrl}</div>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
