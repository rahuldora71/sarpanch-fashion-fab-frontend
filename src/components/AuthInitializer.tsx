import {
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { useDispatch } from "react-redux";

import {
  initializeAuth,
  setCredentials,
} from "@/redux/slices/authSlice";

import { refreshSession } from "@/services/AuthService";

interface AuthInitializerProps {
  children: ReactNode;
}

/**
 * Ensures that only one refresh request can be
 * in progress at a time.
 *
 * This is especially important in React Strict Mode,
 * where effects may execute more than once in development.
 */
let refreshPromise: ReturnType<typeof refreshSession> | null = null;

function refreshOnce() {
  if (!refreshPromise) {
    refreshPromise = refreshSession().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

export default function AuthInitializer({
  children,
}: AuthInitializerProps) {
  const dispatch = useDispatch();

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        const response = await refreshOnce();

        if (!mounted) {
          return;
        }

        dispatch(setCredentials(response));
      } catch {
        if (!mounted) {
          return;
        }

        console.log(
          "No active authentication session."
        );

        dispatch(initializeAuth());
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initialize();

    return () => {
      mounted = false;
    };
  }, [dispatch]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground">
          Loading...
        </div>
      </div>
    );
  }

  return <>{children}</>;
}