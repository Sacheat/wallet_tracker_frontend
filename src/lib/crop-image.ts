/**
 * Canvas-based crop, matching the shape react-easy-crop's
 * `onCropComplete(croppedArea, croppedAreaPixels)` hands back. Renders the
 * cropped region into a fixed-size square and encodes it as JPEG - small,
 * predictable output regardless of the source image's own dimensions/type,
 * comfortably under the backend's 2 MB / 4096x4096 avatar limits.
 */
export interface PixelCrop {
  x: number
  y: number
  width: number
  height: number
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener("load", () => resolve(image))
    image.addEventListener("error", () => reject(new Error("Image invalide")))
    image.src = src
  })
}

export async function getCroppedImageBlob(
  imageSrc: string,
  crop: PixelCrop,
  outputSize = 512,
): Promise<Blob> {
  const image = await loadImage(imageSrc)
  const canvas = document.createElement("canvas")
  canvas.width = outputSize
  canvas.height = outputSize
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Le recadrage n'est pas supporté par ce navigateur.")

  ctx.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    outputSize,
    outputSize,
  )

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Le recadrage a échoué."))),
      "image/jpeg",
      0.92,
    )
  })
}
