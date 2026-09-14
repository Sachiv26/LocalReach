import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { z } from "zod";
import prisma from "@/lib/db";
import { env } from "@/lib/env";
import type { Role } from "@/lib/permissions";
import { permissionsForRoles } from "@/lib/permissions";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(200),
});

async function loadRoles(userId: string): Promise<Role[]> {
  const roles = await prisma.userRole.findMany({
    where: { userId },
    select: { role: true },
  });
  return roles.map((r) => r.role);
}

export const authOptions: NextAuthOptions = {
  secret: env.AUTH_SECRET,
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 30 },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Email & password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) {
          console.log('[AUTH] Invalid credentials format');
          return null;
        }
        const email = parsed.data.email.toLowerCase();
        console.log('[AUTH] Attempting login for:', email);
        const user = await prisma.user.findUnique({
          where: { email },
        });
        if (!user) {
          console.log('[AUTH] User not found:', email);
          return null;
        }
        if (user.deletedAt) {
          console.log('[AUTH] User deleted:', email);
          return null;
        }
        if (!user.passwordHash) {
          console.log('[AUTH] No password hash:', email);
          return null;
        }
        if (user.bannedAt) {
          console.log('[AUTH] User banned:', email);
          return null;
        }
        const ok = await bcrypt.compare(
          parsed.data.password,
          user.passwordHash
        );
        console.log('[AUTH] Password match:', ok, 'for:', email);
        if (!ok) return null;
        const roles = await loadRoles(user.id);
        if (roles.length === 0) roles.push("USER");
        console.log('[AUTH] User roles:', roles);
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          roles,
        };
      },
    }),
    ...(env.googleOAuthEnabled
      ? [
          GoogleProvider({
            clientId: env.GOOGLE_CLIENT_ID ?? "",
            clientSecret: env.GOOGLE_CLIENT_SECRET ?? "",
          }),
        ]
      : []),
  ],
  callbacks: {
    async jwt({ token, user, trigger, account }) {
      console.log('[JWT] Called, has user:', !!user, 'trigger:', trigger);
      // On initial sign-in, populate the token from the user object.
      if (user) {
        token.id = (user as { id: string }).id;
        // Always reload roles from DB to ensure they're fresh.
        try {
          token.roles = await loadRoles((user as { id: string }).id);
        } catch {
          token.roles = (user as { roles?: Role[] }).roles ?? [];
        }
        console.log('[JWT] Token populated with id:', token.id, 'roles:', token.roles);
      } else if (token.id) {
        console.log('[JWT] Existing token, roles:', token.roles);
        // Periodically refresh roles so permission changes propagate.
        const last = (token.lastRolesCheck as number) ?? 0;
        if (trigger === "update" || Date.now() - last > 5 * 60 * 1000) {
          try {
            token.roles = await loadRoles(token.id as string);
            token.lastRolesCheck = Date.now();
          } catch {
            // keep existing roles on transient DB errors
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      console.log('[SESSION] Called, token.id:', token.id, 'token.roles:', token.roles);
      console.log('[SESSION] Session before:', JSON.stringify(session));
      if (session.user && token.id) {
        (session.user as { id: string }).id = token.id as string;
        (session.user as { roles: string[] }).roles = (token.roles as string[]) ?? [];
      } else if (token.id) {
        // Ensure session.user exists
        (session as any).user = {
          ...((session as any).user || {}),
          id: token.id as string,
          roles: (token.roles as string[]) ?? [],
        };
      }
      console.log('[SESSION] Session after:', JSON.stringify(session));
      return session;
    },
  },
  events: {
    async signIn({ user, isNewUser }) {
      console.log('[AUTH] Sign-in event, isNewUser:', isNewUser);
      if (isNewUser && user.email) {
        // Ensure a base role exists for OAuth-only users.
        const existing = await prisma.userRole.findFirst({
          where: { userId: user.id as string },
        });
        if (!existing) {
          await prisma.userRole.create({
            data: { userId: user.id as string, role: "USER" },
          });
        }
        // Prove the permission matrix is loaded for this user (cheap warm-up)
        permissionsForRoles(["USER"]);
      }
    },
  },
};
