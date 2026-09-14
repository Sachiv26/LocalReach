import { describe, it, expect } from "vitest";
import { hasPermission, permissionsForRoles } from "@/lib/permissions";

describe("permissionsForRoles", () => {
  it("SUPER_ADMIN has every permission", () => {
    const perms = permissionsForRoles(["SUPER_ADMIN"]);
    expect(perms.has("PLATFORM_ADMIN")).toBe(true);
    expect(perms.has("MANAGE_COMMUNITY")).toBe(true);
    expect(perms.has("CREATE_AD")).toBe(true);
  });

  it("USER has basic permissions only", () => {
    const perms = permissionsForRoles(["USER"]);
    expect(perms.has("CREATE_AD")).toBe(true);
    expect(perms.has("VIEW_COMMUNITY")).toBe(true);
    expect(perms.has("PLATFORM_ADMIN")).toBe(false);
    expect(perms.has("MANAGE_COMMUNITY")).toBe(false);
  });

  it("ADVERTISER can boost ads", () => {
    const perms = permissionsForRoles(["ADVERTISER"]);
    expect(perms.has("BOOST_AD")).toBe(true);
    expect(perms.has("CREATE_AD")).toBe(true);
    expect(perms.has("MODERATE_ADS")).toBe(false);
  });

  it("COMMUNITY_ADMIN has moderation rights", () => {
    const perms = permissionsForRoles(["COMMUNITY_ADMIN"]);
    expect(perms.has("MODERATE_ADS")).toBe(true);
    expect(perms.has("APPROVE_AD")).toBe(true);
    expect(perms.has("MANAGE_COMMUNITY")).toBe(true);
    expect(perms.has("PLATFORM_ADMIN")).toBe(false);
  });

  it("BUSINESS_OWNER can manage business profile", () => {
    const perms = permissionsForRoles(["BUSINESS_OWNER"]);
    expect(perms.has("CREATE_BUSINESS_PROFILE")).toBe(true);
    expect(perms.has("EDIT_BUSINESS_PROFILE")).toBe(true);
    expect(perms.has("MODERATE_ADS")).toBe(false);
  });

  it("combines permissions across multiple roles", () => {
    const perms = permissionsForRoles(["USER", "BUSINESS_OWNER"]);
    expect(perms.has("CREATE_AD")).toBe(true);
    expect(perms.has("CREATE_BUSINESS_PROFILE")).toBe(true);
  });
});

describe("hasPermission", () => {
  it("returns true when the role has the permission", () => {
    expect(hasPermission(["COMMUNITY_ADMIN"], "APPROVE_AD")).toBe(true);
  });
  it("returns false when it does not", () => {
    expect(hasPermission(["USER"], "APPROVE_AD")).toBe(false);
  });
});
