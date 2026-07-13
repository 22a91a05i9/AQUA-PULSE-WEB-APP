import { useEffect, useState } from 'react';
import { apiRequest } from './api';
import { getAuthSession } from './auth';

type LanguageCode = 'en' | 'hi' | 'te';

const LANGUAGE_STORAGE_KEY = 'app-lang';

const phraseTranslations: Record<LanguageCode, Record<string, string>> = {
  en: {},
  hi: {
    'Agent Dashboard': 'एजेंट डैशबोर्ड',
    'Agent Sites': 'एजेंट साइटें',
    'Agent Devices': 'एजेंट डिवाइस',
    'Agent Live Monitoring': 'एजेंट लाइव मॉनिटरिंग',
    'Agent Alerts': 'एजेंट अलर्ट',
    'Agent SOS Emergency': 'एजेंट SOS आपातकाल',
    'Agent Analytics': 'एजेंट विश्लेषण',
    'Agent Reports': 'एजेंट रिपोर्ट',
    'Agent Settings': 'एजेंट सेटिंग्स',
    'Manage assigned aquaculture farm sites and locations.': 'सौंपे गए एक्वाकल्चर फार्म साइट और स्थान प्रबंधित करें।',
    'Manage and monitor all connected sensors and devices.': 'सभी जुड़े सेंसर और डिवाइस प्रबंधित और मॉनिटर करें।',
    'Real-time water quality and environmental data streams.': 'रीयल-टाइम जल गुणवत्ता और पर्यावरणीय डेटा स्ट्रीम।',
    'View and manage all active alerts and notifications.': 'सभी सक्रिय अलर्ट और सूचनाएं देखें और प्रबंधित करें।',
    'Emergency response and critical incident management.': 'आपातकालीन प्रतिक्रिया और गंभीर घटना प्रबंधन।',
    'Gain insights from pond data to make informed decisions and improve operations.': 'तालाब डेटा से जानकारी लेकर बेहतर निर्णय लें और संचालन सुधारें।',
    'Generate and download detailed reports to analyze performance and track operations.': 'प्रदर्शन का विश्लेषण और संचालन ट्रैक करने के लिए विस्तृत रिपोर्ट बनाएं और डाउनलोड करें।',
    'Manage your account, alerts and preferences.': 'अपना खाता, अलर्ट और प्राथमिकताएं प्रबंधित करें।',
    'Choose your application theme': 'अपनी ऐप थीम चुनें',
    'Select your preferred language': 'अपनी पसंदीदा भाषा चुनें',
    'Update your account password': 'अपने खाते का पासवर्ड अपडेट करें',
    'View our privacy policy': 'हमारी गोपनीयता नीति देखें',
    'Receive alerts and updates via email': 'ईमेल से अलर्ट और अपडेट प्राप्त करें',
    'Receive critical alerts via SMS': 'SMS से गंभीर अलर्ट प्राप्त करें',
    'Important system updates and announcements': 'महत्वपूर्ण सिस्टम अपडेट और घोषणाएं',
    'Product updates and other communications': 'उत्पाद अपडेट और अन्य संदेश',
    'Smart Aquaculture Monitoring System': 'स्मार्ट एक्वाकल्चर मॉनिटरिंग सिस्टम',
    'My Contacts': 'मेरे संपर्क',
    'Add Contact': 'संपर्क जोड़ें',
    'Receive alerts & notifications via': 'अलर्ट और सूचनाएं प्राप्त करें',
    'Email Notifications': 'ईमेल सूचनाएं',
    'SMS Notifications': 'SMS सूचनाएं',
    'System Updates': 'सिस्टम अपडेट',
    'Marketing Communications': 'मार्केटिंग संदेश',
    'Change Password': 'पासवर्ड बदलें',
    'Current password': 'वर्तमान पासवर्ड',
    'New password': 'नया पासवर्ड',
    'Confirm password': 'पासवर्ड पुष्टि करें',
    'Cancel': 'रद्द करें',
    'Save': 'सेव करें',
    'Update': 'अपडेट करें',
    'Edit Profile': 'प्रोफाइल संपादित करें',
    'Full name': 'पूरा नाम',
    'Email': 'ईमेल',
    'Mobile number': 'मोबाइल नंबर',
    'Profile': 'प्रोफाइल',
    'Upload': 'अपलोड',
    'Remove': 'हटाएं',
    'Close': 'बंद करें',
    'Logout': 'लॉग आउट',
    'Agent Workspace': 'एजेंट कार्यक्षेत्र',
    'Owner Workspace': 'मालिक कार्यक्षेत्र',
    'Manager Workspace': 'मैनेजर कार्यक्षेत्र',
    'Search alerts...': 'अलर्ट खोजें...',
    'No alerts found for this site.': 'इस साइट के लिए कोई अलर्ट नहीं मिला।',
    'No active alerts found for this site.': 'इस साइट के लिए कोई सक्रिय अलर्ट नहीं मिला।',
    'No SOS emergencies sent yet.': 'अभी तक कोई SOS आपातकाल नहीं भेजा गया।',
    'Press SOS To Notify': 'सूचित करने के लिए SOS दबाएं',
    'Emergency Alert Sent': 'आपातकालीन अलर्ट भेजा गया',
    'Emergency Alert Failed': 'आपातकालीन अलर्ट विफल',
    'Accept SOS': 'SOS स्वीकार करें',
    'Resolve SOS': 'SOS हल करें',
    'Accepted': 'स्वीकार किया गया',
    'Resolved': 'हल किया गया',
    'Active': 'सक्रिय',
    'Warnings': 'चेतावनियां',
    'Outside preferred range': 'पसंदीदा सीमा से बाहर',
    'Welcome Back!': 'वापस स्वागत है!',
    'Sign in to your account': 'अपने खाते में साइन इन करें',
    'Aqua Pulse login form': 'Aqua Pulse लॉगिन फॉर्म',
    'Enter your email': 'अपना ईमेल दर्ज करें',
    'Password': 'पासवर्ड',
    'Enter your password': 'अपना पासवर्ड दर्ज करें',
    'Hide password': 'पासवर्ड छिपाएं',
    'Show password': 'पासवर्ड दिखाएं',
    'Forgot Password?': 'पासवर्ड भूल गए?',
    'Login': 'लॉगिन',
    'Logging in...': 'लॉगिन हो रहा है...',
    'Back to Login': 'लॉगिन पर वापस जाएं',
    'No worries! Enter your registered email address and we\'ll send you a reset code.': 'चिंता न करें! अपना पंजीकृत ईमेल पता दर्ज करें और हम आपको रीसेट कोड भेजेंगे।',
    'Email Address': 'ईमेल पता',
    'Enter your email address': 'अपना ईमेल पता दर्ज करें',
    'Send Reset Code': 'रीसेट कोड भेजें',
    'Sending...': 'भेजा जा रहा है...',
    'OR': 'या',
    'Contact our support team': 'हमारी सहायता टीम से संपर्क करें',
    'Create New Password': 'नया पासवर्ड बनाएं',
    'Enter the reset code from your email and create a new password.': 'अपने ईमेल से रीसेट कोड दर्ज करें और नया पासवर्ड बनाएं।',
    'Registered email': 'पंजीकृत ईमेल',
    'Send New Reset Code': 'नया रीसेट कोड भेजें',
    '5-digit reset code': '5 अंकों का रीसेट कोड',
    'Update Password': 'पासवर्ड अपडेट करें',
    'Updating...': 'अपडेट हो रहा है...',
    'Login failed. Please check your details or backend connection.': 'लॉगिन विफल। कृपया अपनी जानकारी या बैकएंड कनेक्शन जांचें।',
    'Password is wrong': 'पासवर्ड गलत है',
    'Enter your registered email first.': 'पहले अपना पंजीकृत ईमेल दर्ज करें।',
    'Reset code sent to your email.': 'रीसेट कोड आपके ईमेल पर भेज दिया गया है।',
    'Unable to request password reset.': 'पासवर्ड रीसेट अनुरोध नहीं हो सका।',
    'Enter the reset code, new password, and confirm password.': 'रीसेट कोड, नया पासवर्ड और पुष्टि पासवर्ड दर्ज करें।',
    'Enter the 5-digit reset code from your email.': 'अपने ईमेल से 5 अंकों का रीसेट कोड दर्ज करें।',
    'New password and confirm password do not match.': 'नया पासवर्ड और पुष्टि पासवर्ड मेल नहीं खाते।',
    'Unable to reset password.': 'पासवर्ड रीसेट नहीं हो सका।',
    'Reset code is wrong.': 'रीसेट कोड गलत है।',
  },
  te: {
    'Agent Dashboard': 'ఏజెంట్ డాష్‌బోర్డ్',
    'Agent Sites': 'ఏజెంట్ సైట్లు',
    'Agent Devices': 'ఏజెంట్ పరికరాలు',
    'Agent Live Monitoring': 'ఏజెంట్ లైవ్ మానిటరింగ్',
    'Agent Alerts': 'ఏజెంట్ హెచ్చరికలు',
    'Agent SOS Emergency': 'ఏజెంట్ SOS అత్యవసరం',
    'Agent Analytics': 'ఏజెంట్ విశ్లేషణలు',
    'Agent Reports': 'ఏజెంట్ నివేదికలు',
    'Agent Settings': 'ఏజెంట్ సెట్టింగులు',
    'Manage assigned aquaculture farm sites and locations.': 'కేటాయించిన ఆక్వాకల్చర్ ఫార్మ్ సైట్లు మరియు స్థానాలను నిర్వహించండి.',
    'Manage and monitor all connected sensors and devices.': 'అన్ని కనెక్ట్ చేసిన సెన్సర్లు మరియు పరికరాలను నిర్వహించి పర్యవేక్షించండి.',
    'Real-time water quality and environmental data streams.': 'రియల్-టైమ్ నీటి నాణ్యత మరియు పర్యావరణ డేటా స్ట్రీమ్‌లు.',
    'View and manage all active alerts and notifications.': 'అన్ని క్రియాశీల హెచ్చరికలు మరియు నోటిఫికేషన్లను చూడండి, నిర్వహించండి.',
    'Emergency response and critical incident management.': 'అత్యవసర స్పందన మరియు కీలక ఘటనల నిర్వహణ.',
    'Gain insights from pond data to make informed decisions and improve operations.': 'చెరువు డేటా ద్వారా అవగాహన పొంది మెరుగైన నిర్ణయాలు తీసుకోండి.',
    'Generate and download detailed reports to analyze performance and track operations.': 'పనితీరును విశ్లేషించడానికి మరియు కార్యకలాపాలను ట్రాక్ చేయడానికి నివేదికలు రూపొందించి డౌన్‌లోడ్ చేయండి.',
    'Manage your account, alerts and preferences.': 'మీ ఖాతా, హెచ్చరికలు మరియు ప్రాధాన్యతలను నిర్వహించండి.',
    'Choose your application theme': 'మీ అప్లికేషన్ థీమ్‌ను ఎంచుకోండి',
    'Select your preferred language': 'మీకు ఇష్టమైన భాషను ఎంచుకోండి',
    'Update your account password': 'మీ ఖాతా పాస్‌వర్డ్‌ను నవీకరించండి',
    'View our privacy policy': 'మా గోప్యతా విధానాన్ని చూడండి',
    'Receive alerts and updates via email': 'ఇమెయిల్ ద్వారా హెచ్చరికలు మరియు నవీకరణలు పొందండి',
    'Receive critical alerts via SMS': 'SMS ద్వారా కీలక హెచ్చరికలు పొందండి',
    'Important system updates and announcements': 'ముఖ్యమైన సిస్టమ్ నవీకరణలు మరియు ప్రకటనలు',
    'Product updates and other communications': 'ఉత్పత్తి నవీకరణలు మరియు ఇతర సమాచారాలు',
    'Smart Aquaculture Monitoring System': 'స్మార్ట్ ఆక్వాకల్చర్ మానిటరింగ్ సిస్టమ్',
    'My Contacts': 'నా సంప్రదింపులు',
    'Add Contact': 'సంప్రదింపును జోడించండి',
    'Receive alerts & notifications via': 'హెచ్చరికలు మరియు నోటిఫికేషన్లు పొందే మార్గం',
    'Email Notifications': 'ఇమెయిల్ నోటిఫికేషన్లు',
    'SMS Notifications': 'SMS నోటిఫికేషన్లు',
    'System Updates': 'సిస్టమ్ నవీకరణలు',
    'Marketing Communications': 'మార్కెటింగ్ సమాచారాలు',
    'Change Password': 'పాస్‌వర్డ్ మార్చండి',
    'Current password': 'ప్రస్తుత పాస్‌వర్డ్',
    'New password': 'కొత్త పాస్‌వర్డ్',
    'Confirm password': 'పాస్‌వర్డ్ నిర్ధారించండి',
    'Cancel': 'రద్దు చేయండి',
    'Save': 'సేవ్ చేయండి',
    'Update': 'నవీకరించండి',
    'Edit Profile': 'ప్రొఫైల్ సవరించండి',
    'Full name': 'పూర్తి పేరు',
    'Email': 'ఇమెయిల్',
    'Mobile number': 'మొబైల్ నంబర్',
    'Profile': 'ప్రొఫైల్',
    'Upload': 'అప్‌లోడ్',
    'Remove': 'తీసివేయండి',
    'Close': 'మూసివేయండి',
    'Logout': 'లాగ్ అవుట్',
    'Agent Workspace': 'ఏజెంట్ వర్క్‌స్పేస్',
    'Owner Workspace': 'యజమాని వర్క్‌స్పేస్',
    'Manager Workspace': 'మేనేజర్ వర్క్‌స్పేస్',
    'Search alerts...': 'హెచ్చరికలు వెతకండి...',
    'No alerts found for this site.': 'ఈ సైట్‌కు హెచ్చరికలు లేవు.',
    'No active alerts found for this site.': 'ఈ సైట్‌కు క్రియాశీల హెచ్చరికలు లేవు.',
    'No SOS emergencies sent yet.': 'ఇంకా SOS అత్యవసరాలు పంపబడలేదు.',
    'Press SOS To Notify': 'తెలియజేయడానికి SOS నొక్కండి',
    'Emergency Alert Sent': 'అత్యవసర హెచ్చరిక పంపబడింది',
    'Emergency Alert Failed': 'అత్యవసర హెచ్చరిక విఫలమైంది',
    'Accept SOS': 'SOS అంగీకరించండి',
    'Resolve SOS': 'SOS పరిష్కరించండి',
    'Accepted': 'అంగీకరించబడింది',
    'Resolved': 'పరిష్కరించబడింది',
    'Active': 'క్రియాశీలం',
    'Warnings': 'హెచ్చరికలు',
    'Outside preferred range': 'ఇష్టమైన పరిధికి బయట',
    'Welcome Back!': 'తిరిగి స్వాగతం!',
    'Sign in to your account': 'మీ ఖాతాలోకి సైన్ ఇన్ చేయండి',
    'Aqua Pulse login form': 'Aqua Pulse లాగిన్ ఫారమ్',
    'Enter your email': 'మీ ఇమెయిల్ నమోదు చేయండి',
    'Password': 'పాస్‌వర్డ్',
    'Enter your password': 'మీ పాస్‌వర్డ్ నమోదు చేయండి',
    'Hide password': 'పాస్‌వర్డ్ దాచండి',
    'Show password': 'పాస్‌వర్డ్ చూపండి',
    'Forgot Password?': 'పాస్‌వర్డ్ మర్చిపోయారా?',
    'Login': 'లాగిన్',
    'Logging in...': 'లాగిన్ అవుతోంది...',
    'Back to Login': 'లాగిన్‌కు తిరిగి వెళ్ళండి',
    'No worries! Enter your registered email address and we\'ll send you a reset code.': 'ఆందోళన అవసరం లేదు! మీ నమోదు చేసిన ఇమెయిల్ చిరునామా ఇవ్వండి, మేము రీసెట్ కోడ్ పంపుతాము.',
    'Email Address': 'ఇమెయిల్ చిరునామా',
    'Enter your email address': 'మీ ఇమెయిల్ చిరునామా నమోదు చేయండి',
    'Send Reset Code': 'రీసెట్ కోడ్ పంపండి',
    'Sending...': 'పంపుతోంది...',
    'OR': 'లేదా',
    'Contact our support team': 'మా మద్దతు బృందాన్ని సంప్రదించండి',
    'Create New Password': 'కొత్త పాస్‌వర్డ్ సృష్టించండి',
    'Enter the reset code from your email and create a new password.': 'మీ ఇమెయిల్‌లోని రీసెట్ కోడ్ నమోదు చేసి కొత్త పాస్‌వర్డ్ సృష్టించండి.',
    'Registered email': 'నమోదిత ఇమెయిల్',
    'Send New Reset Code': 'కొత్త రీసెట్ కోడ్ పంపండి',
    '5-digit reset code': '5 అంకెల రీసెట్ కోడ్',
    'Update Password': 'పాస్‌వర్డ్ నవీకరించండి',
    'Updating...': 'నవీకరిస్తోంది...',
    'Login failed. Please check your details or backend connection.': 'లాగిన్ విఫలమైంది. దయచేసి మీ వివరాలు లేదా బ్యాకెండ్ కనెక్షన్ తనిఖీ చేయండి.',
    'Password is wrong': 'పాస్‌వర్డ్ తప్పు',
    'Enter your registered email first.': 'ముందుగా మీ నమోదు చేసిన ఇమెయిల్ నమోదు చేయండి.',
    'Reset code sent to your email.': 'రీసెట్ కోడ్ మీ ఇమెయిల్‌కు పంపబడింది.',
    'Unable to request password reset.': 'పాస్‌వర్డ్ రీసెట్ అభ్యర్థన చేయలేకపోయాం.',
    'Enter the reset code, new password, and confirm password.': 'రీసెట్ కోడ్, కొత్త పాస్‌వర్డ్, నిర్ధారణ పాస్‌వర్డ్ నమోదు చేయండి.',
    'Enter the 5-digit reset code from your email.': 'మీ ఇమెయిల్‌లోని 5 అంకెల రీసెట్ కోడ్ నమోదు చేయండి.',
    'New password and confirm password do not match.': 'కొత్త పాస్‌వర్డ్ మరియు నిర్ధారణ పాస్‌వర్డ్ సరిపోలడం లేదు.',
    'Unable to reset password.': 'పాస్‌వర్డ్ రీసెట్ చేయలేకపోయాం.',
    'Reset code is wrong.': 'రీసెట్ కోడ్ తప్పు.',
  },
};

Object.assign(phraseTranslations.hi, {
  'Monitor your aquaculture operations and site performance.': 'अपने एक्वाकल्चर संचालन और साइट प्रदर्शन की निगरानी करें।',
  'Manage and monitor all your aquaculture sites.': 'अपनी सभी एक्वाकल्चर साइटों को प्रबंधित और मॉनिटर करें।',
  'Manage and monitor your agents.': 'अपने एजेंटों को प्रबंधित और मॉनिटर करें।',
  'Create New Agent': 'नया एजेंट बनाएं',
  'Agents  >  Create New Agent': 'एजेंट > नया एजेंट बनाएं',
  'Settings  >  Add Agent': 'सेटिंग्स > एजेंट जोड़ें',
  'Monitor and manage your connected devices': 'अपने जुड़े डिवाइस मॉनिटर और प्रबंधित करें',
  'View live water quality and device status across ponds.': 'तालाबों में लाइव जल गुणवत्ता और डिवाइस स्थिति देखें।',
  'Assign devices and agents to sites.': 'डिवाइस और एजेंटों को साइटों पर असाइन करें।',
  'Stay updated with important alerts from your aquaculture operations.': 'अपने एक्वाकल्चर संचालन से महत्वपूर्ण अलर्ट से अपडेट रहें।',
  'View real-time sensor readings.': 'रीयल-टाइम सेंसर रीडिंग देखें।',
  'Review emergency response and critical incidents.': 'आपातकालीन प्रतिक्रिया और गंभीर घटनाओं की समीक्षा करें।',
  'Analyze water quality, device health, and feed trends.': 'जल गुणवत्ता, डिवाइस स्वास्थ्य और फीड रुझानों का विश्लेषण करें।',
  'View, generate and export system reports.': 'सिस्टम रिपोर्ट देखें, बनाएं और निर्यात करें।',
  'Manage account preferences and notifications.': 'खाता प्राथमिकताएं और सूचनाएं प्रबंधित करें।',
  'Smart Aquaculture': 'स्मार्ट एक्वाकल्चर',
  'Owners': 'मालिक',
  'New Owner': 'नया मालिक',
  'Default Manager': 'डिफ़ॉल्ट मैनेजर',
  'Manager Control Center': 'मैनेजर नियंत्रण केंद्र',
  'Owners, devices, onboarding, and rollout visibility': 'मालिक, डिवाइस, ऑनबोर्डिंग और रोलआउट दृश्यता',
  'Use this workspace to onboard owners, register monitoring devices, and control the first assignment flow before field operations begin.': 'फील्ड संचालन शुरू होने से पहले मालिकों को ऑनबोर्ड करने, मॉनिटरिंग डिवाइस पंजीकृत करने और पहले असाइनमेंट फ्लो को नियंत्रित करने के लिए इस कार्यक्षेत्र का उपयोग करें।',
  'Open Control Center': 'नियंत्रण केंद्र खोलें',
  'Last Updated': 'अंतिम अपडेट',
  'Contact support': 'सहायता से संपर्क करें',
  'Loading...': 'लोड हो रहा है...',
  'Total owners': 'कुल मालिक',
  'Total agents': 'कुल एजेंट',
  'Total devices': 'कुल डिवाइस',
  'Total sites': 'कुल साइटें',
  'Open Alerts': 'खुले अलर्ट',
  'Total open alerts': 'कुल खुले अलर्ट',
  'Total Devices': 'कुल डिवाइस',
  'Active Devices': 'सक्रिय डिवाइस',
  'Offline Devices': 'ऑफलाइन डिवाइस',
  'Data Readings': 'डेटा रीडिंग',
  'System Uptime': 'सिस्टम अपटाइम',
  'Alerts This Week': 'इस सप्ताह अलर्ट',
  'Critical Alerts': 'गंभीर अलर्ट',
  'No critical alerts': 'कोई गंभीर अलर्ट नहीं',
  'Account Settings': 'खाता सेटिंग्स',
  'Profile Settings': 'प्रोफाइल सेटिंग्स',
  'Update your personal information, email, and profile picture.': 'अपनी व्यक्तिगत जानकारी, ईमेल और प्रोफाइल फोटो अपडेट करें।',
  'Update your password to keep your account secure.': 'अपने खाते को सुरक्षित रखने के लिए पासवर्ड अपडेट करें।',
  'System Settings': 'सिस्टम सेटिंग्स',
  'Configure how and when you receive notifications.': 'आप सूचनाएं कैसे और कब प्राप्त करें, इसे कॉन्फ़िगर करें।',
  'System Preferences': 'सिस्टम प्राथमिकताएं',
  'Customize system preferences and default configurations.': 'सिस्टम प्राथमिकताएं और डिफ़ॉल्ट कॉन्फ़िगरेशन अनुकूलित करें।',
  'Data & Storage': 'डेटा और स्टोरेज',
  'Manage data retention, storage usage, and backups.': 'डेटा रिटेंशन, स्टोरेज उपयोग और बैकअप प्रबंधित करें।',
  'Security Settings': 'सुरक्षा सेटिंग्स',
  'Access Control': 'एक्सेस नियंत्रण',
  'Manage user roles, permissions, and access controls.': 'उपयोगकर्ता भूमिकाएं, अनुमतियां और एक्सेस नियंत्रण प्रबंधित करें।',
  'Activity Logs': 'गतिविधि लॉग',
  'View and monitor system activity and audit logs.': 'सिस्टम गतिविधि और ऑडिट लॉग देखें और मॉनिटर करें।',
  'Select Date': 'तारीख चुनें',
  'Today': 'आज',
  'Yesterday': 'कल',
  'Last 7 Days': 'पिछले 7 दिन',
  'Last 30 Days': 'पिछले 30 दिन',
  'Mark all read': 'सभी को पढ़ा हुआ चिह्नित करें',
  'No recent owner device alerts.': 'हाल के मालिक डिवाइस अलर्ट नहीं हैं।',
  'View All Notifications': 'सभी सूचनाएं देखें',
  'Water quality alert': 'जल गुणवत्ता अलर्ट',
  'Owner device alert': 'मालिक डिवाइस अलर्ट',
  'Inactive': 'निष्क्रिय',
  'Invited': 'आमंत्रित',
  'Warning': 'चेतावनी',
  'Offline': 'ऑफलाइन',
  'Pond Sensor': 'तालाब सेंसर',
  'Water Quality Sensor': 'जल गुणवत्ता सेंसर',
  'Auto Feeder': 'ऑटो फीडर',
  'PH Monitor': 'pH मॉनिटर',
  'Feeder Relay': 'फीडर रिले',
  'Relay Controller': 'रिले नियंत्रक',
  'Gateway': 'गेटवे',
});

Object.assign(phraseTranslations.te, {
  'Monitor your aquaculture operations and site performance.': 'మీ ఆక్వాకల్చర్ కార్యకలాపాలు మరియు సైట్ పనితీరును పర్యవేక్షించండి.',
  'Manage and monitor all your aquaculture sites.': 'మీ అన్ని ఆక్వాకల్చర్ సైట్లను నిర్వహించి పర్యవేక్షించండి.',
  'Manage and monitor your agents.': 'మీ ఏజెంట్లను నిర్వహించి పర్యవేక్షించండి.',
  'Create New Agent': 'కొత్త ఏజెంట్‌ను సృష్టించండి',
  'Agents  >  Create New Agent': 'ఏజెంట్లు > కొత్త ఏజెంట్‌ను సృష్టించండి',
  'Settings  >  Add Agent': 'సెట్టింగులు > ఏజెంట్‌ను జోడించండి',
  'Monitor and manage your connected devices': 'మీ కనెక్ట్ చేసిన పరికరాలను పర్యవేక్షించి నిర్వహించండి',
  'View live water quality and device status across ponds.': 'చెరువులలో లైవ్ నీటి నాణ్యత మరియు పరికర స్థితిని చూడండి.',
  'Assign devices and agents to sites.': 'పరికరాలు మరియు ఏజెంట్లను సైట్లకు కేటాయించండి.',
  'Stay updated with important alerts from your aquaculture operations.': 'మీ ఆక్వాకల్చర్ కార్యకలాపాల నుండి ముఖ్యమైన హెచ్చరికలతో అప్డేట్‌గా ఉండండి.',
  'View real-time sensor readings.': 'రియల్-టైమ్ సెన్సర్ రీడింగ్స్ చూడండి.',
  'Review emergency response and critical incidents.': 'అత్యవసర స్పందన మరియు కీలక ఘటనలను సమీక్షించండి.',
  'Analyze water quality, device health, and feed trends.': 'నీటి నాణ్యత, పరికర ఆరోగ్యం మరియు ఫీడ్ ధోరణులను విశ్లేషించండి.',
  'View, generate and export system reports.': 'సిస్టమ్ నివేదికలను చూడండి, రూపొందించండి మరియు ఎగుమతి చేయండి.',
  'Manage account preferences and notifications.': 'ఖాతా ప్రాధాన్యతలు మరియు నోటిఫికేషన్లను నిర్వహించండి.',
  'Smart Aquaculture': 'స్మార్ట్ ఆక్వాకల్చర్',
  'Owners': 'యజమానులు',
  'New Owner': 'కొత్త యజమాని',
  'Default Manager': 'డిఫాల్ట్ మేనేజర్',
  'Manager Control Center': 'మేనేజర్ నియంత్రణ కేంద్రం',
  'Owners, devices, onboarding, and rollout visibility': 'యజమానులు, పరికరాలు, ఆన్‌బోర్డింగ్ మరియు రోల్‌అవుట్ విజిబిలిటీ',
  'Use this workspace to onboard owners, register monitoring devices, and control the first assignment flow before field operations begin.': 'ఫీల్డ్ కార్యకలాపాలు ప్రారంభం కాకముందు యజమానులను ఆన్‌బోర్డ్ చేయడానికి, మానిటరింగ్ పరికరాలు నమోదు చేయడానికి, మొదటి అసైన్‌మెంట్ ఫ్లోను నియంత్రించడానికి ఈ వర్క్‌స్పేస్‌ను ఉపయోగించండి.',
  'Open Control Center': 'నియంత్రణ కేంద్రాన్ని తెరవండి',
  'Last Updated': 'చివరి నవీకరణ',
  'Contact support': 'మద్దతును సంప్రదించండి',
  'Loading...': 'లోడ్ అవుతోంది...',
  'Total owners': 'మొత్తం యజమానులు',
  'Total agents': 'మొత్తం ఏజెంట్లు',
  'Total devices': 'మొత్తం పరికరాలు',
  'Total sites': 'మొత్తం సైట్లు',
  'Open Alerts': 'తెరిచి ఉన్న హెచ్చరికలు',
  'Total open alerts': 'మొత్తం తెరిచి ఉన్న హెచ్చరికలు',
  'Total Devices': 'మొత్తం పరికరాలు',
  'Active Devices': 'క్రియాశీల పరికరాలు',
  'Offline Devices': 'ఆఫ్‌లైన్ పరికరాలు',
  'Data Readings': 'డేటా రీడింగ్స్',
  'System Uptime': 'సిస్టమ్ అప్టైమ్',
  'Alerts This Week': 'ఈ వారం హెచ్చరికలు',
  'Critical Alerts': 'కీలక హెచ్చరికలు',
  'No critical alerts': 'కీలక హెచ్చరికలు లేవు',
  'Account Settings': 'ఖాతా సెట్టింగులు',
  'Profile Settings': 'ప్రొఫైల్ సెట్టింగులు',
  'Update your personal information, email, and profile picture.': 'మీ వ్యక్తిగత సమాచారం, ఇమెయిల్ మరియు ప్రొఫైల్ చిత్రాన్ని నవీకరించండి.',
  'Update your password to keep your account secure.': 'మీ ఖాతా భద్రంగా ఉండేందుకు పాస్‌వర్డ్ నవీకరించండి.',
  'System Settings': 'సిస్టమ్ సెట్టింగులు',
  'Configure how and when you receive notifications.': 'మీరు నోటిఫికేషన్లు ఎలా, ఎప్పుడు పొందాలో కాన్ఫిగర్ చేయండి.',
  'System Preferences': 'సిస్టమ్ ప్రాధాన్యతలు',
  'Customize system preferences and default configurations.': 'సిస్టమ్ ప్రాధాన్యతలు మరియు డిఫాల్ట్ కాన్ఫిగరేషన్లను అనుకూలీకరించండి.',
  'Data & Storage': 'డేటా మరియు స్టోరేజ్',
  'Manage data retention, storage usage, and backups.': 'డేటా నిల్వ, స్టోరేజ్ వినియోగం మరియు బ్యాకప్‌లను నిర్వహించండి.',
  'Security Settings': 'భద్రతా సెట్టింగులు',
  'Access Control': 'యాక్సెస్ నియంత్రణ',
  'Manage user roles, permissions, and access controls.': 'వినియోగదారు పాత్రలు, అనుమతులు మరియు యాక్సెస్ నియంత్రణలను నిర్వహించండి.',
  'Activity Logs': 'కార్యాచరణ లాగ్‌లు',
  'View and monitor system activity and audit logs.': 'సిస్టమ్ కార్యాచరణ మరియు ఆడిట్ లాగ్‌లను చూడండి, పర్యవేక్షించండి.',
  'Select Date': 'తేదీ ఎంచుకోండి',
  'Today': 'ఈ రోజు',
  'Yesterday': 'నిన్న',
  'Last 7 Days': 'గత 7 రోజులు',
  'Last 30 Days': 'గత 30 రోజులు',
  'Mark all read': 'అన్నింటిని చదివినట్లుగా గుర్తించండి',
  'No recent owner device alerts.': 'ఇటీవలి యజమాని పరికర హెచ్చరికలు లేవు.',
  'View All Notifications': 'అన్ని నోటిఫికేషన్లు చూడండి',
  'Water quality alert': 'నీటి నాణ్యత హెచ్చరిక',
  'Owner device alert': 'యజమాని పరికర హెచ్చరిక',
  'Inactive': 'నిష్క్రియం',
  'Invited': 'ఆహ్వానించబడింది',
  'Warning': 'హెచ్చరిక',
  'Offline': 'ఆఫ్‌లైన్',
  'Pond Sensor': 'చెరువు సెన్సర్',
  'Water Quality Sensor': 'నీటి నాణ్యత సెన్సర్',
  'Auto Feeder': 'ఆటో ఫీడర్',
  'PH Monitor': 'pH మానిటర్',
  'Feeder Relay': 'ఫీడర్ రీలే',
  'Relay Controller': 'రీలే కంట్రోలర్',
  'Gateway': 'గేట్‌వే',
});

const wordTranslations: Record<LanguageCode, Record<string, string>> = {
  en: {},
  hi: {
    account: 'खाता',
    active: 'सक्रिय',
    add: 'जोड़ें',
    address: 'पता',
    agent: 'एजेंट',
    agents: 'एजेंट',
    alert: 'अलर्ट',
    alerts: 'अलर्ट',
    all: 'सभी',
    analytics: 'विश्लेषण',
    analyze: 'विश्लेषण करें',
    app: 'ऐप',
    application: 'एप्लिकेशन',
    assigned: 'सौंपे गए',
    assignment: 'असाइनमेंट',
    assignments: 'असाइनमेंट',
    audit: 'ऑडिट',
    back: 'वापस',
    backups: 'बैकअप',
    battery: 'बैटरी',
    cancel: 'रद्द करें',
    center: 'केंद्र',
    change: 'बदलें',
    code: 'कोड',
    configure: 'कॉन्फ़िगर करें',
    connected: 'जुड़े',
    confirm: 'पुष्टि करें',
    control: 'नियंत्रण',
    controls: 'नियंत्रण',
    contact: 'संपर्क',
    contacts: 'संपर्क',
    create: 'बनाएं',
    critical: 'गंभीर',
    customize: 'अनुकूलित करें',
    dashboard: 'डैशबोर्ड',
    data: 'डेटा',
    date: 'तारीख',
    default: 'डिफ़ॉल्ट',
    delete: 'हटाएं',
    details: 'विवरण',
    device: 'डिवाइस',
    devices: 'डिवाइस',
    download: 'डाउनलोड',
    email: 'ईमेल',
    emergency: 'आपातकाल',
    enter: 'दर्ज करें',
    export: 'निर्यात',
    feed: 'फीड',
    field: 'फील्ड',
    forgot: 'भूल गए',
    generate: 'बनाएं',
    health: 'स्वास्थ्य',
    help: 'सहायता',
    important: 'महत्वपूर्ण',
    inactive: 'निष्क्रिय',
    incidents: 'घटनाएं',
    information: 'जानकारी',
    invited: 'आमंत्रित',
    language: 'भाषा',
    last: 'अंतिम',
    live: 'लाइव',
    logs: 'लॉग',
    loading: 'लोड हो रहा है',
    location: 'स्थान',
    login: 'लॉगिन',
    logout: 'लॉग आउट',
    manager: 'मैनेजर',
    managers: 'मैनेजर',
    month: 'महीना',
    monitoring: 'मॉनिटरिंग',
    monitor: 'मॉनिटर करें',
    new: 'नया',
    onboard: 'ऑनबोर्ड करें',
    onboarding: 'ऑनबोर्डिंग',
    notification: 'सूचना',
    notifications: 'सूचनाएं',
    offline: 'ऑफलाइन',
    open: 'खुले',
    operations: 'संचालन',
    owner: 'मालिक',
    owners: 'मालिक',
    password: 'पासवर्ड',
    performance: 'प्रदर्शन',
    permissions: 'अनुमतियां',
    personal: 'व्यक्तिगत',
    picture: 'चित्र',
    pond: 'तालाब',
    ponds: 'तालाब',
    preferences: 'प्राथमिकताएं',
    previous: 'पिछला',
    profile: 'प्रोफाइल',
    quality: 'गुणवत्ता',
    read: 'पढ़ा',
    readings: 'रीडिंग',
    realtime: 'रीयल-टाइम',
    recent: 'हाल के',
    register: 'पंजीकृत करें',
    registered: 'पंजीकृत',
    retention: 'रिटेंशन',
    review: 'समीक्षा करें',
    roles: 'भूमिकाएं',
    rollout: 'रोलआउट',
    reports: 'रिपोर्ट',
    reset: 'रीसेट',
    save: 'सेव करें',
    search: 'खोजें',
    secure: 'सुरक्षित',
    security: 'सुरक्षा',
    sensor: 'सेंसर',
    sensors: 'सेंसर',
    select: 'चुनें',
    send: 'भेजें',
    settings: 'सेटिंग्स',
    sign: 'साइन',
    site: 'साइट',
    sites: 'साइटें',
    status: 'स्थिति',
    storage: 'स्टोरेज',
    support: 'सहायता',
    system: 'सिस्टम',
    team: 'टीम',
    total: 'कुल',
    trends: 'रुझान',
    update: 'अपडेट करें',
    updated: 'अपडेट हुआ',
    updating: 'अपडेट हो रहा है',
    usage: 'उपयोग',
    upload: 'अपलोड',
    user: 'उपयोगकर्ता',
    users: 'उपयोगकर्ता',
    visibility: 'दृश्यता',
    warnings: 'चेतावनियां',
    water: 'जल',
    week: 'सप्ताह',
    workspace: 'कार्यक्षेत्र',
    welcome: 'स्वागत',
    your: 'आपका',
  },
  te: {
    account: 'ఖాతా',
    active: 'క్రియాశీలం',
    add: 'జోడించండి',
    address: 'చిరునామా',
    agent: 'ఏజెంట్',
    agents: 'ఏజెంట్లు',
    alert: 'హెచ్చరిక',
    alerts: 'హెచ్చరికలు',
    all: 'అన్ని',
    analytics: 'విశ్లేషణలు',
    analyze: 'విశ్లేషించండి',
    app: 'యాప్',
    application: 'అప్లికేషన్',
    assigned: 'కేటాయించిన',
    assignment: 'అసైన్‌మెంట్',
    assignments: 'అసైన్‌మెంట్లు',
    audit: 'ఆడిట్',
    back: 'తిరిగి',
    backups: 'బ్యాకప్‌లు',
    battery: 'బ్యాటరీ',
    cancel: 'రద్దు చేయండి',
    center: 'కేంద్రం',
    change: 'మార్చండి',
    code: 'కోడ్',
    configure: 'కాన్ఫిగర్ చేయండి',
    connected: 'కనెక్ట్ చేసిన',
    confirm: 'నిర్ధారించండి',
    control: 'నియంత్రణ',
    controls: 'నియంత్రణలు',
    contact: 'సంప్రదించండి',
    contacts: 'సంప్రదింపులు',
    create: 'సృష్టించండి',
    critical: 'కీలక',
    customize: 'అనుకూలీకరించండి',
    dashboard: 'డాష్‌బోర్డ్',
    data: 'డేటా',
    date: 'తేదీ',
    default: 'డిఫాల్ట్',
    delete: 'తొలగించండి',
    details: 'వివరాలు',
    device: 'పరికరం',
    devices: 'పరికరాలు',
    download: 'డౌన్‌లోడ్',
    email: 'ఇమెయిల్',
    emergency: 'అత్యవసరం',
    enter: 'నమోదు చేయండి',
    export: 'ఎగుమతి',
    feed: 'ఫీడ్',
    field: 'ఫీల్డ్',
    forgot: 'మర్చిపోయారా',
    generate: 'రూపొందించండి',
    health: 'ఆరోగ్యం',
    help: 'సహాయం',
    important: 'ముఖ్యమైన',
    inactive: 'నిష్క్రియం',
    incidents: 'ఘటనలు',
    information: 'సమాచారం',
    invited: 'ఆహ్వానించబడింది',
    language: 'భాష',
    last: 'చివరి',
    live: 'లైవ్',
    logs: 'లాగ్‌లు',
    loading: 'లోడ్ అవుతోంది',
    location: 'స్థానం',
    login: 'లాగిన్',
    logout: 'లాగ్ అవుట్',
    manager: 'మేనేజర్',
    managers: 'మేనేజర్లు',
    month: 'నెల',
    monitoring: 'మానిటరింగ్',
    monitor: 'పర్యవేక్షించండి',
    new: 'కొత్త',
    onboard: 'ఆన్‌బోర్డ్ చేయండి',
    onboarding: 'ఆన్‌బోర్డింగ్',
    notification: 'నోటిఫికేషన్',
    notifications: 'నోటిఫికేషన్లు',
    offline: 'ఆఫ్‌లైన్',
    open: 'తెరిచి ఉన్న',
    operations: 'కార్యకలాపాలు',
    owner: 'యజమాని',
    owners: 'యజమానులు',
    password: 'పాస్‌వర్డ్',
    performance: 'పనితీరు',
    permissions: 'అనుమతులు',
    personal: 'వ్యక్తిగత',
    picture: 'చిత్రం',
    pond: 'చెరువు',
    ponds: 'చెరువులు',
    preferences: 'ప్రాధాన్యతలు',
    previous: 'మునుపటి',
    profile: 'ప్రొఫైల్',
    quality: 'నాణ్యత',
    read: 'చదివినవి',
    readings: 'రీడింగ్స్',
    realtime: 'రియల్-టైమ్',
    recent: 'ఇటీవలి',
    register: 'నమోదు చేయండి',
    registered: 'నమోదు చేయబడింది',
    retention: 'నిల్వ',
    review: 'సమీక్షించండి',
    roles: 'పాత్రలు',
    rollout: 'రోల్‌అవుట్',
    reports: 'నివేదికలు',
    reset: 'రీసెట్',
    save: 'సేవ్ చేయండి',
    search: 'వెతకండి',
    secure: 'భద్రంగా',
    security: 'భద్రత',
    sensor: 'సెన్సర్',
    sensors: 'సెన్సర్లు',
    select: 'ఎంచుకోండి',
    send: 'పంపండి',
    settings: 'సెట్టింగులు',
    sign: 'సైన్',
    site: 'సైట్',
    sites: 'సైట్లు',
    status: 'స్థితి',
    storage: 'స్టోరేజ్',
    support: 'మద్దతు',
    system: 'సిస్టమ్',
    team: 'బృందం',
    total: 'మొత్తం',
    trends: 'ధోరణులు',
    update: 'నవీకరించండి',
    updated: 'నవీకరించబడింది',
    updating: 'నవీకరిస్తోంది',
    usage: 'వినియోగం',
    upload: 'అప్‌లోడ్',
    user: 'వినియోగదారు',
    users: 'వినియోగదారులు',
    visibility: 'విజిబిలిటీ',
    warnings: 'హెచ్చరికలు',
    water: 'నీరు',
    week: 'వారం',
    workspace: 'వర్క్‌స్పేస్',
    welcome: 'స్వాగతం',
    your: 'మీ',
  },
};

export const translations: Record<LanguageCode, Record<string, string>> = {
  en: {
    dashboard: 'Dashboard',
    sites: 'Sites',
    agents: 'Agents',
    devices: 'Devices',
    live: 'Live Monitoring',
    assignments: 'Assignments',
    alerts: 'Alerts',
    data: 'Data',
    analytics: 'Analytics',
    reports: 'Reports',
    settings: 'Settings',
    sos: 'SOS Emergency',
    need_help: 'Need Help?',
    contact_support: 'Contact Support',
    sign_out: 'Sign Out',
    my_account: 'My Account',
    my_account_team: 'My Account Team',
    preferences: 'Preferences',
    profile_account: 'Profile & Account',
    security_privacy: 'Security & Privacy',
    theme: 'Theme',
    language: 'Language',
    time_zone: 'Time Zone',
    units: 'Units',
    change_password: 'Change Password',
    privacy_policy: 'Privacy Policy',
    app_version: 'App Version',
    about: 'About',
    add_agent: 'Add Agent',
    view_all_team_agents: 'View all team Agents',
    save_changes: 'Save Changes',
    notifications: 'Notifications',
    email_notifications: 'Email Notifications',
    sms_notifications: 'SMS Notifications',
    system_updates: 'System Updates',
    marketing_communications: 'Marketing Communications',
  },
  hi: {
    dashboard: 'डैशबोर्ड',
    sites: 'साइटें',
    agents: 'एजेंट',
    devices: 'डिवाइस',
    live: 'लाइव मॉनिटरिंग',
    assignments: 'असाइनमेंट',
    alerts: 'अलर्ट',
    data: 'डेटा',
    analytics: 'विश्लेषण',
    reports: 'रिपोर्ट',
    settings: 'सेटिंग्स',
    sos: 'SOS आपातकाल',
    need_help: 'सहायता चाहिए?',
    contact_support: 'सहायता से संपर्क करें',
    sign_out: 'साइन आउट',
    my_account: 'मेरा खाता',
    my_account_team: 'मेरी खाता टीम',
    preferences: 'प्राथमिकताएं',
    profile_account: 'प्रोफाइल और खाता',
    security_privacy: 'सुरक्षा और गोपनीयता',
    theme: 'थीम',
    language: 'भाषा',
    time_zone: 'समय क्षेत्र',
    units: 'इकाइयां',
    change_password: 'पासवर्ड बदलें',
    privacy_policy: 'गोपनीयता नीति',
    app_version: 'ऐप संस्करण',
    about: 'जानकारी',
    add_agent: 'एजेंट जोड़ें',
    view_all_team_agents: 'सभी टीम एजेंट देखें',
    save_changes: 'बदलाव सेव करें',
    notifications: 'सूचनाएं',
    email_notifications: 'ईमेल सूचनाएं',
    sms_notifications: 'SMS सूचनाएं',
    system_updates: 'सिस्टम अपडेट',
    marketing_communications: 'मार्केटिंग संदेश',
  },
  te: {
    dashboard: 'డాష్‌బోర్డ్',
    sites: 'సైట్లు',
    agents: 'ఏజెంట్లు',
    devices: 'పరికరాలు',
    live: 'లైవ్ మానిటరింగ్',
    assignments: 'అసైన్‌మెంట్లు',
    alerts: 'హెచ్చరికలు',
    data: 'డేటా',
    analytics: 'విశ్లేషణలు',
    reports: 'నివేదికలు',
    settings: 'సెట్టింగులు',
    sos: 'SOS అత్యవసరం',
    need_help: 'సహాయం కావాలా?',
    contact_support: 'మద్దతును సంప్రదించండి',
    sign_out: 'సైన్ అవుట్',
    my_account: 'నా ఖాతా',
    my_account_team: 'నా ఖాతా బృందం',
    preferences: 'ప్రాధాన్యతలు',
    profile_account: 'ప్రొఫైల్ మరియు ఖాతా',
    security_privacy: 'భద్రత మరియు గోప్యత',
    theme: 'థీమ్',
    language: 'భాష',
    time_zone: 'సమయ మండలం',
    units: 'కొలతలు',
    change_password: 'పాస్‌వర్డ్ మార్చండి',
    privacy_policy: 'గోప్యతా విధానం',
    app_version: 'యాప్ వెర్షన్',
    about: 'గురించి',
    add_agent: 'ఏజెంట్‌ను జోడించండి',
    view_all_team_agents: 'అన్ని బృంద ఏజెంట్లను చూడండి',
    save_changes: 'మార్పులను సేవ్ చేయండి',
    notifications: 'నోటిఫికేషన్లు',
    email_notifications: 'ఇమెయిల్ నోటిఫికేషన్లు',
    sms_notifications: 'SMS నోటిఫికేషన్లు',
    system_updates: 'సిస్టమ్ నవీకరణలు',
    marketing_communications: 'మార్కెటింగ్ సమాచారాలు',
  },
};

export function normalizeLanguage(value: string | null | undefined): LanguageCode {
  return value === 'hi' || value === 'te' ? value : 'en';
}

function keyFor(text: string) {
  return text.toLowerCase().trim().replace(/&/g, '').replace(/[^\w\s]/g, '').replace(/\s+/g, '_');
}

function restoreSpacing(original: string, translated: string) {
  const leading = original.match(/^\s*/)?.[0] || '';
  const trailing = original.match(/\s*$/)?.[0] || '';
  return `${leading}${translated}${trailing}`;
}

function translateText(text: string, language: LanguageCode) {
  if (language === 'en') return text;

  const trimmed = text.trim();
  if (!trimmed || /^\d+([:.,/\-\s]\d+)*$/.test(trimmed)) return text;

  const phrase = phraseTranslations[language][trimmed];
  if (phrase) return restoreSpacing(text, phrase);

  const normalizedKey = keyFor(trimmed);
  const translated = translations[language][normalizedKey];
  if (translated) return restoreSpacing(text, translated);

  const words = wordTranslations[language];
  let changed = false;
  const fallback = trimmed.replace(/[A-Za-z]+(?:'[A-Za-z]+)?/g, (token) => {
    const lower = token.toLowerCase();
    const replacement = words[lower];
    if (!replacement) return token;
    changed = true;
    return replacement;
  });

  return changed ? restoreSpacing(text, fallback) : text;
}

function shouldSkipElement(element: Element | null) {
  if (!element) return true;
  return Boolean(element.closest('script, style, textarea, code, pre, [data-no-translate]'));
}

const originalTextNodes = new WeakMap<Text, string>();
const translatedAttributes = ['placeholder', 'title', 'aria-label'];

function translateNode(root: Node, language: LanguageCode) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];

  if (root.nodeType === Node.TEXT_NODE) {
    textNodes.push(root as Text);
  }

  while (walker.nextNode()) {
    textNodes.push(walker.currentNode as Text);
  }

  textNodes.forEach((node) => {
    if (shouldSkipElement(node.parentElement)) return;
    const original = originalTextNodes.get(node) || node.nodeValue || '';
    originalTextNodes.set(node, original);
    const nextValue = translateText(original, language);
    if (node.nodeValue !== nextValue) {
      node.nodeValue = nextValue;
    }
  });

  const elements: Element[] = root.nodeType === Node.ELEMENT_NODE ? [root as Element] : [];
  if ('querySelectorAll' in root) {
    elements.push(...Array.from((root as Element | Document).querySelectorAll('*')));
  }

  elements.forEach((element) => {
    if (shouldSkipElement(element)) return;
    translatedAttributes.forEach((attr) => {
      const originalAttr = `data-i18n-original-${attr}`;
      const current = element.getAttribute(attr);
      if (!current) return;

      if (!element.hasAttribute(originalAttr)) {
        element.setAttribute(originalAttr, current);
      }

      const original = element.getAttribute(originalAttr) || current;
      const translated = translateText(original, language);
      if (current !== translated) {
        element.setAttribute(attr, translated);
      }
    });
  });
}

let pageTranslatorObserver: MutationObserver | null = null;

export function installPageTranslator() {
  if (typeof window === 'undefined' || pageTranslatorObserver) {
    return () => undefined;
  }

  const run = () => {
    translateNode(document.body, normalizeLanguage(localStorage.getItem(LANGUAGE_STORAGE_KEY)));
  };

  const handleLanguageChange = () => requestAnimationFrame(run);
  window.addEventListener('app-lang-change', handleLanguageChange);

  pageTranslatorObserver = new MutationObserver((mutations) => {
    const language = normalizeLanguage(localStorage.getItem(LANGUAGE_STORAGE_KEY));
    if (language === 'en') {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => translateNode(node, language));
      });
      return;
    }

    requestAnimationFrame(() => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => translateNode(node, language));
        if (mutation.type === 'characterData') {
          translateNode(mutation.target, language);
        }
      });
    });
  });

  pageTranslatorObserver.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
  });
  requestAnimationFrame(run);

  return () => {
    window.removeEventListener('app-lang-change', handleLanguageChange);
    pageTranslatorObserver?.disconnect();
    pageTranslatorObserver = null;
  };
}

async function syncLanguagePreference(language: LanguageCode) {
  const session = getAuthSession();
  if (!session) return;

  try {
    const current = await apiRequest<any>('/settings', { token: session.token });
    await apiRequest('/settings', {
      method: 'PUT',
      token: session.token,
      body: {
        profile_json: { ...(current.profile_json || {}), language },
        notification_prefs: { ...(current.notification_prefs || {}), language },
      },
    });
  } catch (error) {
    console.error('Failed to sync language preference:', error);
  }
}

export async function loadSavedLanguage() {
  const session = getAuthSession();
  if (!session) return normalizeLanguage(localStorage.getItem(LANGUAGE_STORAGE_KEY));

  try {
    const settings = await apiRequest<any>('/settings', { token: session.token });
    const language = normalizeLanguage(settings?.notification_prefs?.language || settings?.profile_json?.language);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    window.dispatchEvent(new Event('app-lang-change'));
    return language;
  } catch {
    return normalizeLanguage(localStorage.getItem(LANGUAGE_STORAGE_KEY));
  }
}

export function useTranslation() {
  const [lang, setLang] = useState<LanguageCode>(() => normalizeLanguage(localStorage.getItem(LANGUAGE_STORAGE_KEY)));

  useEffect(() => {
    const handleLangChange = () => {
      setLang(normalizeLanguage(localStorage.getItem(LANGUAGE_STORAGE_KEY)));
    };
    window.addEventListener('app-lang-change', handleLangChange);
    return () => window.removeEventListener('app-lang-change', handleLangChange);
  }, []);

  const translate = (key: string, defaultText?: string) => {
    const normalizedKey = keyFor(key);
    return translations[lang]?.[normalizedKey] || translations.en[normalizedKey] || defaultText || key;
  };

  const changeLanguage = (newLang: string) => {
    const language = normalizeLanguage(newLang);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    setLang(language);
    window.dispatchEvent(new Event('app-lang-change'));
    syncLanguagePreference(language);
  };

  return { t: translate, lang, changeLanguage };
}

export function useTheme() {
  const [theme, setTheme] = useState(() => localStorage.getItem('app-theme') || 'Dark');

  useEffect(() => {
    if (theme === 'Light') {
      document.documentElement.classList.add('theme-light');
      document.body.classList.add('theme-light');
    } else {
      document.documentElement.classList.remove('theme-light');
      document.body.classList.remove('theme-light');
    }
  }, [theme]);

  const changeTheme = (newTheme: string) => {
    localStorage.setItem('app-theme', newTheme);
    setTheme(newTheme);
    window.dispatchEvent(new Event('app-theme-change'));
  };

  useEffect(() => {
    const handleThemeChange = () => {
      setTheme(localStorage.getItem('app-theme') || 'Dark');
    };
    window.addEventListener('app-theme-change', handleThemeChange);
    return () => window.removeEventListener('app-theme-change', handleThemeChange);
  }, []);

  return { theme, changeTheme };
}
