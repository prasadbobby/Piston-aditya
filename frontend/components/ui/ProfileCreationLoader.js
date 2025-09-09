// frontend/components/ui/ProfileCreationLoader.js
'use client';
import { useState, useEffect } from 'react';

export default function ProfileCreationLoader({ isVisible, onComplete, profileId = null }) {
  const [currentStage, setCurrentStage] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isWaitingForPretest, setIsWaitingForPretest] = useState(false);
  const [pretestReady, setPretestReady] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [maxRetries] = useState(20); // Maximum 20 attempts (1 minute)

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
      duration: 2500,
      color: "from-orange-500 to-orange-600"
    },
    {
      id: 5,
      title: "Finalizing Setup",
      description: "Almost ready! Preparing your assessment...",
      icon: "✨",
      duration: 2000,
      color: "from-pink-500 to-pink-600"
    }
  ];

  // Check if pretest is ready by making actual API call
  const checkPretestReady = async (profileId) => {
    if (!profileId) {
      console.log('❌ No profile ID provided for pretest check');
      return false;
    }
    
    try {
      console.log(`🔍 Checking pretest readiness for profile: ${profileId} (attempt ${retryCount + 1})`);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/learner/${profileId}/pretest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subject: 'general' })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success && data.questions && data.questions.length > 0) {
        console.log('✅ Pretest is ready with questions!');
        return true;
      } else {
        console.log(`⏳ Pretest not ready yet: ${data.error || 'Still generating...'}`);
        return false;
      }
    } catch (error) {
      console.log(`⏳ Pretest check failed: ${error.message}`);
      return false;
    }
  };

  useEffect(() => {
    if (!isVisible) return;

    console.log(`🚀 ProfileCreationLoader started with profileId: ${profileId}`);

    let stageTimer;
    let progressInterval;
    let pretestCheckInterval;

    const startStage = (stageIndex) => {
      if (stageIndex >= stages.length) {
        // All visual stages complete, now wait for actual pretest readiness
        console.log('🎬 All stages complete, checking pretest readiness...');
        setIsWaitingForPretest(true);
        setCurrentStage(stages.length); // Stay beyond last stage
        setProgress(100);
        
        if (profileId) {
          console.log(`🔍 Starting pretest readiness check for profile: ${profileId}`);
          
          // Start checking pretest readiness immediately
          const checkPretest = async () => {
            const isReady = await checkPretestReady(profileId);
            
            if (isReady) {
              console.log('🎉 Pretest confirmed ready!');
              setPretestReady(true);
              setTimeout(() => {
                onComplete && onComplete();
              }, 1500); // Brief delay to show success
            } else {
              setRetryCount(prev => {
                const newCount = prev + 1;
                
                if (newCount >= maxRetries) {
                  console.log('⚠️ Maximum retries reached, proceeding anyway...');
                  setTimeout(() => {
                    onComplete && onComplete();
                  }, 1000);
                  return newCount;
                }
                
                // Continue checking every 3 seconds
                setTimeout(checkPretest, 3000);
                return newCount;
              });
            }
          };
          
          // Start the first check immediately
          checkPretest();
        } else {
          console.log('⚠️ No profile ID provided, completing immediately');
          setTimeout(() => {
            onComplete && onComplete();
          }, 1000);
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

    // Reset states
    setIsWaitingForPretest(false);
    setPretestReady(false);
    setRetryCount(0);
    
    startStage(0);

    return () => {
      clearTimeout(stageTimer);
      clearInterval(progressInterval);
      clearInterval(pretestCheckInterval);
    };
  }, [isVisible, profileId, onComplete, maxRetries, retryCount]);

  if (!isVisible) return null;

  // Determine what to display
  let displayTitle;
  let displayDescription;
  let displayIcon;
  let displayColor;
  let showProgress = true;
  let progressValue = progress;

  if (isWaitingForPretest) {
    if (pretestReady) {
      displayTitle = "Ready to Start!";
      displayDescription = "Your personalized assessment is ready. Redirecting...";
      displayIcon = "🎉";
      displayColor = "from-green-500 to-green-600";
      progressValue = 100;
    } else {
      displayTitle = "Preparing Your Assessment";
      displayDescription = `Generating your personalized pretest questions... ${retryCount > 0 ? `(checking... ${retryCount}/${maxRetries})` : ''}`;
      displayIcon = "⏳";
      displayColor = "from-purple-500 to-purple-600";
      showProgress = false; // Show spinner instead
    }
  } else {
    const displayStage = stages[Math.min(currentStage, stages.length - 1)];
    displayTitle = displayStage?.title;
    displayDescription = displayStage?.description;
    displayIcon = displayStage?.icon;
    displayColor = displayStage?.color;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-8 text-center animate-fade-in">
        
        {/* Header */}
        <div className="mb-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
            <span className="text-3xl">{displayIcon}</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Creating Your Learning Experience
          </h2>
          <p className="text-gray-600">
            {isWaitingForPretest 
              ? 'Almost there! Finalizing your personalized assessment...' 
              : 'Please wait while we set up everything for you...'
            }
          </p>
        </div>

        {/* Current Stage */}
        <div className="mb-8">
          <div className={`inline-flex items-center px-4 py-2 rounded-full text-white text-sm font-medium bg-gradient-to-r ${displayColor} mb-4`}>
            <span className="mr-2">{displayIcon}</span>
            {displayTitle}
          </div>
          <p className="text-gray-700 text-lg font-medium mb-4">
            {displayDescription}
          </p>
          
          {/* Progress Bar or Spinner */}
          {showProgress ? (
            <>
              <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                <div 
                  className={`h-3 rounded-full bg-gradient-to-r ${displayColor} transition-all duration-100 ease-out`}
                  style={{ width: `${progressValue}%` }}
                ></div>
              </div>
              <div className="text-sm text-gray-500">
                {Math.round(progressValue)}% Complete
              </div>
            </>
          ) : (
            <div className="flex justify-center mb-4">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-purple-200 border-t-purple-600"></div>
            </div>
          )}
        </div>

        {/* Stage Progress Dots */}
        <div className="flex justify-center space-x-3 mb-6">
          {stages.map((stage, index) => (
            <div
              key={stage.id}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index < currentStage 
                  ? 'bg-green-500 shadow-lg' 
                  : index === currentStage && !isWaitingForPretest
                  ? `bg-gradient-to-r ${stages[currentStage]?.color} shadow-lg` 
                  : 'bg-gray-300'
              }`}
            ></div>
          ))}
          {/* Extra dot for pretest preparation */}
          <div className={`w-3 h-3 rounded-full transition-all duration-300 ${
            isWaitingForPretest
              ? pretestReady
                ? 'bg-green-500 shadow-lg'
                : 'bg-gradient-to-r from-purple-500 to-purple-600 shadow-lg animate-pulse'
              : 'bg-gray-300'
          }`}></div>
        </div>

        {/* Status Message */}
        {isWaitingForPretest && (
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-4 border border-purple-200 mb-4">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <span className="text-purple-600">🤖</span>
              <span className="text-purple-800 font-medium">AI is working...</span>
            </div>
            <p className="text-purple-700 text-sm">
              {pretestReady 
                ? "✅ Your personalized assessment is ready!" 
                : retryCount > 0 
                ? `Generating your custom questions... (attempt ${retryCount}/${maxRetries})`
                : "Creating your personalized quiz questions..."
              }
            </p>
            {retryCount > 5 && !pretestReady && (
              <p className="text-purple-600 text-xs mt-1">
                This is taking a bit longer than usual. The AI is working hard to create the perfect assessment for you!
              </p>
            )}
          </div>
        )}

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