import crypto from "crypto";

import { API_ERROR_CODES, AppError } from "@/lib/api/errors";

type VotePayload = {
  electionId: string;
  candidateId: string;
  nonce: string;
  castAt: string;
};

function encryptionKey() {
  const raw = process.env.ELECTION_VOTE_ENCRYPTION_KEY;
  if (!raw) {
    throw new AppError(API_ERROR_CODES.VALIDATION_ERROR, "ELECTION_VOTE_ENCRYPTION_KEY is required to cast or tally votes.", 500);
  }
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) {
    throw new AppError(API_ERROR_CODES.VALIDATION_ERROR, "ELECTION_VOTE_ENCRYPTION_KEY must be a base64 value that decodes to exactly 32 bytes.", 500);
  }
  return key;
}

function hashSecret() {
  const secret = process.env.ELECTION_HASH_SECRET;
  if (!secret) {
    throw new AppError(API_ERROR_CODES.VALIDATION_ERROR, "ELECTION_HASH_SECRET is required to cast or tally votes.", 500);
  }
  return secret;
}

export function encryptVotePayload(payload: VotePayload) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(payload), "utf8"), cipher.final()]);
  return {
    encryptedPayload: encrypted.toString("base64"),
    iv: iv.toString("base64"),
    authTag: cipher.getAuthTag().toString("base64")
  };
}

export function decryptVotePayload(ballot: { encryptedPayload: string; iv: string; authTag: string }) {
  const decipher = crypto.createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(ballot.iv, "base64"));
  decipher.setAuthTag(Buffer.from(ballot.authTag, "base64"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(ballot.encryptedPayload, "base64")),
    decipher.final()
  ]).toString("utf8");
  return JSON.parse(decrypted) as VotePayload;
}

export function hashBallot(input: string) {
  return crypto.createHmac("sha256", hashSecret()).update(input).digest("hex");
}

export function generateReceiptCode() {
  return crypto.randomBytes(9).toString("base64url").toUpperCase();
}

export function randomNonce() {
  return crypto.randomBytes(16).toString("base64url");
}
