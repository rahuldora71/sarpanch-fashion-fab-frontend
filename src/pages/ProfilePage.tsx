import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  User,
  Mail,
  Phone,
  Lock,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Save,
  Eye,
  EyeOff,
  Building,
  Loader2,
  RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";

import {
  getProfile,
  updateProfile,
  changePassword,
  type UserProfileResponse,
} from "@/services/profileService";
import { setUser } from "@/redux/slices/authSlice";
import type { RootState } from "@/app/store";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export default function ProfilePage() {
  const dispatch = useDispatch();
  const authUser = useSelector((state: RootState) => state.auth.user);

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfileResponse | null>(null);

  // Profile Form state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [alternatePhone, setAlternatePhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [notes, setNotes] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Password Form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const data = await getProfile();
      setProfile(data);
      setName(data.name || "");
      setPhone(data.phone || "");
      setAlternatePhone(data.alternatePhone || "");
      setAddress(data.address || "");
      setCity(data.city || "");
      setNotes(data.notes || "");
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || "Failed to load user profile"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Name cannot be empty");
      return;
    }

    try {
      setSavingProfile(true);
      const updated = await updateProfile({
        name,
        phone,
        alternatePhone,
        address,
        city,
        notes,
      });

      setProfile(updated);
      if (authUser) {
        dispatch(
          setUser({
            ...authUser,
            name: updated.name,
          })
        );
      }
      toast.success("Profile updated successfully");
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || "Failed to update profile information"
      );
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword) {
      toast.error("Please enter your current password");
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      toast.error("New password must be at least 6 characters long");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New password and confirmation password do not match");
      return;
    }
    if (currentPassword === newPassword) {
      toast.error("New password cannot be the same as current password");
      return;
    }

    try {
      setSavingPassword(true);
      await changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });
      toast.success("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || "Failed to change password. Please verify current password."
      );
    } finally {
      setSavingPassword(false);
    }
  };

  const getInitials = () => {
    if (!profile?.name) return "U";
    return profile.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  if (loading && !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading your profile...</p>
      </div>
    );
  }

  // Group effective permissions by resource
  const permissionsByResource: Record<string, string[]> = {};
  if (profile?.effectivePermissions) {
    for (const perm of profile.effectivePermissions) {
      const parts = perm.split(/[\.:]/);
      const res = parts[0] || "general";
      const action = parts[1] || perm;
      if (!permissionsByResource[res]) {
        permissionsByResource[res] = [];
      }
      if (!permissionsByResource[res].includes(action.toUpperCase())) {
        permissionsByResource[res].push(action.toUpperCase());
      }
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16 pt-2">
      {/* =========================================================
          HERO PROFILE SUMMARY CARD
      ========================================================= */}
      <Card className="border border-border/80 shadow-md bg-gradient-to-r from-card via-card to-primary/5 rounded-2xl overflow-hidden">
        <div className="h-3 bg-gradient-to-r from-primary to-primary/40" />
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            <div className="relative">
              <Avatar className="size-20 sm:size-24 rounded-2xl border-2 border-border/80 shadow-sm">
                <AvatarImage src={profile?.image ?? undefined} alt={profile?.name} />
                <AvatarFallback className="rounded-2xl text-xl font-bold bg-primary/10 text-primary">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <span className="absolute bottom-1 right-1 size-3.5 rounded-full bg-emerald-500 ring-2 ring-background" />
            </div>

            <div className="flex-1 text-center sm:text-left space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-foreground">
                    {profile?.name}
                  </h1>
                  <p className="text-sm text-muted-foreground flex items-center justify-center sm:justify-start gap-1.5 mt-0.5">
                    <Mail className="size-3.5" />
                    <span>{profile?.email}</span>
                  </p>
                </div>

                <div className="flex flex-wrap justify-center sm:justify-end gap-1.5">
                  {profile?.roles?.map((role) => (
                    <Badge
                      key={role}
                      variant="secondary"
                      className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-primary/15 text-primary border-primary/20"
                    >
                      <ShieldCheck className="size-3 mr-1" />
                      {role.replace("ROLE_", "")}
                    </Badge>
                  ))}
                  <Badge variant="outline" className="px-2 py-1 rounded-xl text-xs font-medium text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10">
                    <CheckCircle2 className="size-3 mr-1" />
                    Active Account
                  </Badge>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-muted-foreground border-t border-border/50">
                {profile?.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="size-3.5 text-primary/70" />
                    {profile.phone}
                  </span>
                )}
                {profile?.city && (
                  <span className="flex items-center gap-1">
                    <Building className="size-3.5 text-primary/70" />
                    {profile.city}
                  </span>
                )}
                {profile?.createdAt && (
                  <span className="flex items-center gap-1">
                    <Calendar className="size-3.5 text-primary/70" />
                    Joined {new Date(profile.createdAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* =========================================================
          TABBED SETTINGS: DETAILS / PASSWORD / PERMISSIONS
      ========================================================= */}
      <Tabs defaultValue="details" className="w-full">
        <TabsList className="grid grid-cols-3 max-w-md w-full h-11 p-1 bg-muted/70 rounded-xl">
          <TabsTrigger value="details" className="rounded-lg text-xs font-semibold data-[state=active]:bg-card">
            <User className="size-3.5 mr-1.5" />
            Profile Info
          </TabsTrigger>
          <TabsTrigger value="security" className="rounded-lg text-xs font-semibold data-[state=active]:bg-card">
            <KeyRound className="size-3.5 mr-1.5" />
            Password
          </TabsTrigger>
          <TabsTrigger value="permissions" className="rounded-lg text-xs font-semibold data-[state=active]:bg-card">
            <ShieldCheck className="size-3.5 mr-1.5" />
            Access Rights
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: EDIT PROFILE */}
        <TabsContent value="details" className="mt-4">
          <Card className="rounded-2xl border border-border shadow-xs">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-bold">Personal & Contact Details</CardTitle>
              <CardDescription className="text-xs">
                Update your identity and communication details used within Sarpanch Fashion Fab ERP.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="name" className="text-xs font-semibold">
                      Full Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Ramesh Patel"
                      className="rounded-xl h-10"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-xs font-semibold">
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      value={profile?.email || ""}
                      disabled
                      className="rounded-xl h-10 bg-muted/50 cursor-not-allowed text-muted-foreground"
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Email is your primary login identifier and cannot be changed directly.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="phone" className="text-xs font-semibold">
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. +91 98765 43210"
                      className="rounded-xl h-10"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="alternatePhone" className="text-xs font-semibold">
                      Alternate Phone
                    </Label>
                    <Input
                      id="alternatePhone"
                      value={alternatePhone}
                      onChange={(e) => setAlternatePhone(e.target.value)}
                      placeholder="e.g. +91 98765 00000"
                      className="rounded-xl h-10"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-1 space-y-1.5">
                    <Label htmlFor="city" className="text-xs font-semibold">
                      City
                    </Label>
                    <Input
                      id="city"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Ahmedabad"
                      className="rounded-xl h-10"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1.5">
                    <Label htmlFor="address" className="text-xs font-semibold">
                      Address
                    </Label>
                    <Input
                      id="address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Shop / Home Street Address"
                      className="rounded-xl h-10"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="notes" className="text-xs font-semibold">
                    Personal Notes / Bio
                  </Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Optional notes or specialty..."
                    className="rounded-xl resize-none min-h-[80px]"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <Button
                    type="submit"
                    disabled={savingProfile}
                    className="rounded-xl h-10 px-5 gap-2 bg-primary text-primary-foreground font-semibold shadow-sm"
                  >
                    {savingProfile ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="size-4" />
                        <span>Save Changes</span>
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: CHANGE PASSWORD */}
        <TabsContent value="security" className="mt-4">
          <Card className="rounded-2xl border border-border shadow-xs">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-bold">Change Password</CardTitle>
              <CardDescription className="text-xs">
                Ensure your account is using a strong password. You will need to enter your current password to confirm.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4 max-w-lg">
                <div className="space-y-1.5">
                  <Label htmlFor="currentPassword" className="text-xs font-semibold">
                    Current Password <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showCurrent ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      className="rounded-xl h-10 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrent(!showCurrent)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showCurrent ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="newPassword" className="text-xs font-semibold">
                    New Password <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNew ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter at least 6 characters"
                      className="rounded-xl h-10 pr-10"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(!showNew)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showNew ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Must be different from your existing password.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword" className="text-xs font-semibold">
                    Confirm New Password <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="rounded-xl h-10 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={savingPassword}
                    className="rounded-xl h-10 px-5 gap-2 bg-primary text-primary-foreground font-semibold shadow-sm"
                  >
                    {savingPassword ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        <span>Updating Password...</span>
                      </>
                    ) : (
                      <>
                        <Lock className="size-4" />
                        <span>Update Password</span>
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: EFFECTIVE PERMISSIONS */}
        <TabsContent value="permissions" className="mt-4">
          <Card className="rounded-2xl border border-border shadow-xs">
            <CardHeader className="pb-4 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold">Your Effective System Rights</CardTitle>
                <CardDescription className="text-xs">
                  These access rights are calculated dynamically from your assigned roles.
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchProfileData}
                className="rounded-xl gap-1.5 h-8 text-xs"
              >
                <RefreshCw className="size-3.5" />
                <span>Refresh</span>
              </Button>
            </CardHeader>
            <CardContent>
              {profile?.roles?.some((r) => r === "ROLE_OWNER" || r === "ROLE_ADMIN") ? (
                <div className="p-4 rounded-xl border border-primary/30 bg-primary/10 flex items-start gap-3 mb-4">
                  <ShieldCheck className="size-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-foreground">Global Administrator Access</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Your account holds an administrative role (Owner / Admin). You possess full read, write, create, delete, export, and print privileges across all ERP resources.
                    </p>
                  </div>
                </div>
              ) : null}

              {Object.keys(permissionsByResource).length === 0 ? (
                <div className="py-8 text-center text-muted-foreground text-sm">
                  No individual granular permissions configured for your account yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries(permissionsByResource).map(([resource, actions]) => (
                    <div
                      key={resource}
                      className="p-3 rounded-xl border border-border/80 bg-card/60 space-y-2 hover:border-primary/40 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold capitalize text-foreground">
                          {resource.replace("_", " ")}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {actions.length} rights
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {actions.map((act) => (
                          <Badge
                            key={act}
                            variant="secondary"
                            className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold ${
                              act === "DELETE"
                                ? "bg-destructive/10 text-destructive"
                                : act === "CREATE"
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                : act === "EDIT"
                                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                : "bg-primary/10 text-primary"
                            }`}
                          >
                            {act}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
