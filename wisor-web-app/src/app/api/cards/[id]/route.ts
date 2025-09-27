import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// DELETE /api/cards/[id] - Delete a specific card
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const cardId = params.id;

    // Check if card exists and belongs to user
    const { data: existingCard, error: fetchError } = await supabase
      .from('cards')
      .select('*')
      .eq('id', cardId)
      .eq('user_id', user.id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Card not found' }, { status: 404 });
      }
      console.error('Database error:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch card' }, { status: 500 });
    }

    // Delete the card
    const { error: deleteError } = await supabase
      .from('cards')
      .delete()
      .eq('id', cardId)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Database error:', deleteError);
      return NextResponse.json({ error: 'Failed to delete card' }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Card deleted successfully',
      deleted_card: existingCard
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/cards/[id] - Update a specific card
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const cardId = params.id;
    const body = await request.json();
    const { card_name, network, card_last4 } = body;

    // Validate required fields
    if (!card_name || !network || !card_last4) {
      return NextResponse.json({ 
        error: 'card_name, network, and card_last4 are required' 
      }, { status: 400 });
    }

    // Validate card_last4 is exactly 4 digits
    if (!/^\d{4}$/.test(card_last4)) {
      return NextResponse.json({ 
        error: 'card_last4 must be exactly 4 digits' 
      }, { status: 400 });
    }

    // Check if card exists and belongs to user
    const { data: existingCard, error: fetchError } = await supabase
      .from('cards')
      .select('*')
      .eq('id', cardId)
      .eq('user_id', user.id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Card not found' }, { status: 404 });
      }
      console.error('Database error:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch card' }, { status: 500 });
    }

    // Update the card
    const { data: updatedCard, error: updateError } = await supabase
      .from('cards')
      .update({
        card_name,
        network,
        card_last4,
        updated_at: new Date().toISOString()
      })
      .eq('id', cardId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Database error:', updateError);
      return NextResponse.json({ error: 'Failed to update card' }, { status: 500 });
    }

    return NextResponse.json({ 
      card: updatedCard,
      message: 'Card updated successfully'
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}