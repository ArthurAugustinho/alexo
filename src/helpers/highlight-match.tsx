import { Fragment, type ReactNode } from "react";

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function highlightMatch(text: string, query: string): ReactNode {
  const trimmedQuery = query.trim();

  if (trimmedQuery.length === 0) {
    return text;
  }

  const matcher = new RegExp(`(${escapeRegExp(trimmedQuery)})`, "gi");
  const parts = text.split(matcher);

  return parts.map((part, index) => {
    if (part.toLowerCase() === trimmedQuery.toLowerCase()) {
      return (
        <strong key={`${part}-${index}`} className="font-semibold">
          {part}
        </strong>
      );
    }

    return <Fragment key={`${part}-${index}`}>{part}</Fragment>;
  });
}
