import { EXPORT_WATERMARK_DATA_URL } from '@/lib/exportWatermark';

export default function ExportWatermark({ src = EXPORT_WATERMARK_DATA_URL }: { src?: string }) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
      <img
        src={src}
        alt=""
        style={{
          position: 'absolute',
          top: '34%',
          right: '-24px',
          width: '220px',
          height: '220px',
          objectFit: 'contain',
          opacity: 0.06,
          filter: 'grayscale(1)',
        }}
      />
      <img
        src={src}
        alt=""
        style={{
          position: 'absolute',
          bottom: '36px',
          left: '-22px',
          width: '180px',
          height: '180px',
          objectFit: 'contain',
          opacity: 0.05,
          filter: 'grayscale(1)',
          transform: 'rotate(-18deg)',
        }}
      />
    </div>
  );
}
