import React, { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface PDFViewerProps {
  url: string;
  initialPage?: number;
  scale?: number;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ url, initialPage = 1, scale = 1.5 }) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [pageInput, setPageInput] = useState(initialPage.toString());

  useEffect(() => {
    setCurrentPage(initialPage);
    setPageInput(initialPage.toString());
  }, [initialPage, url]);

  const handleDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    if (currentPage > numPages) {
      setCurrentPage(numPages);
      setPageInput(numPages.toString());
    }
  };

  const goToPage = (page: number) => {
    if (!numPages) return;
    const clamped = Math.max(1, Math.min(numPages, page));
    setCurrentPage(clamped);
    setPageInput(clamped.toString());
  };

  const handlePrev = () => {
    if (!numPages) return;
    if (currentPage > 1) {
      goToPage(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (!numPages) return;
    if (currentPage < numPages) {
      goToPage(currentPage + 1);
    }
  };

  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPageInput(e.target.value);
  };

  const commitPageInput = () => {
    const value = parseInt(pageInput, 10);
    if (!Number.isNaN(value)) {
      goToPage(value);
    } else if (numPages) {
      setPageInput(currentPage.toString());
    }
  };

  const handlePageInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitPageInput();
    }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = url;
    link.download = '';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full flex flex-col bg-white dark:bg-slate-950 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800">
      <div className="relative w-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center px-2 py-4 sm:px-4 sm:py-6">
        <div className="max-w-full overflow-x-auto flex justify-center">
          <Document
            file={url}
            onLoadSuccess={handleDocumentLoadSuccess}
            loading={
              <div className="text-sm text-slate-500 dark:text-slate-400">Loading PDF…</div>
            }
            error={
              <div className="text-sm text-rose-500">Failed to load PDF.</div>
            }
          >
            <Page
              pageNumber={currentPage}
              scale={scale}
              renderTextLayer={false}
              renderAnnotationLayer={false}
              className="transition-transform transition-opacity duration-300 ease-out"
            />
          </Document>
        </div>

        {numPages && numPages > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentPage <= 1}
              className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-900/80 text-white items-center justify-center hover:bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <span className="text-lg">&#8592;</span>
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={currentPage >= numPages}
              className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-900/80 text-white items-center justify-center hover:bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <span className="text-lg">&#8594;</span>
            </button>
          </>
        )}
      </div>

      <div className="w-full flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 px-4 py-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-700 dark:text-slate-200 flex-shrink-0">
            PDF
          </div>
          <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
            <span className="font-semibold">Page</span>
            <input
              type="number"
              min={1}
              max={numPages ?? undefined}
              value={pageInput}
              onChange={handlePageInputChange}
              onKeyDown={handlePageInputKeyDown}
              onBlur={commitPageInput}
              className="w-14 px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <span className="text-slate-500 dark:text-slate-400">
              of {numPages ?? '…'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 justify-end">
          <button
            type="button"
            onClick={handlePrev}
            disabled={!numPages || currentPage <= 1}
            className="px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={!numPages || currentPage >= numPages}
            className="px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
          >
            Download
          </button>
        </div>
      </div>
    </div>
  );
};

export default PDFViewer;

