import { useEffect, useRef, useState } from "react";
import { requireDb } from "../lib/supabase.js";

/**
 * Fetch awal + subscription realtime ke satu tabel, dengan fallback
 * polling 5 detik bila realtime tidak tersambung.
 * Setiap perubahan -> reload penuh (sederhana & selalu konsisten).
 */
export function useRealtimeTable(table, channelName, loadFn) {
  const [rows, setRows] = useState([]);
  const [rtOk, setRtOk] = useState(null); // null=connecting, true=realtime, false=polling
  const [error, setError] = useState("");
  const rowsRef = useRef([]);

  const apply = (next) => {
    rowsRef.current = next;
    setRows(next);
  };

  useEffect(() => {
    let cancelled = false;
    let pollId = null;
    let channel = null;
    let subscribed = false;

    const load = async () => {
      try {
        const data = await loadFn();
        if (!cancelled) apply(data);
      } catch (e) {
        if (!cancelled) setError(e.message);
      }
    };

    const startPolling = () => {
      if (pollId || cancelled) return;
      setRtOk(false);
      pollId = setInterval(async () => {
        try {
          const data = await loadFn();
          if (!cancelled) apply(data);
        } catch {
          /* polling senyap */
        }
      }, 5000);
    };

    load();

    try {
      const db = requireDb();
      channel = db
        .channel(channelName)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table },
          () => {
            if (!cancelled) load();
          }
        )
        .subscribe((status) => {
          if (cancelled) return;
          if (status === "SUBSCRIBED") {
            subscribed = true;
            setRtOk(true);
          } else {
            startPolling();
          }
        });
      setTimeout(() => {
        if (!subscribed && !cancelled) startPolling();
      }, 8000);
    } catch {
      startPolling();
    }

    return () => {
      cancelled = true;
      if (pollId) clearInterval(pollId);
      if (channel) {
        try {
          requireDb().removeChannel(channel);
        } catch {
          /* abaikan */
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { rows, setRows: apply, rtOk, error, setError };
}
