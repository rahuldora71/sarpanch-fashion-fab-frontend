import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import {
    CheckCircle2,
    CircleUserRound,
    Clock3,
    KeyRound,
    LogOut,
    Mail,
    ShieldCheck,
    UserRound,
} from "lucide-react";

import toast from "react-hot-toast";

import { logout } from "@/redux/slices/authSlice";

import { logoutUser } from "@/services/AuthService";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import type { RootState } from "@/app/store";

export default function DashboardPage() {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const {
        user,
        accessToken,
        expiresIn,
        isAuthenticated,
    } = useSelector((state: RootState) => state.auth);

    // ---------------------------------------------------------
    // Logout
    // ---------------------------------------------------------



    const handleLogout = async () => {
        try {
            await logoutUser();

            toast.success(
                "Logged out successfully"
            );
        } catch (error) {
            console.error(
                "Logout API failed:",
                error
            );
        } finally {
            dispatch(logout());

            navigate("/login", {
                replace: true,
            });
        }
    };
    // ---------------------------------------------------------
    // No authenticated user
    // ---------------------------------------------------------

    if (!isAuthenticated || !user) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-background px-4">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-muted">
                            <ShieldCheck className="size-6 text-muted-foreground" />
                        </div>

                        <CardTitle>Not authenticated</CardTitle>

                        <CardDescription>
                            You are not currently logged in.
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        <Button
                            className="w-full"
                            onClick={() => navigate("/login")}
                        >
                            Go to Login
                        </Button>
                    </CardContent>
                </Card>
            </main>
        );
    }

    // ---------------------------------------------------------
    // User initials
    // ---------------------------------------------------------

    const initials = user.name
        ? user.name
            .split(" ")
            .map((word) => word[0])
            .join("")
            .slice(0, 2)
            .toUpperCase()
        : "U";

    return (
        <main className="min-h-screen bg-background">
            {/* =====================================================
          HEADER
      ====================================================== */}

            <header className="border-b bg-card">
                <div
                    className="
            mx-auto
            flex
            max-w-7xl
            items-center
            justify-between
            gap-4
            px-4
            py-4
            sm:px-6
            lg:px-8
          "
                >
                    {/* Logo */}

                    <div className="flex items-center gap-3">
                        <div
                            className="
                flex
                size-10
                items-center
                justify-center
                rounded-full
                bg-primary
                text-primary-foreground
              "
                        >
                            <span className="text-sm font-bold">
                                SF
                            </span>
                        </div>

                        <div>
                            <h1 className="text-sm font-bold tracking-wide sm:text-base">
                                SARPANCH
                            </h1>

                            <p className="text-[9px] tracking-[0.3em] text-muted-foreground sm:text-[10px]">
                                FASHION FAB
                            </p>
                        </div>
                    </div>

                    {/* Logout */}

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleLogout}
                    >
                        <LogOut className="size-4" />

                        <span className="hidden sm:inline">
                            Logout
                        </span>
                    </Button>
                </div>
            </header>

            {/* =====================================================
          MAIN CONTENT
      ====================================================== */}

            <div
                className="
          mx-auto
          max-w-7xl
          px-4
          py-6
          sm:px-6
          sm:py-8
          lg:px-8
          lg:py-10
        "
            >
                {/* Page heading */}

                <div className="mb-8">
                    <p className="text-sm font-medium text-muted-foreground">
                        Dashboard
                    </p>

                    <h2 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
                        Welcome, {user.name}
                    </h2>

                    <p className="mt-2 text-sm text-muted-foreground">
                        Your authentication and profile information.
                    </p>
                </div>

                {/* =====================================================
            PROFILE + AUTH STATUS
        ====================================================== */}

                <div className="grid gap-6 lg:grid-cols-3">

                    {/* =================================================
              PROFILE CARD
          ================================================== */}

                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Profile</CardTitle>

                            <CardDescription>
                                Information associated with your account.
                            </CardDescription>
                        </CardHeader>

                        <CardContent>
                            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">

                                {/* Avatar */}

                                <Avatar className="size-24">
                                    <AvatarImage
                                        src={user.image ?? undefined}
                                        alt={user.name}
                                    />

                                    <AvatarFallback className="text-xl">
                                        {initials}
                                    </AvatarFallback>
                                </Avatar>

                                {/* Basic info */}

                                <div className="space-y-2">
                                    <h3 className="text-xl font-semibold">
                                        {user.name}
                                    </h3>

                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Mail className="size-4" />

                                        <span>
                                            {user.email}
                                        </span>
                                    </div>

                                    <div className="flex flex-wrap gap-2 pt-1">

                                        <Badge variant="secondary">
                                            {user.provider}
                                        </Badge>

                                        {user.enable ? (
                                            <Badge>
                                                Active
                                            </Badge>
                                        ) : (
                                            <Badge variant="destructive">
                                                Disabled
                                            </Badge>
                                        )}

                                    </div>
                                </div>

                            </div>

                            <Separator className="my-6" />

                            {/* User information */}

                            <div className="grid gap-5 sm:grid-cols-2">

                                {/* User ID */}

                                <div className="flex items-start gap-3">
                                    <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted">
                                        <UserRound className="size-4 text-muted-foreground" />
                                    </div>

                                    <div>
                                        <p className="text-xs text-muted-foreground">
                                            User ID
                                        </p>

                                        <p className="mt-1 font-medium">
                                            {user.id}
                                        </p>
                                    </div>
                                </div>

                                {/* Email */}

                                <div className="flex items-start gap-3">
                                    <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted">
                                        <Mail className="size-4 text-muted-foreground" />
                                    </div>

                                    <div className="min-w-0">
                                        <p className="text-xs text-muted-foreground">
                                            Email
                                        </p>

                                        <p className="mt-1 truncate font-medium">
                                            {user.email}
                                        </p>
                                    </div>
                                </div>

                                {/* Provider */}

                                <div className="flex items-start gap-3">
                                    <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted">
                                        <CircleUserRound className="size-4 text-muted-foreground" />
                                    </div>

                                    <div>
                                        <p className="text-xs text-muted-foreground">
                                            Login Provider
                                        </p>

                                        <p className="mt-1 font-medium">
                                            {user.provider}
                                        </p>
                                    </div>
                                </div>

                                {/* Account status */}

                                <div className="flex items-start gap-3">
                                    <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted">
                                        <CheckCircle2 className="size-4 text-muted-foreground" />
                                    </div>

                                    <div>
                                        <p className="text-xs text-muted-foreground">
                                            Account Status
                                        </p>

                                        <p className="mt-1 font-medium">
                                            {user.enable
                                                ? "Enabled"
                                                : "Disabled"}
                                        </p>
                                    </div>
                                </div>

                            </div>
                        </CardContent>
                    </Card>

                    {/* =================================================
              AUTHENTICATION STATUS
          ================================================== */}

                    <Card>
                        <CardHeader>
                            <CardTitle>Authentication</CardTitle>

                            <CardDescription>
                                Current authentication state.
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-5">

                            {/* Authentication */}

                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3">

                                    <div className="flex size-9 items-center justify-center rounded-md bg-muted">
                                        <ShieldCheck className="size-4 text-muted-foreground" />
                                    </div>

                                    <div>
                                        <p className="text-sm font-medium">
                                            Status
                                        </p>

                                        <p className="text-xs text-muted-foreground">
                                            Authentication
                                        </p>
                                    </div>

                                </div>

                                <Badge>
                                    Authenticated
                                </Badge>
                            </div>

                            <Separator />

                            {/* Access Token */}

                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3">

                                    <div className="flex size-9 items-center justify-center rounded-md bg-muted">
                                        <KeyRound className="size-4 text-muted-foreground" />
                                    </div>

                                    <div>
                                        <p className="text-sm font-medium">
                                            Access Token
                                        </p>

                                        <p className="text-xs text-muted-foreground">
                                            Redux
                                        </p>
                                    </div>

                                </div>

                                {accessToken ? (
                                    <Badge>
                                        Available
                                    </Badge>
                                ) : (
                                    <Badge variant="destructive">
                                        Missing
                                    </Badge>
                                )}
                            </div>

                            <Separator />

                            {/* Expiration */}

                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3">

                                    <div className="flex size-9 items-center justify-center rounded-md bg-muted">
                                        <Clock3 className="size-4 text-muted-foreground" />
                                    </div>

                                    <div>
                                        <p className="text-sm font-medium">
                                            Expires In
                                        </p>

                                        <p className="text-xs text-muted-foreground">
                                            Access token
                                        </p>
                                    </div>

                                </div>

                                <span className="text-sm font-medium">
                                    {expiresIn
                                        ? `${Math.floor(expiresIn / 60)} min`
                                        : "N/A"}
                                </span>
                            </div>

                        </CardContent>
                    </Card>

                </div>

                {/* =====================================================
            ACCOUNT DETAILS
        ====================================================== */}

                <Card className="mt-6">
                    <CardHeader>
                        <CardTitle>Account Details</CardTitle>

                        <CardDescription>
                            Additional information returned by the backend.
                        </CardDescription>
                    </CardHeader>

                    <CardContent>

                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">

                            {/* Created */}

                            <div>
                                <p className="text-xs text-muted-foreground">
                                    Account Created
                                </p>

                                <p className="mt-1 text-sm font-medium">
                                    {new Date(
                                        user.createdAt
                                    ).toLocaleDateString()}
                                </p>
                            </div>

                            {/* Updated */}

                            <div>
                                <p className="text-xs text-muted-foreground">
                                    Last Updated
                                </p>

                                <p className="mt-1 text-sm font-medium">
                                    {new Date(
                                        user.updatedAt
                                    ).toLocaleDateString()}
                                </p>
                            </div>

                            {/* Provider */}

                            <div>
                                <p className="text-xs text-muted-foreground">
                                    Provider
                                </p>

                                <p className="mt-1 text-sm font-medium">
                                    {user.provider}
                                </p>
                            </div>

                            {/* Roles */}

                            <div>
                                <p className="text-xs text-muted-foreground">
                                    Roles
                                </p>

                                <div className="mt-1 flex flex-wrap gap-1">

                                    {user.roles.length > 0 ? (
                                        user.roles.map((role) => (
                                            <Badge key={role.id}>
                                                {role.name}
                                            </Badge>
                                        ))
                                    ) : (
                                        <span className="text-sm font-medium">
                                            No roles
                                        </span>
                                    )}

                                </div>
                            </div>

                        </div>

                    </CardContent>
                </Card>

                {/* =====================================================
            DEBUG CARD
        ====================================================== */}

                <Card className="mt-6">
                    <CardHeader>
                        <CardTitle>Authentication Debug</CardTitle>

                        <CardDescription>
                            This section is temporary and helps verify that
                            your Redux authentication setup is working.
                        </CardDescription>
                    </CardHeader>

                    <CardContent>

                        <div className="rounded-lg bg-muted p-4">

                            <pre
                                className="
                  overflow-x-auto
                  text-xs
                  leading-6
                  text-muted-foreground
                "
                            >
                                {JSON.stringify(
                                    {
                                        isAuthenticated,
                                        hasAccessToken: Boolean(accessToken),
                                        expiresIn,
                                        user,
                                    },
                                    null,
                                    2
                                )}
                            </pre>

                        </div>

                    </CardContent>
                </Card>

            </div>
        </main>
    );
}