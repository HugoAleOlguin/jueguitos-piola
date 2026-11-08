import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

const OnboardingContext = createContext(null);

export const ONBOARDING_STORAGE_KEY = 'jueguitos_onboarding_guide';
const COMPLETED_VALUE = 'completed';

const checkEligibility = () => {
    if (typeof window === 'undefined') {
        return false;
    }
    return window.innerWidth >= 1024;
};

const getStoredGuideStatus = () => {
    try {
        if (typeof window === 'undefined' || !window.localStorage) {
            return null;
        }
        return window.localStorage.getItem(ONBOARDING_STORAGE_KEY);
    } catch {
        return null;
    }
};

const setStoredGuideStatus = (value) => {
    try {
        if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.setItem(ONBOARDING_STORAGE_KEY, value);
        }
    } catch {
        // Manejo silencioso para modo incognito o cuota excedida
    }
};

export const OnboardingProvider = ({ children }) => {
    const [isEligibleDevice, setIsEligibleDevice] = useState(checkEligibility);
    const [isActive, setIsActive] = useState(() => {
        const eligible = checkEligibility();
        const stored = getStoredGuideStatus();
        return eligible && stored !== COMPLETED_VALUE;
    });
    const [currentStepIndex, setCurrentStepIndex] = useState(0);

    // Escuchar cambios de tamano de pantalla
    useEffect(() => {
        const handleResize = () => {
            setIsEligibleDevice(checkEligibility());
        };

        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    const nextStep = useCallback((maxSteps) => {
        setCurrentStepIndex((prevIndex) => {
            if (typeof maxSteps === 'number') {
                return prevIndex < maxSteps - 1 ? prevIndex + 1 : prevIndex;
            }
            return prevIndex + 1;
        });
    }, []);

    const prevStep = useCallback(() => {
        setCurrentStepIndex((prevIndex) => (prevIndex > 0 ? prevIndex - 1 : 0));
    }, []);

    const dismissGuide = useCallback(() => {
        setIsActive(false);
        setStoredGuideStatus(COMPLETED_VALUE);
    }, []);

    const reopenGuide = useCallback(() => {
        setCurrentStepIndex(0);
        setIsActive(true);
    }, []);

    const value = useMemo(() => ({
        isEligibleDevice,
        isActive,
        setIsActive,
        currentStepIndex,
        setCurrentStepIndex,
        nextStep,
        prevStep,
        dismissGuide,
        reopenGuide
    }), [isEligibleDevice, isActive, currentStepIndex, nextStep, prevStep, dismissGuide, reopenGuide]);

    return (
        <OnboardingContext.Provider value={value}>
            {children}
        </OnboardingContext.Provider>
    );
};

export const useOnboarding = () => {
    const context = useContext(OnboardingContext);
    if (!context) {
        throw new Error('useOnboarding debe usarse dentro de un OnboardingProvider');
    }
    return context;
};
