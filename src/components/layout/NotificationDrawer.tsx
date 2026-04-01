"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, AlertTriangle, Clock, ShoppingBag, TrendingUp, CheckSquare, Info } from "lucide-react";
import { useNotifications } from "@/hooks/use-notifications";
import { coldtivateService } from "@/services/coldtivate-service";
import { ENotificationType, Notification } from "@/types/global";
import { formatRelativeDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { mutate } from "swr";

const iconMap: Record<ENotificationType, React.ElementType> = {
  [ENotificationType.SENSOR_ERROR]: AlertTriangle,
  [ENotificationType.TIME_TO_PICKUP]: Clock,
  [ENotificationType.MARKET_SURVEY]: TrendingUp,
  [ENotificationType.FARMER_SURVEY]: TrendingUp,
  [ENotificationType.CHECKIN_EDITED]: CheckSquare,
  [ENotificationType.ORDER_REQUIRES_MOVEMENT]: ShoppingBag,
  [ENotificationType.LISTING_PRICE_UPDATED]: TrendingUp,
};

const colorMap: Record<ENotificationType, string> = {
  [ENotificationType.SENSOR_ERROR]: "text-red-500 bg-red-50",
  [ENotificationType.TIME_TO_PICKUP]: "text-orange-500 bg-orange-50",
  [ENotificationType.MARKET_SURVEY]: "text-blue-500 bg-blue-50",
  [ENotificationType.FARMER_SURVEY]: "text-blue-500 bg-blue-50",
  [ENotificationType.CHECKIN_EDITED]: "text-green-500 bg-green-50",
  [ENotificationType.ORDER_REQUIRES_MOVEMENT]: "text-purple-500 bg-purple-50",
  [ENotificationType.LISTING_PRICE_UPDATED]: "text-cyan-500 bg-cyan-50",
};

function NotificationItem({ notification }: { notification: Notification }) {
  const Icon = iconMap[notification.type] ?? Info;
  const colorClass = colorMap[notification.type] ?? "text-gray-500 bg-gray-50";

  const handleClick = async () => {
    if (!notification.isRead) {
      await coldtivateService.markNotificationRead(notification.id);
      mutate("notifications");
    }
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        "w-full flex items-start gap-3 p-3 rounded-lg text-left hover:bg-accent transition-colors",
        !notification.isRead && "bg-green-50/50 dark:bg-green-900/10"
      )}
    >
      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5", colorClass)}>
        <Icon size={14} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm", !notification.isRead && "font-medium")}>
          {notification.message}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {formatRelativeDate(notification.createdAt)}
        </p>
      </div>
      {!notification.isRead && (
        <div className="w-2 h-2 rounded-full bg-green-500 mt-2 shrink-0" />
      )}
    </button>
  );
}

export function NotificationDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { data: notifications, isLoading } = useNotifications();
  const unread = notifications?.filter((n) => !n.isRead) ?? [];

  const handleMarkAllRead = async () => {
    if (!unread.length) return;
    await Promise.allSettled(
      unread.map((n) => coldtivateService.markNotificationRead(n.id))
    );
    mutate("notifications");
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:w-96 p-0 flex flex-col">
        <SheetHeader className="p-4 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <Bell size={18} />
              Notifications
              {unread.length > 0 && (
                <Badge variant="destructive" className="h-5 text-xs">
                  {unread.length}
                </Badge>
              )}
            </SheetTitle>
            {unread.length > 0 && (
              <Button variant="ghost" size="sm" onClick={handleMarkAllRead} className="text-xs">
                Mark all read
              </Button>
            )}
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="p-3 space-y-1">
            {isLoading &&
              [1, 2, 3].map((i) => (
                <div key={i} className="flex items-start gap-3 p-3">
                  <Skeleton className="w-8 h-8 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}

            {!isLoading && !notifications?.length && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Bell className="text-muted-foreground mb-3" size={32} />
                <p className="text-sm text-muted-foreground">No notifications yet</p>
              </div>
            )}

            {notifications?.map((notification) => (
              <NotificationItem key={notification.id} notification={notification} />
            ))}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
