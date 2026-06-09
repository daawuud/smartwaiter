# SmartWaiter AI

AI-powered QR restaurant ordering system built with Next.js, React, TypeScript, Tailwind CSS, Supabase, and OpenAI.

## Features
- Public landing page
- Restaurant admin login via Supabase Auth
- Restaurant dashboard, category management, item management, table / QR management
- Customer QR ordering page with cart, order confirmation, and AI menu assistant
- Kitchen dashboard with live order updates and order status management
- Basic daily sales report and settings page

## Tech stack
- Next.js App Router
- React + TypeScript
- Tailwind CSS
- Supabase PostgreSQL + Auth
- OpenAI API

## Setup
1. Copy `.env.example` to `.env.local`.
2. Fill in your Supabase project values and OpenAI API key.
3. Install dependencies:
   ```bash
   npm install
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```
5. Visit `http://localhost:3000`.

## Environment variables
Create `.env.local` with:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xyzcompany.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-public-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
OPENAI_API_KEY=your-openai-api-key
NEXT_PUBLIC_RESTAURANT_NAME=SmartWaiter AI
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## Database schema
Use `sql/schema.sql` to create the following tables:
- `restaurants`
- `menu_categories`
- `menu_items`
- `tables`
- `orders`
- `order_items`
- `daily_sales`

The app stores menu data, order details, table QR links, and sales totals.

Storage for logos
- Create a Supabase Storage bucket named `logos` and make it public (or serve via signed URLs).
- The Settings page allows uploading a logo image and stores the public URL in the `restaurants.logo_url` field.
- The poster and card PDF exports will include the uploaded logo when present.

## Supabase row-level security
The schema enables RLS on all tables and includes policies to:
- allow public reads for restaurant data, categories, and available menu items
- allow authenticated admin users to manage categories, menu items, tables, orders, and reports
- use the service role key for server-side insert/update of orders and audit records

## API routes
- `POST /api/orders` creates a new kitchen order and saves order items
- `POST /api/ai/assistant` generates menu-aware AI responses using OpenAI

## Notes
- The AI assistant is designed to answer only from current menu data.
- For allergy or medical questions, the assistant prompts customers to confirm with staff.
- Table QR codes are generated as live order links for each table.

## Build
To build the production app:
```bash
npm run build
```

## Project status
The current version is an MVP with core ordering, admin, kitchen, and AI assistant workflows implemented.
# smartwaiter
