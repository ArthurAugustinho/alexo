import Link from "next/link";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

type ProductBreadcrumbProps = {
  categoryName: string;
  categorySlug: string;
  productName: string;
};

export function ProductBreadcrumb({
  categoryName,
  categorySlug,
  productName,
}: ProductBreadcrumbProps) {
  const truncated =
    productName.length > 40
      ? `${productName.slice(0, 40).trimEnd()}...`
      : productName;

  return (
    <Breadcrumb className="px-5 pb-2 lg:px-0">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/">Início</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href={`/category/${categorySlug}`}>{categoryName}</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage className="font-semibold">{truncated}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
