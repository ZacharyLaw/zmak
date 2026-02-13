"use client";

import React, { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, updateDoc, doc as firestoreDoc } from "firebase/firestore";
import { db } from "lib/fire";

type DocItem = {
  id: string;
  [key: string]: any;
};

export default function RealtimePosts() {
  const [items, setItems] = useState<DocItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Record<string, boolean>>({});

  const [local, setLocal] = useState<Record<string, string>>({});

  useEffect(() => {
    setLoading(true);
    setError(null);
    const unsub = onSnapshot(
      collection(db, "markdown"),
      snap => {
        const docs = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
        setItems(docs);
        // keep local edits for docs that still exist; don't overwrite local edits
      setLocal(prev => {
  const next: Record<string, string> = {};
  for (const dd of docs) {
    next[dd.id] = editing[dd.id] ? prev[dd.id] ?? (dd.content ?? "") : (dd.content ?? "");
  }
  return next;
});
        setLoading(false);
      },
      err => {
        console.error(err);
        setError(err?.message ?? String(err));
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  // helper save function: updates Firestore doc by id
  async function save(id: string, value: string) {
    try {
      const docRef = firestoreDoc(db, "markdown", id);
      await updateDoc(docRef, { content: value });
      // optionally show a toast / feedback here
    } catch (err) {
      console.error("Failed to save", err);
      // optionally set error state or show UI
    }
  }

  // simple debounced save per-document (uses useMemo to keep timers across renders)
  const timers = useMemo(() => ({} as Record<string, number>), []);
  const scheduleSave = (id: string, value: string, delay = 700) => {
    // clear any existing timer
    if (timers[id]) window.clearTimeout(timers[id]);
    timers[id] = window.setTimeout(() => {
      save(id, value);
      delete timers[id];
    }, delay);
  };

  if (loading) return <div>Loading…</div>;
  if (error) return <div>Error: {error}</div>;
  if (items.length === 0) return <div>No documents found.</div>;

  return (
    <ul>
      {items.map((doc) => {
        const value = local[doc.id] ?? (doc.content ?? "");
        return (
          <li key={doc.id} style={{ marginBottom: 12 }}>
            <h1>{doc.id}</h1>
            <textarea
              value={value}
              onChange={(e) => {
                const v = e.currentTarget.value;
                // keep local edited value
                setLocal(prev => ({ ...prev, [doc.id]: v }));
                // schedule save (debounced)
                scheduleSave(doc.id, v);
              }}
              rows={6}
              style={{ width: "100%" }}
            />
          </li>
        );
      })}
    </ul>
  );
}