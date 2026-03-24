import { getAllHighlightCards } from "@/lib/queries/highlight-cards";

import { HighlightSlot } from "./components/highlight-slot";

export default async function AdminVitrineDestaquesPage() {
  const cards = await getAllHighlightCards();

  return <HighlightSlot initialCards={cards} />;
}
