import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const ExternalFeedback: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div>
      {/* ... existing code ... */}
      <Button
        onClick={() => navigate('/dashboard')}
        className="bg-white text-gray-900 border border-gray-200 hover:text-purple-600 hover:border-pink-300 focus:border-2 focus:border-pink-500 focus:text-pink-700 transition-all"
      >
        Return to Dashboard
      </Button>
      {/* ... existing code ... */}
    </div>
  );
};

export default ExternalFeedback; 