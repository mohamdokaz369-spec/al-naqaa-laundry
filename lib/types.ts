// ─── Order Status ────────────────────────────────────────────────────────────

export type OrderStatus =
  | "pending"
  | "scheduled"
  | "assigned"
  | "on_the_way"
  | "arrived"
  | "picked_up"
  | "washing"
  | "ready"
  | "delivering"
  | "completed"
  | "cancelled"
  // legacy – kept for backward compatibility with existing rows
  | "delivered";

export const ORDER_STATUSES: OrderStatus[] = [
  "pending",
  "scheduled",
  "assigned",
  "on_the_way",
  "arrived",
  "picked_up",
  "washing",
  "ready",
  "delivering",
  "completed",
  "cancelled",
];

export const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "بانتظار التأكيد",
  scheduled: "مجدول",
  assigned: "تم تعيين سائق",
  on_the_way: "السائق في الطريق",
  arrived: "السائق وصل",
  picked_up: "تم الاستلام",
  washing: "قيد الغسيل",
  ready: "جاهز للتسليم",
  delivering: "جاري التوصيل",
  completed: "مكتمل",
  cancelled: "ملغي",
  delivered: "تم التسليم", // legacy
};

export const STATUS_BADGE: Record<OrderStatus, string> = {
  pending: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  scheduled: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  assigned: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  on_the_way: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  arrived: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  picked_up: "bg-teal-500/20 text-teal-300 border-teal-500/30",
  washing: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
  ready: "bg-green-500/20 text-green-300 border-green-500/30",
  delivering: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  completed: "bg-slate-600/30 text-slate-300 border-slate-500/30",
  cancelled: "bg-red-500/20 text-red-300 border-red-500/30",
  delivered: "bg-slate-600/30 text-slate-300 border-slate-500/30",
};

// ─── Order ───────────────────────────────────────────────────────────────────

export type Order = {
  id: number;
  order_number: string | null;
  customer_name: string;
  phone: string;
  address: string | null;
  service_type: string;
  status: OrderStatus;
  pickup_date: string | null;
  pickup_time: string | null;
  expected_delivery_time: string | null;
  notes: string | null;
  location_lat: number | null;
  location_lng: number | null;
  google_maps_link: string | null;
  assigned_driver_id: number | null;
  route_order: number | null;
  scheduled_at: string | null;
  estimated_arrival: string | null;
  created_at: string;
  updated_at: string | null;
};

// ─── Driver ──────────────────────────────────────────────────────────────────

export type Driver = {
  id: number;
  name: string;
  phone: string;
  current_lat: number | null;
  current_lng: number | null;
  is_active: boolean;
  last_location_update: string | null;
  created_at: string;
  updated_at: string | null;
};

// ─── Status History ──────────────────────────────────────────────────────────

export type OrderStatusHistory = {
  id: number;
  order_id: number;
  status: OrderStatus;
  changed_at: string;
  changed_by: string;
  notes: string | null;
};

// ─── Driver status actions ────────────────────────────────────────────────────

export type StatusAction = {
  next: OrderStatus;
  label: string;
  color: string;
};

export const DRIVER_STATUS_ACTIONS: Partial<Record<OrderStatus, StatusAction[]>> = {
  assigned: [
    { next: "on_the_way", label: "بدء الطريق", color: "bg-cyan-600 hover:bg-cyan-500" },
    { next: "cancelled", label: "إلغاء", color: "bg-red-700 hover:bg-red-600" },
  ],
  on_the_way: [
    { next: "arrived", label: "وصلت", color: "bg-orange-600 hover:bg-orange-500" },
    { next: "cancelled", label: "إلغاء", color: "bg-red-700 hover:bg-red-600" },
  ],
  arrived: [
    { next: "picked_up", label: "تم الاستلام", color: "bg-teal-600 hover:bg-teal-500" },
    { next: "cancelled", label: "إلغاء", color: "bg-red-700 hover:bg-red-600" },
  ],
  delivering: [
    { next: "completed", label: "تم التسليم", color: "bg-green-600 hover:bg-green-500" },
  ],
};

// ─── Service display ─────────────────────────────────────────────────────────

export const SERVICE_LABELS: Record<string, string> = {
  pickup_request: "طلب استلام",
  غسيل: "غسيل",
  كي: "كي",
  "غسيل + كي": "غسيل + كي",
  "تنظيف جاف": "تنظيف جاف",
  سجاد: "سجاد",
  "سجاد آلي": "غسيل السجاد بماكينة Full Automatic",
  كنب: "كنب",
  بطانيات: "بطانيات",
};
