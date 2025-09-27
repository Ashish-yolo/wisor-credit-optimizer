import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/cards - Fetch all cards for the authenticated user
export async function GET(request: NextRequest) {
  try {
    // Get user from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    
    // Verify the token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Fetch user's cards
    const { data: cards, error } = await supabase
      .from('cards')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to fetch cards' }, { status: 500 });
    }

    return NextResponse.json({ cards });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/cards - Add new cards for the authenticated user
export async function POST(request: NextRequest) {
  try {
    // Get user from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    
    // Verify the token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get request body
    const body = await request.json();
    const { cards } = body;

    if (!cards || !Array.isArray(cards) || cards.length === 0) {
      return NextResponse.json({ error: 'Cards array is required' }, { status: 400 });
    }

    // Validate card data
    for (const card of cards) {
      if (!card.card_name || !card.network || !card.card_last4) {
        return NextResponse.json({ 
          error: 'All cards must have card_name, network, and card_last4' 
        }, { status: 400 });
      }

      // Validate card_last4 is exactly 4 digits
      if (!/^\d{4}$/.test(card.card_last4)) {
        return NextResponse.json({ 
          error: 'card_last4 must be exactly 4 digits' 
        }, { status: 400 });
      }
    }

    // Prepare cards for insertion
    const cardsToInsert = cards.map(card => ({
      user_id: user.id,
      card_name: card.card_name,
      network: card.network,
      card_last4: card.card_last4,
    }));

    // Insert cards into database
    const { data: insertedCards, error } = await supabase
      .from('cards')
      .insert(cardsToInsert)
      .select();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to add cards' }, { status: 500 });
    }

    return NextResponse.json({ 
      cards: insertedCards,
      message: `Successfully added ${insertedCards.length} card(s)`
    }, { status: 201 });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}