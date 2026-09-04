import { useState } from 'react';
import { toast } from 'sonner';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useDemoMemberStore } from '@/components/demo/demoMemberStore';

interface Props {
  creatorId: string;
  /** 'status' shows a "Subscribed" pill-style button, 'plain' a Cancel button. */
  variant?: 'status' | 'plain';
}

/**
 * Cancelling a subscription is destructive (it locks premium content again),
 * so every entry point goes through the same confirmation.
 */
export function CancelSubButton({ creatorId, variant = 'plain' }: Props) {
  const store = useDemoMemberStore();
  const [open, setOpen] = useState(false);
  const creator = store.creatorById(creatorId);
  if (!creator) return null;

  const locked = store.state.posts.filter(p => p.creatorId === creatorId && p.isPremium).length;

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        className="h-7 text-xs"
        onClick={() => setOpen(true)}
      >
        {variant === 'status' ? <><Check className="mr-1 h-3 w-3" /> Subscribed</> : 'Cancel'}
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel {creator.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              You'll stop paying ${creator.price.toFixed(2)}/mo
              {locked > 0 && <> and lose access to {locked} premium post{locked === 1 ? '' : 's'}</>}.
              Your tracked picks stay in My Results.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep subscription</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                store.unsubscribe(creatorId);
                toast.info(`Cancelled ${creator.name}`);
              }}
            >
              Cancel subscription
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default CancelSubButton;
