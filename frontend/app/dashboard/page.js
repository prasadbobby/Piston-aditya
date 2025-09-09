'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/AuthContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card, { CardContent, CardHeader } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { formatDate } from '../../lib/utils';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading } = useAuth();
  const [userHistory, setUserHistory] = useState([]);
  const [stats, setStats] = useState({
    totalProfiles: 0,
    totalQuizzes: 0,
    averageScore: 0
  });

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push('/login');
        return;
      }
      loadUserData();
    }
  }, [isAuthenticated, loading, router, user]);

  const loadUserData = () => {
    if (!user?.uid) return;
    
    const history = JSON.parse(localStorage.getItem(`user_history_${user.uid}`) || '[]');
    setUserHistory(history.slice(0, 5)); // Show latest 5 activities
    
    // Calculate stats
    const profilesCreated = history.filter(h => h.type === 'profile_created').length;
    const quizzesCompleted = history.filter(h => h.type === 'quiz_completed').length;
    const scores = history
      .filter(h => h.result?.average_score || h.result?.score)
      .map(h => h.result.average_score || h.result.score);
    const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    
    setStats({
      totalProfiles: profilesCreated,
      totalQuizzes: quizzesCompleted,
      averageScore: avgScore
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <DashboardLayout title="Dashboard">
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">
                Welcome back, {user?.name?.split(' ')[0] || 'User'}! 👋
              </h2>
              <p className="text-blue-100">
                Ready to continue your AI-powered learning journey?
              </p>
            </div>
            <div className="hidden md:block">
              <Button
                onClick={() => router.push('/dashboard/create-profile')}
                className="bg-white text-blue-600 hover:bg-gray-50"
              >
                + Create New Profile
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-white shadow-sm border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Learning Profiles</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalProfiles}</p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">👤</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Quizzes Taken</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalQuizzes}</p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">📝</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Average Score</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.averageScore}%</p>
                </div>
                <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">🏆</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <Card className="bg-white shadow-sm border border-gray-200">
              <CardHeader className="border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push('/dashboard/history')}
                  >
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {userHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">🚀</div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Start Your Learning Journey</h4>
                    <p className="text-gray-600 mb-4">Create your first learning profile to see activity here</p>
                    <Button
                      onClick={() => router.push('/dashboard/create-profile')}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Create Profile
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {userHistory.map((activity) => (
                      <div key={activity.id} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                            <span className="text-xl">{activity.icon || '📊'}</span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                          <p className="text-sm text-gray-500">{activity.description}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {formatDate(new Date(activity.created_at))}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            <Card className="bg-white shadow-sm border border-gray-200">
              <CardHeader className="border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  <Button
                    onClick={() => router.push('/dashboard/create-profile')}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <span className="mr-2">👤</span>
                    Create Learning Profile
                  </Button>
                  <Button
                    onClick={() => router.push('/dashboard/history')}
                    variant="outline"
                    className="w-full"
                  >
                    <span className="mr-2">📊</span>
                    View History
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}