import Dexie, { type EntityTable } from "dexie";
import type {
  Project,
  BinderItem,
  Snapshot,
  CodexEntry,
  CodexRelation,
  Collection,
} from "@/types";

const db = new Dexie("NovelForgeDB") as Dexie & {
  projects: EntityTable<Project, "id">;
  binderItems: EntityTable<BinderItem, "id">;
  snapshots: EntityTable<Snapshot, "id">;
  codexEntries: EntityTable<CodexEntry, "id">;
  codexRelations: EntityTable<CodexRelation, "id">;
  collections: EntityTable<Collection, "id">;
};

db.version(1).stores({
  projects: "id",
  binderItems: "id, projectId, [projectId+parentId], [projectId+type], updatedAt",
  snapshots: "id, binderItemId, projectId, createdAt",
  codexEntries: "id, projectId, [projectId+type], *aliases, *tags",
  codexRelations: "id, projectId, [projectId+sourceId], [projectId+targetId]",
  collections: "id, projectId",
});

export { db };
