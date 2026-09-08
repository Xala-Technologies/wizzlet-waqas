import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * Semantic fontSize roles (`text-body`, `text-ui`, …) must be registered as
 * font-size — otherwise twMerge treats them as text-* colors and strips
 * real color classes like `text-primary-foreground` on buttons.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        {
          text: [
            "body",
            "ui",
            "support",
            "caption",
            "title",
            "title-lg",
            "heading",
            "heading-lg",
            "display",
          ],
        },
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
