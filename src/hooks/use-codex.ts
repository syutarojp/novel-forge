"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { v4 as uuidv4 } from "uuid";
import { db } from "@/db";
import type { CodexEntry, CodexEntryType, CodexRelation } from "@/types";

// === Entries ===

export function useCodexEntries(projectId: string | null) {
  return useQuery({
    queryKey: ["codexEntries", projectId],
    queryFn: () =>
      projectId
        ? db.codexEntries.where("projectId").equals(projectId).toArray()
        : [],
    enabled: !!projectId,
  });
}

export function useCodexEntry(id: string | null) {
  return useQuery({
    queryKey: ["codexEntry", id],
    queryFn: () => (id ? db.codexEntries.get(id) : undefined),
    enabled: !!id,
  });
}

export function useCreateCodexEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      projectId: string;
      type: CodexEntryType;
      name?: string;
    }) => {
      const now = new Date();
      const entry: CodexEntry = {
        id: uuidv4(),
        projectId: params.projectId,
        type: params.type,
        name: params.name ?? "無題のエントリ",
        aliases: [],
        description: null,
        notes: "",
        thumbnail: null,
        tags: [],
        fieldValues: {},
        color: null,
        createdAt: now,
        updatedAt: now,
      };
      await db.codexEntries.add(entry);
      return entry;
    },
    onSuccess: (entry) => {
      queryClient.invalidateQueries({ queryKey: ["codexEntries", entry.projectId] });
    },
  });
}

export function useUpdateCodexEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      id: string;
      projectId: string;
      data: Partial<CodexEntry>;
    }) => {
      await db.codexEntries.update(params.id, {
        ...params.data,
        updatedAt: new Date(),
      });
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["codexEntries", vars.projectId] });
      queryClient.invalidateQueries({ queryKey: ["codexEntry", vars.id] });
    },
  });
}

export function useDeleteCodexEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { id: string; projectId: string }) => {
      // Delete entry and its relations
      const relations = await db.codexRelations
        .where("projectId")
        .equals(params.projectId)
        .toArray();
      const relIdsToDelete = relations
        .filter((r) => r.sourceId === params.id || r.targetId === params.id)
        .map((r) => r.id);
      await db.codexRelations.bulkDelete(relIdsToDelete);
      await db.codexEntries.delete(params.id);
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["codexEntries", vars.projectId] });
      queryClient.invalidateQueries({ queryKey: ["codexRelations", vars.projectId] });
    },
  });
}

// === Relations ===

export function useCodexRelations(projectId: string | null) {
  return useQuery({
    queryKey: ["codexRelations", projectId],
    queryFn: () =>
      projectId
        ? db.codexRelations.where("projectId").equals(projectId).toArray()
        : [],
    enabled: !!projectId,
  });
}

export function useCreateCodexRelation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      projectId: string;
      sourceId: string;
      targetId: string;
      label: string;
    }) => {
      const relation: CodexRelation = {
        id: uuidv4(),
        projectId: params.projectId,
        sourceId: params.sourceId,
        targetId: params.targetId,
        label: params.label,
      };
      await db.codexRelations.add(relation);
      return relation;
    },
    onSuccess: (rel) => {
      queryClient.invalidateQueries({ queryKey: ["codexRelations", rel.projectId] });
    },
  });
}

export function useDeleteCodexRelation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { id: string; projectId: string }) => {
      await db.codexRelations.delete(params.id);
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["codexRelations", vars.projectId] });
    },
  });
}
