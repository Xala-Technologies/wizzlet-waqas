import { describe, expect, it } from "vitest";
import {
  canSendDirectMessage,
  messagingComposeBlockMessage,
  messagingComposeBlockReason,
} from "../../convex/lib/messagingAccess";

const base = {
  messagingEnabled: true,
  callerIsCreatorOwner: false,
  callerIsNamedSubscriber: true,
  subscriberHasActiveSub: true,
  body: "hello",
};

describe("canSendDirectMessage (J4)", () => {
  it("allows active subscriber to message when messaging enabled", () => {
    expect(
      canSendDirectMessage({
        ...base,
        senderRole: "subscriber",
      }),
    ).toEqual({ ok: true });
  });

  it("allows creator to message an active subscriber when messaging enabled", () => {
    expect(
      canSendDirectMessage({
        ...base,
        senderRole: "creator",
        callerIsCreatorOwner: true,
        callerIsNamedSubscriber: false,
      }),
    ).toEqual({ ok: true });
  });

  it("denies when messaging is disabled", () => {
    expect(
      canSendDirectMessage({
        ...base,
        messagingEnabled: false,
        senderRole: "subscriber",
      }),
    ).toEqual({ ok: false, reason: "MESSAGING_DISABLED" });
    expect(
      canSendDirectMessage({
        ...base,
        messagingEnabled: false,
        senderRole: "creator",
        callerIsCreatorOwner: true,
        callerIsNamedSubscriber: false,
      }),
    ).toEqual({ ok: false, reason: "MESSAGING_DISABLED" });
  });

  it("denies cancelled / inactive subscription for subscriber and creator", () => {
    expect(
      canSendDirectMessage({
        ...base,
        senderRole: "subscriber",
        subscriberHasActiveSub: false,
      }),
    ).toEqual({ ok: false, reason: "FORBIDDEN" });
    expect(
      canSendDirectMessage({
        ...base,
        senderRole: "creator",
        callerIsCreatorOwner: true,
        callerIsNamedSubscriber: false,
        subscriberHasActiveSub: false,
      }),
    ).toEqual({ ok: false, reason: "FORBIDDEN" });
  });

  it("denies role spoofing", () => {
    expect(
      canSendDirectMessage({
        ...base,
        senderRole: "subscriber",
        callerIsNamedSubscriber: false,
      }),
    ).toEqual({ ok: false, reason: "FORBIDDEN" });
    expect(
      canSendDirectMessage({
        ...base,
        senderRole: "creator",
        callerIsCreatorOwner: false,
      }),
    ).toEqual({ ok: false, reason: "FORBIDDEN" });
  });

  it("denies empty body", () => {
    expect(
      canSendDirectMessage({
        ...base,
        senderRole: "subscriber",
        body: "   ",
      }),
    ).toEqual({ ok: false, reason: "EMPTY_BODY" });
  });

  it("compose block reason ignores empty body and maps copy", () => {
    expect(
      messagingComposeBlockReason({
        messagingEnabled: true,
        senderRole: "subscriber",
        callerIsCreatorOwner: false,
        callerIsNamedSubscriber: true,
        subscriberHasActiveSub: true,
      }),
    ).toBeNull();
    expect(
      messagingComposeBlockReason({
        messagingEnabled: false,
        senderRole: "subscriber",
        callerIsCreatorOwner: false,
        callerIsNamedSubscriber: true,
        subscriberHasActiveSub: true,
      }),
    ).toBe("MESSAGING_DISABLED");
    expect(
      messagingComposeBlockReason({
        messagingEnabled: true,
        senderRole: "creator",
        callerIsCreatorOwner: true,
        callerIsNamedSubscriber: false,
        subscriberHasActiveSub: false,
      }),
    ).toBe("FORBIDDEN");
    expect(messagingComposeBlockMessage("MESSAGING_DISABLED", "subscriber")).toMatch(
      /turned off messaging/i,
    );
    expect(messagingComposeBlockMessage("FORBIDDEN", "creator")).toMatch(
      /active subscription/i,
    );
  });
});