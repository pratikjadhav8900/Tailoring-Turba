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
  // Text specific
  fontFamily?: string;
  fontWeight?: "normal" | "bold";
  fontStyle?: "normal" | "italic";
  textDecoration?: "none" | "underline";
  textAlign?: "left" | "center" | "right";
  uppercase?: boolean;
  letterSpacing?: number;
  lineHeight?: number;
  opacity?: number;
}

export interface CustomizerState {
  bodyColor: string;
  garmentType: string;
  fabricId?: string;
  frontElements: DesignElement[];
  backElements: DesignElement[];
}
