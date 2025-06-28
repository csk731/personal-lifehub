import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('=== FOLDER UPDATE API CALLED ===');
    console.log('Folder ID:', id);
    
    // Extract token from request headers
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, color, icon, emoji, sort_order } = body;
    
    console.log('Request body:', body);
    console.log('Color received:', color, 'Type:', typeof color);

    if (name !== undefined && (!name || name.trim() === '')) {
      return NextResponse.json({ error: 'Folder name cannot be empty' }, { status: 400 });
    }

    // Updated color validation to match the main folders route
    const allowedColors = [
      'default', 'blue', 'green', 'yellow', 'pink', 'purple', 
      'red', 'lime', 'cyan', 'teal', 'orange', 'gray', 'indigo'
    ];
    
    let safeColor = color;
    if (!color || typeof color !== 'string' || !allowedColors.includes(color)) {
      console.warn('Invalid or missing color received for folder update:', color, 'Falling back to default.');
      console.warn('Allowed colors:', allowedColors);
      safeColor = 'default';
    }
    
    console.log('Final color to be used:', safeColor);

    const { data: folder, error } = await supabase
      .from('folders')
      .update({
        ...(name !== undefined && { name: name.trim() }),
        color: safeColor,
        ...(icon !== undefined && { icon }),
        ...(emoji !== undefined && { emoji }),
        ...(sort_order !== undefined && { sort_order }),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Database error updating folder:', error);
      return NextResponse.json({ error: 'Failed to update folder' }, { status: 500 });
    }

    console.log('Folder updated successfully:', folder);
    return NextResponse.json(folder);
  } catch (error) {
    console.error('Error in PUT /api/folders/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Extract token from request headers
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if folder is default (cannot delete default folders)
    const { data: folder } = await supabase
      .from('folders')
      .select('is_default')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (folder?.is_default) {
      return NextResponse.json({ error: 'Cannot delete default folders' }, { status: 400 });
    }

    const { error } = await supabase
      .from('folders')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting folder:', error);
      return NextResponse.json({ error: 'Failed to delete folder' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/folders/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 