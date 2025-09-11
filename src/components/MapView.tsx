'use client';

import { useEffect, useRef } from 'react';
import { useDroppable } from '@dnd-kit/core';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

interface Responder {
  id: string;
  name: string;
  status: 'available' | 'assigned' | 'unavailable';
  assignedLocation?: {
    latitude: number;
    longitude: number;
    address: string;
  };
}

interface MapViewProps {
  responders: Responder[];
  onAssign: (responderId: string, location: { lat: number; lng: number; address: string }) => void;
}

export default function MapView({ responders, onAssign }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const { setNodeRef, isOver } = useDroppable({
    id: 'map-drop-zone',
  });

  useEffect(() => {
    if (map.current) return; // initialize map only once

    map.current = new maplibregl.Map({
      container: mapContainer.current!,
      style: 'https://demotiles.maplibre.org/style.json', // stylesheet location
      center: [120.9842, 14.5995], // starting position [lng, lat] - Manila
      zoom: 10, // starting zoom
    });

    map.current.on('click', (e) => {
      // Handle map click for assignment
      const { lng, lat } = e.lngLat;
      // For demo, use a placeholder address
      const address = `Location at ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      // If there's a dragged responder, assign it
      // This is simplified; in real implementation, track the dragged item
    });

    return () => {
      map.current?.remove();
    };
  }, []);

  // Add markers for assigned responders
  useEffect(() => {
    if (!map.current) return;

    responders
      .filter(r => r.status === 'assigned' && r.assignedLocation)
      .forEach(responder => {
        const marker = new maplibregl.Marker()
          .setLngLat([responder.assignedLocation!.longitude, responder.assignedLocation!.latitude])
          .addTo(map.current!);
      });
  }, [responders]);

  return (
    <div
      ref={setNodeRef}
      className={`relative h-96 rounded-lg overflow-hidden ${isOver ? 'ring-2 ring-blue-500' : ''}`}
    >
      <div ref={mapContainer} className="h-full w-full" />
      {isOver && (
        <div className="absolute inset-0 bg-blue-500 bg-opacity-20 flex items-center justify-center">
          <p className="text-white font-semibold">Drop here to assign location</p>
        </div>
      )}
    </div>
  );
}