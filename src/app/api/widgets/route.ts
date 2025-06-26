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

    const { data: userWidgets, error } = await supabase
      .from('user_widgets')
      .select(`
        *,
        widget_types (
          name,
          display_name,
          description,
          icon,
          category,
          default_config
        )
      `)
      .eq('user_id', user.id)
      .eq('is_visible', true)
      .order('position_y', { ascending: true })
      .order('position_x', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ widgets: userWidgets })
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
    const { widget_type_id, title, position_x, position_y, width, height, config } = body

    // Comprehensive validation
    if (!widget_type_id) {
      return NextResponse.json({ error: 'Widget type ID is required' }, { status: 400 })
    }

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json({ error: 'Widget title is required and must not be empty' }, { status: 400 })
    }

    // Validate dimensions
    if (width !== undefined && (width < 1 || width > 4)) {
      return NextResponse.json({ error: 'Widget width must be between 1 and 4' }, { status: 400 })
    }

    if (height !== undefined && (height < 1 || height > 4)) {
      return NextResponse.json({ error: 'Widget height must be between 1 and 4' }, { status: 400 })
    }

    // Validate positions
    if (position_x !== undefined && position_x < 0) {
      return NextResponse.json({ error: 'Widget position X must be non-negative' }, { status: 400 })
    }

    if (position_y !== undefined && position_y < 0) {
      return NextResponse.json({ error: 'Widget position Y must be non-negative' }, { status: 400 })
    }

    // Verify the widget type exists
    const { data: widgetType, error: widgetTypeError } = await supabase
      .from('widget_types')
      .select('*')
      .eq('id', widget_type_id)
      .single()

    if (widgetTypeError || !widgetType) {
      return NextResponse.json({ error: 'Invalid widget type' }, { status: 400 })
    }

    // Check if user already has this widget type
    const { data: existingWidget, error: existingError } = await supabase
      .from('user_widgets')
      .select('id, title')
      .eq('user_id', user.id)
      .eq('widget_type_id', widget_type_id)
      .eq('is_visible', true)
      .single()

    if (existingWidget) {
      return NextResponse.json({ 
        error: `You already have a ${widgetType.display_name} widget`,
        existingWidget: {
          id: existingWidget.id,
          title: existingWidget.title
        }
      }, { status: 409 })
    }

    // Check total widget count
    const { count: widgetCount, error: countError } = await supabase
      .from('user_widgets')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_visible', true)

    if (countError) {
      return NextResponse.json({ error: 'Failed to check widget count' }, { status: 500 })
    }

    if (widgetCount && widgetCount >= 20) {
      return NextResponse.json({ 
        error: 'Maximum number of widgets (20) reached. Please remove some widgets before adding new ones.' 
      }, { status: 400 })
    }

    // Validate config if provided
    if (config && typeof config !== 'object') {
      return NextResponse.json({ error: 'Widget config must be a valid JSON object' }, { status: 400 })
    }

    // Prepare widget data with defaults
    const widgetData = {
      user_id: user.id,
      widget_type_id,
      title: title.trim(),
      position_x: position_x ?? 0,
      position_y: position_y ?? 0,
      width: width ?? 1,
      height: height ?? 1,
      config: config || widgetType.default_config || {},
      is_visible: true
    }

    // Insert the widget
    const { data: userWidget, error } = await supabase
      .from('user_widgets')
      .insert([widgetData])
      .select(`
        *,
        widget_types (
          name,
          display_name,
          description,
          icon,
          category,
          default_config
        )
      `)
      .single()

    if (error) {
      // Handle specific database constraint violations
      if (error.code === '23505') {
        return NextResponse.json({ 
          error: `You already have a ${widgetType.display_name} widget`,
          code: 'DUPLICATE_WIDGET'
        }, { status: 409 })
      }
      
      if (error.code === '23514') {
        return NextResponse.json({ 
          error: 'Invalid widget data. Please check dimensions and position values.',
          code: 'VALIDATION_ERROR'
        }, { status: 400 })
      }

      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ 
      widget: userWidget,
      message: `${widgetType.display_name} widget added successfully`
    }, { status: 201 })
  } catch (error) {
    console.error('Widget creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 