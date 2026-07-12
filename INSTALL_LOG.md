# Registro de Instalación de Dependencias

Este archivo contiene un registro detallado de todas las dependencias añadidas al proyecto durante la migración a **Vite + React (Vanilla CSS)**. Si en el futuro deseas desinstalar alguna de ellas o volver al estado original, puedes usar este registro como guía.

---

## 📦 Dependencias de Producción (`dependencies`)

### 1. **React y React DOM**
*   **Propósito:** Framework base para la UI declarativa, componentes y estado reactivo.
*   **Paquetes:** `react`, `react-dom`
*   **Comando de Desinstalación:**
    ```bash
    npm uninstall react react-dom
    ```

### 2. **Firebase**
*   **Propósito:** Conexión en tiempo real con Firestore para el chat comunitario (`PiolaChat`), perfiles y carga de la galería de temas online.
*   **Paquetes:** `firebase`
*   **Comando de Desinstalación:**
    ```bash
    npm uninstall firebase
    ```

### 3. **Canvas Confetti**
*   **Propósito:** Animación interactiva de confeti al desbloquear un logro (reemplazo del script local manual para mejorar la fluidez y rendimiento).
*   **Paquetes:** `canvas-confetti`
*   **Comando de Desinstalación:**
    ```bash
    npm uninstall canvas-confetti
    ```

### 4. **Lucide React**
*   **Propósito:** Iconos vectoriales limpios y eficientes para toda la interfaz (Header, configuración, modales).
*   **Paquetes:** `lucide-react`
*   **Comando de Desinstalación:**
    ```bash
    npm uninstall lucide-react
    ```

---

## 🛠️ Dependencias de Desarrollo (`devDependencies`)

### 1. **Vite y Plugins**
*   **Propósito:** Servidor de desarrollo ultrarrápido y empaquetador para compilar a producción.
*   **Paquetes:** `vite`, `@vitejs/plugin-react`
*   **Comando de Desinstalación:**
    ```bash
    npm uninstall vite @vitejs/plugin-react --save-dev
    ```

### 2. **Oxlint / ESLint**
*   **Propósito:** Analizador estático de código para garantizar buenas prácticas de React y evitar errores en tiempo de ejecución.
*   **Paquetes:** `@eslint/js`, `eslint`, `eslint-plugin-react`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`
*   **Comando de Desinstalación:**
    ```bash
    npm uninstall eslint @eslint/js eslint-plugin-react eslint-plugin-react-hooks eslint-plugin-react-refresh --save-dev
    ```

---

## 🔄 Cómo Revertir Todo al Estado Vanilla
1. Si deseas eliminar por completo Node.js/NPM y volver al estado previo de desarrollo estático puro, simplemente puedes ejecutar:
   ```bash
   Remove-Item -Path node_modules, package.json, package-lock.json, vite.config.js, eslint.config.js, .oxlintrc.json -Recurse -Force
   ```
2. Y restaurar los archivos desde la carpeta `archive_vanilla/` a la raíz.
