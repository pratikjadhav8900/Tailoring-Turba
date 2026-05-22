export type Side = "front" | "back";

export interface DesignElement {
  id: string;
  type: "text" | "logo" | "preset";
  x: number;
  y: number;
  width: number;
  height: number;
  value: string;
  color: string;
  rotation?: number;
  // Text specific
  fontFamily?: string;
  fontWeight?: "normal" | "bold" | string;
  textTransform?: string;
  fontStyle?: "normal" | "italic";
  textDecoration?: "none" | "underline";
  textAlign?: "left" | "center" | "right" | "justify";
  uppercase?: boolean;
  letterSpacing?: number;
  lineHeight?: number;
  opacity?: number;
  fontSize?: number;
  textShadow?: string;
  WebkitTextStroke?: string;
  backgroundColor?: string;
  backgroundImage?: string;
  WebkitBackgroundClip?: string;
  WebkitTextFillColor?: string;
  padding?: string;
  borderRadius?: string;
  border?: string;
  borderTop?: string;
  borderBottom?: string;
  borderLeft?: string;
  borderRight?: string;
  printType?: "dtf" | "screen" | "embroidery" | "sublimation";
  embroideryType?: "mono" | "multi";
  originalWidth?: number;
  originalHeight?: number;
  presetId?: string;
  presetText?: string | string[];
}

export interface SizeQuantities {
  S?: number;
  M?: number;
  L?: number;
  XL?: number;
  XXL?: number;
}

export interface CustomizerState {
  bodyColor: string;
  garmentType: string;
  fabricId?: string;
  sizes?: SizeQuantities;
  frontElements: DesignElement[];
  backElements: DesignElement[];
  previewSize?: "S" | "M" | "L" | "XL" | "XXL";
}
