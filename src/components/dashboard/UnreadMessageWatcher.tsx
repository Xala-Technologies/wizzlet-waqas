import { useEffect, useRef } from 'react';
import { useQuery } from 'convex/react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@convex/_generated/api';

function canUseBrowserNotifications() {
  return typeof window !== 'undefined' && 'Notification' in window;
}

async function ensureNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!canUseBrowserNotifications()) return 'unsupported';
  if (Notification.permission === 'granted' || Notification.permission === 'denied') {
    return Notification.permission;
  }
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}

function showBrowserNotification(title: string, body: string) {
  if (!canUseBrowserNotifications() || Notification.permission !== 'granted') return;
  try {
    const n = new Notification(title, {
      body,
      icon: '/placeholder.svg',
      tag: 'prizelet-unread',
    });
    n.onclick = () => {
      window.focus();
      n.close();
    };
  } catch {
    // Ignore environments that block Notification construction.
  }
}

/**
 * Soft in-app alert when notification unread count increases while signed in.
 * Also requests browser notification permission once and fires an OS alert.
 */
export function UnreadMessageWatcher() {
  const { user } = useAuth();
  const unread = useQuery(
    api.notifications.mutations.unreadCount,
    user ? {} : 'skip',
  );
  const prevRef = useRef<number | null>(null);
  const permissionAsked = useRef(false);

  useEffect(() => {
    if (!user || permissionAsked.current) return;
    permissionAsked.current = true;
    void ensureNotificationPermission();
  }, [user]);

  useEffect(() => {
    if (unread === undefined) return;
    const prev = prevRef.current;
    prevRef.current = unread;
    if (prev === null) return;
    if (unread > prev) {
      const delta = unread - prev;
      const title = delta === 1 ? 'New notification' : `${delta} new notifications`;
      const description = 'Open Notifications to review.';
      toast.message(title, { description });
      showBrowserNotification(title, description);
    }
  }, [unread]);

  return null;
}
