"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ShoppingCart, Package, MapPin, Thermometer, Filter } from "lucide-react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useAvailableListings } from "@/hooks/use-available-listings";
import { useCrops } from "@/hooks/use-cooling-units";
import { useLocations } from "@/hooks/use-locations";
import { marketplaceService } from "@/services/marketplace-service";
import { useShoppingCartStore } from "@/stores/shopping-cart";
import { AvailableListing, Crop } from "@/types/global";
import { formatCurrency, cn } from "@/lib/utils";
import { ROUTES } from "@/constants/routes";

function toLatLngFromPoint(point?: string): string | null {
  if (!point) return null;
  const match = point.match(/POINT\(\s*(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s*\)/i);
  if (!match) return null;

  const lng = Number(match[1]);
  const lat = Number(match[2]);
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;

  return `${lat},${lng}`;
}

function ListingCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <Skeleton className="w-12 h-12 rounded-lg" />
          <div className="space-y-1.5 flex-1">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <Skeleton className="h-12 rounded-lg" />
          <Skeleton className="h-12 rounded-lg" />
        </div>
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-9 w-full" />
      </CardContent>
    </Card>
  );
}

function ListingCard({
  listing,
  onAddToCart,
  adding,
}: {
  listing: AvailableListing;
  onAddToCart: (listing: AvailableListing) => void;
  adding: boolean;
}) {
  const shelfLife = listing.crate.remainingShelfLife;
  const shelfLifeColor =
    shelfLife > 7
      ? "bg-green-100 text-green-700"
      : shelfLife > 3
      ? "bg-yellow-100 text-yellow-700"
      : "bg-red-100 text-red-700";

  return (
    <Card className="hover:shadow-md transition-shadow flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/40 flex items-center justify-center overflow-hidden shrink-0">
              {listing.crop.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={listing.crop.image}
                  alt={listing.crop.name}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <Package className="text-green-600" size={22} />
              )}
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-sm truncate">{listing.crop.name}</h3>
              <p className="text-xs text-muted-foreground truncate">{listing.coolingUnit.name}</p>
            </div>
          </div>
          <Badge className={cn("text-xs shrink-0 border-0", shelfLifeColor)}>
            {shelfLife}d left
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 flex-1 flex flex-col">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2.5 bg-muted rounded-lg text-center">
            <p className="text-sm font-bold">{listing.availableWeight.toFixed(1)} kg</p>
            <p className="text-xs text-muted-foreground">Available</p>
          </div>
          <div className="p-2.5 bg-muted rounded-lg text-center">
            <p className="text-sm font-bold">
              {formatCurrency(listing.pricePerKg, listing.currency)}/kg
            </p>
            <p className="text-xs text-muted-foreground">Price</p>
          </div>
        </div>

        {/* Location */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin size={12} />
          <span className="truncate">{listing.location.name}</span>
          {listing.location.city && (
            <span className="truncate text-muted-foreground/70">· {listing.location.city}</span>
          )}
        </div>

        {/* Temperature */}
        {listing.coolingUnit.latestTemperature != null && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Thermometer size={12} />
            <span>{listing.coolingUnit.latestTemperature.toFixed(1)}°C</span>
          </div>
        )}

        {/* Add to cart */}
        <Button
          size="sm"
          className="w-full mt-auto bg-green-600 hover:bg-green-700 gap-1.5"
          onClick={() => onAddToCart(listing)}
          disabled={adding}
        >
          <ShoppingCart size={14} />
          Add to Cart
        </Button>
      </CardContent>
    </Card>
  );
}

export default function MarketplacePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCropId, setSelectedCropId] = useState<string>("all");
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
  const [addingId, setAddingId] = useState<number | null>(null);

  const { data: locations } = useLocations();
  const { data: crops } = useCrops();

  // Auto-select first location once loaded
  const resolvedLocationId = selectedLocationId ?? locations?.[0]?.id ?? null;
  const resolvedLocation = locations?.find((loc) => loc.id === resolvedLocationId) ?? null;
  const resolvedLocationLatLng = toLatLngFromPoint(resolvedLocation?.point);

  const { data: listings, isLoading } = useAvailableListings(
    resolvedLocationLatLng
      ? {
          location: resolvedLocationLatLng,
          ...(selectedCropId !== "all" ? { cropId: Number(selectedCropId) } : {}),
        }
      : undefined
  );
  const { cart } = useShoppingCartStore();

  const cartItemCount = cart?.items.length ?? 0;

  const filteredListings = listings?.filter((l) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      l.crop.name.toLowerCase().includes(q) ||
      l.coolingUnit.name.toLowerCase().includes(q) ||
      l.location.name.toLowerCase().includes(q)
    );
  });

  async function handleAddToCart(listing: AvailableListing) {
    setAddingId(listing.id);
    try {
      await marketplaceService.addCartItem({ listingId: listing.id });
      toast.success(`${listing.crop.name} added to cart`);
    } catch {
      toast.error("Failed to add item to cart");
    } finally {
      setAddingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">Marketplace</h2>
          <p className="text-muted-foreground text-sm">
            Browse fresh produce available for purchase
          </p>
        </div>

        <Link
          href={ROUTES.MARKETPLACE_CART}
          className="relative inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted self-start sm:self-auto"
        >
          <ShoppingCart size={16} />
          Cart
          {cartItemCount > 0 && (
            <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-green-600 text-white text-xs flex items-center justify-center font-medium">
              {cartItemCount}
            </span>
          )}
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2 flex-1 flex-wrap">
          <Filter size={16} className="text-muted-foreground shrink-0" />
          <Select
            value={resolvedLocationId?.toString() ?? ""}
            onValueChange={(v) => setSelectedLocationId(Number(v))}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select location" />
            </SelectTrigger>
            <SelectContent>
              {locations?.map((loc) => (
                <SelectItem key={loc.id} value={loc.id.toString()}>
                  {loc.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedCropId} onValueChange={(v) => setSelectedCropId(v ?? "all")}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All crops" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Crops</SelectItem>
              {crops?.map((crop: Crop) => (
                <SelectItem key={crop.id} value={crop.id.toString()}>
                  {crop.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Input
          placeholder="Search by crop, unit, or location..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="sm:max-w-xs"
        />
      </div>

      {/* No location selected prompt */}
      {!resolvedLocationLatLng && !isLoading && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <MapPin className="text-muted-foreground mb-3" size={40} />
            <h3 className="font-semibold mb-1">Select a location</h3>
            <p className="text-sm text-muted-foreground">
              Choose a location above to browse available listings
            </p>
          </CardContent>
        </Card>
      )}

      {/* Loading skeletons */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <ListingCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && resolvedLocationLatLng && filteredListings?.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Package className="text-muted-foreground mb-3" size={44} />
            <h3 className="font-semibold mb-1">No listings found</h3>
            <p className="text-sm text-muted-foreground">
              {searchQuery || selectedCropId !== "all"
                ? "Try adjusting your filters"
                : "No produce is currently listed for sale"}
            </p>
            {(searchQuery || selectedCropId !== "all") && (
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCropId("all");
                }}
              >
                Clear filters
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Listings grid */}
      {!isLoading && resolvedLocationLatLng && filteredListings && filteredListings.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredListings.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              onAddToCart={handleAddToCart}
              adding={addingId === listing.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
