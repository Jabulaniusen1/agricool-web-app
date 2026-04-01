"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Users, UserPlus, Mail, Phone } from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

import { useFarmers } from "@/hooks/use-farmers";
import { useApiCall } from "@/hooks/use-api";
import { coldtivateService } from "@/services/coldtivate-service";
import { Farmer, ServiceProvider, ERoles } from "@/types/global";
import { getInitials, formatDate } from "@/lib/utils";

// ─── Invite Schemas ────────────────────────────────────────────────────────────

const inviteOperatorSchema = z.object({
  email: z.string().email("Valid email required").optional().or(z.literal("")),
  phone: z.string().min(7, "Valid phone required").optional().or(z.literal("")),
});

const inviteEmployeeSchema = z.object({
  email: z.string().email("Valid email required"),
});

type InviteOperatorValues = z.infer<typeof inviteOperatorSchema>;
type InviteEmployeeValues = z.infer<typeof inviteEmployeeSchema>;

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function TabSkeleton() {
  return (
    <div className="divide-y rounded-md border">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-36" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}

// ─── Farmers Tab ──────────────────────────────────────────────────────────────

function FarmersTab() {
  const { data: farmers, isLoading } = useFarmers();

  if (isLoading) return <TabSkeleton />;

  if (!farmers || farmers.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Users className="text-muted-foreground mb-3" size={40} />
          <h3 className="font-semibold mb-1">No farmers yet</h3>
          <p className="text-sm text-muted-foreground">Farmers will appear here after their first check-in</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Farmer</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Code</TableHead>
            <TableHead>Cooling Unit</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {farmers.map((farmer: Farmer) => {
            const name = `${farmer.user.firstName} ${farmer.user.lastName}`;
            return (
              <TableRow key={farmer.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="bg-green-100 text-green-700 text-xs">
                        {getInitials(name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Phone size={12} />
                    {farmer.user.phone}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-mono text-xs">
                    {farmer.code ?? farmer.farmerCode ?? "—"}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {farmer.coolingUnit ? `#${farmer.coolingUnit}` : "—"}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

// ─── Invite Operator Dialog ────────────────────────────────────────────────────

function InviteOperatorDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InviteOperatorValues>({ resolver: zodResolver(inviteOperatorSchema) });

  async function onSubmit(values: InviteOperatorValues) {
    setSaving(true);
    try {
      await coldtivateService.inviteServiceProvider({
        email: values.email ?? "",
        role: ERoles.OPERATOR,
      });
      toast.success("Operator invitation sent");
      reset();
      onClose();
    } catch {
      toast.error("Failed to send invitation");
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
          <DialogTitle>Invite Operator</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="space-y-1">
            <Label htmlFor="op-email">Email</Label>
            <div className="relative">
              <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="op-email"
                className="pl-8"
                placeholder="operator@example.com"
                {...register("email")}
              />
            </div>
            {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="op-phone">Phone (optional)</Label>
            <div className="relative">
              <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="op-phone"
                className="pl-8"
                placeholder="+234 800 000 0000"
                {...register("phone")}
              />
            </div>
            {errors.phone && <p className="text-xs text-red-500">{errors.phone.message}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" className="bg-green-600 hover:bg-green-700" disabled={saving}>
              {saving ? "Sending..." : "Send Invite"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Operators Tab ────────────────────────────────────────────────────────────

function OperatorsTab() {
  const { data: providers, isLoading } = useApiCall(
    "service-providers",
    () => coldtivateService.getServiceProviders()
  );
  const [inviteOpen, setInviteOpen] = useState(false);

  const operators = providers?.filter(
    (sp: ServiceProvider) => sp.role === ERoles.OPERATOR
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          className="bg-green-600 hover:bg-green-700 gap-1.5"
          size="sm"
          onClick={() => setInviteOpen(true)}
        >
          <UserPlus size={14} />
          Invite Operator
        </Button>
      </div>

      {isLoading && <TabSkeleton />}

      {!isLoading && (!operators || operators.length === 0) && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="text-muted-foreground mb-3" size={40} />
            <h3 className="font-semibold mb-1">No operators yet</h3>
            <p className="text-sm text-muted-foreground">Invite operators to manage cooling units</p>
          </CardContent>
        </Card>
      )}

      {!isLoading && operators && operators.length > 0 && (
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {operators.map((sp: ServiceProvider) => {
                const name = `${sp.user.firstName} ${sp.user.lastName}`;
                return (
                  <TableRow key={sp.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7">
                          <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                            {getInitials(name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">{name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Phone size={12} />
                        {sp.user.phone}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-blue-100 text-blue-700 border-0 text-xs capitalize">
                        {sp.role.toLowerCase()}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <InviteOperatorDialog open={inviteOpen} onClose={() => setInviteOpen(false)} />
    </div>
  );
}

// ─── Invite Employee Dialog ────────────────────────────────────────────────────

function InviteEmployeeDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InviteEmployeeValues>({ resolver: zodResolver(inviteEmployeeSchema) });

  async function onSubmit(values: InviteEmployeeValues) {
    setSaving(true);
    try {
      await coldtivateService.inviteServiceProvider({ email: values.email });
      toast.success("Employee invitation sent");
      reset();
      onClose();
    } catch {
      toast.error("Failed to send invitation");
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
          <DialogTitle>Invite Employee</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="space-y-1">
            <Label htmlFor="emp-email">Email</Label>
            <div className="relative">
              <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="emp-email"
                className="pl-8"
                placeholder="employee@example.com"
                {...register("email")}
              />
            </div>
            {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" className="bg-green-600 hover:bg-green-700" disabled={saving}>
              {saving ? "Sending..." : "Send Invite"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Employees Tab ────────────────────────────────────────────────────────────

function EmployeesTab() {
  const { data: providers, isLoading } = useApiCall(
    "service-providers",
    () => coldtivateService.getServiceProviders()
  );
  const [inviteOpen, setInviteOpen] = useState(false);

  const employees = providers?.filter(
    (sp: ServiceProvider) =>
      sp.role !== ERoles.OPERATOR &&
      sp.role !== ERoles.FARMER &&
      sp.role !== ERoles.AUTH
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          className="bg-green-600 hover:bg-green-700 gap-1.5"
          size="sm"
          onClick={() => setInviteOpen(true)}
        >
          <UserPlus size={14} />
          Invite Employee
        </Button>
      </div>

      {isLoading && <TabSkeleton />}

      {!isLoading && (!employees || employees.length === 0) && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="text-muted-foreground mb-3" size={40} />
            <h3 className="font-semibold mb-1">No employees yet</h3>
            <p className="text-sm text-muted-foreground">Invite employees to your organization</p>
          </CardContent>
        </Card>
      )}

      {!isLoading && employees && employees.length > 0 && (
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((sp: ServiceProvider) => {
                const name = `${sp.user.firstName} ${sp.user.lastName}`;
                return (
                  <TableRow key={sp.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7">
                          <AvatarFallback className="bg-purple-100 text-purple-700 text-xs">
                            {getInitials(name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">{name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {sp.user.phone}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {sp.user.email ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-purple-100 text-purple-700 border-0 text-xs capitalize">
                        {sp.role.toLowerCase().replace("_", " ")}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <InviteEmployeeDialog open={inviteOpen} onClose={() => setInviteOpen(false)} />
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Users size={20} className="text-green-600" />
          User Management
        </h2>
        <p className="text-muted-foreground text-sm mt-0.5">
          Manage farmers, operators and employees
        </p>
      </div>

      <Tabs defaultValue="farmers">
        <TabsList className="mb-4">
          <TabsTrigger value="farmers">Farmers</TabsTrigger>
          <TabsTrigger value="operators">Operators</TabsTrigger>
          <TabsTrigger value="employees">Employees</TabsTrigger>
        </TabsList>

        <TabsContent value="farmers">
          <FarmersTab />
        </TabsContent>
        <TabsContent value="operators">
          <OperatorsTab />
        </TabsContent>
        <TabsContent value="employees">
          <EmployeesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
