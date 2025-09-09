// frontend/app/dashboard/generator/page.js
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/AuthContext';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import Card, { CardContent, CardHeader } from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { apiClient } from '../../../lib/api';
import { validateRequired } from '../../../lib/utils';
import toast from 'react-hot-toast';

export default function AIGeneratorPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    learning_style: '',
    knowledge_level: 3,
    focus_areas: []
  });
  const [generatedFocusAreas, setGeneratedFocusAreas] = useState([]);
  const [isGeneratingAreas, setIsGeneratingAreas] = useState(false);
  const [errors, setErrors] = useState({});

  const learningStyleOptions = [
    { 
      value: 'visual', 
      label: 'Visual Learner',
      description: 'Learn best through images, diagrams, and visual content',
      icon: '👁️',
      gradient: 'from-blue-500 to-cyan-500'
    },
    { 
      value: 'auditory', 
      label: 'Auditory Learner',
      description: 'Learn best through listening and verbal instruction',
      icon: '👂',
      gradient: 'from-green-500 to-emerald-500'
    },
    { 
      value: 'reading', 
      label: 'Reading/Writing',
      description: 'Learn best through text-based content and writing',
      icon: '📚',
      gradient: 'from-purple-500 to-violet-500'
    },
    { 
      value: 'kinesthetic', 
      label: 'Kinesthetic Learner',
      description: 'Learn best through hands-on activities and practice',
      icon: '🤲',
      gradient: 'from-orange-500 to-red-500'
    }
  ];

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, loading, router]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const processedValue = name === 'knowledge_level' ? parseInt(value, 10) : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    if (name === 'subject') {
      setFormData(prev => ({
        ...prev,
        focus_areas: []
      }));
      setGeneratedFocusAreas([]);
    }
  };

  const generateFocusAreas = async () => {
    if (!formData.subject.trim()) {
      toast.error('Please enter a subject first');
      return;
    }

    setIsGeneratingAreas(true);
    try {
      const response = await apiClient.generateCustomFocusAreas(formData.subject);
      
      if (response.success && response.focus_areas) {
        setGeneratedFocusAreas(response.focus_areas);
        toast.success(`Generated ${response.focus_areas.length} focus areas for ${formData.subject}`);
      } else {
        throw new Error(response.error || 'Failed to generate focus areas');
      }
    } catch (error) {
      console.error('Error generating focus areas:', error);
      toast.error('Failed to generate focus areas. Please try again.');
    } finally {
      setIsGeneratingAreas(false);
    }
  };

  const handleFocusAreaToggle = (area) => {
    setFormData(prev => ({
      ...prev,
      focus_areas: prev.focus_areas.includes(area)
        ? prev.focus_areas.filter(item => item !== area)
        : [...prev.focus_areas, area]
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!validateRequired(formData.subject)) {
      newErrors.subject = 'Subject is required';
    }
    if (!validateRequired(formData.learning_style)) {
      newErrors.learning_style = 'Learning style is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleGenerate = async () => {
    if (!validateForm()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsLoading(true);

    try {
      const submissionData = {
        ...formData,
        custom_subject: formData.subject,
        weak_areas: formData.focus_areas,
        user_id: user?.uid,
        created_by: user?.email,
        name: user?.name || 'User'
      };
      
      const response = await apiClient.createLearner(submissionData);
      
      if (response.success) {
        // Save to history
        const historyItem = {
          id: response.data.profile_id,
          type: 'profile_created',
          title: `${formData.subject} Learning Path`,
          subject: formData.subject,
          learning_style: formData.learning_style,
          knowledge_level: formData.knowledge_level,
          weak_areas: formData.focus_areas,
          created_at: new Date().toISOString(),
          status: 'completed',
          icon: '🎓',
          description: `Generated AI learning path for ${formData.subject}`,
          result: {
            profile_id: response.data.profile_id,
            total_resources: response.data.total_resources || 0
          }
        };
        
        const existingHistory = JSON.parse(localStorage.getItem(`user_history_${user?.uid}`) || '[]');
        existingHistory.unshift(historyItem);
        localStorage.setItem(`user_history_${user?.uid}`, JSON.stringify(existingHistory));
        
        toast.success('AI Learning Path generated successfully!');
        
        if (response.data.status === 'generating_content') {
          toast.success('AI is generating your personalized content in the background!');
        }
        
        router.push(`/pretest/${response.data.profile_id}`);
      } else {
        throw new Error(response.error || 'Failed to generate learning path');
      }
    } catch (error) {
      console.error('Error generating learning path:', error);
      toast.error(error.message || 'Failed to generate learning path');
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <DashboardLayout title="AI Learning Generator">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Hero Section */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-brand-primary to-brand-light rounded-3xl mb-6 shadow-xl">
            <svg className="w-10 h-10 text-white animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            AI Learning Generator
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Generate personalized learning experiences powered by artificial intelligence. 
            Tell us what you want to learn, and we'll create the perfect path for you.
          </p>
        </div>

        {/* Main Form Card */}
        <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
          <CardContent className="p-8 space-y-8">
            
            {/* Subject Input */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-brand-100 rounded-lg flex items-center justify-center">
                  <span className="text-brand-600 font-bold">1</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900">What do you want to learn?</h3>
              </div>
              
              <Input
                label="Subject or Topic"
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                placeholder="e.g., Machine Learning, Web Development, Photography, Cooking..."
                required
                error={errors.subject}
                className="text-lg py-4"
              />
              
              {formData.subject && (
                <div className="flex items-center space-x-3">
                  <Button
                    onClick={generateFocusAreas}
                    loading={isGeneratingAreas}
                    variant="outline"
                    size="sm"
                    className="border-brand-300 text-brand-600 hover:bg-brand-50"
                  >
                    <span className="mr-2">✨</span>
                    {isGeneratingAreas ? 'Generating...' : 'Generate Focus Areas'}
                  </Button>
                  {generatedFocusAreas.length > 0 && (
                    <span className="text-sm text-green-600 font-medium">
                      ✓ {generatedFocusAreas.length} areas generated
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Learning Style Selection */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-brand-100 rounded-lg flex items-center justify-center">
                  <span className="text-brand-600 font-bold">2</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900">How do you learn best?</h3>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {learningStyleOptions.map((option) => (
                  <label
                    key={option.value}
                    className={`relative p-6 border-2 rounded-2xl cursor-pointer transition-all duration-300 hover:shadow-lg group ${
                      formData.learning_style === option.value
                        ? 'border-brand-600 bg-brand-50 shadow-lg ring-2 ring-brand-200'
                        : 'border-gray-200 hover:border-brand-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="learning_style"
                      value={option.value}
                      checked={formData.learning_style === option.value}
                      onChange={handleInputChange}
                      className="sr-only"
                    />
                    <div className="flex items-start space-x-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${option.gradient} text-white text-xl shadow-lg group-hover:scale-110 transition-transform`}>
                        {option.icon}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">
                          {option.label}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {option.description}
                        </p>
                      </div>
                    </div>
                    {formData.learning_style === option.value && (
                     <div className="absolute top-4 right-4 w-6 h-6 bg-brand-600 rounded-full flex items-center justify-center">
                       <span className="text-white text-sm">✓</span>
                     </div>
                   )}
                 </label>
               ))}
             </div>
             {errors.learning_style && (
               <p className="text-sm text-red-600">{errors.learning_style}</p>
             )}
           </div>

           {/* Knowledge Level */}
           <div className="space-y-4">
             <div className="flex items-center space-x-3 mb-4">
               <div className="w-8 h-8 bg-brand-100 rounded-lg flex items-center justify-center">
                 <span className="text-brand-600 font-bold">3</span>
               </div>
               <h3 className="text-xl font-semibold text-gray-900">Current Knowledge Level</h3>
             </div>
             
             <div className="bg-gray-50 rounded-2xl p-6">
               <input
                 type="range"
                 name="knowledge_level"
                 min="1"
                 max="5"
                 value={formData.knowledge_level}
                 onChange={handleInputChange}
                 className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                 style={{
                   background: `linear-gradient(to right, #8700e2 0%, #8700e2 ${((formData.knowledge_level - 1) / 4) * 100}%, #e5e7eb ${((formData.knowledge_level - 1) / 4) * 100}%, #e5e7eb 100%)`
                 }}
               />
               <div className="flex justify-between text-sm text-gray-500 mt-3">
                 <span>Beginner</span>
                 <span className="font-semibold text-brand-600 text-lg">
                   Level {formData.knowledge_level}
                 </span>
                 <span>Expert</span>
               </div>
               <div className="text-center mt-2">
                 <div className="inline-flex items-center px-4 py-2 bg-brand-100 text-brand-700 rounded-full text-sm font-medium">
                   {formData.knowledge_level === 1 && "🌱 Just starting out"}
                   {formData.knowledge_level === 2 && "📚 Some basic knowledge"}
                   {formData.knowledge_level === 3 && "⚡ Intermediate understanding"}
                   {formData.knowledge_level === 4 && "🚀 Advanced knowledge"}
                   {formData.knowledge_level === 5 && "🎯 Expert level"}
                 </div>
               </div>
             </div>
           </div>

           {/* Focus Areas */}
           {generatedFocusAreas.length > 0 && (
             <div className="space-y-4">
               <div className="flex items-center space-x-3 mb-4">
                 <div className="w-8 h-8 bg-brand-100 rounded-lg flex items-center justify-center">
                   <span className="text-brand-600 font-bold">4</span>
                 </div>
                 <h3 className="text-xl font-semibold text-gray-900">Focus Areas (Optional)</h3>
               </div>
               
               <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                 {generatedFocusAreas.map((area, index) => (
                   <label
                     key={index}
                     className={`flex items-center space-x-3 p-4 border-2 rounded-xl cursor-pointer transition-all duration-300 hover:shadow-md ${
                       formData.focus_areas.includes(area)
                         ? 'border-brand-600 bg-brand-50 shadow-md'
                         : 'border-gray-200 hover:border-brand-300'
                     }`}
                   >
                     <input
                       type="checkbox"
                       checked={formData.focus_areas.includes(area)}
                       onChange={() => handleFocusAreaToggle(area)}
                       className="h-5 w-5 text-brand-600 focus:ring-brand-500 border-gray-300 rounded"
                     />
                     <span className="text-sm font-medium text-gray-700 capitalize">
                       {area}
                     </span>
                   </label>
                 ))}
               </div>
               
               <div className="p-4 bg-gradient-to-r from-blue-50 to-brand-50 border border-blue-200 rounded-xl">
                 <div className="flex items-center space-x-2 mb-2">
                   <span className="text-blue-600">🤖</span>
                   <span className="text-blue-800 font-medium">AI Generated Focus Areas</span>
                 </div>
                 <p className="text-blue-700 text-sm">
                   These focus areas were automatically generated based on your subject. Select the ones you'd like to emphasize in your learning path.
                 </p>
               </div>
               
               {formData.focus_areas.length > 0 && (
                 <div className="p-4 bg-brand-50 rounded-xl border border-brand-200">
                   <h4 className="font-medium text-brand-900 mb-2">Selected focus areas:</h4>
                   <div className="flex flex-wrap gap-2">
                     {formData.focus_areas.map((area, index) => (
                       <span
                         key={index}
                         className="inline-flex items-center px-3 py-1 bg-brand-600 text-white rounded-full text-sm font-medium"
                       >
                         {area}
                         <button
                           type="button"
                           onClick={() => handleFocusAreaToggle(area)}
                           className="ml-2 hover:bg-brand-700 rounded-full p-0.5"
                         >
                           ×
                         </button>
                       </span>
                     ))}
                   </div>
                 </div>
               )}
             </div>
           )}

           {/* What happens next section */}
           <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6">
             <div className="flex items-start space-x-4">
               <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center text-white text-2xl">
                 🚀
               </div>
               <div>
                 <h4 className="text-lg font-semibold text-gray-900 mb-3">
                   What happens when you generate?
                 </h4>
                 <div className="space-y-2 text-sm text-gray-700">
                   <div className="flex items-center space-x-2">
                     <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                     <span>AI creates a personalized assessment for <strong>{formData.subject || 'your subject'}</strong></span>
                   </div>
                   <div className="flex items-center space-x-2">
                     <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                     <span>Generate custom learning materials based on your style</span>
                   </div>
                   <div className="flex items-center space-x-2">
                     <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                     <span>Create adaptive content that adjusts to your progress</span>
                   </div>
                   <div className="flex items-center space-x-2">
                     <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                     <span>Access interactive exercises and real-world projects</span>
                   </div>
                 </div>
               </div>
             </div>
           </div>
         </CardContent>
       </Card>

       {/* Generate Button */}
       <div className="flex justify-center">
         <Button
           onClick={handleGenerate}
           loading={isLoading}
           disabled={!formData.subject || !formData.learning_style}
           className="px-12 py-4 text-lg font-semibold bg-gradient-to-r from-brand-primary to-brand-light hover:from-brand-700 hover:to-brand-800 text-white rounded-2xl shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
         >
           {isLoading ? (
             <>
               <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
               Generating Your Learning Path...
             </>
           ) : (
             <>
               <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
               </svg>
               Generate AI Learning Path
             </>
           )}
         </Button>
       </div>

       {/* Benefits Section */}
       <div className="grid md:grid-cols-3 gap-6 mt-12">
         {[
           {
             icon: '🎯',
             title: 'Personalized Content',
             description: 'AI analyzes your learning style and creates content specifically for you',
             color: 'from-blue-500 to-cyan-500'
           },
           {
             icon: '📊',
             title: 'Adaptive Learning',
             description: 'Your learning path adjusts based on your progress and performance',
             color: 'from-green-500 to-emerald-500'
           },
           {
             icon: '🏆',
             title: 'Real Results',
             description: 'Track your progress with detailed analytics and achievement systems',
             color: 'from-purple-500 to-violet-500'
           }
         ].map((benefit, index) => (
           <Card key={index} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-0 bg-white/80 backdrop-blur-sm">
             <CardContent className="p-6 text-center">
               <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br ${benefit.color} rounded-2xl mb-4 text-white text-2xl group-hover:scale-110 transition-transform`}>
                 {benefit.icon}
               </div>
               <h3 className="text-lg font-bold text-gray-900 mb-2">
                 {benefit.title}
               </h3>
               <p className="text-gray-600 text-sm leading-relaxed">
                 {benefit.description}
               </p>
             </CardContent>
           </Card>
         ))}
       </div>
     </div>
   </DashboardLayout>
 );
}