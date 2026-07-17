import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { MapPin, Search, Crosshair } from "lucide-react";

interface Props {
  label: string;
  mapboxToken: string;
  address: string;
  lat: number | null;
  lng: number | null;
  onChange: (v: { address: string; lat: number | null; lng: number | null }) => void;
  markerColor?: string;
}

// Centro por defecto: Apodaca, N.L. (área del cliente)
const DEFAULT_CENTER: [number, number] = [-100.19, 25.78];

export default function AddressPicker({
  label, mapboxToken, address, lat, lng, onChange, markerColor = "#2563eb",
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const [query, setQuery] = useState(address || "");
  const [searching, setSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const onChangeRef = useRef(onChange);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

  useEffect(() => { setQuery(address || ""); }, [address]);

  // Inicializa el mapa una sola vez
  useEffect(() => {
    if (!containerRef.current || !mapboxToken || mapRef.current) return;
    mapboxgl.accessToken = mapboxToken;
    const start: [number, number] = lat != null && lng != null ? [lng, lat] : DEFAULT_CENTER;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: start,
      zoom: lat != null && lng != null ? 14 : 10,
    });
    map.addControl(new mapboxgl.NavigationControl(), "top-right");
    mapRef.current = map;

    const marker = new mapboxgl.Marker({ color: markerColor, draggable: true })
      .setLngLat(start)
      .addTo(map);
    markerRef.current = marker;

    const commit = async () => {
      const { lng: mlng, lat: mlat } = marker.getLngLat();
      // Reverse geocoding para actualizar la dirección
      try {
        const res = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${mlng},${mlat}.json?access_token=${mapboxToken}&language=es&limit=1`
        );
        const j = await res.json();
        const place = j?.features?.[0]?.place_name || `${mlat.toFixed(5)}, ${mlng.toFixed(5)}`;
        setQuery(place);
        onChangeRef.current({ address: place, lat: mlat, lng: mlng });
      } catch {
        onChangeRef.current({ address: `${mlat.toFixed(5)}, ${mlng.toFixed(5)}`, lat: mlat, lng: mlng });
      }
    };

    marker.on("dragend", commit);
    map.on("click", (e) => {
      marker.setLngLat(e.lngLat);
      commit();
    });

    return () => { map.remove(); mapRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapboxToken]);

  // Sync marker si cambian coords externas
  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return;
    if (lat != null && lng != null) {
      markerRef.current.setLngLat([lng, lat]);
      mapRef.current.flyTo({ center: [lng, lat], zoom: 14 });
    }
  }, [lat, lng]);

  const search = async () => {
    if (!query.trim() || !mapboxToken) return;
    setSearching(true);
    try {
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${mapboxToken}&language=es&country=mx&limit=5`
      );
      const j = await res.json();
      setSuggestions(j?.features || []);
      const f = j?.features?.[0];
      if (f) {
        const [flng, flat] = f.center;
        onChange({ address: f.place_name, lat: flat, lng: flng });
      }
    } finally { setSearching(false); }
  };

  const pickSuggestion = (f: any) => {
    const [flng, flat] = f.center;
    setQuery(f.place_name);
    setSuggestions([]);
    onChange({ address: f.place_name, lat: flat, lng: flng });
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      try {
        const res = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${c.lng},${c.lat}.json?access_token=${mapboxToken}&language=es&limit=1`
        );
        const j = await res.json();
        const place = j?.features?.[0]?.place_name || `${c.lat.toFixed(5)}, ${c.lng.toFixed(5)}`;
        setQuery(place);
        onChange({ address: place, lat: c.lat, lng: c.lng });
      } catch {
        onChange({ address: `${c.lat.toFixed(5)}, ${c.lng.toFixed(5)}`, lat: c.lat, lng: c.lng });
      }
    });
  };

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {label}</Label>
      <div className="flex gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); search(); } }}
          placeholder="Buscar dirección (calle, colonia, ciudad...)"
        />
        <Button type="button" size="icon" variant="outline" onClick={search} disabled={searching} title="Buscar">
          <Search className="h-4 w-4" />
        </Button>
        <Button type="button" size="icon" variant="outline" onClick={useMyLocation} title="Mi ubicación">
          <Crosshair className="h-4 w-4" />
        </Button>
      </div>
      {suggestions.length > 1 && (
        <div className="border rounded-md bg-popover text-sm divide-y max-h-40 overflow-auto">
          {suggestions.map((s) => (
            <button
              type="button"
              key={s.id}
              className="w-full text-left px-2 py-1 hover:bg-muted"
              onClick={() => pickSuggestion(s)}
            >
              {s.place_name}
            </button>
          ))}
        </div>
      )}
      <div ref={containerRef} className="w-full h-52 rounded-md overflow-hidden border" />
      <p className="text-xs text-muted-foreground">
        Arrastra el pin o toca el mapa para ajustar la ubicación exacta.
        {lat != null && lng != null && (
          <> · <span className="font-mono">{lat.toFixed(5)}, {lng.toFixed(5)}</span></>
        )}
      </p>
    </div>
  );
}
