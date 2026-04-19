"use client";

import Image from "next/image";
import type { AnyRatio } from "@/lib/projects";

/**
 * Scaled preview of a generated or uploaded image. Centered, rounded-lg with
 * a border-line frame matching the hub design.
 */
export function PreviewImage({
  src,
  ratio,
  alt,
}: {
  src: string;
  ratio: AnyRatio;
  alt: string;
}) {
  const aspect =
    ratio === "16:9"
      ? "aspect-video"
      : ratio === "1:1"
      ? "aspect-square"
      : ratio === "4:5"
      ? "aspect-[4/5]"
      : "aspect-[9/16]";

  return (
    <div className="flex justify-center">
      <div
        className={`relative overflow-hidden rounded-lg border border-line bg-soft ${aspect} w-full max-w-md shadow-card`}
      >
        <Image src={src} alt={alt} fill className="object-contain" unoptimized />
      </div>
    </div>
  );
}
