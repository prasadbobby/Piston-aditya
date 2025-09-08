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

    REQUIREMENTS: Return ONLY a valid JSON object with this exact structure:

    {{
    "title": "string",
    "content": "string", 
    "summary": "string",
    "learning_objectives": ["string1", "string2", "string3"],
    "estimated_duration": 20
    }}

    Topic: {topic}
    Learning Style: {learning_style}
    Difficulty: {difficulty}/5
    Position: {sequence_position} of {total_sequence}

    IMPORTANT: 
    - Return ONLY the JSON object
    - Use double quotes for all strings
    - No markdown, no backticks, no extra text
    - Keep content simple and clean
    - Estimated duration should be a number"""

            response = self.gemini.generate(prompt, max_tokens=3000)
            
            # Clean and parse JSON response
            json_content = self._extract_json_from_response(response)
            
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

    def _extract_json_from_response(self, response: str) -> str:
        """Extract JSON from Gemini response with robust error handling"""
        
        if not response:
            return None
        
        # Remove markdown code blocks
        response = re.sub(r'```json\s*', '', response, flags=re.IGNORECASE)
        response = re.sub(r'```\s*', '', response)
        response = response.strip()
        
        # Find JSON object boundaries
        start_idx = response.find('{')
        end_idx = response.rfind('}')
        
        if start_idx == -1 or end_idx == -1 or start_idx >= end_idx:
            return None
        
        json_content = response[start_idx:end_idx + 1]
        
        # Fix the JSON content
        json_content = self._fix_json_content(json_content)
        
        return json_content

    def _fix_json_content(self, content: str) -> str:
        """Fix JSON formatting issues"""
        
        # Replace actual newlines with escaped newlines in string values
        lines = content.split('\n')
        fixed_lines = []
        in_string = False
        escape_next = False
        
        for line in lines:
            if not fixed_lines:  # First line
                fixed_lines.append(line)
                continue
                
            # Check if we're inside a string value
            for char in line:
                if escape_next:
                    escape_next = False
                    continue
                if char == '\\':
                    escape_next = True
                    continue
                if char == '"' and not escape_next:
                    in_string = not in_string
            
            if in_string:
                # We're inside a string, so this newline should be escaped
                fixed_lines[-1] += '\\n' + line
            else:
                # We're not in a string, this is just JSON formatting
                fixed_lines.append(line)
        
        content = '\n'.join(fixed_lines)
        
        # Remove actual newlines within string values and replace with \n
        import re
        
        def replace_newlines_in_strings(match):
            string_content = match.group(1)
            # Replace actual newlines with \n
            string_content = string_content.replace('\n', '\\n')
            return f'"{string_content}"'
        
        # Find all string values and fix newlines
        content = re.sub(r'"([^"]*(?:\\.[^"]*)*)"', replace_newlines_in_strings, content, flags=re.DOTALL)
        
        # Clean up any remaining issues
        content = content.replace('\n', ' ')  # Remove remaining newlines
        content = re.sub(r'\s+', ' ', content)  # Normalize whitespace
        
        return content
    def _sanitize_json_content(self, content: str) -> str:
        """Sanitize JSON content to prevent parsing errors"""
        
        # Replace problematic characters
        content = content.replace('\n', '\\n')
        content = content.replace('\r', '\\r')
        content = content.replace('\t', '\\t')
        content = content.replace('\b', '\\b')
        content = content.replace('\f', '\\f')
        
        # Fix unescaped quotes in string values
        lines = content.split('\n')
        fixed_lines = []
        
        for line in lines:
            if ':' in line and '"' in line:
                # Simple approach to fix quotes in JSON values
                parts = line.split(':', 1)
                if len(parts) == 2:
                    key_part = parts[0]
                    value_part = parts[1].strip()
                    
                    # If it's a string value, escape internal quotes
                    if value_part.startswith('"') and not value_part.endswith('",') and not value_part.endswith('"'):
                        # Find the closing quote
                        closing_quote_idx = value_part.rfind('"')
                        if closing_quote_idx > 0:
                            string_content = value_part[1:closing_quote_idx]
                            rest = value_part[closing_quote_idx:]
                            # Escape quotes in the string content
                            string_content = string_content.replace('"', '\\"')
                            value_part = f'"{string_content}"{rest}'
                    
                    line = f"{key_part}:{value_part}"
            
            fixed_lines.append(line)
        
        return '\n'.join(fixed_lines)