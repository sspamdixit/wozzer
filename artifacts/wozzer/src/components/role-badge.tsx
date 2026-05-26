import { UserRole } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";

export function RoleBadge({ role }: { role: UserRole }) {
  if (!role) return null;

  if (role === UserRole.visionary) {
    return (
      <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20">
        Visionary
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="bg-cyan-500/10 text-cyan-500 border-cyan-500/20 hover:bg-cyan-500/20">
      Builder
    </Badge>
  );
}
