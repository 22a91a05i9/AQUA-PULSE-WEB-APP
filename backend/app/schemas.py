from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator, model_validator


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    role: str
    full_name: str
    email: str
    phone: str | None = None
    owner_user_id: int | None = None
    farm_type_id: int | None = None
    species_id: int | None = None
    is_active: bool


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)


class OwnerCreate(BaseModel):
    full_name: str
    email: EmailStr
    phone: str | None = None
    password: str = Field(min_length=8)


class AgentCreate(BaseModel):
    full_name: str
    email: EmailStr
    phone: str | None = None
    password: str = Field(min_length=8)
    farm_type_id: int
    species_id: int


class DeviceCreate(BaseModel):
    device_uid: str
    imei: str | None = None
    sim_number: str | None = None
    gsm_number: str | None = None
    firmware_version: str | None = None
    status: str = "inactive"

    @field_validator("device_uid")
    @classmethod
    def trim_device_uid(cls, value: str) -> str:
        return value.strip()


class AssignOwnerRequest(BaseModel):
    owner_user_id: int


class SiteCreate(BaseModel):
    name: str
    site_type: str
    location_text: str | None = None
    farm_type_id: int
    species_id: int
    custom_thresholds: dict | None = None

    @field_validator("name")
    @classmethod
    def trim_site_name(cls, value: str) -> str:
        return value.strip()


class AssignSiteRequest(BaseModel):
    site_id: int


class AssignAgentRequest(BaseModel):
    agent_user_id: int


class ReadingIngest(BaseModel):
    device_id: str
    pond_id: str | None = None
    temperature_c: float
    ph: float
    turbidity: float | None = None
    turbidity_ntu: float | None = None
    signal_dbm: int | None = None
    battery_v: float | None = None
    collected_at: datetime | None = None

    @field_validator("device_id")
    @classmethod
    def trim_device_id(cls, value: str) -> str:
        return value.strip()

    @field_validator("pond_id")
    @classmethod
    def trim_pond_id(cls, value: str | None) -> str | None:
        return value.strip() if value else value

    @model_validator(mode="after")
    def normalize_turbidity(self):
        if self.turbidity is None and self.turbidity_ntu is not None:
            self.turbidity = self.turbidity_ntu
        if self.turbidity is None:
            raise ValueError("Either turbidity or turbidity_ntu is required")
        return self


class FarmTypeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    code: str
    name: str


class SpeciesOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    farm_type_id: int
    name: str
    scientific_name: str | None = None
    default_thresholds: dict


class SiteOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    site_type: str
    location_text: str | None = None
    owner_user_id: int
    farm_type_id: int
    species_id: int
    custom_thresholds: dict | None = None
    created_at: datetime


class DeviceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    device_uid: str
    imei: str | None = None
    sim_number: str | None = None
    gsm_number: str | None = None
    firmware_version: str | None = None
    status: str
    owner_user_id: int | None = None
    site_id: int | None = None
    created_at: datetime


class ReadingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    device_id: int
    owner_user_id: int | None = None
    site_id: int | None = None
    temperature_c: float
    ph: float
    turbidity: float
    source: str
    collected_at: datetime
    received_at: datetime


class AlertOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    reading_id: int
    device_id: int
    site_id: int | None = None
    recipient_user_id: int
    recipient_role: str
    metric: str
    severity: str
    threshold_min: float | None = None
    threshold_max: float | None = None
    actual_value: float
    title: str
    message: str
    status: str
    created_at: datetime
    acknowledged_at: datetime | None = None


# ---------- Report ----------

class ReportCreate(BaseModel):
    title: str
    report_type: str
    scope: str = "all"
    format: str = "pdf"
    parameters: dict | None = None


class ReportOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    title: str
    report_type: str
    scope: str
    format: str
    status: str
    parameters: dict | None = None
    created_at: datetime


# ---------- UserSetting ----------

class UserSettingUpdate(BaseModel):
    profile_json: dict | None = None
    notification_prefs: dict | None = None
    alert_thresholds: dict | None = None


class UserSettingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    profile_json: dict | None = None
    notification_prefs: dict | None = None
    alert_thresholds: dict | None = None
    updated_at: datetime


# ---------- EmergencyIncident ----------

class EmergencyCreate(BaseModel):
    site_id: int | None = None
    priority: str = "high"
    description: str


class EmergencyOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    site_id: int | None = None
    triggered_by_user_id: int
    priority: str
    status: str
    description: str
    resolved_by_user_id: int | None = None
    created_at: datetime
    resolved_at: datetime | None = None

