"use client";

import { useState } from "react";
import { DollarSign, Package } from "lucide-react";

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

import { useSellerOrders } from "@/hooks/use-orders";
import { SellerOrder, EOrderStatus } from "@/types/global";
import { formatDate, formatCurrency } from "@/lib/utils";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_OPTIONS: { label: string; value: string }[] = [
  { label: "All Statuses", value: "all" },
  { label: "Pending Payment", value: EOrderStatus.PENDING_PAYMENT },
  { label: "Paid", value: EOrderStatus.PAID },
  { label: "Processing", value: EOrderStatus.PROCESSING },
  { label: "Completed", value: EOrderStatus.COMPLETED },
  { label: "Cancelled", value: EOrderStatus.CANCELLED },
];

function statusBadge(status: EOrderStatus) {
  switch (status) {
    case EOrderStatus.COMPLETED:
      return <Badge className="bg-green-100 text-green-700 border-0 text-xs">Completed</Badge>;
    case EOrderStatus.PAID:
      return <Badge className="bg-blue-100 text-blue-700 border-0 text-xs">Paid</Badge>;
    case EOrderStatus.PROCESSING:
      return <Badge className="bg-yellow-100 text-yellow-700 border-0 text-xs">Processing</Badge>;
    case EOrderStatus.PENDING_PAYMENT:
      return <Badge className="bg-orange-100 text-orange-700 border-0 text-xs">Pending</Badge>;
    case EOrderStatus.CANCELLED:
      return <Badge className="bg-red-100 text-red-700 border-0 text-xs">Cancelled</Badge>;
    default:
      return <Badge variant="outline" className="text-xs">{status}</Badge>;
  }
}

// ─── Table Skeleton ────────────────────────────────────────────────────────────

function TableSkeleton() {
  return (
    <div className="divide-y rounded-md border">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-5 w-20 rounded-full ml-auto" />
        </div>
      ))}
    </div>
  );
}

// ─── Pagination ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function SalesPage() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

  const queryParams = {
    ...(statusFilter !== "all" ? { status: statusFilter } : {}),
    page,
    pageSize: PAGE_SIZE,
  };

  const { data, isLoading } = useSellerOrders(queryParams);

  const orders = data?.results ?? [];
  const totalCount = data?.count ?? 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  // Revenue summary: sum of COMPLETED orders
  const completedRevenue = orders
    .filter((o: SellerOrder) => o.status === EOrderStatus.COMPLETED)
    .reduce((sum: number, o: SellerOrder) => sum + o.totalAmount, 0);

  const currency = orders[0]?.currency ?? "NGN";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Package size={20} className="text-green-600" />
          Sales
        </h2>
        <p className="text-muted-foreground text-sm mt-0.5">
          Track and manage your marketplace orders
        </p>
      </div>

      {/* Revenue Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
        <Card>
          <CardContent className="flex items-center gap-4 pt-5">
            <div className="rounded-full p-2.5 bg-green-600">
              <DollarSign size={18} className="text-white" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Completed Revenue</p>
              <p className="text-lg font-bold tabular-nums">
                {isLoading ? "—" : formatCurrency(completedRevenue, currency)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-5">
            <div className="rounded-full p-2.5 bg-blue-500">
              <Package size={18} className="text-white" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Orders</p>
              <p className="text-lg font-bold tabular-nums">
                {isLoading ? "—" : totalCount}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            if (v) setStatusFilter(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Orders</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading && (
            <div className="p-4">
              <TableSkeleton />
            </div>
          )}

          {!isLoading && orders.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Package className="text-muted-foreground mb-3" size={44} />
              <h3 className="font-semibold mb-1">No orders yet</h3>
              <p className="text-sm text-muted-foreground">
                {statusFilter !== "all"
                  ? "No orders match the selected status"
                  : "Completed orders will appear here"}
              </p>
            </div>
          )}

          {!isLoading && orders.length > 0 && (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Order #</TableHead>
                      <TableHead>Buyer</TableHead>
                      <TableHead className="text-right">Items</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order: SellerOrder) => (
                      <TableRow key={order.id}>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(order.createdAt)}
                        </TableCell>
                        <TableCell className="font-mono text-sm font-medium">
                          #{order.id}
                        </TableCell>
                        <TableCell className="text-sm">
                          {order.buyer ? (
                            <div>
                              <p className="font-medium">{order.buyer.name}</p>
                              <p className="text-xs text-muted-foreground">{order.buyer.phone}</p>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right text-sm tabular-nums">
                          {order.items.length}
                        </TableCell>
                        <TableCell className="text-right text-sm font-medium tabular-nums">
                          {formatCurrency(order.totalAmount, order.currency)}
                        </TableCell>
                        <TableCell className="text-center">
                          {statusBadge(order.status)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t text-sm text-muted-foreground">
                  <span>
                    Page {page} of {totalPages} ({totalCount} orders)
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
