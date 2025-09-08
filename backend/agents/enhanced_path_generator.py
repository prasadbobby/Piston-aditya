# backend/agents/enhanced_path_generator.py
import sys
import os
from typing import List
from datetime import datetime
import json
import re

# Add the backend directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from .content_generator import GeminiClient
from .learning_content_generator import LearningContentGenerator
from .models import LearnerProfile, LearningResource
from mcp_server.mongo_mcp import mongo_mcp

class EnhancedPathGeneratorAgent:
    """Enhanced Path Generator with quiz pre-generation"""
    
    def __init__(self, gemini_api_key: str):
        self.gemini = GeminiClient(gemini_api_key)
        self.content_generator = LearningContentGenerator(gemini_api_key)
        self.agent_name = "EnhancedPathGenerator"
        self.system_context = """You are an AI learning path optimization specialist. 
        Your role is to create optimal learning sequences based on learner profiles for ANY subject."""
        
        print("✅ Enhanced Path Generator with quiz pre-generation initialized")
        
    def generate_learning_path_with_content(self, learner_profile: LearnerProfile, db) -> List[str]:
        """Generate personalized learning path with content and pre-generate quizzes"""
        
        print(f"🛤️ Generating enhanced learning path for: {learner_profile.name}")
        print(f"Subject: {learner_profile.subject}, Style: {learner_profile.learning_style}")
        
        try:
            # Generate learning sequence topics using AI
            topics = self._generate_topic_sequence(learner_profile)
            
            all_resource_ids = []
            
            # Generate content for each topic
            for topic in topics:
                # Generate learning resources for this topic
                learning_contents = self.content_generator.generate_learning_sequence(
                    learner_profile=learner_profile,
                    topic=topic,
                    num_resources=2  # 2 resources per topic
                )
                
                # Save generated content to database and pre-generate quizzes
                for content in learning_contents:
                    resource_doc = {
                        'id': content.id,
                        'title': content.title,
                        'type': content.type,
                        'content': content.content,
                        'summary': content.summary,
                        'difficulty_level': content.difficulty_level,
                        'learning_style': content.learning_style,
                        'topic': content.topic,
                        'estimated_duration': content.estimated_duration,
                        'prerequisites': content.prerequisites,
                        'learning_objectives': content.learning_objectives,
                        'created_at': datetime.utcnow(),
                        'learner_id': learner_profile.id,
                        'status': 'ready',
                        'quiz_pre_generated': False  # Flag to track quiz generation
                    }
                    
                    # Insert into database
                    db.learning_resources.insert_one(resource_doc)
                    all_resource_ids.append(content.id)
                    
                    # Trigger background quiz pre-generation
                    self._trigger_quiz_pre_generation(content.id, content.topic, content.difficulty_level)
                    
                    print(f"✅ Generated resource: {content.title}")
            
            print(f"✅ Generated {len(all_resource_ids)} learning resources with quiz pre-generation")
            return all_resource_ids
            
        except Exception as e:
            print(f"❌ Error generating enhanced learning path: {e}")
            raise Exception(f"Failed to generate learning path: {e}")
    
    def _trigger_quiz_pre_generation(self, resource_id: str, topic: str, difficulty: int):
        """Trigger background quiz pre-generation for a resource"""
        
        try:
            # Import here to avoid circular import
            from .enhanced_content_generator import EnhancedContentGeneratorAgent
            
            # Create a new instance for background generation
            import threading
            
            def background_quiz_generation():
                try:
                    # Get Gemini API key from environment
                    import os
                    from dotenv import load_dotenv
                    load_dotenv()
                    
                    gemini_api_key = os.getenv('GEMINI_API_KEY')
                    if not gemini_api_key:
                        print(f"❌ No Gemini API key for quiz pre-generation")
                        return
                    
                    enhanced_agent = EnhancedContentGeneratorAgent(gemini_api_key)
                    enhanced_agent.pre_generate_quiz_for_resource(resource_id, topic, difficulty)
                    
                except Exception as e:
                    print(f"❌ Background quiz pre-generation failed for {resource_id}: {e}")
            
            thread = threading.Thread(target=background_quiz_generation)
            thread.daemon = True
            thread.start()
            
            print(f"🔄 Triggered quiz pre-generation for resource {resource_id}")
            
        except Exception as e:
            print(f"❌ Error triggering quiz pre-generation: {e}")
    
    def _generate_topic_sequence(self, learner_profile: LearnerProfile) -> List[str]:
        """Generate sequence of topics to cover based on learner profile"""
        
        try:
            prompt = f"""{self.system_context}

TASK: Create a logical sequence of learning topics for this learner.

LEARNER PROFILE:
- Subject: {learner_profile.subject}
- Knowledge Level: {learner_profile.knowledge_level}/5
- Weak Areas: {learner_profile.weak_areas}
- Learning Style: {learner_profile.learning_style}

REQUIREMENTS:
1. Create 4-5 progressive topics in {learner_profile.subject}
2. Start with difficulty appropriate for level {learner_profile.knowledge_level}
3. Focus on weak areas: {learner_profile.weak_areas}
4. Ensure logical progression from basic to advanced concepts
5. Each topic should build on the previous one

Return only a JSON array of topic names:
["Topic 1", "Topic 2", "Topic 3", "Topic 4", "Topic 5"]

Generate the topic sequence now:"""
            
            response = self.gemini.generate(prompt, max_tokens=500)
            
            # Extract JSON array from response
            json_match = re.search(r'\[.*?\]', response, re.DOTALL)
            if json_match:
                topics = json.loads(json_match.group())
                if isinstance(topics, list) and len(topics) >= 3:
                    return topics[:5]  # Limit to 5 topics
            
            raise Exception("Failed to generate topic sequence from Gemini")
            
        except Exception as e:
            print(f"❌ Error generating topic sequence: {e}")
            raise Exception(f"Failed to generate topic sequence: {e}")