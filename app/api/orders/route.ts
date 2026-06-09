import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '../../../lib/supabaseServer';

export async function POST(request: NextRequest) {
  const data = await request.json();
  const { table_id, customer_name, notes, order_items } = data;

  if (!order_items || !Array.isArray(order_items) || order_items.length === 0) {
    return NextResponse.json({ error: 'Order items are required.' }, { status: 400 });
  }

  const total = order_items.reduce((sum: number, item: any) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0);

  const supabaseServer = getSupabaseServer();
  const { data: order, error: orderError } = await supabaseServer.from('orders').insert({
    table_id,
    customer_name,
    notes,
    total,
    status: 'received'
  }).select().single();

  if (orderError || !order) {
    return NextResponse.json({ error: orderError?.message || 'Unable to create order.' }, { status: 500 });
  }

  const orderItemPayload = order_items.map((item: any) => ({
    order_id: order.id,
    menu_item_id: item.menu_item_id,
    name: item.name,
    quantity: item.quantity,
    price: item.price,
    notes: item.notes || ''
  }));

  const { error: itemsError } = await supabaseServer.from('order_items').insert(orderItemPayload);

  if (itemsError) {
    return NextResponse.json({ error: itemsError.message }, { status: 500 });
  }

  const today = new Date().toISOString().slice(0, 10);
  await supabaseServer.from('daily_sales').upsert({ report_date: today, total_orders: 1, total_revenue: total }, { onConflict: 'report_date' });

  return NextResponse.json({ order_id: order.id });
}
