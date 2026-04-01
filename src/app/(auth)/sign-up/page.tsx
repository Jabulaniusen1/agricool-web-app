import Link from "next/link";
import { Building2, Leaf, Tractor } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ROUTES } from "@/constants/routes";

export default function SignUpPage() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="flex justify-center mb-3">
          <div className="w-12 h-12 rounded-xl bg-green-600 flex items-center justify-center">
            <Leaf className="text-white" size={24} />
          </div>
        </div>
        <h1 className="text-2xl font-bold">Create an Account</h1>
        <p className="text-muted-foreground mt-1">Choose your account type to get started</p>
      </div>

      <div className="grid gap-4">
        <Link href={ROUTES.SIGN_UP_COMPANY} className="block">
          <Card className="hover:border-green-500 hover:shadow-md transition-all cursor-pointer">
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center shrink-0">
                <Building2 className="text-green-600" size={20} />
              </div>
              <div>
                <CardTitle className="text-base">Company / Storage Service</CardTitle>
                <CardDescription>
                  Manage cooling units, operators, and customers
                </CardDescription>
              </div>
            </CardHeader>
          </Card>
        </Link>

        <Link href={ROUTES.SIGN_UP_COOLING_USER} className="block">
          <Card className="hover:border-green-500 hover:shadow-md transition-all cursor-pointer">
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center shrink-0">
                <Tractor className="text-emerald-600" size={20} />
              </div>
              <div>
                <CardTitle className="text-base">Farmer / Cooling User</CardTitle>
                <CardDescription>
                  Store your produce and access the marketplace
                </CardDescription>
              </div>
            </CardHeader>
          </Card>
        </Link>
      </div>

      <div className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href={ROUTES.SIGN_IN} className="text-green-600 hover:underline font-medium">
          Sign in
        </Link>
      </div>
    </div>
  );
}
