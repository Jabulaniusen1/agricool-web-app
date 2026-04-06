import { useState, useCallback } from "react";
import { ENV } from "@/constants/environment";

export type MapboxAddressResult = {
  latitude: number;
  longitude: number;
  city: string;
  state: string;
  street: string;
  zipCode: string;
};

type MapboxFeature = {
  center: [number, number];
  text?: string;
  address?: string;
  context?: { id: string; text: string }[];
};

async function reverseGeocode(lat: number, lng: number): Promise<MapboxAddressResult> {
  const token = ENV.MAPBOX_ACCESS_TOKEN;
  if (!token) throw new Error("Mapbox token not configured");

  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${token}&types=address,place,region,postcode&limit=1`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Geocoding request failed");

  const data = await res.json() as { features: MapboxFeature[] };
  const feature = data.features?.[0];
  if (!feature) throw new Error("No results found");

  const contextMap: Record<string, string> = {};
  for (const ctx of feature.context ?? []) {
    const type = ctx.id.split(".")[0];
    contextMap[type] = ctx.text;
  }

  return {
    latitude: lat,
    longitude: lng,
    street: [feature.address, feature.text].filter(Boolean).join(" "),
    city: contextMap["place"] ?? contextMap["locality"] ?? "",
    state: contextMap["region"] ?? "",
    zipCode: contextMap["postcode"] ?? "",
  };
}

export function useMapboxLocation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getLocation = useCallback(async (): Promise<MapboxAddressResult | null> => {
    setError(null);

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return null;
    }

    setLoading(true);
    try {
      const getPosition = (highAccuracy: boolean) =>
        new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: highAccuracy,
            timeout: highAccuracy ? 10000 : 8000,
          });
        });

      let position: GeolocationPosition;
      try {
        position = await getPosition(true);
      } catch (err) {
        // kCLErrorLocationUnknown / POSITION_UNAVAILABLE — retry without high accuracy
        if (
          err instanceof GeolocationPositionError &&
          err.code === err.POSITION_UNAVAILABLE
        ) {
          position = await getPosition(false);
        } else {
          throw err;
        }
      }

      const { latitude, longitude } = position.coords;
      const result = await reverseGeocode(latitude, longitude);
      return result;
    } catch (err) {
      if (err instanceof GeolocationPositionError) {
        if (err.code === err.PERMISSION_DENIED) setError("Location access denied");
        else if (err.code === err.TIMEOUT) setError("Location request timed out");
        else setError("Could not determine your location");
      } else {
        setError("Failed to look up address from coordinates");
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { getLocation, loading, error };
}
