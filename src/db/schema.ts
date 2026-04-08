import { relations, sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", [
  "customer",
  "admin",
  "super_admin",
]);

export const sizeTypeEnum = pgEnum("size_type", [
  "alphabetic",
  "numeric",
]);

export const userTable = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  role: userRoleEnum("role").notNull().default("customer"),
  emailVerified: boolean("email_verified")
    .$defaultFn(() => false)
    .notNull(),
  image: text("image"),
  createdAt: timestamp("created_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  phone: varchar("phone", { length: 20 }),
  birthDate: date("birth_date"),
  gender: varchar("gender", { length: 20 }),
  cpf: varchar("cpf", { length: 11 }),
  emailMarketing: boolean("email_marketing").notNull().default(true),
  whatsappMarketing: boolean("whatsapp_marketing").notNull().default(false),
});

export const userRelations = relations(userTable, ({ many, one }) => ({
  shippingAddresses: many(shippingAddressTable),
  cart: one(cartTable, {
    fields: [userTable.id],
    references: [cartTable.userId],
  }),
  orders: many(orderTable),
  wishlistItems: many(wishlistItemTable),
  reviews: many(productReviewTable),
  returnRequests: many(returnRequestTable),
}));

export const sessionTable = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => userTable.id, { onDelete: "cascade" }),
});

export const accountTable = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => userTable.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const verificationTable = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").$defaultFn(
    () => /* @__PURE__ */ new Date(),
  ),
  updatedAt: timestamp("updated_at").$defaultFn(
    () => /* @__PURE__ */ new Date(),
  ),
});

export const seasonalBannerTable = pgTable("seasonal_banner", {
  id: uuid().primaryKey().defaultRandom(),
  imageUrl: text("image_url").notNull(),
  mobileImageUrl: text("mobile_image_url"),
  title: text().notNull(),
  subtitle: text().notNull(),
  linkUrl: text("link_url").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const categoryTable = pgTable("category", {
  id: uuid().primaryKey().defaultRandom(),
  name: text().notNull(),
  slug: text().notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const categoryRelations = relations(categoryTable, ({ many }) => ({
  products: many(productTable),
  sizeCharts: many(sizeChartTable),
}));

export type PatchOption = {
  id: string;
  label: string;
  imageUrl: string;
  priceInCents: number;
};

export const productTable = pgTable(
  "product",
  {
    id: uuid().primaryKey().defaultRandom(),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categoryTable.id, { onDelete: "restrict" }),
    name: text().notNull(),
    slug: text().notNull().unique(),
    description: text().notNull(),
    brand: varchar("brand", { length: 100 }),
    videoUrl: varchar("video_url", { length: 500 }),
    isVerified: boolean("is_verified").notNull().default(false),
    originPostalCode: varchar("origin_postal_code", { length: 8 }),
    sizeType: sizeTypeEnum("size_type").notNull().default("alphabetic"),
    shippingCostInCents: integer("shipping_cost_in_cents").notNull().default(0),
    weightGrams: integer("weight_grams"),
    widthCm: integer("width_cm"),
    heightCm: integer("height_cm"),
    lengthCm: integer("length_cm"),
    deliveryDaysMin: integer("delivery_days_min"),
    deliveryDaysMax: integer("delivery_days_max"),
    // Discount & promotion
    discountPercent: integer("discount_percent"),
    originalPriceInCents: integer("original_price_in_cents"),
    isOnSale: boolean("is_on_sale").notNull().default(false),
    badgeLabel: varchar("badge_label", { length: 50 }),
    pixDiscountText: varchar("pix_discount_text", { length: 255 }),
    // Customization
    isCustomizable: boolean("is_customizable").notNull().default(false),
    customizationLeadDays: integer("customization_lead_days")
      .notNull()
      .default(2),
    nameFieldEnabled: boolean("name_field_enabled").notNull().default(false),
    nameFieldPriceInCents: integer("name_field_price_in_cents")
      .notNull()
      .default(0),
    numberFieldEnabled: boolean("number_field_enabled")
      .notNull()
      .default(false),
    numberFieldPriceInCents: integer("number_field_price_in_cents")
      .notNull()
      .default(0),
    patchOptions: jsonb("patch_options").$type<PatchOption[]>(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    check(
      "product_discount_percent_range",
      sql`${table.discountPercent} IS NULL OR (${table.discountPercent} >= 1 AND ${table.discountPercent} <= 99)`,
    ),
  ],
);

export const productRelations = relations(productTable, ({ one, many }) => ({
  category: one(categoryTable, {
    fields: [productTable.categoryId],
    references: [categoryTable.id],
  }),
  featuredEntries: many(featuredProductTable),
  productSizes: many(productSizeTable),
  variants: many(productVariantTable),
  wishlistItems: many(wishlistItemTable),
  reviews: many(productReviewTable),
  images: many(productImageTable),
}));

export const productImageTable = pgTable(
  "product_images",
  {
    id: uuid().primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => productTable.id, { onDelete: "cascade" }),
    url: varchar("url", { length: 500 }).notNull(),
    alt: varchar("alt", { length: 200 }),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("product_images_product_position_idx").on(
      table.productId,
      table.position,
    ),
  ],
);

export const productImageRelations = relations(productImageTable, ({ one }) => ({
  product: one(productTable, {
    fields: [productImageTable.productId],
    references: [productTable.id],
  }),
}));

export const productSizeTable = pgTable("product_size", {
  id: uuid().primaryKey().defaultRandom(),
  productId: uuid("product_id")
    .notNull()
    .references(() => productTable.id, { onDelete: "cascade" }),
  sizeValue: varchar("size_value", { length: 10 }).notNull(),
  position: integer("position").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const productSizeRelations = relations(productSizeTable, ({ one }) => ({
  product: one(productTable, {
    fields: [productSizeTable.productId],
    references: [productTable.id],
  }),
}));

export const productVariantTable = pgTable(
  "product_variant",
  {
    id: uuid().primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => productTable.id, { onDelete: "cascade" }),
    name: text().notNull(),
    slug: text().notNull().unique(),
    size: varchar("size", { length: 10 }).notNull(),
    color: text().notNull(),
    priceInCents: integer("price_in_cents").notNull(),
    imageUrl: text("image_url").notNull(),
    stock: integer("stock").notNull().default(0),
    isAvailable: boolean("is_available").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    check(
      "product_variant_stock_non_negative",
      sql`${table.stock} >= 0`,
    ),
  ],
);

export const productVariantRelations = relations(
  productVariantTable,
  ({ one, many }) => ({
    product: one(productTable, {
      fields: [productVariantTable.productId],
      references: [productTable.id],
    }),
    cartItems: many(cartItemTable),
    orderItems: many(orderItemTable),
  }),
);

export const sizeChartTable = pgTable(
  "size_chart",
  {
    id: uuid().primaryKey().defaultRandom(),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categoryTable.id, { onDelete: "cascade" }),
    sizeLabel: varchar("size_label", { length: 10 }).notNull(),
    bustMin: numeric("bust_min", { mode: "number" }),
    bustMax: numeric("bust_max", { mode: "number" }),
    waistMin: numeric("waist_min", { mode: "number" }),
    waistMax: numeric("waist_max", { mode: "number" }),
    hipMin: numeric("hip_min", { mode: "number" }),
    hipMax: numeric("hip_max", { mode: "number" }),
    heightMin: numeric("height_min", { mode: "number" }),
    heightMax: numeric("height_max", { mode: "number" }),
    weightMin: numeric("weight_min", { mode: "number" }),
    weightMax: numeric("weight_max", { mode: "number" }),
    position: integer("position").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("size_chart_category_size_label_unique").on(
      table.categoryId,
      table.sizeLabel,
    ),
    index("size_chart_category_id_idx").on(table.categoryId),
  ],
);

export const sizeChartRelations = relations(sizeChartTable, ({ one }) => ({
  category: one(categoryTable, {
    fields: [sizeChartTable.categoryId],
    references: [categoryTable.id],
  }),
}));

export const wishlistItemTable = pgTable(
  "wishlist_items",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => productTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("wishlist_items_user_product_unique").on(
      table.userId,
      table.productId,
    ),
    index("wishlist_items_user_id_idx").on(table.userId),
  ],
);

export const wishlistItemRelations = relations(wishlistItemTable, ({ one }) => ({
  user: one(userTable, {
    fields: [wishlistItemTable.userId],
    references: [userTable.id],
  }),
  product: one(productTable, {
    fields: [wishlistItemTable.productId],
    references: [productTable.id],
  }),
}));

export const featuredProductTable = pgTable("featured_products", {
  id: uuid().primaryKey().defaultRandom(),
  productId: uuid("product_id")
    .notNull()
    .references(() => productTable.id, { onDelete: "cascade" })
    .unique(),
  position: integer("position").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const featuredProductRelations = relations(
  featuredProductTable,
  ({ one }) => ({
    product: one(productTable, {
      fields: [featuredProductTable.productId],
      references: [productTable.id],
    }),
  }),
);

export const shippingAddressTable = pgTable("shipping_address", {
  id: uuid().primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => userTable.id, { onDelete: "cascade" }),
  label: varchar("label", { length: 50 }).notNull().default("Casa"),
  isDefault: boolean("is_default").notNull().default(false),
  recipientName: text().notNull(),
  street: text().notNull(),
  number: text().notNull(),
  complement: text(),
  city: text().notNull(),
  state: text().notNull(),
  neighborhood: text().notNull(),
  zipCode: text().notNull(),
  country: text().notNull().default("Brasil"),
  phone: text().notNull().default(""),
  email: text().notNull().default(""),
  cpfOrCnpj: text().notNull().default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const shippingAddressRelations = relations(
  shippingAddressTable,
  ({ one, many }) => ({
    user: one(userTable, {
      fields: [shippingAddressTable.userId],
      references: [userTable.id],
    }),
    cart: one(cartTable, {
      fields: [shippingAddressTable.id],
      references: [cartTable.shippingAddressId],
    }),
    orders: many(orderTable),
  }),
);

export const cartTable = pgTable("cart", {
  id: uuid().primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => userTable.id, { onDelete: "cascade" }),
  shippingAddressId: uuid("shipping_address_id").references(
    () => shippingAddressTable.id,
    { onDelete: "set null" },
  ),
  appliedCouponCode: varchar("applied_coupon_code", { length: 50 }),
  discountInCents: integer("discount_in_cents").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const cartRelations = relations(cartTable, ({ one, many }) => ({
  user: one(userTable, {
    fields: [cartTable.userId],
    references: [userTable.id],
  }),
  shippingAddress: one(shippingAddressTable, {
    fields: [cartTable.shippingAddressId],
    references: [shippingAddressTable.id],
  }),
  items: many(cartItemTable),
}));

export const cartItemTable = pgTable("cart_item", {
  id: uuid().primaryKey().defaultRandom(),
  cartId: uuid("cart_id")
    .notNull()
    .references(() => cartTable.id, { onDelete: "cascade" }),
  productVariantId: uuid("product_variant_id")
    .notNull()
    .references(() => productVariantTable.id, { onDelete: "cascade" }),
  quantity: integer("quantity").notNull().default(1),
  shippingCostInCents: integer("shipping_cost_in_cents").notNull().default(0),
  shippingServiceName: varchar("shipping_service_name", { length: 100 }),
  shippingDaysMin: integer("shipping_days_min"),
  shippingDaysMax: integer("shipping_days_max"),
  customizationName: varchar("customization_name", { length: 30 }),
  customizationNumber: varchar("customization_number", { length: 5 }),
  customizationPatchId: varchar("customization_patch_id", { length: 100 }),
  customizationExtraInCents: integer("customization_extra_in_cents")
    .notNull()
    .default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const cartItemRelations = relations(cartItemTable, ({ one }) => ({
  cart: one(cartTable, {
    fields: [cartItemTable.cartId],
    references: [cartTable.id],
  }),
  productVariant: one(productVariantTable, {
    fields: [cartItemTable.productVariantId],
    references: [productVariantTable.id],
  }),
}));

export const returnReasonEnum = pgEnum("return_reason", [
  "defect",
  "wrong_item",
  "damaged",
  "wrong_size",
  "other",
]);

export const returnRequestStatusEnum = pgEnum("return_request_status", [
  "pending_review",
  "approved",
  "rejected",
  "completed",
]);

export const orderStatus = pgEnum("order_status", [
  "pending",
  "paid",
  "shipped",
  "delivered",
  "canceled",
  "refunded",
]);

export const orderTable = pgTable("order", {
  id: uuid().primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => userTable.id, { onDelete: "cascade" }),
  shippingAddressId: uuid("shipping_address_id")
    .notNull()
    .references(() => shippingAddressTable.id, { onDelete: "restrict" }),
  recipientName: text().notNull(),
  street: text().notNull(),
  number: text().notNull(),
  complement: text(),
  city: text().notNull(),
  state: text().notNull(),
  neighborhood: text().notNull(),
  zipCode: text().notNull(),
  country: text().notNull(),
  phone: text().notNull(),
  email: text().notNull(),
  cpfOrCnpj: text().notNull(),
  totalPriceInCents: integer("total_price_in_cents").notNull(),
  shippingCostInCents: integer("shipping_cost_in_cents").notNull().default(0),
  originalTotalInCents: integer("original_total_in_cents"),
  discountInCents: integer("discount_in_cents").notNull().default(0),
  couponCode: varchar("coupon_code", { length: 50 }),
  discountType: varchar("discount_type", { length: 20 }),
  status: orderStatus().notNull().default("pending"),
  stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 255 }),
  mpPaymentId: varchar("mp_payment_id", { length: 100 }),
  trackingCode: varchar("tracking_code", { length: 100 }),
  trackingUrl: varchar("tracking_url", { length: 500 }),
  shippedAt: timestamp("shipped_at"),
  deliveredAt: timestamp("delivered_at"),
  refundedAt: timestamp("refunded_at"),
  canceledAt: timestamp("canceled_at"),
  statusNote: varchar("status_note", { length: 500 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const orderRelations = relations(orderTable, ({ one, many }) => ({
  user: one(userTable, {
    fields: [orderTable.userId],
    references: [userTable.id],
  }),
  shippingAddress: one(shippingAddressTable, {
    fields: [orderTable.shippingAddressId],
    references: [shippingAddressTable.id],
  }),
  items: many(orderItemTable),
  returnRequest: one(returnRequestTable, {
    fields: [orderTable.id],
    references: [returnRequestTable.orderId],
  }),
  couponUsage: one(couponUsageTable, {
    fields: [orderTable.id],
    references: [couponUsageTable.orderId],
  }),
}));

export const orderItemTable = pgTable("order_item", {
  id: uuid().primaryKey().defaultRandom(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orderTable.id, { onDelete: "cascade" }),
  productVariantId: uuid("product_variant_id")
    .notNull()
    .references(() => productVariantTable.id, { onDelete: "restrict" }),
  quantity: integer("quantity").notNull(),
  priceInCents: integer("price_in_cents").notNull(),
  customizationName: varchar("customization_name", { length: 30 }),
  customizationNumber: varchar("customization_number", { length: 5 }),
  customizationPatchText: varchar("customization_patch_text", { length: 100 }),
  customizationExtraInCents: integer("customization_extra_in_cents")
    .notNull()
    .default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const orderItemRelations = relations(orderItemTable, ({ one }) => ({
  order: one(orderTable, {
    fields: [orderItemTable.orderId],
    references: [orderTable.id],
  }),
  productVariant: one(productVariantTable, {
    fields: [orderItemTable.productVariantId],
    references: [productVariantTable.id],
  }),
}));

export const couponTable = pgTable(
  "coupon",
  {
    id: uuid().primaryKey().defaultRandom(),
    code: varchar("code", { length: 50 }).notNull().unique(),
    description: varchar("description", { length: 255 }),
    type: varchar("type", { length: 20 }).notNull(),
    value: integer("value").notNull().default(0),
    categoryId: uuid("category_id").references(() => categoryTable.id, {
      onDelete: "set null",
    }),
    minOrderValueInCents: integer("min_order_value_in_cents")
      .notNull()
      .default(0),
    maxDiscountInCents: integer("max_discount_in_cents"),
    maxUsesTotal: integer("max_uses_total"),
    maxUsesPerUser: integer("max_uses_per_user").notNull().default(1),
    isFirstOrderOnly: boolean("is_first_order_only").notNull().default(false),
    isActive: boolean("is_active").notNull().default(true),
    startsAt: timestamp("starts_at"),
    expiresAt: timestamp("expires_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("coupon_code_idx").on(t.code),
    index("coupon_active_idx").on(t.isActive, t.expiresAt),
  ],
);

export const couponRelations = relations(couponTable, ({ one, many }) => ({
  category: one(categoryTable, {
    fields: [couponTable.categoryId],
    references: [categoryTable.id],
  }),
  usages: many(couponUsageTable),
}));

export const couponUsageTable = pgTable(
  "coupon_usage",
  {
    id: uuid().primaryKey().defaultRandom(),
    couponId: uuid("coupon_id")
      .notNull()
      .references(() => couponTable.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orderTable.id, { onDelete: "cascade" }),
    discountAppliedInCents: integer("discount_applied_in_cents").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("coupon_usage_order_idx").on(t.couponId, t.orderId),
    index("coupon_usage_user_idx").on(t.couponId, t.userId),
  ],
);

export const couponUsageRelations = relations(couponUsageTable, ({ one }) => ({
  coupon: one(couponTable, {
    fields: [couponUsageTable.couponId],
    references: [couponTable.id],
  }),
  user: one(userTable, {
    fields: [couponUsageTable.userId],
    references: [userTable.id],
  }),
  order: one(orderTable, {
    fields: [couponUsageTable.orderId],
    references: [orderTable.id],
  }),
}));

export const announcementBarTable = pgTable(
  "announcement_bars",
  {
    id: uuid().primaryKey().defaultRandom(),
    text: varchar("text", { length: 255 }).notNull(),
    linkUrl: varchar("link_url", { length: 500 }),
    bgColor: varchar("bg_color", { length: 7 }).notNull().default("#000000"),
    textColor: varchar("text_color", { length: 7 }).notNull().default("#FFFFFF"),
    isActive: boolean("is_active").notNull().default(true),
    startDate: timestamp("start_date"),
    endDate: timestamp("end_date"),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("announcement_bars_active_dates_idx").on(
      table.isActive,
      table.startDate,
      table.endDate,
    ),
    check(
      "announcement_bars_dates_check",
      sql`${table.startDate} IS NULL OR ${table.endDate} IS NULL OR ${table.startDate} < ${table.endDate}`,
    ),
  ],
);

export const highlightCardTable = pgTable(
  "highlight_cards",
  {
    id: uuid().primaryKey().defaultRandom(),
    title: varchar("title", { length: 100 }).notNull(),
    imageUrl: varchar("image_url", { length: 500 }).notNull(),
    linkUrl: varchar("link_url", { length: 500 }).notNull(),
    position: integer("position").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("highlight_cards_position_unique").on(table.position),
    index("highlight_cards_active_position_idx").on(
      table.isActive,
      table.position,
    ),
    check(
      "highlight_cards_position_check",
      sql`${table.position} >= 1 AND ${table.position} <= 3`,
    ),
  ],
);

export const partnerBrandTable = pgTable(
  "partner_brands",
  {
    id: uuid().primaryKey().defaultRandom(),
    name: varchar("name", { length: 100 }).notNull(),
    logoUrl: varchar("logo_url", { length: 500 }).notNull(),
    linkUrl: varchar("link_url", { length: 500 }),
    isActive: boolean("is_active").notNull().default(true),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("partner_brands_active_position_idx").on(
      table.isActive,
      table.position,
    ),
  ],
);

export const faqItemTable = pgTable(
  "faq_items",
  {
    id: uuid().primaryKey().defaultRandom(),
    question: varchar("question", { length: 300 }).notNull(),
    answer: text("answer").notNull(),
    position: integer("position").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("faq_items_active_position_idx").on(table.isActive, table.position),
  ],
);

export const socialLinkTable = pgTable(
  "social_links",
  {
    id: uuid().primaryKey().defaultRandom(),
    platform: varchar("platform", { length: 50 }).notNull(),
    url: varchar("url", { length: 500 }).notNull(),
    isActive: boolean("is_active").notNull().default(true),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("social_links_platform_unique").on(table.platform),
    index("social_links_active_position_idx").on(
      table.isActive,
      table.position,
    ),
  ],
);

export const supportWidgetConfigTable = pgTable("support_widget_config", {
  id: uuid().primaryKey().defaultRandom(),
  whatsappNumber: varchar("whatsapp_number", { length: 20 }),
  whatsappMessage: varchar("whatsapp_message", { length: 255 }),
  supportEmail: varchar("support_email", { length: 255 }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const trustBadgeTable = pgTable(
  "trust_badges",
  {
    id: uuid().primaryKey().defaultRandom(),
    label: varchar("label", { length: 100 }).notNull(),
    imageUrl: varchar("image_url", { length: 500 }).notNull(),
    linkUrl: varchar("link_url", { length: 500 }),
    isActive: boolean("is_active").notNull().default(true),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("trust_badges_active_position_idx").on(
      table.isActive,
      table.position,
    ),
  ],
);

export const productReviewTable = pgTable(
  "product_review",
  {
    id: uuid().primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => productTable.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
    rating: integer("rating").notNull(),
    title: varchar("title", { length: 150 }),
    body: text("body"),
    photoUrls: text("photo_urls")
      .array()
      .notNull()
      .default(sql`ARRAY[]::text[]`),
    isApproved: boolean("is_approved").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    check(
      "product_review_rating_range",
      sql`${table.rating} >= 1 AND ${table.rating} <= 5`,
    ),
    index("product_review_product_id_idx").on(table.productId),
    uniqueIndex("product_review_user_product_unique").on(
      table.userId,
      table.productId,
    ),
  ],
);

export const productReviewRelations = relations(
  productReviewTable,
  ({ one }) => ({
    product: one(productTable, {
      fields: [productReviewTable.productId],
      references: [productTable.id],
    }),
    user: one(userTable, {
      fields: [productReviewTable.userId],
      references: [userTable.id],
    }),
  }),
);

export const logisticsConfigTable = pgTable("logistics_config", {
  id: uuid().primaryKey().defaultRandom(),
  maxInstallments: integer("max_installments").notNull().default(12),
  minInstallmentValueInCents: integer("min_installment_value_in_cents")
    .notNull()
    .default(2000),
  freeInstallmentsUpTo: integer("free_installments_up_to").notNull().default(1),
  interestRatePercent: numeric("interest_rate_percent", {
    precision: 5,
    scale: 2,
    mode: "number",
  })
    .notNull()
    .default(0),
  returnPolicyDays: integer("return_policy_days").notNull().default(30),
  exchangePolicyText: text("exchange_policy_text"),
  returnPolicyText: text("return_policy_text"),
  successImageUrl: text("success_image_url"),
  cancelImageUrl: text("cancel_image_url"),
  paymentMethods: text("payment_methods")
    .array()
    .notNull()
    .default(
      sql`ARRAY['visa','mastercard','pix','boleto','elo','amex']::text[]`,
    ),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const returnRequestTable = pgTable(
  "return_requests",
  {
    id: uuid().primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orderTable.id, { onDelete: "cascade" })
      .unique(),
    userId: text("user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
    reason: returnReasonEnum("reason").notNull(),
    description: text("description").notNull(),
    photoUrl: varchar("photo_url", { length: 500 }),
    status: returnRequestStatusEnum("status")
      .notNull()
      .default("pending_review"),
    adminNote: text("admin_note"),
    returnCode: varchar("return_code", { length: 100 }),
    returnUrl: varchar("return_url", { length: 500 }),
    reviewedAt: timestamp("reviewed_at"),
    completedAt: timestamp("completed_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("return_requests_user_status_idx").on(table.userId, table.status),
    index("return_requests_status_created_idx").on(
      table.status,
      table.createdAt,
    ),
  ],
);

export const returnRequestRelations = relations(
  returnRequestTable,
  ({ one }) => ({
    order: one(orderTable, {
      fields: [returnRequestTable.orderId],
      references: [orderTable.id],
    }),
    user: one(userTable, {
      fields: [returnRequestTable.userId],
      references: [userTable.id],
    }),
  }),
);

export const simpleBannerTable = pgTable("simple_banners", {
  id: uuid().primaryKey().defaultRandom(),
  imageUrl: varchar("image_url", { length: 500 }).notNull(),
  mobileImageUrl: varchar("mobile_image_url", { length: 500 }),
  linkUrl: varchar("link_url", { length: 500 }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const tripleImageGridItemTable = pgTable(
  "triple_image_grid_items",
  {
    id: uuid().primaryKey().defaultRandom(),
    imageUrl: varchar("image_url", { length: 500 }).notNull(),
    linkUrl: varchar("link_url", { length: 500 }),
    position: integer("position").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("triple_image_grid_items_position_unique").on(table.position),
    index("triple_image_grid_items_active_position_idx").on(
      table.isActive,
      table.position,
    ),
    check(
      "triple_image_grid_items_position_check",
      sql`${table.position} >= 1 AND ${table.position} <= 3`,
    ),
  ],
);
