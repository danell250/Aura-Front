export const uploadService = {
  uploadFile: async (file: File): Promise<{ url: string; filename: string; mimetype: string }> => {
    const formData = new FormData();
    formData.append('file', file);

    // Use local backend for development via proxy
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';
    
    // Check if we're in development and backend is available
    // const isDevelopment = import.meta.env.DEV;
    
    console.log('Attempting upload to backend:', BACKEND_URL);
    const response = await fetch(`${BACKEND_URL}/api/upload`, {
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
