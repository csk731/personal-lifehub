import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthenticatedUser } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser(request);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: calendars, error } = await supabase
      .from('calendars')
      .select('*')
      .eq('user_id', user.id)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching calendars:', error);
      return NextResponse.json({ error: 'Failed to fetch calendars' }, { status: 500 });
    }

    return NextResponse.json({ calendars: calendars || [] });
  } catch (error) {
    console.error('Error in calendars GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser(request);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const body = await request.json();
    const { name, color, description } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Calendar name is required' }, { status: 400 });
    }

    const { data: calendar, error } = await supabase
      .from('calendars')
      .insert({
        user_id: user.id,
        name: name.trim(),
        color: color || '#3B82F6',
        description: description?.trim() || null
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating calendar:', error);
      return NextResponse.json({ error: 'Failed to create calendar' }, { status: 500 });
    }

    return NextResponse.json({ calendar });
  } catch (error) {
    console.error('Error in calendars POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 