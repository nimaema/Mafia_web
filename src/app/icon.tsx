import { ImageResponse } from "next/og";
import { MASK_PATH } from "@/components/brand/MaskMark";

export const runtime = "edge";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

// Full-bleed so the same image works as a maskable icon: turquoise mask on the ink night.
export default function Icon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#05101e" }}>
        <svg viewBox="0 0 64 34" width="300" height="160">
          <path fillRule="evenodd" d={MASK_PATH} fill="#49d6cc" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
