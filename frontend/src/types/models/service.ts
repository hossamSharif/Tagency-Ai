import { Timestamp } from 'firebase/firestore';
import { CurrencyCode } from './tenant';

/**
 * Service categories
 */
export type ServiceCategory = 'flight' | 'hotel' | 'visa' | 'transport' | 'guide' | 'meal' | 'other';

/**
 * Service entity - represents a service within a package
 * Collection: `tenants/{tenantId}/packages/{packageId}/services/{serviceId}`
 */
export interface Service {
  /** Firestore document ID */
  id: string;
  /** Service name */
  name: string;
  /** Service description */
  description?: string;

  /** Service category */
  category: ServiceCategory;

  /** Service price */
  price: number;
  /** Currency (inherited from package) */
  currency: CurrencyCode;

  /** When the service is scheduled */
  serviceDate?: Timestamp;
  /** Duration in hours */
  duration?: number;

  /** Service provider (airline, hotel name, etc.) */
  provider?: string;
  /** Provider reference/confirmation number */
  providerReference?: string;

  /** Whether this service is outsourced to a partner */
  isOutsourced: boolean;
  /** Partner office ID (if outsourced) */
  partnerOfficeId?: string;
  /** Partner office name (denormalized) */
  partnerOfficeName?: string;
  /** Commission percentage for partner (if outsourced) */
  commissionPercentage?: number;

  /** Category-specific details */
  details?: ServiceDetails;

  /** Display order in service list */
  displayOrder: number;

  /** When created */
  createdAt: Timestamp;
  /** When last updated */
  updatedAt: Timestamp;
}

/**
 * Flight-specific details
 */
export interface FlightDetails {
  airline: string;
  flightNumber: string;
  departure: {
    airport: string;
    city: string;
    dateTime: Timestamp;
  };
  arrival: {
    airport: string;
    city: string;
    dateTime: Timestamp;
  };
  class: 'economy' | 'business' | 'first';
  baggage: string;
}

/**
 * Hotel-specific details
 */
export interface HotelDetails {
  hotelName: string;
  starRating: number;
  roomType: string;
  checkIn: Timestamp;
  checkOut: Timestamp;
  nights: number;
  mealPlan: 'bb' | 'hb' | 'fb' | 'ai' | 'ro'; // Breakfast, Half, Full, All-Inclusive, Room Only
  address: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

/**
 * Transport-specific details
 */
export interface TransportDetails {
  vehicleType: 'bus' | 'car' | 'van' | 'coach';
  capacity: number;
  from: string;
  to: string;
  pickupTime?: Timestamp;
  driverContact?: string;
}

/**
 * Visa-specific details
 */
export interface VisaDetails {
  visaType: string;
  processingTime: number; // days
  requirements: string[];
}

/**
 * Guide-specific details
 */
export interface GuideDetails {
  guideName?: string;
  languages: string[];
  tourType: string;
}

/**
 * Union type for all service details
 */
export type ServiceDetails =
  | FlightDetails
  | HotelDetails
  | TransportDetails
  | VisaDetails
  | GuideDetails
  | Record<string, unknown>;

/**
 * Service creation input
 */
export type ServiceCreateInput = Omit<Service, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Service update input
 */
export type ServiceUpdateInput = Partial<Omit<Service, 'id' | 'createdAt' | 'updatedAt'>>;

/**
 * Service category display info
 */
export const SERVICE_CATEGORY_INFO: Record<
  ServiceCategory,
  { label: string; labelAr: string; icon: string }
> = {
  flight: { label: 'Flight', labelAr: 'طيران', icon: 'plane' },
  hotel: { label: 'Hotel', labelAr: 'فندق', icon: 'hotel' },
  visa: { label: 'Visa', labelAr: 'تأشيرة', icon: 'file-text' },
  transport: { label: 'Transport', labelAr: 'نقل', icon: 'bus' },
  guide: { label: 'Guide', labelAr: 'مرشد', icon: 'user' },
  meal: { label: 'Meal', labelAr: 'وجبات', icon: 'utensils' },
  other: { label: 'Other', labelAr: 'أخرى', icon: 'package' },
};

/**
 * Calculate total service price for a package
 */
export function calculateTotalServicesPrice(services: Service[]): number {
  return services.reduce((total, service) => total + service.price, 0);
}

/**
 * Calculate total commissions for outsourced services
 */
export function calculateTotalCommissions(services: Service[]): number {
  return services
    .filter((s) => s.isOutsourced && s.commissionPercentage)
    .reduce((total, service) => {
      const commission = (service.price * (service.commissionPercentage || 0)) / 100;
      return total + commission;
    }, 0);
}

/**
 * Get services grouped by category
 */
export function groupServicesByCategory(
  services: Service[]
): Record<ServiceCategory, Service[]> {
  return services.reduce(
    (groups, service) => {
      if (!groups[service.category]) {
        groups[service.category] = [];
      }
      groups[service.category].push(service);
      return groups;
    },
    {} as Record<ServiceCategory, Service[]>
  );
}

/**
 * Sort services by display order
 */
export function sortServicesByOrder(services: Service[]): Service[] {
  return [...services].sort((a, b) => a.displayOrder - b.displayOrder);
}
