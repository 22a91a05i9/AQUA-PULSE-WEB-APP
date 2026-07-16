from __future__ import annotations

from app.models import User, UserSetting


SUPPORTED_LANGUAGES = {"en", "hi", "te"}
TWILIO_VOICE_LANGUAGE = {
    "en": "en-IN",
    "hi": "hi-IN",
    "te": "te-IN",
}

LABELS = {
    "en": {
        "unspecified_site": "Unspecified site",
        "priority": "Priority",
        "description": "Description",
        "time": "Time",
        "triggered_by": "Triggered by",
        "agent_email": "Agent email",
        "site": "Site",
        "alerts": "alert(s)",
        "sos_subject": "[SOS {priority}] Emergency from {name}",
        "sms": "Aqua Pulse SOS {priority}: {name} triggered an emergency at {site}. Open Aqua Pulse immediately. Details: {description}",
        "push_title": "SOS {priority}: {site}",
        "push_message": "{name} triggered an emergency. Open Aqua Pulse now.",
        "email_intro": "An SOS emergency was triggered in Aqua Pulse.",
        "email_action": "Please open Aqua Pulse and respond immediately.",
        "email_heading": "Emergency Action Required",
        "call_message": "Aqua Pulse emergency alert. SOS was triggered by {name} at {site}. Priority {priority}. Details: {description}. Please open Aqua Pulse and respond immediately.",
        "call_repeat": "This is an emergency SOS alert from Aqua Pulse.",
        "alert_title": "{metric} threshold crossed",
        "alert_message": "{metric} is {direction} the allowed range for site {site}. Actual value: {value}.",
        "below": "below",
        "above": "above",
        "temperature_c": "Temperature",
        "ph": "pH",
        "turbidity_ntu": "Turbidity",
        "ammonia": "Ammonia",
        "dissolved_oxygen": "Dissolved oxygen",
        "nitrate": "Nitrate",
        "salinity": "Salinity",
        "electric_conductivity": "Electric conductivity",
    },
    "hi": {
        "unspecified_site": "अनिर्दिष्ट साइट",
        "priority": "प्राथमिकता",
        "description": "विवरण",
        "time": "समय",
        "triggered_by": "शुरू किया",
        "agent_email": "एजेंट ईमेल",
        "site": "साइट",
        "alerts": "अलर्ट",
        "sos_subject": "[SOS {priority}] {name} से आपातकाल",
        "sms": "Aqua Pulse SOS {priority}: {name} ने {site} पर आपातकाल शुरू किया है। तुरंत Aqua Pulse खोलें। विवरण: {description}",
        "push_title": "SOS {priority}: {site}",
        "push_message": "{name} ने आपातकाल शुरू किया है। अभी Aqua Pulse खोलें।",
        "email_intro": "Aqua Pulse में SOS आपातकाल शुरू किया गया है।",
        "email_action": "कृपया Aqua Pulse खोलें और तुरंत प्रतिक्रिया दें।",
        "email_heading": "आपातकालीन कार्रवाई आवश्यक",
        "call_message": "Aqua Pulse आपातकालीन अलर्ट। {name} ने {site} पर SOS शुरू किया है। प्राथमिकता {priority}। विवरण: {description}। कृपया Aqua Pulse खोलें और तुरंत प्रतिक्रिया दें।",
        "call_repeat": "यह Aqua Pulse से आपातकालीन SOS अलर्ट है।",
        "alert_title": "{metric} सीमा पार हुई",
        "alert_message": "{metric}, {site} साइट के लिए अनुमत सीमा से {direction} है। वास्तविक मान: {value}।",
        "below": "नीचे",
        "above": "ऊपर",
        "temperature_c": "तापमान",
        "ph": "pH",
        "turbidity_ntu": "टर्बिडिटी",
        "ammonia": "अमोनिया",
        "dissolved_oxygen": "घुलित ऑक्सीजन",
        "nitrate": "नाइट्रेट",
        "salinity": "लवणता",
        "electric_conductivity": "विद्युत चालकता",
    },
    "te": {
        "unspecified_site": "పేర్కొనని సైట్",
        "priority": "ప్రాధాన్యత",
        "description": "వివరణ",
        "time": "సమయం",
        "triggered_by": "ప్రారంభించిన వ్యక్తి",
        "agent_email": "ఏజెంట్ ఇమెయిల్",
        "site": "సైట్",
        "alerts": "హెచ్చరికలు",
        "sos_subject": "[SOS {priority}] {name} నుండి అత్యవసర హెచ్చరిక",
        "sms": "Aqua Pulse SOS {priority}: {name} {site} వద్ద అత్యవసర పరిస్థితిని ప్రారంభించారు. వెంటనే Aqua Pulse తెరవండి. వివరాలు: {description}",
        "push_title": "SOS {priority}: {site}",
        "push_message": "{name} అత్యవసర పరిస్థితిని ప్రారంభించారు. ఇప్పుడే Aqua Pulse తెరవండి.",
        "email_intro": "Aqua Pulse లో SOS అత్యవసర పరిస్థితి ప్రారంభించబడింది.",
        "email_action": "దయచేసి Aqua Pulse తెరిచి వెంటనే స్పందించండి.",
        "email_heading": "అత్యవసర చర్య అవసరం",
        "call_message": "Aqua Pulse అత్యవసర హెచ్చరిక. {name} {site} వద్ద SOS ప్రారంభించారు. ప్రాధాన్యత {priority}. వివరాలు: {description}. దయచేసి Aqua Pulse తెరిచి వెంటనే స్పందించండి.",
        "call_repeat": "ఇది Aqua Pulse నుండి అత్యవసర SOS హెచ్చరిక.",
        "alert_title": "{metric} పరిమితి దాటింది",
        "alert_message": "{metric}, {site} సైట్‌కు అనుమతించిన పరిధికి {direction} ఉంది. నిజమైన విలువ: {value}.",
        "below": "కంటే తక్కువగా",
        "above": "కంటే ఎక్కువగా",
        "temperature_c": "ఉష్ణోగ్రత",
        "ph": "pH",
        "turbidity_ntu": "టర్బిడిటీ",
        "ammonia": "అమోనియా",
        "dissolved_oxygen": "కరిగిన ఆక్సిజన్",
        "nitrate": "నైట్రేట్",
        "salinity": "లవణత",
        "electric_conductivity": "విద్యుత్ చాలకత్వం",
    },
}


def normalize_language(value: str | None) -> str:
    lang = (value or "en").strip().lower()
    return lang if lang in SUPPORTED_LANGUAGES else "en"


def user_language(user: User) -> str:
    for setting in getattr(user, "settings", []) or []:
        language = _language_from_setting(setting)
        if language:
            return language
    return "en"


def _language_from_setting(setting: UserSetting) -> str | None:
    for source in (setting.notification_prefs, setting.profile_json):
        if isinstance(source, dict):
            language = source.get("language")
            if language:
                return normalize_language(str(language))
    return None


def label(key: str, lang: str, **values: object) -> str:
    language = normalize_language(lang)
    template = LABELS.get(language, LABELS["en"]).get(key, LABELS["en"].get(key, key))
    return template.format(**values)
