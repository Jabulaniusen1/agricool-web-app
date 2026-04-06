"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ClipboardList, Plus, Edit, Eye, ChevronDown, ChevronUp } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Controller } from "react-hook-form";

import { coldtivateService } from "@/services/coldtivate-service";
import { useApiCall } from "@/hooks/use-api";
import { useFarmers } from "@/hooks/use-farmers";
import { FarmerSurvey } from "@/types/global";

// ─── Schema ────────────────────────────────────────────────────────────────────

const surveySchema = z.object({
  farmerId: z.string().min(1, "Farmer is required"),
  notes: z.string().optional(),
  cropTypes: z.string().optional(),
  storageNeeds: z.string().optional(),
  issues: z.string().optional(),
});

type SurveyFormValues = z.infer<typeof surveySchema>;

// ─── Survey Detail Accordion ───────────────────────────────────────────────────

function SurveyDataAccordion({ data }: { data: Record<string, unknown> }) {
  const [open, setOpen] = useState(false);
  const entries = Object.entries(data).filter(([, v]) => v !== null && v !== undefined && v !== "");
  if (entries.length === 0) return <span className="text-gray-400 text-xs">No data</span>;
  return (
    <div>
      <button
        className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
        onClick={() => setOpen(!open)}
      >
        {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        {open ? "Hide" : "View"} data
      </button>
      {open && (
        <dl className="mt-2 space-y-1 text-xs">
          {entries.map(([key, val]) => (
            <div key={key} className="flex gap-2">
              <dt className="font-medium text-gray-500 capitalize min-w-24">{key.replace(/_/g, " ")}:</dt>
              <dd className="text-gray-700">{String(val)}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}

// ─── Survey Form Dialog ────────────────────────────────────────────────────────

function SurveyDialog({
  open,
  onClose,
  editSurvey,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  editSurvey: FarmerSurvey | null;
  onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const { data: farmers } = useFarmers();

  const { register, handleSubmit, control, reset, formState: { errors } } =
    useForm<SurveyFormValues>({
      resolver: zodResolver(surveySchema),
      defaultValues: editSurvey
        ? {
            farmerId: String(editSurvey.farmerId),
            notes: String(editSurvey.data?.notes ?? ""),
            cropTypes: String(editSurvey.data?.cropTypes ?? ""),
            storageNeeds: String(editSurvey.data?.storageNeeds ?? ""),
            issues: String(editSurvey.data?.issues ?? ""),
          }
        : { farmerId: "", notes: "", cropTypes: "", storageNeeds: "", issues: "" },
    });

  async function onSubmit(values: SurveyFormValues) {
    setSaving(true);
    try {
      const payload = {
        farmerId: Number(values.farmerId),
        data: {
          notes: values.notes,
          cropTypes: values.cropTypes,
          storageNeeds: values.storageNeeds,
          issues: values.issues,
        },
      };
      if (editSurvey) {
        await coldtivateService.updateFarmerSurvey(editSurvey.id, payload);
        toast.success("Survey updated");
      } else {
        await coldtivateService.createFarmerSurvey(payload);
        toast.success("Survey created");
      }
      onSaved();
      onClose();
      reset();
    } catch {
      toast.error(editSurvey ? "Failed to update survey" : "Failed to create survey");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && (reset(), onClose())}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editSurvey ? "Edit Survey" : "New Farmer Survey"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-1">
          <div className="space-y-1">
            <Label>Farmer *</Label>
            <Controller
              control={control}
              name="farmerId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange} disabled={!!editSurvey}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select farmer" />
                  </SelectTrigger>
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
            <Label htmlFor="cropTypes">Crop Types</Label>
            <Textarea id="cropTypes" placeholder="e.g. Tomatoes, Pepper, Yam" {...register("cropTypes")} />
          </div>

          <div className="space-y-1">
            <Label htmlFor="storageNeeds">Storage Needs</Label>
            <Textarea id="storageNeeds" placeholder="Describe storage requirements..." {...register("storageNeeds")} />
          </div>

          <div className="space-y-1">
            <Label htmlFor="issues">Issues / Challenges</Label>
            <Textarea id="issues" placeholder="Any issues or challenges faced..." {...register("issues")} />
          </div>

          <div className="space-y-1">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" placeholder="Additional notes..." {...register("notes")} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { reset(); onClose(); }} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" className="bg-green-600 hover:bg-green-700" disabled={saving}>
              {saving ? "Saving..." : editSurvey ? "Save Changes" : "Create Survey"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── View Dialog ───────────────────────────────────────────────────────────────

function ViewSurveyDialog({
  survey,
  onClose,
  farmers,
}: {
  survey: FarmerSurvey | null;
  onClose: () => void;
  farmers: { id: number; user: { firstName: string; lastName: string } }[];
}) {
  if (!survey) return null;
  const farmer = farmers.find((f) => f.id === survey.farmerId);
  const farmerName = farmer ? `${farmer.user.firstName} ${farmer.user.lastName}` : `Farmer #${survey.farmerId}`;
  const fields = [
    { label: "Crop Types", key: "cropTypes" },
    { label: "Storage Needs", key: "storageNeeds" },
    { label: "Issues / Challenges", key: "issues" },
    { label: "Notes", key: "notes" },
  ];

  return (
    <Dialog open={!!survey} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Survey — {farmerName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-2">
          {fields.map(({ label, key }) =>
            survey.data?.[key] ? (
              <div key={key}>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">{label}</p>
                <p className="text-sm text-gray-800 whitespace-pre-wrap">{String(survey.data[key])}</p>
              </div>
            ) : null
          )}
          {Object.keys(survey.data ?? {}).filter((k) => !["cropTypes", "storageNeeds", "issues", "notes"].includes(k)).map((key) => (
            <div key={key}>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">{key}</p>
              <p className="text-sm text-gray-800">{String((survey.data as Record<string, unknown>)[key])}</p>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function FarmerSurveysPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [editSurvey, setEditSurvey] = useState<FarmerSurvey | null>(null);
  const [viewSurvey, setViewSurvey] = useState<FarmerSurvey | null>(null);
  const { data: farmers } = useFarmers();

  const { data: surveys, isLoading, mutate } = useApiCall<FarmerSurvey[]>(
    "farmer-surveys",
    () => coldtivateService.getFarmerSurveys()
  );

  function openAdd() { setEditSurvey(null); setFormOpen(true); }
  function openEdit(s: FarmerSurvey) { setEditSurvey(s); setFormOpen(true); }

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
            <ClipboardList size={20} className="text-green-600" />
            Farmer Surveys
          </h2>
          <p className="text-gray-500 text-sm mt-0.5">Field survey records for registered farmers</p>
        </div>
        <Button className="bg-green-600 hover:bg-green-700 gap-1.5 self-start" onClick={openAdd}>
          <Plus size={16} />
          New Survey
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            {isLoading ? "Loading..." : `${surveys?.length ?? 0} survey${surveys?.length !== 1 ? "s" : ""}`}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="divide-y">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-3">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-20 ml-auto" />
                  <Skeleton className="h-8 w-16" />
                </div>
              ))}
            </div>
          ) : !surveys || surveys.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <ClipboardList className="text-gray-300 mb-3" size={42} />
              <h3 className="font-semibold mb-1">No surveys yet</h3>
              <p className="text-sm text-gray-500 mb-4">Start recording farmer field surveys</p>
              <Button className="bg-green-600 hover:bg-green-700" onClick={openAdd}>
                <Plus size={14} className="mr-2" />New Survey
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Farmer</TableHead>
                  <TableHead>Crop Types</TableHead>
                  <TableHead>Storage Needs</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {surveys.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium text-sm">{farmerName(s.farmerId)}</TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {String(s.data?.cropTypes ?? "—")}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500 max-w-xs truncate">
                      {String(s.data?.storageNeeds ?? "—")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewSurvey(s)}>
                          <Eye size={14} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(s)}>
                          <Edit size={14} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <SurveyDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        editSurvey={editSurvey}
        onSaved={() => mutate()}
      />

      <ViewSurveyDialog
        survey={viewSurvey}
        onClose={() => setViewSurvey(null)}
        farmers={farmers ?? []}
      />
    </div>
  );
}
