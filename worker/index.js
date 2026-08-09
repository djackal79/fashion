/**
 * Worker entrypoint. This project deploys via plain `wrangler deploy`, not
 * Cloudflare Pages — so the `functions/api/*` auto-routing convention from the
 * source repo (djackal79/luciole-website) does not apply here. This file is
 * that same enquiry logic ported to an explicit fetch handler, plus the
 * ASSETS binding serving everything else.
 *
 * This is the only place the service-role key exists. It comes from a Worker
 * secret (env.SUPABASE_SERVICE_ROLE_KEY), never from a committed file, and is
 * never returned in a response.
 */

const WINDOW_MINUTES = 10;
const MAX_PER_WINDOW = 3;

const LIMITS = { name: 200, email: 320, message: 4000, product_handle: 200 };
const ALLOWED_SOURCES = new Set(['general', 'wholesale', 'press']);

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/enquiry') {
      if (request.method !== 'POST') {
        return json({ error: 'Method not allowed.' }, 405, { Allow: 'POST' });
      }
      return handleEnquiry(request, env);
    }

    return env.ASSETS.fetch(request);
  },
};

async function handleEnquiry(request, env) {
  const missing = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'ENQUIRY_IP_SALT']
    .filter((key) => !env[key]);
  if (missing.length) {
    console.error(`enquiry: missing environment variables: ${missing.join(', ')}`);
    return json({ error: 'Enquiries are not configured yet.' }, 503);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Malformed request.' }, 400);
  }

  // Honeypot. Answer 200 so a bot cannot tell it was caught, but write nothing.
  if (typeof body.company_website === 'string' && body.company_website.trim() !== '') {
    return json({ ok: true }, 200);
  }

  const name = clean(body.name, LIMITS.name);
  const email = clean(body.email, LIMITS.email);
  const message = clean(body.message, LIMITS.message);
  const productHandle = clean(body.product_handle, LIMITS.product_handle) || null;
  const source = ALLOWED_SOURCES.has(body.source) ? body.source : 'general';

  if (!name || !email || !message) {
    return json({ error: 'Name, email and message are all required.' }, 400);
  }
  if (!isEmail(email)) {
    return json({ error: 'That email address does not look right.' }, 400);
  }

  const ip = request.headers.get('CF-Connecting-IP') || '';
  const ipHash = ip ? await sha256(`${ip}:${env.ENQUIRY_IP_SALT}`) : null;

  const rest = new SupabaseRest(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  if (ipHash) {
    const since = new Date(Date.now() - WINDOW_MINUTES * 60_000).toISOString();
    try {
      const recent = await rest.count('enquiries', `ip_hash=eq.${ipHash}&created_at=gte.${since}`);
      if (recent >= MAX_PER_WINDOW) {
        return json(
          { error: `Too many enquiries. Try again in ${WINDOW_MINUTES} minutes.` },
          429,
          { 'Retry-After': String(WINDOW_MINUTES * 60) }
        );
      }
    } catch (err) {
      console.error('enquiry: rate-limit check failed:', err.message);
    }
  }

  try {
    const row = await rest.insert('enquiries', {
      source,
      product_handle: productHandle,
      name,
      email,
      message,
      ip_hash: ipHash,
      project_id: env.ENQUIRY_PROJECT_ID || null,
    });
    return json({ ok: true, id: row?.id ?? null }, 201);
  } catch (err) {
    console.error('enquiry: insert failed:', err.message);
    return json({ error: 'Could not save your enquiry.' }, 502);
  }
}

class SupabaseRest {
  constructor(url, serviceRoleKey) {
    this.base = `${url.replace(/\/+$/, '')}/rest/v1`;
    this.headers = {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
    };
  }

  async count(table, query) {
    const response = await fetch(`${this.base}/${table}?select=id&${query}`, {
      headers: { ...this.headers, Prefer: 'count=exact', Range: '0-0' },
    });
    if (!response.ok) throw new Error(`count ${response.status}`);
    const total = (response.headers.get('content-range') || '').split('/')[1];
    return Number.parseInt(total, 10) || 0;
  }

  async insert(table, values) {
    const response = await fetch(`${this.base}/${table}`, {
      method: 'POST',
      headers: { ...this.headers, Prefer: 'return=representation' },
      body: JSON.stringify(values),
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new Error(`insert ${response.status}: ${detail.slice(0, 200)}`);
    }
    const [row] = await response.json();
    return row;
  }
}

function clean(value, max) {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, max);
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

async function sha256(input) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function json(payload, status, headers = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}
