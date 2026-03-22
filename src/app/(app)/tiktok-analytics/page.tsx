import { redirect } from 'next/navigation';

export default function TiktokAnalyticsRedirect() {
  redirect('/analytics?tab=tiktok');
}
