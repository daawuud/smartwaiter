export type MenuCategory = {
  id: string;
  name: string;
  sort_order: number;
};

export type MenuItem = {
  id: string;
  category_id: string | null;
  name: string;
  description: string;
  ingredients: string;
  spice_level: string;
  price: number;
  image_url: string | null;
  is_available: boolean;
  is_sold_out: boolean;
};

export type TableRecord = {
  id: string;
  label: string;
  qr_code: string;
};

export type OrderItem = {
  id: string;
  menu_item_id: string | null;
  name: string;
  quantity: number;
  price: number;
  notes: string;
};

export type Order = {
  id: string;
  table_id: string | null;
  customer_name: string;
  notes: string;
  status: 'received' | 'preparing' | 'ready' | 'served' | 'cancelled';
  total: number;
  created_at: string;
  order_items: OrderItem[];
};
