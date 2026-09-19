import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
export const documents = sqliteTable('documents', {
 id: text('id').primaryKey(), title: text('title').notNull(), filename: text('filename').notNull(),
 text: text('text').notNull(), createdAt: text('created_at').notNull(),
 category: text('category').notNull(), sha: text('sha').notNull().unique(), bytes: integer('bytes').notNull(),
});
export const rateLimits = sqliteTable('rate_limits', {
 id: text('id').primaryKey(), count: integer('count').notNull(), expiresAt: integer('expires_at').notNull(),
});
