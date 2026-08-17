import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
    isFirebaseConfigured, 
    loginWithUsername, 
    registerWithUsername, 
    loginWithGoogle, 
    logoutUser, 
    updateUserProfileData, 
    fetchUserProfile,
    onAuthChange 
} from '../services/firebase';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [userProfile, setUserProfile] = useState(() => {
        try {
            const saved = localStorage.getItem('piola_chat_profile');
            return saved ? JSON.parse(saved) : null;
        } catch {
            return null;
        }
    });
    const [loading, setLoading] = useState(true);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [authModalMode, setAuthModalMode] = useState('login'); // 'login' | 'register' | 'profile'

    // Escuchar el estado de autenticación de Firebase
    useEffect(() => {
        if (!isFirebaseConfigured) {
            setLoading(false);
            return;
        }

        const unsubscribe = onAuthChange(async (firebaseUser) => {
            setCurrentUser(firebaseUser);
            if (firebaseUser) {
                try {
                    const profile = await fetchUserProfile(firebaseUser.uid);
                    if (profile) {
                        setUserProfile(profile);
                        localStorage.setItem('piola_chat_profile', JSON.stringify(profile));
                    }
                } catch (e) {
                    console.error("Error sincronizando perfil de usuario:", e);
                }
            } else {
                // Si no hay usuario logueado en Firebase, limpiar perfil
                setUserProfile(null);
                localStorage.removeItem('piola_chat_profile');
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Escuchar eventos globales de actualización de perfil
    useEffect(() => {
        const handleProfileUpdate = (e) => {
            if (e.detail) {
                setUserProfile(e.detail);
            }
        };

        window.addEventListener('piola_profile_updated', handleProfileUpdate);
        return () => window.removeEventListener('piola_profile_updated', handleProfileUpdate);
    }, []);

    const openLogin = () => {
        setAuthModalMode('login');
        setIsAuthModalOpen(true);
    };

    const openRegister = () => {
        setAuthModalMode('register');
        setIsAuthModalOpen(true);
    };

    const openProfile = () => {
        setAuthModalMode('profile');
        setIsAuthModalOpen(true);
    };

    const closeAuthModal = () => {
        setIsAuthModalOpen(false);
    };

    const login = async (usernameOrEmail, password) => {
        const profile = await loginWithUsername(usernameOrEmail, password);
        setUserProfile(profile);
        setIsAuthModalOpen(false);
        return profile;
    };

    const register = async (username, password, initialProfile) => {
        const profile = await registerWithUsername(username, password, initialProfile);
        setUserProfile(profile);
        setIsAuthModalOpen(false);
        return profile;
    };

    const loginGoogleAuth = async () => {
        const profile = await loginWithGoogle();
        setUserProfile(profile);
        setIsAuthModalOpen(false);
        return profile;
    };

    const logout = async () => {
        await logoutUser();
        setCurrentUser(null);
        setUserProfile(null);
        setIsAuthModalOpen(false);
    };

    const updateProfile = async (data) => {
        if (!userProfile) return;
        const updated = await updateUserProfileData(userProfile.id, data);
        setUserProfile(updated);
        return updated;
    };

    const isAuthenticated = Boolean(userProfile && userProfile.id);

    return (
        <AuthContext.Provider value={{
            currentUser,
            userProfile,
            isAuthenticated,
            loading,
            isAuthModalOpen,
            authModalMode,
            setAuthModalMode,
            openLogin,
            openRegister,
            openProfile,
            closeAuthModal,
            login,
            register,
            loginGoogle: loginGoogleAuth,
            logout,
            updateProfile
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth debe usarse dentro de un AuthProvider");
    }
    return context;
};
