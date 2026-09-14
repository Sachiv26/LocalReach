/**
 * Explicit permission catalogue and role→permission matrix.
 *
 * Permissions are the ONLY thing code should check — never raw role strings.
 * The database mirrors this matrix (Permission + RolePermission tables) for
 * auditing and future runtime-configurable overrides.
 */

export const PERMISSIONS = {
  VIEW_COMMUNITY: "VIEW_COMMUNITY",
  CREATE_AD: "CREATE_AD",
  EDIT_OWN_AD: "EDIT_OWN_AD",
  DELETE_OWN_AD: "DELETE_OWN_AD",
  BOOST_AD: "BOOST_AD",
  VIEW_BUSINESS_DIRECTORY: "VIEW_BUSINESS_DIRECTORY",
  CREATE_BUSINESS_PROFILE: "CREATE_BUSINESS_PROFILE",
  EDIT_BUSINESS_PROFILE: "EDIT_BUSINESS_PROFILE",
  MODERATE_ADS: "MODERATE_ADS",
  APPROVE_AD: "APPROVE_AD",
  REJECT_AD: "REJECT_AD",
  SUSPEND_USER: "SUSPEND_USER",
  MANAGE_COMMUNITY: "MANAGE_COMMUNITY",
  VIEW_COMMUNITY_ANALYTICS: "VIEW_COMMUNITY_ANALYTICS",
  MANAGE_PRICING: "MANAGE_PRICING",
  VIEW_REVENUE: "VIEW_REVENUE",
  MANAGE_ADMINS: "MANAGE_ADMINS",
  MANAGE_RULES: "MANAGE_RULES",
  MANAGE_CATEGORIES: "MANAGE_CATEGORIES",
  MANAGE_PAYMENTS: "MANAGE_PAYMENTS",
  PLATFORM_ADMIN: "PLATFORM_ADMIN",
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const PERMISSION_KEYS = Object.values(PERMISSIONS);

const USER_PERMISSIONS: PermissionKey[] = [
  PERMISSIONS.VIEW_COMMUNITY,
  PERMISSIONS.VIEW_BUSINESS_DIRECTORY,
  PERMISSIONS.CREATE_AD,
];

const ADVERTISER_PERMISSIONS: PermissionKey[] = [
  ...USER_PERMISSIONS,
  PERMISSIONS.CREATE_AD,
  PERMISSIONS.EDIT_OWN_AD,
  PERMISSIONS.DELETE_OWN_AD,
  PERMISSIONS.BOOST_AD,
];

const BUSINESS_OWNER_PERMISSIONS: PermissionKey[] = [
  ...ADVERTISER_PERMISSIONS,
  PERMISSIONS.CREATE_BUSINESS_PROFILE,
  PERMISSIONS.EDIT_BUSINESS_PROFILE,
];

const MODERATOR_PERMISSIONS: PermissionKey[] = [
  ...ADVERTISER_PERMISSIONS,
  PERMISSIONS.MODERATE_ADS,
  PERMISSIONS.APPROVE_AD,
  PERMISSIONS.REJECT_AD,
];

const COMMUNITY_ADMIN_PERMISSIONS: PermissionKey[] = [
  ...MODERATOR_PERMISSIONS,
  PERMISSIONS.SUSPEND_USER,
  PERMISSIONS.MANAGE_COMMUNITY,
  PERMISSIONS.VIEW_COMMUNITY_ANALYTICS,
  PERMISSIONS.MANAGE_PRICING,
  PERMISSIONS.VIEW_REVENUE,
  PERMISSIONS.MANAGE_RULES,
  PERMISSIONS.MANAGE_CATEGORIES,
  PERMISSIONS.MANAGE_ADMINS,
  PERMISSIONS.MANAGE_PAYMENTS,
];

const COMMUNITY_OWNER_PERMISSIONS: PermissionKey[] = [
  ...COMMUNITY_ADMIN_PERMISSIONS,
];

const PLATFORM_MODERATOR_PERMISSIONS: PermissionKey[] = [
  ...USER_PERMISSIONS,
  PERMISSIONS.MODERATE_ADS,
  PERMISSIONS.APPROVE_AD,
  PERMISSIONS.REJECT_AD,
  PERMISSIONS.SUSPEND_USER,
];

export const ROLE_PERMISSIONS: Record<Role, PermissionKey[]> = {
  SUPER_ADMIN: PERMISSION_KEYS,
  PLATFORM_MODERATOR: PLATFORM_MODERATOR_PERMISSIONS,
  COMMUNITY_OWNER: COMMUNITY_OWNER_PERMISSIONS,
  COMMUNITY_ADMIN: COMMUNITY_ADMIN_PERMISSIONS,
  MODERATOR: MODERATOR_PERMISSIONS,
  BUSINESS_OWNER: BUSINESS_OWNER_PERMISSIONS,
  ADVERTISER: ADVERTISER_PERMISSIONS,
  USER: USER_PERMISSIONS,
};

export type Role =
  | "SUPER_ADMIN"
  | "PLATFORM_MODERATOR"
  | "COMMUNITY_OWNER"
  | "COMMUNITY_ADMIN"
  | "MODERATOR"
  | "BUSINESS_OWNER"
  | "ADVERTISER"
  | "USER";

export const ROLES = Object.keys(ROLE_PERMISSIONS) as Role[];

export const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: "Super Admin",
  PLATFORM_MODERATOR: "Platform Moderator",
  COMMUNITY_OWNER: "Community Owner",
  COMMUNITY_ADMIN: "Community Admin",
  MODERATOR: "Moderator",
  BUSINESS_OWNER: "Business Owner",
  ADVERTISER: "Advertiser",
  USER: "Member",
};

/** Roles scoped to a specific community (via CommunityAdmin membership). */
export const COMMUNITY_SCOPED_ROLES: Role[] = [
  "COMMUNITY_OWNER",
  "COMMUNITY_ADMIN",
  "MODERATOR",
];

/** Global permissions each role is inherently allowed (union across role assignments). */
export function permissionsForRoles(roles: Role[]): Set<PermissionKey> {
  const set = new Set<PermissionKey>();
  for (const role of roles) {
    for (const p of ROLE_PERMISSIONS[role] ?? []) set.add(p);
  }
  return set;
}

export function hasPermission(roles: Role[], permission: PermissionKey) {
  return permissionsForRoles(roles).has(permission);
}

export function hasAnyPermission(
  roles: Role[],
  permissions: PermissionKey[]
): boolean {
  const owned = permissionsForRoles(roles);
  return permissions.some((p) => owned.has(p));
}
