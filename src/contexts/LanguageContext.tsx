import { createContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'en' | 'hi' | 'mr';

export interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider = ({ children }: LanguageProviderProps) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('bioguard-language');
    return (saved as Language) || 'en';
  });

  useEffect(() => {
    localStorage.setItem('bioguard-language', language);
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    const keys = key.split('.');
    let value: any = translations[language];
    
    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        return key;
      }
    }
    
    return typeof value === 'string' ? value : key;
  };

  const value = {
    language,
    setLanguage,
    t,
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

// Translations
const translations = {
  en: {
    nav: {
      home: 'Home',
      healthJournal: 'Health Journal',
      medGuard: 'MedGuard',
      predictGuard: 'PredictGuard',
      fitGuard: 'FitGuard',
      rescueGuard: 'RescueGuard',
      login: 'Log In',
      signup: 'Sign Up',
      logout: 'Log out',
      myAccount: 'My Account',
    },
    hero: {
      badge: 'Your Trusted Health Companion',
      title: 'Welcome to BioGuard.AI',
      subtitle: 'Your all-in-one platform for health information, symptom checking, mental wellness, fitness guidance, and emergency support.',
    },
    modules: {
      title: 'Explore Our Health Modules',
      healthJournal: {
        title: 'Health Journal',
        description: 'Track daily health with AI pattern detection',
        explore: 'Explore',
      },
      medGuard: {
        title: 'MedGuard',
        description: 'Search medicines, check interactions, find alternatives',
        explore: 'Explore',
      },
      predictGuard: {
        title: 'PredictGuard',
        description: 'AI symptom checker and health insights',
        explore: 'Explore',
      },
      mindGuard: {
        title: 'MindGuard',
        description: 'Mental health check and wellness resources',
        explore: 'Explore',
      },
      fitGuard: {
        title: 'FitGuard',
        description: 'BMI calculator and personalized fitness plans',
        explore: 'Explore',
      },
      rescueGuard: {
        title: 'RescueGuard',
        description: 'Emergency services and nearby hospitals',
        explore: 'Explore',
      },
      fundGuard: {
        title: 'FundGuard',
        description: 'Financial support and insurance information',
        explore: 'Explore',
      },
    },
    trust: {
      title: 'Your Health, Our Priority',
      description: 'BioGuard.AI is designed to provide trusted health information and guidance. Always consult healthcare professionals for medical decisions. In emergencies, call your local emergency services immediately.',
    },
    auth: {
      welcomeBack: 'Welcome Back',
      signInSubtitle: 'Sign in to your BioGuard.AI account',
      createAccount: 'Create Account',
      signUpSubtitle: 'Join BioGuard.AI and start your health journey',
      email: 'Email',
      password: 'Password',
      confirmPassword: 'Confirm Password',
      fullName: 'Full Name',
      signIn: 'Sign In',
      signUp: 'Sign Up',
      signingIn: 'Signing in...',
      creatingAccount: 'Creating account...',
      noAccount: "Don't have an account?",
      haveAccount: 'Already have an account?',
    },
  },
  hi: {
    nav: {
      home: 'होम',
      healthJournal: 'स्वास्थ्य डायरी',
      medGuard: 'मेडगार्ड',
      predictGuard: 'प्रिडिक्टगार्ड',
      fitGuard: 'फिटगार्ड',
      rescueGuard: 'रेस्क्यूगार्ड',
      login: 'लॉग इन',
      signup: 'साइन अप',
      logout: 'लॉग आउट',
      myAccount: 'मेरा खाता',
    },
    hero: {
      badge: 'आपका विश्वसनीय स्वास्थ्य साथी',
      title: 'BioGuard.AI में आपका स्वागत है',
      subtitle: 'स्वास्थ्य जानकारी, लक्षण जांच, मानसिक स्वास्थ्य, फिटनेस मार्गदर्शन और आपातकालीन सहायता के लिए आपका ऑल-इन-वन प्लेटफॉर्म।',
    },
    modules: {
      title: 'हमारे स्वास्थ्य मॉड्यूल देखें',
      healthJournal: {
        title: 'स्वास्थ्य डायरी',
        description: 'AI पैटर्न डिटेक्शन के साथ दैनिक स्वास्थ्य ट्रैक करें',
        explore: 'देखें',
      },
      medGuard: {
        title: 'मेडगार्ड',
        description: 'दवाएं खोजें, इंटरैक्शन जांचें, विकल्प खोजें',
        explore: 'देखें',
      },
      predictGuard: {
        title: 'प्रिडिक्टगार्ड',
        description: 'AI लक्षण जांच और स्वास्थ्य अंतर्दृष्टि',
        explore: 'देखें',
      },
      mindGuard: {
        title: 'माइंडगार्ड',
        description: 'मानसिक स्वास्थ्य जांच और कल्याण संसाधन',
        explore: 'देखें',
      },
      fitGuard: {
        title: 'फिटगार्ड',
        description: 'BMI कैलकुलेटर और व्यक्तिगत फिटनेस योजनाएं',
        explore: 'देखें',
      },
      rescueGuard: {
        title: 'रेस्क्यूगार्ड',
        description: 'आपातकालीन सेवाएं और नजदीकी अस्पताल',
        explore: 'देखें',
      },
      fundGuard: {
        title: 'फंडगार्ड',
        description: 'वित्तीय सहायता और बीमा जानकारी',
        explore: 'देखें',
      },
    },
    trust: {
      title: 'आपका स्वास्थ्य, हमारी प्राथमिकता',
      description: 'BioGuard.AI विश्वसनीय स्वास्थ्य जानकारी और मार्गदर्शन प्रदान करने के लिए डिज़ाइन किया गया है। चिकित्सा निर्णयों के लिए हमेशा स्वास्थ्य पेशेवरों से परामर्श लें। आपात स्थिति में, तुरंत अपनी स्थानीय आपातकालीन सेवाओं को कॉल करें।',
    },
    auth: {
      welcomeBack: 'वापसी पर स्वागत है',
      signInSubtitle: 'अपने BioGuard.AI खाते में साइन इन करें',
      createAccount: 'खाता बनाएं',
      signUpSubtitle: 'BioGuard.AI में शामिल हों और अपनी स्वास्थ्य यात्रा शुरू करें',
      email: 'ईमेल',
      password: 'पासवर्ड',
      confirmPassword: 'पासवर्ड की पुष्टि करें',
      fullName: 'पूरा नाम',
      signIn: 'साइन इन',
      signUp: 'साइन अप',
      signingIn: 'साइन इन हो रहा है...',
      creatingAccount: 'खाता बनाया जा रहा है...',
      noAccount: 'खाता नहीं है?',
      haveAccount: 'पहले से खाता है?',
    },
  },
  mr: {
    nav: {
      home: 'होम',
      healthJournal: 'आरोग्य नोंदवही',
      medGuard: 'मेडगार्ड',
      predictGuard: 'प्रिडिक्टगार्ड',
      fitGuard: 'फिटगार्ड',
      rescueGuard: 'रेस्क्यूगार्ड',
      login: 'लॉग इन',
      signup: 'साइन अप',
      logout: 'लॉग आउट',
      myAccount: 'माझे खाते',
    },
    hero: {
      badge: 'तुमचा विश्वासू आरोग्य साथी',
      title: 'BioGuard.AI मध्ये आपले स्वागत आहे',
      subtitle: 'आरोग्य माहिती, लक्षण तपासणी, मानसिक आरोग्य, फिटनेस मार्गदर्शन आणि आपत्कालीन सहाय्यासाठी तुमचे सर्व-इन-वन प्लॅटफॉर्म.',
    },
    modules: {
      title: 'आमचे आरोग्य मॉड्यूल एक्सप्लोर करा',
      healthJournal: {
        title: 'आरोग्य नोंदवही',
        description: 'AI पॅटर्न डिटेक्शनसह दैनिक आरोग्य ट्रॅक करा',
        explore: 'एक्सप्लोर करा',
      },
      medGuard: {
        title: 'मेडगार्ड',
        description: 'औषधे शोधा, परस्परसंवाद तपासा, पर्याय शोधा',
        explore: 'एक्सप्लोर करा',
      },
      predictGuard: {
        title: 'प्रिडिक्टगार्ड',
        description: 'AI लक्षण तपासणी आणि आरोग्य अंतर्दृष्टी',
        explore: 'एक्सप्लोर करा',
      },
      mindGuard: {
        title: 'माइंडगार्ड',
        description: 'मानसिक आरोग्य तपासणी आणि कल्याण संसाधने',
        explore: 'एक्सप्लोर करा',
      },
      fitGuard: {
        title: 'फिटगार्ड',
        description: 'BMI कॅल्क्युलेटर आणि वैयक्तिक फिटनेस योजना',
        explore: 'एक्सप्लोर करा',
      },
      rescueGuard: {
        title: 'रेस्क्यूगार्ड',
        description: 'आपत्कालीन सेवा आणि जवळची रुग्णालये',
        explore: 'एक्सप्लोर करा',
      },
      fundGuard: {
        title: 'फंडगार्ड',
        description: 'आर्थिक सहाय्य आणि विमा माहिती',
        explore: 'एक्सप्लोर करा',
      },
    },
    trust: {
      title: 'तुमचे आरोग्य, आमची प्राथमिकता',
      description: 'BioGuard.AI विश्वासार्ह आरोग्य माहिती आणि मार्गदर्शन प्रदान करण्यासाठी डिझाइन केले आहे. वैद्यकीय निर्णयांसाठी नेहमी आरोग्य व्यावसायिकांचा सल्ला घ्या. आपत्कालीन परिस्थितीत, तुमच्या स्थानिक आपत्कालीन सेवांना ताबडतोब कॉल करा.',
    },
    auth: {
      welcomeBack: 'परत स्वागत आहे',
      signInSubtitle: 'तुमच्या BioGuard.AI खात्यात साइन इन करा',
      createAccount: 'खाते तयार करा',
      signUpSubtitle: 'BioGuard.AI मध्ये सामील व्हा आणि तुमचा आरोग्य प्रवास सुरू करा',
      email: 'ईमेल',
      password: 'पासवर्ड',
      confirmPassword: 'पासवर्डची पुष्टी करा',
      fullName: 'पूर्ण नाव',
      signIn: 'साइन इन',
      signUp: 'साइन अप',
      signingIn: 'साइन इन होत आहे...',
      creatingAccount: 'खाते तयार केले जात आहे...',
      noAccount: 'खाते नाही?',
      haveAccount: 'आधीपासून खाते आहे?',
    },
  },
};
