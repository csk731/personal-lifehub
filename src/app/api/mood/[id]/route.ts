import { createClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/utils'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Verify the mood entry belongs to the user
    const { data: existingEntry, error: fetchError } = await supabase
      .from('mood_entries')
      .select('id')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !existingEntry) {
      return NextResponse.json({ error: 'Mood entry not found' }, { status: 404 })
    }

    if (mood_score && (mood_score < 1 || mood_score > 10)) {
      return NextResponse.json({ error: 'Mood score must be between 1 and 10' }, { status: 400 })
    }

    const updateData: any = {}
    if (mood_score !== undefined) updateData.mood_score = mood_score
    if (mood_emoji !== undefined) updateData.mood_emoji = mood_emoji
    if (mood_label !== undefined) updateData.mood_label = mood_label
    if (notes !== undefined) updateData.notes = notes
    if (date !== undefined) updateData.date = date

    const { data: entry, error } = await supabase
      .from('mood_entries')
      .update(updateData)
      .eq('id', params.id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ entry })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, error: authError } = await getAuthenticatedUser(request)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Verify the mood entry belongs to the user
    const { data: existingEntry, error: fetchError } = await supabase
      .from('mood_entries')
      .select('id')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !existingEntry) {
      return NextResponse.json({ error: 'Mood entry not found' }, { status: 404 })
    }

    const { error } = await supabase
      .from('mood_entries')
      .delete()
      .eq('id', params.id)
      .eq('user_id', user.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Mood entry deleted successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 