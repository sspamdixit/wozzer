import { useRoute } from "wouter";
import { Layout } from "@/components/layout";
import { PostCard } from "@/components/post-card";
import { RoleBadge } from "@/components/role-badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  useGetUserProfile,
  useListUserPosts,
  useFollowUser,
  useUnfollowUser,
  useGetFollowStatus,
  getGetFollowStatusQueryKey,
  getGetUserProfileQueryKey,
} from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { Link as LinkIcon, CalendarDays } from "lucide-react";
import { format } from "date-fns";

export default function Profile() {
  const [, params] = useRoute("/profile/:username");
  const username = params?.username;
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  const isOwnProfile = currentUser?.username === username;

  const { data: profile, isLoading: isProfileLoading } = useGetUserProfile(username ?? "");

  const { data: postsData, isLoading: isPostsLoading } = useListUserPosts(username ?? "");

  const { data: followStatus } = useGetFollowStatus(username ?? "", {
    query: {
      queryKey: getGetFollowStatusQueryKey(username ?? ""),
      enabled: !!username && !isOwnProfile,
    }
  });

  const followMutation = useFollowUser();
  const unfollowMutation = useUnfollowUser();

  const handleFollowToggle = async () => {
    if (!username) return;
    try {
      if (followStatus?.isFollowing) {
        await unfollowMutation.mutateAsync({ username });
      } else {
        await followMutation.mutateAsync({ username });
      }
      queryClient.invalidateQueries({ queryKey: getGetFollowStatusQueryKey(username) });
      queryClient.invalidateQueries({ queryKey: getGetUserProfileQueryKey(username) });
    } catch (e) {
      // Ignore
    }
  };

  if (isProfileLoading) {
    return (
      <Layout>
        <div className="p-8 text-center text-muted-foreground">Loading profile...</div>
      </Layout>
    );
  }

  if (!profile) {
    return (
      <Layout>
        <div className="p-8 text-center text-muted-foreground">User not found</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto border-x border-border min-h-screen pb-20 md:pb-0">
        <div className="h-32 bg-secondary/30 relative">
          <div className="absolute -bottom-16 left-6 rounded-full border-4 border-background bg-background p-1">
            <Avatar className="h-32 w-32 border border-border">
              <AvatarImage src={profile.avatarUrl || undefined} />
              <AvatarFallback className="text-4xl">{profile.displayName.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
          </div>
        </div>

        <div className="pt-20 px-6 pb-6 border-b border-border">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">{profile.displayName}</h1>
              <p className="text-muted-foreground">@{profile.username}</p>
            </div>
            {!isOwnProfile && (
              <Button
                variant={followStatus?.isFollowing ? "outline" : "default"}
                onClick={handleFollowToggle}
                disabled={followMutation.isPending || unfollowMutation.isPending}
                className="rounded-full px-6 font-semibold"
              >
                {followStatus?.isFollowing ? "Following" : "Follow"}
              </Button>
            )}
          </div>

          <div className="mb-4">
            <RoleBadge role={profile.role} />
          </div>

          {profile.bio && (
            <p className="text-foreground whitespace-pre-wrap leading-relaxed mb-4">{profile.bio}</p>
          )}

          <div className="flex flex-col gap-2 mb-6">
            {profile.projectLinks && profile.projectLinks.length > 0 && (
              <div className="flex items-center gap-2 text-primary">
                <LinkIcon className="h-4 w-4" />
                <a href={profile.projectLinks[0]} target="_blank" rel="noopener noreferrer" className="hover:underline font-medium truncate">
                  {profile.projectLinks[0].replace(/^https?:\/\//, "")}
                </a>
              </div>
            )}
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <CalendarDays className="h-4 w-4" />
              <span>Joined {format(new Date(profile.createdAt), "MMMM yyyy")}</span>
            </div>
          </div>

          <div className="flex gap-6 mb-6 text-sm">
            <div className="flex gap-1">
              <span className="font-bold text-foreground">{profile.followingCount}</span>
              <span className="text-muted-foreground">Following</span>
            </div>
            <div className="flex gap-1">
              <span className="font-bold text-foreground">{profile.followersCount}</span>
              <span className="text-muted-foreground">Followers</span>
            </div>
          </div>

          {profile.skills && profile.skills.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {profile.skills.map(skill => (
                <span key={skill} className="bg-secondary/50 text-secondary-foreground text-xs px-3 py-1 rounded-full font-medium border border-border">
                  {skill}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="font-semibold px-6 py-4 border-b border-border">Posts</div>

        <div>
          {isPostsLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading posts...</div>
          ) : postsData?.posts.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No posts yet.</div>
          ) : (
            postsData?.posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}
