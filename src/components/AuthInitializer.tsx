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

export default function AuthInitializer({
  children,
}: AuthInitializerProps) {
  const dispatch = useDispatch();

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initialize = async () => {
      try {
        /*
         * The browser automatically sends the
         * refresh_token cookie.
         *
         * We do NOT manually read or send it.
         */

        const response = await refreshSession();

        dispatch(setCredentials(response));
      } catch (error) {
        /*
         * No valid refresh session.
         *
         * This is normal when the user is
         * not logged in.
         */

        console.log(
          "No active authentication session."
        );

        dispatch(initializeAuth());
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, [dispatch]);

  /*
   * Don't render the application until we've
   * checked the backend session.
   */

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