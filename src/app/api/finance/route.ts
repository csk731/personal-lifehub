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
    const type = searchParams.get('type')
    const category = searchParams.get('category')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const days = searchParams.get('days') ? parseInt(searchParams.get('days')!) : 30
    const timezone = searchParams.get('timezone') || 'UTC'
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50

    let query = supabase
      .from('finance_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(limit)

    if (startDate && endDate) {
      query = query.gte('date', startDate).lte('date', endDate)
    } else {
      // Calculate date range in user's timezone
      const now = new Date()
      const todayInUserTz = new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(now)
      
      // For "today" filter, we need to get the start of today in user's timezone
      if (days === 1) {
        // Get today's date in user timezone
        const todayStart = new Date(todayInUserTz + 'T00:00:00')
        const todayEnd = new Date(todayInUserTz + 'T23:59:59')
        
        // Convert to UTC for database query
        const todayStartUtc = new Date(todayStart.getTime() - (todayStart.getTimezoneOffset() * 60000))
        const todayEndUtc = new Date(todayEnd.getTime() - (todayEnd.getTimezoneOffset() * 60000))
        
        query = query.gte('date', todayStartUtc.toISOString()).lte('date', todayEndUtc.toISOString())
      } else {
        // For other filters, calculate the date range
        const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
        const startDateInUserTz = new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(startDate)
        
        const startDateUtc = new Date(startDateInUserTz + 'T00:00:00')
        const startDateUtcAdjusted = new Date(startDateUtc.getTime() - (startDateUtc.getTimezoneOffset() * 60000))
        
        query = query.gte('date', startDateUtcAdjusted.toISOString())
      }
    }

    if (type) {
      query = query.eq('type', type)
    }

    if (category) {
      query = query.eq('category', category)
    }

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
    const { type, amount, currency, category, description, account, date, tags } = body

    if (!type || !amount) {
      return NextResponse.json({ error: 'Type and amount are required' }, { status: 400 })
    }

    if (!['income', 'expense', 'transfer'].includes(type)) {
      return NextResponse.json({ error: 'Type must be income, expense, or transfer' }, { status: 400 })
    }

    const { data: entry, error } = await supabase
      .from('finance_entries')
      .insert([
        {
          user_id: user.id,
          type,
          amount: parseFloat(amount),
          currency: currency || 'USD',
          category,
          description,
          account,
          date: date || new Date().toISOString().split('T')[0],
          tags: tags || []
        }
      ])
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ entry }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 