"use client";

import Image from "next/image";
import type { AnyRatio } from "@/lib/projects";

/**
 * Scaled preview of a generated or uploaded image. Uses next/image with
 * unoptimized=true because the source is a Supabase storage URL that's
 * already sized appropriately.
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
    <div
      className={`relative w-full overflow-hidden rounded-md bg-muted/40 ${aspect} max-w-md`}
    >
      <Image src={src} alt={alt} fill className="object-contain" unoptimized />
    </div>
  );
}
