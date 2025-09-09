'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/AuthContext';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import Card, { CardContent, CardHeader } from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import { formatDate } from '../../../lib/utils';

const getItemIcon = (type) => {
  switch (type) {
    case 'profile_created':
      return '👤';
    case 'quiz_completed':
      return '📝';
    case 'path_started':
      return '🛤️';
    case 'learning_completed':
      return '🎓';
    default:
      return '📊';
  }
};

const getItemColor = (type) => {
  switch (type) {
    case 'profile_created':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'quiz_completed':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'path_started':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'learning_completed':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const formatItemType = (type) => {
  switch (type) {
    case 'profile_created':
      return 'Profile Created';
    case 'quiz_completed':
      return 'Quiz Completed';
    case 'path_started':
      return 'Learning Path Started';
    case 'learning_completed':
      return 'Learning Completed';
    default:
      return 'Activity';
  }
};

export default function HistoryPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading } = useAuth();
  const [history, setHistory] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push('/login');
        return;
      }
      loadUserHistory();
    }
  }, [isAuthenticated, user, loading, router]);

  const loadUserHistory = () => {
    if (!user?.uid) return;
    
    const userHistory = JSON.parse(localStorage.getItem(`user_history_${user.uid}`) || '[]');
    setHistory(userHistory);
    setFilteredHistory(userHistory);
  };

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    if (newFilter === 'all') {
      setFilteredHistory(history);
    } else {
      setFilteredHistory(history.filter(item => item.type === newFilter));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <DashboardLayout title="Generation History">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Learning History</h2>
            <p className="text-gray-600">
              Track all your learning activities, profiles created, and progress made
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Button
              onClick={() => router.push('/dashboard/create-profile')}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              + Create New Profile
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="bg-white shadow-sm border border-gray-200">
          <CardContent className="p-6">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleFilterChange('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  filter === 'all'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Activities ({history.length})
              </button>
              <button
                onClick={() => handleFilterChange('profile_created')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  filter === 'profile_created'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                👤 Profiles ({history.filter(h => h.type === 'profile_created').length})
              </button>
              <button
                onClick={() => handleFilterChange('quiz_completed')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  filter === 'quiz_completed'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                📝 Quizzes ({history.filter(h => h.type === 'quiz_completed').length})
              </button>
            </div>
          </CardContent>
        </Card>

        {/* History List */}
        {filteredHistory.length === 0 ? (
          <Card className="bg-white shadow-sm border border-gray-200">
            <CardContent className="text-center py-12">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {filter === 'all' ? 'No Activity Yet' : `No ${formatItemType(filter)} Found`}
              </h3>
              <p className="text-gray-600 mb-6">
                {filter === 'all' 
                  ? 'Start your learning journey by creating your first profile!'
                  : `You haven't ${filter === 'profile_created' ? 'created any profiles' : 'completed any quizzes'} yet.`
                }
              </p>
              <Button
                onClick={() => router.push('/dashboard/create-profile')}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Create Your First Profile
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredHistory.map((item) => (
              <Card key={item.id} className="bg-white shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    {/* Icon */}
                    <div className="flex-shrink-0">
                      <div className="h-12 w-12 bg-gray-100 rounded-xl flex items-center justify-center">
                        <span className="text-2xl">{getItemIcon(item.type)}</span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {item.title}
                            </h3>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getItemColor(item.type)}`}>
                              {formatItemType(item.type)}
                            </span>
                          </div>

                          <p className="text-gray-600 mb-2">{item.description}</p>

                          {/* Profile Details */}
                          {item.type === 'profile_created' && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mt-3">
                              <div>
                                <span className="text-gray-500">Subject:</span>
                                <span className="ml-2 font-medium">{item.subject}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Style:</span>
                                <span className="ml-2 font-medium">{item.learning_style}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Level:</span>
                                <span className="ml-2 font-medium">{item.knowledge_level}/5</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Focus Areas:</span>
                                <span className="ml-2 font-medium">{item.weak_areas?.length || 0}</span>
                              </div>
                            </div>
                          )}

                          {/* Quiz Details */}
                          {item.type === 'quiz_completed' && item.result && (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mt-3">
                              <div>
                                <span className="text-gray-500">Subject:</span>
                                <span className="ml-2 font-medium">{item.subject}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Score:</span>
                                <span className={`ml-2 font-medium ${
                                  item.result.score >= 80 ? 'text-green-600' : 
                                  item.result.score >= 60 ? 'text-yellow-600' : 'text-red-600'
                                }`}>
                                  {item.result.score}%
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500">Questions:</span>
                                <span className="ml-2 font-medium">
                                  {item.result.correct_answers}/{item.result.total_questions}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Focus Areas Tags */}
                          {item.weak_areas && item.weak_areas.length > 0 && (
                            <div className="mt-3">
                              <span className="text-sm text-gray-500 mb-2 block">Focus Areas:</span>
                              <div className="flex flex-wrap gap-2">
                                {item.weak_areas.slice(0, 3).map((area, index) => (
                                  <span 
                                    key={index}
                                    className="inline-flex items-center px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full"
                                  >
                                    {area}
                                  </span>
                                ))}
                                {item.weak_areas.length > 3 && (
                                  <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                                    +{item.weak_areas.length - 3} more
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col space-y-2 ml-4">
                          <span className="text-xs text-gray-500">
                            {formatDate(new Date(item.created_at))}
                          </span>
                          
                          {item.type === 'profile_created' && item.result?.profile_id && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => router.push(`/learning-path/${item.result.profile_id}`)}
                              className="text-xs"
                            >
                              View Path
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Stats Summary */}
        {filteredHistory.length > 0 && (
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Your Learning Stats</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {history.filter(h => h.type === 'profile_created').length}
                  </div>
                  <div className="text-sm text-gray-600">Profiles Created</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {history.filter(h => h.type === 'quiz_completed').length}
                  </div>
                  <div className="text-sm text-gray-600">Quizzes Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {history.reduce((sum, h) => sum + (h.result?.total_resources || 0), 0)}
                  </div>
                  <div className="text-sm text-gray-600">Total Resources</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {(() => {
                      const scores = history
                        .filter(h => h.result?.average_score || h.result?.score)
                        .map(h => h.result.average_score || h.result.score);
                      return scores.length > 0 
                        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
                        : 0;
                    })()}%
                  </div>
                  <div className="text-sm text-gray-600">Average Score</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}