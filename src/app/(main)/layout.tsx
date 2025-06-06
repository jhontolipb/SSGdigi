
import { AppLayout } from '@/components/layout/AppLayout';

export default function MainAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppLayout>{children}</AppLayout>;
}
