import { auth } from '../../lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@marketbrain/db';
import { AppShell } from './components/app-shell';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  // Gate: redirect to onboarding if not completed
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { notificationPreferences: true },
  });
  const prefs = (user?.notificationPreferences as Record<string, unknown>) ?? {};
  if (!prefs.onboardingCompleted) {
    redirect('/onboarding');
  }

  return <AppShell user={session.user}>{children}</AppShell>;
}
