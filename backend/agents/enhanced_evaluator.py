# backend/agents/enhanced_evaluator.py
import sys
import os
from typing import Dict, List, Any
from .models import QuizQuestion

# Add the backend directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from mcp_server.mongo_mcp import mongo_mcp

class EnhancedEvaluatorAgent:
    """Enhanced evaluator with MongoDB MCP caching"""
    
    def __init__(self, gemini_api_key: str):
        from .content_generator import GeminiClient
        self.gemini = GeminiClient(gemini_api_key)
        self.agent_name = "EnhancedEvaluator"
        
        print("✅ Enhanced Evaluator with MCP caching initialized")
    
    def evaluate_quiz_response(self, question: QuizQuestion, user_answer: str) -> Dict[str, Any]:
        """Evaluate quiz response with caching"""
        
        is_correct = user_answer.strip().lower() == question.correct_answer.strip().lower()
        
        try:
            # Try to get cached feedback
            cached_feedback = mongo_mcp.get_cached_feedback(
                question.question, user_answer, question.correct_answer
            )
            
            if cached_feedback:
                return cached_feedback
            
            # Generate new feedback with AI
            feedback_result = self._generate_ai_feedback(question, user_answer, is_correct)
            
            # Cache the feedback
            mongo_mcp.cache_feedback(
                question.question, user_answer, question.correct_answer, feedback_result
            )
            
            return feedback_result
            
        except Exception as e:
            print(f"❌ Error in enhanced evaluation: {e}")
            # Return basic feedback if everything fails
            return {
                'is_correct': is_correct,
                'feedback': f"Your answer is {'correct' if is_correct else 'incorrect'}. The correct answer is {question.correct_answer}.",
                'topic': question.topic,
                'score': 100 if is_correct else 0
            }
    
    def _generate_ai_feedback(self, question: QuizQuestion, user_answer: str, is_correct: bool) -> Dict[str, Any]:
        """Generate feedback using AI"""
        
        try:
            import time
            time.sleep(1)  # Rate limiting protection
            
            prompt = f"""Provide brief educational feedback for this quiz response:

Question: {question.question}
Correct Answer: {question.correct_answer}
User Answer: {user_answer}
Result: {'CORRECT' if is_correct else 'INCORRECT'}

Write 1-2 sentences of encouraging, educational feedback. Keep it brief and positive."""
            
            response = self.gemini.generate(prompt, max_tokens=150)
            feedback_text = response.strip() if response else f"Your answer is {'correct' if is_correct else 'incorrect'}."
            
            return {
                'is_correct': is_correct,
                'feedback': feedback_text,
                'topic': question.topic,
                'score': 100 if is_correct else 0
            }
            
        except Exception as e:
            print(f"❌ AI feedback generation failed: {e}")
            raise Exception(f"AI feedback generation failed: {e}")
    
    def generate_overall_feedback(self, quiz_results: List[Dict]) -> Dict[str, Any]:
        """Generate overall feedback"""
        
        if not quiz_results:
            return {
                'average_score': 0,
                'total_questions': 0,
                'correct_answers': 0,
                'weak_topics': [],
                'strong_topics': [],
                'recommendation': 'No quiz data available'
            }
        
        # Calculate metrics
        total_score = sum(r.get('score', 0) for r in quiz_results)
        average_score = total_score / len(quiz_results)
        
        weak_topics = [r['topic'] for r in quiz_results if not r.get('is_correct', False)]
        strong_topics = [r['topic'] for r in quiz_results if r.get('is_correct', False)]
        
        # Generate recommendation
        if average_score >= 90:
            recommendation = "Excellent work! You have a strong understanding of these concepts."
        elif average_score >= 70:
            recommendation = "Good job! You're doing well. Keep practicing to improve further."
        elif average_score >= 50:
            recommendation = "You're making progress! Focus on reviewing the concepts you missed."
        else:
            recommendation = "Keep practicing! Review the fundamentals and try again."
        
        return {
            'average_score': average_score,
            'total_questions': len(quiz_results),
            'correct_answers': len(strong_topics),
            'weak_topics': list(set(weak_topics)),
            'strong_topics': list(set(strong_topics)),
            'recommendation': recommendation
        }