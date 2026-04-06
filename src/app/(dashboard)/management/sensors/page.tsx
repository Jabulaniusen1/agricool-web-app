"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Cpu, Plus, Wifi, WifiOff } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { useApiCall } from "@/hooks/use-api";
import { coldtivateService } from "@/services/coldtivate-service";
import { EcozanSensor } from "@/types/global";

// ─── Schema ────────────────────────────────────────────────────────────────────

const addSchema = z.object({
  model: z.string().min(1, "Model is required"),
  serialNumber: z.string().min(1, "Serial number is required"),
  coolingUnit: z.string().min(1, "Cooling Unit ID is required"),
});

type AddFormValues = z.infer<typeof addSchema>;

const testSchema = z.object({
  sensorType: z.string().min(1, "Sensor type is required"),
  username: z.string().min(1),
  password: z.string().min(1),
});

type TestFormValues = z.infer<typeof testSchema>;

// ─── Add Ecozen Dialog ─────────────────────────────────────────────────────────

function AddSensorDialog({
  open,
  onClose,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<AddFormValues>({
    resolver: zodResolver(addSchema),
    defaultValues: { model: "", serialNumber: "", coolingUnit: "" },
  });

  async function onSubmit(values: AddFormValues) {
    setSaving(true);
    try {
      await coldtivateService.createEcozen({
        model: values.model,
        serialNumber: values.serialNumber,
        coolingUnit: Number(values.coolingUnit),
      });
      toast.success("Sensor added");
      onSaved();
      onClose();
      reset();
    } catch {
      toast.error("Failed to add sensor");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && (reset(), onClose())}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Add Ecozen Sensor</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-1">
          <div className="space-y-1">
            <Label htmlFor="model">Model *</Label>
            <Input id="model" placeholder="e.g. ECZ-100" {...register("model")} />
            {errors.model && <p className="text-xs text-red-500">{errors.model.message}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="serialNumber">Serial Number *</Label>
            <Input id="serialNumber" placeholder="e.g. SN-20241001" {...register("serialNumber")} />
            {errors.serialNumber && <p className="text-xs text-red-500">{errors.serialNumber.message}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="coolingUnit">Cooling Unit ID *</Label>
            <Input id="coolingUnit" type="number" placeholder="e.g. 42" {...register("coolingUnit")} />
            {errors.coolingUnit && <p className="text-xs text-red-500">{errors.coolingUnit.message}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { reset(); onClose(); }} disabled={saving}>Cancel</Button>
            <Button type="submit" className="bg-green-600 hover:bg-green-700" disabled={saving}>
              {saving ? "Saving..." : "Add Sensor"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Test Connection Dialog ────────────────────────────────────────────────────

function TestConnectionDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<{ connected: boolean; message?: string } | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<TestFormValues>({
    resolver: zodResolver(testSchema),
    defaultValues: { sensorType: "ecozen", username: "", password: "" },
  });

  async function onSubmit(values: TestFormValues) {
    setTesting(true);
    setResult(null);
    try {
      const res = await coldtivateService.testSensorConnection({
        sensorType: values.sensorType,
        credentials: { username: values.username, password: values.password },
      });
      setResult(res);
    } catch {
      toast.error("Connection test failed");
    } finally {
      setTesting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && (reset(), setResult(null), onClose())}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Test Sensor Connection</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-1">
          <div className="space-y-1">
            <Label htmlFor="sensorType">Sensor Type</Label>
            <Input id="sensorType" placeholder="ecozen" {...register("sensorType")} />
            {errors.sensorType && <p className="text-xs text-red-500">{errors.sensorType.message}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="username">Username *</Label>
            <Input id="username" {...register("username")} />
            {errors.username && <p className="text-xs text-red-500">{errors.username.message}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="password">Password *</Label>
            <Input id="password" type="password" {...register("password")} />
            {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
          </div>

          {result && (
            <div className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${result.connected ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
              {result.connected ? <Wifi size={16} /> : <WifiOff size={16} />}
              {result.connected ? "Connected successfully" : (result.message ?? "Connection failed")}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { reset(); setResult(null); onClose(); }}>Close</Button>
            <Button type="submit" className="bg-green-600 hover:bg-green-700" disabled={testing}>
              {testing ? "Testing..." : "Test Connection"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function SensorsPage() {
  const [addOpen, setAddOpen] = useState(false);
  const [testOpen, setTestOpen] = useState(false);

  const { data: sensors, isLoading, mutate } = useApiCall<EcozanSensor[]>(
    "ecozen-sensors",
    () => coldtivateService.listEcozens()
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Cpu size={20} className="text-green-600" />
            Sensor Inventory
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">Ecozen sensors linked to your cooling units</p>
        </div>
        <div className="flex gap-2 self-start">
          <Button variant="outline" className="gap-1.5" onClick={() => setTestOpen(true)}>
            <Wifi size={15} />
            Test Connection
          </Button>
          <Button className="bg-green-600 hover:bg-green-700 gap-1.5" onClick={() => setAddOpen(true)}>
            <Plus size={16} />
            Add Sensor
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            {isLoading ? "Loading..." : `${sensors?.length ?? 0} sensor${sensors?.length !== 1 ? "s" : ""}`}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="divide-y">
              {[1,2,3].map((i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-3">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-32 ml-4" />
                  <Skeleton className="h-4 w-20 ml-auto" />
                </div>
              ))}
            </div>
          ) : !sensors || sensors.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <Cpu className="text-gray-300 mb-3" size={42} />
              <h3 className="font-semibold mb-1">No sensors</h3>
              <p className="text-sm text-gray-500 mb-4">Add Ecozen sensors to monitor your units</p>
              <Button className="bg-green-600 hover:bg-green-700" onClick={() => setAddOpen(true)}>
                <Plus size={14} className="mr-2" />Add Sensor
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Serial Number</TableHead>
                  <TableHead>Cooling Unit</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sensors.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="text-sm text-gray-500 font-mono">#{s.id}</TableCell>
                    <TableCell className="text-sm font-medium">{s.model}</TableCell>
                    <TableCell className="text-sm font-mono text-gray-600">{s.serialNumber}</TableCell>
                    <TableCell className="text-sm">Unit #{s.coolingUnit}</TableCell>
                    <TableCell>
                      <Badge className="bg-green-100 text-green-700 text-xs">Active</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AddSensorDialog open={addOpen} onClose={() => setAddOpen(false)} onSaved={() => mutate()} />
      <TestConnectionDialog open={testOpen} onClose={() => setTestOpen(false)} />
    </div>
  );
}
