import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type SetStateAction,
} from "react";
import type { z } from "zod";
import { readDraft, removeDraft, writeDraft } from "@/lib/formDrafts";

/** Only explicitly allowlisted, non-credential fields belong in this hook. */
export function useDraftForm<T extends object>(
  key: string | null,
  initial: T,
  schema: z.ZodType<T>,
) {
  const load = () => {
    const stored = key ? readDraft(key, schema) : null;
    return {
      key,
      data: stored?.data ?? initial,
      baseline: stored?.baseline ?? initial,
      restored: !!stored,
    };
  };
  const [state, setState] = useState(load);
  const [storageFailed, setStorageFailed] = useState(false);
  const liveState = useRef(state);
  liveState.current = state;
  const current =
    state.key === key
      ? state
      : { key, data: initial, baseline: initial, restored: false };
  const dirty =
    JSON.stringify(current.data) !== JSON.stringify(current.baseline);
  useLayoutEffect(() => {
    if (state.key !== key) {
      const stored = key ? readDraft(key, schema) : null;
      setState({
        key,
        data: stored?.data ?? initial,
        baseline: stored?.baseline ?? initial,
        restored: !!stored,
      });
      setStorageFailed(false);
    }
  }, [key, state.key, initial, schema]);
  useLayoutEffect(() => {
    if (!key || state.key !== key) return;
    setStorageFailed(
      !(dirty
        ? schema.safeParse(state.data).success &&
          writeDraft(key, state.data, state.baseline)
        : removeDraft(key)),
    );
  }, [key, state, dirty, schema]);
  useEffect(() => {
    if (!dirty || !storageFailed) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, storageFailed]);
  const setters = useRef(
    new Map<keyof T, (value: SetStateAction<T[keyof T]>) => void>(),
  );
  const field = <K extends keyof T>(
    name: K,
  ): ((value: SetStateAction<T[K]>) => void) => {
    if (!setters.current.has(name)) {
      setters.current.set(name, (value) => {
        setState((prev) => {
          const next =
            typeof value === "function"
              ? (value as (v: T[keyof T]) => T[keyof T])(prev.data[name])
              : value;
          return Object.is(next, prev.data[name])
            ? prev
            : { ...prev, data: { ...prev.data, [name]: next } };
        });
      });
    }
    return setters.current.get(name)! as (value: SetStateAction<T[K]>) => void;
  };
  const reset = useCallback(
    (data: T) => {
      if (key) setStorageFailed(!removeDraft(key));
      setState({ key, data, baseline: data, restored: false });
    },
    [key],
  );
  return {
    data: current.data,
    field,
    dirty: !!key && dirty,
    restored: current.restored,
    storageFailed,
    reset,
    saved: (data: T = current.data) => {
      // A request may finish after the user has typed more. Clear only the
      // submitted snapshot; keep edits made while that request was in flight.
      const submitted = current.data;
      const active = liveState.current;
      // The user may have opened another conversation while this request was
      // running. Acknowledge only the submitted key, without changing that UI.
      const prev = active.key === key
        ? active
        : key ? readDraft(key, schema) : null;
      if (!prev) return;
      const remaining = { ...data };
      for (const name of Object.keys(submitted) as (keyof T)[]) {
        if (JSON.stringify(prev.data[name]) !== JSON.stringify(submitted[name]))
          remaining[name] = prev.data[name];
      }
      // onSaved can unmount the form in this same batch. Persist synchronously,
      // rather than relying on an effect that may never run after submission.
      if (key) {
        const persisted = JSON.stringify(remaining) === JSON.stringify(data)
          ? removeDraft(key)
          : writeDraft(key, remaining, data);
        if (active.key === key) setStorageFailed(!persisted);
      }
      if (active.key === key)
        setState({ key, data: remaining, baseline: data, restored: false });
    },
    discard: () => reset(current.baseline),
    canReplace: () =>
      !dirty ||
      window.confirm("Discard your unsaved changes and open another editor?"),
  };
}
