import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import type { Chapter, ChapterConnection } from '../types';
import { TrashIcon } from './icons/TrashIcon';

interface ConnectionManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceChapter: Chapter;
  allChapters: Chapter[];
  onSave: (sourceChapterId: string, newConnections: ChapterConnection[]) => void;
}

const ConnectionManagerModal: React.FC<ConnectionManagerModalProps> = ({
  isOpen,
  onClose,
  sourceChapter,
  allChapters,
  onSave,
}) => {
  const [connections, setConnections] = useState<ChapterConnection[]>(sourceChapter.connections || []);
  const [newTargetId, setNewTargetId] = useState('');
  const [newDescription, setNewDescription] = useState('');

  useEffect(() => {
    // Reset state if the source chapter changes
    setConnections(sourceChapter.connections || []);
    setNewTargetId('');
    setNewDescription('');
  }, [sourceChapter]);

  const availableChapters = allChapters.filter(c => 
    c.id !== sourceChapter.id && !connections.some(conn => conn.targetId === c.id)
  );

  const handleAddConnection = () => {
    if (!newTargetId) {
      alert('Please select a target chapter.');
      return;
    }
    const newConnection: ChapterConnection = {
      targetId: newTargetId,
      description: newDescription.trim(),
    };
    setConnections([...connections, newConnection]);
    setNewTargetId('');
    setNewDescription('');
  };

  const handleDeleteConnection = (targetIdToDelete: string) => {
    setConnections(connections.filter(conn => conn.targetId !== targetIdToDelete));
  };
  
  const handleSave = () => {
    onSave(sourceChapter.id, connections);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Connections for: ${sourceChapter.chapterTitle}`}>
      <div className="space-y-6 text-gray-300">
        <div>
          <h3 className="text-lg font-medium text-white mb-2">Existing Connections</h3>
          {connections.length > 0 ? (
            <ul className="space-y-2">
              {connections.map(conn => {
                const targetChapter = allChapters.find(c => c.id === conn.targetId);
                return (
                  <li key={conn.targetId} className="flex items-center justify-between p-2 bg-gray-700/50 rounded-lg">
                    <div>
                      <p className="font-semibold text-white">{targetChapter?.chapterTitle || 'Unknown Chapter'}</p>
                      <p className="text-sm text-gray-400">{conn.description || 'No description'}</p>
                    </div>
                    <button onClick={() => handleDeleteConnection(conn.targetId)} className="p-1 text-gray-400 hover:text-red-400">
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-gray-500">No connections yet.</p>
          )}
        </div>

        <div className="pt-4 border-t border-gray-700">
          <h3 className="text-lg font-medium text-white mb-2">Add New Connection</h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="target-chapter" className="block text-sm font-medium text-gray-400 mb-1">Connect to Chapter</label>
              <select
                id="target-chapter"
                value={newTargetId}
                onChange={(e) => setNewTargetId(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5"
                disabled={availableChapters.length === 0}
              >
                <option value="">{availableChapters.length > 0 ? 'Select a chapter...' : 'No available chapters'}</option>
                {availableChapters.map(c => (
                  <option key={c.id} value={c.id}>{c.chapterTitle}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="connection-desc" className="block text-sm font-medium text-gray-400 mb-1">Description (Optional)</label>
              <input
                type="text"
                id="connection-desc"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="e.g., Foreshadows event in Ch. 5"
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5"
              />
            </div>
            <button
              onClick={handleAddConnection}
              disabled={!newTargetId}
              className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-500/50 disabled:cursor-not-allowed"
            >
              Add Connection
            </button>
          </div>
        </div>

        <div className="flex justify-end gap-4 mt-2">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-white bg-gray-600 rounded-lg hover:bg-gray-700">
            Cancel
          </button>
          <button onClick={handleSave} className="px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700">
            Save Changes
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConnectionManagerModal;