import { Expo } from "expo-server-sdk";

import type { PushPayload, PushProviderClient, PushSendResult } from "./push-provider";

export class ExpoPushProvider implements PushProviderClient {
  private readonly expo = new Expo(
    process.env.EXPO_ACCESS_TOKEN ? { accessToken: process.env.EXPO_ACCESS_TOKEN } : undefined
  );

  async send(tokens: string[], payload: PushPayload): Promise<PushSendResult[]> {
    const uniqueTokens = [...new Set(tokens)];
    const invalid = uniqueTokens
      .filter((token) => !Expo.isExpoPushToken(token))
      .map((token) => ({ token, success: false, error: "Invalid Expo push token.", deviceNotRegistered: true }));
    const validTokens = uniqueTokens.filter((token) => Expo.isExpoPushToken(token));
    const messages = validTokens.map((token) => ({
      to: token,
      sound: payload.sound ?? "default",
      title: payload.title,
      body: payload.body ?? undefined,
      data: payload.data,
      priority: payload.priority === "high" ? "high" as const : "default" as const
    }));
    const results: PushSendResult[] = [...invalid];

    for (const chunk of this.expo.chunkPushNotifications(messages)) {
      try {
        const tickets = await this.expo.sendPushNotificationsAsync(chunk);
        tickets.forEach((ticket, index) => {
          const token = chunk[index]?.to as string;
          if (ticket.status === "ok") {
            results.push({ token, success: true, ticketId: ticket.id });
          } else {
            results.push({
              token,
              success: false,
              error: ticket.message,
              deviceNotRegistered: ticket.details?.error === "DeviceNotRegistered"
            });
          }
        });
      } catch {
        chunk.forEach((message) => {
          results.push({ token: message.to as string, success: false, error: "Expo provider send failed." });
        });
      }
    }

    return results;
  }
}
