import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

async function refreshAccessToken(token: {
  refreshToken?: string;
  [key: string]: unknown;
}) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type: "refresh_token",
      refresh_token: token.refreshToken as string,
    }),
  });

  const refreshed = await res.json();

  if (!res.ok) throw refreshed;

  return {
    ...token,
    accessToken: refreshed.access_token,
    expiresAt: Math.floor(Date.now() / 1000) + refreshed.expires_in,
    // Keep existing refresh token if a new one wasn't returned
    refreshToken: refreshed.refresh_token ?? token.refreshToken,
  };
}

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  // S4: JWT expires in 1 day — revoked clients get kicked within 24h
  session: { strategy: "jwt", maxAge: 24 * 60 * 60 },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope:
            "openid email profile https://www.googleapis.com/auth/calendar.readonly",
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],
  callbacks: {
    async authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const isAdmin = pathname.startsWith("/admin");
      const isClient = pathname.startsWith("/client");

      // Unauthenticated → login
      if ((isAdmin || isClient) && !auth) {
        return Response.redirect(new URL("/login", request.url));
      }

      // CLIENT trying to access /admin → redirect to client dashboard
      if (isAdmin && auth?.role !== "ADMIN") {
        return Response.redirect(new URL("/client/dashboard", request.url));
      }

      // /client routes: allow CLIENT and ADMIN (admin can inspect client portal)
      if (isClient && auth?.role !== "CLIENT" && auth?.role !== "ADMIN") {
        return Response.redirect(new URL("/login", request.url));
      }

      // Force password change for auto-created clients on first login
      if (
        isClient &&
        auth?.role === "CLIENT" &&
        auth?.requirePasswordChange === true &&
        !pathname.startsWith("/client/change-password")
      ) {
        return Response.redirect(new URL("/client/change-password", request.url));
      }

      return true;
    },
    async jwt({ token, account, user, trigger }) {
      // Session update trigger — refresh requirePasswordChange from the token
      if (trigger === "update") {
        return { ...token, requirePasswordChange: false };
      }

      // On initial sign-in
      if (account) {
        if (account.provider === "google") {
          // S5: Only allow the whitelisted admin email
          if (token.email !== process.env.ADMIN_EMAIL) {
            throw new Error("Access denied");
          }
          return {
            ...token,
            accessToken: account.access_token,
            refreshToken: account.refresh_token,
            expiresAt: account.expires_at,
            role: "ADMIN",
            userId: undefined,
          };
        }

        if (account.provider === "credentials") {
          const u = user as { role: string; characterClass?: string | null; level?: number; requirePasswordChange?: boolean };
          return {
            ...token,
            role: u.role,
            userId: user.id,
            characterClass: u.characterClass ?? undefined,
            level: u.level,
            requirePasswordChange: u.requirePasswordChange ?? false,
          };
        }
      }

      // Only refresh Google tokens for admin users
      if (token.role === "ADMIN" && token.expiresAt) {
        if (Date.now() < (token.expiresAt as number) * 1000 - 60_000) {
          return token;
        }
        try {
          return await refreshAccessToken(token);
        } catch (err) {
          console.error("Failed to refresh access token", err);
          return { ...token, error: "RefreshAccessTokenError" };
        }
      }

      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      session.role = token.role as string;
      session.userId = token.userId as string;
      session.characterClass = token.characterClass as string | undefined;
      session.level = token.level as number | undefined;
      session.requirePasswordChange = token.requirePasswordChange as boolean | undefined;
      if (token.error) {
        (session as { error?: string }).error = token.error as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
