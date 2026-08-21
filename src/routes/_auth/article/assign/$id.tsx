import { createFileRoute } from '@tanstack/react-router';
import { ReviewerApp } from '@/components/reviewer/ReviewerApp';

export const Route = createFileRoute('/_auth/article/assign/$id')({
  component: ReviewerApp,
});

