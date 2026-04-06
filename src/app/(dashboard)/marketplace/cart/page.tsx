"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ShoppingCart, Trash2, ArrowLeft, Tag, Minus, Plus } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useCart } from "@/hooks/use-cart";
import { useShoppingCartStore } from "@/stores/shopping-cart";
import { marketplaceService } from "@/services/marketplace-service";
import { CartItem, EPickUpMethod } from "@/types/global";
import { formatCurrency } from "@/lib/utils";
import { ROUTES } from "@/constants/routes";

function CartItemRow({
  item,
  onRemove,
  onUpdateQty,
  removing,
  updating,
}: {
  item: CartItem;
  onRemove: (itemId: number) => void;
  onUpdateQty: (itemId: number, qty: number) => void;
  removing: boolean;
  updating: boolean;
}) {
  return (
    <div className="flex items-center gap-4 py-4">
      {/* Crop image */}
      <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center overflow-hidden shrink-0">
        {item.crate.cropImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.crate.cropImage}
            alt={item.crate.name}
            className="w-full h-full object-cover rounded-lg"
          />
        ) : (
          <ShoppingCart className="text-green-600" size={18} />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{item.crate.name}</p>
        <p className="text-xs text-gray-500">
          {item.crate.weight.toFixed(1)} kg ·{" "}
          {item.crate.pricing[0]
            ? `${formatCurrency(item.crate.pricing[0].pricePerUnit, item.crate.pricing[0].currency ?? "NGN")}/unit`
            : "—"}
        </p>
      </div>

      {/* Quantity controls */}
      <div className="flex items-center gap-1 shrink-0">
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={() => onUpdateQty(item.id, Math.max(1, item.quantity - 1))}
          disabled={removing || updating || item.quantity <= 1}
        >
          <Minus size={12} />
        </Button>
        <span className="w-8 text-center text-sm tabular-nums">{item.quantity}</span>
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={() => onUpdateQty(item.id, item.quantity + 1)}
          disabled={removing || updating}
        >
          <Plus size={12} />
        </Button>
      </div>

      {/* Total */}
      <p className="font-semibold text-sm shrink-0 w-20 text-right">
        {formatCurrency(item.amount, "NGN")}
      </p>

      {/* Remove */}
      <Button
        variant="ghost"
        size="icon"
        className="text-red-500 hover:text-red-600 hover:bg-red-50 shrink-0"
        onClick={() => onRemove(item.id)}
        disabled={removing}
      >
        <Trash2 size={16} />
      </Button>
    </div>
  );
}

function CartSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="w-10 h-10 rounded-lg" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-8 w-8 rounded" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      <div>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-24" />
          </CardHeader>
          <CardContent className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
            <Skeleton className="h-10 w-full mt-4" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function CartPage() {
  const { data: cartData, isLoading, mutate } = useCart();
  const { cart, setCart } = useShoppingCartStore();
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [pickupMethods, setPickupMethods] = useState<Record<number, EPickUpMethod>>({});

  const displayCart = cartData ?? cart;

  async function handleRemoveItem(itemId: number) {
    setRemovingId(itemId);
    try {
      await marketplaceService.removeCartItem(itemId);
      await mutate();
      toast.success("Item removed from cart");
    } catch {
      toast.error("Failed to remove item");
    } finally {
      setRemovingId(null);
    }
  }

  async function handleUpdateQty(itemId: number, quantity: number) {
    setUpdatingId(itemId);
    try {
      await marketplaceService.updateCartItem(itemId, { quantity });
      await mutate();
    } catch {
      toast.error("Failed to update quantity");
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleApplyCoupon() {
    if (!couponCode.trim()) return;
    setApplyingCoupon(true);
    try {
      const updated = await marketplaceService.applyCoupon(couponCode.trim());
      setCart(updated);
      await mutate();
      toast.success("Coupon applied successfully");
    } catch {
      toast.error("Invalid or expired coupon code");
    } finally {
      setApplyingCoupon(false);
    }
  }

  async function handlePickupChange(coolingUnitId: number, method: string | null) {
    if (!method) return;
    const updated = { ...pickupMethods, [coolingUnitId]: method as EPickUpMethod };
    setPickupMethods(updated);
    try {
      await marketplaceService.setPickupDetails({
        pickupDetails: Object.entries(updated).map(([id, pickupMethod]) => ({
          coolingUnitId: Number(id),
          pickupMethod: pickupMethod as EPickUpMethod,
        })),
      });
      await mutate();
    } catch {
      toast.error("Failed to update pickup method");
    }
  }

  async function handleCheckout() {
    setCheckingOut(true);
    try {
      const res = await marketplaceService.checkoutWithPaystack();
      window.open(res.authorizationUrl, "_blank");
    } catch {
      toast.error("Checkout failed. Please try again.");
    } finally {
      setCheckingOut(false);
    }
  }

  if (isLoading) return <CartSkeleton />;

  if (!displayCart || displayCart.items.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link
            href={ROUTES.MARKETPLACE}
            className="inline-flex items-center justify-center w-8 h-8 rounded-lg hover:bg-muted transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <h2 className="text-xl font-bold">Shopping Cart</h2>
        </div>

        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <ShoppingCart className="text-muted-foreground mb-3" size={48} />
            <h3 className="font-semibold mb-1">Your cart is empty</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Browse the marketplace to add items
            </p>
            <Link
              href={ROUTES.MARKETPLACE}
              className="inline-flex items-center rounded-lg bg-green-600 hover:bg-green-700 text-white px-4 py-2 text-sm font-medium transition-colors"
            >
              Browse Marketplace
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currency = displayCart.currency ?? "NGN";

  // Group items by coolingUnit for pickup method selection
  const coolingUnitIds = Array.from(
    new Set(displayCart.items.map((i) => i.crate.coolingUnit).filter(Boolean) as number[])
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href={ROUTES.MARKETPLACE}
          className="inline-flex items-center justify-center w-8 h-8 rounded-lg hover:bg-muted transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h2 className="text-xl font-bold">Shopping Cart</h2>
          <p className="text-muted-foreground text-sm">
            {displayCart.items.length} item{displayCart.items.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cart items */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Items</CardTitle>
            </CardHeader>
            <CardContent className="divide-y">
              {displayCart.items.map((item) => (
                <CartItemRow
                  key={item.id}
                  item={item}
                  onRemove={handleRemoveItem}
                  onUpdateQty={handleUpdateQty}
                  removing={removingId === item.id}
                  updating={updatingId === item.id}
                />
              ))}
            </CardContent>
          </Card>

          {/* Pickup methods per cooling unit */}
          {coolingUnitIds.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Pickup / Delivery</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {coolingUnitIds.map((cuId) => (
                  <div key={cuId} className="flex items-center justify-between gap-4">
                    <p className="text-sm text-muted-foreground">Cooling Unit #{cuId}</p>
                    <Select
                      value={
                        pickupMethods[cuId] ??
                        displayCart.pickupDetails?.find((pd) => pd.coolingUnitId === cuId)
                          ?.pickupMethod ??
                        EPickUpMethod.PICKUP
                      }
                      onValueChange={(v) => handlePickupChange(cuId, v)}
                    >
                      <SelectTrigger className="w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={EPickUpMethod.PICKUP}>Pickup</SelectItem>
                        <SelectItem value={EPickUpMethod.DELIVERY}>Delivery</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Coupon */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Tag size={16} />
                Coupon Code
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter coupon code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  onClick={handleApplyCoupon}
                  disabled={applyingCoupon || !couponCode.trim()}
                >
                  {applyingCoupon ? "Applying..." : "Apply"}
                </Button>
              </div>
              {displayCart.couponCode && (
                <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                  <Tag size={12} />
                  Coupon <strong>{displayCart.couponCode}</strong> applied
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Order summary */}
        <div>
          <Card className="sticky top-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Produce subtotal</span>
                <span>{formatCurrency(displayCart.totalProduceAmount, currency)}</span>
              </div>
              {displayCart.totalCoolingFeesAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Cooling fees</span>
                  <span>{formatCurrency(displayCart.totalCoolingFeesAmount, currency)}</span>
                </div>
              )}
              {displayCart.totalColdtivateAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Platform fee</span>
                  <span>{formatCurrency(displayCart.totalColdtivateAmount, currency)}</span>
                </div>
              )}
              {displayCart.totalDiscountAmount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount</span>
                  <span>-{formatCurrency(displayCart.totalDiscountAmount, currency)}</span>
                </div>
              )}
              {displayCart.totalPaymentFeesAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Payment fees</span>
                  <span>{formatCurrency(displayCart.totalPaymentFeesAmount, currency)}</span>
                </div>
              )}

              <Separator />

              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span className="text-green-600">
                  {formatCurrency(displayCart.totalAmount, currency)}
                </span>
              </div>

              <Button
                className="w-full bg-green-600 hover:bg-green-700 mt-2"
                onClick={handleCheckout}
                disabled={checkingOut}
              >
                {checkingOut ? "Processing..." : "Checkout with Paystack"}
              </Button>

              <Link
                href={ROUTES.MARKETPLACE}
                className="flex items-center justify-center w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
              >
                Continue Shopping
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
