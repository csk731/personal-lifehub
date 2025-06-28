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

    // Test the notes table structure
    const { data: tableInfo, error: tableError } = await supabase
      .from('notes')
      .select('*')
      .limit(1);

    if (tableError) {
      return NextResponse.json({ 
        error: 'Table structure issue', 
        details: tableError.message,
        code: tableError.code 
      }, { status: 500 });
    }

    // Test creating a sample note
    const { data: testNote, error: createError } = await supabase
      .from('notes')
      .insert({
        user_id: user.id,
        title: 'Test Note',
        content: 'This is a test note to verify the API is working.',
        tags: ['test', 'api'],
        category: 'personal',
        color: 'blue',
        is_pinned: false,
        is_starred: false,
        is_archived: false,
      })
      .select()
      .single();

    if (createError) {
      return NextResponse.json({ 
        error: 'Failed to create test note', 
        details: createError.message,
        code: createError.code 
      }, { status: 500 });
    }

    // Clean up the test note
    await supabase
      .from('notes')
      .delete()
      .eq('id', testNote.id);

    return NextResponse.json({ 
      success: true, 
      message: 'Notes API is working correctly',
      testNote: {
        id: testNote.id,
        title: testNote.title,
        content: testNote.content,
        tags: testNote.tags,
        category: testNote.category,
        color: testNote.color,
        isPinned: testNote.is_pinned,
        isStarred: testNote.is_starred,
        isArchived: testNote.is_archived,
        wordCount: testNote.word_count,
        characterCount: testNote.character_count,
        created_at: testNote.created_at,
        updated_at: testNote.updated_at,
      }
    });

  } catch (error) {
    console.error('Error in test endpoint:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 