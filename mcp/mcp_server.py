# mcp_server_tutor_agent.py
import asyncio
import json
import ssl
from datetime import datetime
import random
from starlette.applications import Starlette
from starlette.responses import Response, JSONResponse
from starlette.routing import Route
from starlette.requests import Request
import uvicorn
import requests

# Configuration - No MongoDB needed for tutor agent
current_call_session = {}

# Store call context endpoint (called by ElevenLabs when call starts)
async def store_call_context(request):
    """Store the calling number for this session"""
    try:
        data = await request.json()
        caller_number = data.get('to_number')  # The number being called to
        call_id = data.get('call_id', 'default')
        
        if caller_number:
            current_call_session[call_id] = {
                'caller_number': caller_number,
                'subject_context': None,
                'conversation_history': []
            }
            print(f"📞 Tutor call session started for {caller_number}")
        
        return JSONResponse({"status": "success"})
    except Exception as e:
        print(f"❌ Error storing call context: {e}")
        return JSONResponse({"status": "error"})

def generate_ai_response(question, subject_context=None):
    """Generate AI response for educational questions"""
    try:
        # You can integrate with OpenAI API, Claude API, or any other AI service
        # For now, I'll create a comprehensive response system
        
        # Analyze the question to determine the subject area
        question_lower = question.lower()
        
        # Computer Science topics
        if any(keyword in question_lower for keyword in ['programming', 'code', 'algorithm', 'data structure', 'software', 'computer', 'java', 'python', 'c++', 'javascript', 'database', 'sql', 'machine learning', 'ai', 'artificial intelligence', 'web development', 'html', 'css', 'react', 'node', 'git', 'github']):
            return generate_cs_response(question)
        
        # Mathematics topics
        elif any(keyword in question_lower for keyword in ['math', 'algebra', 'calculus', 'geometry', 'trigonometry', 'statistics', 'probability', 'equation', 'formula', 'derivative', 'integral']):
            return generate_math_response(question)
        
        # Physics topics
        elif any(keyword in question_lower for keyword in ['physics', 'force', 'energy', 'momentum', 'electricity', 'magnetism', 'quantum', 'relativity', 'mechanics', 'thermodynamics']):
            return generate_physics_response(question)
        
        # Chemistry topics
        elif any(keyword in question_lower for keyword in ['chemistry', 'chemical', 'molecule', 'atom', 'reaction', 'organic', 'inorganic', 'periodic table', 'bond', 'acid', 'base']):
            return generate_chemistry_response(question)
        
        # General study questions
        elif any(keyword in question_lower for keyword in ['study', 'learn', 'understand', 'explain', 'help', 'homework', 'assignment', 'project']):
            return generate_general_study_response(question)
        
        else:
            return generate_general_tutor_response(question)
            
    except Exception as e:
        print(f"❌ Error generating AI response: {e}")
        return "I'm having trouble processing your question right now. Could you please rephrase it?"

def generate_cs_response(question):
    """Generate computer science related responses"""
    question_lower = question.lower()
    
    if 'programming' in question_lower or 'code' in question_lower:
        return """As a computer science student, programming is fundamental! Here are key points:

**Programming Basics:**
- Start with understanding problem-solving logic
- Choose a language (Python is beginner-friendly)
- Practice coding daily with small projects
- Learn debugging techniques

**Best Practices:**
- Write clean, readable code
- Use meaningful variable names
- Comment your code properly
- Follow coding standards

Would you like me to explain any specific programming concept or help with a particular coding problem?"""
    
    elif 'algorithm' in question_lower:
        return """Algorithms are step-by-step procedures for solving problems. Here's what you need to know:

**Key Algorithm Types:**
- Sorting (Bubble, Quick, Merge)
- Searching (Binary, Linear)
- Graph algorithms (BFS, DFS)
- Dynamic Programming

**Analysis:**
- Time Complexity (Big O notation)
- Space Complexity
- Best, Average, Worst cases

**Tips for Learning:**
- Implement algorithms yourself
- Understand the logic, don't just memorize
- Practice on coding platforms

What specific algorithm would you like to understand better?"""
    
    elif 'data structure' in question_lower:
        return """Data structures are crucial for efficient programming:

**Linear Data Structures:**
- Arrays, Linked Lists
- Stacks (LIFO), Queues (FIFO)

**Non-linear:**
- Trees (Binary, BST, AVL)
- Graphs, Hash Tables

**When to Use:**
- Arrays: Fast access by index
- Linked Lists: Dynamic size
- Stacks: Function calls, undo operations
- Trees: Hierarchical data, searching

Which data structure are you working with? I can provide specific implementation guidance!"""
    
    else:
        return f"""I can help with computer science topics! Based on your question: "{question}"

**Common CS Areas I Cover:**
- Programming languages (Python, Java, C++, JavaScript)
- Data Structures & Algorithms
- Database concepts & SQL
- Web Development (HTML, CSS, React)
- Software Engineering principles
- Machine Learning basics
- System Design concepts

Please ask me about any specific topic, and I'll provide detailed explanations with examples!"""

def generate_math_response(question):
    """Generate mathematics related responses"""
    return f"""I can help you with mathematics! For your question: "{question}"

**I can assist with:**
- Algebra: Equations, functions, polynomials
- Calculus: Derivatives, integrals, limits
- Geometry: Shapes, proofs, coordinate geometry  
- Statistics: Probability, distributions, analysis
- Discrete Math: Logic, sets, combinatorics

**Study Tips:**
- Practice problems regularly
- Understand concepts before memorizing formulas
- Draw diagrams when possible
- Check your work by substituting back

Would you like me to solve a specific problem or explain a mathematical concept in detail?"""

def generate_physics_response(question):
    """Generate physics related responses"""
    return f"""Physics concepts can be challenging! For your question: "{question}"

**I can help with:**
- Mechanics: Motion, forces, energy
- Electricity & Magnetism
- Thermodynamics & Heat
- Waves & Optics
- Modern Physics: Quantum, Relativity

**Problem-Solving Approach:**
1. Identify given information
2. Determine what you need to find
3. Choose appropriate formulas
4. Solve step by step
5. Check units and reasonableness

What specific physics topic would you like me to explain or help you with?"""

def generate_chemistry_response(question):
    """Generate chemistry related responses"""
    return f"""Chemistry is all about understanding matter and reactions! For your question: "{question}"

**Key Areas I Cover:**
- Atomic Structure & Periodic Table
- Chemical Bonding & Molecular Structure  
- Organic Chemistry: Reactions, mechanisms
- Inorganic Chemistry: Compounds, properties
- Physical Chemistry: Thermodynamics, kinetics

**Study Strategy:**
- Understand electron behavior
- Practice drawing structures
- Learn reaction mechanisms
- Memorize common formulas and constants

Which chemistry topic would you like me to explain in detail?"""

def generate_general_study_response(question):
    """Generate general study guidance"""
    return f"""I'm here to help with your studies! Regarding: "{question}"

**Effective Study Techniques:**
- Active recall: Test yourself regularly
- Spaced repetition: Review material over time
- Pomodoro technique: 25-min focused sessions
- Create concept maps and summaries

**For Computer Science Students:**
- Build projects to apply concepts
- Contribute to open source
- Join coding communities
- Practice problem-solving daily

**General Tips:**
- Set clear learning objectives
- Break complex topics into smaller parts
- Teach concepts to others
- Get enough sleep and exercise

What specific study challenge are you facing? I can provide targeted advice!"""

def generate_general_tutor_response(question):
    """Generate general tutoring response"""
    return f"""I'm your AI tutor assistant! I can help you with: "{question}"

**Subjects I Excel In:**
- Computer Science & Programming
- Mathematics (Algebra to Calculus)
- Physics & Chemistry  
- Study strategies & learning techniques
- Project guidance & problem-solving

**How I Can Help:**
- Explain complex concepts simply
- Provide step-by-step solutions
- Suggest learning resources
- Give study tips and strategies
- Help with assignments and projects

Please ask me about any specific topic, and I'll provide detailed, helpful explanations tailored to your level of understanding!"""

# MCP Protocol Handler
async def handle_mcp_request(request: Request):
    """Handle MCP JSON-RPC requests"""
    try:
        body = await request.body()
        if not body:
            return JSONResponse({
                "jsonrpc": "2.0",
                "error": {"code": -32700, "message": "Parse error"}
            }, status_code=400)
        
        try:
            message = json.loads(body)
        except json.JSONDecodeError:
            return JSONResponse({
                "jsonrpc": "2.0", 
                "error": {"code": -32700, "message": "Parse error"}
            }, status_code=400)
        
        print(f"📨 MCP Request: {message}")
        
        method = message.get("method")
        msg_id = message.get("id")
        params = message.get("params", {})
        
        if method == "initialize":
            response = {
                "jsonrpc": "2.0",
                "id": msg_id,
                "result": {
                    "protocolVersion": "2024-11-05",
                    "capabilities": {
                        "tools": {"listChanged": False}
                    },
                    "serverInfo": {
                        "name": "tutor-agent-mcp",
                        "version": "1.0.0"
                    }
                }
            }
            
        elif method == "tools/list":
            tools = [
                {
                    "name": "ask_tutor",
                    "description": "Ask the AI tutor any subject-related question",
                    "inputSchema": {
                        "type": "object",
                        "properties": {
                            "question": {
                                "type": "string",
                                "description": "Your question about any subject or study topic"
                            }
                        },
                        "required": ["question"]
                    }
                },
                {
                    "name": "get_study_tips",
                    "description": "Get general study tips and learning strategies",
                    "inputSchema": {
                        "type": "object",
                        "properties": {
                            "subject": {
                                "type": "string",
                                "description": "Optional: specific subject for targeted tips"
                            }
                        },
                        "required": []
                    }
                },
                {
                    "name": "solve_problem",
                    "description": "Get step-by-step solution for academic problems",
                    "inputSchema": {
                        "type": "object",
                        "properties": {
                            "problem": {
                                "type": "string",
                                "description": "The academic problem you need help solving"
                            },
                            "subject": {
                                "type": "string",
                                "description": "Subject area (math, physics, programming, etc.)"
                            }
                        },
                        "required": ["problem"]
                    }
                },
                {
                    "name": "explain_concept",
                    "description": "Get detailed explanation of academic concepts",
                    "inputSchema": {
                        "type": "object",
                        "properties": {
                            "concept": {
                                "type": "string",
                                "description": "The concept you want explained"
                            },
                            "level": {
                                "type": "string",
                                "description": "Your level: beginner, intermediate, advanced"
                            }
                        },
                        "required": ["concept"]
                    }
                }
            ]
            
            response = {
                "jsonrpc": "2.0",
                "id": msg_id,
                "result": {"tools": tools}
            }
            
        elif method == "tools/call":
            tool_name = params.get("name")
            arguments = params.get("arguments", {})
            
            print(f"🔧 Tool called: {tool_name}")
            print(f"📋 Arguments: {arguments}")
            
            if tool_name == "ask_tutor":
                result = await ask_tutor(arguments)
            elif tool_name == "get_study_tips":
                result = await get_study_tips(arguments)
            elif tool_name == "solve_problem":
                result = await solve_problem(arguments)
            elif tool_name == "explain_concept":
                result = await explain_concept(arguments)
            else:
                result = {"content": [{"type": "text", "text": "Unknown tool"}]}
            
            response = {
                "jsonrpc": "2.0",
                "id": msg_id,
                "result": result
            }
            
        elif method == "notifications/initialized":
            response = {"jsonrpc": "2.0", "id": msg_id, "result": {}}
            
        else:
            response = {
                "jsonrpc": "2.0",
                "id": msg_id,
                "error": {"code": -32601, "message": f"Method not found: {method}"}
            }
        
        print(f"📤 MCP Response: {response}")
        return JSONResponse(response)
        
    except Exception as e:
        print(f"❌ MCP error: {e}")
        return JSONResponse({
            "jsonrpc": "2.0",
            "id": message.get("id") if 'message' in locals() else None,
            "error": {"code": -32603, "message": f"Internal error: {str(e)}"}
        }, status_code=500)

async def ask_tutor(arguments):
    """Handle general tutor questions"""
    question = arguments.get("question", "").strip()
    
    if not question:
        return {"content": [{"type": "text", "text": "Hello! I'm your AI tutor. What would you like to learn about today? I can help with computer science, programming, mathematics, physics, chemistry, and general study strategies!"}]}
    
    print(f"🎓 Processing tutor question: {question}")
    
    # Store question in session for context
    current_call_session['last_question'] = question
    
    # Generate AI response
    response_text = generate_ai_response(question)
    
    # Add follow-up offer
    response_text += "\n\nIs there anything specific about this topic you'd like me to explain further, or do you have another question?"
    
    return {"content": [{"type": "text", "text": response_text}]}

async def get_study_tips(arguments):
    """Provide study tips and strategies"""
    subject = arguments.get("subject", "").strip().lower()
    
    if subject:
        if 'computer' in subject or 'programming' in subject:
            response_text = """**Computer Science Study Tips:**

📚 **Learning Programming:**
- Code daily, even if just 30 minutes
- Build real projects, not just tutorials
- Read other people's code
- Use version control (Git) from day one

💡 **Problem Solving:**
- Break problems into smaller parts
- Draw diagrams and flowcharts
- Test with simple examples first
- Don't just memorize - understand the logic

🔧 **Practical Tips:**
- Set up a good development environment
- Learn keyboard shortcuts
- Use debugging tools effectively
- Join coding communities and forums

Would you like specific tips for any programming language or CS topic?"""
        
        elif 'math' in subject:
            response_text = """**Mathematics Study Tips:**

📊 **Problem-Solving Strategy:**
- Read problems carefully, twice
- Identify what's given and what to find
- Choose appropriate formulas/methods
- Show all work step by step
- Check your answer makes sense

📝 **Study Techniques:**
- Practice problems daily
- Create formula sheets
- Explain solutions out loud
- Form study groups
- Use visual aids when possible

🎯 **Exam Preparation:**
- Review past exams/quizzes
- Time yourself on practice problems
- Focus on your weak areas
- Get enough sleep before exams

Need help with a specific math topic?"""
        
        else:
            response_text = f"""**Study Tips for {subject.title()}:**

🎯 **General Strategies:**
- Set specific learning goals
- Use active recall techniques
- Space out your study sessions
- Create concept maps
- Teach concepts to others

📚 **Effective Study Methods:**
- Pomodoro Technique (25-min sessions)
- Feynman Technique (explain simply)
- Practice testing yourself
- Use multiple resources
- Take breaks to consolidate learning

💪 **Stay Motivated:**
- Track your progress
- Celebrate small wins
- Connect with study groups
- Set realistic deadlines

What specific challenges are you facing with {subject}?"""
    else:
        response_text = """**Universal Study Tips for All Subjects:**

🧠 **Cognitive Techniques:**
- Active recall over passive reading
- Spaced repetition for long-term retention
- Interleaving different topics
- Elaborative questioning (ask "why" and "how")

⏰ **Time Management:**
- Use Pomodoro Technique (25-min focus sessions)
- Plan study sessions in advance
- Prioritize difficult topics when fresh
- Take regular breaks

🎯 **Environment & Habits:**
- Find a consistent study space
- Eliminate distractions (phone, social media)
- Get adequate sleep (7-9 hours)
- Exercise regularly for brain health

📝 **Note-Taking & Review:**
- Cornell note-taking method
- Create summaries and concept maps
- Review notes within 24 hours
- Test yourself regularly

Which subject would you like specific study strategies for?"""
    
    return {"content": [{"type": "text", "text": response_text}]}

async def solve_problem(arguments):
    """Help solve academic problems step by step"""
    problem = arguments.get("problem", "").strip()
    subject = arguments.get("subject", "").strip().lower()
    
    if not problem:
        return {"content": [{"type": "text", "text": "Please describe the problem you need help solving. I can provide step-by-step guidance for math, programming, physics, chemistry, and other academic problems!"}]}
    
    print(f"🔍 Solving problem: {problem} (Subject: {subject})")
    
    # Generate problem-solving response based on subject
    if 'programming' in subject or 'code' in subject or any(lang in problem.lower() for lang in ['python', 'java', 'javascript', 'c++']):
        response_text = f"""**Programming Problem Solution:**

📋 **Problem:** {problem}

🔧 **Step-by-Step Approach:**

1. **Understand the Problem:**
   - What inputs do we have?
   - What output is expected?
   - Are there any constraints?

2. **Plan the Solution:**
   - Break into smaller sub-problems
   - Choose appropriate data structures
   - Consider edge cases

3. **Implement:**
   - Start with a simple version
   - Test with sample inputs
   - Refine and optimize

4. **Debug & Test:**
   - Test edge cases
   - Check for off-by-one errors
   - Verify the logic

Would you like me to help you implement this step by step? Please share more details about what specific programming language or concept you're working with!"""
    
    elif 'math' in subject or any(math_term in problem.lower() for math_term in ['equation', 'solve', 'calculate', 'find']):
        response_text = f"""**Mathematics Problem Solution:**

📝 **Problem:** {problem}

📊 **Solution Strategy:**

1. **Identify the Problem Type:**
   - What mathematical concept is involved?
   - What formulas or methods apply?

2. **Given Information:**
   - List all known values
   - Identify what we need to find

3. **Solution Steps:**
   - Choose the appropriate method
   - Show each calculation step
   - Include units if applicable

4. **Verify the Answer:**
   - Does the answer make sense?
   - Can we check by substituting back?

Please provide the specific mathematical problem with numbers, and I'll walk through the detailed solution with you!"""
    
    else:
        response_text = f"""**Academic Problem Analysis:**

🎯 **Problem:** {problem}

🔍 **General Problem-Solving Framework:**

1. **Define the Problem Clearly:**
   - What exactly are we trying to solve?
   - What information do we have?
   - What are we looking for?

2. **Analyze and Plan:**
   - What concepts or principles apply?
   - What methods or formulas are relevant?
   - Break into manageable steps

3. **Execute the Solution:**
   - Work through each step systematically
   - Show your reasoning
   - Keep track of your progress

4. **Review and Verify:**
   - Does the solution make sense?
   - Are there alternative approaches?
   - What can we learn from this problem?

Could you provide more specific details about the problem, including the subject area and any relevant information? I'll then give you a detailed, step-by-step solution!"""
    
    return {"content": [{"type": "text", "text": response_text}]}

async def explain_concept(arguments):
    """Explain academic concepts in detail"""
    concept = arguments.get("concept", "").strip()
    level = arguments.get("level", "intermediate").strip().lower()
    
    if not concept:
        return {"content": [{"type": "text", "text": "What concept would you like me to explain? I can break down topics in computer science, mathematics, physics, chemistry, and more at beginner, intermediate, or advanced levels!"}]}
    
    print(f"📚 Explaining concept: {concept} (Level: {level})")
    
    # Generate explanation based on the concept
    concept_lower = concept.lower()
    
    # Adjust explanation depth based on level
    depth_prefix = {
        "beginner": "Let me explain this concept in simple terms:",
        "intermediate": "Here's a comprehensive explanation of this concept:",
        "advanced": "Let me provide an in-depth analysis of this concept:"
    }.get(level, "Here's an explanation of this concept:")
    
    # Generate AI response for the concept
    base_response = generate_ai_response(f"explain {concept}")
    
    response_text = f"""**Concept Explanation: {concept.title()}**

{depth_prefix}

{base_response}

📖 **Learning Path:**
- Start with the basics I've outlined above
- Practice with examples and problems
- Apply the concept in real scenarios
- Connect it to related topics

🎯 **Next Steps:**
- Would you like me to provide specific examples?
- Do you have questions about any particular aspect?
- Should I explain related concepts?
- Need practice problems or exercises?

What specific part of {concept} would you like me to elaborate on?"""
    
    return {"content": [{"type": "text", "text": response_text}]}

# Health check endpoint
async def health_check(request):
    """Health check for tutor agent"""
    return JSONResponse({
        "status": "healthy",
        "service": "AI Tutor Agent",
        "capabilities": [
            "Subject tutoring",
            "Problem solving", 
            "Concept explanation",
            "Study guidance"
        ],
        "timestamp": datetime.now().isoformat()
    })

# Routes
routes = [
    Route("/", handle_mcp_request, methods=["POST"]),
    Route("/mcp", handle_mcp_request, methods=["POST"]),
    Route("/health", health_check, methods=["GET"]),
    Route("/call-context", store_call_context, methods=["POST"]),
]

app = Starlette(routes=routes)

if __name__ == "__main__":
    print("🎓 AI Tutor Agent MCP Server Starting...")
    print("📚 Ready to help with all academic subjects!")
    print("🔗 MCP Endpoint: / and /mcp")
    print("📞 Call-enabled tutor assistance")
    uvicorn.run(app, host="0.0.0.0", port=8001)