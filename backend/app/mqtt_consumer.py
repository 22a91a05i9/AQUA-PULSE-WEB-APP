import json
import logging

import paho.mqtt.client as mqtt

from app.core.config import settings
from app.db import SessionLocal
from app.schemas import ReadingIngest
from app.services.ingestion import store_device_reading


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("mqtt-consumer")


def on_connect(client, userdata, flags, reason_code, properties=None):
    logger.info("Connected to MQTT broker with reason code %s", reason_code)
    client.subscribe(settings.mqtt_topic)
    logger.info("Subscribed to topic %s", settings.mqtt_topic)


def on_message(client, userdata, msg):
    try:
        payload = json.loads(msg.payload.decode("utf-8"))
        reading = ReadingIngest(**payload)
        db = SessionLocal()
        try:
            stored = store_device_reading(db, reading, source="mqtt")
            logger.info("Stored reading %s for device %s", stored.id, payload.get("device_id"))
        finally:
            db.close()
    except Exception as exc:
        logger.exception("Failed to process MQTT message from %s: %s", msg.topic, exc)


def create_client():
    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
    if settings.mqtt_username:
        client.username_pw_set(settings.mqtt_username, settings.mqtt_password)

    client.on_connect = on_connect
    client.on_message = on_message
    return client


def start_listener():
    client = create_client()
    client.connect(settings.mqtt_broker, settings.mqtt_port, 60)
    client.loop_start()
    logger.info("MQTT listener started for %s:%s", settings.mqtt_broker, settings.mqtt_port)
    return client


def stop_listener(client):
    if client is None:
        return
    client.loop_stop()
    client.disconnect()
    logger.info("MQTT listener stopped")


def main():
    client = create_client()
    client.connect(settings.mqtt_broker, settings.mqtt_port, 60)
    client.loop_forever()


if __name__ == "__main__":
    main()
