import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { authConfig } from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    ...authConfig.providers,
    Credentials({
      credentials: {
        username: { label: "Usuario", type: "text" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        const username = (credentials?.username as string)?.trim();
        const password = credentials?.password as string;
        if (!username || !password) return null;

        const client = await prisma.client.findUnique({
          where: { username },
        });
        if (!client || !client.password) return null;

        const valid = await verifyPassword(password, client.password);
        if (!valid) return null;

        return {
          id: client.id,
          name: client.name,
          role: client.role,
        };
      },
    }),
  ],
});
