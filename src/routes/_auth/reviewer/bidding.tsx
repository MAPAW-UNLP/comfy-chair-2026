// src/routes/bidding.tsx
import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import BiddingPage from '@/components/bidding/BiddingPage';

const biddingSearchSchema = z.object({
  conferenceId: z.number().int().positive().optional().catch(undefined),
  sessionId: z.number().int().positive().optional().catch(undefined),
});

export const Route = createFileRoute('/_auth/reviewer/bidding')({
  validateSearch: biddingSearchSchema,
  component: BiddingPage,
});
