import { auth } from '@clerk/nextjs/server';

export async function getAuthToken() {
  const { getToken } = await auth();
  return await getToken();
}

export async function getCurrentUser() {
  const { userId, sessionClaims } = await auth();

  if (!userId) {
    return null;
  }

  return {
    userId,
    role: sessionClaims?.metadata?.role || sessionClaims?.publicMetadata?.role || 'CUSTOMER',
    email: sessionClaims?.email
  };
}