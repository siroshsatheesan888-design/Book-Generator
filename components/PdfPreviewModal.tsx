import React, { useRef } from 'react';

interface PdfPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookHtml: string;
  bookTitle: string;
  onStartEmailProcess: () => void;
}

const PdfPreviewModal: React.FC<PdfPreviewModalProps> = ({ isOpen, onClose, bookHtml, bookTitle, onStartEmailProcess }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handlePrint = () => {
    const iframe = iframeRef.current;
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-80 z-50 flex flex-col items-center justify-center backdrop-blur-sm p-4"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex justify-between items-center p-4 border-b border-gray-700 flex-shrink-0">
          <h2 className="text-xl font-bold text-white truncate">Export Preview: {bookTitle}</h2>
          <div className="flex items-center gap-4">
            <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-white bg-gray-600 rounded-lg hover:bg-gray-700">
                Close Preview
            </button>
            <button onClick={handlePrint} className="px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700">
                Save to Device (PDF)
            </button>
            <button onClick={onStartEmailProcess} className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700">
                Compose Email...
            </button>
          </div>
        </header>
        <main className="flex-grow p-4 bg-gray-900 overflow-hidden">
          <iframe
            ref={iframeRef}
            srcDoc={bookHtml}
            title="Book Preview"
            className="w-full h-full border-0 bg-white"
          />
        </main>
      </div>
    </div>
  );
};

export default PdfPreviewModal;
