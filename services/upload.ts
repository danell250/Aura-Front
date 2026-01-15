export const uploadService = {
  uploadFile: async (file: File): Promise<{ url: string; filename: string; mimetype: string }> => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4'];
    const maxSizeBytes = 10 * 1024 * 1024;

    if (!allowedTypes.includes(file.type)) {
      throw new Error('Invalid file type. Allowed: JPG, PNG, WEBP, MP4');
    }

    if (file.size > maxSizeBytes) {
      throw new Error('File too large. Max size is 10MB');
    }

    const formData = new FormData();
    formData.append('file', file);

    const apiBase = import.meta.env.VITE_API_URL || 'https://aura-back-s1bw.onrender.com/api';
    const backendBase =
      import.meta.env.VITE_BACKEND_URL ||
      apiBase.replace(/\/api\/?$/, '');

    console.log('Attempting upload to backend:', backendBase);
    const response = await fetch(`${backendBase}/api/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'File upload failed');
    }

    const result = await response.json();
    console.log('Backend upload successful:', result);
    return result;
  }
};
