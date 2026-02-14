"""
Pydantic schemas for request/response validation.
"""
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import Optional, List
from datetime import datetime
from enum import Enum


class PipelineStatusEnum(str, Enum):
    REQUESTED = "requested"
    IN_REVIEW = "in_review"
    DRAFTING = "drafting"
    DESIGN = "design"
    DELIVERED = "delivered"


class DeliverableStatusEnum(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETE = "complete"


class PackageTypeEnum(str, Enum):
    STARTER = "starter"
    DEVELOPMENT = "development"
    ELITE_TRACK = "elite_track"


# ============ INTAKE SCHEMAS ============

class IntakeFormCreate(BaseModel):
    # Player Info
    player_name: str = Field(..., min_length=1)
    preferred_name: Optional[str] = None
    dob: Optional[str] = None  # ISO date string
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
    
    # Parent/Guardian
    parent_name: str = Field(..., min_length=1)
    parent_email: EmailStr
    parent_phone: Optional[str] = None
    player_email: Optional[str] = None
    
    # Team Context
    level: Optional[str] = None
    team_names: Optional[str] = None
    league_region: Optional[str] = None
    
    # Stats Snapshot
    games_played: Optional[int] = None
    ppg: Optional[float] = None
    apg: Optional[float] = None
    rpg: Optional[float] = None
    spg: Optional[float] = None
    bpg: Optional[float] = None
    fg_pct: Optional[float] = None
    three_pct: Optional[float] = None
    ft_pct: Optional[float] = None
    
    # Player Self Eval
    self_words: Optional[str] = None
    strength: Optional[str] = None
    improvement: Optional[str] = None
    separation: Optional[str] = None
    adversity_response: Optional[str] = None
    iq_self_rating: Optional[str] = None
    pride_tags: Optional[List[str]] = None
    player_model: Optional[str] = None
    
    # Film & Links
    film_links: Optional[List[str]] = None
    highlight_links: Optional[List[str]] = None
    instagram_handle: Optional[str] = None
    other_socials: Optional[str] = None
    
    # Goals
    goal: Optional[str] = None
    colleges_interest: Optional[str] = None
    
    # Package Selection
    package_selected: str
    
    # Consent
    consent_eval: bool = False
    consent_media: bool = False
    guardian_signature: str
    signature_date: Optional[str] = None


class IntakeFormResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    player_id: str
    player_name: str
    parent_email: str
    package_selected: str
    created_at: datetime
    payment_url: Optional[str] = None


# ============ AUTH SCHEMAS ============

class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    token: str
    user: dict


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    name: str
    role: str = "viewer"


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    email: str
    name: Optional[str]
    role: str
    is_active: bool


# ============ PLAYER SCHEMAS ============

class PlayerResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    player_name: str
    preferred_name: Optional[str]
    dob: Optional[datetime]
    grad_class: Optional[str]
    gender: Optional[str]
    school: Optional[str]
    city: Optional[str]
    state: Optional[str]
    primary_position: Optional[str]
    secondary_position: Optional[str]
    jersey_number: Optional[str]
    height: Optional[str]
    weight: Optional[str]
    verified: bool
    created_at: datetime


class PlayerListResponse(BaseModel):
    players: List[PlayerResponse]
    total: int
    page: int
    page_size: int


# ============ PROJECT SCHEMAS ============

class ProjectResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    player_id: str
    status: str
    package_type: Optional[str]
    notes: Optional[str]
    payment_status: Optional[str]
    created_at: datetime
    updated_at: datetime
    player: Optional[PlayerResponse] = None


class ProjectUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None


class ProjectWithDetails(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    player_id: str
    status: str
    package_type: Optional[str]
    notes: Optional[str]
    payment_status: Optional[str]
    created_at: datetime
    updated_at: datetime
    player: Optional[PlayerResponse] = None
    intake_submission: Optional[dict] = None
    deliverables: List[dict] = []
    reminders: List[dict] = []


# ============ DELIVERABLE SCHEMAS ============

class DeliverableResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    project_id: str
    deliverable_type: str
    status: str
    file_url: Optional[str]
    created_at: datetime
    updated_at: datetime


class DeliverableUpdate(BaseModel):
    status: Optional[str] = None
    file_url: Optional[str] = None


class DeliverableCreate(BaseModel):
    deliverable_type: str
    status: str = "pending"


# ============ PAYMENT SCHEMAS ============

class PaymentInitRequest(BaseModel):
    intake_submission_id: str
    origin_url: str


class PaymentStatusResponse(BaseModel):
    status: str
    payment_status: str
    amount_total: int
    currency: str
    metadata: dict


# ============ STATS SCHEMAS ============

class DashboardStats(BaseModel):
    total_players: int
    total_projects: int
    projects_by_status: dict
    recent_submissions: int
    packages_breakdown: dict
