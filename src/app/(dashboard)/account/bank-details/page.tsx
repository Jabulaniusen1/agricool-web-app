"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { CreditCard, Plus, CheckCircle2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { marketplaceService } from "@/services/marketplace-service";
import { bankAccountSchema, BankAccountFormValues } from "@/constants/schemas";
import { Bank, PaystackAccount } from "@/types/global";
import { useApiCall } from "@/hooks/use-api";

// ─── Add Bank Account Dialog ───────────────────────────────────────────────────

function AddBankDialog({
  open,
  onClose,
  banks,
  onAdded,
}: {
  open: boolean;
  onClose: () => void;
  banks: Bank[];
  onAdded: () => void;
}) {
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<BankAccountFormValues>({
    resolver: zodResolver(bankAccountSchema),
    defaultValues: { accountType: "1", bankCode: "", accountNumber: "", accountName: "" },
  });

  async function onSubmit(values: BankAccountFormValues) {
    setSaving(true);
    try {
      await marketplaceService.addPaystackAccount({
        accountType: values.accountType,
        bankCode: values.bankCode,
        accountNumber: values.accountNumber,
        accountName: values.accountName,
      });
      toast.success("Bank account added successfully");
      onAdded();
      onClose();
      reset();
    } catch {
      toast.error("Failed to add bank account");
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
          <DialogTitle>Add Bank Account</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="space-y-1">
            <Label>Account Type</Label>
            <Controller
              control={control}
              name="accountType"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select account type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Personal</SelectItem>
                    <SelectItem value="2">Business</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.accountType && (
              <p className="text-xs text-red-500">{errors.accountType.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label>Bank</Label>
            <Controller
              control={control}
              name="bankCode"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select bank" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {banks.map((bank) => (
                      <SelectItem key={bank.code} value={bank.code}>
                        {bank.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.bankCode && (
              <p className="text-xs text-red-500">{errors.bankCode.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="accountNumber">Account Number</Label>
            <Input
              id="accountNumber"
              placeholder="0123456789"
              maxLength={10}
              {...register("accountNumber")}
            />
            {errors.accountNumber && (
              <p className="text-xs text-red-500">{errors.accountNumber.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="accountName">Account Name</Label>
            <Input
              id="accountName"
              placeholder="e.g. John Doe"
              {...register("accountName")}
            />
            {errors.accountName && (
              <p className="text-xs text-red-500">{errors.accountName.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" className="bg-green-600 hover:bg-green-700" disabled={saving}>
              {saving ? "Adding..." : "Add Account"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function TableSkeleton() {
  return (
    <div className="divide-y rounded-md border">
      {[1, 2].map((i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-5 w-16 rounded-full ml-auto" />
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function BankDetailsPage() {
  const [addOpen, setAddOpen] = useState(false);

  const { data: accounts, isLoading: loadingAccounts, mutate: revalidateAccounts } =
    useApiCall<PaystackAccount[]>("paystack-accounts", () => marketplaceService.getPaystackAccounts());

  const { data: banks, isLoading: loadingBanks } =
    useApiCall<Bank[]>("banks", () => marketplaceService.getBanks());

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <CreditCard size={20} className="text-green-600" />
            Bank Details
          </h2>
          <p className="text-muted-foreground text-sm mt-0.5">
            Manage your connected bank accounts
          </p>
        </div>
        <Button
          className="bg-green-600 hover:bg-green-700 gap-1.5 self-start"
          onClick={() => setAddOpen(true)}
          disabled={loadingBanks}
        >
          <Plus size={16} />
          Add Account
        </Button>
      </div>

      {/* Accounts Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Connected Accounts</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loadingAccounts && (
            <div className="p-4">
              <TableSkeleton />
            </div>
          )}

          {!loadingAccounts && (!accounts || accounts.length === 0) && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CreditCard className="text-muted-foreground mb-3" size={40} />
              <h3 className="font-semibold mb-1">No bank accounts yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Add a bank account to receive payments
              </p>
              <Button
                className="bg-green-600 hover:bg-green-700"
                size="sm"
                onClick={() => setAddOpen(true)}
              >
                <Plus size={14} className="mr-2" />
                Add Account
              </Button>
            </div>
          )}

          {!loadingAccounts && accounts && accounts.length > 0 && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bank Name</TableHead>
                    <TableHead>Account Number</TableHead>
                    <TableHead>Account Name</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accounts.map((acc: PaystackAccount) => (
                    <TableRow key={acc.id}>
                      <TableCell className="font-medium text-sm">{acc.bankName}</TableCell>
                      <TableCell className="text-sm font-mono">{acc.accountNumber}</TableCell>
                      <TableCell className="text-sm">{acc.accountName}</TableCell>
                      <TableCell className="text-center">
                        {acc.isDefault ? (
                          <Badge className="bg-green-100 text-green-700 border-0 gap-1 text-xs">
                            <CheckCircle2 size={12} />
                            Default
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            Connected
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AddBankDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        banks={banks ?? []}
        onAdded={() => revalidateAccounts()}
      />
    </div>
  );
}
