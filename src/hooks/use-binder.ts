"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { generateKeyBetween } from "fractional-indexing";
import { apiFetch } from "@/lib/api-client";
import type { BinderItem, BinderItemType } from "@/types";

export function useBinderItems(projectId: string | null) {
  return useQuery({
    queryKey: ["binderItems", projectId],
    queryFn: () =>
      apiFetch<BinderItem[]>(`/api/projects/${projectId}/binder-items`),
    enabled: !!projectId,
  });
}

export function useBinderItem(id: string | null) {
  return useQuery({
    queryKey: ["binderItem", id],
    queryFn: () => apiFetch<BinderItem>(`/api/binder-items/${id}`),
    enabled: !!id,
  });
}

export function useCreateBinderItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      projectId: string;
      parentId: string | null;
      type: BinderItemType;
      title?: string;
      afterSortOrder?: string | null;
      beforeSortOrder?: string | null;
    }) => {
      const sortOrder = generateKeyBetween(
        params.afterSortOrder ?? null,
        params.beforeSortOrder ?? null
      );
      return apiFetch<BinderItem>(
        `/api/projects/${params.projectId}/binder-items`,
        {
          method: "POST",
          body: JSON.stringify({
            parentId: params.parentId,
            sortOrder,
            type: params.type,
            title:
              params.title ??
              (params.type === "folder" ? "新しいフォルダ" : "無題のシーン"),
            includeInCompile: params.type !== "research",
            sceneMeta: { characterIds: [], subplotIds: [] },
          }),
        }
      );
    },
    onSuccess: (item) => {
      queryClient.invalidateQueries({
        queryKey: ["binderItems", item.projectId],
      });
    },
  });
}

export function useUpdateBinderItem() {
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
        queryKey: ["binderItems", vars.projectId],
      });
      queryClient.invalidateQueries({ queryKey: ["binderItem", vars.id] });
    },
  });
}

export function useDeleteBinderItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { id: string; projectId: string }) =>
      apiFetch<void>(
        `/api/projects/${params.projectId}/binder-items/${params.id}`,
        { method: "DELETE" }
      ),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({
        queryKey: ["binderItems", vars.projectId],
      });
    },
  });
}

export function useMoveBinderItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      id: string;
      projectId: string;
      newParentId: string | null;
      newSortOrder: string;
    }) =>
      apiFetch<BinderItem>(
        `/api/projects/${params.projectId}/binder-items/${params.id}`,
        {
          method: "PUT",
          body: JSON.stringify({
            parentId: params.newParentId,
            sortOrder: params.newSortOrder,
          }),
        }
      ),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({
        queryKey: ["binderItems", vars.projectId],
      });
    },
  });
}
