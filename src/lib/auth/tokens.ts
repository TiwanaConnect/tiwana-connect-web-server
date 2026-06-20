import type { UserRole } from "@prisma/client";
import { SignJWT, jwtVerify } from "jose";

export const ACCESS_TOKEN_EXPIRES_IN_SECONDS = 60 * 15;
const REFRESH_TOKEN_EXPIRES_IN = "30d";
const ACCESS_TOKEN_EXPIRES_IN = `${ACCESS_TOKEN_EXPIRES_IN_SECONDS}s`;

export type AuthTokenPayload = {
  sub: string;
  memberId: string;
  username: string;
  role: UserRole;
  type: "access" | "refresh";
};

function getSecret(secret: string | undefined, name: string) {
  if (!secret) {
    throw new Error(`${name} is required for auth token signing.`);
  }

  return new TextEncoder().encode(secret);
}

export async function signAccessToken(
  payload: Omit<AuthTokenPayload, "type">,
  secret = process.env.JWT_ACCESS_SECRET
) {
  return new SignJWT({ ...payload, type: "access" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRES_IN)
    .sign(getSecret(secret, "JWT_ACCESS_SECRET"));
}

export async function signRefreshToken(
  payload: Omit<AuthTokenPayload, "type">,
  secret = process.env.JWT_REFRESH_SECRET
) {
  return new SignJWT({ ...payload, type: "refresh" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_EXPIRES_IN)
    .sign(getSecret(secret, "JWT_REFRESH_SECRET"));
}

export async function verifyAccessToken(
  token: string,
  secret = process.env.JWT_ACCESS_SECRET
) {
  const verified = await jwtVerify<AuthTokenPayload>(
    token,
    getSecret(secret, "JWT_ACCESS_SECRET")
  );

  if (verified.payload.type !== "access") {
    throw new Error("Invalid token type.");
  }

  return verified.payload;
}

export async function verifyRefreshToken(
  token: string,
  secret = process.env.JWT_REFRESH_SECRET
) {
  const verified = await jwtVerify<AuthTokenPayload>(
    token,
    getSecret(secret, "JWT_REFRESH_SECRET")
  );

  if (verified.payload.type !== "refresh") {
    throw new Error("Invalid token type.");
  }

  return verified.payload;
}
