"use client";

import { getAuthToken } from "@/lib/authToken";
import Image from "next/image";
import Link from "next/link";
import { useSyncExternalStore } from "react";

type LogoLinkProps = {
  width: number;
  height: number;
  className?: string;
};

function subscribe() {
  return () => {};
}

function getLogoHref() {
  return getAuthToken() ? "/dashboard" : "/";
}

function getServerLogoHref() {
  return "/";
}

export function LogoLink({ width, height, className }: LogoLinkProps) {
  const href = useSyncExternalStore(subscribe, getLogoHref, getServerLogoHref);

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
