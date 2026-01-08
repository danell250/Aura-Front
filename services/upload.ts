export const uploadService = {
  uploadFile: async (file: File): Promise<{ url: string; filename: string; mimetype: string }> => {
    const formData = new FormData();
    formData.append('file', file);

    // Use local backend for development, production for deployment
    const BACKEND_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5002';

    const response = await fetch(`${BACKEND_URL}/api/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'File upload failed');
    }

    return response.json();
  }
};
