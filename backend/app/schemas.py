from datetime import datetime

import re

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator, model_validator


VALID_SENSOR_TYPE_IDS = {1, 2, 3, 4, 5, 6, 7, 8}
VALID_DEVICE_VERSIONS = {"1.0", "2.0", "3.0", "4.0"}
DEFAULT_ALLOWED_PASSWORD = "12345678"
PASSWORD_POLICY_MESSAGE = (
    "Password must be 12345678 or at least 8 characters with one letter, "
    "one number, and one special character."
)


def validate_password_policy(value: str | None) -> str | None:
    if value is None:
        return value

    password = value.strip()
    if password == DEFAULT_ALLOWED_PASSWORD:
        return password

    has_letter = bool(re.search(r"[A-Za-z]", password))
    has_number = bool(re.search(r"\d", password))
    has_special = bool(re.search(r"[^A-Za-z0-9]", password))
    if len(password) < 8 or not (has_letter and has_number and has_special):
        raise ValueError(PASSWORD_POLICY_MESSAGE)
    return password


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


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ForgotPasswordResponse(BaseModel):
    message: str
    expires_at: datetime | None = None
    email_sent: bool = False
    smtp_configured: bool = False


class ResetPasswordRequest(BaseModel):
    token: str = Field(min_length=5, max_length=5, pattern=r"^\d{5}$")
    new_password: str = Field(min_length=8)

    @field_validator("new_password")
    @classmethod
    def validate_new_password(cls, value: str) -> str:
        return validate_password_policy(value) or value


class ResetPasswordResponse(BaseModel):
    message: str


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(min_length=8)
    new_password: str = Field(min_length=8)

    @field_validator("new_password")
    @classmethod
    def validate_new_password(cls, value: str) -> str:
        return validate_password_policy(value) or value


class OwnerCreate(BaseModel):
    full_name: str
    email: EmailStr
    phone: str | None = None
    password: str = Field(min_length=8)

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        return validate_password_policy(value) or value


class OwnerUpdate(BaseModel):
    full_name: str
    email: EmailStr
    phone: str | None = None
    password: str | None = None

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str | None) -> str | None:
        return validate_password_policy(value)


class AgentCreate(BaseModel):
    full_name: str
    email: EmailStr
    phone: str | None = None
    password: str = Field(min_length=8)
    farm_type_id: int
    species_id: int

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        return validate_password_policy(value) or value


class DeviceCreate(BaseModel):
    device_uid: str
    imei: str | None = None
    sim_number: str | None = None
    gsm_number: str | None = None
    firmware_version: str | None = None
    status: str = "inactive"
    sensor_type_ids: list[int] = Field(default_factory=lambda: [1, 2, 3])

    @field_validator("device_uid")
    @classmethod
    def trim_device_uid(cls, value: str) -> str:
        trimmed = value.strip()
        if not re.fullmatch(r"\d+", trimmed):
            raise ValueError("Device ID must contain numbers only")
        return trimmed

    @field_validator("imei")
    @classmethod
    def validate_imei(cls, value: str | None) -> str | None:
        if value is None:
            return value
        trimmed = value.strip()
        if not re.fullmatch(r"\d{1,10}", trimmed):
            raise ValueError("IMEI Number must contain numbers only, up to 10 digits")
        return trimmed

    @field_validator("sim_number")
    @classmethod
    def validate_sim_number(cls, value: str | None) -> str | None:
        if value is None:
            return value
        trimmed = value.strip()
        if not re.fullmatch(r"\d{10}", trimmed):
            raise ValueError("SIM Number must be exactly 10 digits")
        return trimmed

    @field_validator("firmware_version")
    @classmethod
    def validate_firmware_version(cls, value: str | None) -> str | None:
        if value is None:
            return value
        trimmed = value.strip()
        if trimmed not in VALID_DEVICE_VERSIONS:
            raise ValueError("Device type must be one of: 1.0, 2.0, 3.0, 4.0")
        return trimmed

    @field_validator("sensor_type_ids")
    @classmethod
    def validate_sensor_type_ids(cls, value: list[int]) -> list[int]:
        deduped = sorted(set(value))
        if not deduped:
            raise ValueError("At least one sensor type must be selected")
        invalid = [sensor_id for sensor_id in deduped if sensor_id not in VALID_SENSOR_TYPE_IDS]
        if invalid:
            raise ValueError(f"Invalid sensor type id(s): {invalid}")
        return deduped


class DeviceUpdate(DeviceCreate):
    pass


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
    temperature_c: float | None = None
    ph: float | None = None
    turbidity: float | None = None
    turbidity_ntu: float | None = None
    ammonia: float | None = None
    dissolved_oxygen: float | None = None
    nitrate: float | None = None
    salinity: float | None = None
    electric_conductivity: float | None = None
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
        sensor_values = [
            self.temperature_c,
            self.ph,
            self.turbidity,
            self.ammonia,
            self.dissolved_oxygen,
            self.nitrate,
            self.salinity,
            self.electric_conductivity,
        ]
        if all(value is None for value in sensor_values):
            raise ValueError("At least one sensor reading is required")
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
    devices_count: int = 0
    agents_count: int = 0


class SensorTypeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    code: str
    name: str
    reading_field: str


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
    sensor_type_ids: list[int] = Field(default_factory=list)
    sensor_types: list[SensorTypeOut] = Field(default_factory=list)


class ReadingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    device_id: int
    owner_user_id: int | None = None
    site_id: int | None = None
    temperature_c: float | None = None
    ph: float | None = None
    turbidity: float | None = None
    ammonia: float | None = None
    dissolved_oxygen: float | None = None
    nitrate: float | None = None
    salinity: float | None = None
    electric_conductivity: float | None = None
    source: str
    collected_at: datetime
    received_at: datetime


class AlertOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    reading_id: int
    device_id: int
    site_id: int | None = None
    owner_user_id: int | None = None
    recipient_user_id: int | None = None
    recipient_role: str | None = None
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
    generated_by_name: str | None = None
    generated_by_role: str | None = None
    title: str
    report_type: str
    scope: str
    format: str
    status: str
    parameters: dict | None = None
    created_at: datetime


class ReportScheduleCreate(BaseModel):
    title: str
    report_type: str
    format: str = "pdf"
    frequency: str = "daily"
    time_of_day: str = "08:00"
    day_of_week: int | None = None
    day_of_month: int | None = None
    date_from: datetime | None = None
    date_to: datetime | None = None
    is_active: bool = True


class ReportScheduleUpdate(BaseModel):
    title: str | None = None
    report_type: str | None = None
    format: str | None = None
    frequency: str | None = None
    time_of_day: str | None = None
    day_of_week: int | None = None
    day_of_month: int | None = None
    date_from: datetime | None = None
    date_to: datetime | None = None
    is_active: bool | None = None


class ReportScheduleOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    title: str
    report_type: str
    format: str
    frequency: str
    time_of_day: str
    day_of_week: int | None = None
    day_of_month: int | None = None
    date_from: datetime | None = None
    date_to: datetime | None = None
    next_run_at: datetime | None = None
    last_run_at: datetime | None = None
    is_active: bool
    created_at: datetime
    updated_at: datetime


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


class AgentContactCreate(BaseModel):
    name: str
    email: str | None = None
    phone: str | None = None
    tag: str | None = None


class AgentContactUpdate(BaseModel):
    name: str | None = None
    email: str | None = None
    phone: str | None = None
    tag: str | None = None


class AgentContactOut(BaseModel):
    id: int
    name: str
    email: str | None = None
    phone: str | None = None
    tag: str | None = None
    readonly: bool = False


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
    owner_viewed_at: datetime | None = None
    accepted_by_user_id: int | None = None
    accepted_at: datetime | None = None
    resolved_by_user_id: int | None = None
    created_at: datetime
    resolved_at: datetime | None = None


class NotificationDeliveryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    event_type: str
    channel: str
    recipient_user_id: int
    recipient_email: str
    subject: str
    status: str
    error_message: str | None = None
    alert_id: int | None = None
    emergency_id: int | None = None
    created_at: datetime
    sent_at: datetime | None = None


class PushConfigOut(BaseModel):
    enabled: bool
    provider: str = "onesignal"
    app_id: str | None = None


class PushSubscriptionUpsert(BaseModel):
    provider: str = "onesignal"
    subscription_id: str = Field(min_length=8, max_length=255)
    device_label: str | None = Field(default=None, max_length=120)

    @field_validator("provider")
    @classmethod
    def validate_provider(cls, value: str) -> str:
        normalized = value.strip().lower()
        if normalized != "onesignal":
            raise ValueError("Only OneSignal push subscriptions are supported.")
        return normalized

    @field_validator("subscription_id")
    @classmethod
    def trim_subscription_id(cls, value: str) -> str:
        return value.strip()


class PushSubscriptionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    provider: str
    subscription_id: str
    device_label: str | None = None
    is_active: bool
    created_at: datetime
    updated_at: datetime


class EmergencyDetailOut(EmergencyOut):
    triggered_by_name: str | None = None
    triggered_by_email: str | None = None
    triggered_by_role: str | None = None
    site_name: str | None = None
    owner_name: str | None = None
    owner_email: str | None = None
    accepted_by_name: str | None = None
    accepted_by_email: str | None = None
    deliveries: list[NotificationDeliveryOut] = Field(default_factory=list)
