import { TextPreset } from "../text-presets";
import { ANIME_PRESETS } from "./anime";
import { VINTAGE_PRESETS } from "./vintage";
import { LITERATURE_PRESETS } from "./literature";
import { BRAND_PRESETS } from "./brand";
import { Y2K_PRESETS } from "./y2k";



import { TEXT_PRESETS as LEGACY_PRESETS } from "../text-presets";

export const ALL_PRESETS: TextPreset[] = [
  ...VINTAGE_PRESETS,
  ...ANIME_PRESETS,
  ...LITERATURE_PRESETS,
  ...BRAND_PRESETS,
  ...Y2K_PRESETS,
  ...LEGACY_PRESETS.map(p => ({ ...p, category: "legacy" }))
];
