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

export const uploadService = {
  uploadFile: async (file: File, folder: string = 'posts'): Promise<{ url: string; filename: string; mimetype: string }> => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'application/pdf'];
    const maxSizeBytes = 10 * 1024 * 1024;

    if (!allowedTypes.includes(file.type)) {
      throw new Error('Invalid file type. Allowed: JPG, PNG, WEBP, MP4, PDF');
    }

    let fileForUpload = file;

    if (file.type.startsWith('image/')) {
      fileForUpload = await compressImageForUpload(file);
    }

    if (fileForUpload.size > maxSizeBytes) {
      throw new Error('File too large. Max size is 10MB');
    }

    const userId = localStorage.getItem('aura_user_id') || 'anonymous';

    // 1) Ask backend for signed URL 
    const backendBase = import.meta.env.VITE_BACKEND_URL;
    const backendHost = backendBase ? backendBase.replace(/\/api\/?$/, '') : '';
    const getUrlEndpoint = backendHost ? `${backendHost}/api/media/upload-url` : '/api/media/upload-url';

    const r = await fetch(getUrlEndpoint, { 
      method: "POST", 
      headers: { "Content-Type": "application/json" }, 
      body: JSON.stringify({ 
        userId, 
        fileName: fileForUpload.name, 
        contentType: fileForUpload.type, 
        folder
      }) 
    }); 
  
    const data = await r.json(); 
    if (!data.success) throw new Error(data.error || "Failed to get upload url"); 
  
    // 2) Upload file directly to S3 
    const put = await fetch(data.uploadUrl, { 
      method: "PUT", 
      headers: { "Content-Type": fileForUpload.type }, 
      body: fileForUpload 
    }); 
  
    if (!put.ok) throw new Error("S3 upload failed"); 
  
    // 3) This is what you save in MongoDB 
    return { 
      url: data.publicUrl as string,
      filename: data.key,
      mimetype: fileForUpload.type
    };
  }
};
