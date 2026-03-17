DO $$
BEGIN
  CREATE TYPE "public"."user_role" AS ENUM('customer', 'admin', 'super_admin');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
ALTER TABLE "user"
ADD COLUMN IF NOT EXISTS "role" "user_role" DEFAULT 'customer' NOT NULL;
