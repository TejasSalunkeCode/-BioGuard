import { Location, Hospital } from './emergencyServices';

export interface MapConfig {
  center: [number, number];
  zoom: number;
  hospitals: Hospital[];
  userLocation?: Location;
}

export class MapService {
  private static map: L.Map | null = null;
  private static userMarker: L.Marker | null = null;
  private static hospitalMarkers: L.Marker[] = [];
  private static routeLine: L.Polyline | null = null;

  // Initialize map
  static async initializeMap(containerId: string, config: MapConfig): Promise<void> {
    try {
      // Dynamically import Leaflet CSS if not already loaded
      if (!document.querySelector('link[href*="leaflet"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      // Wait for Leaflet to be available
      if (typeof L === 'undefined') {
        await this.loadLeaflet();
      }

      // Initialize map
      this.map = L.map(containerId).setView(config.center, config.zoom);

      // Add OpenStreetMap tiles (free alternative to Google Maps)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(this.map);

      // Add hospitals to map
      this.addHospitalsToMap(config.hospitals);

      // Add user location if available
      if (config.userLocation) {
        this.addUserLocation(config.userLocation);
      }

    } catch (error) {
      console.error('Failed to initialize map:', error);
      throw error;
    }
  }

  // Load Leaflet library dynamically
  private static async loadLeaflet(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof L !== 'undefined') {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Leaflet'));
      document.head.appendChild(script);
    });
  }

  // Add user location marker
  static addUserLocation(location: Location): void {
    if (!this.map) return;

    // Remove existing user marker
    if (this.userMarker) {
      this.map.removeLayer(this.userMarker);
    }

    // Create custom icon for user location
    const userIcon = L.divIcon({
      html: '📍',
      className: 'user-location-marker',
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    });

    this.userMarker = L.marker([location.latitude, location.longitude], {
      icon: userIcon,
      title: 'Your Location',
    }).addTo(this.map);

    // Add popup with location info
    this.userMarker.bindPopup(`
      <div class="text-sm">
        <h4 class="font-semibold">Your Location</h4>
        <p>Lat: ${location.latitude.toFixed(6)}</p>
        <p>Lng: ${location.longitude.toFixed(6)}</p>
        ${location.accuracy ? `<p>Accuracy: ${location.accuracy.toFixed(0)}m</p>` : ''}
      </div>
    `);
  }

  // Add hospitals to map
  static addHospitalsToMap(hospitals: Hospital[]): void {
    if (!this.map) return;

    // Clear existing hospital markers
    this.hospitalMarkers.forEach(marker => {
      this.map!.removeLayer(marker);
    });
    this.hospitalMarkers = [];

    hospitals.forEach(hospital => {
      const iconHtml = this.getHospitalIcon(hospital.type);
      const hospitalIcon = L.divIcon({
        html: iconHtml,
        className: 'hospital-marker',
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      const marker = L.marker([hospital.location.latitude, hospital.location.longitude], {
        icon: hospitalIcon,
        title: hospital.name,
      }).addTo(this.map!);

      // Add popup with hospital information
      marker.bindPopup(this.createHospitalPopup(hospital));

      // Add click handler for directions
      marker.on('click', () => {
        this.showDirections(hospital);
      });

      this.hospitalMarkers.push(marker);
    });
  }

  // Get icon HTML based on hospital type
  private static getHospitalIcon(type: Hospital['type']): string {
    const icons = {
      hospital: '🏥',
      clinic: '🏥',
      emergency: '🚑',
      specialist: '🏥',
    };
    return icons[type] || '🏥';
  }

  // Create hospital popup content
  private static createHospitalPopup(hospital: Hospital): string {
    return `
      <div class="text-sm max-w-xs">
        <h3 class="font-semibold text-base mb-2">${hospital.name}</h3>
        <p class="mb-1"><strong>Type:</strong> ${hospital.type.charAt(0).toUpperCase() + hospital.type.slice(1)}</p>
        <p class="mb-1"><strong>Phone:</strong> <a href="tel:${hospital.phone}" class="text-blue-600">${hospital.phone}</a></p>
        <p class="mb-2"><strong>Address:</strong> ${hospital.address}</p>
        ${hospital.distance !== undefined ? `<p class="mb-1"><strong>Distance:</strong> ${hospital.distance.toFixed(1)} km</p>` : ''}
        ${hospital.rating ? `<p class="mb-1"><strong>Rating:</strong> ⭐ ${hospital.rating}</p>` : ''}
        ${hospital.operatingHours ? `<p class="mb-1"><strong>Hours:</strong> ${hospital.operatingHours}</p>` : ''}
        ${hospital.emergencyServices?.length ? `
          <div class="mt-2">
            <strong>Services:</strong>
            <div class="flex flex-wrap gap-1 mt-1">
              ${hospital.emergencyServices.map(service => `<span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">${service}</span>`).join('')}
            </div>
          </div>
        ` : ''}
        <div class="mt-2">
          <button onclick="window.callHospital('${hospital.phone}')" class="bg-red-500 text-white px-3 py-1 rounded text-xs mr-2">Call Now</button>
          <button onclick="window.getDirections('${hospital.id}')" class="bg-blue-500 text-white px-3 py-1 rounded text-xs">Directions</button>
        </div>
      </div>
    `;
  }

  // Show directions to a hospital
  static showDirections(hospital: Hospital): void {
    if (!this.map || !this.userMarker) {
      alert('Please enable location services to get directions');
      return;
    }

    // Remove existing route
    if (this.routeLine) {
      this.map.removeLayer(this.routeLine);
    }

    // Create route line (simplified - in a real app, you'd use a routing service)
    this.routeLine = L.polyline([
      [this.userMarker.getLatLng().lat, this.userMarker.getLatLng().lng],
      [hospital.location.latitude, hospital.location.longitude],
    ], {
      color: 'blue',
      weight: 4,
      opacity: 0.7,
      dashArray: '10, 10',
    }).addTo(this.map);

    // Fit map to show both points
    const group = new L.FeatureGroup([
      this.userMarker,
      L.marker([hospital.location.latitude, hospital.location.longitude]),
    ]);
    this.map.fitBounds(group.getBounds().pad(0.1));

    // Show estimated time and distance
    const distance = hospital.distance || 0;
    const estimatedTime = Math.ceil(distance * 2); // Rough estimate: 2 minutes per km

    alert(`Directions to ${hospital.name}:\nDistance: ${distance.toFixed(1)} km\nEstimated time: ${estimatedTime} minutes`);
  }

  // Update map center
  static setCenter(latitude: number, longitude: number, zoom?: number): void {
    if (this.map) {
      this.map.setView([latitude, longitude], zoom || this.map.getZoom());
    }
  }

  // Add routing (simplified version)
  static async getDirectionsToHospital(hospital: Hospital): Promise<{
    distance: number;
    duration: number;
    instructions: string[];
  }> {
    if (!this.userMarker) {
      throw new Error('User location not available');
    }

    const userLatLng = this.userMarker.getLatLng();
    const hospitalLatLng = L.latLng(hospital.location.latitude, hospital.location.longitude);

    const distance = this.map!.distance(userLatLng, hospitalLatLng) / 1000; // Convert to km
    const duration = Math.ceil(distance * 2); // Rough estimate

    return {
      distance,
      duration,
      instructions: [
        `Drive ${distance.toFixed(1)} km to ${hospital.name}`,
        `Estimated time: ${duration} minutes`,
        'Follow the marked route on the map',
      ],
    };
  }

  // Cleanup
  static cleanup(): void {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
    this.userMarker = null;
    this.hospitalMarkers = [];
    this.routeLine = null;
  }

  // Check if map is initialized
  static isInitialized(): boolean {
    return this.map !== null;
  }
}

// Extend window object for popup button handlers
declare global {
  interface Window {
    callHospital: (phone: string) => void;
    getDirections: (hospitalId: string) => void;
  }
}

// Initialize global functions for popup buttons
if (typeof window !== 'undefined') {
  window.callHospital = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  window.getDirections = (hospitalId: string) => {
    // This would need to be implemented with the hospital service
    console.log('Getting directions for hospital:', hospitalId);
  };
}
