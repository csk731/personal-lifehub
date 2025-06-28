import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
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

    const { data: note, error } = await supabase
      .from('notes')
      .select(`
        *,
        folders (
          id,
          name,
          color,
          emoji
        )
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Error fetching note:', error);
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    // Transform the response to match the frontend interface
    const transformedNote = {
      id: note.id,
      title: note.title,
      content: note.content,
      tags: note.tags,
      category: note.folders?.name || 'unassigned',
      folderId: note.folder_id,
      folderName: note.folders?.name,
      folderColor: note.folders?.color,
      folderEmoji: note.folders?.emoji,
      color: note.color,
      isPinned: note.is_pinned,
      isStarred: note.is_starred,
      isArchived: note.is_archived,
      created_at: note.created_at,
      updated_at: note.updated_at,
      wordCount: note.word_count,
      characterCount: note.character_count,
    };

    return NextResponse.json(transformedNote);
  } catch (error) {
    console.error('Error in GET /api/notes/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
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

    const body = await request.json();
    const { title, content, tags, category, folderId, color, isPinned, isStarred, isArchived, wordCount, characterCount } = body;

    // If category is provided but folderId is not, try to find the folder by name
    let finalFolderId = folderId;
    if (category && !folderId && category !== 'unassigned') {
      const { data: folder } = await supabase
        .from('folders')
        .select('id')
        .eq('user_id', user.id)
        .eq('name', category)
        .single();
      
      finalFolderId = folder?.id || null;
    }

    // Build updates object dynamically – only include fields that were provided
    const updates: Record<string, any> = { updated_at: new Date().toISOString() };

    if (title !== undefined) updates.title = title;
    if (content !== undefined) updates.content = content;
    if (tags !== undefined) updates.tags = tags;
    if (finalFolderId !== undefined) updates.folder_id = finalFolderId;
    if (color !== undefined) {
      const allowedColors = ['default', 'blue', 'green', 'yellow', 'pink', 'purple'];
      updates.color = allowedColors.includes(color) ? color : 'default';
    }
    if (isPinned !== undefined) updates.is_pinned = isPinned;
    if (isStarred !== undefined) updates.is_starred = isStarred;
    if (isArchived !== undefined) updates.is_archived = isArchived;

    // Calculate word and character counts if content provided or counts explicitly provided
    if (content !== undefined || wordCount !== undefined || characterCount !== undefined) {
      const finalWordCount = wordCount !== undefined ? wordCount : (content ? content.trim().split(/\s+/).filter((word: string) => word.length > 0).length : 0);
      const finalCharacterCount = characterCount !== undefined ? characterCount : (content ? content.length : 0);
      updates.word_count = finalWordCount;
      updates.character_count = finalCharacterCount;
    }

    const { data: note, error } = await supabase
      .from('notes')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select(`
        *,
        folders (
          id,
          name,
          color,
          emoji
        )
      `)
      .single();

    if (error) {
      console.error('Error updating note:', error);
      return NextResponse.json({ error: 'Failed to update note' }, { status: 500 });
    }

    // Transform the response to match the frontend interface
    const transformedNote = {
      id: note.id,
      title: note.title,
      content: note.content,
      tags: note.tags,
      category: note.folders?.name || 'unassigned',
      folderId: note.folder_id,
      folderName: note.folders?.name,
      folderColor: note.folders?.color,
      folderEmoji: note.folders?.emoji,
      color: note.color,
      isPinned: note.is_pinned,
      isStarred: note.is_starred,
      isArchived: note.is_archived,
      created_at: note.created_at,
      updated_at: note.updated_at,
      wordCount: note.word_count,
      characterCount: note.character_count,
    };

    return NextResponse.json(transformedNote);
  } catch (error) {
    console.error('Error in PUT /api/notes/[id]:', error);
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

    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting note:', error);
      return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/notes/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 