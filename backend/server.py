"""
HWH Player Advantage™ - Main FastAPI Application
Supports both Supabase (PostgreSQL) and MongoDB (fallback/demo mode)
"""
from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, BackgroundTasks
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from typing import Optional, List
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from email_provider import get_provider, EmailTemplates
import csv
import io
import uuid

# Supabase support
try:
    from supabase import create_client, Client
    HAS_SUPABASE = True
except ImportError:
    HAS_SUPABASE = False

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Create FastAPI app
app = FastAPI(title="HWH Player Advantage™", version="1.0.0")

# API Router
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Package pricing (in dollars)
PACKAGES = {
    "starter": 99.00,
    "development": 199.00,
    "elite_track": 399.00
}

# Coach subscription tiers
COACH_TIERS = {
    "basic": {
        "name": "Basic",
        "price": 99.00,
        "price_id": "price_basic_monthly",
        "features": ["Browse verified prospects", "Save up to 25 players", "Basic stats view", "Search & filters"]
    },
    "premium": {
        "name": "Premium", 
        "price": 299.00,
        "price_id": "price_premium_monthly",
        "features": ["Everything in Basic", "Unlimited saved players", "Contact info access", "Full film links", "Detailed profiles", "Export prospect lists"]
    },
    "elite": {
        "name": "Elite",
        "price": 499.00,
        "price_id": "price_elite_monthly",
        "features": ["Everything in Premium", "Direct messaging to HWH", "Coach-to-coach referrals", "Prospect comparison tool", "Priority support", "Early access to new prospects"]
    }
}

# Stripe integration
STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY')

# Check if Supabase is configured
DATABASE_URL = os.environ.get('DATABASE_URL')
USE_SUPABASE = DATABASE_URL and 'YOUR_PASSWORD_HERE' not in DATABASE_URL and 'placeholder' not in DATABASE_URL.lower()

# Supabase client initialization
supabase_client: Optional[Client] = None
if USE_SUPABASE and HAS_SUPABASE:
    try:
        # Extract Supabase URL and key from DATABASE_URL or use separate env vars
        SUPABASE_URL = os.environ.get('SUPABASE_URL')
        SUPABASE_KEY = os.environ.get('SUPABASE_ANON_KEY') or os.environ.get('SUPABASE_KEY')
        
        if SUPABASE_URL and SUPABASE_KEY:
            supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)
            logger.info("✅ Supabase client initialized")
        else:
            logger.warning("⚠️ SUPABASE_URL or SUPABASE_ANON_KEY not set. Set these for Supabase support.")
            USE_SUPABASE = False
    except Exception as e:
        logger.error(f"❌ Failed to initialize Supabase client: {e}")
        USE_SUPABASE = False

# Demo mode - uses in-memory storage for testing (no external DB needed)
DEMO_MODE = os.environ.get('DEMO_MODE', 'false').lower() == 'true'

# In-memory storage for demo mode
_demo_storage = {
    'staff_users': [],
    'coaches': [],
    'players': [],
    'projects': [],
    'password_reset_tokens': [],
    'payment_transactions': []
}

# MongoDB connection for demo/fallback mode
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
db_name = os.environ.get('DB_NAME', 'hwh_player_advantage')

if DEMO_MODE:
    logger.info("🎮 DEMO MODE ENABLED - Using in-memory storage")
    mongo_client = None
    mongo_db = None

    class DemoCollection:
        """In-memory collection mimicking MongoDB async interface"""
        def __init__(self, name):
            self.name = name
            if name not in _demo_storage:
                _demo_storage[name] = []

        async def find_one(self, query, projection=None):
            items = _demo_storage.get(self.name, [])
            for item in items:
                if all(item.get(k) == v for k, v in query.items()):
                    return item.copy()
            return None

        async def find(self, query=None):
            items = _demo_storage.get(self.name, [])
            if not query:
                return items.copy()
            return [item for item in items if all(item.get(k) == v for k, v in query.items())]

        async def insert_one(self, document):
            _demo_storage[self.name].append(document)
            return type('obj', (object,), {'inserted_id': document.get('id', str(uuid.uuid4()))})()

        async def update_one(self, query, update):
            items = _demo_storage.get(self.name, [])
            for item in items:
                if all(item.get(k) == v for k, v in query.items()):
                    if '$set' in update:
                        item.update(update['$set'])
                    return type('obj', (object,), {'modified_count': 1})()
            return type('obj', (object,), {'modified_count': 0})()

        async def delete_one(self, query):
            items = _demo_storage.get(self.name, [])
            for i, item in enumerate(items):
                if all(item.get(k) == v for k, v in query.items()):
                    items.pop(i)
                    return type('obj', (object,), {'deleted_count': 1})()
            return type('obj', (object,), {'deleted_count': 0})()

        async def count_documents(self, query=None):
            items = _demo_storage.get(self.name, [])
            if not query:
                return len(items)
            return sum(1 for item in items if all(item.get(k) == v for k, v in query.items()))

        async def create_index(self, key, unique=False):
            pass  # No-op for demo mode

        def __getattr__(self, name):
            return DemoCollection(f"{self.name}.{name}")

    class DemoDB:
        """Mock MongoDB database for demo mode"""
        def __init__(self):
            self._collections = {}

        def __getitem__(self, name):
            if name not in self._collections:
                self._collections[name] = DemoCollection(name)
            return self._collections[name]

        def __getattr__(self, name):
            return self[name]

    mongo_db = DemoDB()

    class MockMongoClient:
        def __init__(self):
            self.demo_db = DemoDB()
        def __getitem__(self, name):
            return self.demo_db
        def __getattr__(self, name):
            return self.demo_db
        async def admin(self):
            return self
        async def command(self, cmd):
            return {'ok': 1}
        def close(self):
            pass

    mongo_client = MockMongoClient()
else:
    mongo_client = AsyncIOMotorClient(mongo_url)
    mongo_db = mongo_client[db_name]

# ============================================================================
# SUPABASE DATABASE ABSTRACTION
# Provides MongoDB-like interface for Supabase PostgreSQL
# ============================================================================

if USE_SUPABASE and supabase_client:
    logger.info("🔌 Using Supabase as primary database")

    class SupabaseCollection:
        """Wraps Supabase table operations with MongoDB-like interface"""
        def __init__(self, table_name: str):
            self.table_name = table_name

        async def find_one(self, query: dict, projection: dict = None):
            """Find single document matching query"""
            try:
                # Build query
                qb = supabase_client.table(self.table_name).select('*')
                for key, value in query.items():
                    qb = qb.eq(key, value)
                
                response = qb.limit(1).execute()
                if response.data and len(response.data) > 0:
                    return response.data[0]
                return None
            except Exception as e:
                logger.error(f"Supabase find_one error on {self.table_name}: {e}")
                return None

        async def find(self, query: dict = None):
            """Find all documents matching query"""
            try:
                qb = supabase_client.table(self.table_name).select('*')
                if query:
                    for key, value in query.items():
                        qb = qb.eq(key, value)
                
                response = qb.execute()
                return response.data or []
            except Exception as e:
                logger.error(f"Supabase find error on {self.table_name}: {e}")
                return []

        async def insert_one(self, document: dict):
            """Insert single document"""
            try:
                # Convert datetime to ISO string for JSON serialization
                doc = {}
                for k, v in document.items():
                    if isinstance(v, datetime):
                        doc[k] = v.isoformat()
                    else:
                        doc[k] = v
                
                response = supabase_client.table(self.table_name).insert(doc).execute()
                return type('obj', (object,), {'inserted_id': doc.get('id', str(uuid.uuid4()))})()
            except Exception as e:
                logger.error(f"Supabase insert_one error on {self.table_name}: {e}")
                raise

        async def update_one(self, query: dict, update: dict):
            """Update single document matching query"""
            try:
                # Build query
                qb = supabase_client.table(self.table_name).update(update.get('$set', update))
                for key, value in query.items():
                    qb = qb.eq(key, value)
                
                response = qb.execute()
                modified = len(response.data) if response.data else 0
                return type('obj', (object,), {'modified_count': modified})()
            except Exception as e:
                logger.error(f"Supabase update_one error on {self.table_name}: {e}")
                return type('obj', (object,), {'modified_count': 0})()

        async def delete_one(self, query: dict):
            """Delete single document matching query"""
            try:
                qb = supabase_client.table(self.table_name).delete()
                for key, value in query.items():
                    qb = qb.eq(key, value)
                
                response = qb.execute()
                deleted = len(response.data) if response.data else 0
                return type('obj', (object,), {'deleted_count': deleted})()
            except Exception as e:
                logger.error(f"Supabase delete_one error on {self.table_name}: {e}")
                return type('obj', (object,), {'deleted_count': 0})()

        async def count_documents(self, query: dict = None):
            """Count documents matching query"""
            try:
                qb = supabase_client.table(self.table_name).select('*', count='exact')
                if query:
                    for key, value in query.items():
                        qb = qb.eq(key, value)
                
                response = qb.execute()
                return response.count or 0
            except Exception as e:
                logger.error(f"Supabase count_documents error on {self.table_name}: {e}")
                return 0

        async def create_index(self, key: str, unique: bool = False):
            """No-op for Supabase (indexes managed in Supabase dashboard)"""
            pass

    class SupabaseDB:
        """Mock MongoDB database using Supabase tables"""
        def __init__(self, client: Client):
            self._client = client
            self._tables = {}

        def __getitem__(self, name: str):
            if name not in self._tables:
                self._tables[name] = SupabaseCollection(name)
            return self._tables[name]

        def __getattr__(self, name: str):
            return self[name]

    # Replace mongo_db with Supabase wrapper
    mongo_db = SupabaseDB(supabase_client)
    logger.info("✅ Supabase database abstraction layer initialized")

# Auth utilities
from passlib.context import CryptContext
import jwt

JWT_SECRET = os.environ.get('JWT_SECRET', 'hwh-secret-key')
JWT_ALGORITHM = os.environ.get('JWT_ALGORITHM', 'HS256')
ACCESS_TOKEN_EXPIRE_HOURS = 24

# Coach verification setting (default: true - requires admin approval)
REQUIRE_COACH_VERIFICATION = os.environ.get('REQUIRE_COACH_VERIFICATION', 'true').lower() == 'true'

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi import status

security = HTTPBearer(auto_error=True)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash. Supports both bcrypt hashes and PLAIN: prefixed passwords."""
    # Log the values for debugging (remove in production after fixing)
    logger.info(f"🔐 verify_password called")
    logger.info(f"   Input password length: {len(plain_password)}")
    logger.info(f"   Stored hash starts with: {hashed_password[:30] if hashed_password else 'EMPTY'}...")
    
    if not hashed_password:
        logger.warning("   ⚠️ Empty hashed_password provided")
        return False
    
    # Handle PLAIN: prefixed passwords (for admin setup/debugging)
    if hashed_password.startswith("PLAIN:"):
        stored_plain = hashed_password[6:]  # Remove "PLAIN:" prefix
        logger.info(f"   Using PLAIN comparison (stored plain length: {len(stored_plain)})")
        result = plain_password == stored_plain
        logger.info(f"   PLAIN comparison result: {result}")
        return result
    
    # Normal bcrypt verification
    try:
        result = pwd_context.verify(plain_password, hashed_password)
        logger.info(f"   Bcrypt verification result: {result}")
        return result
    except Exception as e:
        logger.error(f"   ❌ Bcrypt verification error: {e}")
        return False


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    return decode_token(credentials.credentials)


async def require_editor(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") not in ["admin", "editor"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Editor access required")
    return current_user


# Pydantic models
class IntakeFormCreate(BaseModel):
    player_name: str = Field(..., min_length=1)
    preferred_name: Optional[str] = None
    dob: Optional[str] = None
    grad_class: str
    gender: str
    school: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    primary_position: str
    secondary_position: Optional[str] = None
    jersey_number: Optional[str] = None
    height: Optional[str] = None
    weight: Optional[str] = None
    parent_name: str = Field(..., min_length=1)
    parent_email: EmailStr
    parent_phone: Optional[str] = None
    player_email: Optional[str] = None
    level: Optional[str] = None
    team_names: Optional[str] = None
    league_region: Optional[str] = None
    games_played: Optional[int] = None
    ppg: Optional[float] = None
    apg: Optional[float] = None
    rpg: Optional[float] = None
    spg: Optional[float] = None
    bpg: Optional[float] = None
    fg_pct: Optional[float] = None
    three_pct: Optional[float] = None
    ft_pct: Optional[float] = None
    self_words: Optional[str] = None
    strength: Optional[str] = None
    improvement: Optional[str] = None
    separation: Optional[str] = None
    adversity_response: Optional[str] = None
    iq_self_rating: Optional[str] = None
    pride_tags: Optional[List[str]] = None
    player_model: Optional[str] = None
    film_links: Optional[List[str]] = None
    highlight_links: Optional[List[str]] = None
    instagram_handle: Optional[str] = None
    other_socials: Optional[str] = None
    goal: Optional[str] = None
    colleges_interest: Optional[str] = None
    package_selected: str
    consent_eval: bool = False
    consent_media: bool = False
    guardian_signature: str
    signature_date: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    name: str
    role: str = "viewer"


class ProjectUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None


class DeliverableUpdate(BaseModel):
    status: Optional[str] = None
    file_url: Optional[str] = None


# ============ HEALTH CHECK ============

@api_router.get("/")
async def root():
    return {"message": "HWH Player Advantage™ API", "status": "running", "mode": "supabase" if USE_SUPABASE else "mongodb"}


@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat(), "database": "supabase" if USE_SUPABASE else "mongodb"}


@api_router.get("/health/db")
async def health_check_detailed():
    """Detailed health check with database connectivity and user counts."""
    db_status = "connected"
    db_error = None
    staff_count = 0
    coach_count = 0
    
    try:
        # Check MongoDB connection
        await mongo_client.admin.command('ping')
        staff_count = await mongo_db.staff_users.count_documents({})
        coach_count = await mongo_db.coaches.count_documents({})
    except Exception as e:
        db_status = "error"
        db_error = str(e)
    
    return {
        "status": "healthy" if db_status == "connected" else "degraded",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "database": {
            "type": "supabase" if USE_SUPABASE else "mongodb",
            "status": db_status,
            "error": db_error,
            "mongo_url_configured": bool(os.environ.get('MONGO_URL')),
            "database_url_configured": bool(os.environ.get('DATABASE_URL') and 'YOUR_PASSWORD' not in os.environ.get('DATABASE_URL', ''))
        },
        "users": {
            "staff_users": staff_count,
            "coaches": coach_count,
            "total": staff_count + coach_count
        },
        "environment": {
            "email_provider": os.environ.get('EMAIL_PROVIDER', 'mock'),
            "require_coach_verification": REQUIRE_COACH_VERIFICATION,
            "stripe_configured": bool(STRIPE_API_KEY and 'your_stripe' not in (STRIPE_API_KEY or ''))
        }
    }


@api_router.get("/debug/auth-check")
async def debug_auth_check(email: str = "admin@hoopwithher.com"):
    """
    Debug endpoint to check user data without password verification.
    Use this to verify database connectivity and user field structure.
    """
    try:
        logger.info(f"🔍 Debug auth check for: {email}")
        
        # Try to find user
        user = await mongo_db.staff_users.find_one({"email": email})
        
        if not user:
            return {
                "found": False,
                "message": f"No user found with email: {email}",
                "suggestion": "Check if user exists in Supabase dashboard"
            }
        
        # Return user data (with password hash masked for security)
        safe_user = {k: v for k, v in user.items()}
        if "password_hash" in safe_user:
            ph = safe_user["password_hash"]
            if ph.startswith("PLAIN:"):
                safe_user["password_hash"] = f"PLAIN:****{ph[-4:]}"
            else:
                safe_user["password_hash"] = f"bcrypt:{ph[:20]}..."
        
        # Also try to get all users to verify table access
        all_users = await mongo_db.staff_users.find({})
        user_count = len(all_users) if isinstance(all_users, list) else "unknown"
        
        return {
            "found": True,
            "user": safe_user,
            "total_staff_users": user_count,
            "database_type": "supabase" if USE_SUPABASE else "mongodb",
            "environment": {
                "supabase_url_configured": bool(os.environ.get('SUPABASE_URL')),
                "supabase_key_configured": bool(os.environ.get('SUPABASE_ANON_KEY')),
                "database_url_configured": bool(DATABASE_URL and 'YOUR_PASSWORD' not in DATABASE_URL)
            }
        }
    except Exception as e:
        logger.error(f"Debug auth check error: {e}")
        logger.exception(e)
        return {
            "error": str(e),
            "type": type(e).__name__,
            "message": "Failed to query database"
        }


@api_router.get("/debug/login-test")
async def debug_login_test(email: str = "admin@hoopwithher.com", password: str = "AdminPass123!"):
    """
    Debug endpoint to test full login flow with detailed diagnostics.
    WARNING: Only use in development/debugging!
    """
    logger.info(f"🔍 Debug login test for: {email}")
    
    try:
        # Step 1: Find user
        user = await mongo_db.staff_users.find_one({"email": email})
        if not user:
            return {"step": "find_user", "success": False, "error": "User not found"}
        
        # Step 2: Check password field exists
        password_hash = user.get("password_hash")
        if not password_hash:
            return {
                "step": "check_password_field",
                "success": False,
                "user_keys": list(user.keys()),
                "error": "password_hash field is missing or empty"
            }
        
        # Step 3: Check password format
        is_plain = password_hash.startswith("PLAIN:")
        is_bcrypt = password_hash.startswith(("$2a$", "$2b$", "$2y$"))
        
        # Step 4: Attempt verification
        try:
            password_valid = verify_password(password, password_hash)
        except Exception as verify_err:
            return {
                "step": "verify_password",
                "success": False,
                "password_format": "plain" if is_plain else ("bcrypt" if is_bcrypt else "unknown"),
                "hash_prefix": password_hash[:10],
                "error": str(verify_err)
            }
        
        return {
            "step": "complete",
            "success": password_valid,
            "password_format": "plain" if is_plain else ("bcrypt" if is_bcrypt else "unknown"),
            "hash_prefix": password_hash[:10] if password_hash else None,
            "user_found": True,
            "user_id": user.get("id"),
            "user_email": user.get("email"),
            "user_role": user.get("role"),
            "is_active": user.get("is_active", True),
            "input_password_length": len(password)
        }
    except Exception as e:
        logger.error(f"Debug login test error: {e}")
        logger.exception(e)
        return {"step": "unexpected", "success": False, "error": str(e)}


@api_router.post("/auth/setup")
async def setup_admin():
    """Create initial admin user if no users exist. Only works when database is empty."""
    try:
        staff_count = await mongo_db.staff_users.count_documents({})
        
        if staff_count > 0:
            return {
                "message": "Setup already complete",
                "existing_users": staff_count,
                "note": "Admin user already exists. Use /auth/login to authenticate."
            }
        
        # Create default admin user
        admin_user = {
            "id": str(uuid.uuid4()),
            "email": "admin@hoopwithher.com",
            "password_hash": hash_password("AdminPass123!"),
            "name": "System Administrator",
            "role": "admin",
            "is_active": True,
            "is_verified": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await mongo_db.staff_users.insert_one(admin_user)
        
        return {
            "message": "Initial admin user created successfully",
            "admin_email": "admin@hoopwithher.com",
            "admin_password": "AdminPass123!",
            "warning": "Change this password immediately after first login!"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Setup failed: {str(e)}")


# ============ AUTH ROUTES ============

@api_router.post("/auth/login")
async def login(request: LoginRequest):
    logger.info(f"🔍 Login attempt for email: {request.email}")
    
    try:
        # Note: Supabase wrapper doesn't support projection, so we get all fields
        user = await mongo_db.staff_users.find_one({"email": request.email})
        
        if not user:
            logger.warning(f"   ❌ User not found: {request.email}")
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        logger.info(f"   ✅ User found: {user.get('email')}, ID: {user.get('id')}")
        logger.info(f"   User keys: {list(user.keys())}")
        
        # Check if password_hash exists
        password_hash = user.get("password_hash")
        if not password_hash:
            logger.error(f"   ❌ User has no password_hash field!")
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        logger.info(f"   Password hash type: {password_hash[:10]}...")
        
        # Verify password
        password_valid = verify_password(request.password, password_hash)
        
        if not password_valid:
            logger.warning(f"   ❌ Password verification failed for: {request.email}")
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        logger.info(f"   ✅ Password verified for: {request.email}")
        
        if not user.get("is_active", True):
            logger.warning(f"   ❌ Account disabled: {request.email}")
            raise HTTPException(status_code=401, detail="Account is disabled")
        
        token = create_access_token({
            "sub": user["id"],
            "email": user["email"],
            "role": user.get("role", "viewer"),
            "name": user.get("name", "")
        })
        
        logger.info(f"   ✅ Login successful for: {request.email}")
        
        return {
            "token": token,
            "user": {
                "id": user["id"],
                "email": user["email"],
                "name": user.get("name"),
                "role": user.get("role", "viewer")
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"   ❌ Unexpected login error: {e}")
        logger.exception(e)
        raise HTTPException(status_code=500, detail=f"Login error: {str(e)}")


@api_router.post("/auth/register")
async def register(request: RegisterRequest):
    # Check if email exists
    existing = await mongo_db.staff_users.find_one({"email": request.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user = {
        "id": str(uuid.uuid4()),
        "email": request.email,
        "password_hash": hash_password(request.password),
        "name": request.name,
        "role": request.role,
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await mongo_db.staff_users.insert_one(user)
    
    return {
        "id": user["id"],
        "email": user["email"],
        "name": user["name"],
        "role": user["role"],
        "is_active": user["is_active"]
    }


@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    user = await mongo_db.staff_users.find_one({"id": current_user["sub"]}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


# ============ PASSWORD RESET ROUTES ============

class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8)


@api_router.post("/auth/forgot-password")
async def forgot_password(request: ForgotPasswordRequest, background_tasks: BackgroundTasks):
    """Send password reset email to user."""
    # Check both staff_users and coach_users collections
    user = None
    user_type = None
    user_collection = None

    # Try staff_users first
    staff_user = await mongo_db.staff_users.find_one({"email": request.email})
    if staff_user:
        user = staff_user
        user_type = "staff"
        user_collection = "staff_users"
    else:
        # Try coach_users
        coach_user = await mongo_db.coach_users.find_one({"email": request.email})
        if coach_user:
            user = coach_user
            user_type = "coach"
            user_collection = "coach_users"
        else:
            # Try coaches collection (new coach registration collection)
            coach = await mongo_db.coaches.find_one({"email": request.email})
            if coach:
                user = coach
                user_type = "coach"
                user_collection = "coaches"

    if not user:
        # Return success even if user not found (security best practice)
        return {"message": "If an account exists with this email, a password reset link has been sent."}

    # Generate reset token (valid for 1 hour)
    reset_token = str(uuid.uuid4())
    expires_at = (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat()

    # Store reset token
    reset_record = {
        "id": str(uuid.uuid4()),
        "token": reset_token,
        "user_id": user["id"],
        "user_type": user_type,
        "user_collection": user_collection,
        "email": request.email,
        "expires_at": expires_at,
        "used": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await mongo_db.password_reset_tokens.insert_one(reset_record)

    # Generate reset URL
    reset_url = f"{os.environ.get('FRONTEND_URL', 'https://app.elitegbb.com')}/reset-password?token={reset_token}"

    # Send reset email
    html_body, text_body = EmailTemplates.password_reset(
        reset_url=reset_url,
        user_name=user.get("name")
    )
    background_tasks.add_task(
        send_email_with_logging,
        to_email=request.email,
        subject="Reset Your Password - Hoop With Her Player Advantage™",
        html_body=html_body,
        text_body=text_body,
        email_type="password_reset"
    )

    return {"message": "If an account exists with this email, a password reset link has been sent."}


@api_router.post("/auth/reset-password")
async def reset_password(request: ResetPasswordRequest):
    """Reset user password using valid token."""
    # Find valid token
    reset_record = await mongo_db.password_reset_tokens.find_one({
        "token": request.token,
        "used": False,
        "expires_at": {"$gt": datetime.now(timezone.utc).isoformat()}
    })

    if not reset_record:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    # Hash new password
    new_password_hash = hash_password(request.new_password)

    # Update user's password
    collection_name = reset_record["user_collection"]
    await mongo_db[collection_name].update_one(
        {"id": reset_record["user_id"]},
        {"$set": {"password_hash": new_password_hash, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )

    # Mark token as used
    await mongo_db.password_reset_tokens.update_one(
        {"id": reset_record["id"]},
        {"$set": {"used": True, "used_at": datetime.now(timezone.utc).isoformat()}}
    )

    return {"message": "Password has been reset successfully. You can now log in with your new password."}


# ============ INTAKE ROUTES ============

def generate_player_key(name: str, grad_class: str, dob: Optional[str]) -> str:
    dob_part = dob if dob else "unknown"
    return f"{name.lower().strip()}|{grad_class}|{dob_part}"


async def send_email_with_logging(
    to_email: str,
    subject: str,
    html_body: str,
    text_body: str = None,
    email_type: str = "general",
    reply_to: str = None,
    tags: dict = None
):
    """Send email using configured provider and log result."""
    provider = get_provider()
    
    result = await provider.send_email(
        to_email=to_email,
        subject=subject,
        html_body=html_body,
        text_body=text_body,
        reply_to=reply_to,
        tags=tags
    )
    
    # Log to database
    email_log = {
        "id": str(uuid.uuid4()),
        "recipient_email": to_email,
        "subject": subject,
        "email_type": email_type,
        "status": "sent" if result.get("success") else "failed",
        "provider": result.get("provider", "unknown"),
        "message_id": result.get("message_id"),
        "error_message": result.get("error"),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await mongo_db.email_logs.insert_one(email_log)
    
    return result


async def mock_send_email(recipient: str, subject: str, email_type: str):
    """Legacy mock email function - now uses provider abstraction."""
    html_body = f"<p>{subject}</p>"
    await send_email_with_logging(
        to_email=recipient,
        subject=subject,
        html_body=html_body,
        text_body=subject,
        email_type=email_type
    )


@api_router.post("/intake")
async def submit_intake(form: IntakeFormCreate, request: Request, background_tasks: BackgroundTasks):
    """Submit public intake form."""
    now = datetime.now(timezone.utc)
    
    # Parse DOB
    dob_datetime = None
    if form.dob:
        try:
            dob_datetime = datetime.fromisoformat(form.dob.replace('Z', '+00:00'))
        except:
            pass
    
    # Generate player key
    player_key = generate_player_key(form.player_name, form.grad_class, form.dob)
    
    # Check if player exists
    player = await mongo_db.players.find_one({"player_key": player_key}, {"_id": 0})
    
    if not player:
        # Create new player
        player = {
            "id": str(uuid.uuid4()),
            "player_key": player_key,
            "player_name": form.player_name,
            "preferred_name": form.preferred_name,
            "dob": dob_datetime.isoformat() if dob_datetime else None,
            "grad_class": form.grad_class,
            "gender": form.gender,
            "school": form.school,
            "city": form.city,
            "state": form.state,
            "primary_position": form.primary_position,
            "secondary_position": form.secondary_position,
            "jersey_number": form.jersey_number,
            "height": form.height,
            "weight": form.weight,
            "verified": False,
            "created_at": now.isoformat(),
            "updated_at": now.isoformat()
        }
        await mongo_db.players.insert_one(player)
    
    player_id = player["id"]
    
    # Create intake submission
    submission = {
        "id": str(uuid.uuid4()),
        "player_id": player_id,
        "parent_name": form.parent_name,
        "parent_email": form.parent_email,
        "parent_phone": form.parent_phone,
        "player_email": form.player_email,
        "level": form.level,
        "team_names": form.team_names,
        "league_region": form.league_region,
        "games_played": form.games_played,
        "ppg": form.ppg,
        "apg": form.apg,
        "rpg": form.rpg,
        "spg": form.spg,
        "bpg": form.bpg,
        "fg_pct": form.fg_pct,
        "three_pct": form.three_pct,
        "ft_pct": form.ft_pct,
        "self_words": form.self_words,
        "strength": form.strength,
        "improvement": form.improvement,
        "separation": form.separation,
        "adversity_response": form.adversity_response,
        "iq_self_rating": form.iq_self_rating,
        "pride_tags": form.pride_tags,
        "player_model": form.player_model,
        "film_links": form.film_links,
        "highlight_links": form.highlight_links,
        "instagram_handle": form.instagram_handle,
        "other_socials": form.other_socials,
        "goal": form.goal,
        "colleges_interest": form.colleges_interest,
        "package_selected": form.package_selected,
        "consent_eval": form.consent_eval,
        "consent_media": form.consent_media,
        "guardian_signature": form.guardian_signature,
        "signature_date": now.isoformat(),
        "created_at": now.isoformat()
    }
    await mongo_db.intake_submissions.insert_one(submission)
    
    # Create project
    project = {
        "id": str(uuid.uuid4()),
        "player_id": player_id,
        "intake_submission_id": submission["id"],
        "status": "requested",
        "package_type": form.package_selected,
        "notes": None,
        "payment_status": "pending",
        "payment_session_id": None,
        "amount_paid": None,
        "created_at": now.isoformat(),
        "updated_at": now.isoformat()
    }
    await mongo_db.projects.insert_one(project)
    
    # Create default deliverables based on package
    deliverable_types = ["one_pager", "verified_badge"]
    if form.package_selected in ["development", "elite_track"]:
        deliverable_types.extend(["tracking_profile", "film_index"])
    if form.package_selected == "elite_track":
        deliverable_types.extend(["referral_note", "mid_season_update", "end_season_update"])
    
    for dt in deliverable_types:
        deliverable = {
            "id": str(uuid.uuid4()),
            "project_id": project["id"],
            "deliverable_type": dt,
            "status": "pending",
            "file_url": None,
            "created_at": now.isoformat(),
            "updated_at": now.isoformat()
        }
        await mongo_db.deliverables.insert_one(deliverable)
    
    # Create reminders
    reminder_mid = {
        "id": str(uuid.uuid4()),
        "project_id": project["id"],
        "reminder_type": "mid_season_update",
        "scheduled_date": (now + timedelta(days=45)).isoformat(),
        "sent": False,
        "sent_at": None,
        "created_at": now.isoformat()
    }
    reminder_coach = {
        "id": str(uuid.uuid4()),
        "project_id": project["id"],
        "reminder_type": "coach_followup",
        "scheduled_date": (now + timedelta(days=90)).isoformat(),
        "sent": False,
        "sent_at": None,
        "created_at": now.isoformat()
    }
    await mongo_db.reminders.insert_one(reminder_mid)
    await mongo_db.reminders.insert_one(reminder_coach)
    
    # Generate payment URL
    payment_url = None
    if STRIPE_API_KEY:
        try:
            from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionRequest
            
            host_url = str(request.base_url).rstrip('/')
            webhook_url = f"{host_url}/api/webhook/stripe"
            stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
            
            origin = request.headers.get('origin', host_url)
            success_url = f"{origin}/success?session_id={{CHECKOUT_SESSION_ID}}"
            cancel_url = f"{origin}/intake"
            
            amount = PACKAGES.get(form.package_selected, 99.00)
            
            checkout_request = CheckoutSessionRequest(
                amount=amount,
                currency="usd",
                success_url=success_url,
                cancel_url=cancel_url,
                metadata={
                    "intake_submission_id": submission["id"],
                    "player_id": player_id,
                    "package": form.package_selected
                }
            )
            
            session = await stripe_checkout.create_checkout_session(checkout_request)
            payment_url = session.url
            
            # Create payment transaction record
            payment_tx = {
                "id": str(uuid.uuid4()),
                "session_id": session.session_id,
                "player_id": player_id,
                "intake_submission_id": submission["id"],
                "amount": amount,
                "currency": "usd",
                "package_type": form.package_selected,
                "status": "initiated",
                "payment_status": "pending",
                "created_at": now.isoformat(),
                "updated_at": now.isoformat()
            }
            await mongo_db.payment_transactions.insert_one(payment_tx)
            
        except Exception as e:
            logger.error(f"Stripe checkout error: {e}")
    
    # Send branded confirmation email to parent
    html_body, text_body = EmailTemplates.intake_confirmation(
        player_name=form.player_name,
        package=form.package_selected,
        parent_name=form.parent_name
    )
    background_tasks.add_task(
        send_email_with_logging,
        to_email=form.parent_email,
        subject=f"HWH Player Advantage™ - Submission Received for {form.player_name}",
        html_body=html_body,
        text_body=text_body,
        email_type="confirmation"
    )
    
    # Send staff notification
    staff_html, staff_text = EmailTemplates.staff_notification(
        player_name=form.player_name,
        package=form.package_selected,
        parent_email=form.parent_email
    )
    background_tasks.add_task(
        send_email_with_logging,
        to_email="team@hoopwithher.com",
        subject=f"New Submission: {form.player_name} - {form.package_selected.replace('_', ' ').title()}",
        html_body=staff_html,
        text_body=staff_text,
        email_type="staff_notification"
    )
    
    return {
        "id": submission["id"],
        "player_id": player_id,
        "player_name": form.player_name,
        "parent_email": form.parent_email,
        "package_selected": form.package_selected,
        "created_at": submission["created_at"],
        "payment_url": payment_url
    }


# ============ PAYMENT ROUTES ============

@api_router.post("/payments/checkout")
async def create_checkout_session(request: Request, data: dict):
    if not STRIPE_API_KEY:
        raise HTTPException(status_code=500, detail="Payment system not configured")
    
    submission = await mongo_db.intake_submissions.find_one(
        {"id": data.get("intake_submission_id")}, {"_id": 0}
    )
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    try:
        from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionRequest
        
        host_url = str(request.base_url).rstrip('/')
        webhook_url = f"{host_url}/api/webhook/stripe"
        stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
        
        origin_url = data.get("origin_url", host_url)
        success_url = f"{origin_url}/success?session_id={{CHECKOUT_SESSION_ID}}"
        cancel_url = f"{origin_url}/intake"
        
        amount = PACKAGES.get(submission.get("package_selected"), 99.00)
        
        checkout_request = CheckoutSessionRequest(
            amount=amount,
            currency="usd",
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={
                "intake_submission_id": submission["id"],
                "player_id": submission.get("player_id"),
                "package": submission.get("package_selected")
            }
        )
        
        session = await stripe_checkout.create_checkout_session(checkout_request)
        
        # Create payment transaction record
        payment_tx = {
            "id": str(uuid.uuid4()),
            "session_id": session.session_id,
            "player_id": submission.get("player_id"),
            "intake_submission_id": submission["id"],
            "amount": amount,
            "currency": "usd",
            "package_type": submission.get("package_selected"),
            "status": "initiated",
            "payment_status": "pending",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await mongo_db.payment_transactions.insert_one(payment_tx)
        
        return {"url": session.url, "session_id": session.session_id}
        
    except Exception as e:
        logger.error(f"Stripe checkout error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/payments/status/{session_id}")
async def get_payment_status(session_id: str):
    if not STRIPE_API_KEY:
        raise HTTPException(status_code=500, detail="Payment system not configured")
    
    try:
        from emergentintegrations.payments.stripe.checkout import StripeCheckout
        
        stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url="")
        status = await stripe_checkout.get_checkout_status(session_id)
        
        # Update payment transaction
        payment_tx = await mongo_db.payment_transactions.find_one({"session_id": session_id})
        
        if payment_tx:
            await mongo_db.payment_transactions.update_one(
                {"session_id": session_id},
                {"$set": {"status": status.status, "payment_status": status.payment_status, "updated_at": datetime.now(timezone.utc).isoformat()}}
            )
            
            # If paid, update project status
            if status.payment_status == "paid":
                await mongo_db.projects.update_one(
                    {"intake_submission_id": payment_tx.get("intake_submission_id")},
                    {"$set": {"payment_status": "paid", "payment_session_id": session_id, "amount_paid": status.amount_total / 100}}
                )
        
        return {
            "status": status.status,
            "payment_status": status.payment_status,
            "amount_total": status.amount_total,
            "currency": status.currency,
            "metadata": status.metadata
        }
        
    except Exception as e:
        logger.error(f"Payment status error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    if not STRIPE_API_KEY:
        return {"status": "not configured"}
    
    try:
        from emergentintegrations.payments.stripe.checkout import StripeCheckout
        
        body = await request.body()
        signature = request.headers.get("Stripe-Signature")
        
        stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url="")
        webhook_response = await stripe_checkout.handle_webhook(body, signature)
        
        if webhook_response.session_id:
            await mongo_db.payment_transactions.update_one(
                {"session_id": webhook_response.session_id},
                {"$set": {"status": webhook_response.event_type, "payment_status": webhook_response.payment_status}}
            )
        
        return {"status": "received", "event_type": webhook_response.event_type}
        
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        return {"status": "error", "message": str(e)}


# ============ ADMIN ROUTES ============

@api_router.get("/admin/stats")
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    total_players = await mongo_db.players.count_documents({})
    total_projects = await mongo_db.projects.count_documents({})
    
    projects_by_status = {}
    for status in ["requested", "in_review", "drafting", "design", "delivered"]:
        projects_by_status[status] = await mongo_db.projects.count_documents({"status": status})
    
    week_ago = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
    recent_submissions = await mongo_db.intake_submissions.count_documents({"created_at": {"$gte": week_ago}})
    
    packages_breakdown = {}
    for pkg in ["starter", "development", "elite_track"]:
        packages_breakdown[pkg] = await mongo_db.projects.count_documents({"package_type": pkg})
    
    return {
        "total_players": total_players,
        "total_projects": total_projects,
        "projects_by_status": projects_by_status,
        "recent_submissions": recent_submissions,
        "packages_breakdown": packages_breakdown
    }


@api_router.get("/admin/players")
async def list_players(
    page: int = 1,
    page_size: int = 20,
    grad_class: Optional[str] = None,
    school: Optional[str] = None,
    position: Optional[str] = None,
    gender: Optional[str] = None,
    verified: Optional[str] = None,
    search: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    if grad_class:
        query["grad_class"] = grad_class
    if school:
        query["school"] = {"$regex": school, "$options": "i"}
    if position:
        query["$or"] = [{"primary_position": position}, {"secondary_position": position}]
    if gender:
        query["gender"] = gender
    if verified:
        query["verified"] = verified == "true"
    if search:
        query["$or"] = [
            {"player_name": {"$regex": search, "$options": "i"}},
            {"school": {"$regex": search, "$options": "i"}},
            {"city": {"$regex": search, "$options": "i"}}
        ]
    
    total = await mongo_db.players.count_documents(query)
    skip = (page - 1) * page_size
    
    players = await mongo_db.players.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(page_size).to_list(page_size)
    
    return {
        "players": players,
        "total": total,
        "page": page,
        "page_size": page_size
    }


@api_router.get("/admin/players/{player_id}")
async def get_player(player_id: str, current_user: dict = Depends(get_current_user)):
    player = await mongo_db.players.find_one({"id": player_id}, {"_id": 0})
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    return player


@api_router.patch("/admin/players/{player_id}/verify")
async def verify_player(player_id: str, current_user: dict = Depends(require_editor)):
    player = await mongo_db.players.find_one({"id": player_id})
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    
    new_verified = not player.get("verified", False)
    await mongo_db.players.update_one({"id": player_id}, {"$set": {"verified": new_verified}})
    
    return {"verified": new_verified}


# ============ PROJECT ROUTES ============

@api_router.get("/admin/projects")
async def list_projects(status: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {}
    if status:
        query["status"] = status
    
    projects = await mongo_db.projects.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    
    # Enrich with player info
    for project in projects:
        player = await mongo_db.players.find_one({"id": project.get("player_id")}, {"_id": 0})
        project["player"] = player
    
    return projects


@api_router.get("/admin/projects/{project_id}")
async def get_project(project_id: str, current_user: dict = Depends(get_current_user)):
    project = await mongo_db.projects.find_one({"id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    player = await mongo_db.players.find_one({"id": project.get("player_id")}, {"_id": 0})
    intake = await mongo_db.intake_submissions.find_one({"id": project.get("intake_submission_id")}, {"_id": 0})
    deliverables = await mongo_db.deliverables.find({"project_id": project_id}, {"_id": 0}).to_list(100)
    reminders = await mongo_db.reminders.find({"project_id": project_id}, {"_id": 0}).to_list(100)
    
    project["player"] = player
    project["intake_submission"] = intake
    project["deliverables"] = deliverables
    project["reminders"] = reminders
    
    return project


@api_router.patch("/admin/projects/{project_id}")
async def update_project(project_id: str, update: ProjectUpdate, current_user: dict = Depends(require_editor)):
    project = await mongo_db.projects.find_one({"id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    update_data = {"updated_at": datetime.now(timezone.utc).isoformat()}
    if update.status:
        update_data["status"] = update.status
    if update.notes is not None:
        update_data["notes"] = update.notes
    
    await mongo_db.projects.update_one({"id": project_id}, {"$set": update_data})
    
    return {"id": project_id, "status": update.status or project.get("status"), "notes": update.notes if update.notes is not None else project.get("notes")}


# ============ DELIVERABLE ROUTES ============

@api_router.get("/admin/deliverables/{deliverable_id}")
async def get_deliverable(deliverable_id: str, current_user: dict = Depends(get_current_user)):
    deliverable = await mongo_db.deliverables.find_one({"id": deliverable_id}, {"_id": 0})
    if not deliverable:
        raise HTTPException(status_code=404, detail="Deliverable not found")
    return deliverable


@api_router.patch("/admin/deliverables/{deliverable_id}")
async def update_deliverable(deliverable_id: str, update: DeliverableUpdate, current_user: dict = Depends(require_editor)):
    deliverable = await mongo_db.deliverables.find_one({"id": deliverable_id})
    if not deliverable:
        raise HTTPException(status_code=404, detail="Deliverable not found")
    
    update_data = {"updated_at": datetime.now(timezone.utc).isoformat()}
    if update.status:
        update_data["status"] = update.status
    if update.file_url is not None:
        update_data["file_url"] = update.file_url
    
    await mongo_db.deliverables.update_one({"id": deliverable_id}, {"$set": update_data})
    
    return {"id": deliverable_id, "status": update.status or deliverable.get("status"), "file_url": update.file_url if update.file_url is not None else deliverable.get("file_url")}


@api_router.post("/admin/projects/{project_id}/generate/{deliverable_type}")
async def generate_deliverable(project_id: str, deliverable_type: str, current_user: dict = Depends(require_editor)):
    project = await mongo_db.projects.find_one({"id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    deliverable = await mongo_db.deliverables.find_one({"project_id": project_id, "deliverable_type": deliverable_type})
    
    now = datetime.now(timezone.utc).isoformat()
    
    if not deliverable:
        deliverable = {
            "id": str(uuid.uuid4()),
            "project_id": project_id,
            "deliverable_type": deliverable_type,
            "status": "pending",
            "file_url": None,
            "created_at": now,
            "updated_at": now
        }
        await mongo_db.deliverables.insert_one(deliverable)
    
    # Mock PDF generation
    mock_url = f"https://mock-storage.hwh.com/deliverables/{project_id}/{deliverable_type}.pdf"
    
    await mongo_db.deliverables.update_one(
        {"id": deliverable["id"]},
        {"$set": {"status": "complete", "file_url": mock_url, "updated_at": now}}
    )
    
    return {
        "id": deliverable["id"],
        "deliverable_type": deliverable_type,
        "status": "complete",
        "file_url": mock_url,
        "message": f"[MOCK] {deliverable_type} generated successfully"
    }


# ============ EMAIL LOG ROUTES ============

@api_router.get("/admin/email-logs")
async def list_email_logs(page: int = 1, page_size: int = 50, current_user: dict = Depends(get_current_user)):
    skip = (page - 1) * page_size
    logs = await mongo_db.email_logs.find({}, {"_id": 0}).sort("created_at", -1).skip(skip).limit(page_size).to_list(page_size)
    return logs


# ============ ADMIN EXPORT ROUTES ============

class AdminExportRequest(BaseModel):
    export_type: str = "players"  # players, projects, submissions
    format: str = "csv"  # csv or json
    status_filter: Optional[str] = None
    grad_class_filter: Optional[str] = None


@api_router.post("/admin/export")
async def admin_export_data(
    request: AdminExportRequest,
    current_user: dict = Depends(get_current_user)
):
    """Export data for admin users."""
    export_data = []
    
    if request.export_type == "players":
        query = {}
        if request.grad_class_filter:
            query["grad_class"] = request.grad_class_filter
            
        players = await mongo_db.players.find(query, {"_id": 0}).to_list(1000)
        
        for player in players:
            intake = await mongo_db.intake_submissions.find_one(
                {"player_id": player["id"]},
                {"_id": 0, "parent_name": 1, "parent_email": 1, "parent_phone": 1,
                 "ppg": 1, "apg": 1, "rpg": 1, "level": 1, "team_names": 1}
            )
            
            row = {
                "id": player.get("id", ""),
                "player_name": player.get("player_name", ""),
                "grad_class": player.get("grad_class", ""),
                "gender": player.get("gender", ""),
                "school": player.get("school", ""),
                "city": player.get("city", ""),
                "state": player.get("state", ""),
                "primary_position": player.get("primary_position", ""),
                "height": player.get("height", ""),
                "verified": player.get("verified", False),
                "created_at": player.get("created_at", "")
            }
            
            if intake:
                row.update({
                    "parent_name": intake.get("parent_name", ""),
                    "parent_email": intake.get("parent_email", ""),
                    "parent_phone": intake.get("parent_phone", ""),
                    "ppg": intake.get("ppg", ""),
                    "apg": intake.get("apg", ""),
                    "rpg": intake.get("rpg", ""),
                    "level": intake.get("level", ""),
                    "team_names": intake.get("team_names", "")
                })
            
            export_data.append(row)
    
    elif request.export_type == "projects":
        query = {}
        if request.status_filter:
            query["status"] = request.status_filter
            
        projects = await mongo_db.projects.find(query, {"_id": 0}).to_list(1000)
        
        for project in projects:
            player = await mongo_db.players.find_one(
                {"id": project.get("player_id")},
                {"_id": 0, "player_name": 1, "grad_class": 1}
            )
            
            row = {
                "id": project.get("id", ""),
                "player_name": player.get("player_name", "") if player else "",
                "grad_class": player.get("grad_class", "") if player else "",
                "status": project.get("status", ""),
                "package_type": project.get("package_type", ""),
                "payment_status": project.get("payment_status", ""),
                "amount_paid": project.get("amount_paid", ""),
                "notes": project.get("notes", ""),
                "created_at": project.get("created_at", ""),
                "updated_at": project.get("updated_at", "")
            }
            
            export_data.append(row)
    
    elif request.export_type == "submissions":
        submissions = await mongo_db.intake_submissions.find({}, {"_id": 0}).to_list(1000)
        
        for sub in submissions:
            player = await mongo_db.players.find_one(
                {"id": sub.get("player_id")},
                {"_id": 0, "player_name": 1}
            )
            
            row = {
                "id": sub.get("id", ""),
                "player_name": player.get("player_name", "") if player else "",
                "parent_name": sub.get("parent_name", ""),
                "parent_email": sub.get("parent_email", ""),
                "parent_phone": sub.get("parent_phone", ""),
                "package_selected": sub.get("package_selected", ""),
                "level": sub.get("level", ""),
                "team_names": sub.get("team_names", ""),
                "created_at": sub.get("created_at", "")
            }
            
            export_data.append(row)
    
    if request.format == "json":
        return {
            "format": "json",
            "export_type": request.export_type,
            "count": len(export_data),
            "data": export_data,
            "exported_at": datetime.now(timezone.utc).isoformat()
        }
    else:
        # Generate CSV
        if not export_data:
            return {"format": "csv", "count": 0, "csv_content": "", "exported_at": datetime.now(timezone.utc).isoformat()}
        
        output = io.StringIO()
        fieldnames = list(export_data[0].keys())
        writer = csv.DictWriter(output, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(export_data)
        
        return {
            "format": "csv",
            "export_type": request.export_type,
            "count": len(export_data),
            "csv_content": output.getvalue(),
            "exported_at": datetime.now(timezone.utc).isoformat()
        }


# ============ COACH ROUTES ============

class CoachRegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    name: str
    school: str
    title: str = "Coach"
    state: Optional[str] = None


class CoachLoginRequest(BaseModel):
    email: EmailStr
    password: str


class SavedPlayerRequest(BaseModel):
    player_id: str
    notes: Optional[str] = None


class MessageCreate(BaseModel):
    recipient_type: str  # "hwh" or "coach"
    recipient_id: Optional[str] = None  # coach_id if coach-to-coach
    subject: str
    message: str
    player_id: Optional[str] = None  # reference to a player if applicable


class ComparePlayersRequest(BaseModel):
    player_ids: List[str]


class ExportRequest(BaseModel):
    player_ids: Optional[List[str]] = None  # None means export all saved
    format: str = "csv"  # csv or json


# ============ COACH SUBSCRIPTION ROUTES ============

@api_router.get("/coach/subscription/tiers")
async def get_subscription_tiers():
    """Get available subscription tiers."""
    return {"tiers": COACH_TIERS}


@api_router.post("/coach/subscription/checkout")
async def create_subscription_checkout(
    request: Request,
    tier: str,
    current_user: dict = Depends(get_current_user)
):
    """Create Stripe checkout for coach subscription."""
    if current_user.get("role") != "coach":
        raise HTTPException(status_code=403, detail="Coach access required")
    
    if tier not in COACH_TIERS:
        raise HTTPException(status_code=400, detail="Invalid subscription tier")
    
    if not STRIPE_API_KEY:
        raise HTTPException(status_code=500, detail="Payment system not configured")
    
    try:
        from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionRequest
        
        host_url = str(request.base_url).rstrip('/')
        webhook_url = f"{host_url}/api/webhook/stripe"
        stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
        
        origin = request.headers.get('origin', host_url)
        success_url = f"{origin}/coach/subscription/success?session_id={{CHECKOUT_SESSION_ID}}"
        cancel_url = f"{origin}/coach/subscription"
        
        tier_info = COACH_TIERS[tier]
        
        checkout_request = CheckoutSessionRequest(
            amount=tier_info["price"],
            currency="usd",
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={
                "coach_id": current_user["sub"],
                "tier": tier,
                "type": "coach_subscription"
            }
        )
        
        session = await stripe_checkout.create_checkout_session(checkout_request)
        
        return {"url": session.url, "session_id": session.session_id}
        
    except Exception as e:
        logger.error(f"Subscription checkout error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/coach/subscription/activate")
async def activate_subscription(
    session_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Activate subscription after successful payment."""
    if current_user.get("role") != "coach":
        raise HTTPException(status_code=403, detail="Coach access required")
    
    if not STRIPE_API_KEY:
        raise HTTPException(status_code=500, detail="Payment system not configured")
    
    try:
        from emergentintegrations.payments.stripe.checkout import StripeCheckout
        
        stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url="")
        status = await stripe_checkout.get_checkout_status(session_id)
        
        if status.payment_status != "paid":
            raise HTTPException(status_code=400, detail="Payment not completed")
        
        tier = status.metadata.get("tier", "basic")
        now = datetime.now(timezone.utc)
        
        # Update coach with subscription
        await mongo_db.coaches.update_one(
            {"id": current_user["sub"]},
            {"$set": {
                "subscription_tier": tier,
                "subscription_status": "active",
                "subscription_started": now.isoformat(),
                "subscription_expires": (now + timedelta(days=30)).isoformat(),
                "subscription_session_id": session_id
            }}
        )
        
        return {"status": "activated", "tier": tier}
        
    except Exception as e:
        logger.error(f"Subscription activation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/coach/subscription/status")
async def get_subscription_status(current_user: dict = Depends(get_current_user)):
    """Get current subscription status."""
    if current_user.get("role") != "coach":
        raise HTTPException(status_code=403, detail="Coach access required")
    
    coach = await mongo_db.coaches.find_one({"id": current_user["sub"]}, {"_id": 0})
    if not coach:
        raise HTTPException(status_code=404, detail="Coach not found")
    
    tier = coach.get("subscription_tier", "free")
    tier_info = COACH_TIERS.get(tier, {"name": "Free", "features": ["Browse verified prospects (limited)", "Save up to 5 players"]})
    
    return {
        "tier": tier,
        "tier_info": tier_info,
        "status": coach.get("subscription_status", "inactive"),
        "expires": coach.get("subscription_expires"),
        "features": tier_info.get("features", [])
    }


def get_coach_tier(coach: dict) -> str:
    """Get coach's current tier, checking expiration."""
    tier = coach.get("subscription_tier", "free")
    expires = coach.get("subscription_expires")
    
    if expires:
        try:
            exp_date = datetime.fromisoformat(expires.replace('Z', '+00:00'))
            if datetime.now(timezone.utc) > exp_date:
                return "free"  # Expired
        except:
            pass
    
    return tier


def can_access_feature(tier: str, feature: str) -> bool:
    """Check if tier has access to a feature."""
    feature_tiers = {
        "contact_info": ["premium", "elite"],
        "film_links": ["premium", "elite"],
        "messaging": ["elite"],
        "comparison": ["elite"],
        "export": ["premium", "elite"],
        "unlimited_saves": ["premium", "elite"]
    }
    return tier in feature_tiers.get(feature, ["basic", "premium", "elite"])


# ============ COACH MESSAGING ROUTES ============

@api_router.post("/coach/messages")
async def send_message(
    message: MessageCreate,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)
):
    """Send a message (Elite tier only for coach-to-coach)."""
    if current_user.get("role") != "coach":
        raise HTTPException(status_code=403, detail="Coach access required")
    
    coach = await mongo_db.coaches.find_one({"id": current_user["sub"]})
    tier = get_coach_tier(coach)
    
    # Elite required for messaging
    if not can_access_feature(tier, "messaging"):
        raise HTTPException(status_code=403, detail="Elite subscription required for messaging")
    
    now = datetime.now(timezone.utc)
    
    # Validate coach-to-coach messaging
    recipient_coach = None
    if message.recipient_type == "coach" and message.recipient_id:
        recipient_coach = await mongo_db.coaches.find_one({"id": message.recipient_id})
        if not recipient_coach:
            raise HTTPException(status_code=404, detail="Recipient coach not found")
        # Check if recipient is also Elite
        recipient_tier = get_coach_tier(recipient_coach)
        if not can_access_feature(recipient_tier, "messaging"):
            raise HTTPException(status_code=400, detail="Recipient coach must have Elite subscription to receive messages")
    
    # Get player info if referenced
    player_name = None
    if message.player_id:
        player = await mongo_db.players.find_one({"id": message.player_id}, {"_id": 0, "player_name": 1})
        if player:
            player_name = player.get("player_name")
    
    msg = {
        "id": str(uuid.uuid4()),
        "sender_id": current_user["sub"],
        "sender_type": "coach",
        "sender_name": current_user.get("name", ""),
        "sender_school": current_user.get("school", ""),
        "recipient_type": message.recipient_type,
        "recipient_id": message.recipient_id,
        "subject": message.subject,
        "message": message.message,
        "player_id": message.player_id,
        "player_name": player_name,
        "status": "sent",
        "read": False,
        "created_at": now.isoformat()
    }
    
    await mongo_db.messages.insert_one(msg)
    
    # Send email notification based on recipient type
    if message.recipient_type == "hwh":
        # Notify HWH staff
        html_body, text_body = EmailTemplates.coach_message_notification(
            sender_name=current_user.get("name", "Unknown Coach"),
            sender_school=current_user.get("school", "Unknown School"),
            subject=message.subject,
            preview=message.message
        )
        background_tasks.add_task(
            send_email_with_logging,
            to_email="coaches@hoopwithher.com",
            subject=f"Coach Message: {message.subject}",
            html_body=html_body,
            text_body=text_body,
            email_type="coach_message"
        )
    elif message.recipient_type == "coach" and recipient_coach:
        # Notify recipient coach
        html_body, text_body = EmailTemplates.coach_to_coach_message(
            sender_name=current_user.get("name", "Unknown Coach"),
            sender_school=current_user.get("school", "Unknown School"),
            subject=message.subject,
            message=message.message,
            player_name=player_name
        )
        background_tasks.add_task(
            send_email_with_logging,
            to_email=recipient_coach.get("email"),
            subject=f"Message from {current_user.get('name', 'A Coach')}: {message.subject}",
            html_body=html_body,
            text_body=text_body,
            email_type="coach_to_coach"
        )
    
    return {"id": msg["id"], "status": "sent"}


@api_router.get("/coach/messages")
async def get_messages(
    type: str = "inbox",  # inbox, sent
    current_user: dict = Depends(get_current_user)
):
    """Get coach messages."""
    if current_user.get("role") != "coach":
        raise HTTPException(status_code=403, detail="Coach access required")
    
    coach = await mongo_db.coaches.find_one({"id": current_user["sub"]})
    tier = get_coach_tier(coach)
    
    if not can_access_feature(tier, "messaging"):
        raise HTTPException(status_code=403, detail="Elite subscription required for messaging")
    
    if type == "inbox":
        query = {"recipient_id": current_user["sub"], "recipient_type": "coach"}
    else:
        query = {"sender_id": current_user["sub"]}
    
    messages = await mongo_db.messages.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    # Enrich with player info if applicable
    for msg in messages:
        if msg.get("player_id"):
            player = await mongo_db.players.find_one({"id": msg["player_id"]}, {"_id": 0, "player_name": 1, "grad_class": 1})
            msg["player"] = player
    
    return {"messages": messages, "total": len(messages)}


@api_router.patch("/coach/messages/{message_id}/read")
async def mark_message_read(
    message_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Mark message as read."""
    if current_user.get("role") != "coach":
        raise HTTPException(status_code=403, detail="Coach access required")
    
    await mongo_db.messages.update_one(
        {"id": message_id, "recipient_id": current_user["sub"]},
        {"$set": {"read": True, "read_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"status": "read"}


# ============ COACH-TO-COACH DISCOVERY ============

@api_router.get("/coach/elite-coaches")
async def get_elite_coaches(
    search: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get list of Elite coaches available for messaging."""
    if current_user.get("role") != "coach":
        raise HTTPException(status_code=403, detail="Coach access required")
    
    coach = await mongo_db.coaches.find_one({"id": current_user["sub"]})
    tier = get_coach_tier(coach)
    
    if not can_access_feature(tier, "messaging"):
        raise HTTPException(status_code=403, detail="Elite subscription required")
    
    # Find all verified Elite coaches except current user
    now = datetime.now(timezone.utc)
    query = {
        "id": {"$ne": current_user["sub"]},
        "is_verified": True,
        "subscription_tier": "elite"
    }
    
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"school": {"$regex": search, "$options": "i"}}
        ]
    
    coaches = await mongo_db.coaches.find(
        query, 
        {"_id": 0, "id": 1, "name": 1, "school": 1, "title": 1, "state": 1}
    ).to_list(50)
    
    # Filter out expired subscriptions
    valid_coaches = []
    for c in coaches:
        full_coach = await mongo_db.coaches.find_one({"id": c["id"]})
        if full_coach and get_coach_tier(full_coach) == "elite":
            valid_coaches.append(c)
    
    return {"coaches": valid_coaches, "total": len(valid_coaches)}


# ============ EXPORT FUNCTIONALITY ============

@api_router.post("/coach/export")
async def export_prospects(
    request: ExportRequest,
    current_user: dict = Depends(get_current_user)
):
    """Export saved prospects to CSV or JSON (Premium/Elite tier)."""
    if current_user.get("role") != "coach":
        raise HTTPException(status_code=403, detail="Coach access required")
    
    coach = await mongo_db.coaches.find_one({"id": current_user["sub"]})
    tier = get_coach_tier(coach)
    
    if not can_access_feature(tier, "export"):
        raise HTTPException(status_code=403, detail="Premium or Elite subscription required for export")
    
    # Get player IDs to export
    if request.player_ids:
        player_ids = request.player_ids
    else:
        # Export all saved players
        saved_players = coach.get("saved_players", [])
        player_ids = [sp.get("player_id") for sp in saved_players if sp.get("player_id")]
    
    if not player_ids:
        raise HTTPException(status_code=400, detail="No players to export")
    
    # Fetch player data
    export_data = []
    for player_id in player_ids:
        player = await mongo_db.players.find_one({"id": player_id, "verified": True}, {"_id": 0})
        if not player:
            continue
        
        intake = await mongo_db.intake_submissions.find_one(
            {"player_id": player_id},
            {"_id": 0, "ppg": 1, "apg": 1, "rpg": 1, "spg": 1, "bpg": 1, 
             "fg_pct": 1, "three_pct": 1, "ft_pct": 1, "games_played": 1,
             "level": 1, "team_names": 1, "film_links": 1}
        )
        
        row = {
            "player_name": player.get("player_name", ""),
            "grad_class": player.get("grad_class", ""),
            "position": player.get("primary_position", ""),
            "secondary_position": player.get("secondary_position", ""),
            "height": player.get("height", ""),
            "school": player.get("school", ""),
            "city": player.get("city", ""),
            "state": player.get("state", ""),
            "gender": player.get("gender", "")
        }
        
        if intake:
            row.update({
                "games_played": intake.get("games_played", ""),
                "ppg": intake.get("ppg", ""),
                "apg": intake.get("apg", ""),
                "rpg": intake.get("rpg", ""),
                "spg": intake.get("spg", ""),
                "bpg": intake.get("bpg", ""),
                "fg_pct": intake.get("fg_pct", ""),
                "three_pct": intake.get("three_pct", ""),
                "ft_pct": intake.get("ft_pct", ""),
                "level": intake.get("level", ""),
                "team_names": intake.get("team_names", ""),
                "film_links": ", ".join(intake.get("film_links", []))[:500] if intake.get("film_links") else ""
            })
            
            # Add contact info for Premium/Elite
            if can_access_feature(tier, "contact_info"):
                full_intake = await mongo_db.intake_submissions.find_one(
                    {"player_id": player_id},
                    {"_id": 0, "parent_email": 1, "parent_phone": 1, "parent_name": 1}
                )
                if full_intake:
                    row.update({
                        "parent_name": full_intake.get("parent_name", ""),
                        "parent_email": full_intake.get("parent_email", ""),
                        "parent_phone": full_intake.get("parent_phone", "")
                    })
        
        export_data.append(row)
    
    if request.format == "json":
        return {
            "format": "json",
            "count": len(export_data),
            "data": export_data,
            "exported_at": datetime.now(timezone.utc).isoformat()
        }
    else:
        # Generate CSV
        if not export_data:
            raise HTTPException(status_code=400, detail="No data to export")
        
        output = io.StringIO()
        fieldnames = list(export_data[0].keys())
        writer = csv.DictWriter(output, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(export_data)
        
        csv_content = output.getvalue()
        
        return {
            "format": "csv",
            "count": len(export_data),
            "csv_content": csv_content,
            "exported_at": datetime.now(timezone.utc).isoformat()
        }


# ============ PROSPECT COMPARISON ROUTES ============

@api_router.post("/coach/compare")
async def compare_prospects(
    request: ComparePlayersRequest,
    current_user: dict = Depends(get_current_user)
):
    """Compare multiple prospects side by side (Elite tier)."""
    if current_user.get("role") != "coach":
        raise HTTPException(status_code=403, detail="Coach access required")
    
    coach = await mongo_db.coaches.find_one({"id": current_user["sub"]})
    tier = get_coach_tier(coach)
    
    if not can_access_feature(tier, "comparison"):
        raise HTTPException(status_code=403, detail="Elite subscription required for comparison tool")
    
    if len(request.player_ids) < 2 or len(request.player_ids) > 5:
        raise HTTPException(status_code=400, detail="Compare 2-5 players")
    
    comparisons = []
    
    for player_id in request.player_ids:
        player = await mongo_db.players.find_one({"id": player_id, "verified": True}, {"_id": 0})
        if not player:
            continue
        
        intake = await mongo_db.intake_submissions.find_one(
            {"player_id": player_id},
            {"_id": 0, "ppg": 1, "apg": 1, "rpg": 1, "spg": 1, "bpg": 1, "fg_pct": 1, "three_pct": 1, "ft_pct": 1, "games_played": 1, "self_words": 1, "strength": 1, "pride_tags": 1}
        )
        
        comparisons.append({
            "player": {
                "id": player["id"],
                "player_name": player["player_name"],
                "grad_class": player.get("grad_class"),
                "primary_position": player.get("primary_position"),
                "secondary_position": player.get("secondary_position"),
                "height": player.get("height"),
                "school": player.get("school"),
                "state": player.get("state")
            },
            "stats": {
                "games_played": intake.get("games_played") if intake else None,
                "ppg": intake.get("ppg") if intake else None,
                "apg": intake.get("apg") if intake else None,
                "rpg": intake.get("rpg") if intake else None,
                "spg": intake.get("spg") if intake else None,
                "bpg": intake.get("bpg") if intake else None,
                "fg_pct": intake.get("fg_pct") if intake else None,
                "three_pct": intake.get("three_pct") if intake else None,
                "ft_pct": intake.get("ft_pct") if intake else None
            },
            "profile": {
                "self_words": intake.get("self_words") if intake else None,
                "strength": intake.get("strength") if intake else None,
                "pride_tags": intake.get("pride_tags") if intake else []
            }
        })
    
    # Calculate comparison insights
    insights = []
    if len(comparisons) >= 2:
        # Find highest PPG
        ppg_sorted = sorted([c for c in comparisons if c["stats"]["ppg"]], key=lambda x: x["stats"]["ppg"] or 0, reverse=True)
        if ppg_sorted:
            insights.append(f"Highest scorer: {ppg_sorted[0]['player']['player_name']} ({ppg_sorted[0]['stats']['ppg']} PPG)")
        
        # Find best passer
        apg_sorted = sorted([c for c in comparisons if c["stats"]["apg"]], key=lambda x: x["stats"]["apg"] or 0, reverse=True)
        if apg_sorted:
            insights.append(f"Best passer: {apg_sorted[0]['player']['player_name']} ({apg_sorted[0]['stats']['apg']} APG)")
    
    return {
        "comparisons": comparisons,
        "insights": insights,
        "count": len(comparisons)
    }


# Update prospect endpoint to respect tier permissions


@api_router.post("/coach/register")
async def coach_register(request: CoachRegisterRequest):
    """Register a new coach account."""
    existing = await mongo_db.coaches.find_one({"email": request.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    coach = {
        "id": str(uuid.uuid4()),
        "email": request.email,
        "password_hash": hash_password(request.password),
        "name": request.name,
        "school": request.school,
        "title": request.title,
        "state": request.state,
        "is_active": True,
        "is_verified": False,  # Admin must verify coach
        "saved_players": [],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await mongo_db.coaches.insert_one(coach)
    
    return {
        "id": coach["id"],
        "email": coach["email"],
        "name": coach["name"],
        "school": coach["school"],
        "message": "Registration successful. Your account is pending verification."
    }


@api_router.post("/coach/login")
async def coach_login(request: CoachLoginRequest):
    """Login as a coach."""
    coach = await mongo_db.coaches.find_one({"email": request.email}, {"_id": 0})
    
    if not coach or not verify_password(request.password, coach.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    if not coach.get("is_active", True):
        raise HTTPException(status_code=401, detail="Account is disabled")
    
    if REQUIRE_COACH_VERIFICATION and not coach.get("is_verified", False):
        raise HTTPException(status_code=403, detail="Account pending verification. Please wait for admin approval or contact support.")
    
    token = create_access_token({
        "sub": coach["id"],
        "email": coach["email"],
        "role": "coach",
        "name": coach.get("name", ""),
        "school": coach.get("school", "")
    })
    
    return {
        "token": token,
        "user": {
            "id": coach["id"],
            "email": coach["email"],
            "name": coach.get("name"),
            "school": coach.get("school"),
            "role": "coach"
        }
    }


@api_router.get("/coach/me")
async def get_coach_profile(current_user: dict = Depends(get_current_user)):
    """Get current coach profile."""
    if current_user.get("role") != "coach":
        raise HTTPException(status_code=403, detail="Coach access required")
    
    coach = await mongo_db.coaches.find_one({"id": current_user["sub"]}, {"_id": 0, "password_hash": 0})
    if not coach:
        raise HTTPException(status_code=404, detail="Coach not found")
    return coach


@api_router.get("/coach/prospects")
async def browse_prospects(
    page: int = 1,
    page_size: int = 20,
    grad_class: Optional[str] = None,
    position: Optional[str] = None,
    state: Optional[str] = None,
    gender: Optional[str] = None,
    min_ppg: Optional[float] = None,
    search: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Browse verified prospects (coach portal)."""
    if current_user.get("role") != "coach":
        raise HTTPException(status_code=403, detail="Coach access required")
    
    # Only show verified players
    query = {"verified": True}
    
    if grad_class:
        query["grad_class"] = grad_class
    if position:
        query["$or"] = [{"primary_position": position}, {"secondary_position": position}]
    if state:
        query["state"] = {"$regex": state, "$options": "i"}
    if gender:
        query["gender"] = gender
    if search:
        query["$or"] = [
            {"player_name": {"$regex": search, "$options": "i"}},
            {"school": {"$regex": search, "$options": "i"}},
            {"city": {"$regex": search, "$options": "i"}}
        ]
    
    total = await mongo_db.players.count_documents(query)
    skip = (page - 1) * page_size
    
    players = await mongo_db.players.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(page_size).to_list(page_size)
    
    # Enrich with stats from intake submissions
    enriched_players = []
    for player in players:
        intake = await mongo_db.intake_submissions.find_one(
            {"player_id": player["id"]}, 
            {"_id": 0, "ppg": 1, "apg": 1, "rpg": 1, "spg": 1, "film_links": 1, "highlight_links": 1, "level": 1, "team_names": 1}
        )
        
        # Filter by min_ppg if specified
        if min_ppg and intake:
            if not intake.get("ppg") or intake.get("ppg") < min_ppg:
                continue
        
        player_data = {
            "id": player["id"],
            "player_name": player["player_name"],
            "grad_class": player.get("grad_class"),
            "gender": player.get("gender"),
            "school": player.get("school"),
            "city": player.get("city"),
            "state": player.get("state"),
            "primary_position": player.get("primary_position"),
            "secondary_position": player.get("secondary_position"),
            "height": player.get("height"),
            "verified": player.get("verified", False)
        }
        
        if intake:
            player_data["stats"] = {
                "ppg": intake.get("ppg"),
                "apg": intake.get("apg"),
                "rpg": intake.get("rpg"),
                "spg": intake.get("spg")
            }
            player_data["level"] = intake.get("level")
            player_data["team_names"] = intake.get("team_names")
            player_data["has_film"] = bool(intake.get("film_links") or intake.get("highlight_links"))
        
        enriched_players.append(player_data)
    
    return {
        "prospects": enriched_players,
        "total": total,
        "page": page,
        "page_size": page_size
    }


@api_router.get("/coach/prospects/{player_id}")
async def get_prospect_detail(player_id: str, current_user: dict = Depends(get_current_user)):
    """Get detailed prospect profile (coach view) - content based on tier."""
    if current_user.get("role") != "coach":
        raise HTTPException(status_code=403, detail="Coach access required")
    
    coach = await mongo_db.coaches.find_one({"id": current_user["sub"]})
    tier = get_coach_tier(coach)
    
    player = await mongo_db.players.find_one({"id": player_id, "verified": True}, {"_id": 0})
    if not player:
        raise HTTPException(status_code=404, detail="Prospect not found or not verified")
    
    # Get intake submission for additional details
    intake = await mongo_db.intake_submissions.find_one(
        {"player_id": player_id},
        {"_id": 0}
    )
    
    # Filter sensitive info based on tier
    if intake:
        # Contact info - Premium/Elite only
        if not can_access_feature(tier, "contact_info"):
            intake.pop("parent_email", None)
            intake.pop("parent_phone", None)
            intake.pop("player_email", None)
        
        # Always hide guardian signature
        intake.pop("guardian_signature", None)
        
        # Film links - Premium/Elite only
        if not can_access_feature(tier, "film_links"):
            intake["film_links"] = ["Upgrade to Premium to view film"] if intake.get("film_links") else []
            intake["highlight_links"] = ["Upgrade to Premium to view highlights"] if intake.get("highlight_links") else []
    
    # Check if coach has saved this player
    saved_players = coach.get("saved_players", []) if coach else []
    is_saved = any(sp.get("player_id") == player_id for sp in saved_players)
    
    return {
        "player": player,
        "intake": intake,
        "is_saved": is_saved,
        "tier": tier,
        "can_message": can_access_feature(tier, "messaging"),
        "can_view_contact": can_access_feature(tier, "contact_info"),
        "can_view_film": can_access_feature(tier, "film_links")
    }


@api_router.post("/coach/saved-players")
async def save_player(request: SavedPlayerRequest, current_user: dict = Depends(get_current_user)):
    """Save a player to coach's list."""
    if current_user.get("role") != "coach":
        raise HTTPException(status_code=403, detail="Coach access required")
    
    # Verify player exists and is verified
    player = await mongo_db.players.find_one({"id": request.player_id, "verified": True})
    if not player:
        raise HTTPException(status_code=404, detail="Prospect not found or not verified")
    
    saved_entry = {
        "player_id": request.player_id,
        "notes": request.notes,
        "saved_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Add to saved_players array if not already saved
    result = await mongo_db.coaches.update_one(
        {"id": current_user["sub"], "saved_players.player_id": {"$ne": request.player_id}},
        {"$push": {"saved_players": saved_entry}}
    )
    
    if result.modified_count == 0:
        # Update existing saved player notes
        await mongo_db.coaches.update_one(
            {"id": current_user["sub"], "saved_players.player_id": request.player_id},
            {"$set": {"saved_players.$.notes": request.notes, "saved_players.$.saved_at": saved_entry["saved_at"]}}
        )
    
    return {"status": "saved", "player_id": request.player_id}


@api_router.delete("/coach/saved-players/{player_id}")
async def unsave_player(player_id: str, current_user: dict = Depends(get_current_user)):
    """Remove a player from coach's saved list."""
    if current_user.get("role") != "coach":
        raise HTTPException(status_code=403, detail="Coach access required")
    
    await mongo_db.coaches.update_one(
        {"id": current_user["sub"]},
        {"$pull": {"saved_players": {"player_id": player_id}}}
    )
    
    return {"status": "removed", "player_id": player_id}


@api_router.get("/coach/saved-players")
async def get_saved_players(current_user: dict = Depends(get_current_user)):
    """Get all saved players for coach."""
    if current_user.get("role") != "coach":
        raise HTTPException(status_code=403, detail="Coach access required")
    
    coach = await mongo_db.coaches.find_one({"id": current_user["sub"]}, {"_id": 0})
    if not coach:
        raise HTTPException(status_code=404, detail="Coach not found")
    
    saved_players = coach.get("saved_players", [])
    
    # Enrich with player details
    enriched = []
    for sp in saved_players:
        player = await mongo_db.players.find_one({"id": sp["player_id"]}, {"_id": 0})
        if player:
            intake = await mongo_db.intake_submissions.find_one(
                {"player_id": sp["player_id"]},
                {"_id": 0, "ppg": 1, "apg": 1, "rpg": 1}
            )
            enriched.append({
                "player": {
                    "id": player["id"],
                    "player_name": player["player_name"],
                    "grad_class": player.get("grad_class"),
                    "school": player.get("school"),
                    "primary_position": player.get("primary_position"),
                    "state": player.get("state")
                },
                "stats": {
                    "ppg": intake.get("ppg") if intake else None,
                    "apg": intake.get("apg") if intake else None,
                    "rpg": intake.get("rpg") if intake else None
                } if intake else None,
                "notes": sp.get("notes"),
                "saved_at": sp.get("saved_at")
            })
    
    return {"saved_players": enriched, "total": len(enriched)}


# ============ ADMIN COACH MANAGEMENT ============

@api_router.get("/admin/coaches")
async def list_coaches(
    page: int = 1,
    page_size: int = 20,
    verified: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """List all coach accounts (admin only)."""
    query = {}
    if verified:
        query["is_verified"] = verified == "true"
    
    total = await mongo_db.coaches.count_documents(query)
    skip = (page - 1) * page_size
    
    coaches = await mongo_db.coaches.find(query, {"_id": 0, "password_hash": 0}).sort("created_at", -1).skip(skip).limit(page_size).to_list(page_size)
    
    return {
        "coaches": coaches,
        "total": total,
        "page": page,
        "page_size": page_size
    }


@api_router.patch("/admin/coaches/{coach_id}/verify")
async def verify_coach(coach_id: str, current_user: dict = Depends(require_editor)):
    """Verify or unverify a coach account."""
    coach = await mongo_db.coaches.find_one({"id": coach_id})
    if not coach:
        raise HTTPException(status_code=404, detail="Coach not found")
    
    new_verified = not coach.get("is_verified", False)
    await mongo_db.coaches.update_one({"id": coach_id}, {"$set": {"is_verified": new_verified}})
    
    return {"is_verified": new_verified}


# Include router
app.include_router(api_router)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    """Create indexes on startup and seed demo data if needed."""
    # Create indexes for MongoDB collections
    await mongo_db.players.create_index("player_key", unique=True)
    await mongo_db.players.create_index("grad_class")
    await mongo_db.players.create_index("school")
    await mongo_db.players.create_index("verified")
    await mongo_db.staff_users.create_index("email", unique=True)
    await mongo_db.coaches.create_index("email", unique=True)
    await mongo_db.projects.create_index("status")
    await mongo_db.projects.create_index("player_id")
    await mongo_db.payment_transactions.create_index("session_id", unique=True)
    logger.info("MongoDB indexes created/verified")

    # Auto-seed test users in demo mode
    if DEMO_MODE:
        await _seed_demo_data()


async def _seed_demo_data():
    """Seed demo mode with test users for immediate testing."""
    try:
        # Check if admin already exists
        existing_admin = await mongo_db.staff_users.find_one({"email": "admin@hoopwithher.com"})
        if not existing_admin:
            # Create admin user
            admin_user = {
                "id": str(uuid.uuid4()),
                "email": "admin@hoopwithher.com",
                "password_hash": hash_password("AdminPass123!"),
                "name": "System Administrator",
                "role": "admin",
                "is_active": True,
                "is_verified": True,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await mongo_db.staff_users.insert_one(admin_user)
            logger.info("✅ Demo admin user created: admin@hoopwithher.com / AdminPass123!")

        # Check if test coach already exists
        existing_coach = await mongo_db.coaches.find_one({"email": "coach@university.edu"})
        if not existing_coach:
            # Create test coach (auto-verified for demo)
            test_coach = {
                "id": str(uuid.uuid4()),
                "email": "coach@university.edu",
                "password_hash": hash_password("CoachPass123!"),
                "name": "Coach Johnson",
                "school": "University State",
                "title": "Head Coach",
                "state": "CA",
                "is_active": True,
                "is_verified": True,  # Auto-verified for demo
                "saved_players": [],
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await mongo_db.coaches.insert_one(test_coach)
            logger.info("✅ Demo coach created: coach@university.edu / CoachPass123!")

        logger.info("🎮 Demo mode ready! Test users initialized.")
    except Exception as e:
        logger.error(f"Failed to seed demo data: {e}")


@app.on_event("shutdown")
async def shutdown():
    """Clean up on shutdown."""
    mongo_client.close()
