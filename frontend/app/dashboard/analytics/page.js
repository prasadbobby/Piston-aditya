// frontend/app/dashboard/analytics/page.js
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/AuthContext';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import Card, { CardContent, CardHeader } from '../../../components/ui/Card';

export default function AnalyticsPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [analytics, setAnalytics] = useState({
    learningProgress: {
      totalTimeSpent: 45,
      lessonsCompleted: 12,
      quizzesCompleted: 8,
      averageScore: 87
    },
    subjectBreakdown: [
      { subject: 'Mathematics', progress: 75, time: 20 },
      { subject: 'Physics', progress: 45, time: 15 },
      { subject: 'Chemistry', progress: 30, time: 10 }
    ],
    weeklyActivity: [
      { day: 'Mon', hours: 2.5 },
      { day: 'Tue', hours: 1.8 },
      { day: 'Wed', hours: 3.2 },
      { day: 'Thu', hours: 2.1 },
      { day: 'Fri', hours: 1.5 },
      { day: 'Sat', hours: 4.0 },
      { day: 'Sun', hours: 2.8 }
    ],
    strengths: ['Problem Solving', 'Visual Learning', 'Quick Comprehension'],
    improvements: ['Time Management', 'Consistency', 'Review Habits']
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <DashboardLayout title="Learning Analytics">
      <div className="space-y-6">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Total Hours</p>
                  <p className="text-3xl font-bold text-blue-900">{analytics.learningProgress.totalTimeSpent}h</p>
                </div>
                <div className="h-12 w-12 bg-blue-500 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">⏰</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Lessons Done</p>
                  <p className="text-3xl font-bold text-green-900">{analytics.learningProgress.lessonsCompleted}</p>
                </div>
                <div className="h-12 w-12 bg-green-500 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">📚</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600">Quizzes</p>
                  <p className="text-3xl font-bold text-purple-900">{analytics.learningProgress.quizzesCompleted}</p>
                </div>
                <div className="h-12 w-12 bg-purple-500 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">📝</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-600">Avg Score</p>
                  <p className="text-3xl font-bold text-yellow-900">{analytics.learningProgress.averageScore}%</p>
                </div>
                <div className="h-12 w-12 bg-yellow-500 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">🏆</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Subject Progress */}
          <Card className="bg-white shadow-sm border border-gray-200">
            <CardHeader className="border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Subject Progress</h3>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {analytics.subjectBreakdown.map((subject, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-900">{subject.subject}</span>
                      <span className="text-sm text-gray-600">{subject.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${subject.progress}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500">{subject.time} hours spent</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Weekly Activity */}
          <Card className="bg-white shadow-sm border border-gray-200">
            <CardHeader className="border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Weekly Activity</h3>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {analytics.weeklyActivity.map((day, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    <div className="w-12 text-sm font-medium text-gray-600">{day.day}</div>
                    <div className="flex-1">
                      <div className="w-full bg-gray-200 rounded-full h-4">
                        <div 
                          className="bg-gradient-to-r from-green-500 to-green-600 h-4 rounded-full transition-all duration-500"
                          style={{ width: `${(day.hours / 4) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="w-16 text-sm text-gray-600 text-right">{day.hours}h</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Strengths and Improvements */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-white shadow-sm border border-gray-200">
            <CardHeader className="border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <span className="text-green-500 mr-2">💪</span>
                Your Strengths
              </h3>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                {analytics.strengths.map((strength, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-green-800 font-medium">{strength}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm border border-gray-200">
            <CardHeader className="border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <span className="text-orange-500 mr-2">🎯</span>
                Areas for Improvement
              </h3>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                {analytics.improvements.map((improvement, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span className="text-orange-800 font-medium">{improvement}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Recommendations */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
          <CardHeader className="border-b border-blue-200">
            <h3 className="text-lg font-semibold text-blue-900 flex items-center">
              <span className="text-blue-500 mr-2">🤖</span>
              AI Recommendations
            </h3>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="p-4 bg-white rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-2">📈 Study Schedule</h4>
                <p className="text-blue-800">
                  Based on your activity pattern, consider studying Physics on weekends when you're most active. 
                  Your Saturday sessions are 2x more productive than weekdays.
                </p>
              </div>
              
              <div className="p-4 bg-white rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-2">🎯 Focus Areas</h4>
                <p className="text-blue-800">
                  Your quiz performance shows strong visual learning. Consider more diagram-based resources 
                  for Chemistry topics where you scored below 70%.
                </p>
              </div>
              
              <div className="p-4 bg-white rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-2">⏰ Time Management</h4>
                <p className="text-blue-800">
                  You learn best in 2-3 hour sessions. Break down complex topics into smaller chunks 
                  and take 15-minute breaks every hour for optimal retention.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}