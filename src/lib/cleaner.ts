/**
 * Tailoring Turba — Content Cleaner Utility
 * Removes factory/catalog brand indicators (Magic, Folkswear, TTH/Tth, Dazzle)
 * to white-label products for public customers.
 */

const categoryMap: Record<string, string> = {
  "magic polo & t-shirts": "Polo & T-Shirts",
  "magic winter wear": "Winter Wear",
  "dazzle collection": "Essential Collection",
  "folkswear collection": "Classic Collection",
  "magic workwear": "Workwear",
  "tth premium range": "Premium Range",
};

/**
 * Cleans a category name by mapping it to a premium public category name
 * or stripping the source keywords.
 */
export function cleanCategoryName(name: string): string {
  if (!name) return "";
  const lower = name.toLowerCase().trim();
  
  if (categoryMap[lower]) {
    return categoryMap[lower];
  }

  return name
    .replace(/\bMagic\b/gi, "")
    .replace(/\bFolkswear\b/gi, "")
    .replace(/\bTTH\b/gi, "")
    .replace(/\bDazzle\b/gi, "")
    .replace(/\bTth\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Cleans a product name by stripping source/catalog prefixes.
 */
export function cleanProductName(name: string): string {
  if (!name) return "";
  return name
    .replace(/\bMagic\b/gi, "")
    .replace(/\bFolkswear\b/gi, "")
    .replace(/\bTTH\b/gi, "")
    .replace(/\bDazzle\b/gi, "")
    .replace(/\bTth\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
