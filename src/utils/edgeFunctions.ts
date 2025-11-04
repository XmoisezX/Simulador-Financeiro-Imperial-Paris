export const SUPABASE_FUNCTIONS_URL = 'https://pqievwbfrbiqhvdyalrh.supabase.co/functions/v1';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxaWV2d2JmcmJpcWh2ZHlhbHJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1MDQ1MDEsImV4cCI6MjA3NzA4MDUwMX0.e0Pc2M9c-NCwkWxM8ssJhv-ANFojJipeQY4W9UPgg4I';

type EdgeResult<T = any> = { data: T | null; error: { message: string } | null; status: number };

export async function invokeEdgeFunction<T = any>(
  name: string,
  body: unknown,
  accessToken?: string
): Promise<EdgeResult<T>> {
  const url = `${SUPABASE_FUNCTIONS_URL}/${name}`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        apikey: SUPABASE_ANON_KEY,
      },
      body: JSON.stringify(body ?? {}),
    });

    const contentType = res.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const payload = isJson ? await res.json().catch(() => null) : null;

    if (!res.ok) {
      return {
        data: null,
        error: { message: payload?.error || payload?.message || `Edge function error (status ${res.status})` },
        status: res.status,
      };
    }
    return { data: payload as T, error: null, status: res.status };
  } catch (e: any) {
    return {
      data: null,
      error: { message: e?.message || 'Failed to send a request to the Edge Function' },
      status: 0,
    };
  }
}