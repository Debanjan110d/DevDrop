/**
 * DevDrop Clipboard Utility
 * Copies transferred files directly to the system clipboard.
 * Supports image binaries (pasted as images via Ctrl+V), text files (pasted as text),
 * and universal files (pasted as download links).
 */

export async function copyTransferToClipboard(
  transferId: string,
  fileName: string
): Promise<{ success: boolean; type: 'image' | 'text' | 'link' }> {
  try {
    const res = await fetch(`/api/transfers/${transferId}/download`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();

    // 1. If it's an image, copy raw image binary so Ctrl+V pastes the photo
    if (blob.type.startsWith('image/')) {
      try {
        if (blob.type === 'image/png') {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob }),
          ]);
          return { success: true, type: 'image' };
        } else {
          // Convert JPG/WebP/GIF to PNG for universal clipboard compatibility
          const img = new Image();
          const objectUrl = URL.createObjectURL(blob);
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = objectUrl;
          });

          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0);
          URL.revokeObjectURL(objectUrl);

          const pngBlob = await new Promise<Blob | null>((resolve) =>
            canvas.toBlob(resolve, 'image/png')
          );

          if (pngBlob) {
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/png': pngBlob }),
            ]);
            return { success: true, type: 'image' };
          }
        }
      } catch (imgErr) {
        console.warn('Direct image clipboard copy failed, falling back:', imgErr);
      }
    }

    // 2. If it's a text/code file, copy the raw text content
    const lowerName = fileName.toLowerCase();
    if (
      blob.type.startsWith('text/') ||
      lowerName.endsWith('.txt') ||
      lowerName.endsWith('.md') ||
      lowerName.endsWith('.json') ||
      lowerName.endsWith('.js') ||
      lowerName.endsWith('.ts') ||
      lowerName.endsWith('.py') ||
      lowerName.endsWith('.html') ||
      lowerName.endsWith('.css')
    ) {
      const text = await blob.text();
      await navigator.clipboard.writeText(text);
      return { success: true, type: 'text' };
    }

    // 3. For any other file, copy the local network download link
    const downloadUrl = `${window.location.origin}/api/transfers/${transferId}/download`;
    await navigator.clipboard.writeText(downloadUrl);
    return { success: true, type: 'link' };
  } catch (err) {
    console.warn('Clipboard copy error, using link fallback:', err);
    try {
      const downloadUrl = `${window.location.origin}/api/transfers/${transferId}/download`;
      await navigator.clipboard.writeText(downloadUrl);
      return { success: true, type: 'link' };
    } catch {
      return { success: false, type: 'link' };
    }
  }
}

