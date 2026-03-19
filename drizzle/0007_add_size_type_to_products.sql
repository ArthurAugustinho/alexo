-- RF de tamanhos: produtos passam a declarar se operam com grade alfabetica ou numerica.
-- O default 'alphabetic' preserva todos os produtos ja cadastrados.
CREATE TYPE "public"."size_type" AS ENUM('alphabetic', 'numeric');--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "size_type" "size_type" DEFAULT 'alphabetic' NOT NULL;
