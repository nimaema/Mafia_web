import { ImageResponse } from "next/og";
import { MASK_PATH } from "@/components/brand/MaskMark";

export const runtime = "edge";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#05101e" }}>
        <svg viewBox="0 0 64 34" width="116" height="62">
          <path fillRule="evenodd" d={MASK_PATH} fill="#49d6cc" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
