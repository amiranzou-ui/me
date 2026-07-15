"use client";

import { useEffect, useState, useTransition } from "react";
import {
  searchRelatableContent,
  addRelation,
  removeRelation,
  listRelations,
  type RelationSearchResult,
  type Relation,
} from "@/lib/studio/relations";

const inputCls =
  "border border-tan bg-cream-alt px-3 py-2 text-sm text-ink outline-none focus:border-accent w-full";
const labelCls = "font-sans text-[11px] uppercase tracking-wider text-brown mb-1.5 block";

const TYPE_LABEL: Record<string, string> = {
  project: "Project",
  gallery_item: "Gallery",
  track: "Track",
};

/**
 * Shared "relate content" picker, per ARCHITECTURE.md's content_relations
 * design — one reusable component any Studio editor can drop in, writing to
 * the same polymorphic table regardless of which content types are involved.
 */
export default function RelatePicker({
  fromType,
  fromId,
  revalidatePagePath,
}: {
  fromType: string;
  fromId: string;
  revalidatePagePath: string;
}) {
  const [relations, setRelations] = useState<Relation[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [query, setQuery] = useState("");
  const [label, setLabel] = useState("");
  const [results, setResults] = useState<RelationSearchResult[]>([]);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    listRelations(fromType, fromId).then((r) => {
      setRelations(r);
      setLoaded(true);
    });
  }, [fromType, fromId]);

  useEffect(() => {
    if (!query.trim()) return;
    const timeout = setTimeout(() => {
      searchRelatableContent(query).then(setResults);
    }, 200);
    return () => clearTimeout(timeout);
  }, [query]);

  function add(result: RelationSearchResult) {
    startTransition(async () => {
      const res = await addRelation({
        from_type: fromType,
        from_id: fromId,
        to_type: result.type,
        to_id: result.id,
        relation_label: label || null,
        revalidatePagePath,
      });
      if (!("error" in res)) {
        setRelations((r) => [
          ...r,
          { id: res.id, to_type: result.type, to_id: result.id, relation_label: label || null, title: result.title },
        ]);
        setQuery("");
        setResults([]);
        setLabel("");
      }
    });
  }

  function remove(id: string) {
    setRelations((r) => r.filter((x) => x.id !== id));
    startTransition(() => {
      removeRelation(id, revalidatePagePath);
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {loaded && relations.length > 0 && (
        <div className="flex flex-col gap-2">
          {relations.map((r) => (
            <div key={r.id} className="flex items-center gap-3 border border-tan px-3 py-2 text-sm">
              <span className="text-[10px] uppercase tracking-wider text-brown">{TYPE_LABEL[r.to_type] ?? r.to_type}</span>
              <span className="text-ink flex-1">{r.title}</span>
              {r.relation_label && <span className="text-xs italic text-brown">{r.relation_label}</span>}
              <button
                onClick={() => remove(r.id)}
                disabled={pending}
                className="text-xs uppercase tracking-wider text-brown hover:text-accent"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2 border border-dashed border-tan p-3">
        <div className="grid grid-cols-2 gap-2">
          <input
            className={inputCls}
            placeholder="Search projects, photos, tracks…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <input
            className={inputCls}
            placeholder="Relation label (optional, e.g. 'behind the scenes')"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
        </div>
        {query.trim() && results.length > 0 && (
          <div className="flex flex-col gap-1">
            {results.map((res) => (
              <button
                key={`${res.type}-${res.id}`}
                onClick={() => add(res)}
                disabled={pending}
                className="flex items-center gap-3 px-3 py-2 text-left text-sm hover:bg-cream-alt disabled:opacity-50"
              >
                <span className={labelCls + " mb-0"}>{TYPE_LABEL[res.type] ?? res.type}</span>
                <span className="text-ink flex-1">{res.title}</span>
                <span className="text-xs text-brown">{res.subtitle}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
