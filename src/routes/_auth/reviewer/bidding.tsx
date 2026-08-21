// src/routes/bidding.tsx
import { createFileRoute } from '@tanstack/react-router';
import BiddingPage from '@/components/bidding/BiddingPage';

export const Route = createFileRoute('/_auth/reviewer/bidding')({
  component: BiddingPage,
});
