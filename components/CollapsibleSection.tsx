import React, { useState } from 'react';

const ChevronIcon = ({ isOpen }: { isOpen: boolean }) => (
    <svg className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isOpen ? '' : '-rotate-90'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
);

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ title, children, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-gray-700/80 rounded-lg bg-gray-800/50 mb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center p-3 hover:bg-gray-700/50 transition-colors rounded-lg"
        aria-expanded={isOpen}
      >
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">{title}</h3>
        <ChevronIcon isOpen={isOpen} />
      </button>
      <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden">
            <div className="p-4 border-t border-gray-700/80">
                {children}
            </div>
        </div>
      </div>
    </div>
  );
};

export default CollapsibleSection;
