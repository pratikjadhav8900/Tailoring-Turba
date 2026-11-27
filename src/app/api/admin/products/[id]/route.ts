export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { generateSlug, generateUniqueSlug } from "@/lib/slug";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    // Assuming only SUPER_ADMIN or ADMIN can delete products
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    if (!id) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    const orderItemCount = await prisma.orderItem.count({ where: { productId: id } });
    if (orderItemCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete: this product is referenced by ${orderItemCount} order item(s). Mark it Offline instead.` },
        { status: 400 }
      );
    }

    await prisma.product.delete({
      where: { id }
    });

    return NextResponse.json({ message: "Product deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

import { isValidHex, normalizeHex } from "@/lib/customizer-utils";

function validateColorsJson(colorsJson: any, imageUrls: string[]): any[] | null {
  if (!colorsJson) return null;
  let parsed = colorsJson;
  if (typeof parsed === 'string') {
    try {
      parsed = JSON.parse(parsed);
    } catch (e) {
      throw new Error("Colors data is not a valid JSON string.");
    }
  }
  if (!Array.isArray(parsed)) {
    throw new Error("Colors data must be an array.");
  }
  if (parsed.length === 0) return null;

  const validated: any[] = [];
  const seenNames = new Set<string>();

  for (const item of parsed) {
    if (typeof item !== 'object' || item === null) {
      throw new Error("Invalid color item format.");
    }
    const name = String(item.name || "").trim();
    const rawValue = String(item.value || item.hex || "").trim();
    
    // Extract array of imageUrls with fallback to single image / imageUrl
    let rawUrls: string[] = [];
    if (Array.isArray(item.imageUrls)) {
      rawUrls = item.imageUrls.map((u: any) => String(u || "").trim()).filter(Boolean);
    } else if (item.image || item.imageUrl) {
      const single = String(item.image || item.imageUrl || "").trim();
      if (single) rawUrls = [single];
    }

    // Remove duplicates within the same color
    const cleanImageUrls = Array.from(new Set(rawUrls));

    if (!name) {
      throw new Error("Color name cannot be empty.");
    }
    if (!isValidHex(rawValue)) {
      throw new Error(`Color "${name}" has an invalid hex code "${rawValue}". Use #RGB or #RRGGBB.`);
    }

    const value = normalizeHex(rawValue);

    if (seenNames.has(name.toLowerCase())) {
      throw new Error(`Duplicate color name: "${name}".`);
    }
    seenNames.add(name.toLowerCase());

    if (imageUrls.length > 0) {
      for (const img of cleanImageUrls) {
        if (!imageUrls.includes(img)) {
          throw new Error(`Image for color "${name}" does not belong to the uploaded product images.`);
        }
      }
    }

    validated.push({
      name,
      value,
      hex: value,
      imageUrls: cleanImageUrls,
      image: cleanImageUrls[0] || null,
      imageUrl: cleanImageUrls[0] || null
    });
  }
  return validated;
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    // Assuming only SUPER_ADMIN or ADMIN can update products
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    const body = await req.json();
    const { 
      name, 
      category, 
      type, 
      price, 
      description, 
      shortDescription,
      features, 
      colors, 
      colorsJson,
      badge, 
      brand,
      minOrderQuantity,
      imageUrl, 
      imageUrls, 
      mediaMetadata,
      isActive,
      // Structured Classification
      sku,
      department,
      productType,
      style,
      gender,
      qualityTier,
      collection,
      // Fabric & Specifications
      fabric,
      fabricComposition,
      gsm,
      fit,
      neckType,
      sleeveType,
      pattern,
      careInstructions,
      countryOfOrigin,
      // Sizes
      sizes,
      // SEO
      seoTitle,
      seoDescription,
      seoKeywords,
      slug
    } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Product Name is required." }, { status: 400 });
    }

    if (!price || isNaN(parseFloat(String(price).replace(/[^0-9.]/g, '')))) {
      return NextResponse.json({ error: "Valid base price is required." }, { status: 400 });
    }

    const cleanCategory = (category || "").trim() || "Tops";
    const cleanPrice = parseFloat(String(price).replace(/[^0-9.]/g, '') || "0");
    const cleanMoq = minOrderQuantity ? parseInt(String(minOrderQuantity)) || 10 : 10;
    const cleanGsm = gsm !== undefined && gsm !== "" && gsm !== null ? parseInt(String(gsm)) || null : null;
    const cleanImages = Array.isArray(imageUrls) && imageUrls.length > 0
      ? imageUrls.slice(0, 50)
      : (imageUrl ? [imageUrl] : []);

    let validatedColorsJson = null;
    try {
      validatedColorsJson = validateColorsJson(colorsJson, cleanImages);
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }

    // Validate SEO fields
    const trimmedSeoTitle = seoTitle?.trim() || null;
    const trimmedSeoDescription = seoDescription?.trim() || null;
    let trimmedSeoKeywords = seoKeywords?.trim() || null;
    if (trimmedSeoKeywords) {
      trimmedSeoKeywords = trimmedSeoKeywords
        .split(",")
        .map((k: string) => k.trim())
        .filter(Boolean)
        .join(", ");
    }

    if (trimmedSeoTitle && trimmedSeoTitle.length > 1000) {
      return NextResponse.json({ error: "SEO Title cannot exceed 1000 characters." }, { status: 400 });
    }
    if (trimmedSeoDescription && trimmedSeoDescription.length > 2000) {
      return NextResponse.json({ error: "SEO Description cannot exceed 2000 characters." }, { status: 400 });
    }

    let finalSlug = slug?.trim() || null;
    if (!finalSlug) {
      finalSlug = await generateUniqueSlug(name.trim(), id);
    } else {
      finalSlug = generateSlug(finalSlug);
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(finalSlug)) {
        return NextResponse.json({ error: "Invalid URL handle format." }, { status: 400 });
      }
      const existingSlug = await prisma.product.findFirst({
        where: {
          slug: finalSlug,
          id: { not: id }
        }
      });
      if (existingSlug) {
        return NextResponse.json({ error: "URL handle is already in use." }, { status: 400 });
      }
    }

    // Ensure category exists
    let categoryRecord = await prisma.category.findUnique({
      where: { name: cleanCategory }
    });

    if (!categoryRecord) {
      const catSlug = cleanCategory.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      categoryRecord = await prisma.category.create({
        data: { name: cleanCategory, slug: catSlug }
      });
    }

    // Determine backward-compatible type subtitle
    const derivedType = (type || "").trim() || (productType ? `${productType}${cleanGsm ? ` · ${cleanGsm} GSM` : ''}` : null);

    // Update product
    const product = await prisma.product.update({
      where: { id },
      data: {
        name: name.trim(),
        categoryId: categoryRecord.id,
        type: derivedType,
        brand: brand?.trim() || null,
        basePrice: cleanPrice,
        description: description || "",
        shortDescription: shortDescription?.trim() || null,
        features: Array.isArray(features) ? features : (features ? String(features).split('\n').filter((f: string) => f.trim()) : []),
        colors: validatedColorsJson ? validatedColorsJson.length : (colors ? parseInt(String(colors)) : null),
        colorsJson: (validatedColorsJson || null) as any,
        badge: badge?.trim() || null,
        images: cleanImages,
        mediaMetadata: mediaMetadata || null,
        isActive: typeof isActive === 'boolean' ? isActive : undefined,
        minOrderQuantity: cleanMoq,

        // Structured Classification
        sku: sku?.trim() || null,
        department: department?.trim() || "Apparel",
        productType: productType?.trim() || derivedType || null,
        style: style?.trim() || null,
        gender: gender?.trim() || "Men",
        qualityTier: qualityTier?.trim() || "Standard",
        collection: collection?.trim() || null,

        // Fabric & Specifications
        fabric: fabric?.trim() || null,
        fabricComposition: fabricComposition?.trim() || null,
        gsm: cleanGsm,
        fit: fit?.trim() || null,
        neckType: neckType?.trim() || null,
        sleeveType: sleeveType?.trim() || null,
        pattern: pattern?.trim() || null,
        careInstructions: careInstructions?.trim() || null,
        countryOfOrigin: countryOfOrigin?.trim() || "India",

        // Sizes
        sizes: Array.isArray(sizes) ? sizes : [],

        // SEO
        seoTitle: trimmedSeoTitle,
        seoDescription: trimmedSeoDescription,
        seoKeywords: trimmedSeoKeywords,
        slug: finalSlug,
      }
    });

    return NextResponse.json(product, { status: 200 });
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
