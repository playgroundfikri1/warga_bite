export type VerificationStatus = "pending" | "approved" | "rejected";
export type SellerRequestStatus = "none" | "pending" | "approved" | "rejected";
export type SubscriptionStatus = "none" | "trial" | "active" | "expired";
export type SubscriptionPlanType = "trial_30d" | "monthly" | "custom";
export type ProductCategory = "Makanan Berat" | "Jajanan" | "Minuman" | "Lainnya";
export type PaymentMethod = "cod" | "qris";
export type PaymentStatus = "unpaid" | "paid" | "failed";
export type OrderStatus =
  | "PENDING_PAYMENT"
  | "CONFIRMED"
  | "PREPARING"
  | "SENT"
  | "COMPLETED"
  | "CANCELLED";

export interface Province {
  id: string;
  name: string;
}

export interface City {
  id: string;
  province_id: string;
  name: string;
}

export interface PostalCode {
  id: number;
  city_id: string;
  district_name: string;
  subdistrict_name: string;
  postal_code: string;
}

export interface Complex {
  id: string;
  province_id: string;
  city_id: string;
  postal_code: string;
  name: string;
  cluster_name: string | null;
  rt: string | null;
  rw: string | null;
  address: string;
  location: unknown;
  is_courier_enabled: boolean;
  allow_cross_complex: boolean;
  max_delivery_radius_km: number;
  monthly_subscription_price: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  complex_id: string;
  full_name: string;
  email: string;
  phone: string;
  house_block: string;
  full_address: string;
  location: unknown | null;
  verification_status: VerificationStatus;
  is_customer: boolean;
  is_seller: boolean;
  seller_request_status: SellerRequestStatus;
  is_courier: boolean;
  is_admin: boolean;
  is_super_admin: boolean;
  shop_name: string | null;
  shop_description: string | null;
  is_shop_open: boolean;
  seller_approved_at: string | null;
  subscription_status: SubscriptionStatus;
  subscription_expires_at: string | null;
  expo_push_token: string | null;
  created_at: string;
  updated_at: string;
}

export interface SellerSubscription {
  id: string;
  seller_id: string;
  complex_id: string;
  plan_type: SubscriptionPlanType;
  amount_paid: number;
  duration_days: number;
  starts_at: string;
  ends_at: string;
  payment_notes: string | null;
  activated_by: string | null;
  created_at: string;
}

export interface Product {
  id: string;
  seller_id: string;
  complex_id: string;
  name: string;
  description: string | null;
  price: number;
  category: ProductCategory;
  image_url: string | null;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  order_code: string;
  buyer_complex_id: string;
  seller_complex_id: string;
  customer_id: string;
  seller_id: string;
  courier_id: string | null;
  total_amount: number;
  delivery_fee: number;
  distance_km: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  order_status: OrderStatus;
  qr_handoff_token: string;
  delivery_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name_snapshot: string;
  quantity: number;
  price_at_purchase: number;
}

export interface Review {
  id: string;
  order_id: string;
  customer_id: string;
  seller_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}
