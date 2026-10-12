/** Shared by the file picker and storage registration; accept attributes are only hints. */
export function validateImageUpload(file: { size: number; type?: string }, purpose = 'image'): void {
  const allowed = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
  if (purpose === 'creator-logo') allowed.add('image/svg+xml');
  if (purpose === 'creator-favicon') {
    allowed.add('image/x-icon');
    allowed.add('image/vnd.microsoft.icon');
  }
  if (!file.type || !allowed.has(file.type)) {
    throw new Error(purpose === 'creator-logo'
      ? 'Use a JPG, PNG, WebP, GIF or SVG image'
      : purpose === 'creator-favicon'
        ? 'Use a JPG, PNG, WebP, GIF or ICO image'
        : 'Use a JPG, PNG, WebP or GIF image');
  }
  if (file.size <= 0) throw new Error('Image is empty');
  const maxMB = purpose === 'creator-logo' ? 2 : purpose === 'creator-favicon' ? 1 : 5;
  if (file.size > maxMB * 1024 * 1024) throw new Error(`Image must be ${maxMB}MB or smaller`);
}
