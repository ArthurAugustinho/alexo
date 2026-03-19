import { Fragment, type ReactNode } from "react";

import { normalizeSearch } from "@/helpers/normalize-search";

function normalizeSearchFragment(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[-_]/g, " ")
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .toLowerCase();
}

function buildNormalizedIndexMap(text: string) {
  const normalizedCharacters: string[] = [];
  const normalizedToOriginalIndex: number[] = [];

  for (let index = 0; index < text.length; index += 1) {
    const normalizedCharacter = normalizeSearchFragment(text[index] ?? "");

    if (!normalizedCharacter) {
      continue;
    }

    for (const character of normalizedCharacter) {
      normalizedCharacters.push(character);
      normalizedToOriginalIndex.push(index);
    }
  }

  return {
    normalizedText: normalizedCharacters.join(""),
    normalizedToOriginalIndex,
  };
}

function mergeRanges(ranges: Array<{ start: number; end: number }>) {
  if (ranges.length === 0) {
    return [];
  }

  const sortedRanges = [...ranges].sort((firstRange, secondRange) => {
    if (firstRange.start === secondRange.start) {
      return firstRange.end - secondRange.end;
    }

    return firstRange.start - secondRange.start;
  });
  const mergedRanges = [sortedRanges[0]!];

  for (const range of sortedRanges.slice(1)) {
    const lastRange = mergedRanges[mergedRanges.length - 1];

    if (!lastRange) {
      mergedRanges.push(range);
      continue;
    }

    if (range.start <= lastRange.end) {
      lastRange.end = Math.max(lastRange.end, range.end);
      continue;
    }

    mergedRanges.push(range);
  }

  return mergedRanges;
}

export function highlightMatch(text: string, query: string): ReactNode {
  const normalizedQuery = normalizeSearch(query);

  if (normalizedQuery.length === 0) {
    return text;
  }

  const { normalizedText, normalizedToOriginalIndex } =
    buildNormalizedIndexMap(text);
  const highlightRanges: Array<{ start: number; end: number }> = [];
  const directMatchIndex = normalizedText.indexOf(normalizedQuery);

  if (directMatchIndex >= 0) {
    const directMatchEnd = directMatchIndex + normalizedQuery.length - 1;
    const start = normalizedToOriginalIndex[directMatchIndex];
    const end = normalizedToOriginalIndex[directMatchEnd];

    if (typeof start === "number" && typeof end === "number") {
      highlightRanges.push({
        start,
        end: end + 1,
      });
    }
  } else {
    const queryTokens = normalizedQuery.split(/\s+/).filter(Boolean);

    for (const token of queryTokens) {
      let tokenStartIndex = normalizedText.indexOf(token);

      while (tokenStartIndex >= 0) {
        const tokenEndIndex = tokenStartIndex + token.length - 1;
        const start = normalizedToOriginalIndex[tokenStartIndex];
        const end = normalizedToOriginalIndex[tokenEndIndex];

        if (typeof start === "number" && typeof end === "number") {
          highlightRanges.push({
            start,
            end: end + 1,
          });
        }

        tokenStartIndex = normalizedText.indexOf(token, tokenStartIndex + 1);
      }
    }
  }

  const mergedRanges = mergeRanges(highlightRanges);

  if (mergedRanges.length === 0) {
    return text;
  }

  const highlightedTextParts: ReactNode[] = [];
  let cursor = 0;

  for (const [index, range] of mergedRanges.entries()) {
    if (cursor < range.start) {
      highlightedTextParts.push(
        <Fragment key={`text-${index}-${cursor}`}>
          {text.slice(cursor, range.start)}
        </Fragment>,
      );
    }

    highlightedTextParts.push(
      <strong key={`match-${index}-${range.start}`} className="font-semibold">
        {text.slice(range.start, range.end)}
      </strong>,
    );
    cursor = range.end;
  }

  if (cursor < text.length) {
    highlightedTextParts.push(
      <Fragment key={`text-end-${cursor}`}>{text.slice(cursor)}</Fragment>,
    );
  }

  return highlightedTextParts;
}
