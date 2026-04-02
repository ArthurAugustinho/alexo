import { getAllTripleImageGridItems } from "@/lib/queries/triple-image-grid";

import { TripleImageSlot } from "./components/triple-image-slot";

export default async function AdminVitrineGradeImagensPage() {
  const items = await getAllTripleImageGridItems();

  return <TripleImageSlot initialItems={items} />;
}
