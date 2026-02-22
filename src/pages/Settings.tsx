import { useState, useEffect } from "react";
import { useAuth } from "@/shared/hooks/use-auth";
import { useToast } from "@/shared/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/shared/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { ArrowLeft, Camera, Loader2, Trophy, Bell, Sparkles, User2, BarChart3, BrainCircuit } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { MyStatsTab } from "@/user/components/settings/MyStatsTab";
import type { UserProfile } from "./settings/types";
import { ProfileTab } from "./settings/ProfileTab";
import { PrivacyTab } from "./settings/PrivacyTab";
import { NotificationsTab } from "./settings/NotificationsTab";
import { GamificationTab } from "./settings/GamificationTab";
import { AccountTab } from "./settings/AccountTab";

export default function Settings() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [username, setUsername] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [bio, setBio] = useState("");
  const [style, setStyle] = useState("");
  const [socialLinks, setSocialLinks] = useState({
    twitter: "",
    instagram: "",
    tiktok: "",
  });
  const [privacySettings, setPrivacySettings] = useState({
    showAvatar: true,
    showSocialLinks: true,
    showUsername: true,
  });

  const { data: profile, isLoading: profileLoading } = useQuery<UserProfile>({
    queryKey: ["/api/me"],
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (profile) {
      setUsername(profile.username || "");
      setBio(profile.bio || "");
      setStyle(profile.style || "");
      setSocialLinks({
        twitter: profile.socialLinks?.twitter || "",
        instagram: profile.socialLinks?.instagram || "",
        tiktok: profile.socialLinks?.tiktok || "",
      });
      setPrivacySettings({
        showAvatar: profile.privacySettings?.showAvatar ?? true,
        showSocialLinks: profile.privacySettings?.showSocialLinks ?? true,
        showUsername: profile.privacySettings?.showUsername ?? true,
      });
    }
  }, [profile]);

  const checkUsernameMutation = useMutation({
    mutationFn: async (usernameToCheck: string) => {
      const response = await fetch(`/api/users/check-username/${usernameToCheck}`);
      if (!response.ok) throw new Error("Failed to check username");
      return response.json();
    },
  });

  useEffect(() => {
    if (username.length < 3) {
      setUsernameError(username.length > 0 ? "Username must be at least 3 characters" : "");
      return;
    }
    if (username.length > 50) {
      setUsernameError("Username must be less than 50 characters");
      return;
    }

    const timer = setTimeout(async () => {
      if (username === profile?.username) {
        setUsernameError("");
        return;
      }
      try {
        const result = await checkUsernameMutation.mutateAsync(username);
        setUsernameError(result.available ? "" : "Username is already taken");
      } catch {
        setUsernameError("Error checking username");
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [username, profile]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: Partial<UserProfile>) => {
      const response = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update profile");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({ title: "Profile updated", description: "Your settings have been saved." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const uploadAvatarMutation = useMutation({
    mutationFn: async (file: File) => {
      const urlResponse = await fetch("/api/me/avatar/request-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ size: file.size, contentType: file.type }),
      });
      if (!urlResponse.ok) {
        const error = await urlResponse.json();
        throw new Error(error.message || "Failed to get upload URL");
      }
      const { uploadURL, objectPath } = await urlResponse.json();

      const uploadResponse = await fetch(uploadURL, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });
      if (!uploadResponse.ok) throw new Error("Failed to upload file");

      const confirmResponse = await fetch("/api/me/avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ objectPath }),
      });
      if (!confirmResponse.ok) throw new Error("Failed to confirm upload");
      return confirmResponse.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({ title: "Avatar updated", description: "Your profile picture has been updated." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "Error", description: "Image must be less than 2MB", variant: "destructive" });
      return;
    }

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast({ title: "Error", description: "Only JPG, PNG, and WebP are allowed", variant: "destructive" });
      return;
    }

    uploadAvatarMutation.mutate(file);
  };

  const handleSaveProfile = () => {
    if (usernameError) {
      toast({ title: "Error", description: usernameError, variant: "destructive" });
      return;
    }

    updateProfileMutation.mutate({
      username: username || undefined,
      bio,
      style,
      socialLinks,
      privacySettings,
    });
  };

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/");
    }
  }, [authLoading, isAuthenticated, navigate]);

  if (authLoading || profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  if (!profile) return null;

  const avatarUrl = profile.avatarUrl || profile.profileImageUrl;
  const displayName = profile.username || `${profile.firstName || ""} ${profile.lastName || ""}`.trim() || "User";

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link to="/">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Settings</h1>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={avatarUrl || undefined} alt={displayName} />
                  <AvatarFallback className="text-2xl bg-cyan-500/20 text-cyan-400">
                    {displayName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <label
                  className="absolute bottom-0 right-0 p-1.5 bg-cyan-500 rounded-full cursor-pointer hover:bg-cyan-600 transition-colors"
                  data-testid="button-upload-avatar"
                >
                  <Camera className="w-4 h-4 text-white" />
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleAvatarChange}
                    disabled={uploadAvatarMutation.isPending}
                  />
                </label>
              </div>
              <div>
                <CardTitle>{displayName}</CardTitle>
                <CardDescription>{profile.email}</CardDescription>
                <div className="flex items-center gap-2 mt-1">
                  <Trophy className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm text-muted-foreground">{profile.totalPoints} points</span>
                  {profile.aiPreferences?.enabled && (
                    <span className="text-xs bg-purple-500/10 text-purple-500 px-2 py-0.5 rounded-full border border-purple-500/20 flex items-center gap-1">
                      <BrainCircuit className="w-3 h-3" /> AI Enabled
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Tabs defaultValue="profile" className="space-y-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="profile" data-testid="tab-profile">Profile</TabsTrigger>
            <TabsTrigger value="my-stats" data-testid="tab-my-stats">
              <BarChart3 className="w-4 h-4 mr-1" />
              My Stats
            </TabsTrigger>
            <TabsTrigger value="privacy" data-testid="tab-privacy">Privacy</TabsTrigger>
            <TabsTrigger value="notifications" data-testid="tab-notifications">
              <Bell className="w-4 h-4 mr-1" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="gamification" data-testid="tab-gamification">
              <Sparkles className="w-4 h-4 mr-1" />
              Gamification
            </TabsTrigger>
            <TabsTrigger value="account" data-testid="tab-account">
              <User2 className="w-4 h-4 mr-1" />
              Account
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <ProfileTab
              username={username}
              setUsername={setUsername}
              usernameError={usernameError}
              checkUsernameMutation={checkUsernameMutation}
              bio={bio}
              setBio={setBio}
              style={style}
              setStyle={setStyle}
              socialLinks={socialLinks}
              setSocialLinks={setSocialLinks}
            />
          </TabsContent>

          <TabsContent value="my-stats">
            <MyStatsTab />
          </TabsContent>

          <TabsContent value="privacy">
            <PrivacyTab
              privacySettings={privacySettings}
              setPrivacySettings={setPrivacySettings}
            />
          </TabsContent>

          <TabsContent value="notifications">
            <NotificationsTab />
          </TabsContent>

          <TabsContent value="gamification">
            <GamificationTab />
          </TabsContent>

          <TabsContent value="account">
            <AccountTab
              profile={profile}
              onDeleteAccount={() => {
                toast({
                  title: "Account Deletion",
                  description: "Please contact support to delete your account.",
                });
              }}
            />
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 mt-6">
          <Button
            variant="outline"
            onClick={() => navigate("/")}
            data-testid="button-cancel"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveProfile}
            disabled={updateProfileMutation.isPending || !!usernameError}
            data-testid="button-save"
          >
            {updateProfileMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : null}
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
