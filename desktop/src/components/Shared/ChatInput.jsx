
import React from "react";
export default function ChatInput({ text, setText, sendMessage, placeholder, t }) {
    return (
        <div style={{ display: "flex", borderTop: "1px solid #ccc", padding: "0.5rem" }}>
            <input
                style={{ flex: 1, padding: "0.5rem" }}
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendMessage(text)}
                placeholder={placeholder}
            />
            <button onClick={() => {sendMessage(text); setText("");}} style={{ marginLeft: "0.5rem" }}>
                {t('send')}
            </button>
        </div>
    );
}