CREATE TYPE "public"."return_reason" AS ENUM('defect', 'wrong_item', 'damaged', 'wrong_size', 'other');--> statement-breakpoint
CREATE TYPE "public"."return_request_status" AS ENUM('pending_review', 'approved', 'rejected', 'completed');--> statement-breakpoint
ALTER TYPE "public"."order_status" ADD VALUE 'shipped' BEFORE 'canceled';--> statement-breakpoint
ALTER TYPE "public"."order_status" ADD VALUE 'delivered' BEFORE 'canceled';--> statement-breakpoint
ALTER TYPE "public"."order_status" ADD VALUE 'refunded';--> statement-breakpoint
CREATE TABLE "announcement_bars" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"text" varchar(255) NOT NULL,
	"link_url" varchar(500),
	"bg_color" varchar(7) DEFAULT '#000000' NOT NULL,
	"text_color" varchar(7) DEFAULT '#FFFFFF' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"start_date" timestamp,
	"end_date" timestamp,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "announcement_bars_dates_check" CHECK ("announcement_bars"."start_date" IS NULL OR "announcement_bars"."end_date" IS NULL OR "announcement_bars"."start_date" < "announcement_bars"."end_date")
);
--> statement-breakpoint
CREATE TABLE "coupon" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(50) NOT NULL,
	"description" varchar(255),
	"type" varchar(20) NOT NULL,
	"value" integer DEFAULT 0 NOT NULL,
	"category_id" uuid,
	"min_order_value_in_cents" integer DEFAULT 0 NOT NULL,
	"max_discount_in_cents" integer,
	"max_uses_total" integer,
	"max_uses_per_user" integer DEFAULT 1 NOT NULL,
	"is_first_order_only" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"starts_at" timestamp,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "coupon_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "coupon_usage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"coupon_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"order_id" uuid NOT NULL,
	"discount_applied_in_cents" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "faq_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question" varchar(300) NOT NULL,
	"answer" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "highlight_cards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(100) NOT NULL,
	"image_url" varchar(500) NOT NULL,
	"link_url" varchar(500) NOT NULL,
	"position" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "highlight_cards_position_check" CHECK ("highlight_cards"."position" >= 1 AND "highlight_cards"."position" <= 3)
);
--> statement-breakpoint
CREATE TABLE "logistics_config" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"max_installments" integer DEFAULT 12 NOT NULL,
	"min_installment_value_in_cents" integer DEFAULT 2000 NOT NULL,
	"free_installments_up_to" integer DEFAULT 1 NOT NULL,
	"interest_rate_percent" numeric(5, 2) DEFAULT 0 NOT NULL,
	"return_policy_days" integer DEFAULT 30 NOT NULL,
	"exchange_policy_text" text,
	"return_policy_text" text,
	"success_image_url" text,
	"cancel_image_url" text,
	"payment_methods" text[] DEFAULT ARRAY['visa','mastercard','pix','boleto','elo','amex']::text[] NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "partner_brands" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"logo_url" varchar(500) NOT NULL,
	"link_url" varchar(500),
	"is_active" boolean DEFAULT true NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"url" varchar(500) NOT NULL,
	"alt" varchar(200),
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_review" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"rating" integer NOT NULL,
	"title" varchar(150),
	"body" text,
	"photo_urls" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"is_approved" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "product_review_rating_range" CHECK ("product_review"."rating" >= 1 AND "product_review"."rating" <= 5)
);
--> statement-breakpoint
CREATE TABLE "return_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"reason" "return_reason" NOT NULL,
	"description" text NOT NULL,
	"photo_url" varchar(500),
	"status" "return_request_status" DEFAULT 'pending_review' NOT NULL,
	"admin_note" text,
	"return_code" varchar(100),
	"return_url" varchar(500),
	"reviewed_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "return_requests_order_id_unique" UNIQUE("order_id")
);
--> statement-breakpoint
CREATE TABLE "simple_banners" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"image_url" varchar(500) NOT NULL,
	"link_url" varchar(500),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "social_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"platform" varchar(50) NOT NULL,
	"url" varchar(500) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "support_widget_config" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"whatsapp_number" varchar(20),
	"whatsapp_message" varchar(255),
	"support_email" varchar(255),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "triple_image_grid_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"image_url" varchar(500) NOT NULL,
	"link_url" varchar(500),
	"position" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "triple_image_grid_items_position_check" CHECK ("triple_image_grid_items"."position" >= 1 AND "triple_image_grid_items"."position" <= 3)
);
--> statement-breakpoint
CREATE TABLE "trust_badges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"label" varchar(100) NOT NULL,
	"image_url" varchar(500) NOT NULL,
	"link_url" varchar(500),
	"is_active" boolean DEFAULT true NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "shipping_address" ALTER COLUMN "country" SET DEFAULT 'Brasil';--> statement-breakpoint
ALTER TABLE "shipping_address" ALTER COLUMN "phone" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "shipping_address" ALTER COLUMN "email" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "shipping_address" ALTER COLUMN "cpfOrCnpj" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "cart_item" ADD COLUMN "shipping_cost_in_cents" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "cart_item" ADD COLUMN "shipping_service_name" varchar(100);--> statement-breakpoint
ALTER TABLE "cart_item" ADD COLUMN "shipping_days_min" integer;--> statement-breakpoint
ALTER TABLE "cart_item" ADD COLUMN "shipping_days_max" integer;--> statement-breakpoint
ALTER TABLE "cart_item" ADD COLUMN "customization_name" varchar(30);--> statement-breakpoint
ALTER TABLE "cart_item" ADD COLUMN "customization_number" varchar(5);--> statement-breakpoint
ALTER TABLE "cart_item" ADD COLUMN "customization_patch_id" varchar(100);--> statement-breakpoint
ALTER TABLE "cart_item" ADD COLUMN "customization_extra_in_cents" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "cart" ADD COLUMN "applied_coupon_code" varchar(50);--> statement-breakpoint
ALTER TABLE "cart" ADD COLUMN "discount_in_cents" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "order_item" ADD COLUMN "customization_name" varchar(30);--> statement-breakpoint
ALTER TABLE "order_item" ADD COLUMN "customization_number" varchar(5);--> statement-breakpoint
ALTER TABLE "order_item" ADD COLUMN "customization_patch_text" varchar(100);--> statement-breakpoint
ALTER TABLE "order_item" ADD COLUMN "customization_extra_in_cents" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "order" ADD COLUMN "shipping_cost_in_cents" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "order" ADD COLUMN "original_total_in_cents" integer;--> statement-breakpoint
ALTER TABLE "order" ADD COLUMN "discount_in_cents" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "order" ADD COLUMN "coupon_code" varchar(50);--> statement-breakpoint
ALTER TABLE "order" ADD COLUMN "discount_type" varchar(20);--> statement-breakpoint
ALTER TABLE "order" ADD COLUMN "stripe_payment_intent_id" varchar(255);--> statement-breakpoint
ALTER TABLE "order" ADD COLUMN "tracking_code" varchar(100);--> statement-breakpoint
ALTER TABLE "order" ADD COLUMN "tracking_url" varchar(500);--> statement-breakpoint
ALTER TABLE "order" ADD COLUMN "shipped_at" timestamp;--> statement-breakpoint
ALTER TABLE "order" ADD COLUMN "delivered_at" timestamp;--> statement-breakpoint
ALTER TABLE "order" ADD COLUMN "refunded_at" timestamp;--> statement-breakpoint
ALTER TABLE "order" ADD COLUMN "canceled_at" timestamp;--> statement-breakpoint
ALTER TABLE "order" ADD COLUMN "status_note" varchar(500);--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "video_url" varchar(500);--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "is_verified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "delivery_days_min" integer;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "delivery_days_max" integer;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "discount_percent" integer;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "original_price_in_cents" integer;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "is_on_sale" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "badge_label" varchar(50);--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "pix_discount_text" varchar(255);--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "is_customizable" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "customization_lead_days" integer DEFAULT 2 NOT NULL;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "name_field_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "name_field_price_in_cents" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "number_field_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "number_field_price_in_cents" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "patch_options" jsonb;--> statement-breakpoint
ALTER TABLE "shipping_address" ADD COLUMN "label" varchar(50) DEFAULT 'Casa' NOT NULL;--> statement-breakpoint
ALTER TABLE "shipping_address" ADD COLUMN "is_default" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "phone" varchar(20);--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "birth_date" date;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "gender" varchar(20);--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "cpf" varchar(11);--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "email_marketing" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "whatsapp_marketing" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "coupon" ADD CONSTRAINT "coupon_category_id_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."category"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_usage" ADD CONSTRAINT "coupon_usage_coupon_id_coupon_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupon"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_usage" ADD CONSTRAINT "coupon_usage_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_usage" ADD CONSTRAINT "coupon_usage_order_id_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."order"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_review" ADD CONSTRAINT "product_review_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_review" ADD CONSTRAINT "product_review_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "return_requests" ADD CONSTRAINT "return_requests_order_id_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."order"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "return_requests" ADD CONSTRAINT "return_requests_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "announcement_bars_active_dates_idx" ON "announcement_bars" USING btree ("is_active","start_date","end_date");--> statement-breakpoint
CREATE INDEX "coupon_code_idx" ON "coupon" USING btree ("code");--> statement-breakpoint
CREATE INDEX "coupon_active_idx" ON "coupon" USING btree ("is_active","expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "coupon_usage_order_idx" ON "coupon_usage" USING btree ("coupon_id","order_id");--> statement-breakpoint
CREATE INDEX "coupon_usage_user_idx" ON "coupon_usage" USING btree ("coupon_id","user_id");--> statement-breakpoint
CREATE INDEX "faq_items_active_position_idx" ON "faq_items" USING btree ("is_active","position");--> statement-breakpoint
CREATE UNIQUE INDEX "highlight_cards_position_unique" ON "highlight_cards" USING btree ("position");--> statement-breakpoint
CREATE INDEX "highlight_cards_active_position_idx" ON "highlight_cards" USING btree ("is_active","position");--> statement-breakpoint
CREATE INDEX "partner_brands_active_position_idx" ON "partner_brands" USING btree ("is_active","position");--> statement-breakpoint
CREATE INDEX "product_images_product_position_idx" ON "product_images" USING btree ("product_id","position");--> statement-breakpoint
CREATE INDEX "product_review_product_id_idx" ON "product_review" USING btree ("product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "product_review_user_product_unique" ON "product_review" USING btree ("user_id","product_id");--> statement-breakpoint
CREATE INDEX "return_requests_user_status_idx" ON "return_requests" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "return_requests_status_created_idx" ON "return_requests" USING btree ("status","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "social_links_platform_unique" ON "social_links" USING btree ("platform");--> statement-breakpoint
CREATE INDEX "social_links_active_position_idx" ON "social_links" USING btree ("is_active","position");--> statement-breakpoint
CREATE UNIQUE INDEX "triple_image_grid_items_position_unique" ON "triple_image_grid_items" USING btree ("position");--> statement-breakpoint
CREATE INDEX "triple_image_grid_items_active_position_idx" ON "triple_image_grid_items" USING btree ("is_active","position");--> statement-breakpoint
CREATE INDEX "trust_badges_active_position_idx" ON "trust_badges" USING btree ("is_active","position");--> statement-breakpoint
ALTER TABLE "product" ADD CONSTRAINT "product_discount_percent_range" CHECK ("product"."discount_percent" IS NULL OR ("product"."discount_percent" >= 1 AND "product"."discount_percent" <= 99));