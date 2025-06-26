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
    const { type, amount, currency, category, description, account, date, tags } = body

    // Verify the finance entry belongs to the user
    const { data: existingEntry, error: fetchError } = await supabase
      .from('finance_entries')
      .select('id')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !existingEntry) {
      return NextResponse.json({ error: 'Finance entry not found' }, { status: 404 })
    }

    if (type && !['income', 'expense', 'transfer'].includes(type)) {
      return NextResponse.json({ error: 'Type must be income, expense, or transfer' }, { status: 400 })
    }

    const updateData: any = {}
    if (type !== undefined) updateData.type = type
    if (amount !== undefined) updateData.amount = parseFloat(amount)
    if (currency !== undefined) updateData.currency = currency
    if (category !== undefined) updateData.category = category
    if (description !== undefined) updateData.description = description
    if (account !== undefined) updateData.account = account
    if (date !== undefined) updateData.date = date
    if (tags !== undefined) updateData.tags = tags

    const { data: entry, error } = await supabase
      .from('finance_entries')
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

    // Verify the finance entry belongs to the user
    const { data: existingEntry, error: fetchError } = await supabase
      .from('finance_entries')
      .select('id')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !existingEntry) {
      return NextResponse.json({ error: 'Finance entry not found' }, { status: 404 })
    }

    const { error } = await supabase
      .from('finance_entries')
      .delete()
      .eq('id', params.id)
      .eq('user_id', user.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Finance entry deleted successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 