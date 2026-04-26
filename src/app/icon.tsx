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
          backgroundColor: '#0f172a',
          borderRadius: '128px',
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
          <path d="M120 380 V180 L256 100 L392 180 V380 Z" fill="#1e293b" stroke="#84cc16" strokeWidth="24" strokeLinejoin="round" />
          <circle cx="256" cy="240" r="50" fill="#84cc16" />
          <path d="M180 340 L332 340" stroke="#84cc16" strokeWidth="24" strokeLinecap="round" />
        </svg>
      </div>
    ),
    { ...size }
  )
}
