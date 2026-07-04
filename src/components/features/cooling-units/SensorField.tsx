"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Thermometer } from "lucide-react";

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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";

import { coldtivateService } from "@/services/coldtivate-service";
import { SensorDatum } from "@/types/global";

const SENSOR_TYPES = [
  { id: "ecozen", label: "Ecozen" },
  { id: "ubibot", label: "Ubibot" },
  { id: "figorr", label: "Figorr" },
  { id: "victron", label: "Victron" },
] as const;

type SensorTypeId = (typeof SENSOR_TYPES)[number]["id"];

type Stage = "closed" | "type" | "ecozen" | "generic" | "sources";

export function SensorField({
  alreadyConnected,
  sensorData,
  onChange,
}: {
  alreadyConnected: boolean;
  sensorData: SensorDatum | undefined;
  onChange: (sensor: boolean, sensorData: SensorDatum | undefined) => void;
}) {
  const [stage, setStage] = useState<Stage>("closed");
  const [pendingType, setPendingType] = useState<SensorTypeId | null>(null);
  const [pendingCreds, setPendingCreds] = useState({ username: "", password: "", sourceId: "" });
  const [sources, setSources] = useState<{ id: string; name: string }[]>([]);
  const [selectedSourceId, setSelectedSourceId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isConnected = Boolean(sensorData) || alreadyConnected;
  const typeLabel = sensorData
    ? SENSOR_TYPES.find((t) => t.id === sensorData.type)?.label ?? sensorData.type
    : null;

  function openPicker() {
    setPendingCreds({ username: "", password: "", sourceId: "" });
    setStage("type");
  }

  function closeAll() {
    setStage("closed");
    setPendingType(null);
    setSources([]);
    setSelectedSourceId("");
  }

  function chooseType(type: SensorTypeId) {
    setPendingType(type);
    setStage(type === "ecozen" ? "ecozen" : "generic");
  }

  async function submitEcozen() {
    if (!pendingCreds.username || !pendingCreds.password || !pendingCreds.sourceId) return;
    setSubmitting(true);
    try {
      await coldtivateService.verifyEcozenSensor({
        username: pendingCreds.username,
        password: pendingCreds.password,
        sourceId: pendingCreds.sourceId,
      });
      onChange(true, {
        sourceId: pendingCreds.sourceId,
        username: pendingCreds.username,
        password: pendingCreds.password,
        type: "ecozen",
      });
      toast.success("Sensor connected");
      closeAll();
    } catch {
      toast.error("Could not verify this sensor — check the credentials and machine ID");
    } finally {
      setSubmitting(false);
    }
  }

  async function submitGeneric() {
    if (!pendingCreds.username || !pendingCreds.password || !pendingType) return;
    setSubmitting(true);
    try {
      const result = await coldtivateService.listSensorSources({
        username: pendingCreds.username,
        password: pendingCreds.password,
        integrationType: pendingType,
      });
      if (!result.sources.length) {
        toast.error("No sensors found for this account");
        return;
      }
      setSources(result.sources);
      setSelectedSourceId("");
      setStage("sources");
    } catch {
      toast.error("Could not connect — check the credentials");
    } finally {
      setSubmitting(false);
    }
  }

  function submitSourceSelection() {
    if (!selectedSourceId || !pendingType) return;
    onChange(true, {
      sourceId: selectedSourceId,
      username: pendingCreds.username,
      password: pendingCreds.password,
      type: pendingType,
    });
    toast.success("Sensor connected");
    closeAll();
  }

  return (
    <div>
      <div className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-gray-200">
        <div className="flex items-center gap-2">
          <Thermometer size={15} className="text-gray-500" />
          <div>
            <p className="text-sm font-medium">Sensor Integration</p>
            {isConnected ? (
              <p className="text-xs text-green-600">
                Connected{typeLabel ? ` · ${typeLabel}` : ""}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">No sensor connected</p>
            )}
          </div>
        </div>

        {isConnected ? (
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={openPicker}>
              {alreadyConnected && !sensorData ? "Reconfigure" : "Change"}
            </Button>
            {sensorData && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-red-500 hover:text-red-600"
                onClick={() => onChange(false, undefined)}
              >
                Remove
              </Button>
            )}
          </div>
        ) : (
          <Switch checked={false} onCheckedChange={(v) => v && openPicker()} />
        )}
      </div>

      {/* Stage 1: pick sensor type */}
      <Dialog open={stage === "type"} onOpenChange={(v) => !v && closeAll()}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Select sensor type</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            {SENSOR_TYPES.map((type) => (
              <button
                key={type.id}
                type="button"
                onClick={() => chooseType(type.id)}
                className="w-full text-left px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-sm"
              >
                {type.label}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Stage 2a: ecozen credentials + machine id */}
      <Dialog open={stage === "ecozen"} onOpenChange={(v) => !v && closeAll()}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Connect Ecozen sensor</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Username</Label>
              <Input
                autoCapitalize="none"
                value={pendingCreds.username}
                onChange={(e) => setPendingCreds((p) => ({ ...p, username: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>Password</Label>
              <Input
                type="password"
                value={pendingCreds.password}
                onChange={(e) => setPendingCreds((p) => ({ ...p, password: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>Machine ID</Label>
              <Input
                value={pendingCreds.sourceId}
                onChange={(e) => setPendingCreds((p) => ({ ...p, sourceId: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeAll}>
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-green-600 hover:bg-green-700"
              disabled={submitting}
              onClick={submitEcozen}
            >
              {submitting ? <Loader2 size={14} className="animate-spin" /> : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stage 2b: generic integration credentials (ubibot / figorr / victron) */}
      <Dialog open={stage === "generic"} onOpenChange={(v) => !v && closeAll()}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              Connect {SENSOR_TYPES.find((t) => t.id === pendingType)?.label} sensor
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Username</Label>
              <Input
                autoCapitalize="none"
                value={pendingCreds.username}
                onChange={(e) => setPendingCreds((p) => ({ ...p, username: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>Password</Label>
              <Input
                type="password"
                value={pendingCreds.password}
                onChange={(e) => setPendingCreds((p) => ({ ...p, password: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeAll}>
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-green-600 hover:bg-green-700"
              disabled={submitting}
              onClick={submitGeneric}
            >
              {submitting ? <Loader2 size={14} className="animate-spin" /> : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stage 3: pick a source from the connected account */}
      <Dialog open={stage === "sources"} onOpenChange={(v) => !v && closeAll()}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Select sensor</DialogTitle>
          </DialogHeader>
          <RadioGroup value={selectedSourceId} onValueChange={setSelectedSourceId}>
            <div className="max-h-64 overflow-y-auto space-y-1">
              {sources.map((source) => (
                <label
                  key={source.id}
                  className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-sm cursor-pointer"
                >
                  <div>
                    <p>{source.id}</p>
                    <p className="text-xs text-muted-foreground">{source.name || "Unnamed sensor"}</p>
                  </div>
                  <RadioGroupItem value={source.id} />
                </label>
              ))}
            </div>
          </RadioGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeAll}>
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-green-600 hover:bg-green-700"
              disabled={!selectedSourceId}
              onClick={submitSourceSelection}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
