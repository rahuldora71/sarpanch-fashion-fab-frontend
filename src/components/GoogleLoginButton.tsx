import { FcGoogle } from "react-icons/fc";

import { Button } from "@/components/ui/button";

export default function GoogleLoginButton() {
  const handleGoogleLogin = () => {
    const rootUrl =
      import.meta.env.VITE_API_BASE_URL_ROOT ||
      (import.meta.env.VITE_API_BASE_URL
        ? import.meta.env.VITE_API_BASE_URL.replace(/\/api\/v1\/?$/, "")
        : "http://localhost:8082");

    window.location.href = `${rootUrl}/oauth2/authorization/google`;
  };

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      onClick={handleGoogleLogin}
    >
      <FcGoogle />
      Continue with Google
    </Button>
  );
}
