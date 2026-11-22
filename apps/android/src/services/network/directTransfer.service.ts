import * as FileSystem from 'expo-file-system/legacy';

export interface DirectUploadProgress {
  bytesSent: number;
  totalBytes: number;
  percentage: number;
}

export interface DirectFilePayload {
  uri: string;
  name: string;
  size: number;
  mimeType: string;
}

export async function sendDirectFile(
  peerIp: string,
  peerPort: number,
  file: DirectFilePayload,
  myDeviceName: string = 'Android Device',
  onProgress?: (p: DirectUploadProgress) => void
): Promise<{ success: boolean; fileName: string; path?: string }> {
  const uploadUrl = `http://${peerIp}:${peerPort}/api/transfers/direct-drop`;

  const uploadTask = FileSystem.createUploadTask(
    uploadUrl,
    file.uri,
    {
      headers: {
        'Content-Type': file.mimeType || 'application/octet-stream',
        'X-File-Name': encodeURIComponent(file.name),
        'X-Sender-Name': myDeviceName,
      },
      httpMethod: 'POST',
      uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
    },
    (data) => {
      const bytesSent = data.totalBytesSent;
      const totalBytes = data.totalBytesExpectedToSend || file.size;
      const percentage = totalBytes > 0 ? Math.round((bytesSent / totalBytes) * 100) : 0;
      onProgress?.({ bytesSent, totalBytes, percentage });
    }
  );

  const response = await uploadTask.uploadAsync();

  if (!response || response.status < 200 || response.status >= 300) {
    throw new Error(`Direct transfer to ${peerIp} failed with status ${response?.status || 'unknown'}`);
  }

  return { success: true, fileName: file.name };
}

export async function sendDirectText(
  peerIp: string,
  peerPort: number,
  text: string,
  myDeviceName: string = 'Android Device'
): Promise<{ success: boolean }> {
  const url = `http://${peerIp}:${peerPort}/api/text/direct-drop`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Sender-Name': myDeviceName,
    },
    body: JSON.stringify({
      text,
      senderName: myDeviceName,
      timestamp: Date.now(),
    }),
  });

  if (!response.ok) {
    throw new Error(`Direct text drop to ${peerIp} failed with status ${response.status}`);
  }

  return { success: true };
}

