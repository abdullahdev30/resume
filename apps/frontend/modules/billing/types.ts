export interface Package {
  id: string;
  name: string;
  description: string;
  persona_limit: number;
  ai_resume_limit: number;
  monthly_price: string | number;
  yearly_price?: string | number | null;
  yearly_discount_percent?: string | number;
  currency: string;
}

export interface Membership {
  role: "user" | "admin" | "super_admin";
  active: boolean;
  status: "active" | "expired" | "unsubscribed";
  persona_count: number;
  ai_resume_count: number;
  subscription:
    | (Package & {
        package_id: string;
        package_name: string;
        expires_at: string;
        billing_interval: "monthly" | "yearly";
        renewal_enabled: boolean;
        next_billing_at: string;
      })
    | null;
}

export interface ManagedUser {
  id: string;
  name: string | null;
  email: string;
  role: Membership["role"];
  active: boolean;
  package_name: string | null;
  subscription_status: Membership["status"];
  expires_at: string | null;
  ai_resume_count: number;
  personas: { id: string; name: string }[];
}

export interface SubscriptionHistoryItem {
  id: string;
  package_name: string;
  persona_limit: number;
  ai_resume_limit: number;
  billing_interval: "monthly" | "yearly";
  amount: string | number;
  currency: string;
  status: "active" | "expired" | "replaced";
  current_status: "active" | "expired" | "replaced";
  starts_at: string;
  expires_at: string;
  created_at: string;
}
