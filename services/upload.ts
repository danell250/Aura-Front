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
  uploadFile: async (file: File): Promise<{ url: string; filename: string; mimetype: string }> => {
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

    const formData = new FormData();
    formData.append('file', fileForUpload);

    const backendBase = import.meta.env.VITE_BACKEND_URL;
    const backendHost = backendBase ? backendBase.replace(/\/api\/?$/, '') : '';
    const uploadUrl = backendHost ? `${backendHost}/api/upload` : '/api/upload';

    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'File upload failed');
    }

    const result = await response.json();
    const rawUrl = result?.url as string | undefined;
    const absoluteUrl =
      rawUrl && backendHost && rawUrl.startsWith('/')
        ? `${backendHost}${rawUrl}`
        : rawUrl;

    return {
      ...result,
      url: absoluteUrl || rawUrl || '',
    };
  }
};
