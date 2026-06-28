import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const size = {
  width: 180,
  height: 180,
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
          overflow: 'hidden',
          position: 'relative',
          background:
            'radial-gradient(120% 90% at 50% 0%, #2a1f33 0%, #160f1d 52%, #0d0811 100%)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 18,
            borderRadius: 20,
            border: '1px solid rgba(212,173,85,0.42)',
            background: 'linear-gradient(160deg, rgba(231,200,120,0.16), rgba(190,71,80,0.08))',
          }}
        />
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#e7c878',
            fontSize: 84,
            fontWeight: 900,
            lineHeight: 1,
            letterSpacing: -2,
            textShadow: '0 4px 16px rgba(190,71,80,0.4)',
          }}
        >
          M
        </div>
      </div>
    ),
    { ...size }
  )
}
