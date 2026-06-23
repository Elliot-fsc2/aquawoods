import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";

const AppShell = lazy(() => import("../app/AppShell"));

// Catch-all: hand every URL to the inner react-router app (client-only)
export const Route = createFileRoute("/$")({
  ssr: false,
  component: AppShell,
});

