import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    // If no service role key, return empty mapping
    if (!supabaseServiceKey) {
      console.warn('⚠️ SUPABASE_SERVICE_ROLE_KEY not configured, user emails will not be available')
      return NextResponse.json({ userEmails: {} })
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Get all enrichment jobs to find unique user IDs
    const { data: jobs } = await supabaseAdmin
      .from('enrichment_jobs')
      .select('run_user_id')
      .not('run_user_id', 'is', null)

    const uniqueUserIds = [...new Set(jobs?.map(j => j.run_user_id).filter(Boolean) || [])]
    
    console.log('📊 Fetching emails for user IDs:', uniqueUserIds)

    // Get user emails from auth.users using admin client
    const userEmails: Record<string, string> = {}
    
    for (const userId of uniqueUserIds) {
      const { data: { user }, error } = await supabaseAdmin.auth.admin.getUserById(userId as string)
      if (user && user.email) {
        userEmails[userId as string] = user.email
      } else {
        console.warn(`⚠️ Could not get email for user ${userId}:`, error)
      }
    }

    console.log('✅ Fetched emails for', Object.keys(userEmails).length, 'users')

    return NextResponse.json({ userEmails })
  } catch (error) {
    console.error('❌ Error fetching user emails:', error)
    return NextResponse.json({ userEmails: {} })
  }
}

