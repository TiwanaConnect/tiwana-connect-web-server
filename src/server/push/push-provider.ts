export type PushPayload = {
  title: string;
  body?: string | null;
  data?: Record<string, unknown>;
  sound?: "default";
  priority?: "default" | "normal" | "high";
};

export type PushSendResult = {
  token: string;
  success: boolean;
  ticketId?: string;
  error?: string;
  deviceNotRegistered?: boolean;
};

export interface PushProviderClient {
  send(tokens: string[], payload: PushPayload): Promise<PushSendResult[]>;
}
