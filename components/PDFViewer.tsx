import React from 'react';
import { Worker, Viewer } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';

interface PDFViewerProps {
  url: string;
  initialPage?: number;
  scale?: number;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ url, initialPage = 1 }) => {
  const defaultLayoutPluginInstance = defaultLayoutPlugin();

  return (
    <div className="w-full bg-white dark:bg-slate-950 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800" style={{ height: '750px' }}>
      <Worker workerUrl={`https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js`}>
        <Viewer
          fileUrl={url}
          plugins={[defaultLayoutPluginInstance]}
          defaultScale={1}
        />
      </Worker>
    </div>
  );
};

export default PDFViewer;