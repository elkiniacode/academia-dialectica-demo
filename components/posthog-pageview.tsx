"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { usePostHog } from "posthog-js/react";

const PAGE_NAMES: Record<string, string> = {
  "/": "Landing",
  "/login": "Login",
  "/gracias": "Gracias",
};

function getPageName(pathname: string): string {
  if (PAGE_NAMES[pathname]) return PAGE_NAMES[pathname];
  if (pathname.startsWith("/admin")) return `Admin: ${pathname.replace("/admin/", "").replace("/admin", "dashboard")}`;
  if (pathname.startsWith("/client")) return `Portal: ${pathname.replace("/client/", "").replace("/client", "dashboard")}`;
  return pathname;
}

export function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const posthog = usePostHog();

  useEffect(() => {
    if (pathname && posthog) {
      let url = window.origin + pathname;
      if (searchParams.toString()) {
        url += `?${searchParams.toString()}`;
      }
      posthog.capture("$pageview", {
        $current_url: url,
        page_name: getPageName(pathname),
      });
    }
  }, [pathname, searchParams, posthog]);

  return null;
}
