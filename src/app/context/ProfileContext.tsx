import {
  createContext,
  useContext,
  useCallback,
  useState,
  useEffect,
} from "react";
import { useAuth } from "./AuthContext";
import { supabase } from "../../lib/supabaseClient";

export type Profile = {
  displayName: string;
  class: string;
  appearingYear?: string;
};

type ProfileContextValue = {
  profile: Profile | null;
  loading: boolean;
  updateProfile: (data: { displayName: string; class: string; appearingYear?: string }) => Promise<void>;
  needsProfileSetup: boolean;
  prefillName: string;
};

const ProfileContext = createContext<ProfileContextValue | undefined>(undefined);

function getProfileFromUser(user: { user_metadata?: Record<string, unknown> } | null): Profile | null {
  if (!user?.user_metadata) return null;
  const meta = user.user_metadata as Record<string, unknown>;
  // We require display_name to be set by our profile setup (first-time popup)
  const displayName = meta.display_name as string;
  if (!displayName?.trim()) return null;
  return {
    displayName: displayName.trim(),
    class: (meta.class as string)?.trim() ?? "",
    appearingYear: (meta.appearing_year as string)?.trim(),
  };
}

export function getAvatarUrl(user: { user_metadata?: Record<string, unknown> } | null): string | null {
  if (!user?.user_metadata) return null;
  const meta = user.user_metadata as Record<string, unknown>;
  return (meta.avatar_url as string) ?? (meta.picture as string) ?? null;
}

export function getDisplayNameFallback(user: { user_metadata?: Record<string, unknown> } | null): string {
  if (!user?.user_metadata) return "";
  const meta = user.user_metadata as Record<string, unknown>;
  return (
    (meta.display_name as string)?.trim() ??
    (meta.full_name as string)?.trim() ??
    (meta.name as string)?.trim() ??
    ""
  );
}

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }
    const p = getProfileFromUser(user);
    setProfile(p);
    setLoading(false);
  }, [user]);

  const updateProfile = useCallback(
    async (data: { displayName: string; class: string; appearingYear?: string }) => {
      if (!user) return;
      const { error } = await supabase.auth.updateUser({
        data: {
          display_name: data.displayName.trim(),
          class: data.class.trim(),
          appearing_year: data.appearingYear?.trim() ?? null,
        },
      });
      if (error) {
        console.error("Profile update error", error);
        throw error;
      }
      setProfile({
        displayName: data.displayName.trim(),
        class: data.class.trim(),
        appearingYear: data.appearingYear?.trim(),
      });
    },
    [user]
  );

  const needsProfileSetup =
    Boolean(user) && !loading && !getProfileFromUser(user);

  const prefillName =
    user?.user_metadata &&
    typeof user.user_metadata === "object" &&
    "full_name" in user.user_metadata
      ? String((user.user_metadata as Record<string, unknown>).full_name ?? "")
      : "";

  const value: ProfileContextValue = {
    profile,
    loading,
    updateProfile,
    needsProfileSetup,
    prefillName,
  };

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) {
    throw new Error("useProfile must be used within ProfileProvider");
  }
  return ctx;
}
