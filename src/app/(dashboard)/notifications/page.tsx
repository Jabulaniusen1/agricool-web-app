"use client";

import { useState } from "react";
import { toast } from "sonner";
import { mutate } from "swr";
import {
  Bell,
  AlertTriangle,
  Clock,
  ShoppingBag,
  TrendingUp,
  CheckSquare,
  Check,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import { useNotifications } from "@/hooks/use-notifications";
import { coldtivateService } from "@/services/coldtivate-service";
import { Notification, ENotificationType } from "@/types/global";
import { formatRelativeDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

// ─── Notification Icon ─────────────────────────────────────────────────────────

function NotificationIcon({ type }: { type: ENotificationType }) {
  const classes = "shrink-0";
  switch (type) {
    case ENotificationType.SENSOR_ERROR:
      return <AlertTriangle size={18} className={cn(classes, "text-red-500")} />;
    case ENotificationType.TIME_TO_PICKUP:
      return <Clock size={18} className={cn(classes, "text-orange-500")} />;
    case ENotificationType.ORDER_REQUIRES_MOVEMENT:
      return <ShoppingBag size={18} className={cn(classes, "text-blue-500")} />;
    case ENotificationType.LISTING_PRICE_UPDATED:
      return <TrendingUp size={18} className={cn(classes, "text-purple-500")} />;
    case ENotificationType.MARKET_SURVEY:
    case ENotificationType.FARMER_SURVEY:
      return <CheckSquare size={18} className={cn(classes, "text-teal-500")} />;
    case ENotificationType.CHECKIN_EDITED:
      return <Bell size={18} className={cn(classes, "text-green-600")} />;
    default:
      return <Bell size={18} className={cn(classes, "text-muted-foreground")} />;
  }
}

// ─── Notification Item ─────────────────────────────────────────────────────────

function NotificationItem({
  notification,
  onMarkRead,
}: {
  notification: Notification;
  onMarkRead: (id: number) => void;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-muted/40 transition-colors",
        !notification.isRead && "bg-green-50/60"
      )}
      onClick={() => !notification.isRead && onMarkRead(notification.id)}
    >
      <div className="mt-0.5">
        <NotificationIcon type={notification.type} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm leading-snug", !notification.isRead && "font-medium")}>
          {notification.message}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {formatRelativeDate(notification.createdAt)}
        </p>
      </div>
      {!notification.isRead && (
        <span className="mt-1.5 h-2 w-2 rounded-full bg-green-600 shrink-0" />
      )}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function NotificationSkeleton() {
  return (
    <div className="divide-y">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-start gap-3 px-4 py-3">
          <Skeleton className="h-5 w-5 rounded-full mt-0.5" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-3/4" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const { data: notifications, isLoading, mutate: revalidate } = useNotifications();
  const [markingAll, setMarkingAll] = useState(false);

  const unread = notifications?.filter((n) => !n.isRead) ?? [];
  const read = notifications?.filter((n) => n.isRead) ?? [];

  async function handleMarkRead(id: number) {
    try {
      await coldtivateService.markNotificationRead(id);
      await revalidate();
      mutate("notifications");
    } catch {
      toast.error("Failed to mark notification as read");
    }
  }

  async function handleMarkAllRead() {
    if (!unread.length) return;
    setMarkingAll(true);
    try {
      await Promise.all(unread.map((n) => coldtivateService.markNotificationRead(n.id)));
      await revalidate();
      mutate("notifications");
      toast.success("All notifications marked as read");
    } catch {
      toast.error("Failed to mark all as read");
    } finally {
      setMarkingAll(false);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Bell size={20} className="text-green-600" />
            Notifications
          </h2>
          <p className="text-muted-foreground text-sm mt-0.5">
            Stay updated on important events
          </p>
        </div>
        {unread.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={handleMarkAllRead}
            disabled={markingAll}
          >
            <Check size={14} />
            {markingAll ? "Marking..." : "Mark all read"}
          </Button>
        )}
      </div>

      <Card className="overflow-hidden">
        {isLoading && <NotificationSkeleton />}

        {!isLoading && (!notifications || notifications.length === 0) && (
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Bell className="text-muted-foreground mb-3" size={44} />
            <h3 className="font-semibold mb-1">No notifications</h3>
            <p className="text-sm text-muted-foreground">
              You&apos;re all caught up! Notifications will appear here.
            </p>
          </CardContent>
        )}

        {!isLoading && notifications && notifications.length > 0 && (
          <div className="divide-y">
            {/* Unread */}
            {unread.length > 0 && (
              <>
                <div className="flex items-center gap-2 px-4 py-2 bg-muted/30">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Unread
                  </span>
                  <Badge className="bg-green-600 text-white border-0 text-xs px-1.5 py-0 h-4">
                    {unread.length}
                  </Badge>
                </div>
                {unread.map((n: Notification) => (
                  <NotificationItem key={n.id} notification={n} onMarkRead={handleMarkRead} />
                ))}
              </>
            )}

            {/* Read */}
            {read.length > 0 && (
              <>
                <div className="px-4 py-2 bg-muted/30">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Earlier
                  </span>
                </div>
                {read.map((n: Notification) => (
                  <NotificationItem key={n.id} notification={n} onMarkRead={handleMarkRead} />
                ))}
              </>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
