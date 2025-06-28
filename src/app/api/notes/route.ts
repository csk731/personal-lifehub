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

    // Use the helper function to get notes with folder information
    const { data: notes, error } = await supabase
      .rpc('get_notes_with_folders', { user_uuid: user.id });

    if (error) {
      console.error('Error fetching notes:', error);
      return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
    }

    // Transform the response to match the frontend interface
    const transformedNotes = (notes || []).map((note: any) => ({
      id: note.id,
      title: note.title,
      content: note.content,
      tags: note.tags,
      category: note.folder_name || 'unassigned', // Map folder_name to category for backward compatibility
      folderId: note.folder_id, // Add new folder_id field
      folderName: note.folder_name,
      folderColor: note.folder_color,
      folderEmoji: note.folder_emoji,
      color: note.color,
      isPinned: note.is_pinned,
      isStarred: note.is_starred,
      isArchived: note.is_archived,
      created_at: note.created_at,
      updated_at: note.updated_at,
      wordCount: note.word_count,
      characterCount: note.character_count,
    }));

    return NextResponse.json({ notes: transformedNotes });
  } catch (error) {
    console.error('Error in GET /api/notes:', error);
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
    const { title, content, tags, category, folderId, color, isPinned, isStarred, isArchived } = body;

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

    // Calculate word and character counts
    const wordCount = content ? content.trim().split(/\s+/).filter((word: string) => word.length > 0).length : 0;
    const characterCount = content ? content.length : 0;

    const allowedColors = ['default', 'blue', 'green', 'yellow', 'pink', 'purple'];
    const safeColor = allowedColors.includes(color) ? color : 'default';

    const { data: note, error } = await supabase
      .from('notes')
      .insert({
        user_id: user.id,
        folder_id: finalFolderId,
        title: title || '',
        content: content || '',
        tags: tags || [],
        color: safeColor,
        is_pinned: isPinned || false,
        is_starred: isStarred || false,
        is_archived: isArchived || false,
        word_count: wordCount,
        character_count: characterCount,
      })
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
      console.error('Error creating note:', error);
      return NextResponse.json({ error: 'Failed to create note' }, { status: 500 });
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
    console.error('Error in POST /api/notes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 