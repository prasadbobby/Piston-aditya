// frontend/app/dashboard/page.js
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto"></div>
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
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-brand-primary to-brand-light rounded-2xl text-white p-8 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-3">
                Welcome back, {user?.name?.split(' ')[0] || 'User'}! 👋
              </h2>
              <p className="text-brand-100 text-lg">
                Ready to create your next AI-powered learning profile?
              </p>
            </div>
            <div className="hidden md:block">
              <Button
                onClick={() => router.push('/dashboard/create-profile')}
                className="bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white border border-white/20 px-6 py-3 text-lg font-semibold"
              >
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create Profile
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-white shadow-lg border-0 hover:shadow-xl transition-shadow duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Learning Profiles</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalProfiles}</p>
                  <p className="text-xs text-gray-500 mt-1">Created</p>
                </div>
                <div className="h-14 w-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-2xl">👤</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg border-0 hover:shadow-xl transition-shadow duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Assessments</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalQuizzes}</p>
                  <p className="text-xs text-gray-500 mt-1">Completed</p>
                </div>
                <div className="h-14 w-14 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-2xl">📝</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg border-0 hover:shadow-xl transition-shadow duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Average Score</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.averageScore}%</p>
                  <p className="text-xs text-gray-500 mt-1">Performance</p>
                </div>
                <div className="h-14 w-14 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-2xl">🏆</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <Card className="bg-white shadow-lg border-0">
              <CardHeader className="border-b border-gray-100 bg-gray-50 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900">Recent Activity</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push('/dashboard/history')}
                    className="border-brand-300 text-brand-600 hover:bg-brand-50"
                  >
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {userHistory.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-gradient-to-br from-brand-primary to-brand-light rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl">
                      <span className="text-3xl text-white">🚀</span>
                    </div>
                    <h4 className="text-xl font-bold text-gray-900 mb-3">Start Your Learning Journey</h4>
                    <p className="text-gray-600 mb-6 max-w-md mx-auto">
                      Create your first learning profile and see your activity here
                    </p>
                    <Button
                      onClick={() => router.push('/dashboard/create-profile')}
                      className="bg-gradient-to-r from-brand-primary to-brand-light hover:from-brand-700 hover:to-brand-800 text-white px-6 py-3 font-semibold"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Create Profile
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {userHistory.map((activity) => (
                      <div key={activity.id} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                        <div className="flex-shrink-0">
                          <div className="h-12 w-12 bg-white rounded-xl flex items-center justify-center shadow-md">
                            <span className="text-xl">{activity.icon || '📊'}</span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900">{activity.title}</p>
                          <p className="text-sm text-gray-600">{activity.description}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {formatDate(new Date(activity.created_at))}
                          </p>
                        </div>
                        {activity.result?.profile_id && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => router.push(`/learning-path/${activity.result.profile_id}`)}
                            className="text-xs border-brand-300 text-brand-600 hover:bg-brand-50"
                          >
                            View
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions & Features */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card className="bg-white shadow-lg border-0">
              <CardHeader className="border-b border-gray-100 bg-gray-50 rounded-t-2xl">
                <h3 className="text-lg font-bold text-gray-900">Quick Actions</h3>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <Button
                    onClick={() => router.push('/dashboard/create-profile')}
                    className="w-full bg-gradient-to-r from-brand-primary to-brand-light hover:from-brand-700 hover:to-brand-800 text-white py-3 font-semibold"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Create Profile
                  </Button>
                  <Button
                    onClick={() => router.push('/dashboard/analytics')}
                    variant="outline"
                    className="w-full border-brand-300 text-brand-600 hover:bg-brand-50"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    View Analytics
                  </Button>
                  <Button
                    onClick={() => router.push('/dashboard/history')}
                    variant="outline"
                    className="w-full border-gray-300 text-gray-600 hover:bg-gray-50"
                  >
                   <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                   </svg>
                   View History
                 </Button>
               </div>
             </CardContent>
           </Card>

           {/* AI Features */}
           <Card className="bg-gradient-to-br from-brand-50 to-purple-50 border border-brand-200 shadow-lg">
             <CardContent className="p-6">
               <div className="text-center">
                 <div className="w-12 h-12 bg-gradient-to-br from-brand-primary to-brand-light rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                   <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                   </svg>
                 </div>
                 <h3 className="text-lg font-bold text-gray-900 mb-2">
                   AI-Powered Learning
                 </h3>
                 <p className="text-sm text-gray-600 mb-4">
                   Experience personalized education that adapts to your unique learning style and pace
                 </p>
                 <div className="grid grid-cols-2 gap-3 text-xs">
                   <div className="flex items-center space-x-1">
                     <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                     <span className="text-gray-600">Adaptive Content</span>
                   </div>
                   <div className="flex items-center space-x-1">
                     <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                     <span className="text-gray-600">Smart Assessments</span>
                   </div>
                   <div className="flex items-center space-x-1">
                     <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                     <span className="text-gray-600">Progress Tracking</span>
                   </div>
                   <div className="flex items-center space-x-1">
                     <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                     <span className="text-gray-600">Real-time Feedback</span>
                   </div>
                 </div>
               </div>
             </CardContent>
           </Card>
         </div>
       </div>
     </div>
   </DashboardLayout>
 );
}