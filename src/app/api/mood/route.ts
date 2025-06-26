import { createClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser(request)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const days = searchParams.get('days') ? parseInt(searchParams.get('days')!) : null
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 100

    let query = supabase
      .from('mood_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })

    // Only apply limit if specified
    if (limit) {
      query = query.limit(limit)
    }

    // Apply date filtering only if specific parameters are provided
    if (startDate && endDate) {
      query = query.gte('date', startDate).lte('date', endDate)
    } else if (days) {
      // Only apply days filter if explicitly requested
      query = query.gte('date', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
    }
    // If no date parameters are provided, return all entries

    const { data: entries, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ entries })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser(request)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const body = await request.json()
    const { mood_score, mood_emoji, mood_label, notes, date } = body

    if (!mood_score || mood_score < 1 || mood_score > 10) {
      return NextResponse.json({ error: 'Mood score must be between 1 and 10' }, { status: 400 })
    }

    // Check if entry already exists for this date
    const { data: existingEntry } = await supabase
      .from('mood_entries')
      .select('id')
      .eq('user_id', user.id)
      .eq('date', date || new Date().toISOString().split('T')[0])
      .single()

    if (existingEntry) {
      // Update existing entry
      const { data: entry, error } = await supabase
        .from('mood_entries')
        .update({
          mood_score,
          mood_emoji,
          mood_label,
          notes
        })
        .eq('id', existingEntry.id)
        .select()
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ entry })
    } else {
      // Create new entry
      const { data: entry, error } = await supabase
        .from('mood_entries')
        .insert([
          {
            user_id: user.id,
            mood_score,
            mood_emoji,
            mood_label,
            notes,
            date: date || new Date().toISOString().split('T')[0]
          }
        ])
        .select()
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ entry }, { status: 201 })
    }
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 