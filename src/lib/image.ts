// Shared by the avatar and catalog-logo pickers to check a file against the
// backend's pixel limits before uploading it.
export function readImageDimensions(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight })
    image.onerror = () => reject(new Error("Image invalide"))
    image.src = url
  })
}
