// src/components/RealtimePosts.tsx
"use client";

import React, { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../src/lib/fire";

type DocItem = {
  id: string;
  [key: string]: any;
};

export default function RealtimePosts({ collectionName = "markdown" }: { collectionName?: string }) {
  const [items, setItems] = useState<DocItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const colRef = collection(db, collectionName);
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        const docs: DocItem[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Record<string, any>),
        }));
        setItems(docs);
        setLoading(false);
      },
      (err) => {
        console.error("Realtime listener error:", err);
        setError(err?.message ?? String(err));
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [collectionName]);

  if (loading) return <div>Loading…</div>;
  if (error) return <div>Error: {error}</div>;
  if (items.length === 0) return <div>No documents found.</div>;

  return (
    <ul>
      {items.map((doc) => (
        <li key={doc.id}>
          <h2><strong>{doc.id}</strong></h2>
          <pre style={{ whiteSpace: "pre-wrap", margin: 4 }}>{JSON.stringify(doc, null, 2)}</pre>
        </li>
      ))}
    </ul>
  );
}