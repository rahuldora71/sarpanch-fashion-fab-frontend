import { useState } from "react";
import {
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  User,
} from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";

import type { RegisterData } from "@/models/RegisterData";
import { registerUser } from "@/services/AuthService";

export default function SignupPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [registerData, setRegisterData] =
    useState<RegisterData>({
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    });

  const [acceptTerms, setAcceptTerms] = useState(false);

  // ---------------------------------------------------------
  // Handle input changes
  // ---------------------------------------------------------

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;

    setRegisterData((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (error) {
      setError("");
    }
  };

  // ---------------------------------------------------------
  // Register
  // ---------------------------------------------------------

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setError("");

    // Password confirmation
    if (
      registerData.password !==
      registerData.confirmPassword
    ) {
      setError("Passwords do not match.");
      return;
    }

    // Terms
    if (!acceptTerms) {
      setError(
        "Please accept the Terms & Conditions to continue."
      );
      return;
    }

    setLoading(true);

    try {
      await registerUser(registerData);

      // Show success toast
      toast.success("Account created successfully!");
navigate("/login");

    } catch (error: any) {
      console.error("Registration failed:", error);

      const message =
        error?.response?.data?.message ??
        "Unable to create your account. Please try again.";

      setError(message);

      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------
  // Google signup
  // ---------------------------------------------------------

  const handleGoogleSignup = () => {
    console.log("Google signup");

    // TODO:
    // Redirect to your Google OAuth endpoint
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="grid min-h-screen lg:grid-cols-2">

        {/* =====================================================
            BRANDING SECTION
        ====================================================== */}

        <section
          className="
            relative
            flex
            min-h-[220px]
            overflow-hidden
            bg-primary
            text-primary-foreground
            lg:min-h-screen
          "
        >
          <div
            className="
              absolute
              inset-0
              bg-cover
              bg-center
              opacity-10
            "
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=1600&q=80')",
            }}
          />

          <div
            className="
              relative
              z-10
              flex
              w-full
              flex-col
              justify-between
              p-6
              sm:p-8
              lg:p-10
              xl:p-14
            "
          >

            {/* Logo */}

            <div className="flex items-center gap-3">

              <div
                className="
                  flex
                  size-10
                  shrink-0
                  items-center
                  justify-center
                  rounded-full
                  bg-primary-foreground
                  text-primary
                  sm:size-11
                "
              >
                <span className="text-sm font-bold sm:text-lg">
                  SF
                </span>
              </div>

              <div>
                <h1
                  className="
                    text-base
                    font-bold
                    tracking-wide
                    sm:text-lg
                  "
                >
                  SARPANCH
                </h1>

                <p
                  className="
                    text-[9px]
                    tracking-[0.3em]
                    text-primary-foreground/70
                    sm:text-xs
                  "
                >
                  FASHION FAB
                </p>
              </div>

            </div>

            {/* Branding */}

            <div className="hidden max-w-xl lg:block">

              <p
                className="
                  mb-4
                  text-sm
                  font-medium
                  uppercase
                  tracking-[0.3em]
                  text-primary-foreground/70
                "
              >
                Join Us
              </p>

              <h2
                className="
                  text-4xl
                  font-bold
                  leading-tight
                  xl:text-6xl
                "
              >
                Your style,
                <br />
                your story.
              </h2>

              <p
                className="
                  mt-6
                  max-w-md
                  text-base
                  leading-7
                  text-primary-foreground/70
                "
              >
                Create your Sarpanch Fashion Fab account
                and manage your orders, measurements,
                customers and tailoring workflow in one
                place.
              </p>

            </div>

            {/* Footer */}

            <p
              className="
                hidden
                text-sm
                text-primary-foreground/50
                lg:block
              "
            >
              © {new Date().getFullYear()} Sarpanch Fashion Fab
            </p>

          </div>
        </section>

        {/* =====================================================
            SIGNUP SECTION
        ====================================================== */}

        <section
          className="
            flex
            min-h-[calc(100vh-220px)]
            items-center
            justify-center
            px-4
            py-8
            sm:px-6
            md:px-10
            lg:min-h-screen
            lg:px-12
          "
        >

          <Card
            className="
              w-full
              max-w-md
              border-border
              bg-card
              shadow-sm
            "
          >

            {/* Header */}

            <CardHeader className="space-y-5 pb-5">

              <div>
                <CardTitle
                  className="
                    text-2xl
                    font-semibold
                    tracking-tight
                    sm:text-3xl
                  "
                >
                  Create an account
                </CardTitle>

                <p
                  className="
                    mt-2
                    text-sm
                    text-muted-foreground
                  "
                >
                  Enter your details to create your account.
                </p>
              </div>

            </CardHeader>

            {/* Form */}

            <CardContent>

              <form
                onSubmit={handleSubmit}
                className="space-y-4"
              >

                {/* Name */}

                <div className="space-y-2">

                  <Label htmlFor="name">
                    Full name
                  </Label>

                  <div className="relative">

                    <User
                      className="
                        absolute
                        left-3
                        top-1/2
                        size-4
                        -translate-y-1/2
                        text-muted-foreground
                      "
                    />

                    <Input
                      id="name"
                      name="name"
                      type="text"
                      value={registerData.name}
                      onChange={handleChange}
                      placeholder="Enter your name"
                      autoComplete="name"
                      className="h-11 pl-10"
                      required
                    />

                  </div>

                </div>

                {/* Email */}

                <div className="space-y-2">

                  <Label htmlFor="email">
                    Email address
                  </Label>

                  <div className="relative">

                    <Mail
                      className="
                        absolute
                        left-3
                        top-1/2
                        size-4
                        -translate-y-1/2
                        text-muted-foreground
                      "
                    />

                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={registerData.email}
                      onChange={handleChange}
                      placeholder="you@example.com"
                      autoComplete="email"
                      className="h-11 pl-10"
                      required
                    />

                  </div>

                </div>

                {/* Password */}

                <div className="space-y-2">

                  <Label htmlFor="password">
                    Password
                  </Label>

                  <div className="relative">

                    <LockKeyhole
                      className="
                        absolute
                        left-3
                        top-1/2
                        size-4
                        -translate-y-1/2
                        text-muted-foreground
                      "
                    />

                    <Input
                      id="password"
                      name="password"
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      value={registerData.password}
                      onChange={handleChange}
                      placeholder="Create a password"
                      autoComplete="new-password"
                      className="h-11 pl-10 pr-10"
                      required
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(
                          (previous) => !previous
                        )
                      }
                      className="
                        absolute
                        right-3
                        top-1/2
                        -translate-y-1/2
                        text-muted-foreground
                        hover:text-foreground
                      "
                    >
                      {showPassword ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>

                  </div>

                </div>

                {/* Confirm Password */}

                <div className="space-y-2">

                  <Label htmlFor="confirmPassword">
                    Confirm password
                  </Label>

                  <div className="relative">

                    <LockKeyhole
                      className="
                        absolute
                        left-3
                        top-1/2
                        size-4
                        -translate-y-1/2
                        text-muted-foreground
                      "
                    />

                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={
                        showConfirmPassword
                          ? "text"
                          : "password"
                      }
                      value={
                        registerData.confirmPassword
                      }
                      onChange={handleChange}
                      placeholder="Confirm your password"
                      autoComplete="new-password"
                      className="h-11 pl-10 pr-10"
                      required
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(
                          (previous) => !previous
                        )
                      }
                      className="
                        absolute
                        right-3
                        top-1/2
                        -translate-y-1/2
                        text-muted-foreground
                        hover:text-foreground
                      "
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>

                  </div>

                </div>

                {/* Error */}

                {error && (
                  <div
                    className="
                      rounded-md
                      border
                      border-destructive/30
                      bg-destructive/10
                      px-3
                      py-2
                      text-sm
                      text-destructive
                    "
                  >
                    {error}
                  </div>
                )}

                {/* Terms */}

                <div className="flex items-start gap-2 pt-1">

                  <Checkbox
                    id="terms"
                    checked={acceptTerms}
                    onCheckedChange={(checked) =>
                      setAcceptTerms(
                        checked === true
                      )
                    }
                    className="mt-0.5"
                  />

                  <Label
                    htmlFor="terms"
                    className="
                      cursor-pointer
                      text-sm
                      font-normal
                      leading-5
                      text-muted-foreground
                    "
                  >
                    I agree to the{" "}

                    <a
                      href="/terms"
                      className="
                        font-medium
                        text-primary
                        hover:underline
                      "
                    >
                      Terms & Conditions
                    </a>

                    {" "}and{" "}

                    <a
                      href="/privacy"
                      className="
                        font-medium
                        text-primary
                        hover:underline
                      "
                    >
                      Privacy Policy
                    </a>
                    .
                  </Label>

                </div>

                {/* Create Account */}

                <Button
                  type="submit"
                  disabled={loading}
                  className="h-11 w-full"
                >
                  {loading
                    ? "Creating account..."
                    : "Create account"}
                </Button>

                {/* Divider */}

                <div className="relative py-1">

                  <div
                    className="
                      absolute
                      inset-0
                      flex
                      items-center
                    "
                  >
                    <Separator />
                  </div>

                  <div
                    className="
                      relative
                      flex
                      justify-center
                    "
                  >
                    <span
                      className="
                        bg-card
                        px-3
                        text-xs
                        text-muted-foreground
                      "
                    >
                      OR CONTINUE WITH
                    </span>
                  </div>

                </div>

                {/* Google */}

                <Button
                  type="button"
                  variant="outline"
                  className="h-11 w-full"
                  onClick={handleGoogleSignup}
                >
                  <FcGoogle className="mr-2 size-5" />

                  Continue with Google
                </Button>

                {/* Login */}

                <p
                  className="
                    pt-1
                    text-center
                    text-sm
                    text-muted-foreground
                  "
                >
                  Already have an account?{" "}

                  <a
                    href="/login"
                    className="
                      font-medium
                      text-primary
                      underline-offset-4
                      hover:underline
                    "
                  >
                    Sign in
                  </a>
                </p>

              </form>

            </CardContent>

          </Card>

        </section>

      </div>
    </main>
  );
}