import Echo from "laravel-echo";
import Pusher from "pusher-js";

if (typeof window !== "undefined") {
  window.Pusher = Pusher;
}

let echo;

export function getEcho() {
  if (echo) return echo;

  const cfg = {
    broadcaster: "reverb",
    key: "5hn8pzgk7g3dll93enmk",
    wsHost: "definitelynotharmony.dev",
    wsPort: 8080,
    wssPort: 8080,   // 443 si ta page est en HTTPS
    forceTLS: false, // true si ta page est en HTTPS
    enabledTransports: ["ws", "wss"],
  };

  console.info("[WS] init Echo (Reverb) ->", cfg);
  echo = new Echo(cfg);
  if (typeof window !== "undefined") window.__echo = echo;

  try {
    const conn = echo.connector?.pusher?.connection;
    if (conn) {
      conn.bind("state_change", (st) => console.info("[WS] state:", st.previous, "→", st.current));
      conn.bind("connected", () => {
        const id = echo.connector?.pusher?.connection?.socket_id;
        console.info("[WS] connected (socket_id:", id, ")");
      });
      conn.bind("disconnected", () => console.warn("[WS] disconnected"));
      conn.bind("error", (err) => console.error("[WS] error:", err));
      conn.bind("unavailable", () => console.error("[WS] unavailable"));
      conn.bind("failed", () => console.error("[WS] failed"));
    } else {
      console.warn("[WS] Pas d'objet connection Pusher exposé (ok selon build).");
    }
  } catch (e) {
    console.warn("[WS] hooks Pusher non attachés:", e?.message || e);
  }

  return echo;
}
