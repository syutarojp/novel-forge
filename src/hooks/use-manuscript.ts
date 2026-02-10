"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import type { JSONContent } from "@tiptap/react";

interface ManuscriptData {
  content: JSONContent | null;
  wordCount: number;
}

export function useManuscriptContent(projectId: string | null) {
  return useQuery({
    queryKey: ["manuscriptContent", projectId],
    queryFn: () =>
      apiFetch<ManuscriptData>(`/api/projects/${projectId}/content`),
    enabled: !!projectId,
  });
}

export function useUpdateManuscriptContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      projectId: string;
      content: JSONContent;
      wordCount: number;
    }) =>
      apiFetch<ManuscriptData>(`/api/projects/${params.projectId}/content`, {
        method: "PUT",
        body: JSON.stringify({
          content: params.content,
          wordCount: params.wordCount,
        }),
      }),
    onSuccess: (_, vars) => {
      // Update cache directly — editor is the source of truth, no re-fetch needed.
      // Re-fetching would overwrite the editor with stale data via the setContent effect.
      queryClient.setQueryData(["manuscriptContent", vars.projectId], {
        content: vars.content,
        wordCount: vars.wordCount,
      });
      // Invalidate the project query so word count updates in the project list
      queryClient.invalidateQueries({
        queryKey: ["project", vars.projectId],
      });
    },
  });
}
