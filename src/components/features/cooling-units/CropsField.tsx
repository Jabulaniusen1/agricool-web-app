"use client";

import { useMemo, useState } from "react";
import { ChevronsUpDown, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

import { useCrops } from "@/hooks/use-cooling-units";

export function CropsField({
  value,
  onChange,
}: {
  value: number[];
  onChange: (value: number[]) => void;
}) {
  const { data: crops } = useCrops();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(
    () => (crops ?? []).filter((crop) => crop.name.toLowerCase().includes(search.toLowerCase())),
    [crops, search]
  );

  const selectedNames = useMemo(
    () => (crops ?? []).filter((crop) => value.includes(crop.id)).map((crop) => crop.name),
    [crops, value]
  );

  function toggle(id: number) {
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          <span className="truncate text-sm text-left">
            {selectedNames.length > 0
              ? selectedNames.join(", ")
              : crops?.length
              ? "Select commodities"
              : "No commodities available"}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-40" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-2 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search commodities..."
              className="h-8 pl-7 text-sm"
            />
          </div>
        </div>
        <ScrollArea className="max-h-56">
          <div className="p-1">
            {filtered.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-4">No commodities found</p>
            )}
            {filtered.map((crop) => (
              <div
                key={crop.id}
                onClick={() => toggle(crop.id)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-gray-50 cursor-pointer"
              >
                <Checkbox checked={value.includes(crop.id)} />
                <span className="truncate">{crop.name}</span>
              </div>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
