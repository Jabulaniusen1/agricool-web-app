"use client";

import { useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Store,
  Building2,
  Hash,
  User,
  Briefcase,
  ChevronsUpDown,
  Check,
  CheckCircle2,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

import { useApiCall } from "@/hooks/use-api";
import { useCompanies } from "@/hooks/use-companies";
import { marketplaceService } from "@/services/marketplace-service";
import { bankAccountSchema, BankAccountFormValues } from "@/constants/schemas";
import { PaystackAccount, Bank } from "@/types/global";
import { cn } from "@/lib/utils";

export default function MarketplaceSetupPage() {
  const { data: companies } = useCompanies();
  const companyId = companies?.[0]?.id ?? 0;

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [bankPopoverOpen, setBankPopoverOpen] = useState(false);

  const accountsKey = companyId ? `paystack-accounts/company/${companyId}` : null;
  const { data: accounts, isLoading: loadingAccounts, mutate: refreshAccounts } = useApiCall<
    PaystackAccount[]
  >(accountsKey, () => marketplaceService.getPaystackAccounts({ companyId }));
  const { data: banks } = useApiCall<Bank[]>("banks", () => marketplaceService.getBanks());

  const hasAccount = !loadingAccounts && accounts && accounts.length > 0;

  function getBankName(acc: PaystackAccount): string {
    if (acc.bankName) return acc.bankName;
    const match = (banks ?? []).find((b) => b.code === acc.bankCode);
    return match?.name ?? "Bank Account";
  }

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<BankAccountFormValues>({
    resolver: zodResolver(bankAccountSchema),
    defaultValues: { accountType: "1", bankCode: "", accountNumber: "", accountName: "" },
  });

  const selectedBankCode = watch("bankCode");
  const selectedBank = useMemo(
    () => (banks ?? []).find((bank) => bank.code === selectedBankCode),
    [banks, selectedBankCode]
  );

  async function onSubmit(values: BankAccountFormValues) {
    setSaving(true);
    try {
      await marketplaceService.addPaystackAccount({
        accountType: values.accountType,
        bankCode: values.bankCode,
        accountNumber: values.accountNumber,
        accountName: values.accountName,
        companyId,
      });
      toast.success("Company payout account connected");
      reset();
      setShowForm(false);
      await refreshAccounts();
    } catch {
      toast.error("Failed to connect payout account");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 max-w-xl">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Store size={20} className="text-green-600" />
          Marketplace Setup
        </h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Connect your company&apos;s payout account to receive marketplace sale payments
        </p>
      </div>

      {loadingAccounts && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-4 w-40" />
          </CardContent>
        </Card>
      )}

      {/* Existing account summary */}
      {hasAccount && !showForm && (
        <div className="space-y-3">
          {accounts.map((acc) => (
            <div
              key={acc.id}
              className={`rounded-xl border p-4 space-y-3 ${acc.isDefault ? "border-green-200 bg-green-50/40" : "border-gray-200 bg-white"}`}
            >
              <div className="flex items-start gap-3">
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${acc.isDefault ? "bg-green-100" : "bg-gray-100"}`}>
                  <Building2 size={18} className={acc.isDefault ? "text-green-600" : "text-gray-500"} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{getBankName(acc)}</p>
                  <p className="text-xs text-muted-foreground truncate">{acc.accountName}</p>
                </div>
                {acc.isDefault && (
                  <Badge className="bg-green-100 text-green-700 border-0 gap-1 text-xs shrink-0">
                    <CheckCircle2 size={11} />
                    Default
                  </Badge>
                )}
              </div>
              <div className="h-px bg-gray-100" />
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Hash size={11} />
                <span className="font-mono tracking-wider">{acc.accountNumber}</span>
              </div>
            </div>
          ))}
          <Button variant="outline" onClick={() => setShowForm(true)}>
            Replace Account
          </Button>
        </div>
      )}

      {/* Empty state */}
      {!loadingAccounts && !hasAccount && !showForm && (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center py-14 text-center px-6">
          <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
            <Store size={22} className="text-gray-400" />
          </div>
          <p className="font-semibold text-gray-700 mb-1">No payout account connected</p>
          <p className="text-sm text-muted-foreground mb-5">
            Your company needs a payout account before it can receive marketplace sale payments
          </p>
          <Button className="bg-green-600 hover:bg-green-700" onClick={() => setShowForm(true)}>
            Connect Account
          </Button>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {hasAccount ? "Replace Payout Account" : "Connect Payout Account"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-sm font-medium">
                  <Briefcase size={13} className="text-gray-400" />
                  Account Type
                </Label>
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
              </div>

              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-sm font-medium">
                  <Building2 size={13} className="text-gray-400" />
                  Bank
                </Label>
                <Popover open={bankPopoverOpen} onOpenChange={setBankPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      aria-expanded={bankPopoverOpen}
                      className="w-full justify-between font-normal"
                    >
                      <span className="truncate text-sm">
                        {selectedBank ? selectedBank.name : "Search and select your bank"}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-40" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search bank..." />
                      <CommandList>
                        <CommandEmpty>No bank found.</CommandEmpty>
                        <CommandGroup>
                          {(banks ?? []).map((bank) => (
                            <CommandItem
                              key={bank.code}
                              value={`${bank.name} ${bank.code}`}
                              onSelect={() => {
                                setValue("bankCode", bank.code, { shouldValidate: true, shouldDirty: true });
                                setBankPopoverOpen(false);
                              }}
                              className="gap-2"
                            >
                              <Check
                                className={cn(
                                  "h-4 w-4 text-green-600",
                                  selectedBankCode === bank.code ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <span className="truncate">{bank.name}</span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <input type="hidden" {...register("bankCode")} />
                {errors.bankCode && <p className="text-xs text-red-500">{errors.bankCode.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-sm font-medium">
                  <Hash size={13} className="text-gray-400" />
                  Account Number
                </Label>
                <Input
                  placeholder="0123456789"
                  maxLength={10}
                  className="font-mono tracking-widest"
                  {...register("accountNumber")}
                />
                {errors.accountNumber && (
                  <p className="text-xs text-red-500">{errors.accountNumber.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-sm font-medium">
                  <User size={13} className="text-gray-400" />
                  Account Name
                </Label>
                <Input placeholder="e.g. Agricool Foods Ltd" {...register("accountName")} />
                {errors.accountName && (
                  <p className="text-xs text-red-500">{errors.accountName.message}</p>
                )}
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    reset();
                    setShowForm(false);
                  }}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700" disabled={saving}>
                  {saving ? "Saving..." : "Save"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <p className="text-xs text-center text-muted-foreground px-2">
        Your bank details are encrypted and secured via Paystack.
      </p>
    </div>
  );
}
