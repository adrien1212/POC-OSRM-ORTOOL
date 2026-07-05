import { createFileRoute } from "@tanstack/react-router";
import Home from "@/pages/Home";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Vehicle Routing Planner — Plan & Optimize Delivery Routes" },
      {
        name: "description",
        content:
          "Add delivery points, configure depots and vehicles, and optimize multi-vehicle routes on an interactive map.",
      },
      { property: "og:title", content: "Vehicle Routing Planner" },
      {
        property: "og:description",
        content:
          "Plan, visualize and optimize vehicle routing problems with an interactive map.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return <Home />;
}
