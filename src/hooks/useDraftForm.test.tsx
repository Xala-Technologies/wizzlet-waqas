import { StrictMode } from "react";
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { useDraftForm } from "./useDraftForm";
import {
  draftKey,
  DRAFT_TTL,
  memberProfileDraftSchema,
  readDraft,
  writeDraft,
} from "@/lib/formDrafts";

const initial = { fullName: "Saved member", phone: "123" };
let counter = 0;
const key = () => draftKey(`unit-${++counter}`, "profile");
const schema = memberProfileDraftSchema;
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.useRealTimers();
  sessionStorage.clear();
});

it("recovers after unmount and keeps the original baseline for explicit discard", () => {
  const scope = key();
  const first = renderHook(() => useDraftForm(scope, initial, schema));
  act(() => first.result.current.field("fullName")("Unsubmitted"));
  first.unmount();
  const next = renderHook(() => useDraftForm(scope, initial, schema), {
    wrapper: StrictMode,
  });
  expect(next.result.current.data.fullName).toBe("Unsubmitted");
  expect(next.result.current.restored).toBe(true);
  act(() => next.result.current.discard());
  expect(next.result.current.data).toEqual(initial);
  expect(readDraft(scope, schema)).toBeNull();
  next.unmount();
  expect(
    renderHook(() => useDraftForm(scope, initial, schema)).result.current.dirty,
  ).toBe(false);
});

it("does not save untouched or reverted input", () => {
  const scope = key();
  const { result } = renderHook(() => useDraftForm(scope, initial, schema));
  expect(sessionStorage.getItem(scope)).toBeNull();
  act(() => result.current.field("phone")("999"));
  expect(readDraft(scope, schema)?.data.phone).toBe("999");
  act(() => result.current.field("phone")("123"));
  expect(readDraft(scope, schema)).toBeNull();
});

it("clears only after success and uses normalized saved data as the new baseline", () => {
  const scope = key();
  const { result } = renderHook(() => useDraftForm(scope, initial, schema));
  act(() => result.current.field("fullName")("  Next member "));
  // Failed requests must not call saved(); a rerender still retains the edit.
  expect(readDraft(scope, schema)?.data.fullName).toBe("  Next member ");
  act(() => result.current.saved({ ...initial, fullName: "Next member" }));
  expect(readDraft(scope, schema)).toBeNull();
  act(() => result.current.field("fullName")("Another change"));
  act(() => result.current.discard());
  expect(result.current.data.fullName).toBe("Next member");
});

it("isolates accounts across logout, delayed hydration, and signing in again", () => {
  const a = key();
  const b = key();
  const { result, rerender } = renderHook(
    ({ scope, loaded }) => useDraftForm(scope, loaded, schema),
    { initialProps: { scope: a as string | null, loaded: initial } },
  );
  act(() => result.current.field("fullName")("Private draft A"));
  rerender({ scope: null, loaded: { fullName: "", phone: "" } });
  expect(result.current.data.fullName).toBe("");
  rerender({ scope: b, loaded: { fullName: "Member B", phone: "" } });
  expect(result.current.data.fullName).toBe("Member B");
  expect(result.current.dirty).toBe(false);
  rerender({ scope: a, loaded: initial });
  expect(result.current.data.fullName).toBe("Private draft A");
});

it("query refresh does not overwrite active edits or create a false draft", () => {
  const scope = key();
  const { result, rerender } = renderHook(
    ({ loaded }) => useDraftForm(scope, loaded, schema),
    { initialProps: { loaded: initial } },
  );
  act(() => result.current.field("phone")("456"));
  rerender({ loaded: { ...initial, phone: "server refresh" } });
  expect(result.current.data.phone).toBe("456");
});

it("resetting for an existing record establishes a clean baseline", () => {
  const scope = key();
  const { result } = renderHook(() => useDraftForm(scope, initial, schema));
  act(() => result.current.reset({ fullName: "Existing record", phone: "55" }));
  expect(result.current.dirty).toBe(false);
  expect(readDraft(scope, schema)).toBeNull();
});

it("recovers from sessionStorage after a fresh module load, including original baseline", async () => {
  const scope = key();
  sessionStorage.setItem(
    scope,
    JSON.stringify({
      version: 1,
      updatedAt: Date.now(),
      data: { ...initial, phone: "987" },
      baseline: initial,
    }),
  );
  const { result } = renderHook(() => useDraftForm(scope, initial, schema));
  expect(result.current.data.phone).toBe("987");
  act(() => result.current.discard());
  expect(result.current.data).toEqual(initial);
});

it.each([
  "invalid json",
  JSON.stringify({ version: 99 }),
  JSON.stringify({
    version: 1,
    updatedAt: Date.now(),
    data: { fullName: 3 },
    baseline: initial,
  }),
])("ignores malformed or incompatible stored data: %s", (raw) => {
  const scope = key();
  sessionStorage.setItem(scope, raw);
  expect(
    renderHook(() => useDraftForm(scope, initial, schema)).result.current.data,
  ).toEqual(initial);
});

it("expires drafts after 24 hours", () => {
  vi.useFakeTimers();
  const scope = key();
  writeDraft(scope, { ...initial, phone: "old" }, initial);
  vi.advanceTimersByTime(DRAFT_TTL + 1);
  expect(readDraft(scope, schema)).toBeNull();
});

it("warns before reload when storage fails and preserves SPA navigation in memory", () => {
  const scope = key();
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("Quota exceeded");
  });
  const first = renderHook(() => useDraftForm(scope, initial, schema));
  act(() => first.result.current.field("phone")("Not on disk"));
  expect(first.result.current.storageFailed).toBe(true);
  const event = new Event("beforeunload", { cancelable: true });
  window.dispatchEvent(event);
  expect(event.defaultPrevented).toBe(true);
  first.unmount();
  const afterNavigation = new Event("beforeunload", { cancelable: true });
  window.dispatchEvent(afterNavigation);
  expect(afterNavigation.defaultPrevented).toBe(true);
  const next = renderHook(() => useDraftForm(scope, initial, schema));
  expect(next.result.current.data.phone).toBe("Not on disk");
  act(() => next.result.current.discard());
  const clean = new Event("beforeunload", { cancelable: true });
  window.dispatchEvent(clean);
  expect(clean.defaultPrevented).toBe(false);
});

it("requires a deliberate decision before replacing a dirty editor", () => {
  const scope = key();
  const { result } = renderHook(() => useDraftForm(scope, initial, schema));
  expect(result.current.canReplace()).toBe(true);
  act(() => result.current.field("phone")("Changed"));
  const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
  expect(result.current.canReplace()).toBe(false);
  expect(result.current.data.phone).toBe("Changed");
  confirm.mockReturnValue(true);
  expect(result.current.canReplace()).toBe(true);
});

it("a late save response does not discard edits typed while the request was running", () => {
  const scope = key();
  const { result } = renderHook(() => useDraftForm(scope, initial, schema));
  act(() => result.current.field("fullName")("Submitted name"));
  const finishRequest = result.current.saved;
  act(() => result.current.field("phone")("Typed after submit"));
  act(() => finishRequest());
  expect(result.current.data).toEqual({
    fullName: "Submitted name",
    phone: "Typed after submit",
  });
  expect(result.current.dirty).toBe(true);
  expect(readDraft(scope, schema)?.data.phone).toBe("Typed after submit");
  act(() => result.current.discard());
  expect(result.current.data).toEqual({
    fullName: "Submitted name",
    phone: "123",
  });
});

it("clears storage synchronously when success unmounts the editor in the same batch", () => {
  const scope = key();
  const view = renderHook(() => useDraftForm(scope, initial, schema));
  act(() => view.result.current.field("phone")("Submitted phone"));
  act(() => {
    view.result.current.saved();
    view.unmount();
  });
  expect(readDraft(scope, schema)).toBeNull();
});
