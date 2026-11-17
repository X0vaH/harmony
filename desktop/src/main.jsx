import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import "./i18n";
import * as Sentry from "@sentry/react";

//copy and paste de la page d'installation de sentry
Sentry.init({
    dsn: "https://58fdd3a8dfce6146595e3dfd9407741a@o4510359792844800.ingest.us.sentry.io/4510360925700096",
    // Setting this option to true will send default PII data to Sentry.
    // For example, automatic IP address collection on events
    sendDefaultPii: true
});

Sentry.setUser({id: "Le user n'est pas encore connecté"});

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App/>
    </React.StrictMode>,
)

// Use contextBridge
window.ipcRenderer.on('main-process-message', (_event, message) => {
    console.log(message)
})
