import { FcGoogle } from "react-icons/fc";

import { Button } from "@/components/ui/button";

export default function GoogleLoginButton() {
  const handleGoogleLogin = () => {
    window.location.href =
      `${import.meta.env.VITE_API_BASE_URL_ROOT}/oauth2/authorization/google`;
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