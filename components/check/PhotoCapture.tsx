'use client'

import { useRef, useState } from 'react'
import { CameraIcon, ImageIcon, RefreshIcon } from '../icons'

interface Props {
  preview: string | null
  onFile: (file: File) => void
  onClear: () => void
  preparing?: boolean
  scanning?: boolean
  locked?: boolean
}

// The arched mirror frame. Empty, it offers the camera or the camera roll and
// accepts a dropped file on desktop. With a photo, it shows it full bleed and
// draws a scanning line while the check runs.
export function PhotoCapture({ preview, onFile, onClear, preparing, scanning, locked }: Props) {
  const cameraRef = useRef<HTMLInputElement>(null)
  const uploadRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  function take(list: FileList | null) {
    const file = list?.[0]
    if (file) onFile(file)
  }

  return (
    <div className="mx-auto w-full max-w-[340px] lg:max-w-none">
      <div
        className={`mirror aspect-[3/4] w-full shadow-lift ring-1 transition ${dragging ? 'ring-4 ring-primary/40' : 'ring-black/5'}`}
        onDragOver={(e) => {
          if (locked) return
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          if (!locked) take(e.dataTransfer.files)
        }}
      >
        {preview ? (
          <>
            <img src={preview} alt="Your outfit" className="absolute inset-0 h-full w-full object-cover" />
            {scanning && (
              <div aria-hidden className="pointer-events-none absolute inset-0 bg-primary/10">
                <div className="absolute inset-x-0 h-[12%] animate-scan bg-gradient-to-b from-transparent via-white/60 to-transparent" />
              </div>
            )}
            {!locked && (
              <button
                type="button"
                onClick={onClear}
                className="absolute bottom-4 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-black/55 px-4 py-2 text-sm font-medium text-white backdrop-blur-md transition hover:bg-black/70"
              >
                <RefreshIcon className="h-4 w-4" />
                Retake
              </button>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-end px-6 pb-7 text-center">
            <Silhouette />
            {preparing ? (
              <p className="relative text-sm font-medium text-muted">Getting your photo ready…</p>
            ) : (
              <>
                <div className="relative flex w-full flex-col gap-2.5">
                  <button type="button" onClick={() => cameraRef.current?.click()} className="btn-primary w-full py-3">
                    <CameraIcon className="h-[18px] w-[18px]" />
                    Take a photo
                  </button>
                  <button type="button" onClick={() => uploadRef.current?.click()} className="btn-ghost w-full py-3">
                    <ImageIcon className="h-[18px] w-[18px]" />
                    Choose from photos
                  </button>
                </div>
                <p className="relative mt-4 text-xs leading-relaxed text-faint">Head to shoes if you can, in good light. A mirror selfie is perfect.</p>
              </>
            )}
          </div>
        )}
      </div>

      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="sr-only" tabIndex={-1} onChange={(e) => (take(e.target.files), (e.target.value = ''))} />
      <input ref={uploadRef} type="file" accept="image/*" className="sr-only" tabIndex={-1} onChange={(e) => (take(e.target.files), (e.target.value = ''))} />
    </div>
  )
}

// A dashed figure standing in the mirror, so the empty frame says what goes there.
function Silhouette() {
  return (
    <svg viewBox="0 0 200 300" className="absolute inset-x-0 top-[11%] mx-auto h-[42%] text-strong" aria-hidden>
      <g fill="none" stroke="currentColor" strokeWidth="2.5" strokeDasharray="6 7" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="100" cy="46" r="22" />
        <path d="M58 170c0-62 16-94 42-94s42 32 42 94" />
        <path d="M74 132v40l8 120M126 132v40l-8 120M100 190v100" />
      </g>
    </svg>
  )
}
