import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    category: z.string(),
    categorySlug: z.string(),
    tags: z.array(z.string()).default([]),
    keywords: z.string().optional(),
    draft: z.boolean().default(false),
    originalSource: z.string().optional(),
    originalFile: z.string().optional(),
    isNovel: z.boolean().default(false),
    heroImage: z.string().optional(),
    related: z.array(z.string()).default([]),
  }),
});

export const collections = { blog };
