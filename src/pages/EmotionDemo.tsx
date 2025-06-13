import React from 'react';
import { EmotionShowcase } from '@/components/tavern/EmotionShowcase';

const EmotionDemo: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-900">
      <div className="container mx-auto py-8">
        <EmotionShowcase />
      </div>
    </div>
  );
};

export default EmotionDemo; 