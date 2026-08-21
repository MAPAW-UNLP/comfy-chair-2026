import { createFileRoute } from "@tanstack/react-router";
import Inicio from "@/components/reviewer/ReviewsIndex";

function Index() {
  return (
    <div className="p-4">
      <Inicio />
    </div>
  );
}

export const Route = createFileRoute("/_auth/reviewer/")({
  component: Index,
});