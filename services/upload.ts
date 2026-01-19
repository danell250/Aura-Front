const compressImageForUpload = async (file: File): Promise<File> => {
  if (typeof window === 'undefined') {
    return file;
  }

  if (!file.type.startsWith('image/') || file.type === 'application/pdf') {
    return file;
  }

  const maxDimension = 1920;
  const targetMime =
    file.type === 'image/png' ? 'image/png' : 'image/webp';
  const quality = 0.82;

  return new Promise<File>((resolve) => {
    const img = new Image();

    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let width = img.width;
      let height = img.height;

      const scale = Math.min(
        maxDimension / width,
        maxDimension / height,
        1
      );

      width = Math.round(width * scale);
      height = Math.round(height * scale);

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        resolve(file);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }

          const compressedFile = new File(
            [blob],
            file.name,
            { type: targetMime }
          );
          resolve(compressedFile);
        },
        targetMime,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };

    img.src = objectUrl;
  });
};

export type UploadFolder = 'avatars' | 'covers' | 'posts' | 'documents' | 'ads' | 'chat';

export const uploadService = {
  uploadFile: async (file: File, folder: UploadFolder = 'posts', entityId?: string): Promise<{ url: string; key: string; filename: string; mimetype: string; size: number }> => {
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/webp', 'image/gif', 
      'video/mp4', 'video/webm', 
      'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    const maxSizeBytes = 50 * 1024 * 1024; // 50MB

    if (!allowedTypes.includes(file.type)) {
      throw new Error('Invalid file type. Allowed: Images, Videos, PDFs, Docs');
    }

    let fileForUpload = file;

    // Only compress images if they are large, but let's keep it simple for now or preserve existing logic
    if (file.type.startsWith('image/') && !file.type.includes('gif')) {
      fileForUpload = await compressImageForUpload(file);
    }

    if (fileForUpload.size > maxSizeBytes) {
      throw new Error('File too large. Max size is 50MB');
    }

    const userId = localStorage.getItem('aura_user_id') || 'anonymous';

    // 1) Ask backend for signed URL 
    const backendBase = import.meta.env.VITE_BACKEND_URL;
    const backendHost = backendBase ? backendBase.replace(/\/api\/?$/, '') : '';
    const getUrlEndpoint = backendHost ? `${backendHost}/api/media/upload-url` : '/api/media/upload-url';

    console.log('[Upload] Requesting upload URL:', getUrlEndpoint, { userId, fileName: fileForUpload.name, folder });

    let r;
    try {
      r = await fetch(getUrlEndpoint, { 
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ 
          userId, 
          fileName: fileForUpload.name, 
          contentType: fileForUpload.type, 
          folder,
          entityId
        }) 
      });
    } catch (netErr) {
      console.error('[Upload] Network error requesting upload URL:', netErr);
      throw new Error(`Network error: ${netErr instanceof Error ? netErr.message : String(netErr)}`);
    }

    if (!r.ok) {
      console.error('[Upload] Failed to get upload URL. Status:', r.status, r.statusText);
      const text = await r.text();
      console.error('[Upload] Response body:', text);
      throw new Error(`Failed to get upload URL: ${r.status} ${r.statusText} - ${text.slice(0, 100)}`);
    }
  
    const data = await r.json(); 
    if (!data.success) {
      console.error('[Upload] API returned error:', data);
      throw new Error(data.error || "Failed to get upload url"); 
    }
  
    console.log('[Upload] Got signed URL, uploading to S3...');

    // 2) Upload file directly to S3 
    const put = await fetch(data.uploadUrl, { 
      method: "PUT", 
      headers: { "Content-Type": fileForUpload.type }, 
      body: fileForUpload 
    }); 
  
    if (!put.ok) {
      console.error('[Upload] S3 upload failed. Status:', put.status, put.statusText);
      throw new Error(`S3 upload failed: ${put.status} ${put.statusText}`);
    }
    
    console.log('[Upload] S3 upload successful'); 
  
    // 3) This is what you save in MongoDB 
    return { 
      url: data.objectUrl,
      key: data.key,
      filename: data.key,
      mimetype: fileForUpload.type,
      size: fileForUpload.size
    };
  }
};
