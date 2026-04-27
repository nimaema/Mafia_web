import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const size = {
  width: 512,
  height: 512,
}
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background:
            'radial-gradient(circle at 30% 20%, #365314 0, #111827 34%, #09090b 72%)',
          borderRadius: '120px',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 46,
            borderRadius: 96,
            border: '3px solid rgba(190, 242, 100, 0.28)',
            background: 'linear-gradient(145deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))',
          }}
        />
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="82%" height="82%">
          <path d="M256 66 405 150v168c0 70-57 116-149 142-92-26-149-72-149-142V150L256 66Z" fill="#18181b" stroke="#84cc16" strokeWidth="22" strokeLinejoin="round" />
          <path d="M154 176c35 26 69 39 102 39s67-13 102-39v101c0 55-38 91-102 113-64-22-102-58-102-113V176Z" fill="#0f172a" stroke="#365314" strokeWidth="10" />
          <rect x="170" y="168" width="76" height="112" rx="16" fill="#f8fafc" transform="rotate(-13 208 224)" />
          <rect x="266" y="168" width="76" height="112" rx="16" fill="#f8fafc" transform="rotate(13 304 224)" />
          <rect x="218" y="151" width="76" height="120" rx="16" fill="#84cc16" />
          <circle cx="256" cy="208" r="25" fill="#18181b" />
          <path d="M216 316c22-24 58-24 80 0" fill="none" stroke="#84cc16" strokeWidth="22" strokeLinecap="round" />
          <path d="M184 350h144" stroke="#f8fafc" strokeWidth="18" strokeLinecap="round" opacity=".9" />
        </svg>
      </div>
    ),
    { ...size }
  )
}
