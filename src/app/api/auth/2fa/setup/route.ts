import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { generate2FASecret } from '@/lib/two-factor';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Generate 2FA secret
    const result = await generate2FASecret(session.user.email!);

    return NextResponse.json({
      success: true,
      secret: result.secret,
      qrCode: result.qrCode,
      backupCodes: result.backupCodes,
    });
  } catch (error) {
    console.error('2FA setup error:', error);
    return NextResponse.json({ error: 'Failed to generate 2FA setup' }, { status: 500 });
  }
}
