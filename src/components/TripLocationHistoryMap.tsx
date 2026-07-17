import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { MapPin } from "lucide-react";

interface Props {
  viajeId: string;
  mapboxToken: string;
}

interface Punto {
  id: string;
  evento: string;
  lat: number | null;
  lng: number | null;
  ubicacion_texto: string | null;
  created_at: string;
}

const EVENTO_LABEL: Record<string, string> = {
  en_zona_carga: "En zona de carga",
  en_transito: "Inicio de recorrido",
  completado: "Viaje finalizado",
};
const EVENTO_COLOR: Record<string, string> = {
  en_zona_carga: "#f59e0b",
  en_transito: "#3b82f6",
  completado: "#16a34a",
};

export default function TripLocationHistoryMap({ viajeId, mapboxToken }: Props) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [puntos, setPuntos] = useState<Punto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await (supabase as any)
        .from("operador_ubicaciones_historial")
        .select("id, evento, lat, lng, ubicacion_texto, created_at")
        .eq("viaje_id", viajeId)
        .order("created_at", { ascending: true });
      setPuntos((data as Punto[]) || []);
      setLoading(false);
    })();
  }, [viajeId]);

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;
    const conCoords = puntos.filter((p) => p.lat != null && p.lng != null);

    mapboxgl.accessToken = mapboxToken;
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: conCoords.length
        ? [conCoords[0].lng!, conCoords[0].lat!]
        : [-100.31, 25.67],
      zoom: conCoords.length ? 10 : 5,
    });
    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    const bounds = new mapboxgl.LngLatBounds();
    conCoords.forEach((p, i) => {
      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div style="padding:6px;font-size:13px">
          <strong>${i + 1}. ${EVENTO_LABEL[p.evento] || p.evento}</strong><br/>
          ${new Date(p.created_at).toLocaleString("es-MX")}<br/>
          <span style="color:#666">${p.lat!.toFixed(5)}, ${p.lng!.toFixed(5)}</span>
        </div>`);
      new mapboxgl.Marker({ color: EVENTO_COLOR[p.evento] || "#6366f1" })
        .setLngLat([p.lng!, p.lat!])
        .setPopup(popup)
        .addTo(map.current!);
      bounds.extend([p.lng!, p.lat!]);
    });

    if (conCoords.length >= 2) {
      map.current.on("load", () => {
        map.current!.addSource("ruta", {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: {
              type: "LineString",
              coordinates: conCoords.map((p) => [p.lng!, p.lat!]),
            },
          },
        });
        map.current!.addLayer({
          id: "ruta",
          type: "line",
          source: "ruta",
          layout: { "line-join": "round", "line-cap": "round" },
          paint: { "line-color": "#6366f1", "line-width": 3, "line-dasharray": [2, 1] },
        });
      });
      map.current.fitBounds(bounds, { padding: 60, maxZoom: 13 });
    }

    return () => { map.current?.remove(); };
  }, [puntos, mapboxToken]);

  if (loading) return <p className="text-sm text-muted-foreground">Cargando historial de ubicaciones…</p>;

  if (puntos.length === 0)
    return <p className="text-sm text-muted-foreground">Sin ubicaciones registradas para este viaje.</p>;

  const conCoords = puntos.filter((p) => p.lat != null && p.lng != null);

  return (
    <div className="space-y-3">
      {conCoords.length > 0 && (
        <div className="relative w-full h-[350px] rounded-lg overflow-hidden border">
          <div ref={mapContainer} className="absolute inset-0" />
        </div>
      )}
      <div className="space-y-2">
        {puntos.map((p, i) => (
          <div key={p.id} className="flex items-start gap-2 text-sm border-l-2 pl-2" style={{ borderColor: EVENTO_COLOR[p.evento] }}>
            <MapPin className="h-4 w-4 mt-0.5" style={{ color: EVENTO_COLOR[p.evento] }} />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{i + 1}. {EVENTO_LABEL[p.evento] || p.evento}</span>
                <Badge variant="outline" className="text-xs">
                  {new Date(p.created_at).toLocaleString("es-MX")}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {p.lat != null && p.lng != null
                  ? `${p.lat.toFixed(6)}, ${p.lng.toFixed(6)}`
                  : "Sin coordenadas"}
                {p.ubicacion_texto && p.ubicacion_texto !== `${p.lat},${p.lng}` ? ` · ${p.ubicacion_texto}` : ""}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
