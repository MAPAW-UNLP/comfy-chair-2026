// src/routes/_auth/reviewer/history.tsx
import { createFileRoute } from "@tanstack/react-router";
import ReviewHistory from "@/components/reviewer/ReviewHistory";

export const Route = createFileRoute("/_auth/reviewer/history")({
  component: ReviewHistory,
});
