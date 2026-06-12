export type UserRole = "buyer" | "renter" | "seller" | "agent" | "admin";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  avatarUrl?: string;
  phone?: string;
  createdAt: string;
}

export interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  currency?: string;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  propertyType: "house" | "condo" | "apartment" | "townhouse" | "land";
  listingType: "sale" | "rent";
  address: Address;
  images: string[];
  amenities: string[];
  yearBuilt?: number;
  lotSize?: number;
  status: "active" | "pending" | "sold" | "off_market";
  agentId?: string;
  sellerId?: string;
  aiPriceEstimate?: number;
  appreciationForecast?: AppreciationForecast;
  imageTags?: ImageTag[];
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  lat: number;
  lng: number;
}

export interface AppreciationForecast {
  year1: number;
  year3: number;
  year5: number;
  year10: number;
  confidence: number;
}

export interface ImageTag {
  label: string;
  confidence: number;
  category: "room" | "feature" | "condition" | "style";
}

export type ProjectStatus =
  | "pre-launch"
  | "selling"
  | "under-construction"
  | "ready";

export interface OffPlanUnitType {
  type: string;
  sizeSqft: number;
  priceFrom: number;
  available: number;
}

export interface OffPlanProject {
  id: string;
  name: string;
  developer: string;
  city: string;
  state: string;
  country: string;
  status: ProjectStatus;
  completion: string; // e.g. "Q4 2027"
  priceFrom: number;
  currency: string;
  downPaymentPct: number; // during-booking deposit %
  duringConstructionPct: number; // % paid in installments while building
  handoverPct: number; // % due on handover
  paymentPlanLabel: string; // e.g. "60 / 40"
  rentalYield: number; // est. annual %
  appreciation5yr: number; // est. %
  unitTypes: OffPlanUnitType[];
  amenities: string[];
  images: string[];
  description: string;
  location: { lat: number; lng: number; nearby: string[] };
}

export interface Recommendation {
  propertyId: string;
  property: Property;
  matchScore: number;
  confidence: number;
  reasons: MatchReason[];
  rank: number;
}

export interface MatchReason {
  factor: string;
  weight: number;
  description: string;
  sentiment: "positive" | "neutral" | "negative";
}

export interface SearchFilters {
  query?: string;
  city?: string;
  state?: string;
  country?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  propertyType?: Property["propertyType"];
  listingType?: Property["listingType"];
  minSqft?: number;
  maxSqft?: number;
  amenities?: string[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
