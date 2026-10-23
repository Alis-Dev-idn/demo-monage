import type { PlanGroupKind } from "@/types";

/**
 * Daftar icon lucide yang relevan untuk Perencanaan Bulanan — group atau
 * item. Disusun per kategori supaya picker bisa group secara visual.
 *
 * Pakai hanya nama yang ada di lucide-react v0.x.
 */
export const PLAN_ICON_GROUPS: Array<{
  label: string;
  icons: string[];
}> = [
  {
    label: "Belanja & Logistik",
    icons: [
      "ShoppingCart",
      "ShoppingBag",
      "ShoppingBasket",
      "Package",
      "PackageOpen",
      "Boxes",
      "Truck",
      "Receipt",
      "Store",
    ],
  },
  {
    label: "Makanan & Masak",
    icons: [
      "ChefHat",
      "Utensils",
      "UtensilsCrossed",
      "CookingPot",
      "Salad",
      "Pizza",
      "Sandwich",
      "Coffee",
      "Beer",
      "Wine",
      "CupSoda",
      "IceCream",
      "Cookie",
      "Cake",
      "Soup",
      "EggFried",
      "Drumstick",
      "Fish",
      "Beef",
      "Ham",
      "Croissant",
    ],
  },
  {
    label: "Bahan Mentah",
    icons: [
      "Apple",
      "Cherry",
      "Carrot",
      "Grape",
      "Banana",
      "Citrus",
      "Wheat",
      "Leaf",
      "Milk",
    ],
  },
  {
    label: "Tagihan & Rumah",
    icons: [
      "Home",
      "House",
      "Building",
      "Lightbulb",
      "Wifi",
      "Phone",
      "Tv",
      "Droplet",
      "Flame",
      "Zap",
      "Wrench",
      "Hammer",
    ],
  },
  {
    label: "Hobi & Hiburan",
    icons: [
      "Gamepad2",
      "Music",
      "Music2",
      "Headphones",
      "Mic",
      "Camera",
      "Film",
      "Book",
      "BookOpen",
      "Library",
      "Palette",
      "Brush",
      "Bike",
      "Dumbbell",
      "Trophy",
      "Volleyball",
      "Tent",
      "Mountain",
      "Plane",
      "MapPin",
    ],
  },
  {
    label: "Lainnya",
    icons: [
      "Heart",
      "Gift",
      "PawPrint",
      "Baby",
      "GraduationCap",
      "Briefcase",
      "Sparkles",
      "Star",
      "Tag",
      "FileText",
      "ClipboardList",
      "Calendar",
      "CalendarDays",
    ],
  },
];

/** Flatten — untuk validasi / search cepat. */
export const PLAN_ICON_NAMES: string[] = PLAN_ICON_GROUPS.flatMap((g) => g.icons);

/** Default icon untuk tiap kind group. */
export const DEFAULT_GROUP_ICON: Record<PlanGroupKind, string> = {
  shopping: "ShoppingCart",
  meal: "ChefHat",
  hobby: "Sparkles",
  bills: "Receipt",
  other: "ClipboardList",
};

export const GROUP_KIND_LABEL: Record<PlanGroupKind, string> = {
  shopping: "Belanja",
  meal: "Menu Masak",
  hobby: "Hobi",
  bills: "Tagihan",
  other: "Lainnya",
};
