import { describe, expect, it } from "vitest";
import {
  assertCredentialTargetMatchesCaller,
  resolvePasswordAccountId,
} from "../../convex/lib/credentialOwnership";

describe("SEC-01 credential ownership", () => {
  it("uses owned providerAccountId even when a forged email is supplied", () => {
    expect(
      resolvePasswordAccountId({
        authUserId: "user_A",
        ownedProviderAccountId: "alice@example.com",
        forgedEmail: "bob@example.com",
      }),
    ).toBe("alice@example.com");
  });

  it("rejects missing owned account", () => {
    expect(() =>
      resolvePasswordAccountId({
        authUserId: "user_A",
        ownedProviderAccountId: null,
        forgedEmail: "bob@example.com",
      }),
    ).toThrow("PASSWORD_ACCOUNT_MISSING");
  });

  it("denies cross-account credential targets", () => {
    expect(() => assertCredentialTargetMatchesCaller("user_A", "user_B")).toThrow(
      "FORBIDDEN",
    );
    expect(() => assertCredentialTargetMatchesCaller("user_A", "user_A")).not.toThrow();
  });
});
