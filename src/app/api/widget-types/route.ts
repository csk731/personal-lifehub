import { createClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data: widgetTypes, error } = await supabase
      .from('widget_types')
      .select('*')
      .order('category', { ascending: true })
      .order('display_name', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Group by category
    const groupedTypes = widgetTypes.reduce((acc, type) => {
      const category = type.category || 'other'
      if (!acc[category]) {
        acc[category] = []
      }
      acc[category].push(type)
      return acc
    }, {} as Record<string, any[]>)

    return NextResponse.json({ widgetTypes: groupedTypes })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 