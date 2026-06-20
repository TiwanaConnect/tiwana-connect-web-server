import bcrypt from "bcryptjs";
import { randomInt } from "crypto";

const TEMP_PASSWORD_CHARS =
  "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@$%";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateTemporaryPassword(): string {
  const suffix = Array.from({ length: 5 }, () => randomInt(0, 10)).join("");

  return `TC-${suffix}`;
}
