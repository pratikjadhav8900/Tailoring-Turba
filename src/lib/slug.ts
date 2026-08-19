import { prisma } from "./prisma";

/**
 * Reusable slug generator following standard formatting:
 * - lowercase
 * - kebab-case
 * - remove special characters
 * - collapse duplicate hyphens
 * - trim leading/trailing hyphens
 */
export function generateSlug(name: string): string {
  if (!name) return "";
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")      // Replace non-alphanumeric chars with hyphens
    .replace(/(^-|-$)+/g, "");         // Trim leading/trailing hyphens
}

/**
 * Generates a unique slug for a product by checking the DB
 * and appending -2, -3, etc. if duplicates are found.
 */
export async function generateUniqueSlug(name: string, productId?: string): Promise<string> {
  const baseSlug = generateSlug(name) || "product";
  let slug = baseSlug;
  let counter = 2;

  while (true) {
    const existing = await prisma.product.findFirst({
      where: {
        slug,
        id: productId ? { not: productId } : undefined,
      },
    });

    if (!existing) {
      break;
    }

    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}
