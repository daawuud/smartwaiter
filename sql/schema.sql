-- SmartWaiter AI Supabase schema

-- Users and auth are handled by Supabase Auth.

create table if not exists restaurants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_url text,
  timezone text default 'UTC',
  currency text default 'USD',
  is_active boolean default true,
  created_at timestamptz default now()
);

create table if not exists menu_categories (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid references restaurants(id) on delete cascade,
  name text not null,
  sort_order int default 0,
  created_at timestamptz default now()
);

create table if not exists menu_items (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid references restaurants(id) on delete cascade,
  category_id uuid references menu_categories(id) on delete set null,
  name text not null,
  description text default '',
  ingredients text default '',
  spice_level text default '',
  price numeric(10,2) not null,
  image_url text,
  is_available boolean default true,
  is_sold_out boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists tables (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid references restaurants(id) on delete cascade,
  label text not null,
  qr_code text unique,
  is_active boolean default true,
  created_at timestamptz default now()
);

create type order_status as enum ('received', 'preparing', 'ready', 'served', 'cancelled');

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid references restaurants(id) on delete cascade,
  table_id uuid references tables(id) on delete set null,
  customer_name text default 'Guest',
  notes text default '',
  status order_status default 'received',
  total numeric(10,2) default 0,
  created_at timestamptz default now()
);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade,
  menu_item_id uuid references menu_items(id) on delete set null,
  name text not null,
  quantity int not null default 1,
  price numeric(10,2) not null,
  notes text default ''
);

-- Audit tables for reporting.
create table if not exists daily_sales (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid references restaurants(id) on delete cascade,
  report_date date not null,
  total_orders int default 0,
  total_revenue numeric(12,2) default 0,
  created_at timestamptz default now()
);

-- Row level security for Supabase.

alter table restaurants enable row level security;
alter table menu_categories enable row level security;
alter table menu_items enable row level security;
alter table tables enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table daily_sales enable row level security;

-- Allow authenticated users to read restaurant and public menu data.
create policy "public access to restaurant" on restaurants
  for select using (true);

create policy "public access to categories" on menu_categories
  for select using (true);

create policy "public access to menu items" on menu_items
  for select using (is_available = true);

create policy "authenticated admin full access" on menu_categories
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "authenticated admin full access items" on menu_items
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "authenticated admin full access tables" on tables
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "authenticated admin full access orders" on orders
  for select using (auth.role() = 'authenticated');

create policy "authenticated admin full access order_items" on order_items
  for select using (auth.role() = 'authenticated');

create policy "authenticated admin full access daily sales" on daily_sales
  for select using (auth.role() = 'authenticated');

-- Allow server-side insert and update from API using service role.

