"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Tag, Plus, Trash2, Copy } from "lucide-react";
import { z } from "zod";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Skeleton } from "@/components/ui/skeleton";

import { marketplaceService } from "@/services/marketplace-service";
import { couponSchema } from "@/constants/schemas";
import { Coupon } from "@/types/global";
import { formatDate } from "@/lib/utils";
import { useApiCall } from "@/hooks/use-api";

type CouponFormValues = z.infer<typeof couponSchema>;

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function TableSkeleton() {
  return (
    <div className="divide-y rounded-md border">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3">
          <Skeleton className="h-4 w-24 font-mono" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-5 w-16 rounded-full ml-auto" />
          <Skeleton className="h-8 w-16" />
        </div>
      ))}
    </div>
  );
}

// ─── Create Coupon Dialog ──────────────────────────────────────────────────────

function CreateCouponDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CouponFormValues>({
    resolver: zodResolver(couponSchema),
    defaultValues: { code: "", discountPercent: undefined, expiresAt: undefined },
  });

  async function onSubmit(values: CouponFormValues) {
    setSaving(true);
    try {
      await marketplaceService.createCoupon({
        code: values.code,
        discountPercent: values.discountPercent,
        discountAmount: values.discountAmount,
        expiresAt: values.expiresAt,
      });
      toast.success("Coupon created successfully");
      onCreated();
      onClose();
      reset();
    } catch {
      toast.error("Failed to create coupon");
    } finally {
      setSaving(false);
    }
  }

  function handleClose() {
    reset();
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Create Coupon</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="space-y-1">
            <Label htmlFor="code">Coupon Code</Label>
            <Input
              id="code"
              placeholder="SAVE20"
              className="uppercase"
              {...register("code")}
            />
            {errors.code && <p className="text-xs text-red-500">{errors.code.message}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="discountPercent">Discount (%)</Label>
            <Input
              id="discountPercent"
              type="number"
              min={0}
              max={100}
              step={1}
              placeholder="e.g. 20"
              {...register("discountPercent", { valueAsNumber: true })}
            />
            {errors.discountPercent && (
              <p className="text-xs text-red-500">{errors.discountPercent.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="expiresAt">Expires At (optional)</Label>
            <Input
              id="expiresAt"
              type="date"
              {...register("expiresAt")}
            />
            {errors.expiresAt && (
              <p className="text-xs text-red-500">{errors.expiresAt.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" className="bg-green-600 hover:bg-green-700" disabled={saving}>
              {saving ? "Creating..." : "Create Coupon"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function CouponsPage() {
  const { data: coupons, isLoading, mutate: revalidate } =
    useApiCall<Coupon[]>("coupons", () => marketplaceService.getCoupons());

  const [createOpen, setCreateOpen] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<Coupon | null>(null);
  const [revoking, setRevoking] = useState(false);

  async function handleRevoke() {
    if (!revokeTarget) return;
    setRevoking(true);
    try {
      await marketplaceService.revokeCoupon(revokeTarget.id);
      await revalidate();
      toast.success(`Coupon "${revokeTarget.code}" revoked`);
      setRevokeTarget(null);
    } catch {
      toast.error("Failed to revoke coupon");
    } finally {
      setRevoking(false);
    }
  }

  async function copyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      toast.success(`"${code}" copied to clipboard`);
    } catch {
      toast.error("Failed to copy code");
    }
  }

  function isExpired(coupon: Coupon): boolean {
    if (!coupon.expiresAt) return false;
    return new Date(coupon.expiresAt) < new Date();
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Tag size={20} className="text-green-600" />
            Coupons
          </h2>
          <p className="text-muted-foreground text-sm mt-0.5">
            Manage discount coupons for marketplace buyers
          </p>
        </div>
        <Button
          className="bg-green-600 hover:bg-green-700 gap-1.5 self-start"
          onClick={() => setCreateOpen(true)}
        >
          <Plus size={16} />
          Create Coupon
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">All Coupons</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading && (
            <div className="p-4">
              <TableSkeleton />
            </div>
          )}

          {!isLoading && (!coupons || coupons.length === 0) && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Tag className="text-muted-foreground mb-3" size={40} />
              <h3 className="font-semibold mb-1">No coupons yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first coupon to offer discounts
              </p>
              <Button
                className="bg-green-600 hover:bg-green-700"
                size="sm"
                onClick={() => setCreateOpen(true)}
              >
                <Plus size={14} className="mr-2" />
                Create Coupon
              </Button>
            </div>
          )}

          {!isLoading && coupons && coupons.length > 0 && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead className="text-right">Discount</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead className="text-right">Uses</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {coupons.map((coupon: Coupon) => {
                    const expired = isExpired(coupon);
                    const active = coupon.isActive && !expired;
                    return (
                      <TableRow key={coupon.id}>
                        <TableCell>
                          <span className="font-mono font-semibold text-sm">{coupon.code}</span>
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          {coupon.discountPercent != null
                            ? `${coupon.discountPercent}%`
                            : coupon.discountAmount != null
                            ? `$${coupon.discountAmount}`
                            : "—"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {coupon.expiresAt ? formatDate(coupon.expiresAt) : "Never"}
                        </TableCell>
                        <TableCell className="text-right text-sm tabular-nums">
                          {coupon.usageCount}
                        </TableCell>
                        <TableCell className="text-center">
                          {active ? (
                            <Badge className="bg-green-100 text-green-700 border-0 text-xs">
                              Active
                            </Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-600 border-0 text-xs">
                              {expired ? "Expired" : "Inactive"}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                              title="Copy code"
                              onClick={() => copyCode(coupon.code)}
                            >
                              <Copy size={14} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                              title="Revoke"
                              onClick={() => setRevokeTarget(coupon)}
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <CreateCouponDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => revalidate()}
      />

      <AlertDialog open={!!revokeTarget} onOpenChange={(v) => !v && setRevokeTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Coupon</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revoke{" "}
              <strong className="font-mono">{revokeTarget?.code}</strong>? It will no longer
              be usable by buyers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={revoking}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={handleRevoke}
              disabled={revoking}
            >
              {revoking ? "Revoking..." : "Revoke"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
