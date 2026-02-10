"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { v4 as uuidv4 } from "uuid";
import { generateKeyBetween } from "fractional-indexing";
import { db } from "@/db";
import type { BinderItem, BinderItemType } from "@/types";

export function useBinderItems(projectId: string | null) {
  return useQuery({
    queryKey: ["binderItems", projectId],
    queryFn: () =>
      projectId
        ? db.binderItems.where("projectId").equals(projectId).toArray()
        : [],
    enabled: !!projectId,
  });
}

export function useBinderItem(id: string | null) {
  return useQuery({
    queryKey: ["binderItem", id],
    queryFn: () => (id ? db.binderItems.get(id) : undefined),
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
      const now = new Date();
      const sortOrder = generateKeyBetween(
        params.afterSortOrder ?? null,
        params.beforeSortOrder ?? null
      );
      const item: BinderItem = {
        id: uuidv4(),
        projectId: params.projectId,
        parentId: params.parentId,
        sortOrder,
        type: params.type,
        title: params.title ?? (params.type === "folder" ? "新しいフォルダ" : "無題のシーン"),
        synopsis: "",
        content: null,
        notes: "",
        wordCount: 0,
        labelId: null,
        statusId: null,
        includeInCompile: params.type !== "research",
        sceneMeta: { characterIds: [], subplotIds: [] },
        createdAt: now,
        updatedAt: now,
      };
      await db.binderItems.add(item);
      return item;
    },
    onSuccess: (item) => {
      queryClient.invalidateQueries({ queryKey: ["binderItems", item.projectId] });
    },
  });
}

export function useUpdateBinderItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { id: string; projectId: string; data: Partial<BinderItem> }) => {
      await db.binderItems.update(params.id, {
        ...params.data,
        updatedAt: new Date(),
      });
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["binderItems", vars.projectId] });
      queryClient.invalidateQueries({ queryKey: ["binderItem", vars.id] });
    },
  });
}

export function useDeleteBinderItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { id: string; projectId: string }) => {
      // Recursively delete children
      const children = await db.binderItems
        .where({ projectId: params.projectId, parentId: params.id } as unknown as { [key: string]: string })
        .toArray();
      // Use compound index
      const allChildren = await db.binderItems
        .where("[projectId+parentId]")
        .equals([params.projectId, params.id])
        .toArray();
      const idsToDelete = [params.id];
      const queue = allChildren.map((c) => c.id);
      while (queue.length > 0) {
        const childId = queue.pop()!;
        idsToDelete.push(childId);
        const grandchildren = await db.binderItems
          .where("[projectId+parentId]")
          .equals([params.projectId, childId])
          .toArray();
        queue.push(...grandchildren.map((c) => c.id));
      }
      await db.binderItems.bulkDelete(idsToDelete);
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["binderItems", vars.projectId] });
    },
  });
}

export function useMoveBinderItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      id: string;
      projectId: string;
      newParentId: string | null;
      newSortOrder: string;
    }) => {
      await db.binderItems.update(params.id, {
        parentId: params.newParentId,
        sortOrder: params.newSortOrder,
        updatedAt: new Date(),
      });
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["binderItems", vars.projectId] });
    },
  });
}
