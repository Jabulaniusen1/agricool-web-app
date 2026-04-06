"use client";

import { useState } from "react";
import { Package, ChevronLeft, ChevronRight, Eye } from "lucide-react";

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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useApiCall } from "@/hooks/use-api";
import { marketplaceService } from "@/services/marketplace-service";
import { SellerOrder, EOrderStatus, OrderItem } from "@/types/global";
import { formatDate, formatCurrency, cn } from "@/lib/utils";

const PAGE_SIZE = 10;

const STATUS_OPTIONS = [
  { value: "all", label: "All Orders" },
  { value: EOrderStatus.PENDING_PAYMENT, label: "Pending Payment" },
  { value: EOrderStatus.PAID, label: "Paid" },
  { value: EOrderStatus.PROCESSING, label: "Processing" },
  { value: EOrderStatus.COMPLETED, label: "Completed" },
  { value: EOrderStatus.CANCELLED, label: "Cancelled" },
];

function statusBadgeClass(status: EOrderStatus): string {
  switch (status) {
    case EOrderStatus.PENDING_PAYMENT: return "bg-yellow-100 text-yellow-700 border-yellow-200";
    case EOrderStatus.PAID: return "bg-blue-100 text-blue-700 border-blue-200";
    case EOrderStatus.PROCESSING: return "bg-purple-100 text-purple-700 border-purple-200";
    case EOrderStatus.COMPLETED: return "bg-green-100 text-green-700 border-green-200";
    case EOrderStatus.CANCELLED: return "bg-red-100 text-red-700 border-red-200";
    default: return "bg-gray-100 text-gray-700 border-gray-200";
  }
}

function statusLabel(status: EOrderStatus): string {
  return STATUS_OPTIONS.find((o) => o.value === status)?.label ?? status;
}

function OrderDetailDialog({ order, onClose }: { order: SellerOrder | null; onClose: () => void }) {
  if (!order) return null;
  const currency = order.currency ?? "NGN";
  return (
    <Dialog open={!!order} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Order #{order.id}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Badge className={cn("border", statusBadgeClass(order.status))}>
              {statusLabel(order.status)}
            </Badge>
            <span className="text-sm text-gray-500">{formatDate(order.createdAt)}</span>
            {order.buyer && (
              <span className="text-sm text-gray-500 ml-auto">
                Buyer: <strong>{order.buyer.name}</strong> · {order.buyer.phone}
              </span>
            )}
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead className="text-right">Weight</TableHead>
                <TableHead className="text-right">Price</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items.map((item: OrderItem) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded bg-green-100 flex items-center justify-center overflow-hidden shrink-0">
                        {item.crate.cropImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.crate.cropImage} alt={item.crate.name} className="w-full h-full object-cover" />
                        ) : (
                          <Package size={14} className="text-green-600" />
                        )}
                      </div>
                      <span className="text-sm font-medium">{item.crate.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-sm">{item.weight.toFixed(1)} kg</TableCell>
                  <TableCell className="text-right text-sm font-medium">{formatCurrency(item.price, currency)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex justify-end border-t pt-3">
            <div className="text-right">
              <p className="text-sm text-gray-500">Total</p>
              <p className="text-lg font-bold text-green-600">{formatCurrency(order.totalAmount, currency)}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function CompanyOrdersPage() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<SellerOrder | null>(null);

  const { data: ordersData, isLoading } = useApiCall(
    `company-orders-${statusFilter}-${page}`,
    () => marketplaceService.getCompanyOrders({
      status: statusFilter !== "all" ? statusFilter : undefined,
    })
  );

  const orders = ordersData?.results ?? [];
  const total = ordersData?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">Company Orders</h2>
          <p className="text-sm text-gray-500">{total} order{total !== 1 ? "s" : ""} total</p>
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v ?? "all"); setPage(1); }}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading && (
        <Card>
          <CardHeader><Skeleton className="h-5 w-24" /></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[1,2,3,4,5].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-5 w-20 rounded-full ml-auto" />
                  <Skeleton className="h-8 w-16" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {!isLoading && orders.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Package className="text-gray-300 mb-3" size={44} />
            <h3 className="font-semibold mb-1">No orders found</h3>
            <p className="text-sm text-gray-500">
              {statusFilter !== "all" ? "No orders with this status" : "No company orders yet"}
            </p>
          </CardContent>
        </Card>
      )}

      {!isLoading && orders.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Orders</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Order #</TableHead>
                    <TableHead>Buyer</TableHead>
                    <TableHead className="text-center">Items</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order: SellerOrder) => (
                    <TableRow key={order.id}>
                      <TableCell className="text-sm whitespace-nowrap">{formatDate(order.createdAt)}</TableCell>
                      <TableCell className="text-sm font-mono">#{order.id}</TableCell>
                      <TableCell className="text-sm">{order.buyer?.name ?? "—"}</TableCell>
                      <TableCell className="text-center text-sm">{order.items.length}</TableCell>
                      <TableCell className="text-right text-sm font-medium">
                        {formatCurrency(order.totalAmount, order.currency ?? "NGN")}
                      </TableCell>
                      <TableCell>
                        <Badge className={cn("border text-xs whitespace-nowrap", statusBadgeClass(order.status))}>
                          {statusLabel(order.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="h-8 gap-1.5" onClick={() => setSelectedOrder(order)}>
                          <Eye size={14} />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                    <ChevronLeft size={16} />Prev
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                    Next<ChevronRight size={16} />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <OrderDetailDialog order={selectedOrder} onClose={() => setSelectedOrder(null)} />
    </div>
  );
}
