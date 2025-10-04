export interface Location {
  latitude: number;
  longitude: number;
  accuracy?: number;
  address?: string;
}

export interface Hospital {
  id: string;
  name: string;
  type: 'hospital' | 'clinic' | 'emergency' | 'specialist';
  phone: string;
  address: string;
  location: Location;
  distance?: number; // in kilometers
  rating?: number;
  emergencyServices?: string[];
  operatingHours?: string;
  website?: string;
}

export class GeolocationService {
  private static watchId: number | null = null;

  // Get current location with high accuracy
  static async getCurrentLocation(): Promise<Location> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });
        },
        (error) => {
          switch (error.code) {
            case error.PERMISSION_DENIED:
              reject(new Error('Location access denied by user'));
              break;
            case error.POSITION_UNAVAILABLE:
              reject(new Error('Location information unavailable'));
              break;
            case error.TIMEOUT:
              reject(new Error('Location request timed out'));
              break;
            default:
              reject(new Error('Unknown location error'));
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000, // 1 minute
        }
      );
    });
  }

  // Watch location for continuous updates
  static watchLocation(
    callback: (location: Location) => void,
    errorCallback?: (error: Error) => void
  ): Promise<number> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'));
        return;
      }

      this.watchId = navigator.geolocation.watchPosition(
        (position) => {
          const location: Location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          };
          callback(location);
          resolve(this.watchId!);
        },
        (error) => {
          const locationError = new Error('Location tracking error');
          if (errorCallback) {
            errorCallback(locationError);
          }
          reject(locationError);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 30000, // 30 seconds
        }
      );
    });
  }

  // Stop watching location
  static stopWatching(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  // Calculate distance between two points using Haversine formula
  static calculateDistance(
    point1: Location,
    point2: Location
  ): number {
    const R = 6371; // Earth's radius in kilometers

    const lat1Rad = (point1.latitude * Math.PI) / 180;
    const lat2Rad = (point2.latitude * Math.PI) / 180;
    const deltaLatRad = ((point2.latitude - point1.latitude) * Math.PI) / 180;
    const deltaLngRad = ((point2.longitude - point1.longitude) * Math.PI) / 180;

    const a =
      Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
      Math.cos(lat1Rad) *
        Math.cos(lat2Rad) *
        Math.sin(deltaLngRad / 2) *
        Math.sin(deltaLngRad / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // Get address from coordinates (reverse geocoding)
  static async getAddressFromCoordinates(location: Location): Promise<string> {
    try {
      // Using a simple geocoding service (you might want to use Google Maps API)
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${location.latitude}&longitude=${location.longitude}&localityLanguage=en`
      );

      if (!response.ok) {
        throw new Error('Geocoding request failed');
      }

      const data = await response.json();
      return data.localityInfo?.administrative?.[2]?.name || data.city || 'Unknown location';
    } catch (error) {
      console.warn('Reverse geocoding failed:', error);
      return 'Unknown location';
    }
  }
}

export class HospitalService {
  private static hospitals: Hospital[] = [
    // Sample hospital data - in a real app, this would come from an API
    {
      id: '1',
      name: 'City General Hospital',
      type: 'hospital',
      phone: '+1-555-0101',
      address: '123 Medical Center Dr, City, State 12345',
      location: { latitude: 40.7128, longitude: -74.0060 },
      emergencyServices: ['Emergency Room', 'ICU', 'Surgery'],
      operatingHours: '24/7',
      rating: 4.5,
    },
    {
      id: '2',
      name: 'Regional Medical Center',
      type: 'hospital',
      phone: '+1-555-0102',
      address: '456 Healthcare Ave, City, State 12345',
      location: { latitude: 40.7589, longitude: -73.9851 },
      emergencyServices: ['Emergency Room', 'Cardiology', 'Neurology'],
      operatingHours: '24/7',
      rating: 4.2,
    },
    {
      id: '3',
      name: 'Urgent Care Clinic',
      type: 'clinic',
      phone: '+1-555-0103',
      address: '789 Urgent Care Blvd, City, State 12345',
      location: { latitude: 40.7282, longitude: -73.7949 },
      emergencyServices: ['Urgent Care', 'Minor Surgery'],
      operatingHours: '8 AM - 10 PM',
      rating: 4.0,
    },
    {
      id: '4',
      name: 'Emergency Medical Services',
      type: 'emergency',
      phone: '+1-555-0104',
      address: '321 Emergency Way, City, State 12345',
      location: { latitude: 40.7505, longitude: -73.9934 },
      emergencyServices: ['Emergency Response', 'Ambulance'],
      operatingHours: '24/7',
      rating: 4.8,
    },
    {
      id: '5',
      name: 'Specialist Heart Center',
      type: 'specialist',
      phone: '+1-555-0105',
      address: '654 Cardiac Care St, City, State 12345',
      location: { latitude: 40.7144, longitude: -74.0026 },
      emergencyServices: ['Cardiology', 'Cardiac Surgery'],
      operatingHours: '7 AM - 7 PM',
      rating: 4.6,
    },
  ];

  // Get hospitals near a location
  static async getNearbyHospitals(
    userLocation: Location,
    radiusKm: number = 10,
    limit: number = 20
  ): Promise<Hospital[]> {
    // In a real app, this would query a hospital database API
    const hospitalsWithDistance = this.hospitals.map(hospital => ({
      ...hospital,
      distance: GeolocationService.calculateDistance(userLocation, hospital.location),
    }));

    return hospitalsWithDistance
      .filter(hospital => hospital.distance <= radiusKm)
      .sort((a, b) => (a.distance || 0) - (b.distance || 0))
      .slice(0, limit);
  }

  // Search hospitals by name or type
  static searchHospitals(query: string, userLocation?: Location): Hospital[] {
    const lowerQuery = query.toLowerCase();

    return this.hospitals.filter(hospital =>
      hospital.name.toLowerCase().includes(lowerQuery) ||
      hospital.type.toLowerCase().includes(lowerQuery) ||
      hospital.emergencyServices?.some(service =>
        service.toLowerCase().includes(lowerQuery)
      )
    );
  }

  // Get hospital by ID
  static getHospitalById(id: string): Hospital | undefined {
    return this.hospitals.find(hospital => hospital.id === id);
  }

  // Get emergency numbers for the area
  static getEmergencyNumbers(): { [key: string]: string } {
    return {
      emergency: '911',
      police: '911',
      fire: '911',
      ambulance: '911',
      poison_control: '1-800-222-1222',
      suicide_prevention: '988',
      domestic_violence: '1-800-799-7233',
    };
  }

  // Call emergency services
  static callEmergency(type: keyof ReturnType<typeof HospitalService.getEmergencyNumbers> = 'emergency'): void {
    const numbers = this.getEmergencyNumbers();
    const number = numbers[type];

    if (number) {
      window.location.href = `tel:${number}`;
    } else {
      console.error('Emergency number not found for type:', type);
    }
  }
}

export class EmergencyAlertService {
  // Send emergency alert with location
  static async sendEmergencyAlert(
    location: Location,
    message: string = 'Emergency - Please help!',
    contacts: string[] = []
  ): Promise<boolean> {
    try {
      // In a real app, this would send alerts via SMS, email, or push notifications
      const alertData = {
        location,
        message,
        timestamp: new Date().toISOString(),
        contacts,
      };

      // For now, we'll just log it (in production, send to emergency services)
      console.log('Emergency Alert Sent:', alertData);

      // You could integrate with services like:
      // - Twilio for SMS alerts
      // - SendGrid for email alerts
      // - Firebase Cloud Messaging for push notifications

      return true;
    } catch (error) {
      console.error('Failed to send emergency alert:', error);
      return false;
    }
  }

  // Get user's emergency contacts (in a real app, this would be stored in the database)
  static getEmergencyContacts(): { name: string; phone: string; relationship: string }[] {
    return [
      // Default emergency contacts - in a real app, these would be user-configurable
      { name: 'Emergency Services', phone: '911', relationship: 'Emergency' },
    ];
  }
}
