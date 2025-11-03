import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface Trip {
  id: string;
  unidad: string;
  operador: string;
  origen: string;
  destino: string;
  ubicacion_actual: string | null;
  estado: string;
  ultima_actualizacion_ubicacion: string | null;
}

interface TripsMapProps {
  trips: Trip[];
  mapboxToken: string;
}

export default function TripsMap({ trips, mapboxToken }: TripsMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    // Initialize map
    mapboxgl.accessToken = mapboxToken;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-100.31, 25.67], // Centro de México (Monterrey)
      zoom: 5,
    });

    // Add navigation controls
    map.current.addControl(
      new mapboxgl.NavigationControl(),
      'top-right'
    );

    // Add markers for trips with locations
    trips.forEach((trip) => {
      if (trip.ubicacion_actual && map.current) {
        // Create a popup with trip details
        const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
          <div style="padding: 8px;">
            <h3 style="font-weight: bold; margin-bottom: 4px;">${trip.unidad}</h3>
            <p style="margin: 2px 0; font-size: 14px;"><strong>Operador:</strong> ${trip.operador}</p>
            <p style="margin: 2px 0; font-size: 14px;"><strong>Ruta:</strong> ${trip.origen} → ${trip.destino}</p>
            <p style="margin: 2px 0; font-size: 14px;"><strong>Estado:</strong> ${trip.estado}</p>
            <p style="margin: 2px 0; font-size: 14px;"><strong>Ubicación:</strong> ${trip.ubicacion_actual}</p>
            ${trip.ultima_actualizacion_ubicacion ? `<p style="margin: 2px 0; font-size: 12px; color: #666;">Actualizado: ${new Date(trip.ultima_actualizacion_ubicacion).toLocaleString('es-MX')}</p>` : ''}
          </div>
        `);

        // Parse location (assuming format like "25.6866,-100.3161" or Google Plus Code)
        // For now, we'll use a placeholder center point
        // In production, you'd geocode the ubicacion_actual string
        const marker = new mapboxgl.Marker({
          color: trip.estado === 'en_transito' ? '#22c55e' : '#6366f1'
        })
          .setLngLat([-100.31 + Math.random() * 2, 25.67 + Math.random() * 2]) // Random points for demo
          .setPopup(popup)
          .addTo(map.current);
      }
    });

    // Cleanup
    return () => {
      map.current?.remove();
    };
  }, [trips, mapboxToken]);

  return (
    <div className="relative w-full h-[500px] rounded-lg overflow-hidden border border-border">
      <div ref={mapContainer} className="absolute inset-0" />
    </div>
  );
}
