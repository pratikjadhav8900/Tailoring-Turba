import { prisma } from "@/lib/prisma";
import { allProducts } from "@/lib/products-data";
import { RecommendedProduct, TurbaCustomerContext } from "@/types/turba-ai";

export async function findMatchingProducts(context: TurbaCustomerContext): Promise<RecommendedProduct[]> {
  try {
    // 1. First try querying live PostgreSQL database via Prisma
    const queryConditions: any = {
      isActive: true,
      name: { not: "Custom Design" },
    };

    const targetType = (context.garmentType || "").toLowerCase();
    const useCase = (context.useCase || "").toLowerCase();

    // Map intent to database category/type keywords
    let searchTerms: string[] = [];

    if (targetType.includes("polo")) {
      searchTerms.push("polo");
    } else if (targetType.includes("hoodie") || targetType.includes("winter") || targetType.includes("sweatshirt")) {
      searchTerms.push("hoodie", "sweatshirt", "highneck", "jacket");
    } else if (targetType.includes("sport") || useCase.includes("sport")) {
      searchTerms.push("dryfit", "dryplay", "dryfly", "sports", "micro");
    } else if (targetType.includes("uniform") || useCase.includes("employee") || useCase.includes("corporate")) {
      searchTerms.push("bio", "polo", "solids", "interlock", "tuck");
    } else if (targetType.includes("tshirt") || targetType.includes("t-shirt")) {
      searchTerms.push("bio", "t-shirt", "round neck", "dryfly");
    }

    let dbProducts: any[] = [];
    try {
      dbProducts = await prisma.product.findMany({
        where: queryConditions,
        include: { category: true },
        take: 30,
        orderBy: { createdAt: "desc" },
      });
    } catch (dbErr) {
      console.warn("[TurbaAI Catalog] DB query fell back to static catalogue:", dbErr);
    }

    // Combine db products or use static list
    const pool = dbProducts.length > 0 
      ? dbProducts.map(p => ({
          id: p.id,
          name: p.name,
          category: p.category?.name || p.department || "Custom Apparel",
          type: p.productType || p.type || p.style || "",
          image: Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : "",
          price: Number(p.basePrice) || 199,
          minOrderQuantity: p.minOrderQuantity || 10,
          features: Array.isArray(p.features) ? p.features : [],
          fabric: p.fabric || p.fabricComposition || undefined,
          badge: p.badge || undefined,
          colors: p.colors || 4,
        }))
      : allProducts.map(p => ({
          id: String(p.id),
          name: p.name,
          category: p.category,
          type: p.type,
          image: p.image || (p.gallery && p.gallery[0]) || "",
          price: p.price,
          minOrderQuantity: p.minOrderQuantity || 10,
          features: p.features || [],
          fabric: p.description || undefined,
          badge: p.badge || undefined,
          colors: p.colors || 4,
        }));

    // Filter and score products based on context
    const scored = pool.map(item => {
      let score = 0;
      const combinedText = `${item.name} ${item.type} ${item.category} ${(item.features || []).join(" ")} ${item.fabric || ""}`.toLowerCase();

      // Keyword match
      if (searchTerms.length > 0) {
        for (const term of searchTerms) {
          if (combinedText.includes(term)) score += 5;
        }
      } else {
        score += 1;
      }

      // Collar / Neck match
      if (context.collarType) {
        if (context.collarType === "collar" && combinedText.includes("polo")) score += 8;
        if (context.collarType === "round-neck" && (combinedText.includes("round") || combinedText.includes("crew") || combinedText.includes("bio"))) score += 8;
        if (context.collarType === "v-neck" && combinedText.includes("v-neck")) score += 8;
      }

      // Fabric blend match (100% cotton vs poly-cotton mix vs 100% polyester/dryfit)
      if (context.fabricType) {
        if (context.fabricType === "100% cotton" && (combinedText.includes("cotton") || combinedText.includes("bio") || combinedText.includes("combed"))) score += 9;
        if (context.fabricType === "poly-cotton" && (combinedText.includes("poly") || combinedText.includes("blend") || combinedText.includes("io") || combinedText.includes("60:40"))) score += 9;
        if (context.fabricType === "100% polyester" && (combinedText.includes("polyester") || combinedText.includes("dryfit") || combinedText.includes("salina") || combinedText.includes("nirmal"))) score += 9;
      }

      // GSM match
      if (context.gsm) {
        const gsmStr = String(context.gsm);
        if (gsmStr.includes("180") && combinedText.includes("180")) score += 6;
        if (gsmStr.includes("240") && combinedText.includes("240")) score += 6;
        if (gsmStr.includes("260") && combinedText.includes("260")) score += 6;
        if (gsmStr.includes("140") || gsmStr.includes("120") && (combinedText.includes("120") || combinedText.includes("140"))) score += 6;
      }

      // Sports / Dryfit check
      if (useCase.includes("sport") || (context.fabricPreference || "").toLowerCase().includes("dryfit")) {
        if (combinedText.includes("dryfit") || combinedText.includes("dryplay") || combinedText.includes("polyester")) score += 6;
      }

      // Quantity fit
      if (context.quantity && context.quantity >= item.minOrderQuantity) {
        score += 2;
      }

      return { item, score };
    });

    scored.sort((a, b) => b.score - a.score);

    // Return top 2 to 3 distinct items
    const topItems = scored.slice(0, 3).map(s => s.item);
    return topItems.length > 0 ? topItems : pool.slice(0, 3);
  } catch (error) {
    console.error("[TurbaAI Catalog] Error getting recommendations:", error);
    // Safe fallback from static catalog
    return allProducts.slice(0, 3).map(p => ({
      id: String(p.id),
      name: p.name,
      category: p.category,
      type: p.type,
      image: p.image,
      price: p.price,
      minOrderQuantity: p.minOrderQuantity || 10,
      features: p.features || [],
      badge: p.badge,
    }));
  }
}
