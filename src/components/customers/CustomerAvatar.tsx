import { useEffect, useState } from "react";
import { UserRound } from "lucide-react";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";

import type { CustomerSummary } from "@/services/CustomerService";

interface CustomerAvatarProps {
  customer: CustomerSummary;
  size?: "sm" | "md" | "lg";
}

export default function CustomerAvatar({
  customer,
  size = "md",
}: CustomerAvatarProps) {
  const [imageSrc, setImageSrc] = useState(
    customer.image?.trim() || null
  );

  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageSrc(customer.image?.trim() || null);
    setImageError(false);
  }, [customer.id, customer.image]);

  const sizeClass = {
    sm: "size-9",
    md: "size-11",
    lg: "size-16",
  }[size];

  const iconSize = {
    sm: "size-4",
    md: "size-5",
    lg: "size-7",
  }[size];

  return (
    <Avatar className={sizeClass}>

      {/* Customer image */}
      {imageSrc && !imageError && (
        <AvatarImage
          src={imageSrc}
          alt={customer.name || "Customer"}
          referrerPolicy="no-referrer"
          onError={() => {
            console.log(
              "Customer image failed:",
              customer.id,
              customer.image
            );

            setImageError(true);
          }}
        />
      )}

      {/* Placeholder */}
      <AvatarFallback>
        <UserRound
          className={`${iconSize} text-muted-foreground`}
        />
      </AvatarFallback>

    </Avatar>
  );
}