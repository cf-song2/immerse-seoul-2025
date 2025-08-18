import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Crown, Zap, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const plans = [
  {
    id: 'free',
    name: 'Free Plan',
    price: '$0',
    period: 'forever',
    features: [
      '5 images per day',
      'Standard resolution (512x512)',
      'Public gallery access',
      'Basic AI models'
    ],
    limitations: [
      'Limited daily usage',
      'No priority processing'
    ],
    icon: Zap,
    color: 'gray',
    current: true
  },
  {
    id: 'enterprise',
    name: 'Enterprise Plan',
    price: '$19',
    period: 'per month',
    features: [
      'Unlimited images',
      'High resolution (up to 1024x1024)',
      'Priority processing',
      'Advanced AI models',
      'Private galleries',
      'API access',
      'Priority support'
    ],
    icon: Crown,
    color: 'purple',
    popular: true
  }
];

export default function SubscriptionPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState(null);

  const currentPlan = user?.subscription_plan || 'free';

  const handleUpgrade = (planId) => {
    setSelectedPlan(planId);
    // Here you would typically integrate with a payment processor
    // For now, we'll just show a mock success message
    setTimeout(() => {
      alert('Payment integration would go here! This is just a demo.');
      setSelectedPlan(null);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </button>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Unlock the full potential of AI image generation with our flexible pricing plans.
          </p>
          
          {user && (
            <div className="mt-6 inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full">
              <CheckCircle className="h-4 w-4 mr-2" />
              Current Plan: <span className="font-semibold ml-1 capitalize">{currentPlan}</span>
            </div>
          )}
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isCurrentPlan = currentPlan === plan.id;
            const colorClasses = {
              gray: {
                border: 'border-gray-200',
                gradient: 'from-gray-500 to-gray-600',
                button: isCurrentPlan 
                  ? 'bg-gray-100 text-gray-600 cursor-not-allowed' 
                  : 'bg-gray-600 hover:bg-gray-700 text-white'
              },
              purple: {
                border: 'border-purple-200 ring-2 ring-purple-500 ring-opacity-50',
                gradient: 'from-purple-600 to-purple-700',
                button: isCurrentPlan 
                  ? 'bg-purple-100 text-purple-600 cursor-not-allowed' 
                  : 'bg-purple-600 hover:bg-purple-700 text-white'
              }
            };
            
            const colors = colorClasses[plan.color];

            return (
              <div
                key={plan.id}
                className={`relative bg-white rounded-2xl shadow-lg ${colors.border} ${
                  plan.popular ? 'transform scale-105' : ''
                }`}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-2 rounded-full text-sm font-semibold">
                      Most Popular
                    </div>
                  </div>
                )}

                {/* Current Plan Badge */}
                {isCurrentPlan && (
                  <div className="absolute -top-4 right-4">
                    <div className="bg-green-500 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Current
                    </div>
                  </div>
                )}

                <div className="p-8">
                  {/* Plan Header */}
                  <div className="text-center mb-8">
                    <div className={`inline-flex p-3 rounded-full bg-gradient-to-r ${colors.gradient} mb-4`}>
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                    <div className="flex items-baseline justify-center">
                      <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                      <span className="text-gray-500 ml-2">/{plan.period}</span>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-4 mb-8">
                    <h4 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">
                      What's included:
                    </h4>
                    <ul className="space-y-3">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-600">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={() => !isCurrentPlan && handleUpgrade(plan.id)}
                    disabled={isCurrentPlan || selectedPlan === plan.id}
                    className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors ${colors.button}`}
                  >
                    {selectedPlan === plan.id ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Processing...
                      </div>
                    ) : isCurrentPlan ? (
                      'Current Plan'
                    ) : plan.id === 'free' ? (
                      'Downgrade to Free'
                    ) : (
                      'Upgrade Now'
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* FAQ Section */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">
                Can I change my plan at any time?
              </h3>
              <p className="text-gray-600">
                Yes! You can upgrade or downgrade your plan at any time. Changes will take effect immediately.
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">
                What happens to my images if I downgrade?
              </h3>
              <p className="text-gray-600">
                All your previously generated images remain accessible. However, daily limits will apply based on your new plan.
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">
                Is there a free trial for the Enterprise plan?
              </h3>
              <p className="text-gray-600">
                The Free plan serves as our trial. You can explore the basic features before deciding to upgrade.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
