import React, { useState } from 'react';
import Modal from './Modal';
import type { Plan, SubscriptionTier } from '../types';
import { SparklesIcon } from './icons/SparklesIcon';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPlan: (planId: SubscriptionTier) => void;
  currentPlan: SubscriptionTier;
}

const plans: Plan[] = [
    {
        id: 'free',
        name: 'Free',
        price: '$0/mo',
        features: [
            'Up to 3 book projects',
            'Basic AI model (Gemini Flash)',
            'Generate ideas, outlines, and chapters',
            'Basic writing analysis'
        ]
    },
    {
        id: 'pro',
        name: 'Pro',
        price: '$19/mo',
        features: [
            'Unlimited book projects',
            'Powerful AI model (Gemini Pro)',
            'AI Cover Image Generation',
            'AI Text Humanizer',
            'Plagiarism Checker',
            'Priority support',
        ]
    }
];

const PricingModal: React.FC<PricingModalProps> = ({ isOpen, onClose, onSelectPlan, currentPlan }) => {
    const [isRedirecting, setIsRedirecting] = useState(false);

    const handleSelect = (planId: SubscriptionTier) => {
        if (planId === 'pro') {
            setIsRedirecting(true);
            // Simulate a redirect to a payment gateway like Stripe
            setTimeout(() => {
                onSelectPlan(planId);
                setIsRedirecting(false);
            }, 1500);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Upgrade Your Plan">
            <div className="space-y-6">
                <p className="text-center text-gray-400">Choose the plan that's right for your writing ambitions.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {plans.map(plan => (
                        <div key={plan.id} className={`p-6 rounded-lg border-2 ${plan.id === 'pro' ? 'border-indigo-500' : 'border-gray-700'} bg-gray-800/50 flex flex-col`}>
                            <h3 className="text-2xl font-bold text-white">{plan.name}</h3>
                            <p className="text-3xl font-extrabold text-white my-4">{plan.price}</p>
                            <ul className="space-y-2 text-gray-300 flex-grow">
                                {plan.features.map(feature => (
                                    <li key={feature} className="flex items-center gap-3">
                                        <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>
                            <div className="mt-6">
                                {currentPlan === plan.id ? (
                                    <button disabled className="w-full px-4 py-2 text-center text-sm font-semibold text-white bg-gray-600 rounded-lg cursor-default">Current Plan</button>
                                ) : plan.id === 'free' ? (
                                    <button disabled className="w-full px-4 py-2 text-center text-sm font-semibold text-gray-400 bg-gray-700 rounded-lg cursor-not-allowed">Included</button>
                                ) : (
                                    <button onClick={() => handleSelect(plan.id)} disabled={isRedirecting} className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-wait">
                                        {isRedirecting ? (
                                            <>
                                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                            <span>Redirecting...</span>
                                            </>
                                        ) : (
                                            <>
                                            <SparklesIcon className="w-5 h-5" />
                                            <span>Subscribe with Stripe</span>
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </Modal>
    );
};

export default PricingModal;
