# backend/mcp_server/mongo_mcp.py
import json
import asyncio
from typing import Dict, Any, List, Optional
from pymongo import MongoClient
from datetime import datetime, timedelta
import os
import uuid
from dotenv import load_dotenv

load_dotenv()

class MongoMCP:
    """MongoDB MCP Server for caching educational content with AI pre-generation"""
    
    def __init__(self):
        self.client = MongoClient(os.getenv('MONGODB_URI', 'mongodb://localhost:27017/'))
        self.db = self.client.personalized_tutor
        
        # Collections for caching
        self.quiz_cache = self.db.quiz_cache
        self.feedback_cache = self.db.feedback_cache
        self.content_cache = self.db.content_cache
        self.topic_sequences_cache = self.db.topic_sequences_cache
        self.focus_areas_cache = self.db.focus_areas_cache
        self.resource_quizzes = self.db.resource_quizzes  # New collection for resource-specific quizzes
        
        print("✅ MongoDB MCP Server initialized")
    
    def get_quiz_for_resource(self, resource_id: str, count: int = 3) -> Optional[List[Dict]]:
        """Get pre-generated quiz questions for a specific resource"""
        try:
            quiz_doc = self.resource_quizzes.find_one({
                'resource_id': resource_id,
                'question_count': {'$gte': count}
            })
            
            if quiz_doc and self._is_cache_fresh(quiz_doc['created_at'], hours=168):  # 1 week cache
                questions = quiz_doc['questions'][:count]
                print(f"✅ Retrieved {len(questions)} cached quiz questions for resource {resource_id}")
                
                # Increment usage count
                self.resource_quizzes.update_one(
                    {'resource_id': resource_id},
                    {'$inc': {'usage_count': 1}}
                )
                
                return questions
            
            return None
            
        except Exception as e:
            print(f"❌ Error getting quiz for resource: {e}")
            return None
    
    def cache_quiz_for_resource(self, resource_id: str, topic: str, difficulty: int, questions: List[Dict]):
        """Cache quiz questions for a specific resource"""
        try:
            quiz_doc = {
                'resource_id': resource_id,
                'topic': topic.lower(),
                'difficulty': difficulty,
                'question_count': len(questions),
                'questions': questions,
                'created_at': datetime.utcnow(),
                'usage_count': 0,
                'quiz_id': str(uuid.uuid4())
            }
            
            # Update or insert
            self.resource_quizzes.update_one(
                {'resource_id': resource_id},
                {'$set': quiz_doc},
                upsert=True
            )
            
            print(f"✅ Cached {len(questions)} quiz questions for resource {resource_id}")
            
        except Exception as e:
            print(f"❌ Error caching quiz for resource: {e}")
    
    def get_cached_quiz_questions(self, topic: str, difficulty: int, count: int = 5) -> Optional[List[Dict]]:
        """Get cached quiz questions by topic and difficulty"""
        try:
            cached = self.quiz_cache.find_one({
                'topic': topic.lower(),
                'difficulty': difficulty,
                'count': {'$gte': count}
            })
            
            if cached and self._is_cache_fresh(cached['created_at'], hours=72):  # 3 days cache
                questions = cached['questions'][:count]
                print(f"✅ Retrieved {len(questions)} cached quiz questions for {topic}")
                
                # Increment usage count
                self.quiz_cache.update_one(
                    {'topic': topic.lower(), 'difficulty': difficulty},
                    {'$inc': {'usage_count': 1}}
                )
                
                return questions
            
            return None
            
        except Exception as e:
            print(f"❌ Error getting cached quiz questions: {e}")
            return None
    
    def cache_quiz_questions(self, topic: str, difficulty: int, questions: List[Dict]):
        """Cache quiz questions by topic and difficulty"""
        try:
            cache_doc = {
                'topic': topic.lower(),
                'difficulty': difficulty,
                'count': len(questions),
                'questions': questions,
                'created_at': datetime.utcnow(),
                'usage_count': 0
            }
            
            self.quiz_cache.update_one(
                {'topic': topic.lower(), 'difficulty': difficulty},
                {'$set': cache_doc},
                upsert=True
            )
            
            print(f"✅ Cached {len(questions)} quiz questions for {topic}")
            
        except Exception as e:
            print(f"❌ Error caching quiz questions: {e}")
    
    def get_cached_feedback(self, question_text: str, user_answer: str, correct_answer: str) -> Optional[Dict]:
        """Get cached feedback"""
        try:
            scenario_hash = hash(f"{question_text[:50]}{user_answer}{correct_answer}".lower())
            
            cached = self.feedback_cache.find_one({
                'scenario_hash': scenario_hash
            })
            
            if cached and self._is_cache_fresh(cached['created_at'], hours=168):
                print(f"✅ Retrieved cached feedback")
                
                # Increment usage count
                self.feedback_cache.update_one(
                    {'scenario_hash': scenario_hash},
                    {'$inc': {'usage_count': 1}}
                )
                
                return cached['feedback']
            
            return None
            
        except Exception as e:
            print(f"❌ Error getting cached feedback: {e}")
            return None
    
    def cache_feedback(self, question_text: str, user_answer: str, correct_answer: str, feedback: Dict):
        """Cache feedback"""
        try:
            scenario_hash = hash(f"{question_text[:50]}{user_answer}{correct_answer}".lower())
            
            cache_doc = {
                'scenario_hash': scenario_hash,
                'question_snippet': question_text[:100],
                'user_answer': user_answer,
                'correct_answer': correct_answer,
                'feedback': feedback,
                'created_at': datetime.utcnow(),
                'usage_count': 0
            }
            
            self.feedback_cache.update_one(
                {'scenario_hash': scenario_hash},
                {'$set': cache_doc},
                upsert=True
            )
            
            print(f"✅ Cached feedback")
            
        except Exception as e:
            print(f"❌ Error caching feedback: {e}")
    
    def get_cached_focus_areas(self, subject: str) -> Optional[List[str]]:
        """Get cached focus areas"""
        try:
            cached = self.focus_areas_cache.find_one({
                'subject': subject.lower()
            })
            
            if cached and self._is_cache_fresh(cached['created_at'], hours=720):
                print(f"✅ Retrieved cached focus areas for {subject}")
                
                # Increment usage count
                self.focus_areas_cache.update_one(
                    {'subject': subject.lower()},
                    {'$inc': {'usage_count': 1}}
                )
                
                return cached['focus_areas']
            
            return None
            
        except Exception as e:
            print(f"❌ Error getting cached focus areas: {e}")
            return None
    
    def cache_focus_areas(self, subject: str, focus_areas: List[str]):
        """Cache focus areas"""
        try:
            cache_doc = {
                'subject': subject.lower(),
                'focus_areas': focus_areas,
                'created_at': datetime.utcnow(),
                'usage_count': 0
            }
            
            self.focus_areas_cache.update_one(
                {'subject': subject.lower()},
                {'$set': cache_doc},
                upsert=True
            )
            
            print(f"✅ Cached {len(focus_areas)} focus areas for {subject}")
            
        except Exception as e:
            print(f"❌ Error caching focus areas: {e}")
    
    def get_cache_stats(self) -> Dict[str, Any]:
        """Get comprehensive cache statistics"""
        try:
            stats = {
                'quiz_questions': self.quiz_cache.count_documents({}),
                'resource_quizzes': self.resource_quizzes.count_documents({}),
                'feedback_entries': self.feedback_cache.count_documents({}),
                'focus_areas': self.focus_areas_cache.count_documents({}),
                'topic_sequences': self.topic_sequences_cache.count_documents({}),
                'total_cache_size': (
                    self.quiz_cache.count_documents({}) +
                    self.resource_quizzes.count_documents({}) +
                    self.feedback_cache.count_documents({}) +
                    self.focus_areas_cache.count_documents({}) +
                    self.topic_sequences_cache.count_documents({})
                ),
                'cache_utilization': {
                    'quiz_cache_hits': self._get_total_usage('quiz_cache'),
                    'resource_quiz_hits': self._get_total_usage('resource_quizzes'),
                    'feedback_hits': self._get_total_usage('feedback_cache'),
                    'focus_areas_hits': self._get_total_usage('focus_areas_cache')
                }
            }
            
            return stats
            
        except Exception as e:
            print(f"❌ Error getting cache stats: {e}")
            return {}
    
    def _get_total_usage(self, collection_name: str) -> int:
        """Get total usage count for a collection"""
        try:
            collection = getattr(self, collection_name)
            pipeline = [
                {'$group': {'_id': None, 'total_usage': {'$sum': '$usage_count'}}}
            ]
            result = list(collection.aggregate(pipeline))
            return result[0]['total_usage'] if result else 0
        except Exception:
            return 0
    
    def _is_cache_fresh(self, created_at: datetime, hours: int) -> bool:
        """Check if cache is fresh"""
        expiry_time = created_at + timedelta(hours=hours)
        return datetime.utcnow() < expiry_time
    
    def clear_expired_cache(self):
        """Clear expired cache entries"""
        try:
            now = datetime.utcnow()
            
            # Clear expired quiz questions (3 days)
            expired_quiz = now - timedelta(hours=72)
            deleted_quiz = self.quiz_cache.delete_many({'created_at': {'$lt': expired_quiz}})
            
            # Clear expired resource quizzes (1 week)
            expired_resource_quiz = now - timedelta(hours=168)
            deleted_resource = self.resource_quizzes.delete_many({'created_at': {'$lt': expired_resource_quiz}})
            
            # Clear expired feedback (1 week)
            expired_feedback = now - timedelta(hours=168)
            deleted_feedback = self.feedback_cache.delete_many({'created_at': {'$lt': expired_feedback}})
            
            print(f"🧹 Cleared expired cache: {deleted_quiz.deleted_count} quiz, {deleted_resource.deleted_count} resource quiz, {deleted_feedback.deleted_count} feedback entries")
            
        except Exception as e:
            print(f"❌ Error clearing expired cache: {e}")

# Global instance
mongo_mcp = MongoMCP()