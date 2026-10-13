import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Props = {
  dirty: boolean;
  kind?: "form" | "message";
  restored?: boolean;
  storageFailed?: boolean;
  disabled?: boolean;
  onDiscard: () => void;
  onResume?: () => void;
};
export function DraftNotice({
  dirty,
  kind = "form",
  restored,
  storageFailed,
  disabled,
  onDiscard,
  onResume,
}: Props) {
  const [confirm, setConfirm] = useState(false);
  if (!dirty) return null;
  return (
    <>
      <aside
        aria-label="Unsaved changes"
        className="my-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-muted/40 p-4"
      >
        <div className="min-w-0 text-sm">
          <p className="font-semibold">
            {storageFailed
              ? "Draft recovery is unavailable after a refresh"
              : restored
                ? "Unsaved changes recovered"
                : "Unsaved changes kept in this tab"}
          </p>
          <p className="text-muted-foreground">
            {storageFailed
              ? kind === "message"
                ? "Keep this page open. Send or copy your message before refreshing or closing it."
                : "Keep this page open and save your changes before refreshing or closing it."
              : kind === "message"
                ? "Unsent. Kept in this tab for 24 hours. Send or copy it before closing the tab."
                : "Not submitted. You can return in this tab for 24 hours. Save before closing the tab."}
          </p>
        </div>
        <div className="flex gap-2">
          {onResume && (
            <Button
              type="button"
              variant="outline"
              disabled={disabled}
              onClick={onResume}
            >
              Resume draft
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            onClick={() => setConfirm(true)}
          >
            Discard draft
          </Button>
        </div>
      </aside>
      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard unsaved changes?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the draft from this tab. Your previously saved
              content stays unchanged.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction onClick={onDiscard}>
              Discard changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
