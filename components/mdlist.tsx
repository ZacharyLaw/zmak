import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../lib/firebaseClient";

async function getmd(db) {
  const markdown = collection(db, "markdown");
  const mdSnapshot = await getDocs(markdown);
  const mdList = mdSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  return mdList;
}

export default function MarkdownList() {
  const [items, setItems] = useState<any[] | null>(null);
  useEffect(() => {
    let mounted = true;
    getmd(db).then((list) => { if (mounted) setItems(list); });
    return () => { mounted = false; };
  }, []);

  if (!items) return <div>Loading…</div>;
  return (
    <ul>
      {items.map(md => <li key={md.id}>{md.title ?? JSON.stringify(md)}</li>)}
    </ul>
  );
}