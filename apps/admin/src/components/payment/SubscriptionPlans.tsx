'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Star } from 'lucide-react';

interface SubscriptionPlan {
  id: string;
  planType: 'BASIC' | 'STANDARD' | 'PREMIUM';
  name: string;
  price: number;
  description?: string;
  features: string[];
  maxProducts?: number;
  maxOffers?: number;
  isActive: boolean;
  isPopular?: boolean;
}

interface SubscriptionPlansProps {
  plans: SubscriptionPlan[];
  onSelectPlan: (plan: SubscriptionPlan) => void;
  loading?: boolean;
  selectedPlanId?: string;
}

const SubscriptionPlans: React.FC<SubscriptionPlansProps> = ({
  plans,
  onSelectPlan,
  loading = false,
  selectedPlanId,
}) => {
  return (
    <div className="py-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold tracking-tight">Choose Your Plan</h2>
        <p className="text-muted-foreground mt-2">
          Select the perfect plan for your business needs
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {plans.map((plan) => (
          <Card
            key={plan.id}
            className={`relative transition-all duration-200 hover:shadow-lg ${
              plan.planType === 'STANDARD' ? 'border-primary shadow-md scale-105' : ''
            } ${selectedPlanId === plan.id ? 'ring-2 ring-primary' : ''}`}
          >
            {plan.planType === 'STANDARD' && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground px-3 py-1">
                  <Star className="w-3 h-3 mr-1" />
                  Most Popular
                </Badge>
              </div>
            )}

            <CardHeader className="text-center pb-4">
              <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
              {plan.description && (
                <CardDescription className="text-sm">
                  {plan.description}
                </CardDescription>
              )}
              <div className="mt-4">
                <span className="text-4xl font-bold">₹{plan.price}</span>
                <span className="text-muted-foreground">/month</span>
                <div className="text-xs text-muted-foreground mt-1">
                  + ₹{Math.round(plan.price * 0.18 * 100) / 100} GST
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              {plan.features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}

              {plan.maxProducts && (
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm">Up to {plan.maxProducts} products</span>
                </div>
              )}

              {plan.maxOffers && (
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm">Up to {plan.maxOffers} active offers</span>
                </div>
              )}
            </CardContent>

            <CardFooter>
              <Button
                className="w-full"
                variant={plan.planType === 'STANDARD' ? 'default' : 'outline'}
                onClick={() => onSelectPlan(plan)}
                disabled={loading || selectedPlanId === plan.id}
              >
                {selectedPlanId === plan.id
                  ? 'Selected'
                  : loading
                  ? 'Loading...'
                  : 'Choose Plan'
                }
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="text-center mt-8 text-sm text-muted-foreground">
        <p>All plans include a 30-day free trial. No credit card required.</p>
        <p className="mt-1">Prices exclude 18% GST</p>
      </div>
    </div>
  );
};

export default SubscriptionPlans;