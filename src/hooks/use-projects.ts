"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { db } from "@/db";
import { createProject, deleteProject } from "@/db/seed";

export function useProjects() {
  return useQuery({
    queryKey: ["projects"],
    queryFn: () => db.projects.orderBy("updatedAt").reverse().toArray(),
  });
}

export function useProject(id: string | null) {
  return useQuery({
    queryKey: ["project", id],
    queryFn: () => (id ? db.projects.get(id) : undefined),
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
      createProject(
        params.title,
        params.author,
        params.genre,
        params.targetWordCount
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { id: string; data: Partial<import("@/types").Project> }) => {
      await db.projects.update(params.id, { ...params.data, updatedAt: new Date() });
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["project", vars.id] });
    },
  });
}
