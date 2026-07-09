from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, JSON, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    role: Mapped[str] = mapped_column(String(20), index=True)
    full_name: Mapped[str] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(String(150), unique=True, index=True)
    phone: Mapped[str | None] = mapped_column(String(30), nullable=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    owner_user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    created_by_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    farm_type_id: Mapped[int | None] = mapped_column(ForeignKey("farm_types.id"), nullable=True)
    species_id: Mapped[int | None] = mapped_column(ForeignKey("species.id"), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    last_portal_access: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    owner: Mapped["User | None"] = relationship(
        "User",
        remote_side="User.id",
        foreign_keys=[owner_user_id],
        backref="agents",
    )
    created_by: Mapped["User | None"] = relationship("User", remote_side="User.id", foreign_keys=[created_by_id])
    farm_type: Mapped["FarmType | None"] = relationship("FarmType")
    species: Mapped["Species | None"] = relationship("Species")


class FarmType(Base):
    __tablename__ = "farm_types"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    code: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(100), unique=True)

    species: Mapped[list["Species"]] = relationship("Species", back_populates="farm_type")


class Species(Base):
    __tablename__ = "species"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    farm_type_id: Mapped[int] = mapped_column(ForeignKey("farm_types.id"))
    name: Mapped[str] = mapped_column(String(120))
    scientific_name: Mapped[str | None] = mapped_column(String(160), nullable=True)
    default_thresholds: Mapped[dict] = mapped_column(JSON)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    farm_type: Mapped["FarmType"] = relationship("FarmType", back_populates="species")


class Site(Base):
    __tablename__ = "sites"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    owner_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    name: Mapped[str] = mapped_column(String(120))
    site_type: Mapped[str] = mapped_column(String(30))
    location_text: Mapped[str | None] = mapped_column(String(255), nullable=True)
    farm_type_id: Mapped[int] = mapped_column(ForeignKey("farm_types.id"))
    species_id: Mapped[int] = mapped_column(ForeignKey("species.id"))
    custom_thresholds: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    owner: Mapped["User"] = relationship("User", foreign_keys=[owner_user_id], backref="owned_sites")
    farm_type: Mapped["FarmType"] = relationship("FarmType")
    species: Mapped["Species"] = relationship("Species")

    @property
    def devices_count(self) -> int:
        return len(self.devices)

    @property
    def agents_count(self) -> int:
        return len([a for a in self.agent_assignments if a.is_active])


class SiteAgentAssignment(Base):
    __tablename__ = "site_agent_assignments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    site_id: Mapped[int] = mapped_column(ForeignKey("sites.id"))
    agent_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    assigned_by_owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    assigned_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    site: Mapped["Site"] = relationship("Site", backref="agent_assignments")
    agent: Mapped["User"] = relationship("User", foreign_keys=[agent_user_id], backref="site_assignments")
    assigned_by_owner: Mapped["User"] = relationship("User", foreign_keys=[assigned_by_owner_id])


class DeviceOwnerAssignment(Base):
    __tablename__ = "device_owner_assignments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    device_id: Mapped[int] = mapped_column(ForeignKey("devices.id"))
    owner_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    assigned_by_manager_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    assigned_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    unassigned_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)


class DeviceSiteAssignment(Base):
    __tablename__ = "device_site_assignments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    device_id: Mapped[int] = mapped_column(ForeignKey("devices.id"))
    site_id: Mapped[int] = mapped_column(ForeignKey("sites.id"))
    assigned_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    unassigned_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)


class Device(Base):
    __tablename__ = "devices"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    device_uid: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    imei: Mapped[str | None] = mapped_column(String(32), nullable=True)
    sim_number: Mapped[str | None] = mapped_column(String(30), nullable=True)
    gsm_number: Mapped[str | None] = mapped_column(String(30), nullable=True)
    firmware_version: Mapped[str | None] = mapped_column(String(40), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="inactive")
    owner_user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    site_id: Mapped[int | None] = mapped_column(ForeignKey("sites.id"), nullable=True)
    created_by_manager_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    owner: Mapped["User | None"] = relationship("User", foreign_keys=[owner_user_id], backref="owned_devices")
    site: Mapped["Site | None"] = relationship("Site", backref="devices")
    created_by_manager: Mapped["User"] = relationship("User", foreign_keys=[created_by_manager_id])

    @property
    def sensor_type_ids(self) -> list[int]:
        return sorted([assignment.sensor_type_id for assignment in self.sensor_assignments])

    @property
    def sensor_types(self) -> list["SensorType"]:
        return [assignment.sensor_type for assignment in sorted(self.sensor_assignments, key=lambda item: item.sensor_type_id)]


class SensorType(Base):
    __tablename__ = "sensor_types"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    code: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(120), unique=True)
    reading_field: Mapped[str] = mapped_column(String(60), unique=True)


class DeviceSensorAssignment(Base):
    __tablename__ = "device_sensor_assignments"
    __table_args__ = (UniqueConstraint("device_id", "sensor_type_id", name="uq_device_sensor_assignment"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    device_id: Mapped[int] = mapped_column(ForeignKey("devices.id"))
    sensor_type_id: Mapped[int] = mapped_column(ForeignKey("sensor_types.id"))
    assigned_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    device: Mapped["Device"] = relationship("Device", backref="sensor_assignments")
    sensor_type: Mapped["SensorType"] = relationship("SensorType")


class Reading(Base):
    __tablename__ = "sensor_readings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    device_id: Mapped[int] = mapped_column(ForeignKey("devices.id"))
    site_id: Mapped[int | None] = mapped_column(ForeignKey("sites.id"), nullable=True)
    ph: Mapped[float | None] = mapped_column(Float, nullable=True)
    temperature_c: Mapped[float | None] = mapped_column(Float, nullable=True)
    turbidity: Mapped[float | None] = mapped_column("turbidity_ntu", Float, nullable=True)
    ammonia: Mapped[float | None] = mapped_column(Float, nullable=True)
    dissolved_oxygen: Mapped[float | None] = mapped_column(Float, nullable=True)
    nitrate: Mapped[float | None] = mapped_column(Float, nullable=True)
    salinity: Mapped[float | None] = mapped_column(Float, nullable=True)
    electric_conductivity: Mapped[float | None] = mapped_column(Float, nullable=True)
    signal_dbm: Mapped[int | None] = mapped_column(Integer, nullable=True)
    battery_v: Mapped[float | None] = mapped_column(Float, nullable=True)
    raw_payload: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    collected_at: Mapped[datetime] = mapped_column(DateTime)
    received_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    device: Mapped["Device"] = relationship("Device", backref="readings")
    site: Mapped["Site | None"] = relationship("Site", backref="readings")

    @property
    def owner_user_id(self) -> int | None:
        if self.site and self.site.owner_user_id:
            return self.site.owner_user_id
        if self.device and self.device.owner_user_id:
            return self.device.owner_user_id
        return None

    @property
    def source(self) -> str:
        if self.raw_payload and self.raw_payload.get("_source"):
            return str(self.raw_payload["_source"])
        return "device"


class Alert(Base):
    __tablename__ = "alerts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    reading_id: Mapped[int] = mapped_column(ForeignKey("sensor_readings.id"))
    device_id: Mapped[int] = mapped_column(ForeignKey("devices.id"))
    site_id: Mapped[int | None] = mapped_column(ForeignKey("sites.id"), nullable=True)
    owner_user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    agent_user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    recipient_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    recipient_role: Mapped[str] = mapped_column(String(20))
    metric: Mapped[str] = mapped_column(String(30))
    severity: Mapped[str] = mapped_column(String(20))
    threshold_min: Mapped[float | None] = mapped_column(Float, nullable=True)
    threshold_max: Mapped[float | None] = mapped_column(Float, nullable=True)
    actual_value: Mapped[float] = mapped_column(Float)
    title: Mapped[str] = mapped_column(String(200))
    message: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(20), default="open")
    sent_to_owner: Mapped[bool] = mapped_column(Boolean, default=False)
    sent_to_agent: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    acknowledged_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    reading: Mapped["Reading"] = relationship("Reading", backref="alerts")
    device: Mapped["Device"] = relationship("Device")
    site: Mapped["Site | None"] = relationship("Site")
    recipient: Mapped["User"] = relationship("User", foreign_keys=[recipient_user_id], backref="alerts")


class NotificationDelivery(Base):
    __tablename__ = "notification_deliveries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    event_type: Mapped[str] = mapped_column(String(40), index=True)
    channel: Mapped[str] = mapped_column(String(20), default="email")
    recipient_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    recipient_email: Mapped[str] = mapped_column(String(150))
    subject: Mapped[str] = mapped_column(String(255))
    status: Mapped[str] = mapped_column(String(20), default="pending")
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    alert_id: Mapped[int | None] = mapped_column(ForeignKey("alerts.id"), nullable=True)
    emergency_id: Mapped[int | None] = mapped_column(ForeignKey("emergency_incidents.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    sent_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    recipient: Mapped["User"] = relationship("User")
    alert: Mapped["Alert | None"] = relationship("Alert")


class PushSubscription(Base):
    __tablename__ = "push_subscriptions"
    __table_args__ = (UniqueConstraint("provider", "subscription_id", name="uq_push_provider_subscription"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    provider: Mapped[str] = mapped_column(String(30), default="onesignal")
    subscription_id: Mapped[str] = mapped_column(String(255))
    device_label: Mapped[str | None] = mapped_column(String(120), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user: Mapped["User"] = relationship("User", backref="push_subscriptions")


class Report(Base):
    __tablename__ = "reports"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    title: Mapped[str] = mapped_column(String(200))
    report_type: Mapped[str] = mapped_column(String(50))
    scope: Mapped[str] = mapped_column(String(100), default="all")
    format: Mapped[str] = mapped_column(String(20), default="pdf")
    status: Mapped[str] = mapped_column(String(20), default="completed")
    parameters: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user: Mapped["User"] = relationship("User", backref="reports")


class ReportSchedule(Base):
    __tablename__ = "report_schedules"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    title: Mapped[str] = mapped_column(String(200))
    report_type: Mapped[str] = mapped_column(String(50))
    format: Mapped[str] = mapped_column(String(20), default="pdf")
    frequency: Mapped[str] = mapped_column(String(20), default="daily")
    time_of_day: Mapped[str] = mapped_column(String(5), default="08:00")
    day_of_week: Mapped[int | None] = mapped_column(Integer, nullable=True)
    day_of_month: Mapped[int | None] = mapped_column(Integer, nullable=True)
    date_from: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    date_to: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    next_run_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    last_run_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user: Mapped["User"] = relationship("User", backref="report_schedules")


class UserSetting(Base):
    __tablename__ = "user_settings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True)
    profile_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    notification_prefs: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    alert_thresholds: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user: Mapped["User"] = relationship("User", backref="settings")


class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    token_hash: Mapped[str] = mapped_column(String(128), unique=True, index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime)
    used_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user: Mapped["User"] = relationship("User", backref="password_reset_tokens")


class AgentContact(Base):
    __tablename__ = "agent_contacts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    agent_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    name: Mapped[str] = mapped_column(String(120))
    email: Mapped[str | None] = mapped_column(String(150), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(30), nullable=True)
    tag: Mapped[str | None] = mapped_column(String(60), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    agent: Mapped["User"] = relationship("User", foreign_keys=[agent_user_id], backref="agent_contacts")


class EmergencyIncident(Base):
    __tablename__ = "emergency_incidents"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    site_id: Mapped[int | None] = mapped_column(ForeignKey("sites.id"), nullable=True)
    triggered_by_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    priority: Mapped[str] = mapped_column(String(20), default="high")
    status: Mapped[str] = mapped_column(String(20), default="active")
    description: Mapped[str] = mapped_column(Text)
    owner_viewed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    accepted_by_user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    accepted_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    resolved_by_user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    site: Mapped["Site | None"] = relationship("Site")
    triggered_by: Mapped["User"] = relationship("User", foreign_keys=[triggered_by_user_id])
    accepted_by: Mapped["User | None"] = relationship("User", foreign_keys=[accepted_by_user_id])
    resolved_by: Mapped["User | None"] = relationship("User", foreign_keys=[resolved_by_user_id])
