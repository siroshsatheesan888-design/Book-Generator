import React, { useState } from 'react';
import Modal from './Modal';

interface EmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookTitle: string;
  bookSynopsis: string;
}

const EmailModal: React.FC<EmailModalProps> = ({ isOpen, onClose, bookTitle, bookSynopsis }) => {
  const [recipientEmail, setRecipientEmail] = useState('');

  const handleComposeEmail = () => {
    const subject = `Book Manuscript: ${bookTitle}`;
    const body = `Hi,

Please find the manuscript for "${bookTitle}" attached.

Synopsis:
${bookSynopsis}

Best regards,
`;
    const mailtoLink = `mailto:${recipientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Email Your Book">
      <div className="space-y-4 text-gray-300">
        <div className="p-4 bg-yellow-900/50 border border-yellow-700 rounded-lg">
            <p className="font-bold text-yellow-300">Important Instructions:</p>
            <ol className="list-decimal list-inside mt-2 text-sm space-y-1">
                <li>Make sure you have already saved the book as a PDF using the "Save as PDF" button.</li>
                <li>Enter the recipient's email address below.</li>
                <li>Click "Compose Email" to open your default email client.</li>
                <li><strong>Remember to manually attach the PDF file you saved before sending!</strong></li>
            </ol>
        </div>
        <div>
            <label htmlFor="recipient-email" className="block text-sm font-medium text-gray-400 mb-1">
                Recipient's Email
            </label>
            <input
                type="email"
                id="recipient-email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="editor@example.com"
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5"
            />
        </div>
        <div className="flex justify-end gap-4 pt-4">
            <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-white bg-gray-600 rounded-lg hover:bg-gray-700">
                Cancel
            </button>
            <button
                onClick={handleComposeEmail}
                disabled={!recipientEmail}
                className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-500/50 disabled:cursor-not-allowed"
            >
                Compose Email
            </button>
        </div>
      </div>
    </Modal>
  );
};

export default EmailModal;
