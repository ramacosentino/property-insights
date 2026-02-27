import { useRef, useCallback, useState } from "react";
import * as L from "leaflet";
import "leaflet-draw";
import "leaflet-draw/dist/leaflet.draw.css";

export interface DrawnPolygon {
  layer: L.Polygon;
  latlngs: L.LatLng[];
}

/**
 * Hook to manage polygon drawing on a Leaflet map.
 * Returns controls to start/stop/clear drawing and a filter function.
 */
export function useMapDraw(mapRef: React.MutableRefObject<L.Map | null>) {
  const drawControlRef = useRef<L.Control.Draw | null>(null);
  const drawnLayerRef = useRef<L.FeatureGroup>(new L.FeatureGroup());
  const handlerRef = useRef<any>(null);
  const [polygon, setPolygon] = useState<L.LatLng[] | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const initializedRef = useRef(false);

  const initDraw = useCallback(() => {
    const map = mapRef.current;
    if (!map || initializedRef.current) return;

    drawnLayerRef.current.addTo(map);

    map.on(L.Draw.Event.CREATED, (e: any) => {
      drawnLayerRef.current.clearLayers();
      const layer = e.layer as L.Polygon;
      drawnLayerRef.current.addLayer(layer);
      const latlngs = layer.getLatLngs()[0] as L.LatLng[];
      setPolygon(latlngs);
      setIsDrawing(false);
    });

    map.on("draw:drawstop", () => {
      setIsDrawing(false);
    });

    initializedRef.current = true;
  }, [mapRef]);

  const startDraw = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    initDraw();

    // Cancel any active handler
    if (handlerRef.current) {
      try { handlerRef.current.disable(); } catch {}
    }

    const handler = new (L.Draw as any).Polygon(map, {
      shapeOptions: {
        color: "hsl(200, 85%, 42%)",
        fillColor: "hsl(200, 85%, 42%)",
        fillOpacity: 0.1,
        weight: 2,
      },
      showArea: false,
      metric: true,
    });
    handler.enable();
    handlerRef.current = handler;
    setIsDrawing(true);
  }, [mapRef, initDraw]);

  const clearDraw = useCallback(() => {
    drawnLayerRef.current.clearLayers();
    setPolygon(null);
    setIsDrawing(false);
    if (handlerRef.current) {
      try { handlerRef.current.disable(); } catch {}
      handlerRef.current = null;
    }
  }, []);

  const cancelDraw = useCallback(() => {
    setIsDrawing(false);
    if (handlerRef.current) {
      try { handlerRef.current.disable(); } catch {}
      handlerRef.current = null;
    }
  }, []);

  /**
   * Check if a point is inside the drawn polygon using ray casting.
   */
  const isInsidePolygon = useCallback(
    (lat: number, lng: number): boolean => {
      if (!polygon) return true; // no polygon = no filter
      const point = L.latLng(lat, lng);
      // Use Leaflet's built-in containsPoint via polygon bounds
      // Ray casting algorithm
      let inside = false;
      const n = polygon.length;
      for (let i = 0, j = n - 1; i < n; j = i++) {
        const xi = polygon[i].lat, yi = polygon[i].lng;
        const xj = polygon[j].lat, yj = polygon[j].lng;
        const intersect = ((yi > lng) !== (yj > lng)) &&
          (lat < (xj - xi) * (lng - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
      }
      return inside;
    },
    [polygon]
  );

  return {
    polygon,
    isDrawing,
    startDraw,
    clearDraw,
    cancelDraw,
    isInsidePolygon,
    drawnLayer: drawnLayerRef.current,
  };
}
