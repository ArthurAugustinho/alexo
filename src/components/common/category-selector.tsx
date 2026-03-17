import Link from "next/link";

import { categoryTable } from "@/db/schema";

interface CategorySelectorProps {
  categories: (typeof categoryTable.$inferSelect)[];
}

const CategorySelector = ({ categories }: CategorySelectorProps) => {
  return (
    <div className="overflow-hidden rounded-[2rem] bg-[#F4EFFF] p-4 sm:p-6">
      <div className="mx-auto grid max-w-3xl grid-cols-2 gap-3 sm:gap-4">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/category/${category.slug}`}
            className="flex min-h-14 w-full items-center justify-center rounded-full bg-white px-4 py-3 text-center text-sm font-semibold leading-tight text-[#171717] shadow-[0_8px_20px_rgba(186,167,255,0.12)] transition-transform hover:-translate-y-0.5"
          >
            <span className="max-w-full text-balance break-words">
              {category.name}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default CategorySelector;
