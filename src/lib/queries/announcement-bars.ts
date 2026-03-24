import { and, asc, eq, gte, isNull, lte, or } from "drizzle-orm";

import { db } from "@/db";
import { announcementBarTable } from "@/db/schema";

export type AnnouncementBar = typeof announcementBarTable.$inferSelect;

export async function getActiveAnnouncementBars(): Promise<AnnouncementBar[]> {
  const now = new Date();

  return db.query.announcementBarTable.findMany({
    where: and(
      eq(announcementBarTable.isActive, true),
      or(
        isNull(announcementBarTable.startDate),
        lte(announcementBarTable.startDate, now),
      ),
      or(
        isNull(announcementBarTable.endDate),
        gte(announcementBarTable.endDate, now),
      ),
    ),
    orderBy: [asc(announcementBarTable.position)],
  });
}

export async function getAllAnnouncementBars(): Promise<AnnouncementBar[]> {
  return db.query.announcementBarTable.findMany({
    orderBy: [asc(announcementBarTable.position)],
  });
}

export async function getAnnouncementBarById(
  id: string,
): Promise<AnnouncementBar | undefined> {
  return db.query.announcementBarTable.findFirst({
    where: eq(announcementBarTable.id, id),
  });
}
