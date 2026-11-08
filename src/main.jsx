import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { OnboardingProvider } from './context/OnboardingContext.jsx'
import { AchievementProvider } from './context/AchievementContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <OnboardingProvider>
          <AchievementProvider>
            <App />
          </AchievementProvider>
        </OnboardingProvider>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
)
