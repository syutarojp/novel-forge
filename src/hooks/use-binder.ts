"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import type { BinderItem } from "@/types";

/** Fetch all research items for a project */
export function useResearchItems(projectId: string | null) {
  return useQuery({
    queryKey: ["researchItems", projectId],
    queryFn: () =>
      apiFetch<BinderItem[]>(`/api/projects/${projectId}/binder-items`),
    enabled: !!projectId,
  });
}

/** Fetch a single research item by ID */
export function useResearchItem(id: string | null) {
  return useQuery({
    queryKey: ["researchItem", id],
    queryFn: () => apiFetch<BinderItem>(`/api/binder-items/${id}`),
    enabled: !!id,
  });
}

/** Create a new research item */
export function useCreateResearchItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      projectId: string;
      title?: string;
    }) => {
      return apiFetch<BinderItem>(
        `/api/projects/${params.projectId}/binder-items`,
        {
          method: "POST",
          body: JSON.stringify({
            parentId: null,
            sortOrder: "a0",
            type: "research",
            title: params.title ?? "無題のリサーチ",
            includeInCompile: false,
            sceneMeta: { characterIds: [], subplotIds: [] },
          }),
        }
      );
    },
    onSuccess: (item) => {
      queryClient.invalidateQueries({
        queryKey: ["researchItems", item.projectId],
      });
    },
  });
}

/** Update a research item */
export function useUpdateResearchItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      id: string;
      projectId: string;
      data: Partial<BinderItem>;
    }) =>
      apiFetch<BinderItem>(
        `/api/projects/${params.projectId}/binder-items/${params.id}`,
        {
          method: "PUT",
          body: JSON.stringify(params.data),
        }
      ),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({
        queryKey: ["researchItems", vars.projectId],
      });
      queryClient.invalidateQueries({ queryKey: ["researchItem", vars.id] });
    },
  });
}

/** Delete a research item */
export function useDeleteResearchItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { id: string; projectId: string }) =>
      apiFetch<void>(
        `/api/projects/${params.projectId}/binder-items/${params.id}`,
        { method: "DELETE" }
      ),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({
        queryKey: ["researchItems", vars.projectId],
      });
    },
  });
}
