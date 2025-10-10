import { createRouteHandlerClient } from '@/utils/supabase'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'
import { transformScraperOutputToLeadData } from '@/utils/scraper-transformer'

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { correlation_id } = body;

    if (!correlation_id || typeof correlation_id !== 'string') {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Correlation ID is required" 
      }), { status: 400 });
    }

    // Query the enrichment_jobs table for the job status (RLS will handle auth)
    const supabase = createRouteHandlerClient(req);
    const { data: jobData, error: queryError } = await supabase
      .from('enrichment_jobs')
      .select('overall_job_status, scraper_worker_results_json, created_at, input_customer_name, input_street_address, input_city, input_state')
      .eq('correlation_id', correlation_id)
      .single();

    if (queryError) {
      if (queryError.code === 'PGRST116') {
        // No rows found
        return new Response(JSON.stringify({ 
          success: false, 
          error: "Job not found" 
        }), { status: 404 });
      }
      
      console.error('Database query error:', queryError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Database query failed" 
      }), { status: 500 });
    }

    if (!jobData) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Job not found" 
      }), { status: 404 });
    }

    // Check if job is completed
    if (jobData.overall_job_status === 'scraper_worker_complete') {
      // Transform the scraper_worker_results_json to LeadData format using centralized transformer
      // Pass job input data for fallback values
      const leadData = transformScraperOutputToLeadData(
        jobData.scraper_worker_results_json,
        {
          input_customer_name: jobData.input_customer_name,
          input_street_address: jobData.input_street_address,
          input_city: jobData.input_city,
          input_state: jobData.input_state
        }
      );

      return new Response(JSON.stringify({
        success: true,
        status: 'completed',
        data: leadData
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Job is still processing
    const statusMessage = getStatusMessage(jobData.overall_job_status);

    return new Response(JSON.stringify({
      success: true,
      status: jobData.overall_job_status,
      message: statusMessage,
      created_at: jobData.created_at
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error('Job status check error:', err);
    return new Response(JSON.stringify({ 
      success: false, 
      error: "Internal server error" 
    }), { status: 500 });
  }
}

// Get user-friendly status message
function getStatusMessage(jobStatus: string) {
  switch (jobStatus) {
    case 'pending_url_search':
      return 'Finding company website...';
    case 'url_worker_called':
      return 'URL search in progress...';
    case 'url_worker_complete':
      return 'Website found, preparing to analyze...';
    case 'scraper_worker_called':
      return 'Analyzing website content...';
    case 'scraper_worker_complete':
      return 'Enrichment completed successfully!';
    case 'failed':
      return 'Enrichment failed. Please try again.';
    case 'expired':
      return 'Job expired. Please try again.';
    case 'cancelled':
      return 'Job was cancelled.';
    case 'queued':
      return 'Job is queued...';
    case 'in_progress':
      return 'Job is in progress...';
    default:
      return 'Processing...';
  }
}
