const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !RESEND_API_KEY) {
  throw new Error('Missing required environment variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY');
}

const sendWelcomeMessage = async (email: string) => {
  const html = `
    <p>Hi,</p>
    <p>Welcome to FinSight!</p>
    <p>Your account has been successfully created and verified.</p>
    <p>You can now:</p>
    <ul>
      <li>Track your expenses</li>
      <li>Manage your income</li>
      <li>Create monthly budgets</li>
      <li>View analytics</li>
      <li>Receive AI-powered financial insights</li>
    </ul>
    <p>Thank you for joining FinSight.</p>
    <p>Happy Saving!</p>
    <p>— Team FinSight</p>
  `;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'FinSight <no-reply@finsight.com>',
      to: email,
      subject: 'Welcome to FinSight 🎉',
      html,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Resend API error: ${response.status} ${errorBody}`);
  }
};

const getUserFromToken = async (token: string) => {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: SUPABASE_SERVICE_ROLE_KEY,
    },
  });

  if (!response.ok) {
    throw new Error('Invalid authentication token.');
  }

  return response.json();
};

const updateUserMetadata = async (userId: string) => {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ user_metadata: { welcomeEmailSent: true } }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Failed to update user metadata: ${response.status} ${errorBody}`);
  }
};

export default async function handler(request: Request) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } });
  }

  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    return new Response(JSON.stringify({ error: 'Missing Authorization header' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const user = await getUserFromToken(token);
    if (!user?.email) {
      return new Response(JSON.stringify({ error: 'Authenticated user email not available' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    if (!user.email_confirmed_at) {
      return new Response(JSON.stringify({ error: 'Email not confirmed. Welcome email will be sent after verification.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (user.user_metadata?.welcomeEmailSent) {
      return new Response(JSON.stringify({ message: 'Welcome email already sent.' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    await sendWelcomeMessage(user.email);
    await updateUserMetadata(user.id);

    return new Response(JSON.stringify({ message: 'Welcome email sent.' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
