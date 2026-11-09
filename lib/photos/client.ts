'use client'

import { createClient } from '../supabase/client'
import { MAX_IMAGE_BYTES, PHOTO_BUCKET, checksPrefix, fitWithin } from './shared'

async function decode(file: Blob): Promise<{ source: CanvasImageSource; width: number; height: number; release: () => void }> {
  if ('createImageBitmap' in window) {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
      return { source: bitmap, width: bitmap.width, height: bitmap.height, release: () => bitmap.close() }
    } catch {
      // Fall through to the <img> path, which some older Safari builds need.
    }
  }
  const url = URL.createObjectURL(file)
  const img = new Image()
  img.src = url
  await img.decode()
  return { source: img, width: img.naturalWidth, height: img.naturalHeight, release: () => URL.revokeObjectURL(url) }
}

// Phone photos are 4 to 12 MB. Shrink to a JPEG around 1568px on the long edge
// before anything leaves the phone, so the check is quick on mobile data. EXIF
// (including location) is dropped on the way through the canvas.
export async function preparePhoto(file: File): Promise<Blob> {
  if (!file.type.startsWith('image/') && !/\.(heic|heif)$/i.test(file.name)) throw new Error("That file isn't a photo.")
  const { source, width, height, release } = await decode(file).catch(() => {
    throw new Error("Couldn't open that photo. Try a JPEG or PNG.")
  })
  try {
    const size = fitWithin(width, height)
    const canvas = document.createElement('canvas')
    canvas.width = size.width
    canvas.height = size.height
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error("Couldn't process that photo.")
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, size.width, size.height)
    ctx.drawImage(source, 0, 0, size.width, size.height)
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85))
    if (!blob) throw new Error("Couldn't process that photo.")
    if (blob.size > MAX_IMAGE_BYTES) throw new Error('That photo is too large even after shrinking it.')
    return blob
  } finally {
    release()
  }
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error("Couldn't read that photo."))
    reader.readAsDataURL(blob)
  })
}

export async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  return (await fetch(dataUrl)).blob()
}

// Only runs when a signed in person taps save. Storage RLS only allows writes
// under their own user id.
export async function uploadCheckPhoto(blob: Blob): Promise<string> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Sign in again to save this check.')

  const path = `${checksPrefix(user.id)}${crypto.randomUUID()}.jpg`
  const { error } = await supabase.storage.from(PHOTO_BUCKET).upload(path, blob, { contentType: 'image/jpeg', upsert: false })
  if (error) throw new Error("The photo didn't upload. Check your connection and try again.")
  return path
}

export async function removeCheckPhoto(path: string) {
  await createClient().storage.from(PHOTO_BUCKET).remove([path])
}
