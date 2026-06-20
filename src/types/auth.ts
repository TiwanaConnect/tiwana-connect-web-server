export type AuthRole = "SUPER_ADMIN" | "PRESIDENT" | "MEMBER";

export type AuthUser = {
  id: string;
  memberId: string;
  username: string;
  role: AuthRole;
};
