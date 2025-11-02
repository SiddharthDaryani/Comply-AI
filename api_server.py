from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from groq import Groq
import os
from dotenv import load_dotenv
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

app = FastAPI(title="Comply AI API", version="1.0")

# Enable CORS for browser extension
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Groq client
try:
    GROQ_API_KEY = os.getenv("GROQ_API_KEY")
    if not GROQ_API_KEY:
        logger.error("GROQ_API_KEY not found in environment variables!")
        raise ValueError("GROQ_API_KEY is required")
    
    client = Groq(api_key=GROQ_API_KEY)
    logger.info("✅ Groq client initialized successfully")
except Exception as e:
    logger.error(f"❌ Failed to initialize Groq client: {e}")
    client = None

# Load policy document
try:
    policy_path = "data/policies/policy.txt"
    with open(policy_path, "r", encoding="utf-8") as f:
        POLICY_CONTEXT = f.read()
    logger.info(f"✅ Policy document loaded from {policy_path}")
except FileNotFoundError:
    logger.warning("⚠️ Policy file not found, using default policy")
    POLICY_CONTEXT = """
    Social Media Compliance Rulebook:
    1. Maintain professional tone
    2. No unverified claims
    3. No confidential information
    4. High-quality imagery only
    5. Include legal disclaimers
    """

class DraftRequest(BaseModel):
    text: str

@app.get("/")
async def root():
    return {
        "status": "running",
        "message": "Comply AI API is active",
        "endpoints": ["/check-compliance", "/health"]
    }

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "groq_connected": client is not None,
        "policy_loaded": len(POLICY_CONTEXT) > 0
    }

@app.post("/check-compliance")
async def check_compliance(request: DraftRequest):
    if not client:
        raise HTTPException(status_code=500, detail="Groq client not initialized")
    
    if not request.text or len(request.text.strip()) == 0:
        raise HTTPException(status_code=400, detail="Draft text is required")
    
    logger.info(f"📝 Checking compliance for draft: {request.text[:50]}...")
    
    try:
        prompt = f"""You are a compliance assistant. Classify the draft as "Compliant" or "Non-Compliant" based on the policy.

Policy Context:
{POLICY_CONTEXT[:1500]}

Draft:
{request.text}

Respond with: "Compliant." or "Non-Compliant. Reason: [specific policy violated]"
Keep response concise."""
        
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1,
            max_tokens=150
        )
        
        result = response.choices[0].message.content.strip()
        logger.info(f"✅ Result: {result[:100]}...")
        
        is_compliant = "Compliant" in result and "Non-Compliant" not in result
        
        return {
            "compliant": is_compliant,
            "message": result,
            "draft_length": len(request.text)
        }
        
    except Exception as e:
        logger.error(f"❌ Error during compliance check: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Compliance check failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    
    logger.info("🚀 Starting Comply AI API Server...")
    logger.info("📍 Server will be available at: http://localhost:8000")
    logger.info("📚 API docs at: http://localhost:8000/docs")
    
    uvicorn.run(
        app, 
        host="0.0.0.0", 
        port=8000,
        log_level="info"
    )
