"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import type { CodexEntry, CodexEntryType, CodexRelation } from "@/types";

// === Entries ===

export function useCodexEntries(projectId: string | null) {
  return useQuery({
    queryKey: ["codexEntries", projectId],
    queryFn: () =>
      apiFetch<CodexEntry[]>(`/api/projects/${projectId}/codex-entries`),
    enabled: !!projectId,
  });
}

export function useCodexEntry(id: string | null, projectId?: string | null) {
  return useQuery({
    queryKey: ["codexEntry", id],
    queryFn: () =>
      apiFetch<CodexEntry>(
        `/api/projects/${projectId}/codex-entries/${id}`
      ),
    enabled: !!id && !!projectId,
  });
}

export function useCreateCodexEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      projectId: string;
      type: CodexEntryType;
      name?: string;
    }) =>
      apiFetch<CodexEntry>(`/api/projects/${params.projectId}/codex-entries`, {
        method: "POST",
        body: JSON.stringify({
          type: params.type,
          name: params.name ?? "無題のエントリ",
        }),
      }),
    onSuccess: (entry) => {
      queryClient.invalidateQueries({
        queryKey: ["codexEntries", entry.projectId],
      });
    },
  });
}

export function useUpdateCodexEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      id: string;
      projectId: string;
      data: Partial<CodexEntry>;
    }) =>
      apiFetch<CodexEntry>(
        `/api/projects/${params.projectId}/codex-entries/${params.id}`,
        {
          method: "PUT",
          body: JSON.stringify(params.data),
        }
      ),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({
        queryKey: ["codexEntries", vars.projectId],
      });
      queryClient.invalidateQueries({ queryKey: ["codexEntry", vars.id] });
    },
  });
}

export function useDeleteCodexEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { id: string; projectId: string }) =>
      apiFetch<void>(
        `/api/projects/${params.projectId}/codex-entries/${params.id}`,
        { method: "DELETE" }
      ),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({
        queryKey: ["codexEntries", vars.projectId],
      });
      queryClient.invalidateQueries({
        queryKey: ["codexRelations", vars.projectId],
      });
    },
  });
}

// === Relations ===

export function useCodexRelations(projectId: string | null) {
  return useQuery({
    queryKey: ["codexRelations", projectId],
    queryFn: () =>
      apiFetch<CodexRelation[]>(
        `/api/projects/${projectId}/codex-relations`
      ),
    enabled: !!projectId,
  });
}

export function useCreateCodexRelation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      projectId: string;
      sourceId: string;
      targetId: string;
      label: string;
    }) =>
      apiFetch<CodexRelation>(
        `/api/projects/${params.projectId}/codex-relations`,
        {
          method: "POST",
          body: JSON.stringify({
            sourceId: params.sourceId,
            targetId: params.targetId,
            label: params.label,
          }),
        }
      ),
    onSuccess: (rel) => {
      queryClient.invalidateQueries({
        queryKey: ["codexRelations", rel.projectId],
      });
    },
  });
}

export function useDeleteCodexRelation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { id: string; projectId: string }) =>
      apiFetch<void>(
        `/api/projects/${params.projectId}/codex-relations?id=${params.id}`,
        { method: "DELETE" }
      ),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({
        queryKey: ["codexRelations", vars.projectId],
      });
    },
  });
}
