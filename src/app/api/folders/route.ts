import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
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

    const { data: folders, error } = await supabase
      .from('folders')
      .select('*')
      .eq('user_id', user.id)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching folders:', error);
      return NextResponse.json({ error: 'Failed to fetch folders' }, { status: 500 });
    }

    return NextResponse.json({ folders: folders || [] });
  } catch (error) {
    console.error('Error in GET /api/folders:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
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
    const { name, color, icon, emoji } = body;

    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Folder name is required' }, { status: 400 });
    }

    // Define all supported colors - all colors now supported after database migration
    const allowedColors = ['blue', 'green', 'purple', 'red', 'yellow', 'pink', 'indigo', 'gray', 'orange', 'teal', 'cyan', 'lime'];
    const safeColor = allowedColors.includes(color) ? color : 'blue';

    console.log('=== FOLDER CREATION DEBUG ===');
    console.log('Request body:', body);
    console.log('Requested color:', color);
    console.log('Safe color:', safeColor);
    console.log('Is color in allowed list?', allowedColors.includes(color));
    console.log('=============================');

    // Get the highest sort_order to place new folder at the end
    const { data: maxSortResult } = await supabase
      .from('folders')
      .select('sort_order')
      .eq('user_id', user.id)
      .order('sort_order', { ascending: false })
      .limit(1);

    const nextSortOrder = maxSortResult && maxSortResult.length > 0 
      ? (maxSortResult[0].sort_order || 0) + 1 
      : 0;

    console.log('About to insert folder with:', {
      user_id: user.id,
      name: name.trim(),
      color: safeColor,
      icon: icon || '📁',
      emoji: emoji || '📁',
      sort_order: nextSortOrder,
    });

    const { data: folder, error } = await supabase
      .from('folders')
      .insert({
        user_id: user.id,
        name: name.trim(),
        color: safeColor,
        icon: icon || '📁',
        emoji: emoji || '📁',
        sort_order: nextSortOrder,
      })
      .select()
      .single();

    if (error) {
      console.error('=== FOLDER CREATION ERROR ===');
      console.error('Error creating folder:', error);
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      console.error('=============================');
      return NextResponse.json({ 
        error: 'Failed to create folder',
        details: error.message 
      }, { status: 500 });
    }

    console.log('=== FOLDER CREATION SUCCESS ===');
    console.log('Created folder:', folder);
    console.log('=============================');

    return NextResponse.json(folder);
  } catch (error) {
    console.error('Error in POST /api/folders:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
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
    const { folders } = body;

    if (!folders || !Array.isArray(folders)) {
      return NextResponse.json({ error: 'Folders array is required' }, { status: 400 });
    }

    // Update each folder's sort_order
    const updatePromises = folders.map((folder: any) => 
      supabase
        .from('folders')
        .update({ sort_order: folder.sort_order })
        .eq('id', folder.id)
        .eq('user_id', user.id)
    );

    const results = await Promise.all(updatePromises);
    
    // Check for any errors
    const errors = results.filter(result => result.error);
    if (errors.length > 0) {
      console.error('Error updating folder order:', errors);
      return NextResponse.json({ error: 'Failed to update folder order' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Folder order updated successfully' });
  } catch (error) {
    console.error('Error in PUT /api/folders:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 