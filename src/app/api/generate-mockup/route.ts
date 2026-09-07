export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import { DesignElement } from "@/types/customizer";
import { auth } from "@/lib/auth";
import { validateAndFetchAsset } from "@/lib/ssrf";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized. Please log in first." }, { status: 401 });
    }

    const { elements, baseImage, width = 1000, height = 1000 } = await req.json();

    if (!baseImage) {
      return NextResponse.json({ error: "Missing baseImage" }, { status: 400 });
    }

    // 1. Load base garment image through SSRF validator
    const baseBuffer = await validateAndFetchAsset(baseImage);
    let image = sharp(baseBuffer).resize(width, height);

    // 2. Prepare compositing layers
    const layers: any[] = [];

    // 3. Process each element
    if (Array.isArray(elements)) {
      for (const el of elements as DesignElement[]) {
        if (el.type === "logo" && el.value) {
          const logoBuffer = await validateAndFetchAsset(el.value);
          layers.push({
            input: await sharp(logoBuffer)
              .resize(Math.round(el.width), Math.round(el.height))
              .toBuffer(),
            left: Math.round(el.x),
            top: Math.round(el.y),
          });
        } else if (el.type === "text") {
          const fontBuffer = await validateAndFetchAsset("https://github.com/google/fonts/raw/main/ofl/inter/Inter-Bold.ttf");
          const svg = await satori(
            ({
              type: "div",
              props: {
                children: el.value as any,
                style: {
                  display: "flex",
                  color: el.color,
                  fontSize: 40,
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
                  data: fontBuffer,
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
    console.error("[MOCKUP_GENERATION_ERROR]", error.message);
    return NextResponse.json({ error: error.message || "Failed to generate mockup." }, { status: 400 });
  }
}
