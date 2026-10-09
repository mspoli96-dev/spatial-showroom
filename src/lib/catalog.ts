import type { Category, Configuration, Product } from "./contracts";

export const CATALOG_VERSION = "studio-collection-v1";
export const ROOM = { width: 3.6, depth: 3.2, height: 2.65, minimumGap: 0.06 } as const;
export const PRODUCTS: Product[] = [
  { id: "folio-110", category: "desk", name: "Folio 110", description: "A compact writing desk with tapered legs.", priceCents: 39000, width: 1.1, depth: 0.6, height: 0.74 },
  { id: "studio-140", category: "desk", name: "Studio 140", description: "A balanced workspace with a slim storage drawer.", priceCents: 52000, width: 1.4, depth: 0.7, height: 0.74 },
  { id: "span-180", category: "desk", name: "Span 180", description: "A generous work surface on architectural trestles.", priceCents: 69000, width: 1.8, depth: 0.8, height: 0.74 },
  { id: "arc-chair", category: "chair", name: "Arc chair", description: "A light upholstered chair with a curved back.", priceCents: 26000, width: 0.62, depth: 0.62, height: 0.86 },
  { id: "loop-chair", category: "chair", name: "Loop chair", description: "An upholstered work chair with sculpted arms.", priceCents: 34000, width: 0.68, depth: 0.68, height: 0.91 },
  { id: "cove-chair", category: "chair", name: "Cove chair", description: "A wide padded seat with a wraparound shell.", priceCents: 48000, width: 0.82, depth: 0.8, height: 0.9 },
  { id: "halo-lamp", category: "lamp", name: "Halo lamp", description: "A softly lit dome on a compact desk base.", priceCents: 8500, width: 0.22, depth: 0.22, height: 0.4 },
  { id: "stem-lamp", category: "lamp", name: "Stem lamp", description: "A slender task lamp with an angled shade.", priceCents: 12000, width: 0.24, depth: 0.22, height: 0.46 },
  { id: "tower-shelf", category: "storage", name: "Tower shelf", description: "A narrow open shelf for books and display.", priceCents: 24000, width: 0.65, depth: 0.38, height: 1.65 },
  { id: "wide-shelf", category: "storage", name: "Wide shelf", description: "A low, wide storage piece for a compact desk layout.", priceCents: 36000, width: 1.2, depth: 0.42, height: 1.1 }
];
export const DEFAULT_CONFIGURATION: Configuration = { deskId: "studio-140", chairId: "loop-chair", lampId: "halo-lamp", storageId: "tower-shelf", finish: "oak", fabric: "sage", layout: "left", lighting: "day" };
export const DEFAULT_BUDGET_CENTS = 150000;
export const CONFIG_KEYS = ["deskId", "chairId", "lampId", "storageId", "finish", "fabric", "layout", "lighting"] as const;
export const CATEGORY_KEYS = { desk: "deskId", chair: "chairId", lamp: "lampId", storage: "storageId" } as const;
export const FINISHES = [{ id: "oak", label: "Warm oak", colour: "#C0A17B" }, { id: "walnut", label: "Walnut", colour: "#6A4838" }, { id: "chalk", label: "Chalk", colour: "#EAE6DD" }] as const;
export const FABRICS = [{ id: "sage", label: "Sage", colour: "#8F9D8C" }, { id: "sand", label: "Sand", colour: "#C7B89E" }, { id: "charcoal", label: "Charcoal", colour: "#4D5457" }] as const;
export function productById(id: string): Product | undefined { return PRODUCTS.find(product => product.id === id); }
export function productsFor(category: Category): Product[] { return PRODUCTS.filter(product => product.category === category); }
export function money(cents: number): string { return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(cents / 100); }
