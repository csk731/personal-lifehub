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
    
    if (!authHeader) {
      return NextResponse.json({ 
        error: 'No authorization header found',
        headers: Object.fromEntries(request.headers.entries())
      }, { status: 401 });
    }

    if (!authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ 
        error: 'Invalid authorization header format',
        authHeader: authHeader.substring(0, 20) + '...'
      }, { status: 401 });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    if (!token) {
      return NextResponse.json({ 
        error: 'Empty token after Bearer prefix'
      }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError) {
      return NextResponse.json({ 
        error: 'Auth error',
        details: authError.message,
        code: authError.status
      }, { status: 401 });
    }

    if (!user) {
      return NextResponse.json({ 
        error: 'No user found'
      }, { status: 401 });
    }

    return NextResponse.json({ 
      success: true,
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at
      },
      tokenLength: token.length,
      tokenPreview: token.substring(0, 20) + '...'
    });

  } catch (error) {
    console.error('Error in debug auth endpoint:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 