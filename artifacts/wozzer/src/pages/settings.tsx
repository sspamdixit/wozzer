import { useEffect, useState } from "react";
import { Layout } from "@/components/layout";
import { useAuth } from "@/contexts/AuthContext";
import { useUpdateMyProfile, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

export default function Settings() {
  const { user, refreshUser } = useAuth();
  const updateProfile = useUpdateMyProfile();
  const queryClient = useQueryClient();

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [projectLink, setProjectLink] = useState("");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || "");
      setBio(user.bio || "");
      setProjectLink(user.projectLinks?.[0] || "");
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaved(false);
    try {
      await updateProfile.mutateAsync({
        data: {
          displayName,
          bio,
          projectLinks: projectLink ? [projectLink] : [],
        }
      });
      queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
      refreshUser();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    background: "#EDE8DE",
    border: "1.5px solid #1A1A1A",
    borderRadius: "2px",
    fontFamily: "'Inter', sans-serif",
    fontSize: "0.9rem",
    color: "#1A1A1A",
    outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: "'Caveat', cursive",
    fontSize: "1rem",
    fontWeight: 600,
    color: "#6B6355",
    display: "block",
    marginBottom: "6px",
  };

  return (
    <Layout>
      <div style={{ maxWidth: 520, padding: "1.5rem 1.25rem" }}>
        <div style={{ position: "relative", marginBottom: "1.5rem" }}>
          <div className="washi washi-top washi-yellow" style={{ width: 80, position: "relative", left: 0, transform: "rotate(-2deg)", marginBottom: -9 }} />
          <div className="scrap-card p-6" style={{ transform: "rotate(0.3deg)" }}>
            <h1 className="font-serif" style={{ fontSize: "1.6rem", fontWeight: 700, color: "#1A1A1A", marginBottom: "1.5rem" }}>
              Settings
            </h1>

            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={labelStyle}>Display name</label>
                <input
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  maxLength={60}
                  required
                  style={inputStyle}
                  placeholder="Your name"
                />
              </div>

              <div>
                <label style={labelStyle}>Bio</label>
                <textarea
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  maxLength={160}
                  rows={3}
                  style={{ ...inputStyle, resize: "vertical" }}
                  placeholder="What do you build?"
                />
              </div>

              <div>
                <label style={labelStyle}>Project link</label>
                <input
                  value={projectLink}
                  onChange={e => setProjectLink(e.target.value)}
                  type="url"
                  style={inputStyle}
                  placeholder="https://your-project.com"
                />
              </div>

              {error && (
                <p className="font-accent" style={{ color: "#CC2200", fontSize: "0.9rem" }}>{error}</p>
              )}
              {saved && (
                <p className="font-accent" style={{ color: "#1A6B3A", fontSize: "0.9rem" }}>Saved!</p>
              )}

              <button
                type="submit"
                disabled={updateProfile.isPending}
                className="btn-primary"
                style={{ marginTop: "0.5rem" }}
              >
                {updateProfile.isPending ? "Saving..." : "Save changes"}
              </button>
            </form>
          </div>
        </div>

        {/* Account info */}
        <div className="scrap-card p-5" style={{ transform: "rotate(-0.4deg)" }}>
          <h2 className="font-serif" style={{ fontSize: "1.1rem", fontWeight: 700, color: "#1A1A1A", marginBottom: "0.75rem" }}>
            Account
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <div className="font-accent" style={{ color: "#6B6355", fontSize: "0.9rem" }}>
              Email: <span style={{ color: "#1A1A1A" }}>{user?.email}</span>
            </div>
            <div className="font-accent" style={{ color: "#6B6355", fontSize: "0.9rem" }}>
              Username: <span style={{ color: "#1A1A1A" }}>@{user?.username}</span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
