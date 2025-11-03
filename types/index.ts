/**
 * Central export file for all application types
 * Import types from this file instead of individual files
 *
 * Example: import { Order, Product, BlogPost } from "@/types"
 */

// Blog and Author types
export type {
  Author,
  Category,
  BlogPost,
  Post,
  BlogPostMetadata,
  BlogPostsListResponse,
} from "./blog";

// Cart types
export type { CartItem, Cart } from "./cart";

// Contact form types
export type {
  Contact,
  ContactFormRequest,
  ContactFormResponse,
} from "./contact";

// Navigation types
export type { NavItem } from "./nav";

// Newsletter types
export type {
  Newsletter,
  NewsletterSubscribeRequest,
  NewsletterSubscribeResponse,
} from "./newsletter";

// Order types
export type {
  Order,
  OrderItem,
  OrdersListResponse,
  OrderDetailResponse,
} from "./order";

// Product types
export type {
  Certification,
  SustainabilityScore,
  PricePoint,
  Manufacturer,
  ProductReview,
  Product,              // E-commerce Product (matches Prisma schema)
  DetailedProduct,      // Detailed sustainability-focused product (for editorial content)
} from "./product";
