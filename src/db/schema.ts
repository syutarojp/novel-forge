import {
  pgTable,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
  primaryKey,
} from "drizzle-orm/pg-core";
import type { AdapterAccountType } from "next-auth/adapters";

// ============================================================
// Auth.js tables (users + accounts only — JWT session strategy)
// ============================================================

export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image"),
});

export const accounts = pgTable(
  "accounts",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    primaryKey({ columns: [account.provider, account.providerAccountId] }),
  ]
);

// ============================================================
// Application tables
// ============================================================

export const projects = pgTable("projects", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  author: text("author").notNull().default(""),
  genre: text("genre").notNull().default(""),
  targetWordCount: integer("target_word_count").notNull().default(80000),
  content: jsonb("content"), // TipTap JSONContent — full manuscript
  wordCount: integer("word_count").notNull().default(0),
  settings: jsonb("settings").notNull().default({}),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

export const binderItems = pgTable("binder_items", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  parentId: text("parent_id"),
  sortOrder: text("sort_order").notNull().default("a0"),
  type: text("type").notNull(), // folder | scene | research | trash
  title: text("title").notNull().default(""),
  synopsis: text("synopsis").notNull().default(""),
  content: jsonb("content"), // TipTap JSONContent
  notes: text("notes").notNull().default(""),
  wordCount: integer("word_count").notNull().default(0),
  labelId: text("label_id"),
  statusId: text("status_id"),
  includeInCompile: boolean("include_in_compile").notNull().default(true),
  sceneMeta: jsonb("scene_meta").notNull().default({}),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

export const codexEntries = pgTable("codex_entries", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // character | location | object | lore | subplot | other
  name: text("name").notNull().default(""),
  aliases: jsonb("aliases").notNull().default([]),
  description: jsonb("description"), // TipTap JSONContent
  notes: text("notes").notNull().default(""),
  thumbnail: text("thumbnail"),
  tags: jsonb("tags").notNull().default([]),
  fieldValues: jsonb("field_values").notNull().default({}),
  color: text("color"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

export const codexRelations = pgTable("codex_relations", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  sourceId: text("source_id")
    .notNull()
    .references(() => codexEntries.id, { onDelete: "cascade" }),
  targetId: text("target_id")
    .notNull()
    .references(() => codexEntries.id, { onDelete: "cascade" }),
  label: text("label").notNull().default(""),
});

export const snapshots = pgTable("snapshots", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  binderItemId: text("binder_item_id")
    .notNull()
    .references(() => binderItems.id, { onDelete: "cascade" }),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  title: text("title").notNull().default(""),
  content: jsonb("content"), // TipTap JSONContent
  wordCount: integer("word_count").notNull().default(0),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

export const collections = pgTable("collections", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  name: text("name").notNull().default(""),
  type: text("type").notNull().default("manual"), // manual | search
  itemIds: jsonb("item_ids").notNull().default([]),
  searchQuery: jsonb("search_query"),
  color: text("color"),
});
