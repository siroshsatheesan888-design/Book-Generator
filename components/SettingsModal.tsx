import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import type { SubscriptionTier } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  onApiKeyChange: (key: string) => void;
  selectedModel: string;
  onModelChange: (model: string) => void;
  onSaveChanges: (data: { gemini_api_key: string }) => Promise<void>;
  onSignOut: () => void;
  subscriptionTier: SubscriptionTier;
  onManageSubscription: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  apiKey,
  onApiKeyChange,
  selectedModel,
  onModelChange,
  onSaveChanges,
  onSignOut,
  subscriptionTier,
  onManageSubscription
}) => {
  const [localApiKey, setLocalApiKey] = useState(apiKey);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setLocalApiKey(apiKey);
  }, [apiKey]);

  const handleSave = async () => {
    setIsSaving(true);
    await onSaveChanges({ gemini_api_key: localApiKey });
    onApiKeyChange(localApiKey); // Update parent state immediately
    setIsSaving(false);
    onClose();
  };
  
  const isPro = subscriptionTier === 'pro';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Settings">
      <div className="space-y-6 text-gray-300">
        <div>
          <h3 className="text-lg font-medium text-white">Gemini API Key</h3>
          <p className="text-sm text-gray-400 mt-1">
            You can provide your own Google AI Studio API key. This key will be stored securely and used for all AI generation requests.
          </p>
          <input
            type="password"
            value={localApiKey}
            onChange={(e) => setLocalApiKey(e.target.value)}
            className="mt-2 w-full bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5"
            placeholder="Enter your API Key"
          />
        </div>

        <div>
            <h3 className="text-lg font-medium text-white">AI Model</h3>
            <p className="text-sm text-gray-400 mt-1">
                Select the AI model for generation. The Pro model is more powerful but slower.
            </p>
            <select
                value={selectedModel}
                onChange={(e) => onModelChange(e.target.value)}
                disabled={!isPro}
                className="mt-2 w-full bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <option value="gemini-2.5-flash">Gemini 2.5 Flash (Fast)</option>
                <option value="gemini-2.5-pro">Gemini 2.5 Pro (Powerful)</option>
            </select>
            {!isPro && <p className="text-xs text-indigo-400 mt-1">Upgrade to Pro to use the Gemini 2.5 Pro model.</p>}
        </div>

        <div>
          <h3 className="text-lg font-medium text-white">Subscription</h3>
          <div className="mt-2 p-4 bg-gray-700/50 rounded-lg flex justify-between items-center">
            <div>
              <p>You are currently on the <span className="font-bold capitalize">{subscriptionTier}</span> plan.</p>
            </div>
            <button
              onClick={onManageSubscription}
              className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
            >
              {isPro ? 'Manage' : 'Upgrade'}
            </button>
          </div>
        </div>

        <div className="flex justify-between items-center pt-6 border-t border-gray-700">
          <button
            onClick={onSignOut}
            className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700"
          >
            Sign Out
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:bg-green-500/50 disabled:cursor-wait"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default SettingsModal;
