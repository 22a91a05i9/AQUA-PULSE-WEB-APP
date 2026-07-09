import json

from pydantic import Field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "Aqua IoT Platform"
    app_env: str = Field(default="development", alias="APP_ENV")
    database_url: str = Field(default="sqlite:///./aqua_iot.db", alias="DATABASE_URL")
    secret_key: str = Field(default="change-this-secret-key", alias="SECRET_KEY")
    algorithm: str = "HS256"
    access_token_expire_minutes: int = Field(default=1440, alias="ACCESS_TOKEN_EXPIRE_MINUTES")

    default_manager_email: str = Field(default="manager@gmail.com", alias="DEFAULT_MANAGER_EMAIL")
    default_manager_password: str = Field(default="12345678", alias="DEFAULT_MANAGER_PASSWORD")

    mqtt_enabled: bool = Field(default=False, alias="MQTT_ENABLED")
    mqtt_broker: str = Field(default="127.0.0.1", alias="MQTT_BROKER")
    mqtt_port: int = Field(default=1883, alias="MQTT_PORT")
    mqtt_topic: str = Field(default="aqua/+/+/readings", alias="MQTT_TOPIC")
    mqtt_username: str = Field(default="", alias="MQTT_USERNAME")
    mqtt_password: str = Field(default="", alias="MQTT_PASSWORD")

    smtp_host: str = Field(default="", alias="SMTP_HOST")
    smtp_port: int = Field(default=587, alias="SMTP_PORT")
    smtp_username: str = Field(default="", alias="SMTP_USERNAME")
    smtp_password: str = Field(default="", alias="SMTP_PASSWORD")
    smtp_from_email: str = Field(default="", alias="SMTP_FROM_EMAIL")
    smtp_from_name: str = Field(default="Aqua Monitoring System", alias="SMTP_FROM_NAME")
    smtp_use_tls: bool = Field(default=True, alias="SMTP_USE_TLS")
    smtp_use_ssl: bool = Field(default=False, alias="SMTP_USE_SSL")
    frontend_base_url: str = Field(default="http://localhost:5173", alias="FRONTEND_BASE_URL")
    onesignal_app_id: str = Field(default="", alias="ONESIGNAL_APP_ID")
    onesignal_rest_api_key: str = Field(default="", alias="ONESIGNAL_REST_API_KEY")
    emergency_push_enabled: bool = Field(default=False, alias="EMERGENCY_PUSH_ENABLED")
    emergency_push_sound: str = Field(default="emergency", alias="EMERGENCY_PUSH_SOUND")
    twilio_account_sid: str = Field(default="", alias="TWILIO_ACCOUNT_SID")
    twilio_auth_token: str = Field(default="", alias="TWILIO_AUTH_TOKEN")
    twilio_from_phone: str = Field(default="", alias="TWILIO_FROM_PHONE")
    twilio_studio_flow_sid: str = Field(default="", alias="TWILIO_STUDIO_FLOW_SID")
    twilio_default_country_code: str = Field(default="+91", alias="TWILIO_DEFAULT_COUNTRY_CODE")
    emergency_sms_enabled: bool = Field(default=True, alias="EMERGENCY_SMS_ENABLED")
    emergency_call_enabled: bool = Field(default=True, alias="EMERGENCY_CALL_ENABLED")
    emergency_studio_flow_enabled: bool = Field(default=True, alias="EMERGENCY_STUDIO_FLOW_ENABLED")
    auto_critical_sos_enabled: bool = Field(default=True, alias="AUTO_CRITICAL_SOS_ENABLED")
    auto_critical_sos_cooldown_minutes: int = Field(default=30, alias="AUTO_CRITICAL_SOS_COOLDOWN_MINUTES")

    cors_origins: list[str] = Field(default=["*"], alias="CORS_ORIGINS")
    trusted_hosts: list[str] = Field(default=["*"], alias="TRUSTED_HOSTS")

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, value):
        if isinstance(value, str):
            value = value.strip()
            if not value:
                return ["*"]
            if value == "*":
                return ["*"]
            if value.startswith("["):
                parsed = json.loads(value)
                return [str(item).strip() for item in parsed if str(item).strip()]
            return [item.strip() for item in value.split(",") if item.strip()]
        return value

    @field_validator("trusted_hosts", mode="before")
    @classmethod
    def parse_trusted_hosts(cls, value):
        if isinstance(value, str):
            value = value.strip()
            if not value:
                return ["*"]
            if value == "*":
                return ["*"]
            if value.startswith("["):
                parsed = json.loads(value)
                return [str(item).strip() for item in parsed if str(item).strip()]
            return [item.strip() for item in value.split(",") if item.strip()]
        return value

    @model_validator(mode="after")
    def validate_production_security(self):
        if self.app_env.lower() == "production":
            if self.secret_key == "change-this-secret-key":
                raise ValueError("SECRET_KEY must be changed for production")
            if self.default_manager_password == "12345678":
                raise ValueError("DEFAULT_MANAGER_PASSWORD must be changed for production")
        return self


settings = Settings()
