"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import type { Project } from "@/types";

export function useProjects() {
  return useQuery({
    queryKey: ["projects"],
    queryFn: () => apiFetch<Project[]>("/api/projects"),
    staleTime: 0,
  });
}

export function useProject(id: string | null) {
  return useQuery({
    queryKey: ["project", id],
    queryFn: () => apiFetch<Project>(`/api/projects/${id}`),
    enabled: !!id,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      title: string;
      author?: string;
      genre?: string;
      targetWordCount?: number;
    }) =>
      apiFetch<Project>("/api/projects", {
        method: "POST",
        body: JSON.stringify(params),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (projectId: string) =>
      apiFetch<void>(`/api/projects/${projectId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { id: string; data: Partial<Project> }) =>
      apiFetch<Project>(`/api/projects/${params.id}`, {
        method: "PUT",
        body: JSON.stringify(params.data),
      }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["project", vars.id] });
    },
  });
}
