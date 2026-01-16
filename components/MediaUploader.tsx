import React from 'react';

interface MediaUploaderItem {
  id: string;
  previewUrl: string;
  type: 'image' | 'video';
  caption: string;
}

interface MediaUploaderProps {
  items: MediaUploaderItem[];
  onRemove: (id: string) => void;
  onChangeCaption: (id: string, value: string) => void;
}

const MediaUploader: React.FC<MediaUploaderProps> = ({
  items,
  onRemove,
  onChangeCaption
}) => {
  if (!items.length) return null;

  const total = items.length;

  return (
    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
      {items.map((item, index) => (
        <div
          key={item.id}
          className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
        >
          <div className="p-3 space-y-2 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
            <input
              type="text"
              placeholder="Add caption..."
              value={item.caption}
              onChange={(e) => onChangeCaption(item.id, e.target.value)}
              maxLength={200}
              className="w-full text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-700 dark:text-gray-300 placeholder-gray-400 transition-all"
            />
          </div>
          <div className="relative aspect-video bg-gray-100 dark:bg-gray-900">
            {item.type === 'video' ? (
              <video
                src={item.previewUrl}
                className="w-full h-full object-cover"
                muted
                loop
                autoPlay
                playsInline
              />
            ) : (
              <img
                src={item.previewUrl}
                className="w-full h-full object-cover"
                alt={`Upload ${index + 1}`}
              />
            )}

            <div className="absolute left-2 top-2 px-2 py-0.5 rounded-full bg-black/70 text-white text-xs font-semibold backdrop-blur-sm">
              {index + 1}/{total}
            </div>

            <div className="absolute left-2 bottom-2 px-2 py-0.5 rounded-md bg-black/70 text-white text-xs font-medium backdrop-blur-sm uppercase">
              {item.type}
            </div>

            <button
              onClick={() => onRemove(item.id)}
              className="absolute top-2 right-2 p-1.5 bg-red-500/90 text-white rounded-full hover:bg-red-600 transition-all duration-200 shadow-lg hover:scale-110 active:scale-95"
              title="Remove"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MediaUploader;
