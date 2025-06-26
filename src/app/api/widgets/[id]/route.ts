import { createClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/utils'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, error: authError } = await getAuthenticatedUser(request)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const widgetId = params.id

    if (!widgetId) {
      return NextResponse.json({ error: 'Widget ID is required' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // First, verify the widget belongs to the user
    const { data: existingWidget, error: fetchError } = await supabase
      .from('user_widgets')
      .select(`
        *,
        widget_types (
          name,
          display_name,
          description,
          icon,
          category
        )
      `)
      .eq('id', widgetId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !existingWidget) {
      return NextResponse.json({ error: 'Widget not found or access denied' }, { status: 404 })
    }

    // Delete the widget
    const { error: deleteError } = await supabase
      .from('user_widgets')
      .delete()
      .eq('id', widgetId)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Error deleting widget:', deleteError)
      return NextResponse.json({ error: 'Failed to delete widget' }, { status: 500 })
    }

    return NextResponse.json({ 
      message: `${existingWidget.widget_types.display_name} widget removed successfully`,
      deletedWidget: {
        id: existingWidget.id,
        widgetTypeId: existingWidget.widget_type_id,
        displayName: existingWidget.widget_types.display_name
      }
    })
  } catch (error) {
    console.error('Widget deletion error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 