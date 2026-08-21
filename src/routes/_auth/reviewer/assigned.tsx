import AssignedArticlesView from "@/components/reviewer/AssignedArticles";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/reviewer/assigned")({
  component: AssignedArticlesView,
});
