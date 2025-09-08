# agents/orchestrator.py
import uuid
import threading
from datetime import datetime
from typing import Dict, Any, List
from dataclasses import asdict
from .content_generator import ContentGeneratorAgent
from .path_generator import PathGeneratorAgent
from .evaluator import EvaluatorAgent
from .models import LearnerProfile, LearningPath

class AgentOrchestrator:
    """Orchestrates all AI agents for coordinated learning experience"""
    
    def __init__(self, gemini_api_key: str):
        self.content_agent = ContentGeneratorAgent(gemini_api_key)
        self.path_agent = PathGeneratorAgent(gemini_api_key)
        self.evaluator_agent = EvaluatorAgent(gemini_api_key)
        print("✅ Initialized AI Agent Orchestrator with Gemini AI")
    
    def process_new_learner(self, profile_data: Dict, db) -> Dict[str, Any]:
        """Process new learner with AI-generated content only"""
        
        try:
            # Ensure knowledge_level is an integer
            knowledge_level = profile_data.get('knowledge_level', 1)
            if isinstance(knowledge_level, str):
                try:
                    knowledge_level = int(knowledge_level)
                except (ValueError, TypeError):
                    knowledge_level = 1
            
            # Ensure weak_areas is a list
            weak_areas = profile_data.get('weak_areas', [])
            if not isinstance(weak_areas, list):
                weak_areas = []
            
            # Handle custom subject properly
            subject = profile_data.get('subject', 'general')
            if profile_data.get('custom_subject'):
                subject = profile_data.get('custom_subject')
            
            print(f"🎯 Creating profile for subject: {subject}")
            
            # Create learner profile
            profile = LearnerProfile(
                id=str(uuid.uuid4()),
                name=str(profile_data['name']),
                learning_style=str(profile_data['learning_style']),
                knowledge_level=knowledge_level,
                subject=subject,
                weak_areas=weak_areas,
                created_at=datetime.utcnow()
            )
            
            # Save profile to database
            db.learner_profiles.insert_one(asdict(profile))
            print(f"✅ Created learner profile: {profile.id} for subject: {subject}")
            
            # Generate learning path with AI-generated content
            resource_ids = self.path_agent.generate_learning_path_with_content(profile, db)
            
            # Create learning path
            learning_path = LearningPath(
                id=str(uuid.uuid4()),
                learner_id=profile.id,
                resources=resource_ids,
                current_position=0,
                progress={},
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            
            # Save learning path
            db.learning_paths.insert_one(asdict(learning_path))
            print(f"✅ Created learning path: {learning_path.id}")
            
            return {
                'profile_id': profile.id,
                'path_id': learning_path.id,
                'total_resources': len(resource_ids),
                'status': 'completed'
            }
            
        except Exception as e:
            print(f"❌ Error in orchestrator: {e}")
            raise Exception(f"Failed to process learner: {e}")