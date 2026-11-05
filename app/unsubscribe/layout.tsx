import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Unsubscribe',
  robots: { index: false, follow: true },
};

export default function UnsubscribeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
