"use client";

import { useRouter } from "next/navigation";

export function SortSelect({
  value,
  preserved,
}: {
  value: string;
  preserved: { key: string; value: string }[];
}) {
  const router = useRouter();
  return (
    <select
      id="sort"
      name="sort"
      value={value}
      onChange={(e) => {
        const params = new URLSearchParams();
        preserved.forEach((p) => params.set(p.key, p.value));
        params.set("sort", e.target.value);
        router.push(`/ads?${params.toString()}`);
      }}
      className="h-9 rounded-lg border border-gray-300 bg-white px-2 text-xs"
    >
      <option value="newest">Newest</option>
      <option value="price_asc">Price: low → high</option>
      <option value="price_desc">Price: high → low</option>
    </select>
  );
}
