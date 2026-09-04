import { useState } from "react";
import {
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
} from "lucide-react";
import { useDispatch } from "react-redux";
import {  useNavigate } from "react-router-dom";

import { setCredentials } from "@/redux/slices/authSlice";
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

import type LoginData from "@/models/LoginData";
import { loginUser } from "@/services/AuthService";
import { toast } from "react-toastify/unstyled";
import GoogleLoginButton from "@/components/GoogleLoginButton";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [loginData, setLoginData] = useState<LoginData>({
    email: "",
    password: "",
  });

  // ---------------------------------------------------------
  // Handle input changes
  // ---------------------------------------------------------

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;

    setLoginData((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (error) {
      setError("");
    }
  };

  // ---------------------------------------------------------
  // Login
  // ---------------------------------------------------------

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
  const response = await loginUser(loginData);

  dispatch(setCredentials(response));

  toast.success("Login successful!");

  navigate( import.meta.env.VITE_LOGIN_SUCCESS_REDIRECT_URL, {
    replace: true,
  });
} catch (error: any) {
  console.error("Login failed:", error);

  const message =
    error?.response?.data?.message ??
    "Invalid email or password.";

  toast.error(message);

    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------
  // Google Login
  // ---------------------------------------------------------

  

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
          {/* Background image */}
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

          {/* Branding content */}
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

            {/* Desktop branding content */}
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
                Welcome Back
              </p>

              <h2
                className="
                  text-4xl
                  font-bold
                  leading-tight
                  xl:text-6xl
                "
              >
                Style that speaks
                <br />
                for itself.
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
                Manage your fashion orders, measurements,
                customers and tailoring workflow from one
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
            LOGIN SECTION
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

            {/* =================================================
                HEADER
            ================================================== */}

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
                  Welcome back
                </CardTitle>

                <p
                  className="
                    mt-2
                    text-sm
                    text-muted-foreground
                  "
                >
                  Enter your credentials to access your account.
                </p>
              </div>

            </CardHeader>

            {/* =================================================
                FORM
            ================================================== */}

            <CardContent>

              <form
                onSubmit={handleSubmit}
                className="space-y-5"
              >

                {/* =================================================
                    EMAIL
                ================================================== */}

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
                      value={loginData.email}
                      onChange={handleChange}
                      placeholder="you@example.com"
                      autoComplete="email"
                      className="h-11 pl-10"
                      required
                    />

                  </div>

                </div>

                {/* =================================================
                    PASSWORD
                ================================================== */}

                <div className="space-y-2">

                  <div
                    className="
                      flex
                      items-center
                      justify-between
                      gap-3
                    "
                  >

                    <Label htmlFor="password">
                      Password
                    </Label>

                    <a
                      href="/forgot-password"
                      className="
                        text-sm
                        font-medium
                        text-primary
                        hover:underline
                      "
                    >
                      Forgot password?
                    </a>

                  </div>

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
                      value={loginData.password}
                      onChange={handleChange}
                      placeholder="Enter your password"
                      autoComplete="current-password"
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
                        transition-colors
                        hover:text-foreground
                      "
                      aria-label={
                        showPassword
                          ? "Hide password"
                          : "Show password"
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>

                  </div>

                </div>

                {/* =================================================
                    ERROR MESSAGE
                ================================================== */}

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

                {/* =================================================
                    REMEMBER ME
                ================================================== */}

                <div className="flex items-center gap-2">

                  <Checkbox id="remember" />

                  <Label
                    htmlFor="remember"
                    className="
                      cursor-pointer
                      text-sm
                      font-normal
                      text-muted-foreground
                    "
                  >
                    Remember me
                  </Label>

                </div>

                {/* =================================================
                    SIGN IN BUTTON
                ================================================== */}

                <Button
                  type="submit"
                  disabled={loading}
                  className="h-11 w-full"
                >
                  {loading
                    ? "Signing in..."
                    : "Sign in"}
                </Button>

                {/* =================================================
                    DIVIDER
                ================================================== */}

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

                {/* =================================================
                    GOOGLE LOGIN
                ================================================== */}

               <GoogleLoginButton />

                {/* =================================================
                    SIGN UP
                ================================================== */}

                <p
                  className="
                    pt-1
                    text-center
                    text-sm
                    text-muted-foreground
                  "
                >
                  Don't have an account?{" "}

                  <a
                    href="/signup"
                    className="
                      font-medium
                      text-primary
                      underline-offset-4
                      hover:underline
                    "
                  >
                    Create an account
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