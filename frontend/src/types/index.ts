// src/types/index.ts

export type PropertyType = "sale" | "rent";
export type PropertyCategory =
  | "house"
  | "apartment"
  | "condo"
  | "townhouse"
  | "land"
  | "commercial";
export type PropertyStatus = "active" | "pending" | "sold" | "rented" | "off_market";
export type PossessionStatus = "ready_to_move" | "under_construction" | "new_launch";
export type Furnishing = "unfurnished" | "semi_furnished" | "fully_furnished";
export type TransactionType = "new_booking" | "resale";
export type UserRole = "buyer" | "agent" | "admin";

// ─────────────────────────────────────────────
// USER TYPES
// ─────────────────────────────────────────────

export interface AgentProfile {
  id: number;
  phone: string;
  company: string;
  bio: string;
  image: string;
  license_number: string;
  years_of_experience: number;
  specializations: string[];
  website: string;
  linkedin: string;
}

export interface User {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: UserRole;
  phone: string;
  avatar: string;
  agent_profile: AgentProfile | null;
  created_at: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

// ─────────────────────────────────────────────
// PROPERTY TYPES
// ─────────────────────────────────────────────

export interface PropertyImage {
  id: number;
  image_url: string;
  caption: string;
  is_primary: boolean;
  order: number;
}

export interface PropertyAgent {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  avatar: string;
  agent_profile: AgentProfile | null;
}

export interface Property {
  id: number;
  slug: string;
  title: string;
  description: string;
  property_type: PropertyType;
  category: PropertyCategory;
  status: PropertyStatus;
  price: number;
  formatted_price: string;
  price_per_sqft: number | null;
  address: string;
  locality: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  bhk: number | null;
  bhk_label: string;
  beds: number;
  baths: number;
  area_sqft: number;
  carpet_area_sqft: number | null;
  lot_size_sqft: number | null;
  year_built: number | null;
  garage_spaces: number;
  floors: number;
  possession_status: PossessionStatus;
  furnishing: Furnishing;
  transaction_type: TransactionType;
  is_verified: boolean;
  is_featured: boolean;
  views_count: number;
  features: string[];
  images: PropertyImage[];
  primary_image: string | null;
  agent: PropertyAgent | null;
  is_saved: boolean;
  meta_description: string;
  listed_at: string | null;
  created_at: string;
  updated_at: string;
}

// Compact version returned by list endpoints
export type PropertyCard = Pick<
  Property,
  | "id"
  | "slug"
  | "title"
  | "property_type"
  | "category"
  | "status"
  | "price"
  | "formatted_price"
  | "price_per_sqft"
  | "locality"
  | "city"
  | "state"
  | "zip_code"
  | "bhk"
  | "bhk_label"
  | "beds"
  | "baths"
  | "area_sqft"
  | "possession_status"
  | "furnishing"
  | "transaction_type"
  | "is_verified"
  | "is_featured"
  | "primary_image"
  | "is_saved"
  | "created_at"
> & { agent_name: string | null };

// ─────────────────────────────────────────────
// LOCALITY TYPES
// ─────────────────────────────────────────────

export interface Locality {
  id: number;
  name: string;
  city: string;
  state: string;
  slug: string;
  description: string;
  avg_price_per_sqft: number | null;
  image_url: string;
  property_count: number;
}

// ─────────────────────────────────────────────
// SAVED PROPERTY (WISHLIST) TYPES
// ─────────────────────────────────────────────

export interface SavedProperty {
  id: number;
  property: PropertyCard;
  created_at: string;
}

// ─────────────────────────────────────────────
// API RESPONSE TYPES
// ─────────────────────────────────────────────

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ApiError {
  detail?: string;
  [field: string]: string | string[] | undefined;
}

// ─────────────────────────────────────────────
// FILTER TYPES
// ─────────────────────────────────────────────

export interface PropertyFilters {
  search?: string;
  city?: string;
  state?: string;
  locality?: string;
  property_type?: PropertyType | "";
  category?: PropertyCategory | "";
  status?: PropertyStatus | "";
  bhk?: number | "";
  beds_min?: number | "";
  price_min?: number | "";
  price_max?: number | "";
  possession_status?: PossessionStatus | "";
  furnishing?: Furnishing | "";
  transaction_type?: TransactionType | "";
  ordering?: string;
  page?: number;
}

// ─────────────────────────────────────────────
// INQUIRY TYPES
// ─────────────────────────────────────────────

export interface InquiryFormData {
  name: string;
  email: string;
  phone?: string;
  message: string;
}

export interface Inquiry extends InquiryFormData {
  id: number;
  property_id: number;
  property_title: string;
  status: "new" | "read" | "responded" | "closed";
  created_at: string;
}
