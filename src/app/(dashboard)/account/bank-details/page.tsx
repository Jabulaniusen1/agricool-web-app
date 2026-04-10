"use client";

import Link from "next/link";
import { CreditCard, Plus, CheckCircle2, Building2, Hash } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

import { marketplaceService } from "@/services/marketplace-service";
import { PaystackAccount, Bank } from "@/types/global";
import { useApiCall } from "@/hooks/use-api";
import { ROUTES } from "@/constants/routes";

function AccountCardSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 p-4 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <div className="space-y-1.5 flex-1">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <div className="h-px bg-gray-100" />
      <Skeleton className="h-3 w-40" />
    </div>
  );
}

function AccountCard({ acc, bankName }: { acc: PaystackAccount; bankName: string }) {
  return (
    <div className={`rounded-xl border p-4 space-y-3 ${acc.isDefault ? "border-green-200 bg-green-50/40" : "border-gray-200 bg-white"}`}>
      <div className="flex items-start gap-3">
        <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${acc.isDefault ? "bg-green-100" : "bg-gray-100"}`}>
          <Building2 size={18} className={acc.isDefault ? "text-green-600" : "text-gray-500"} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{bankName}</p>
          <p className="text-xs text-muted-foreground truncate">{acc.accountName}</p>
        </div>
        {acc.isDefault ? (
          <Badge className="bg-green-100 text-green-700 border-0 gap-1 text-xs shrink-0">
            <CheckCircle2 size={11} />
            Default
          </Badge>
        ) : (
          <Badge variant="outline" className="text-xs text-gray-500 shrink-0">
            Connected
          </Badge>
        )}
      </div>
      <div className="h-px bg-gray-100" />
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Hash size={11} />
        <span className="font-mono tracking-wider">{acc.accountNumber}</span>
      </div>
    </div>
  );
}

export default function BankDetailsPage() {
  const { data: accounts, isLoading: loadingAccounts } = useApiCall<PaystackAccount[]>(
    "paystack-accounts",
    () => marketplaceService.getPaystackAccounts()
  );
  const { data: banks } = useApiCall<Bank[]>("banks", () => marketplaceService.getBanks());

  const hasAccount = !loadingAccounts && accounts && accounts.length > 0;

  function getBankName(acc: PaystackAccount): string {
    if (acc.bankName) return acc.bankName;
    const match = (banks ?? []).find((b) => b.code === acc.bankCode);
    return match?.name ?? "Bank Account";
  }

  return (
    <div className="space-y-6 max-w-xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <CreditCard size={20} className="text-green-600" />
            Bank Details
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Your connected payout account
          </p>
        </div>
        {!hasAccount && (
          <Link
            href={ROUTES.ACCOUNT_BANK_DETAILS_ADD}
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition-colors"
          >
            <Plus size={15} />
            Add Account
          </Link>
        )}
      </div>

      {/* Content */}
      {loadingAccounts && <AccountCardSkeleton />}

      {!loadingAccounts && (!accounts || accounts.length === 0) && (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center py-14 text-center px-6">
          <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
            <CreditCard size={22} className="text-gray-400" />
          </div>
          <p className="font-semibold text-gray-700 mb-1">No bank account yet</p>
          <p className="text-sm text-muted-foreground mb-5">
            Add a bank account to receive payments
          </p>
          <Link
            href={ROUTES.ACCOUNT_BANK_DETAILS_ADD}
            className="inline-flex items-center h-8 px-3 rounded-md bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition-colors"
          >
            <Plus size={14} className="mr-1.5" />
            Add Account
          </Link>
        </div>
      )}

      {hasAccount && (
        <div className="space-y-3">
          {accounts.map((acc: PaystackAccount) => (
            <AccountCard key={acc.id} acc={acc} bankName={getBankName(acc)} />
          ))}
        </div>
      )}
    </div>
  );
}
