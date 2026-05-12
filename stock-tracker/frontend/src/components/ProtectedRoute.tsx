'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Spinner } from '@/components/ui';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router              = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <main
        role="main"
        aria-busy="true"
        aria-label="Authenticating…"
        className="min-h-screen flex items-center justify-center bg-gray-950"
      >
        <Spinner size="lg" label="Checking authentication…" />
      </main>
    );
  }

  if (!user) return null;

  return <>{children}</>;
}