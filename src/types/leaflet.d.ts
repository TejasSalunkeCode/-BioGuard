// Leaflet type declarations for TypeScript
declare global {
  namespace L {
    export interface Map {
      setView(center: [number, number], zoom: number): this;
      remove(): this;
    }

    export interface Marker {
      addTo(map: Map): this;
      bindPopup(content: string): this;
      getLatLng(): LatLng;
      on(event: string, handler: Function): this;
    }

    export interface LatLng {
      lat: number;
      lng: number;
    }

    export interface Polyline {
      addTo(map: Map): this;
    }

    export interface FeatureGroup {
      getBounds(): LatLngBounds;
    }

    export interface LatLngBounds {
      pad(ratio: number): this;
    }

    export interface TileLayer {
      addTo(map: Map): this;
    }

    export interface DivIcon {
      new (options?: any): DivIcon;
    }

    export function map(element: string | HTMLElement): Map;
    export function marker(latlng: [number, number], options?: any): Marker;
    export function polyline(latlngs: [number, number][], options?: any): Polyline;
    export function tileLayer(urlTemplate: string, options?: any): TileLayer;
    export function divIcon(options?: any): DivIcon;
    export function featureGroup(layers?: any[]): FeatureGroup;
    export function latLng(lat: number, lng: number): LatLng;
  }

  interface Window {
    callHospital: (phone: string) => void;
    getDirections: (hospitalId: string) => void;
  }
}

export {};
