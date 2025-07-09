import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Scale, Crown, Gem } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import lovemirrorLogo from '/public/lovemirror_nobg_logo.png';

export default function Welcome() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-[#0a1023] to-[#181f3a]">
      <div className="w-full max-w-md mx-auto">
        
        {/* Title and subtitle */}
        <div className="text-center mb-2">
          <h1 className="text-2xl sm:text-3xl font-bold mb-1" style={{
            background: 'linear-gradient(90deg, #ff0099, #9900ff)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            display: 'inline-block',
          }}>
            Love Mirror
          </h1>
        </div>
        <div className="text-center mb-2">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-2" style={{
            background: 'linear-gradient(90deg, #ff0099, #9900ff)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            display: 'inline-block',
          }}>
            Discover Your True Value
          </h2>
        </div>
        <div className="text-center mb-6">
          <p className="text-gray-300 text-base sm:text-lg max-w-md mx-auto">
            Your journey to understanding and improving your relationship value starts here
          </p>
        </div>
        {/* Assessment cards */}
        <div className="space-y-4 mb-6">
          <div
            className="flex items-center gap-4 bg-[#23263a] rounded-xl p-4 shadow-md cursor-pointer hover:bg-[#2d3150] transition"
            onClick={() => navigate('/auth')}
          >
            <div className="bg-pink-100 p-2 rounded-full">
              <Scale className="w-7 h-7 text-pink-500" />
            </div>
            <div className="flex-1">
              <div className="text-white font-semibold text-base sm:text-lg">High-Value Man Assessment</div>
              <div className="text-gray-300 text-xs sm:text-sm">For men seeking to understand and improve their value</div>
            </div>
          </div>
          <div
            className="flex items-center gap-4 bg-[#23263a] rounded-xl p-4 shadow-md cursor-pointer hover:bg-[#2d3150] transition"
            onClick={() => navigate('/auth')}
          >
            <div className="bg-purple-100 p-2 rounded-full">
              <Crown className="w-7 h-7 text-purple-500" />
            </div>
            <div className="flex-1">
              <div className="text-white font-semibold text-base sm:text-lg">Bridal Price Estimator</div>
              <div className="text-gray-300 text-xs sm:text-sm">Traditional African bridal value assessment</div>
            </div>
          </div>
          <div
            className="flex items-center gap-4 bg-[#23263a] rounded-xl p-4 shadow-md cursor-pointer hover:bg-[#2d3150] transition"
            onClick={() => navigate('/auth')}
          >
            <div className="bg-violet-100 p-2 rounded-full">
              <Gem className="w-7 h-7 text-violet-500" />
            </div>
            <div className="flex-1">
              <div className="text-white font-semibold text-base sm:text-lg">Wife Material Assessment</div>
              <div className="text-gray-300 text-xs sm:text-sm">Modern relationship readiness evaluation</div>
            </div>
          </div>
        </div>
        {/* Start button and privacy note */}
        <div className="flex flex-col space-y-3 pt-2">
          <Button
            onClick={() => navigate('/auth')}
            className="w-full bg-gradient-to-r from-pink-500 via-purple-500 to-violet-500 text-white font-semibold hover:opacity-90 transition-opacity text-lg py-3 rounded-lg shadow-lg"
            size="lg"
          >
            Start Your Assessment
          </Button>
          <p className="text-center text-xs sm:text-sm text-gray-400">
            Your data is secure and your privacy is our priority
          </p>
        </div>
      </div>
    </div>
  );
}