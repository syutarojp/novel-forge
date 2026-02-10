"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import type { SectionTrashItem } from "@/types";
import type { JSONContent } from "@tiptap/react";

export function useTrashItems(projectId: string | null) {
  return useQuery({
    queryKey: ["trash", projectId],
    queryFn: () =>
      apiFetch<SectionTrashItem[]>(`/api/projects/${projectId}/trash`),
    enabled: !!projectId,
  });
}

export function useTrashSection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      projectId: string;
      title: string;
      level: number;
      content: JSONContent;
    }) =>
      apiFetch<SectionTrashItem>(`/api/projects/${params.projectId}/trash`, {
        method: "POST",
        body: JSON.stringify({
          title: params.title,
          level: params.level,
          content: params.content,
        }),
      }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["trash", vars.projectId] });
    },
  });
}

export function useRestoreSection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { projectId: string; trashId: string }) =>
      apiFetch<{ content: JSONContent }>(
        `/api/projects/${params.projectId}/trash/${params.trashId}`,
        { method: "POST" }
      ),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["trash", vars.projectId] });
    },
  });
}

export function useDeleteTrashItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { projectId: string; trashId: string }) =>
      apiFetch<void>(
        `/api/projects/${params.projectId}/trash/${params.trashId}`,
        { method: "DELETE" }
      ),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["trash", vars.projectId] });
    },
  });
}
