# agents/learning_content_generator.py
import json
import uuid
import re
import sys
import os
from typing import List, Dict, Any

# Add the parent directory to the path so we can import services
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from .content_generator import GeminiClient
from .models import LearningContent

# Import YouTube service
try:
    from services.youtube_service import YouTubeService
except ImportError:
    print("⚠️ YouTube service not available, videos will be disabled")
    YouTubeService = None

class LearningContentGenerator:
    """AI Agent for generating actual learning content using Gemini AI"""
    
    def __init__(self, gemini_api_key: str):
        self.gemini = GeminiClient(gemini_api_key)
        self.youtube_service = YouTubeService() if YouTubeService else None
        self.agent_name = "LearningContentGenerator"
        self.system_context = """You are an expert educational content creator and curriculum designer. 
        Your role is to create engaging, comprehensive learning materials tailored to specific learning styles and difficulty levels for ANY subject."""
    
    def generate_learning_sequence(self, learner_profile, topic: str, num_resources: int = 5) -> List[LearningContent]:
        """Generate a complete learning sequence for a topic"""
        
        print(f"📚 Generating learning sequence for {topic} - {learner_profile.learning_style} learner")
        
        # Define resource types based on learning style
        resource_types = self._get_resource_types_for_style(learner_profile.learning_style)
        
        learning_contents = []
        
        for i in range(num_resources):
            difficulty = min(5, learner_profile.knowledge_level + (i // 2))  # Gradual progression
            resource_type = resource_types[i % len(resource_types)]
            
            content = self._generate_single_content(
                topic=topic,
                resource_type=resource_type,
                difficulty=difficulty,
                learning_style=learner_profile.learning_style,
                sequence_position=i + 1,
                total_sequence=num_resources
            )
            
            if content:
                learning_contents.append(content)
        
        return learning_contents
    
    def _get_resource_types_for_style(self, learning_style: str) -> List[str]:
        """Get preferred resource types for learning style"""
        
        style_preferences = {
            'visual': ['infographic_lesson', 'diagram_tutorial', 'visual_guide', 'chart_explanation'],
            'auditory': ['audio_lesson', 'discussion_guide', 'verbal_explanation', 'story_based_lesson'],
            'reading': ['text_lesson', 'article', 'step_by_step_guide', 'detailed_explanation'],
            'kinesthetic': ['interactive_exercise', 'hands_on_activity', 'practice_problems', 'simulation']
        }
        
        return style_preferences.get(learning_style, ['lesson', 'tutorial', 'guide', 'practice'])
    
    def _generate_single_content(self, topic: str, resource_type: str, difficulty: int, learning_style: str, sequence_position: int, total_sequence: int) -> LearningContent:
        """Generate a single piece of learning content using Gemini AI"""
        
        try:
            prompt = f"""Create educational content about "{topic}" for a {learning_style} learner.

Return ONLY a valid JSON object with this structure:
{{"title": "Brief title", "content": "Educational content", "summary": "Brief summary", "learning_objectives": ["objective1", "objective2"], "estimated_duration": 20}}

Topic: {topic}
Difficulty: {difficulty}/5
Position: {sequence_position} of {total_sequence}

Generate the JSON object now:"""

            response = self.gemini.generate(prompt, max_tokens=3000)
            
            # Clean and parse JSON response
            json_content = self._robust_extract_json(response)
            
            if json_content:
                try:
                    content_data = json.loads(json_content)
                except json.JSONDecodeError as e:
                    print(f"❌ JSON decode error: {e}")
                    print(f"❌ Failed JSON content: {json_content}")
                    raise Exception(f"Invalid JSON from Gemini: {e}")
                
                learning_content = LearningContent(
                    id=str(uuid.uuid4()),
                    title=content_data.get('title', f'{topic} - Part {sequence_position}'),
                    type=resource_type,
                    content=content_data.get('content', f'Content about {topic}'),
                    summary=content_data.get('summary', f'Learn about {topic}'),
                    difficulty_level=difficulty,
                    learning_style=learning_style,
                    topic=topic,
                    estimated_duration=content_data.get('estimated_duration', 20),
                    prerequisites=[],
                    learning_objectives=content_data.get('learning_objectives', [f'Understand {topic}']),
                    youtube_videos=[]
                )
                
                # Add YouTube videos for visual learners
                if learning_style == 'visual' and self.youtube_service:
                    print(f"🎥 Searching YouTube videos for: {topic}")
                    try:
                        youtube_videos = self.youtube_service.search_videos(topic, max_results=3)
                        learning_content.youtube_videos = youtube_videos
                        print(f"📺 Added {len(youtube_videos)} YouTube videos")
                    except Exception as e:
                        print(f"⚠️ YouTube search failed: {e}")
                        learning_content.youtube_videos = []
                
                return learning_content
            else:
                raise Exception("Failed to extract JSON from Gemini response")
                
        except Exception as e:
            print(f"❌ Error generating content for {topic}: {e}")
            raise Exception(f"Failed to generate content for {topic}: {e}")

    def _robust_extract_json(self, response: str) -> str:
        """Robust JSON extraction with comprehensive cleanup"""
        
        if not response or not response.strip():
            return None
        
        # Remove markdown code blocks
        response = re.sub(r'```json\s*', '', response, flags=re.IGNORECASE)
        response = re.sub(r'```\s*', '', response)
        response = response.strip()
        
        # Find JSON object boundaries using brace matching
        start_idx = response.find('{')
        if start_idx == -1:
            return None
        
        # Find matching closing brace
        brace_count = 0
        end_idx = -1
        
        for i in range(start_idx, len(response)):
            if response[i] == '{':
                brace_count += 1
            elif response[i] == '}':
                brace_count -= 1
                if brace_count == 0:
                    end_idx = i
                    break
        
        if end_idx == -1:
            return None
        
        json_content = response[start_idx:end_idx + 1]
        
        # Comprehensive cleanup
        json_content = self._comprehensive_json_fix(json_content)
        
        return json_content
    
    def _comprehensive_json_fix(self, content: str) -> str:
        """Comprehensive JSON fixing with escape character handling"""
        
        # Remove control characters except essential ones
        content = ''.join(char for char in content if ord(char) >= 32 or char in '\n\r\t')
        
        # Fix escape sequences systematically
        def clean_escapes(text):
            result = ""
            i = 0
            while i < len(text):
                if text[i] == '\\' and i + 1 < len(text):
                    next_char = text[i + 1]
                    # Only keep valid JSON escape sequences
                    if next_char in '"\\/:bfnrt':
                        result += text[i:i+2]
                        i += 2
                    elif next_char == 'u' and i + 5 < len(text) and all(c in '0123456789abcdefABCDEF' for c in text[i+2:i+6]):
                        result += text[i:i+6]
                        i += 6
                    else:
                        # Invalid escape, just add the character
                        result += next_char
                        i += 2
                else:
                    result += text[i]
                    i += 1
            return result
        
        content = clean_escapes(content)
        
        # Handle newlines within string values
        # Split on quotes and only process content inside quotes
        parts = content.split('"')
        for i in range(1, len(parts), 2):  # Odd indices are string content
            parts[i] = parts[i].replace('\n', '\\n').replace('\r', '\\r').replace('\t', '\\t')
        
        content = '"'.join(parts)
        
        # Remove trailing commas before closing brackets/braces
        content = re.sub(r',(\s*[}\]])', r'\1', content)
        
        # Clean up excessive whitespace
        content = re.sub(r'\s+', ' ', content)
        
        return content.strip()