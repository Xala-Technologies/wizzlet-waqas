/**
 * Direct-message eligibility (J4).
 * Both sides require creator.messagingEnabled and an active subscription.
 */

export type MessagingSendDenial = "MESSAGING_DISABLED" | "FORBIDDEN" | "EMPTY_BODY";

export type MessagingComposeGateInput = {
  messagingEnabled: boolean;
  senderRole: "creator" | "subscriber";
  callerIsCreatorOwner: boolean;
  callerIsNamedSubscriber: boolean;
  subscriberHasActiveSub: boolean;
};

export function canSendDirectMessage(
  input: MessagingComposeGateInput & { body: string },
): { ok: true } | { ok: false; reason: MessagingSendDenial } {
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

/** UI gate: same rules as send, ignoring empty body (composer visibility). */
export function messagingComposeBlockReason(
  input: MessagingComposeGateInput,
): Exclude<MessagingSendDenial, "EMPTY_BODY"> | null {
  const decision = canSendDirectMessage({ ...input, body: "." });
  // Project has strictNullChecks off — use `in` for the denial discriminant.
  if ("reason" in decision) {
    if (decision.reason === "EMPTY_BODY") return null;
    return decision.reason;
  }
  return null;
}

export function messagingComposeBlockMessage(
  reason: Exclude<MessagingSendDenial, "EMPTY_BODY">,
  audience: "creator" | "subscriber",
): string {
  if (reason === "MESSAGING_DISABLED") {
    return audience === "creator"
      ? "Subscriber messaging is off. Turn it on above to reply."
      : "This creator has turned off messaging. You can still read past messages.";
  }
  return audience === "creator"
    ? "Messaging requires an active subscription. This member can still read history."
    : "Messaging requires an active subscription. You can still read past messages.";
}
