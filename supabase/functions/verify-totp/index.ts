import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const ALLOWED_ORIGINS = [
  'https://konsensi-budgetbeheer.nl',
  'https://www.konsensi-budgetbeheer.nl',
];

const getCorsHeaders = (req: Request) => {
  const origin = req.headers.get('origin') || '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
};

// In-memory rate limiter (per Edge Function instance)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 5; // Max 5 attempts
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // Per 60 seconds

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }

  entry.count++;
  return true;
}

// Base32 decoder (RFC 4648)
function base32Decode(encoded: string): Uint8Array {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const cleanedInput = encoded.toUpperCase().replace(/[\s-]/g, '');
  const unpadded = cleanedInput.replace(/=+$/g, '');

  let bits = '';
  for (const char of unpadded) {
    const val = alphabet.indexOf(char);
    if (val === -1) continue;
    bits += val.toString(2).padStart(5, '0');
  }

  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.substring(i, i + 8), 2));
  }

  return new Uint8Array(bytes);
}

// Generate TOTP code from secret and counter using HMAC-SHA1
async function generateTOTPCode(secret: string, counter: number): Promise<string | null> {
  try {
    const secretBytes = base32Decode(secret);

    // Convert counter to 8-byte array (big-endian)
    const counterBuffer = new ArrayBuffer(8);
    const counterView = new DataView(counterBuffer);
    counterView.setUint32(0, Math.floor(counter / 0x100000000), false);
    counterView.setUint32(4, counter >>> 0, false);
    const counterBytes = new Uint8Array(counterBuffer);

    // Import key for HMAC-SHA1
    const key = await crypto.subtle.importKey(
      'raw',
      secretBytes,
      { name: 'HMAC', hash: 'SHA-1' },
      false,
      ['sign']
    );

    // Generate HMAC
    const signature = await crypto.subtle.sign('HMAC', key, counterBytes);
    const hmac = new Uint8Array(signature);

    // Dynamic truncation (RFC 4226)
    const offset = hmac[19] & 0x0f;
    const binary =
      ((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff);

    const otp = binary % 1000000;
    return otp.toString().padStart(6, '0');
  } catch {
    return null;
  }
}

// Verify TOTP code against secret with time window tolerance
async function verifyTOTP(secret: string, code: string): Promise<boolean> {
  const timeStep = 30;
  const currentTime = Math.floor(Date.now() / 1000);
  const counter = Math.floor(currentTime / timeStep);

  // Check current time window and ±1 adjacent windows (for clock drift)
  for (let i = -1; i <= 1; i++) {
    const expectedCode = await generateTOTPCode(secret, counter + i);
    if (expectedCode === code) {
      return true;
    }
  }
  return false;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: getCorsHeaders(req) });
  }

  try {
    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { user_id, code, secret } = await req.json();

    if (!code) {
      return new Response(
        JSON.stringify({ error: 'code is verplicht' }),
        {
          status: 400,
          headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
        }
      );
    }

    if (code.length !== 6 || !/^\d{6}$/.test(code)) {
      return new Response(
        JSON.stringify({ error: 'Code moet 6 cijfers zijn' }),
        {
          status: 400,
          headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
        }
      );
    }

    // Mode 1: Setup verification - secret provided directly (for initial 2FA setup)
    // Requires valid JWT - only authenticated users can set up 2FA
    if (secret) {
      // Validate JWT auth for setup mode
      const authHeader = req.headers.get('authorization');
      if (!authHeader) {
        return new Response(
          JSON.stringify({ error: 'Authenticatie vereist' }),
          {
            status: 401,
            headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
          }
        );
      }

      const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(
        authHeader.replace('Bearer ', '')
      );

      if (authError || !authUser) {
        return new Response(
          JSON.stringify({ error: 'Ongeldige sessie' }),
          {
            status: 401,
            headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
          }
        );
      }

      // Rate limit setup attempts by user ID
      if (!checkRateLimit(`setup:${authUser.id}`)) {
        return new Response(
          JSON.stringify({ error: 'Te veel pogingen. Probeer het over een minuut opnieuw.' }),
          {
            status: 429,
            headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
          }
        );
      }

      if (typeof secret !== 'string' || secret.length < 16) {
        return new Response(
          JSON.stringify({ error: 'Ongeldig secret' }),
          {
            status: 400,
            headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
          }
        );
      }

      const isValid = await verifyTOTP(secret, code);
      return new Response(
        JSON.stringify({ valid: isValid }),
        {
          status: 200,
          headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
        }
      );
    }

    // Mode 2: Login verification - fetch secret from DB using user_id
    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'user_id of secret is verplicht' }),
        {
          status: 400,
          headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate user_id is a UUID to prevent injection
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(user_id)) {
      return new Response(
        JSON.stringify({ error: 'Ongeldig user_id formaat' }),
        {
          status: 400,
          headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
        }
      );
    }

    // Rate limit login attempts by user_id
    if (!checkRateLimit(`login:${user_id}`)) {
      return new Response(
        JSON.stringify({ error: 'Te veel pogingen. Probeer het over een minuut opnieuw.' }),
        {
          status: 429,
          headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
        }
      );
    }

    // For login mode, JWT auth is optional since user hasn't completed login yet.
    // But if JWT is present (e.g., disabling 2FA), validate that user_id matches the JWT.
    const authHeader = req.headers.get('authorization');
    if (authHeader) {
      const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(
        authHeader.replace('Bearer ', '')
      );

      if (!authError && authUser && authUser.id !== user_id) {
        return new Response(
          JSON.stringify({ error: 'Geen toegang' }),
          {
            status: 403,
            headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // Fetch the TOTP secret server-side
    const { data: settings, error: dbError } = await supabaseAdmin
      .from('security_settings')
      .select('totp_secret, two_factor_enabled')
      .eq('user_id', user_id)
      .single();

    if (dbError || !settings) {
      return new Response(
        JSON.stringify({ error: '2FA configuratie niet gevonden' }),
        {
          status: 404,
          headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
        }
      );
    }

    if (!settings.two_factor_enabled || !settings.totp_secret) {
      return new Response(
        JSON.stringify({ error: '2FA is niet ingeschakeld' }),
        {
          status: 400,
          headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
        }
      );
    }

    // Verify the TOTP code server-side
    const isValid = await verifyTOTP(settings.totp_secret, code);

    return new Response(
      JSON.stringify({ valid: isValid }),
      {
        status: 200,
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Verificatie mislukt' }),
      {
        status: 500,
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
      }
    );
  }
});
