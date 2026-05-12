import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import { DesignElement } from "@/types/customizer";

// Helper to fetch images or fonts
async function fetchAsset(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch asset: ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

export async function POST(req: NextRequest) {
  try {
    const { elements, baseImage, width = 1000, height = 1000 } = await req.json();

    if (!baseImage) {
      return NextResponse.json({ error: "Missing baseImage" }, { status: 400 });
    }

    // 1. Load base garment image
    const baseBuffer = await fetchAsset(baseImage);
    let image = sharp(baseBuffer).resize(width, height);

    // 2. Prepare compositing layers
    const layers: any[] = [];

    // 3. Process each element
    for (const el of elements as DesignElement[]) {
      if (el.type === "logo") {
        const logoBuffer = await fetchAsset(el.value);
        layers.push({
          input: await sharp(logoBuffer)
            .resize(Math.round(el.width), Math.round(el.height))
            .toBuffer(),
          left: Math.round(el.x),
          top: Math.round(el.y),
        });
      } else if (el.type === "text") {
        // For text, we use Satori to generate an SVG and then composite it
        // Note: Real implementation would need font loading logic
        // Simplified for this demo:
        const svg = await satori(
          ({
            type: "div",
            props: {
              children: el.value as any,
              style: {
                display: "flex",
                color: el.color,
                fontSize: 40, // Needs scale logic
                fontFamily: "sans-serif",
                width: el.width,
                height: el.height,
                textAlign: "center",
                alignItems: "center",
                justifyContent: "center",
              },
            },
          } as any),
          {
            width: el.width,
            height: el.height,
            fonts: [
              {
                name: "Inter",
                data: await fetchAsset("https://github.com/google/fonts/raw/main/ofl/inter/Inter-Bold.ttf"),
                weight: 700,
                style: "normal",
              },
            ],
          }
        );

        const resvg = new Resvg(svg);
        const pngBuffer = resvg.render().asPng();

        layers.push({
          input: pngBuffer,
          left: Math.round(el.x),
          top: Math.round(el.y),
        });
      }
    }

    // 4. Composite and output
    const outputBuffer = await image.composite(layers).png().toBuffer();

    return new NextResponse(new Uint8Array(outputBuffer), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error: any) {
    console.error("Mockup Generation Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
