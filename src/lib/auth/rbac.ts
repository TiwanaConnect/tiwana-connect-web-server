import type { UserRole } from "@prisma/client";

export function isSuperAdmin(role: UserRole) {
  return role === "SUPER_ADMIN";
}

export function isPresident(role: UserRole) {
  return role === "PRESIDENT";
}

export function isMember(role: UserRole) {
  return role === "MEMBER";
}

export function canAccessAdmin(role: UserRole) {
  return isSuperAdmin(role) || isPresident(role);
}
