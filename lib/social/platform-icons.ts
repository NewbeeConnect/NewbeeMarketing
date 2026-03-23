/**
 * Platform Icons & Colors — Single source of truth
 *
 * Eliminates duplication across social/page, queue/page, analytics/page, trends/page.
 * Import from here instead of redefining in each component.
 */

import {
  Instagram,
  Youtube,
  Twitter,
  Linkedin,
  Facebook,
  Share2,
  type LucideIcon,
} from "lucide-react";
import type { SocialPlatform } from "./types";

export const PLATFORM_ICONS: Record<SocialPlatform, LucideIcon> & Record<string, LucideIcon | undefined> = {
  instagram: Instagram,
  tiktok: Share2,
  youtube: Youtube,
  twitter: Twitter,
  linkedin: Linkedin,
  facebook: Facebook,
};

export const PLATFORM_COLORS: Record<SocialPlatform, string> & Record<string, string | undefined> = {
  instagram: "text-pink-500",
  tiktok: "text-gray-900 dark:text-white",
  youtube: "text-red-500",
  twitter: "text-blue-400",
  linkedin: "text-blue-600",
  facebook: "text-blue-500",
};

export const PLATFORM_LABELS: Record<SocialPlatform, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  youtube: "YouTube",
  twitter: "X (Twitter)",
  linkedin: "LinkedIn",
  facebook: "Facebook",
};

export function getPlatformIcon(platform: string): LucideIcon {
  return PLATFORM_ICONS[platform as SocialPlatform] ?? Share2;
}

export function getPlatformColor(platform: string): string {
  return PLATFORM_COLORS[platform as SocialPlatform] ?? "";
}
