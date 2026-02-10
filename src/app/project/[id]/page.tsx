"use client";

import { use } from "react";
import { AppShell } from "@/components/app-shell/app-shell";

export default function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <AppShell projectId={id} />;
}
