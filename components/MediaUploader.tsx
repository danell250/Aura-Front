import React from 'react';

interface MediaUploaderItem {
  id: string;
  previewUrl: string;
  type: 'image' | 'video';
  caption: string;
  headline: string;
}

interface MediaUploaderProps {
  items: MediaUploaderItem[];
  onRemove: (id: string) => void;
  onChangeHeadline: (id: string, value: string) => void;
  onChangeCaption: (id: string, value: string) => void;
}

const MediaUploader: React.FC<MediaUploaderProps> = ({
  items,
  onRemove,
  onChangeHeadline,
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
          <div className="relative aspect-video bg-black/5 dark:bg-black/40">
            {item.type === 'video' ? (
              <video
                src={item.previewUrl}
                className="w-full h-full object-contain"
                controls
              />
            ) : (
              <img
                src={item.previewUrl}
                className="w-full h-full object-contain"
                alt=""
              />
            )}

            <div className="absolute left-2 top-2 px-2 py-1 rounded-full bg-black/60 text-white text-[11px] font-medium">
              {index + 1} / {total}
            </div>

            <button
              onClick={() => onRemove(item.id)}
              className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-red-600 transition-colors backdrop-blur-sm"
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
          <div className="p-3 space-y-2 bg-white dark:bg-gray-900">
            <input
              type="text"
              placeholder="Headline (optional)"
              value={item.headline}
              onChange={(e) => onChangeHeadline(item.id, e.target.value)}
              className="w-full text-sm font-semibold bg-transparent border-b border-gray-200 dark:border-gray-700 focus:border-blue-500 outline-none px-1 py-1 text-gray-900 dark:text-white placeholder-gray-400"
            />
            <input
              type="text"
              placeholder="Caption (optional)"
              value={item.caption}
              onChange={(e) => onChangeCaption(item.id, e.target.value)}
              className="w-full text-sm text-gray-600 dark:text-gray-400 bg-transparent border-b border-gray-200 dark:border-gray-700 focus:border-blue-500 outline-none px-1 py-1 placeholder-gray-400"
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export default MediaUploader;

