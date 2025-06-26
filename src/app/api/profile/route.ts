import { createClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser(request)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Extract the access token from the request headers
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: { headers: { Authorization: `Bearer ${token}` } }
      }
    )

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // Profile doesn't exist, create one
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert([
            {
              id: user.id,
              email: user.email,
              full_name: user.user_metadata?.full_name || '',
              avatar_url: user.user_metadata?.avatar_url || ''
            }
          ])
          .select()
          .single()

        if (createError) {
          return NextResponse.json({ error: createError.message }, { status: 500 })
        }

        return NextResponse.json({ profile: newProfile })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ profile })
  } catch (error) {
    console.error('Profile fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser(request)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Extract the access token from the request headers
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: { headers: { Authorization: `Bearer ${token}` } }
      }
    )

    const body = await request.json()
    const { full_name, avatar_url, bio, location, website, phone, date_of_birth, preferences } = body

    // Validate input
    const validationErrors: string[] = []

    if (full_name !== undefined && (typeof full_name !== 'string' || full_name.trim().length > 100)) {
      validationErrors.push('Full name must be a string and less than 100 characters')
    }

    if (bio !== undefined && (typeof bio !== 'string' || bio.length > 500)) {
      validationErrors.push('Bio must be a string and less than 500 characters')
    }

    if (location !== undefined && (typeof location !== 'string' || location.length > 100)) {
      validationErrors.push('Location must be a string and less than 100 characters')
    }

    if (website !== undefined && website !== null) {
      try {
        new URL(website)
      } catch {
        validationErrors.push('Website must be a valid URL')
      }
    }

    if (phone !== undefined && phone !== null && !/^[\+]?[1-9][\d]{0,15}$/.test(phone)) {
      validationErrors.push('Phone must be a valid phone number')
    }

    if (date_of_birth !== undefined && date_of_birth !== null) {
      const date = new Date(date_of_birth)
      if (isNaN(date.getTime())) {
        validationErrors.push('Date of birth must be a valid date')
      }
      // Check if user is at least 13 years old
      const minDate = new Date()
      minDate.setFullYear(minDate.getFullYear() - 13)
      if (date > minDate) {
        validationErrors.push('You must be at least 13 years old')
      }
    }

    if (validationErrors.length > 0) {
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: validationErrors 
      }, { status: 400 })
    }

    // Prepare update data
    const updateData: any = {}
    
    if (full_name !== undefined) updateData.full_name = full_name?.trim() || null
    if (avatar_url !== undefined) updateData.avatar_url = avatar_url || null
    if (bio !== undefined) updateData.bio = bio?.trim() || null
    if (location !== undefined) updateData.location = location?.trim() || null
    if (website !== undefined) updateData.website = website || null
    if (phone !== undefined) updateData.phone = phone || null
    if (date_of_birth !== undefined) updateData.date_of_birth = date_of_birth || null
    if (preferences !== undefined) updateData.preferences = preferences || {}

    // Update profile
    const { data: profile, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', user.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ 
      profile,
      message: 'Profile updated successfully'
    })
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser(request)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Extract the access token from the request headers
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: { headers: { Authorization: `Bearer ${token}` } }
      }
    )

    // Delete profile (this will cascade to related data due to foreign key constraints)
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', user.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Sign out the user after account deletion
    const { error: signOutError } = await supabase.auth.signOut()
    if (signOutError) {
      console.error('Sign out error after account deletion:', signOutError)
    }

    return NextResponse.json({ 
      message: 'Account deleted successfully'
    })
  } catch (error) {
    console.error('Account deletion error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 