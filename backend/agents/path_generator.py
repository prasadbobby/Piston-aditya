# agents/path_generator.py
from typing import List
from datetime import datetime
import json
import re
from .content_generator import GeminiClient
from .learning_content_generator import LearningContentGenerator
from .models import LearnerProfile, LearningResource

class PathGeneratorAgent:
    """AI Agent for generating personalized learning paths with dynamic content"""
    
    def __init__(self, gemini_api_key: str):
        self.gemini = GeminiClient(gemini_api_key)
        self.content_generator = LearningContentGenerator(gemini_api_key)
        self.agent_name = "PathGenerator"
        self.system_context = """You are an AI learning path optimization specialist. 
        Your role is to create optimal learning sequences based on learner profiles for ANY subject."""
        
    def generate_learning_path_with_content(self, learner_profile: LearnerProfile, db) -> List[str]:
        """Generate personalized learning path with dynamically created content"""
        
        print(f"🛤️ Generating learning path with content for: {learner_profile.name}")
        print(f"Subject: {learner_profile.subject}, Style: {learner_profile.learning_style}")
        print(f"Knowledge Level: {learner_profile.knowledge_level}, Weak Areas: {learner_profile.weak_areas}")
        
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
                    num_resources=2  # 2 resources per topic for faster generation
                )
                
                # Save generated content to database
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
                        'status': 'ready'
                    }
                    
                    # Insert into database
                    db.learning_resources.insert_one(resource_doc)
                    all_resource_ids.append(content.id)
                    
                    print(f"✅ Generated resource: {content.title}")
            
            print(f"✅ Generated {len(all_resource_ids)} learning resources")
            return all_resource_ids
            
        except Exception as e:
            print(f"❌ Error generating learning path with content: {e}")
            raise Exception(f"Failed to generate learning path: {e}")
    
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

    def generate_learning_path(self, learner_profile: LearnerProfile, available_resources: List[LearningResource]) -> List[str]:
        """Legacy method for compatibility - delegates to new method"""
        print("⚠️ Using legacy generate_learning_path method")
        return []  # This won't be used in the new system