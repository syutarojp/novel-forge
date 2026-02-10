import { v4 as uuidv4 } from "uuid";
import { db } from "./index";
import type { Project, BinderItem } from "@/types";

const DEFAULT_LABELS: Project["settings"]["labels"] = [
  { id: "label-1", name: "Chapter", color: "#3b82f6" },
  { id: "label-2", name: "Scene", color: "#10b981" },
  { id: "label-3", name: "Idea", color: "#f59e0b" },
  { id: "label-4", name: "Revision", color: "#ef4444" },
];

const DEFAULT_STATUSES: Project["settings"]["statuses"] = [
  { id: "status-1", name: "To Do" },
  { id: "status-2", name: "Draft" },
  { id: "status-3", name: "Revised" },
  { id: "status-4", name: "Done" },
];

export async function createProject(
  title: string,
  author: string = "",
  genre: string = "",
  targetWordCount: number = 80000
): Promise<Project> {
  const now = new Date();
  const projectId = uuidv4();

  const project: Project = {
    id: projectId,
    title,
    author,
    genre,
    targetWordCount,
    settings: {
      labels: DEFAULT_LABELS,
      statuses: DEFAULT_STATUSES,
    },
    createdAt: now,
    updatedAt: now,
  };

  // Create default binder structure
  const manuscriptId = uuidv4();
  const researchId = uuidv4();
  const trashId = uuidv4();
  const firstSceneId = uuidv4();

  const defaultItems: BinderItem[] = [
    {
      id: manuscriptId,
      projectId,
      parentId: null,
      sortOrder: "a0",
      type: "folder",
      title: "Manuscript",
      synopsis: "",
      content: null,
      notes: "",
      wordCount: 0,
      labelId: null,
      statusId: null,
      includeInCompile: true,
      sceneMeta: { characterIds: [], subplotIds: [] },
      createdAt: now,
      updatedAt: now,
    },
    {
      id: firstSceneId,
      projectId,
      parentId: manuscriptId,
      sortOrder: "a0",
      type: "scene",
      title: "Untitled Scene",
      synopsis: "",
      content: null,
      notes: "",
      wordCount: 0,
      labelId: null,
      statusId: "status-1",
      includeInCompile: true,
      sceneMeta: { characterIds: [], subplotIds: [] },
      createdAt: now,
      updatedAt: now,
    },
    {
      id: researchId,
      projectId,
      parentId: null,
      sortOrder: "a1",
      type: "folder",
      title: "Research",
      synopsis: "",
      content: null,
      notes: "",
      wordCount: 0,
      labelId: null,
      statusId: null,
      includeInCompile: false,
      sceneMeta: { characterIds: [], subplotIds: [] },
      createdAt: now,
      updatedAt: now,
    },
    {
      id: trashId,
      projectId,
      parentId: null,
      sortOrder: "z0",
      type: "trash",
      title: "Trash",
      synopsis: "",
      content: null,
      notes: "",
      wordCount: 0,
      labelId: null,
      statusId: null,
      includeInCompile: false,
      sceneMeta: { characterIds: [], subplotIds: [] },
      createdAt: now,
      updatedAt: now,
    },
  ];

  await db.transaction("rw", db.projects, db.binderItems, async () => {
    await db.projects.add(project);
    await db.binderItems.bulkAdd(defaultItems);
  });

  return project;
}

export async function deleteProject(projectId: string): Promise<void> {
  const tables = [
    db.projects,
    db.binderItems,
    db.snapshots,
    db.codexEntries,
    db.codexRelations,
    db.collections,
  ];
  await db.transaction("rw", tables, async () => {
    await db.projects.delete(projectId);
    await db.binderItems.where("projectId").equals(projectId).delete();
    await db.snapshots.where("projectId").equals(projectId).delete();
    await db.codexEntries.where("projectId").equals(projectId).delete();
    await db.codexRelations.where("projectId").equals(projectId).delete();
    await db.collections.where("projectId").equals(projectId).delete();
  });
}
