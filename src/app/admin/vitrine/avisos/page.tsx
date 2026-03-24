import { getAllAnnouncementBars } from "@/lib/queries/announcement-bars";

import { AnnouncementBarTable } from "./components/announcement-bar-table";

export default async function AdminVitrineAvisosPage() {
  const bars = await getAllAnnouncementBars();

  return <AnnouncementBarTable initialBars={bars} />;
}
