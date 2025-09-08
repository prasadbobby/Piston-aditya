# agents/content_generator.py
import json
import uuid
import time
import re
from typing import List, Dict
from dataclasses import dataclass
import requests
from .models import QuizQuestion
import random
from tenacity import retry, stop_after_attempt, wait_exponential

class GeminiClient:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent'
        self.last_request_time = 0
        self.min_request_interval = 1.5  # Minimum 1.5 seconds between requests
        
    @retry(stop=stop_after_attempt(5), wait=wait_exponential(multiplier=2, min=4, max=60))
    def generate(self, prompt: str, max_tokens: int = 2048) -> str:
        """Generate text using Gemini AI API with rate limiting and retry logic"""
        try:
            # Rate limiting: ensure minimum interval between requests
            current_time = time.time()
            time_since_last = current_time - self.last_request_time
            if time_since_last < self.min_request_interval:
                sleep_time = self.min_request_interval - time_since_last
                print(f"⏱️ Rate limiting: sleeping for {sleep_time:.2f} seconds")
                time.sleep(sleep_time)
            
            url = f"{self.base_url}?key={self.api_key}"
            
            payload = {
                "contents": [
                    {
                        "parts": [
                            {
                                "text": prompt
                            }
                        ]
                    }
                ],
                "generationConfig": {
                    "temperature": 0.7,
                    "maxOutputTokens": max_tokens,
                    "topP": 0.8,
                    "topK": 40
                }
            }
            
            print(f"🤖 Sending request to Gemini AI...")
            response = requests.post(
                url, 
                json=payload, 
                headers={'Content-Type': 'application/json'},
                timeout=30
            )
            
            self.last_request_time = time.time()
            
            if response.status_code == 429:
                print(f"⚠️ Rate limit hit (429), retrying with exponential backoff...")
                raise requests.exceptions.RequestException("Rate limit exceeded")
            
            response.raise_for_status()
            
            result = response.json()
            
            if 'candidates' in result and len(result['candidates']) > 0:
                if 'content' in result['candidates'][0]:
                    if 'parts' in result['candidates'][0]['content']:
                        return result['candidates'][0]['content']['parts'][0]['text']
            
            print(f"❌ Unexpected Gemini response format: {result}")
            raise Exception("Invalid response format from Gemini")
            
        except requests.exceptions.RequestException as e:
            print(f"❌ Gemini request error: {e}")
            raise Exception(f"Failed to connect to Gemini AI: {e}")
        except Exception as e:
            print(f"❌ Gemini error: {e}")
            raise Exception(f"Gemini generation failed: {e}")

class ContentGeneratorAgent:
    """AI Agent for generating educational content using Gemini AI"""
    
    def __init__(self, gemini_api_key: str):
        self.gemini = GeminiClient(gemini_api_key)
        self.agent_name = "ContentGenerator"
        self.system_context = """You are an expert educational content generator. 
        Your role is to create high-quality learning materials, quizzes, and analyze learning patterns for ANY subject."""
        
    def generate_quiz_questions(self, topic: str, difficulty: int, count: int = 5) -> List[QuizQuestion]:
        """Generate quiz questions using Gemini AI for ANY subject"""
        
        try:
            print(f"🤖 Generating {count} questions for topic: {topic}, difficulty: {difficulty}/5")
            
            prompt = f"""{self.system_context}

TASK: Create exactly {count} multiple choice questions specifically about "{topic}" at difficulty level {difficulty} out of 5.

REQUIREMENTS:
- Each question must have exactly 4 options
- Difficulty level {difficulty}/5 where 1=beginner, 5=expert
- Focus ONLY on {topic} - make questions specific to this subject
- Return ONLY valid JSON format with NO markdown formatting
- Make questions educational and accurate for {topic}
- Ensure one correct answer per question
- Do NOT use special characters, quotes, or control characters in the content

DIFFICULTY GUIDELINES FOR {topic}:
- Level 1: Basic definitions and simple concepts in {topic}
- Level 2: Understanding and recognition of {topic} fundamentals
- Level 3: Application of {topic} concepts
- Level 4: Analysis and comparison within {topic}
- Level 5: Advanced {topic} concepts and synthesis

FORMAT (return exactly this structure with NO markdown):
[
{{
    "question": "Simple question about {topic}",
    "options": ["Correct answer", "Wrong option 1", "Wrong option 2", "Wrong option 3"],
    "correct_answer": "Correct answer",
    "topic": "{topic}"
}}
]

IMPORTANT: Return ONLY the JSON array without any markdown formatting, backticks, or additional text."""
            
            response_text = self.gemini.generate(prompt, max_tokens=2048)
            
            if not response_text:
                raise Exception("Empty response from Gemini AI")
            
            print(f"📥 Raw Gemini response: {response_text[:300]}...")
            
            # Clean the response
            response_text = self._clean_json_response(response_text)
            
            # Parse JSON
            questions_data = json.loads(response_text)
            
            if not isinstance(questions_data, list):
                raise ValueError("Response is not a JSON array")
            
            questions_data = questions_data[:count]
            
            questions = []
            for i, q_data in enumerate(questions_data):
                # Validate question structure
                required_fields = ['question', 'options', 'correct_answer']
                if not all(field in q_data for field in required_fields):
                    print(f"⚠️ Question {i+1} missing fields, skipping")
                    continue
                
                if not isinstance(q_data['options'], list) or len(q_data['options']) < 4:
                    print(f"⚠️ Question {i+1} invalid options, skipping")
                    continue
                
                # Ensure we have exactly 4 options
                options = q_data['options'][:4]
                
                # Make sure correct answer is in options
                correct_answer = q_data['correct_answer']
                if correct_answer not in options:
                    correct_answer = options[0]
                
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
                questions = questions[:count]
                print(f"✅ Successfully generated {len(questions)} questions for {topic}")
                return questions
            else:
                raise ValueError(f"Generated only {len(questions)} valid questions, need {count}")
                
        except Exception as e:
            print(f"❌ Error generating questions: {e}")
            raise Exception(f"Failed to generate quiz questions for {topic}: {e}")

    def generate_visual_html_example(self, topic: str) -> str:
        """Generate an animated HTML example for visual learners"""
        
        try:
            prompt = f"""Create a complete, single HTML file for the topic: "{topic}"
            
Requirements:
1. Use HTML5, CSS3, JavaScript, and Bootstrap 5
2. Include Font Awesome icons or similar icon libraries
3. Add smooth animations and transitions
4. Make it visually appealing with modern design
5. Include interactive elements (hover effects, click animations, etc.)
6. Add educational content about the topic with visual representations
7. Use cards, modals, progress bars, or other Bootstrap components
8. Include CSS animations like fade-in, slide-in, bounce, etc.
9. Make it responsive and mobile-friendly
10. Add a beautiful color scheme and typography

The HTML should be complete and ready to open in a browser. Include all CSS and JavaScript.
Make it educational, interactive, and visually stunning with animations that help explain the concept of "{topic}".

Please provide ONLY the HTML code with internal CSS and use best animations and Bootstrap icons.
Focus on making the animations educational and help explain the concept visually.

IMPORTANT: Do NOT use any markdown formatting or backticks in your response. Return only valid HTML code."""

            response = self.gemini.generate(prompt, max_tokens=4000)
            
            if response and response.strip():
                # Clean up the response to ensure it's valid HTML
                html_content = response.strip()
                
                # Remove any markdown formatting if present
                html_content = re.sub(r'```html\s*', '', html_content)
                html_content = re.sub(r'```\s*$', '', html_content)
                
                # Basic validation - ensure it has HTML structure
                if '<html' in html_content.lower() and '</html>' in html_content.lower():
                    return html_content
                else:
                    # Wrap in basic HTML structure if needed
                    return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{topic} - Visual Learning</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
</head>
<body>
    {html_content}
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>"""
            
            raise Exception("Failed to generate HTML content")
            
        except Exception as e:
            print(f"❌ Error generating visual HTML: {e}")
            raise Exception(f"Failed to generate visual example for {topic}: {e}")

    def generate_custom_focus_areas(self, subject: str) -> List[str]:
        """Generate custom focus areas for any subject using Gemini AI"""
        
        try:
            print(f"🎯 Generating focus areas for subject: {subject}")
            
            prompt = f"""{self.system_context}

TASK: Generate 6-8 key focus areas/topics for the subject "{subject}" that a learner might want to improve on.

REQUIREMENTS:
1. Create 6-8 specific, learnable topics within {subject}
2. Range from basic to intermediate concepts
3. Each area should be 1-3 words (concise)
4. Focus on fundamental concepts that students commonly struggle with
5. Make them practical and actionable
6. Return as a simple JSON array of strings
7. Do NOT use any markdown formatting

EXAMPLES:
For "Physics": ["mechanics", "thermodynamics", "electricity", "magnetism", "waves", "optics"]
For "Programming": ["variables", "loops", "functions", "arrays", "debugging", "algorithms"]
For "History": ["chronology", "cause and effect", "primary sources", "analysis", "writing", "research"]

Generate focus areas for "{subject}" now. Return ONLY the JSON array without markdown formatting:"""
            
            response_text = self.gemini.generate(prompt, max_tokens=500)
            
            if not response_text:
                raise Exception("Empty response from Gemini AI")
            
            print(f"📥 Raw Gemini response: {response_text}")
            
            # Clean the response
            response_text = self._clean_json_response(response_text)
            
            # Parse JSON
            focus_areas = json.loads(response_text)
            
            if not isinstance(focus_areas, list):
                raise ValueError("Response is not a JSON array")
            
            # Filter and clean the focus areas
            cleaned_areas = []
            for area in focus_areas:
                if isinstance(area, str) and area.strip():
                    # Clean up the area name
                    clean_area = area.strip().lower()
                    # Remove quotes and special characters
                    clean_area = re.sub(r'[^\w\s-]', '', clean_area)
                    if clean_area and len(clean_area) <= 30:  # Reasonable length limit
                        cleaned_areas.append(clean_area)
            
            if len(cleaned_areas) >= 5:  # Need at least 5 areas
                print(f"✅ Generated {len(cleaned_areas)} focus areas for {subject}")
                return cleaned_areas[:8]  # Limit to 8 areas
            else:
                raise ValueError(f"Generated only {len(cleaned_areas)} valid focus areas, need at least 5")
                
        except Exception as e:
            print(f"❌ Error generating focus areas: {e}")
            raise Exception(f"Failed to generate focus areas for {subject}: {e}")

    def analyze_weak_areas(self, quiz_results: List[Dict]) -> List[str]:
        """Analyze quiz results to identify weak areas using Gemini AI"""
        try:
            if not quiz_results:
                return []
            
            prompt = f"""{self.system_context}

TASK: Analyze quiz results and identify weak learning areas.

Quiz Results:
{json.dumps(quiz_results, indent=2)}

Based on incorrect answers and topics, identify the main weak areas that need attention.
Return only a JSON array of weak area topics (maximum 5 topics).

Example format: ["topic1", "topic2", "topic3"]

Return only the JSON array without any additional text or markdown formatting:"""
            
            response = self.gemini.generate(prompt, max_tokens=500)
            
            # Try to extract JSON array
            try:
                response = self._clean_json_response(response)
                weak_areas = json.loads(response)
                return weak_areas if isinstance(weak_areas, list) else []
            except:
                pass
            
            raise Exception("Failed to analyze weak areas")
            
        except Exception as e:
            print(f"❌ Error analyzing weak areas: {e}")
            raise Exception(f"Failed to analyze weak areas: {e}")
    
    def _clean_json_response(self, response_text: str) -> str:
        """Clean the Gemini response to extract valid JSON with better error handling"""
        
        if not response_text:
            raise ValueError("Empty response text")
        
        # Remove markdown code blocks if present
        response_text = re.sub(r'```json\s*', '', response_text, flags=re.IGNORECASE)
        response_text = re.sub(r'```\s*', '', response_text)
        
        # Remove any leading/trailing whitespace
        response_text = response_text.strip()
        
        # Replace problematic characters that cause JSON parsing errors
        response_text = self._sanitize_json_string(response_text)
        
        # Find JSON array boundaries
        start_idx = response_text.find('[')
        end_idx = response_text.rfind(']')
        
        if start_idx != -1 and end_idx != -1 and start_idx < end_idx:
            json_content = response_text[start_idx:end_idx + 1]
        else:
            # Find JSON object boundaries
            start_idx = response_text.find('{')
            end_idx = response_text.rfind('}')
            
            if start_idx != -1 and end_idx != -1 and start_idx < end_idx:
                json_content = response_text[start_idx:end_idx + 1]
                
                # Try to wrap single object in array
                try:
                    obj = json.loads(json_content)
                    json_content = json.dumps([obj])
                except:
                    pass
            else:
                raise ValueError("No valid JSON structure found in response")
        
        # Final sanitization
        json_content = self._sanitize_json_string(json_content)
        
        return json_content
    
    def _sanitize_json_string(self, text: str) -> str:
        """Sanitize string to remove problematic characters for JSON parsing"""
        
        # Replace common problematic characters
        replacements = {
            '\n': '\\n',
            '\r': '\\r',
            '\t': '\\t',
            '\b': '\\b',
            '\f': '\\f',
            '"': '\\"',  # Only replace unescaped quotes
            '\\': '\\\\',  # Escape backslashes
        }
        
        # Remove control characters (ASCII 0-31 except whitespace)
        text = ''.join(char for char in text if ord(char) >= 32 or char in '\t\n\r')
        
        # Fix unescaped quotes in JSON strings
        # This is a simple approach - in production you might want more sophisticated JSON repair
        lines = text.split('\n')
        fixed_lines = []
        
        for line in lines:
            # Skip lines that are not within JSON string values
            if ':' in line and '"' in line:
                # Find the value part after the colon
                parts = line.split(':', 1)
                if len(parts) == 2:
                    key_part = parts[0]
                    value_part = parts[1].strip()
                    
                    # If value starts and ends with quotes, fix internal quotes
                    if value_part.startswith('"') and value_part.endswith('"'):
                        # Extract the content between quotes
                        content = value_part[1:-1]
                        # Escape any unescaped quotes
                        content = content.replace('\\"', '!!ESCAPED_QUOTE!!').replace('"', '\\"').replace('!!ESCAPED_QUOTE!!', '\\"')
                        value_part = f'"{content}"'
                    
                    line = f"{key_part}:{value_part}"
            
            fixed_lines.append(line)
        
        return '\n'.join(fixed_lines)