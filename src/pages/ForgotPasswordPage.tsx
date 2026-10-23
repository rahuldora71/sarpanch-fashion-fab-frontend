import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Mail,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  requestPasswordResetOtp,
  verifyPasswordResetOtp,
  resendPasswordResetOtp,
  completePasswordReset,
} from "@/services/AuthService";
import toast from "react-hot-toast";

type RecoveryStep = "EMAIL" | "OTP" | "NEW_PASSWORD" | "SUCCESS";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();

  const [step, setStep] = useState<RecoveryStep>("EMAIL");
  const [email, setEmail] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 60-second cooldown timer
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (step === "OTP" && countdown > 0) {
      setCanResend(false);
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (countdown === 0) {
      setCanResend(true);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  // -------------------------------------------------------------
  // Step 1: Submit Email for OTP
  // -------------------------------------------------------------
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const res = await requestPasswordResetOtp(trimmed);
      if (res.challengeId) {
        setChallengeId(res.challengeId);
      }
      setCountdown(res.cooldownSeconds || 60);
      setStep("OTP");
      toast.success(
        res.message || "Verification code sent! Please check your email."
      );
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        "Unable to send reset instructions. Please try again.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // Step 2: Resend OTP
  // -------------------------------------------------------------
  const handleResendOtp = async () => {
    if (!canResend || resending || !challengeId) return;

    setError(null);
    setResending(true);
    try {
      const res = await resendPasswordResetOtp(challengeId);
      setCountdown(res.cooldownSeconds || 60);
      setCanResend(false);
      setOtp("");
      toast.success(
        res.message || "A new 6-digit code has been sent to your email."
      );
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || "Failed to resend code. Please wait.";
      setError(msg);
      toast.error(msg);
    } finally {
      setResending(false);
    }
  };

  // -------------------------------------------------------------
  // Step 3: Verify OTP
  // -------------------------------------------------------------
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanOtp = otp.trim();
    if (cleanOtp.length !== 6 || !/^\d+$/.test(cleanOtp)) {
      setError("Please enter the complete 6-digit numeric verification code.");
      return;
    }

    setLoading(true);
    try {
      const res = await verifyPasswordResetOtp(challengeId, cleanOtp);
      if (!res.resetToken) {
        throw new Error("Missing reset authorization token.");
      }
      setResetToken(res.resetToken);
      setStep("NEW_PASSWORD");
      toast.success("Code verified! Please create your new password.");
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        "Invalid or expired verification code. Please check and try again.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // Step 4: Reset Password
  // -------------------------------------------------------------
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match. Please re-enter.");
      return;
    }

    setLoading(true);
    try {
      const res = await completePasswordReset(resetToken, newPassword);
      setStep("SUCCESS");
      toast.success(
        res.message || "Password updated successfully! Please log in."
      );
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        "Failed to reset password. Please start the recovery process again.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col justify-center items-center px-4 py-8 sm:px-6 lg:px-8">
      {/* Background ambient subtle glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30 dark:opacity-15">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-emerald-500/20 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex size-11 items-center justify-center rounded-2xl bg-emerald-600 text-white font-bold text-lg shadow-sm">
            SF
          </div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
            SARPANCH FASHION FAB
          </h1>
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground font-medium">
            Account Security Portal
          </p>
        </div>

        {/* =====================================================
            CARD WRAPPER
        ====================================================== */}
        <Card className="border-border bg-card/95 backdrop-blur-sm shadow-md rounded-2xl">
          {/* STEP 1: ENTER EMAIL */}
          {step === "EMAIL" && (
            <>
              <CardHeader className="space-y-1 pb-4">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <KeyRound className="size-5 text-emerald-600 dark:text-emerald-400" />
                  Forgot Password
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Enter your registered account email. We will send a 6-digit
                  one-time verification code to reset your password.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleEmailSubmit} className="space-y-4">
                  {error && (
                    <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-2">
                      <AlertCircle className="size-4 shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-xs font-semibold">
                      Registered Email Address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g. tailor@sarpanch.com"
                        className="pl-9 h-10 text-sm"
                        autoFocus
                        required
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-10 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <RefreshCw className="size-4 animate-spin" />
                        Sending verification code...
                      </span>
                    ) : (
                      "Send Verification Code"
                    )}
                  </Button>

                  <div className="pt-2 text-center">
                    <Link
                      to="/login"
                      className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors font-medium"
                    >
                      <ArrowLeft className="size-3.5" />
                      Back to Login
                    </Link>
                  </div>
                </form>
              </CardContent>
            </>
          )}

          {/* STEP 2: ENTER OTP */}
          {step === "OTP" && (
            <>
              <CardHeader className="space-y-1 pb-4">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <ShieldCheck className="size-5 text-emerald-600 dark:text-emerald-400" />
                  Verify 6-Digit Code
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  We sent a 6-digit code to{" "}
                  <strong className="text-foreground">{email}</strong>. It
                  expires in 5 minutes.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleOtpSubmit} className="space-y-4">
                  {error && (
                    <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-2">
                      <AlertCircle className="size-4 shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label htmlFor="otp" className="text-xs font-semibold">
                      Verification Code (OTP)
                    </Label>
                    <Input
                      id="otp"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      value={otp}
                      onChange={(e) =>
                        setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                      }
                      placeholder="• • • • • •"
                      className="h-12 text-center text-xl font-mono tracking-widest font-bold"
                      autoFocus
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-10 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                    disabled={loading || otp.length !== 6}
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <RefreshCw className="size-4 animate-spin" />
                        Verifying...
                      </span>
                    ) : (
                      "Confirm & Continue"
                    )}
                  </Button>

                  {/* Resend Action with 60-second Countdown */}
                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-muted-foreground">
                      Didn't get the email?
                    </span>
                    {canResend ? (
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={resending}
                        className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline inline-flex items-center gap-1 cursor-pointer"
                      >
                        {resending ? (
                          <>
                            <RefreshCw className="size-3 animate-spin" />
                            Resending...
                          </>
                        ) : (
                          "Resend Code"
                        )}
                      </button>
                    ) : (
                      <span className="text-muted-foreground font-mono">
                        Resend in {countdown}s
                      </span>
                    )}
                  </div>

                  <div className="pt-2 text-center border-t border-border/50">
                    <button
                      type="button"
                      onClick={() => setStep("EMAIL")}
                      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors font-medium cursor-pointer"
                    >
                      <ArrowLeft className="size-3.5" />
                      Change Email Address
                    </button>
                  </div>
                </form>
              </CardContent>
            </>
          )}

          {/* STEP 3: CREATE NEW PASSWORD */}
          {step === "NEW_PASSWORD" && (
            <>
              <CardHeader className="space-y-1 pb-4">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Lock className="size-5 text-emerald-600 dark:text-emerald-400" />
                  Set New Password
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Create a secure new password for your Sarpanch Fashion Fab
                  account.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  {error && (
                    <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-2">
                      <AlertCircle className="size-4 shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label
                      htmlFor="newPassword"
                      className="text-xs font-semibold"
                    >
                      New Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        className="pr-10 h-10 text-sm"
                        autoFocus
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((p) => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? (
                          <EyeOff className="size-4" />
                        ) : (
                          <Eye className="size-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label
                      htmlFor="confirmPassword"
                      className="text-xs font-semibold"
                    >
                      Confirm New Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter your password"
                        className="pr-10 h-10 text-sm"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((p) => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="size-4" />
                        ) : (
                          <Eye className="size-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-10 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                    disabled={
                      loading ||
                      !newPassword ||
                      newPassword !== confirmPassword ||
                      newPassword.length < 6
                    }
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <RefreshCw className="size-4 animate-spin" />
                        Updating Password...
                      </span>
                    ) : (
                      "Save Password & Finish"
                    )}
                  </Button>
                </form>
              </CardContent>
            </>
          )}

          {/* STEP 4: SUCCESS */}
          {step === "SUCCESS" && (
            <CardContent className="pt-6 pb-6 text-center space-y-4">
              <div className="mx-auto size-12 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="size-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-foreground">
                  Password Reset Complete!
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Your password has been successfully updated. All other active
                  sessions have been revoked for your security.
                </p>
              </div>
              <Button
                type="button"
                className="w-full h-10 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                onClick={() => navigate("/login")}
              >
                Go to Login
              </Button>
            </CardContent>
          )}
        </Card>

        {/* Security badge footer */}
        <div className="text-center text-[11px] text-muted-foreground/80 flex items-center justify-center gap-1.5">
          <ShieldCheck className="size-3.5 text-emerald-600" />
          <span>Encrypted with 256-bit SSL & BCrypt Password Hashing</span>
        </div>
      </div>
    </main>
  );
}
