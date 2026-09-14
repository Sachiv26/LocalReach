import "server-only";
import { cache } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import prisma from "@/lib/db";
import {
  hasPermission,
  permissionsForRoles,
  type PermissionKey,
  type Role,
} from "@/lib/permissions";
import { AppError } from "@/lib/errors";
import type { CommunityAdminRole } from "@prisma/client";

export type AuthContext = {
  userId: string | null;
  roles: Role[];
  isSuperAdmin: boolean;
  adminMemberships: { communityId: string; role: CommunityAdminRole }[];
};

const COMMUNITY_ROLE_TO_ROLE: Record<CommunityAdminRole, Role> = {
  COMMUNITY_OWNER: "COMMUNITY_OWNER",
  COMMUNITY_ADMIN: "COMMUNITY_ADMIN",
  MODERATOR: "MODERATOR",
};

/**
 * Resolve the effective authorization context for the current request.
 * Roles come from the JWT (refreshed server-side); community admin memberships
 * are always loaded fresh from the database — never trusted from the client.
 */
export const getAuthContext = cache(async (): Promise<AuthContext> => {
  const session = await getServerSession(authOptions);
  const userId = (session?.user?.id as string | undefined) ?? null;
  const roles = (session?.user?.roles as Role[] | undefined) ?? [];

  let adminMemberships: { communityId: string; role: CommunityAdminRole }[] =
    [];
  if (userId && roles.some((r) => r !== "SUPER_ADMIN")) {
    adminMemberships = await prisma.communityAdmin.findMany({
      where: { userId },
      select: { communityId: true, role: true },
    });
  }

  return {
    userId,
    roles,
    isSuperAdmin: userId ? roles.includes("SUPER_ADMIN") : false,
    adminMemberships,
  };
});

/** Throws UNAUTHORIZED unless a user is signed in. */
export async function requireAuth(): Promise<AuthContext> {
  const ctx = await getAuthContext();
  if (!ctx.userId) throw new AppError("UNAUTHORIZED", "Please sign in to continue.");
  return ctx;
}

/**
 * Server-side authorization for a permission.
 * - SUPER_ADMIN passes everything.
 * - Platform-wide permissions are checked against the user's global roles.
 * - Community-scoped permissions are additionally granted via CommunityAdmin membership.
 */
export async function requirePermission(
  permission: PermissionKey,
  communityId?: string
): Promise<AuthContext> {
  const ctx = await requireAuth();
  if (ctx.isSuperAdmin) return ctx;

  const globalRoles = ctx.roles.filter(
    (r) => r !== "SUPER_ADMIN" && !["COMMUNITY_OWNER", "COMMUNITY_ADMIN", "MODERATOR"].includes(r)
  );
  if (globalRoles.length && hasPermission(globalRoles, permission)) return ctx;

  if (communityId) {
    const membership = ctx.adminMemberships.find(
      (m) => m.communityId === communityId
    );
    if (membership) {
      const mapped = COMMUNITY_ROLE_TO_ROLE[membership.role];
      const scoped = permissionsForRoles([mapped]);
      if (scoped.has(permission)) return ctx;
    }
    // Community admins also enjoy base USER/ADVERTISER permissions.
    if (hasPermission(["USER", "ADVERTISER"], permission)) return ctx;
  }

  throw new AppError(
    "FORBIDDEN",
    "You do not have permission to perform this action."
  );
}

/** Soft check variant that returns a boolean instead of throwing. */
export async function checkPermission(
  permission: PermissionKey,
  communityId?: string
): Promise<boolean> {
  try {
    await requirePermission(permission, communityId);
    return true;
  } catch {
    return false;
  }
}

/** Ensures the user holds an admin role for the given community. */
export async function requireCommunityAdmin(
  communityId: string
): Promise<AuthContext & { adminRole: CommunityAdminRole }> {
  const ctx = await requireAuth();
  if (ctx.isSuperAdmin) return { ...ctx, adminRole: "COMMUNITY_ADMIN" };
  const membership = ctx.adminMemberships.find(
    (m) => m.communityId === communityId
  );
  if (!membership) {
    throw new AppError("FORBIDDEN", "You are not an admin of this community.");
  }
  return { ...ctx, adminRole: membership.role };
}

/** Returns communities the current user can administer. */
export async function getAdministeredCommunities() {
  const ctx = await getAuthContext();
  if (!ctx.userId) return [];
  if (ctx.isSuperAdmin) {
    return prisma.community.findMany({
      where: { deletedAt: null },
      orderBy: { name: "asc" },
    });
  }
  const memberships = await prisma.communityAdmin.findMany({
    where: { userId: ctx.userId },
    include: { community: true },
  });
  return memberships
    .map((m) => m.community)
    .filter((c) => c.deletedAt === null);
}

/**
 * Guard used by /admin pages. Requires the user to administer at least one
 * community and — when `permission` is supplied — the given permission inside
 * that community. Returns the first administered community id so pages can
 * scope their queries. Throws FORBIDDEN otherwise.
 */
export async function requireAdminArea(
  permission?: PermissionKey
): Promise<{
  ctx: AuthContext;
  communities: Awaited<ReturnType<typeof getAdministeredCommunities>>;
  communityId: string;
}> {
  const ctx = await requireAuth();
  const communities = await getAdministeredCommunities();
  const communityId = communities[0]?.id;
  if (!communityId) {
    throw new AppError(
      "FORBIDDEN",
      "You are not an administrator of any community."
    );
  }
  if (permission) {
    await requirePermission(permission, communityId);
  }
  return { ctx, communities, communityId };
}

/**
 * Like `requireAdminArea` but returns `null` instead of throwing — use at the
 * top of admin pages to redirect to /403. Works in dev + production.
 */
export async function tryRequireAdminArea(
  permission?: PermissionKey
): Promise<Awaited<ReturnType<typeof requireAdminArea>> | null> {
  try {
    return await requireAdminArea(permission);
  } catch {
    return null;
  }
}

/** True when the current user is a community admin/super admin. */
export async function isCommunityAdmin(communityId: string): Promise<boolean> {
  const ctx = await getAuthContext();
  if (!ctx.userId) return false;
  if (ctx.isSuperAdmin) return true;
  return ctx.adminMemberships.some((m) => m.communityId === communityId);
}
