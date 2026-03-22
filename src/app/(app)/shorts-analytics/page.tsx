import { redirect } from 'next/navigation';

export default function ShortsAnalyticsRedirect() {
  redirect('/analytics?tab=shorts');
}
