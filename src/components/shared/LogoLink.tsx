"use client";

import { getPostAuthHomePath, useAuthUser } from "@/features/auth";
import Image from "next/image";
import Link from "next/link";

type LogoLinkProps = {
  width: number;
  height: number;
  className?: string;
};

export function LogoLink({ width, height, className }: LogoLinkProps) {
  const { isAuthenticated, authMe } = useAuthUser();
  const href = isAuthenticated ? getPostAuthHomePath(authMe) : "/";

  return (
    <Link
      href={href}
      aria-label="Lilly AI home"
      className={className ?? "inline-flex shrink-0"}
    >
      <Image
        src="/lillyailogo.svg"
        alt="Lilly AI"
        width={width}
        height={height}
        priority
      />
    </Link>
  );
}
