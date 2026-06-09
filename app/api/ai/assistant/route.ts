import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { getSupabaseServer } from '../../../../lib/supabaseServer';
import { buildAssistantPrompt } from '../../../../lib/aiPrompt';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ answer: 'The AI assistant is not configured.', error: 'Missing OPENAI_API_KEY' }, { status: 500 });
  }
  const client = new OpenAI({ apiKey });
  const question = body.question || '';
  const tableId = body.table_id || null;

  if (!question.trim()) {
    return NextResponse.json({ answer: 'Please ask a menu question.' }, { status: 400 });
  }

  const supabaseServer = getSupabaseServer();
  const [{ data: categories }, { data: items }, { data: table }, { data: restaurant }] = await Promise.all([
    supabaseServer.from('menu_categories').select('id,name').order('sort_order', { ascending: true }),
    supabaseServer.from('menu_items').select('*').order('name', { ascending: true }),
    tableId ? supabaseServer.from('tables').select('label').eq('id', tableId).single() : Promise.resolve({ data: null }),
    supabaseServer.from('restaurants').select('name').limit(1).single()
  ]);

  const menuSummary = categories?.map((category: any) => {
    const catItems = items?.filter((item: any) => item.category_id === category.id && item.is_available && !item.is_sold_out);
    if (!catItems || catItems.length === 0) return null;
    return `Category: ${category.name}\n` + catItems.map((item: any) => `- ${item.name}: ${item.description || 'No description'}; Ingredients: ${item.ingredients || 'Not listed'}; Spice: ${item.spice_level || 'Regular'}; Price: $${Number(item.price).toFixed(2)}.`).join('\n');
  }).filter(Boolean).join('\n\n');
  const restaurantName = restaurant?.name || 'this restaurant';
  const categoriesSummary = categories?.map((c: any) => c.name).join(', ');
  const prompt = buildAssistantPrompt({
    restaurantName,
    tableLabel: table?.label || null,
    categoriesSummary: categoriesSummary || '',
    menuSummary: menuSummary || '',
    question
  });

  try {
    const completion = await client.responses.create({
      model: 'gpt-4.1-mini',
      input: prompt,
      max_output_tokens: 350
    });
    const answer = completion.output_text?.trim() || 'I could not answer that question from the menu information.';
    return NextResponse.json({ answer });
  } catch (error: any) {
    return NextResponse.json({ answer: 'The AI assistant is unavailable right now.', error: error.message }, { status: 500 });
  }
}
