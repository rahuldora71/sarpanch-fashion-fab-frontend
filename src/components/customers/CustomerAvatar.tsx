import { UserRound } from "lucide-react";

interface CustomerAvatarProps {
  name: string;
  image?: string | null;
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: "h-9 w-9 text-sm",
  md: "h-12 w-12 text-base",
  lg: "h-14 w-14 text-lg",
};

export default function CustomerAvatar({
  name,
  image,
  size = "md",
}: CustomerAvatarProps) {
  const initial =
    name?.trim()?.charAt(0)?.toUpperCase() || "?";

  return (
    <div
      className={`
        relative flex shrink-0 items-center justify-center
        overflow-hidden rounded-full
        border border-border
        bg-muted
        font-semibold text-muted-foreground
        ${sizes[size]}
      `}
    >
      {image ? (
        <img
          src={image}
          alt={name}
          className="absolute inset-0 h-full w-full object-cover"
          referrerPolicy="no-referrer"
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
        />
      ) : null}

      {!image ? (
        <>
          <span className="sr-only">{name}</span>
          <UserRound className="h-1/2 w-1/2" />
        </>
      ) : (
        <span className="sr-only">{initial}</span>
      )}
    </div>
  );
}