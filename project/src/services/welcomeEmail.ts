const endpoint = import.meta.env.VITE_WELCOME_EMAIL_ENDPOINT as string | undefined;

if (!endpoint) {
  console.warn('Missing VITE_WELCOME_EMAIL_ENDPOINT. Welcome email delivery will not work until this is configured.');
}

export async function triggerWelcomeEmail(accessToken: string | null | undefined): Promise<void> {
  if (!endpoint) {
    throw new Error('Welcome email endpoint is not configured.');
  }
  if (!accessToken) {
    throw new Error('Missing auth token for welcome email request.');
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({}),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const errorMessage = (data as { error?: string }).error || 'Failed to send welcome email.';
    throw new Error(errorMessage);
  }
}
