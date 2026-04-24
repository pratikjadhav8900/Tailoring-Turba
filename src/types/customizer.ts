export type Side = "front" | "back";

export interface DesignElement {
  id: string;
  type: "text" | "logo";
  x: number;
  y: number;
  width: number;
  height: number;
  value: string;
  color: string;
  rotation?: number;
  // Text specific
  fontFamily?: string;
  fontWeight?: "normal" | "bold";
  fontStyle?: "normal" | "italic";
  textDecoration?: "none" | "underline";
  textAlign?: "left" | "center" | "right" | "justify";
  uppercase?: boolean;
  letterSpacing?: number;
  lineHeight?: number;
  opacity?: number;
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
}
