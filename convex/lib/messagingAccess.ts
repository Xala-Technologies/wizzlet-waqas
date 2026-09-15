/**
 * Direct-message eligibility (J4).
 * Both sides require creator.messagingEnabled and an active subscription.
 */

export type MessagingSendDenial = "MESSAGING_DISABLED" | "FORBIDDEN" | "EMPTY_BODY";

export function canSendDirectMessage(input: {
  messagingEnabled: boolean;
  senderRole: "creator" | "subscriber";
  callerIsCreatorOwner: boolean;
  callerIsNamedSubscriber: boolean;
  subscriberHasActiveSub: boolean;
  body: string;
}): { ok: true } | { ok: false; reason: MessagingSendDenial } {
  if (!input.body.trim()) {
    return { ok: false, reason: "EMPTY_BODY" };
  }
  if (!input.messagingEnabled) {
    return { ok: false, reason: "MESSAGING_DISABLED" };
  }
  if (input.senderRole === "subscriber") {
    if (!input.callerIsNamedSubscriber) {
      return { ok: false, reason: "FORBIDDEN" };
    }
    if (!input.subscriberHasActiveSub) {
      return { ok: false, reason: "FORBIDDEN" };
    }
    return { ok: true };
  }
  if (!input.callerIsCreatorOwner) {
    return { ok: false, reason: "FORBIDDEN" };
  }
  if (!input.subscriberHasActiveSub) {
    return { ok: false, reason: "FORBIDDEN" };
  }
  return { ok: true };
}
