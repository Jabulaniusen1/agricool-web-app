"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Landmark, Plus, CheckCircle2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogFooter,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { useApiCall } from "@/hooks/use-api";
import { useFarmers } from "@/hooks/use-farmers";
import { marketplaceService } from "@/services/marketplace-service";
import { FarmerBankAccount, Bank } from "@/types/global";

// ─── Schema ────────────────────────────────────────────────────────────────────

const schema = z.object({
  farmerId: z.string().min(1, "Farmer is required"),
  accountType: z.enum(["1", "2"]),
  bankCode: z.string().min(1, "Bank is required"),
  accountNumber: z.string().min(10, "Enter a valid account number"),
  accountName: z.string().min(1, "Account name is required"),
});

type FormValues = z.infer<typeof schema>;

// ─── Add Dialog ────────────────────────────────────────────────────────────────

function AddDialog({
  open,
  onClose,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const { data: farmers } = useFarmers();
  const { data: banks } = useApiCall<Bank[]>("banks", () => marketplaceService.getBanks());

  const { register, handleSubmit, control, reset, formState: { errors } } =
    useForm<FormValues>({
      resolver: zodResolver(schema),
      defaultValues: { farmerId: "", accountType: "1", bankCode: "", accountNumber: "", accountName: "" },
    });

  async function onSubmit(values: FormValues) {
    setSaving(true);
    try {
      await marketplaceService.setupFarmerBankAccount({
        farmerId: Number(values.farmerId),
        accountType: values.accountType,
        bankCode: values.bankCode,
        accountNumber: values.accountNumber,
        accountName: values.accountName,
      });
      toast.success("Bank account added");
      onSaved();
      onClose();
      reset();
    } catch {
      toast.error("Failed to add bank account");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && (reset(), onClose())}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Farmer Bank Account</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-1">
          <div className="space-y-1">
            <Label>Farmer *</Label>
            <Controller
              control={control}
              name="farmerId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue placeholder="Select farmer" /></SelectTrigger>
                  <SelectContent className="max-h-56">
                    {(farmers ?? []).map((f) => (
                      <SelectItem key={f.id} value={String(f.id)}>
                        {f.user.firstName} {f.user.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.farmerId && <p className="text-xs text-red-500">{errors.farmerId.message}</p>}
          </div>

          <div className="space-y-1">
            <Label>Account Type *</Label>
            <Controller
              control={control}
              name="accountType"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Personal</SelectItem>
                    <SelectItem value="2">Business</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-1">
            <Label>Bank *</Label>
            <Controller
              control={control}
              name="bankCode"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue placeholder="Select bank" /></SelectTrigger>
                  <SelectContent className="max-h-56">
                    {(banks ?? []).map((b) => (
                      <SelectItem key={b.code} value={b.code}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.bankCode && <p className="text-xs text-red-500">{errors.bankCode.message}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="accountNumber">Account Number *</Label>
            <Input id="accountNumber" placeholder="0123456789" {...register("accountNumber")} />
            {errors.accountNumber && <p className="text-xs text-red-500">{errors.accountNumber.message}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="accountName">Account Name *</Label>
            <Input id="accountName" placeholder="As it appears on the account" {...register("accountName")} />
            {errors.accountName && <p className="text-xs text-red-500">{errors.accountName.message}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { reset(); onClose(); }} disabled={saving}>Cancel</Button>
            <Button type="submit" className="bg-green-600 hover:bg-green-700" disabled={saving}>
              {saving ? "Saving..." : "Add Account"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function FarmerBankAccountsPage() {
  const [addOpen, setAddOpen] = useState(false);
  const { data: farmers } = useFarmers();

  const { data: accounts, isLoading, mutate } = useApiCall<FarmerBankAccount[]>(
    "farmer-bank-accounts",
    () => marketplaceService.getFarmerBankAccounts()
  );

  function farmerName(farmerId: number) {
    const f = (farmers ?? []).find((f) => f.id === farmerId);
    return f ? `${f.user.firstName} ${f.user.lastName}` : `Farmer #${farmerId}`;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Landmark size={20} className="text-green-600" />
            Farmer Bank Accounts
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">Paystack bank accounts registered for farmers</p>
        </div>
        <Button className="bg-green-600 hover:bg-green-700 gap-1.5 self-start" onClick={() => setAddOpen(true)}>
          <Plus size={16} />
          Add Account
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            {isLoading ? "Loading..." : `${accounts?.length ?? 0} account${accounts?.length !== 1 ? "s" : ""}`}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="divide-y">
              {[1,2,3].map((i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-3">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24 ml-4" />
                  <Skeleton className="h-4 w-28 ml-auto" />
                </div>
              ))}
            </div>
          ) : !accounts || accounts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <Landmark className="text-gray-300 mb-3" size={42} />
              <h3 className="font-semibold mb-1">No bank accounts</h3>
              <p className="text-sm text-gray-500 mb-4">Add bank accounts for your farmers</p>
              <Button className="bg-green-600 hover:bg-green-700" onClick={() => setAddOpen(true)}>
                <Plus size={14} className="mr-2" />Add Account
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Farmer</TableHead>
                  <TableHead>Bank</TableHead>
                  <TableHead>Account Number</TableHead>
                  <TableHead>Account Name</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Default</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.map((acc) => (
                  <TableRow key={acc.id}>
                    <TableCell className="font-medium text-sm">{farmerName(acc.farmer)}</TableCell>
                    <TableCell className="text-sm text-gray-600">{acc.bankCode}</TableCell>
                    <TableCell className="text-sm font-mono">{acc.accountNumber}</TableCell>
                    <TableCell className="text-sm">{acc.accountName ?? "—"}</TableCell>
                    <TableCell className="text-sm">{acc.countryCode}</TableCell>
                    <TableCell>
                      {acc.isDefault && (
                        <CheckCircle2 size={16} className="text-green-600" />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AddDialog open={addOpen} onClose={() => setAddOpen(false)} onSaved={() => mutate()} />
    </div>
  );
}
