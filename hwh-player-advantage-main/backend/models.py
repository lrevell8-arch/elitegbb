"""
SQLAlchemy models for HWH Player Advantage system.
"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Text, ForeignKey, JSON, Enum as SQLEnum
from sqlalchemy.orm import relationship
from database import Base
import enum


def generate_uuid():
    return str(uuid.uuid4())


def utc_now():
    return datetime.now(timezone.utc)


class PipelineStatus(str, enum.Enum):
    REQUESTED = "requested"
    IN_REVIEW = "in_review"
    DRAFTING = "drafting"
    DESIGN = "design"
    DELIVERED = "delivered"


class DeliverableStatus(str, enum.Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETE = "complete"


class PackageType(str, enum.Enum):
    STARTER = "starter"
    DEVELOPMENT = "development"
    ELITE_TRACK = "elite_track"


class StaffRole(str, enum.Enum):
    ADMIN = "admin"
    EDITOR = "editor"
    VIEWER = "viewer"


class Player(Base):
    __tablename__ = "players"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    player_key = Column(String(255), unique=True, nullable=False, index=True)  # lower(name)|grad_class|dob
    player_name = Column(String(255), nullable=False)
    preferred_name = Column(String(255))
    dob = Column(DateTime)
    grad_class = Column(String(4), index=True)  # 2025-2030
    gender = Column(String(10))  # female/male
    school = Column(String(255), index=True)
    city = Column(String(255))
    state = Column(String(100))
    primary_position = Column(String(10))  # PG/SG/SF/PF/C
    secondary_position = Column(String(10))
    jersey_number = Column(String(10))
    height = Column(String(20))
    weight = Column(String(20))
    verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)
    
    # Relationships
    intake_submissions = relationship("IntakeSubmission", back_populates="player", cascade="all, delete-orphan")
    projects = relationship("Project", back_populates="player", cascade="all, delete-orphan")


class IntakeSubmission(Base):
    __tablename__ = "intake_submissions"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    player_id = Column(String(36), ForeignKey("players.id", ondelete="CASCADE"), index=True)
    
    # Parent/Guardian
    parent_name = Column(String(255), nullable=False)
    parent_email = Column(String(255), nullable=False, index=True)
    parent_phone = Column(String(50))
    player_email = Column(String(255))
    
    # Team Context
    level = Column(String(50))  # middle school/JV/varsity/AAU/showcase
    team_names = Column(Text)
    league_region = Column(Text)
    
    # Stats Snapshot
    games_played = Column(Integer)
    ppg = Column(Float)
    apg = Column(Float)
    rpg = Column(Float)
    spg = Column(Float)
    bpg = Column(Float)
    fg_pct = Column(Float)
    three_pct = Column(Float)
    ft_pct = Column(Float)
    
    # Player Self Eval
    self_words = Column(String(255))  # 3 words comma-separated
    strength = Column(Text)
    improvement = Column(Text)
    separation = Column(Text)
    adversity_response = Column(String(50))  # reset immediately/need a moment/motivation
    iq_self_rating = Column(String(20))  # yes/no/learning
    pride_tags = Column(JSON)  # array of tags
    player_model = Column(String(255))
    
    # Film & Links
    film_links = Column(JSON)  # array
    highlight_links = Column(JSON)  # array
    instagram_handle = Column(String(100))
    other_socials = Column(Text)
    
    # Goals
    goal = Column(String(50))  # exposure/tracking/evaluation/media/recruiting prep
    colleges_interest = Column(Text)
    
    # Package Selection
    package_selected = Column(String(50), nullable=False)  # starter/development/elite_track
    
    # Consent
    consent_eval = Column(Boolean, default=False)
    consent_media = Column(Boolean, default=False)
    guardian_signature = Column(String(255))
    signature_date = Column(DateTime)
    
    # Metadata
    created_at = Column(DateTime, default=utc_now)
    
    # Relationships
    player = relationship("Player", back_populates="intake_submissions")


class Project(Base):
    __tablename__ = "projects"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    player_id = Column(String(36), ForeignKey("players.id", ondelete="CASCADE"), index=True)
    intake_submission_id = Column(String(36), ForeignKey("intake_submissions.id", ondelete="SET NULL"))
    
    status = Column(String(20), default=PipelineStatus.REQUESTED.value, index=True)
    package_type = Column(String(50))
    
    # Internal notes
    notes = Column(Text)
    
    # Payment
    payment_status = Column(String(20), default="pending")
    payment_session_id = Column(String(255))
    amount_paid = Column(Float)
    
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)
    
    # Relationships
    player = relationship("Player", back_populates="projects")
    deliverables = relationship("Deliverable", back_populates="project", cascade="all, delete-orphan")
    reminders = relationship("Reminder", back_populates="project", cascade="all, delete-orphan")


class Deliverable(Base):
    __tablename__ = "deliverables"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), index=True)
    
    deliverable_type = Column(String(50), nullable=False)  # one_pager, tracking_profile, referral_note, film_index, etc.
    status = Column(String(20), default=DeliverableStatus.PENDING.value)
    file_url = Column(Text)
    
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)
    
    # Relationships
    project = relationship("Project", back_populates="deliverables")


class Reminder(Base):
    __tablename__ = "reminders"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), index=True)
    
    reminder_type = Column(String(50))  # mid_season_update, coach_followup
    scheduled_date = Column(DateTime, nullable=False)
    sent = Column(Boolean, default=False)
    sent_at = Column(DateTime)
    
    created_at = Column(DateTime, default=utc_now)
    
    # Relationships
    project = relationship("Project", back_populates="reminders")


class EmailLog(Base):
    __tablename__ = "email_logs"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    recipient_email = Column(String(255), nullable=False, index=True)
    subject = Column(String(500))
    email_type = Column(String(50))  # confirmation, notification, delivery
    status = Column(String(20))  # sent, failed, pending
    error_message = Column(Text)
    
    created_at = Column(DateTime, default=utc_now)


class StaffUser(Base):
    __tablename__ = "staff_users"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(255))
    role = Column(String(20), default=StaffRole.VIEWER.value)
    is_active = Column(Boolean, default=True)
    
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)


class PaymentTransaction(Base):
    __tablename__ = "payment_transactions"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    session_id = Column(String(255), unique=True, index=True)
    player_id = Column(String(36), ForeignKey("players.id", ondelete="SET NULL"))
    intake_submission_id = Column(String(36))
    
    amount = Column(Float, nullable=False)
    currency = Column(String(10), default="usd")
    package_type = Column(String(50))
    
    status = Column(String(20), default="initiated")
    payment_status = Column(String(20), default="pending")
    
    extra_data = Column(JSON)
    
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)
