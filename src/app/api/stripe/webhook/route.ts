// Redirect old webhook path to new one for backward compatibility
// Stripe is configured to use /api/webhooks/stripe
export { POST } from '@/app/api/webhooks/stripe/route';
