import json
import uuid
import time
import re
import sys
import os
from typing import List, Dict
from dataclasses import dataclass
import requests
from .models import QuizQuestion
import random
import threading
from tenacity import retry, stop_after_attempt, wait_exponential

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import MCP
from mcp_server.mongo_mcp import mongo_mcp

class EnhancedContentGeneratorAgent:
    """Enhanced AI Agent with MongoDB MCP caching and quiz pre-generation"""
    
    def __init__(self, gemini_api_key: str):
        from .content_generator import GeminiClient
        self.gemini = GeminiClient(gemini_api_key)
        self.agent_name = "EnhancedContentGenerator"
        self.system_context = """You are an expert educational content generator. 
        Your role is to create high-quality learning materials, quizzes, and analyze learning patterns for ANY subject."""
        
        print("✅ Enhanced Content Generator with MCP caching and quiz pre-generation initialized")
    
    def get_quiz_for_resource(self, resource_id: str, topic: str, difficulty: int, count: int = 3) -> List[QuizQuestion]:
        """Get quiz questions for a resource with intelligent caching and pre-generation"""
        
        try:
            print(f"📝 Getting quiz for resource {resource_id}: {topic} (difficulty: {difficulty})")
            
            # Step 1: Check if we have cached quiz for this specific resource
            cached_resource_quiz = mongo_mcp.get_quiz_for_resource(resource_id, count)
            
            if cached_resource_quiz:
                print(f"✅ Found cached quiz for resource {resource_id}")
                return self._convert_to_quiz_questions(cached_resource_quiz, topic, difficulty)
            
            # Step 2: Check if we have cached quiz for this topic/difficulty combination
            cached_topic_quiz = mongo_mcp.get_cached_quiz_questions(topic, difficulty, count)
            
            if cached_topic_quiz:
                print(f"✅ Found cached quiz for topic {topic}")
                # Cache this for the specific resource too
                mongo_mcp.cache_quiz_for_resource(resource_id, topic, difficulty, cached_topic_quiz[:count])
                return self._convert_to_quiz_questions(cached_topic_quiz[:count], topic, difficulty)
            
            # Step 3: Generate new quiz with AI (this should be rare after initial caching)
            print(f"🤖 Generating new quiz for {topic} (this may take a moment)")
            ai_questions = self._generate_ai_questions_with_retries(topic, difficulty, count)
            
            if ai_questions:
                # Cache both for topic and specific resource
                question_dicts = [self._question_to_dict(q) for q in ai_questions]
                mongo_mcp.cache_quiz_questions(topic, difficulty, question_dicts)
                mongo_mcp.cache_quiz_for_resource(resource_id, topic, difficulty, question_dicts)
                
                print(f"✅ Generated and cached {len(ai_questions)} questions")
                return ai_questions
            
            # If all fails, this should never happen with proper pre-generation
            raise Exception("Unable to generate quiz questions - please try again later")
            
        except Exception as e:
            print(f"❌ Error getting quiz for resource: {e}")
            raise Exception(f"Failed to get quiz for resource: {e}")
    
    def pre_generate_quiz_for_resource(self, resource_id: str, topic: str, difficulty: int):
        """Pre-generate quiz questions for a resource in background"""
        
        def background_generation():
            try:
                print(f"🔄 Pre-generating quiz for resource {resource_id}: {topic}")
                
                # Check if already cached
                existing_quiz = mongo_mcp.get_quiz_for_resource(resource_id, 5)
                if existing_quiz:
                    print(f"✅ Quiz already cached for resource {resource_id}")
                    return
                
                # Generate with longer wait to avoid rate limiting
                time.sleep(5)  # Longer delay for background generation
                
                ai_questions = self._generate_ai_questions_with_retries(topic, difficulty, 5)
                
                if ai_questions:
                    question_dicts = [self._question_to_dict(q) for q in ai_questions]
                    mongo_mcp.cache_quiz_for_resource(resource_id, topic, difficulty, question_dicts)
                    print(f"✅ Pre-generated and cached {len(ai_questions)} questions for resource {resource_id}")
                
            except Exception as e:
                print(f"❌ Background quiz generation failed for {resource_id}: {e}")
        
        # Run in background thread
        thread = threading.Thread(target=background_generation)
        thread.daemon = True
        thread.start()
    
    def generate_quiz_questions(self, topic: str, difficulty: int, count: int = 5) -> List[QuizQuestion]:
        """Generate quiz questions with MCP caching (used for pretests)"""
        
        try:
            print(f"🎯 Generating {count} questions for topic: {topic}, difficulty: {difficulty}/5")
            
            # Check MCP cache first
            cached_questions = mongo_mcp.get_cached_quiz_questions(topic, difficulty, count)
            
            if cached_questions:
                return self._convert_to_quiz_questions(cached_questions, topic, difficulty)
            
            # Generate with AI
            ai_questions = self._generate_ai_questions_with_retries(topic, difficulty, count)
            if ai_questions:
                # Cache the results
                mongo_mcp.cache_quiz_questions(topic, difficulty, [self._question_to_dict(q) for q in ai_questions])
                return ai_questions
            
            # If AI fails, raise exception
            raise Exception("Failed to generate quiz questions")
            
        except Exception as e:
            print(f"❌ Error in enhanced quiz generation: {e}")
            raise Exception(f"Failed to generate quiz questions for {topic}: {e}")
    
    def generate_custom_focus_areas(self, subject: str) -> List[str]:
        """Generate custom focus areas with MCP caching"""
        
        try:
            print(f"🎯 Generating focus areas for subject: {subject}")
            
            # Check cache first
            cached_areas = mongo_mcp.get_cached_focus_areas(subject)
            if cached_areas:
                return cached_areas
            
            # Generate with AI
            ai_areas = self._generate_ai_focus_areas(subject)
            if ai_areas:
                mongo_mcp.cache_focus_areas(subject, ai_areas)
                return ai_areas
            
            # If AI fails, raise exception
            raise Exception("Failed to generate focus areas")
            
        except Exception as e:
            print(f"❌ Error generating focus areas: {e}")
            raise Exception(f"Failed to generate focus areas for {subject}: {e}")
    
    def _generate_ai_questions_with_retries(self, topic: str, difficulty: int, count: int) -> List[QuizQuestion]:
        """Generate questions using AI with exponential backoff and retries"""
        
        max_retries = 3
        base_delay = 5  # Start with 5 second delay
        
        for attempt in range(max_retries):
            try:
                if attempt > 0:
                    # Exponential backoff: 5s, 15s, 45s
                    delay = base_delay * (3 ** attempt)
                    print(f"⏳ Retry attempt {attempt + 1}/{max_retries}, waiting {delay} seconds...")
                    time.sleep(delay)
                else:
                    # Initial delay to prevent rate limiting
                    time.sleep(2)
                
                prompt = f"""Create exactly {count} multiple choice questions about "{topic}" at difficulty level {difficulty} out of 5.

Return ONLY a valid JSON array. Each question must have exactly 4 options.

Example format:
[{{"question": "What is X?", "options": ["Option A", "Option B", "Option C", "Option D"], "correct_answer": "Option A", "topic": "{topic}"}}]

Generate {count} questions for {topic} now. Return ONLY the JSON array:"""
                
                response_text = self.gemini.generate(prompt, max_tokens=2048)
                
                if response_text:
                    json_content = self._robust_json_extraction(response_text)
                    questions_data = json.loads(json_content)
                    
                    if isinstance(questions_data, list) and len(questions_data) >= count:
                        questions = []
                        for q_data in questions_data[:count]:
                            if all(field in q_data for field in ['question', 'options', 'correct_answer']):
                                # Ensure correct answer is in options
                                options = q_data['options'][:4]
                                correct_answer = q_data['correct_answer']
                                
                                if correct_answer not in options:
                                    # Replace first option with correct answer
                                    options[0] = correct_answer
                                
                                question = QuizQuestion(
                                    id=str(uuid.uuid4()),
                                    question=q_data['question'],
                                    options=options,
                                    correct_answer=correct_answer,
                                    topic=q_data.get('topic', topic),
                                    difficulty_level=difficulty,
                                    resource_id=""
                                )
                                questions.append(question)
                        
                        if len(questions) >= count:
                            print(f"✅ Successfully generated {len(questions)} questions on attempt {attempt + 1}")
                            return questions[:count]
                
                print(f"⚠️ Attempt {attempt + 1} failed to generate sufficient questions")
                
            except Exception as e:
                print(f"❌ AI question generation attempt {attempt + 1} failed: {e}")
                if attempt == max_retries - 1:
                    raise Exception(f"Failed to generate questions after {max_retries} attempts: {e}")
        
        raise Exception("Failed to generate valid questions after all retry attempts")
    
    def _generate_ai_focus_areas(self, subject: str) -> List[str]:
        """Generate focus areas using AI with robust JSON handling"""
        
        try:
            time.sleep(3)  # Rate limiting
            
            prompt = f"""Generate exactly 6 key focus areas for the subject "{subject}".

Return ONLY a JSON array of strings. Each area should be 1-3 words.

Example: ["area1", "area2", "area3", "area4", "area5", "area6"]

Generate focus areas for "{subject}" now. Return ONLY the JSON array:"""
            
            response = self.gemini.generate(prompt, max_tokens=300)
            
            if response:
                print(f"🔍 Raw focus areas response: {response[:200]}...")
                
                # Clean and extract JSON with robust handling
                cleaned_response = self._robust_json_extraction(response)
                print(f"🧹 Cleaned response: {cleaned_response}")
                
                areas = json.loads(cleaned_response)
                
                if isinstance(areas, list) and len(areas) >= 5:
                    # Clean and validate each area
                    valid_areas = []
                    for area in areas:
                        if isinstance(area, str) and area.strip():
                            clean_area = area.strip().lower()
                            # Remove any remaining problematic characters
                            clean_area = re.sub(r'[^\w\s-]', '', clean_area)
                            if clean_area and len(clean_area) <= 50:
                                valid_areas.append(clean_area)
                    
                    if len(valid_areas) >= 5:
                        return valid_areas[:8]  # Return max 8 areas
                
                raise Exception("Failed to generate valid focus areas from AI response")
            
            raise Exception("Empty response from AI")
            
        except json.JSONDecodeError as e:
            print(f"❌ JSON decode error in focus areas: {e}")
            raise Exception(f"AI response format error: {e}")
        except Exception as e:
            print(f"❌ AI focus area generation failed: {e}")
            raise Exception(f"AI focus area generation failed: {e}")

    def _robust_json_extraction(self, response: str) -> str:
        """Robust JSON extraction with comprehensive cleanup"""
        
        if not response or not response.strip():
            raise ValueError("Empty response")
        
        print(f"🔍 Original response length: {len(response)}")
        
        # Remove markdown formatting
        response = re.sub(r'```json\s*', '', response, flags=re.IGNORECASE)
        response = re.sub(r'```\s*', '', response)
        response = response.strip()
        
        # Find JSON array or object
        json_start = -1
        json_end = -1
        
        # Look for array first
        array_start = response.find('[')
        array_end = response.rfind(']')
        
        # Look for object
        obj_start = response.find('{')
        obj_end = response.rfind('}')
        
        # Prefer array over object
        if array_start != -1 and array_end != -1 and array_start < array_end:
            json_start = array_start
            json_end = array_end + 1
        elif obj_start != -1 and obj_end != -1 and obj_start < obj_end:
            json_start = obj_start
            json_end = obj_end + 1
        else:
            raise ValueError("No valid JSON structure found")
        
        json_content = response[json_start:json_end]
        
        # Comprehensive cleanup
        json_content = self._comprehensive_json_cleanup(json_content)
        
        print(f"🧹 Final JSON length: {len(json_content)}")
        return json_content
    
    def _comprehensive_json_cleanup(self, content: str) -> str:
        """Comprehensive JSON cleanup to handle all escape issues"""
        
        # Step 1: Remove control characters except \n, \r, \t
        content = ''.join(char for char in content if ord(char) >= 32 or char in '\n\r\t')
        
        # Step 2: Fix escape sequences - only keep valid JSON escapes
        # Valid JSON escapes: \" \\ \/ \b \f \n \r \t \uXXXX
        def fix_escapes(text):
            # Replace problematic escapes with the character itself
            # Keep only valid JSON escape sequences
            result = ""
            i = 0
            while i < len(text):
                if text[i] == '\\' and i + 1 < len(text):
                    next_char = text[i + 1]
                    if next_char in '"\\/:bfnrt':
                        # Valid escape, keep it
                        result += text[i:i+2]
                        i += 2
                    elif next_char == 'u' and i + 5 < len(text):
                        # Unicode escape, keep it
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
        
        content = fix_escapes(content)
        
        # Step 3: Handle actual newlines in string values
        # Split by quotes to identify string values vs structure
        parts = content.split('"')
        for i in range(1, len(parts), 2):  # Every odd index is inside quotes
            # Replace actual newlines with escaped newlines
            parts[i] = parts[i].replace('\n', '\\n')
            parts[i] = parts[i].replace('\r', '\\r')
            parts[i] = parts[i].replace('\t', '\\t')
        
        content = '"'.join(parts)
        
        # Step 4: Fix trailing commas
        content = re.sub(r',(\s*[}\]])', r'\1', content)
        
        # Step 5: Clean up whitespace
        content = re.sub(r'\s+', ' ', content)
        
        return content.strip()

    def _convert_to_quiz_questions(self, cached_questions: List[Dict], topic: str, difficulty: int) -> List[QuizQuestion]:
        """Convert cached questions to QuizQuestion objects"""
        
        questions = []
        for q_data in cached_questions:
            question = QuizQuestion(
                id=q_data.get('id', str(uuid.uuid4())),
                question=q_data['question'],
                options=q_data['options'],
                correct_answer=q_data['correct_answer'],
                topic=q_data.get('topic', topic),
                difficulty_level=q_data.get('difficulty_level', difficulty),
                resource_id=q_data.get('resource_id', "")
            )
            questions.append(question)
        
        return questions
    
    def _question_to_dict(self, question: QuizQuestion) -> Dict:
        """Convert QuizQuestion to dict for caching"""
        return {
            'id': question.id,
            'question': question.question,
            'options': question.options,
            'correct_answer': question.correct_answer,
            'topic': question.topic,
            'difficulty_level': question.difficulty_level,
            'resource_id': question.resource_id
        }