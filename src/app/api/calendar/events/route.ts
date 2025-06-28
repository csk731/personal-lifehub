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

    const { searchParams } = new URL(request.url);
    const start = searchParams.get('start');
    const end = searchParams.get('end');
    const calendarId = searchParams.get('calendar_id');

    let query = supabase
      .from('calendar_events')
      .select(`
        *,
        calendar:calendars(*)
      `)
      .eq('user_id', user.id);

    if (start && end) {
      query = query
        .gte('start_time', start)
        .lte('end_time', end);
    }

    if (calendarId) {
      query = query.eq('calendar_id', calendarId);
    }

    const { data: events, error } = await query.order('start_time', { ascending: true });

    if (error) {
      console.error('Error fetching events:', error);
      return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
    }

    return NextResponse.json({ events: events || [] });
  } catch (error) {
    console.error('Error in events GET:', error);
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
    const { 
      title, 
      description, 
      location, 
      start_time, 
      end_time, 
      is_all_day, 
      calendar_id,
      reminder_minutes 
    } = body;

    if (!title || !start_time || !end_time || !calendar_id) {
      return NextResponse.json({ 
        error: 'Title, start time, end time, and calendar are required' 
      }, { status: 400 });
    }

    const { data: event, error } = await supabase
      .from('calendar_events')
      .insert({
        user_id: user.id,
        calendar_id,
        title,
        description,
        location,
        start_time,
        end_time,
        is_all_day: is_all_day || false,
        is_recurring: false,
        reminder_minutes: reminder_minutes || null
      })
      .select(`
        *,
        calendar:calendars(*)
      `)
      .single();

    if (error) {
      console.error('Error creating event:', error);
      return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
    }

    return NextResponse.json({ event });
  } catch (error) {
    console.error('Error in events POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 