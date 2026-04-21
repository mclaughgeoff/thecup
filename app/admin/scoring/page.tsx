import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function AdminScoringPage() {
  redirect('/admin/ryder-cup');
}
