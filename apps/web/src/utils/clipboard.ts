import { getBaseUrl } from '../services/api';

/**
 * DevDrop Clipboard Utility
 * Copies transferred files directly to the system clipboard.
 * Supports image binaries (pasted as images via Ctrl+V), text files / Quick Text (pasted as text),
 * and clean fallback to filename (never copying raw internal download URLs).
 */
export async function copyTransferToClipboard(
  transferId: string,
  fileName: string
): Promise<{ success: boolean; type: 'image' | 'text' | 'file'; message?: string }> {
  try {
    const baseUrl = getBaseUrl().replace(/\/api$/, '');
    const token = localStorage.getItem('devdrop_auth_token') || 'pc-local';

    const res = await fetch(`${baseUrl}/api/transfers/${transferId}/download`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    const lowerName = (fileName || '').toLowerCase();

    // 1. If it's an image, copy raw image binary so Ctrl+V pastes the photo
    if (
      blob.type.startsWith('image/') ||
      lowerName.endsWith('.png') ||
      lowerName.endsWith('.jpg') ||
      lowerName.endsWith('.jpeg') ||
      lowerName.endsWith('.webp') ||
      lowerName.endsWith('.gif')
    ) {
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
        console.warn('Direct image clipboard copy failed:', imgErr);
      }
    }

    // 2. If it's a text/code file or Quick Text snippet, copy the raw text content
    const textExtensions = [
      '.txt', '.md', '.json', '.js', '.ts', '.tsx', '.jsx', '.py',
      '.html', '.css', '.scss', '.yaml', '.yml', '.xml', '.sh',
      '.bat', '.ps1', '.sql', '.env', '.log', '.csv', '.tsv',
    ];
    const isTextFile =
      lowerName.startsWith('text-') ||
      blob.type.startsWith('text/') ||
      blob.type.includes('json') ||
      blob.type.includes('xml') ||
      blob.type.includes('javascript') ||
      textExtensions.some((ext) => lowerName.endsWith(ext));

    if (isTextFile) {
      const text = await blob.text();
      await navigator.clipboard.writeText(text);
      return { success: true, type: 'text' };
    }

    // 3. For any other file, check if it's UTF-8 plain text (no null bytes)
    try {
      if (blob.size < 512 * 1024) {
        const text = await blob.text();
        if (!text.includes('\0')) {
          await navigator.clipboard.writeText(text);
          return { success: true, type: 'text' };
        }
      }
    } catch {}

    // 4. For non-text binary files (e.g. zip, apk, exe): copy the file name
    await navigator.clipboard.writeText(fileName);
    return { success: true, type: 'file' };
  } catch (err) {
    console.error('Clipboard copy error:', err);
    // Never write internal API download URL strings to the user's clipboard!
    // Instead copy the clean file name if possible
    try {
      if (fileName) {
        await navigator.clipboard.writeText(fileName);
        return { success: true, type: 'file' };
      }
    } catch {}
    return { success: false, type: 'file' };
  }
}
