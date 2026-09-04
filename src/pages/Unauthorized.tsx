import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Home,
  LockKeyhole,
  ShieldAlert,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function UnauthorizedPage() {
  const navigate = useNavigate();

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-8 text-foreground sm:px-6">
      <Card className="w-full max-w-lg border-border bg-card shadow-sm">

        {/* =====================================================
            HEADER
        ====================================================== */}

        <CardHeader className="text-center">

          {/* Icon */}

          <div
            className="
              mx-auto
              mb-5
              flex
              size-16
              items-center
              justify-center
              rounded-full
              bg-destructive/10
              text-destructive
            "
          >
            <ShieldAlert className="size-8" />
          </div>

          {/* Status */}

          <p
            className="
              text-sm
              font-semibold
              uppercase
              tracking-[0.2em]
              text-muted-foreground
            "
          >
            Error 403
          </p>

          {/* Title */}

          <CardTitle
            className="
              mt-2
              text-2xl
              font-bold
              tracking-tight
              sm:text-3xl
            "
          >
            Access denied
          </CardTitle>

          <CardDescription
            className="
              mx-auto
              mt-3
              max-w-md
              text-sm
              leading-6
              sm:text-base
            "
          >
            You don't have permission to access this page.
            Please contact an administrator if you believe
            you should have access.
          </CardDescription>

        </CardHeader>

        {/* =====================================================
            CONTENT
        ====================================================== */}

        <CardContent>

          <div
            className="
              rounded-lg
              border
              border-border
              bg-muted/50
              p-4
            "
          >
            <div className="flex items-start gap-3">

              <LockKeyhole
                className="
                  mt-0.5
                  size-5
                  shrink-0
                  text-muted-foreground
                "
              />

              <div>
                <p className="text-sm font-medium">
                  Restricted area
                </p>

                <p
                  className="
                    mt-1
                    text-sm
                    leading-5
                    text-muted-foreground
                  "
                >
                  Your account is authenticated, but your
                  current role doesn't have the required
                  permissions for this resource.
                </p>
              </div>

            </div>
          </div>

        </CardContent>

        {/* =====================================================
            ACTIONS
        ====================================================== */}

        <CardFooter
          className="
            flex
            flex-col
            gap-3
            sm:flex-row
            sm:justify-center
          "
        >

          {/* Go Back */}

          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="size-4" />

            Go back
          </Button>

          {/* Dashboard */}

          <Button
            type="button"
            className="w-full sm:w-auto"
            onClick={() => navigate("/dashboard")}
          >
            <Home className="size-4" />

            Dashboard
          </Button>

        </CardFooter>

      </Card>
    </main>
  );
}