import React from 'react';

interface ResizerProps {
  onMouseDown: (e: React.MouseEvent) => void;
  className?: string;
}

const Resizer: React.FC<ResizerProps> = ({ onMouseDown, className }) => {
  return (
    <div
      onMouseDown={onMouseDown}
      className={`w-1.5 bg-gray-700 hover:bg-indigo-500 cursor-col-resize flex-shrink-0 transition-colors duration-200 ${className || ''}`}
      style={{ userSelect: 'none' }}
    />
  );
};

export default Resizer;
