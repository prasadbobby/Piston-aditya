// frontend/components/ui/ProfileCreationLoader.js
'use client';
import { useState, useEffect } from 'react';

export default function ProfileCreationLoader({ isVisible, onComplete, profileId = null }) {
  const [currentStage, setCurrentStage] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isCheckingPretest, setIsCheckingPretest] = useState(false);

  const stages = [
    {
      id: 1,
      title: "Creating Your Profile",
      description: "Setting up your personalized learning profile...",
      icon: "👤",
      duration: 2000,
      color: "from-blue-500 to-blue-600"
    },
    {
      id: 2, 
      title: "AI Analysis",
      description: "Analyzing your learning style and preferences...",
      icon: "🤖",
      duration: 2500,
      color: "from-purple-500 to-purple-600"
    },
    {
      id: 3,
      title: "Generating Content",
      description: "Creating personalized learning materials...",
      icon: "📚",
      duration: 3000,
      color: "from-green-500 to-green-600"
    },
    {
      id: 4,
      title: "Preparing Assessment",
      description: "Building your custom pretest...",
      icon: "📝",
      duration: 2000,
      color: "from-orange-500 to-orange-600"
    },
    {
      id: 5,
      title: "Almost Ready!",
      description: "Finalizing your personalized experience...",
      icon: "✨",
      duration: 1500,
      color: "from-pink-500 to-pink-600"
    }
  ];

  // Check if pretest is ready
  const checkPretestReady = async (profileId) => {
    if (!profileId) return false;
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/learner/${profileId}/pretest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subject: 'general' })
      });
      
      return response.ok;
    } catch (error) {
      console.log('Pretest not ready yet, continuing to wait...');
      return false;
    }
  };

  useEffect(() => {
    if (!isVisible) return;

    let stageTimer;
    let progressTimer;
    let progressInterval;
    let pretestCheckInterval;

    const startStage = (stageIndex) => {
      if (stageIndex >= stages.length) {
        // All stages complete, now check if pretest is ready
        if (profileId) {
          setIsCheckingPretest(true);
          setCurrentStage(stageIndex); // Stay on final stage
          setProgress(100);
          
          // Check pretest readiness every 2 seconds
          pretestCheckInterval = setInterval(async () => {
            const isReady = await checkPretestReady(profileId);
            if (isReady) {
              clearInterval(pretestCheckInterval);
              setTimeout(() => {
                onComplete && onComplete();
              }, 500);
            }
          }, 2000);
          
          // Fallback: complete after 30 seconds regardless
          setTimeout(() => {
            clearInterval(pretestCheckInterval);
            onComplete && onComplete();
          }, 30000);
        } else {
          setTimeout(() => {
            onComplete && onComplete();
          }, 500);
        }
        return;
      }

      setCurrentStage(stageIndex);
      setProgress(0);

      const stage = stages[stageIndex];
      const progressIncrement = 100 / (stage.duration / 50);

      // Progress animation
      progressInterval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + progressIncrement;
          if (newProgress >= 100) {
            clearInterval(progressInterval);
            return 100;
          }
          return newProgress;
        });
      }, 50);

      // Move to next stage
      stageTimer = setTimeout(() => {
        clearInterval(progressInterval);
        startStage(stageIndex + 1);
      }, stage.duration);
    };

    startStage(0);

    return () => {
      clearTimeout(stageTimer);
      clearInterval(progressInterval);
      clearInterval(pretestCheckInterval);
    };
  }, [isVisible, onComplete, profileId]);

  if (!isVisible) return null;

  const currentStageData = stages[Math.min(currentStage, stages.length - 1)];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-8 text-center animate-fade-in">
        
        {/* Header */}
        <div className="mb-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
            <span className="text-3xl">{currentStageData?.icon}</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Creating Your Learning Experience
          </h2>
          <p className="text-gray-600">
            {isCheckingPretest ? 'Finalizing your assessment...' : 'Please wait while we set up everything for you...'}
          </p>
        </div>

        {/* Current Stage */}
        <div className="mb-8">
          <div className={`inline-flex items-center px-4 py-2 rounded-full text-white text-sm font-medium bg-gradient-to-r ${currentStageData?.color} mb-4`}>
            <span className="mr-2">{currentStageData?.icon}</span>
            {isCheckingPretest ? 'Preparing Assessment...' : currentStageData?.title}
          </div>
          <p className="text-gray-700 text-lg font-medium mb-4">
            {isCheckingPretest ? 'Setting up your personalized pretest...' : currentStageData?.description}
          </p>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
            <div 
              className={`h-3 rounded-full bg-gradient-to-r ${currentStageData?.color} transition-all duration-100 ease-out`}
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="text-sm text-gray-500">
            {isCheckingPretest ? 'Almost Ready...' : `${Math.round(progress)}% Complete`}
          </div>
        </div>

        {/* Stage Progress Dots */}
        <div className="flex justify-center space-x-3 mb-6">
          {stages.map((stage, index) => (
            <div
              key={stage.id}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index < currentStage 
                  ? 'bg-green-500 shadow-lg' 
                  : index === currentStage 
                  ? `bg-gradient-to-r ${currentStageData?.color} shadow-lg` 
                  : 'bg-gray-300'
              }`}
            ></div>
          ))}
          {/* Extra dot for pretest check */}
          {isCheckingPretest && (
            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-500 to-purple-600 shadow-lg animate-pulse"></div>
          )}
        </div>

        {/* AI Features Preview */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-4 border border-blue-200">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <span className="text-blue-600">🎯</span>
              <span className="text-gray-700">Personalized Content</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-purple-600">🤖</span>
              <span className="text-gray-700">AI-Powered Assessment</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-green-600">📈</span>
              <span className="text-gray-700">Adaptive Learning</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-orange-600">⚡</span>
              <span className="text-gray-700">Instant Feedback</span>
            </div>
          </div>
        </div>

        {/* Loading Animation */}
        <div className="mt-6">
          <div className="flex justify-center space-x-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 bg-primary-600 rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.2}s` }}
              ></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}