"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type ProductImageProps = {
  imageUrl: string;
  productName: string;
  selectedColor: string | null;
  selectedSize: string | null;
};

const ProductImage = ({
  imageUrl,
  productName,
  selectedColor,
  selectedSize,
}: ProductImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(false);
  }, [imageUrl]);

  const altSegments = [
    `Imagem do produto ${productName}`,
    selectedColor ? `cor ${selectedColor}` : null,
    selectedSize ? `tamanho ${selectedSize}` : null,
  ].filter(Boolean);

  return (
    <div className="relative overflow-hidden">
      <Image
        key={imageUrl}
        src={imageUrl}
        alt={altSegments.join(" - ")}
        sizes="100vw"
        height={0}
        width={0}
        priority
        onLoad={() => setIsLoaded(true)}
        className={`h-auto w-full object-cover transition-opacity duration-300 ${
          isLoaded ? "opacity-100" : "opacity-0"
        }`}
      />
      {!isLoaded ? (
        <div className="absolute inset-0 animate-pulse bg-muted" />
      ) : null}
    </div>
  );
};

export default ProductImage;

