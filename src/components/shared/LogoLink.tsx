"use client";

import { getPostAuthHomePath, useAuthUser } from "@/features/auth";
import Image from "next/image";
import Link from "next/link";

type LogoLinkProps = {
  className?: string;
};

export function LogoLink({ className }: LogoLinkProps) {
  const { isAuthenticated, authMe } = useAuthUser();
  const href = isAuthenticated ? getPostAuthHomePath(authMe) : "/";

  return (
    <Link
      href={href}
      aria-label="Formulary HTA home"
      className={
        className ??
        "inline-flex shrink-0 [&_img]:h-auto [&_img]:w-[180px]"
      }
    >
      <Image
        src="/formulary-hta-logo.png"
        alt="Formulary HTA"
        width={737}
        height={111}
        priority
      />
    </Link>
  );
}
