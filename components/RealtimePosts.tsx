"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  doc as firestoreDoc,
  getDoc,
  setDoc,
  onSnapshot,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "lib/fire";

const HASH_ID_RE = /^#([A-Za-z0-9]{4})$/;
const DEFAULT_ID = "zmak";

export default function RealtimeHashDoc() {
  const [docId, setDocId] = useState<string | null>(null);
  const [content, setContent] = useState<string>(""); // local textarea value
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [exists, setExists] = useState<boolean | null>(null); // tracks whether doc exists in Firestore

  const unsubRef = useRef<() => void | null>(null);
  const timers = useMemo(() => ({} as Record<string, number>), []);

  function parseHash(h: string | null): string | null {
    if (!h) return null;
    const m = HASH_ID_RE.exec(h);
    return m ? m[1] : null;
  }

  // ensure and subscribe: do NOT create the doc if missing
  async function ensureAndSubscribe(id: string) {
    setLoading(true);
    setError(null);
    setExists(null);

    if (unsubRef.current) {
      try { unsubRef.current(); } catch {}
      unsubRef.current = null;
    }

    const docRef = firestoreDoc(db, "markdown", id);

    try {
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        setContent((data?.content as string) ?? "");
        setExists(true);
      } else {
        // doc does not exist yet — show empty textarea but do NOT create it
        setContent("");
        setExists(false);
      }

      // subscribe to realtime updates for this doc (will fire when doc is created elsewhere)
      const unsub = onSnapshot(
        docRef,
        (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            const activeEl = typeof document !== "undefined" ? document.activeElement : null;
            const isFocusedTextarea =
              activeEl &&
              activeEl.tagName === "TEXTAREA" &&
              (activeEl as HTMLTextAreaElement).dataset?.docId === id;
            if (!isFocusedTextarea) {
              setContent((data?.content as string) ?? "");
            }
            setExists(true);
          } else {
            // doc removed or not created yet
            setContent("");
            setExists(false);
          }
          setLoading(false);
        },
        (err) => {
          console.error("onSnapshot error:", err);
          setError(err?.message ?? String(err));
          setLoading(false);
        }
      );
      unsubRef.current = unsub;
    } catch (err) {
      console.error("ensureAndSubscribe error:", err);
      setError((err as any)?.message ?? String(err));
      setLoading(false);
    }
  }

  // save or delete immediately, create-on-first-save if necessary
  async function saveNow(id: string, value: string) {
    try {
      const docRef = firestoreDoc(db, "markdown", id);
      const trimmed = value.trim();

      if (trimmed === "") {
        // delete only if doc exists
        if (exists) {
          await deleteDoc(docRef);
        }
        // keep local content empty
        setContent("");
        return;
      }

      // non-empty: create if missing, otherwise update
      if (!exists) {
        await setDoc(docRef, { content: value });
        setExists(true);
      } else {
        await updateDoc(docRef, { content: value });
      }
    } catch (err) {
      console.error("save error", err);
      setError((err as any)?.message ?? String(err));
    }
  }

  // schedule debounced save (create or update or delete depending on value)
  function scheduleSave(id: string, value: string, delay = 700) {
    if (timers[id]) window.clearTimeout(timers[id]);
    timers[id] = window.setTimeout(() => {
      saveNow(id, value);
      delete timers[id];
    }, delay);
  }

  // initial hash + hashchange handling (sets default #zmak if no valid 4-char hash)
  useEffect(() => {
    if (typeof window === "undefined") {
      setDocId(null);
      setLoading(false);
      return;
    }

    let initialId = parseHash(window.location.hash);
    if (!initialId) {
      const newHash = `#${DEFAULT_ID}`;
      if (window.history && window.history.replaceState) {
        const url = window.location.href.split("#")[0] + newHash;
        window.history.replaceState(null, "", url);
      } else {
        window.location.hash = newHash;
      }
      initialId = DEFAULT_ID;
    }

    setDocId(initialId);

    function onHashChange() {
      const newId = parseHash(window.location.hash);
      if (!newId) {
        const newHash = `#${DEFAULT_ID}`;
        if (window.history && window.history.replaceState) {
          const url = window.location.href.split("#")[0] + newHash;
          window.history.replaceState(null, "", url);
        } else {
          window.location.hash = newHash;
        }
        setDocId(DEFAULT_ID);
      } else {
        setDocId(newId);
      }
    }

    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  // subscribe when docId changes
  useEffect(() => {
    if (!docId) {
      if (unsubRef.current) {
        try { unsubRef.current(); } catch {}
        unsubRef.current = null;
      }
      setContent("");
      setExists(null);
      setLoading(false);
      return;
    }
    ensureAndSubscribe(docId);

    return () => {
      if (unsubRef.current) {
        try { unsubRef.current(); } catch {}
        unsubRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docId]);

  if (loading) return <div>Loading…</div>;
  if (error) return <div>Error: {error}</div>;
  if (!docId) return <div />;

  return (
    <div>
      <h2>Document: {docId}</h2>
      <textarea
        autoFocus 
        data-doc-id={docId}
        value={content}
        placeholder="Type here to create this document..."
        onChange={(e) => {
          const v = e.currentTarget.value;
          setContent(v);
          scheduleSave(docId, v);
        }}
        onBlur={(e) => {
          const v = e.currentTarget.value;
          if (timers[docId]) {
            window.clearTimeout(timers[docId]);
            delete timers[docId];
          }
          saveNow(docId, v);
        }}
        rows={12}
        style={{ width: "100%" }}
      />
      <div style={{ marginTop: 8, color: "#666", fontSize: 13 }}>
        {exists === false ? "Document does not exist yet. It will be created when you type and leave the textarea." : exists === true ? "Document exists in Firestore." : null}
      </div>
    </div>
  );
}