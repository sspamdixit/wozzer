import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Layout } from "@/components/layout";
import { PostCard } from "@/components/post-card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useGetFeed, useCreatePost, getGetFeedQueryKey, useGetSuggestedUsers, UserProfile } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "wouter";
import { RoleBadge } from "@/components/role-badge";
import { Loader2 } from "lucide-react";

export default function Feed() {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const queryClient = useQueryClient();
  
  const { data: feedData, isLoading: isLoadingFeed } = useGetFeed();
  const { data: suggestedUsers, isLoading: isLoadingSuggested } = useGetSuggestedUsers();
  
  const createPost = useCreatePost();

  const handlePost = async () => {
    if (!content.trim()) return;
    try {
      await createPost.mutateAsync({ data: { content } });
      setContent("");
      queryClient.invalidateQueries({ queryKey: getGetFeedQueryKey() });
    } catch (e) {
      // Handle error
    }
  };

  return (
    <Layout>
      <div className="flex flex-col md:flex-row min-h-screen">
        <div className="flex-1 max-w-2xl w-full mx-auto md:border-r border-border">
          {/* Composer */}
          <div className="p-4 md:p-6 border-b border-border bg-background">
            <div className="flex gap-4">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user?.avatarUrl || undefined} />
                <AvatarFallback>{user?.displayName?.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-3">
                <Textarea 
                  placeholder="What are you building?" 
                  className="min-h-[100px] resize-none bg-secondary/20 border-none focus-visible:ring-1"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
                <div className="flex justify-end">
                  <Button 
                    onClick={handlePost} 
                    disabled={!content.trim() || createPost.isPending}
                    className="rounded-full px-6 font-semibold"
                  >
                    {createPost.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Post"}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Feed */}
          <div>
            {isLoadingFeed ? (
              <div className="p-8 flex justify-center text-muted-foreground">Loading...</div>
            ) : feedData?.posts.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No posts yet. Start following people!</div>
            ) : (
              feedData?.posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="hidden md:block w-80 p-6 sticky top-0 h-screen overflow-y-auto">
          <div className="bg-card border border-border rounded-xl p-4">
            <h3 className="font-bold text-lg mb-4">Suggested Users</h3>
            {isLoadingSuggested ? (
              <div className="text-muted-foreground text-sm">Loading...</div>
            ) : suggestedUsers?.length === 0 ? (
              <div className="text-muted-foreground text-sm">No suggestions right now.</div>
            ) : (
              <div className="space-y-4">
                {suggestedUsers?.map((suggestedUser) => (
                  <div key={suggestedUser.id} className="flex items-center gap-3">
                    <Link href={`/profile/${suggestedUser.username}`}>
                      <Avatar className="h-10 w-10 cursor-pointer">
                        <AvatarImage src={suggestedUser.avatarUrl || undefined} />
                        <AvatarFallback>{suggestedUser.displayName.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link href={`/profile/${suggestedUser.username}`} className="font-semibold text-sm hover:underline truncate block">
                        {suggestedUser.displayName}
                      </Link>
                      <div className="text-xs text-muted-foreground truncate">@{suggestedUser.username}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
