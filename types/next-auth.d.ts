import "next-auth";

declare module "next-auth" {
  interface Session {
    accessToken: string;
    role: string;
    userId: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
    role?: string;
    userId?: string;
  }
}
