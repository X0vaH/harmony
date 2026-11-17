import { useEffect, useMemo, useRef } from "react";
import { getEcho } from "../lib/echo";

/**
 * S'abonne à un channel PUBLIC et écoute une liste d'événements.
 */
export function useChannel(channelName, onEvent, events = [".presence.updated", ".message.sent", ".typing.updated"]) {
    const handlerRef = useRef(onEvent);
    useEffect(() => { handlerRef.current = onEvent; }, [onEvent]);

    const eventsStable = useMemo(() => {
        return Array.from(new Set(events)).sort();
    }, [JSON.stringify(events)]);

    useEffect(() => {
        if (!channelName) {
            console.info("[WS] aucun channel (skip)");
            return;
        }

        const echo = getEcho();
        console.info("[WS] subscribe ->", channelName);

        const chan = echo.channel(channelName);
        const disposers = [];

        eventsStable.forEach((ev) => {
            console.info("[WS] listen", ev, "on", channelName);
            const cb = (payload) => {
                console.info(`[WS] EVENT '${ev}' @ ${channelName}:`, payload);
                // eslint-disable-next-line @typescript-eslint/no-unused-expressions
                handlerRef.current && handlerRef.current(payload, { event: ev, channel: channelName });
            };
            chan.listen(ev, cb);
            disposers.push(() => chan.stopListening(ev));
        });

        return () => {
            console.info("[WS] unsubscribe <-", channelName);
            disposers.forEach((d) => d());
            echo.leaveChannel(channelName);
        };
    }, [channelName, eventsStable]);
}
