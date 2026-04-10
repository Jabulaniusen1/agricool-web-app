"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ArrowLeft, Check, ChevronsUpDown, CreditCard, Building2, User, Hash, Briefcase } from "lucide-react";

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
import { marketplaceService } from "@/services/marketplace-service";
import { bankAccountSchema, BankAccountFormValues } from "@/constants/schemas";
import { Bank } from "@/types/global";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

function FieldWrapper({ label, icon: Icon, error, children }: {
  label: string;
  icon: React.ElementType;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
        <Icon size={13} className="text-gray-400" />
        {label}
      </Label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

export default function AddBankDetailsPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [bankPopoverOpen, setBankPopoverOpen] = useState(false);

  const { data: banks } = useApiCall<Bank[]>("banks", () => marketplaceService.getBanks());

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
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
      });
      toast.success("Bank account added successfully");
      router.push(ROUTES.ACCOUNT_BANK_DETAILS);
    } catch {
      toast.error("Failed to add bank account");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 max-w-xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href={ROUTES.ACCOUNT_BANK_DETAILS}
          className="h-8 w-8 shrink-0 inline-flex items-center justify-center rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <CreditCard size={20} className="text-green-600" />
            Add Bank Account
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Connect a bank account to receive payments
          </p>
        </div>
      </div>

      {/* Form card */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        {/* Card header strip */}
        <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/60">
          <p className="text-sm font-semibold text-gray-700">Account Information</p>
          <p className="text-xs text-muted-foreground mt-0.5">All fields are required</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-5">
          {/* Account Type */}
          <FieldWrapper label="Account Type" icon={Briefcase} error={errors.accountType?.message}>
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
          </FieldWrapper>

          {/* Bank */}
          <FieldWrapper label="Bank" icon={Building2} error={errors.bankCode?.message}>
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
          </FieldWrapper>

          {/* Account Number */}
          <FieldWrapper label="Account Number" icon={Hash} error={errors.accountNumber?.message}>
            <Input
              id="accountNumber"
              placeholder="0123456789"
              maxLength={10}
              className="font-mono tracking-widest"
              {...register("accountNumber")}
            />
          </FieldWrapper>

          {/* Account Name */}
          <FieldWrapper label="Account Name" icon={User} error={errors.accountName?.message}>
            <Input
              id="accountName"
              placeholder="e.g. John Doe"
              {...register("accountName")}
            />
          </FieldWrapper>

          {/* Divider */}
          <div className="h-px bg-gray-100" />

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => router.push(ROUTES.ACCOUNT_BANK_DETAILS)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-green-600 hover:bg-green-700"
              disabled={saving}
            >
              {saving ? "Adding..." : "Add Account"}
            </Button>
          </div>
        </form>
      </div>

      {/* Info note */}
      <p className="text-xs text-center text-muted-foreground px-2">
        Your bank details are encrypted and secured via Paystack.
      </p>
    </div>
  );
}
