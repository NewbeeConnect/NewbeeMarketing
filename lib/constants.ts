export const PLATFORMS = [
  { value: "instagram_reels", label: "Instagram Reels", aspectRatio: "9:16", maxDuration: 90 },
  { value: "tiktok", label: "TikTok", aspectRatio: "9:16", maxDuration: 60 },
  { value: "youtube_shorts", label: "YouTube Shorts", aspectRatio: "9:16", maxDuration: 60 },
  { value: "youtube", label: "YouTube", aspectRatio: "16:9", maxDuration: 600 },
  { value: "linkedin", label: "LinkedIn", aspectRatio: "16:9", maxDuration: 120 },
  { value: "twitter", label: "X (Twitter)", aspectRatio: "16:9", maxDuration: 140 },
  { value: "facebook_feed", label: "Facebook Feed", aspectRatio: "1:1", maxDuration: 120 },
] as const;

export const LANGUAGES = [
  { value: "en", label: "English", flag: "🇬🇧" },
  { value: "de", label: "Deutsch", flag: "🇩🇪" },
  { value: "tr", label: "Turkce", flag: "🇹🇷" },
] as const;

export const STYLES = [
  { value: "modern", label: "Modern", description: "Clean, contemporary aesthetics" },
  { value: "cinematic", label: "Cinematic", description: "Film-like quality, dramatic" },
  { value: "minimal", label: "Minimal", description: "Simple, focused, less is more" },
  { value: "playful", label: "Playful", description: "Fun, colorful, energetic" },
  { value: "corporate", label: "Corporate", description: "Professional, polished" },
  { value: "artistic", label: "Artistic", description: "Creative, unique, experimental" },
] as const;

export const TONES = [
  { value: "professional", label: "Professional" },
  { value: "casual", label: "Casual" },
  { value: "energetic", label: "Energetic" },
  { value: "luxurious", label: "Luxurious" },
  { value: "friendly", label: "Friendly" },
  { value: "bold", label: "Bold" },
] as const;

export const TEMPLATE_CATEGORIES = [
  { value: "app_demo", label: "App Demo" },
  { value: "feature_showcase", label: "Feature Showcase" },
  { value: "testimonial", label: "Testimonial" },
  { value: "event_promo", label: "Event Promo" },
  { value: "brand_awareness", label: "Brand Awareness" },
  { value: "general", label: "General" },
] as const;

export const ASPECT_RATIOS = {
  "9:16": { width: 1080, height: 1920, label: "Portrait (9:16)" },
  "16:9": { width: 1920, height: 1080, label: "Landscape (16:9)" },
  "1:1": { width: 1080, height: 1080, label: "Square (1:1)" },
} as const;

export const RESOLUTIONS = [
  { value: "720p", label: "720p", description: "HD - faster generation" },
  { value: "1080p", label: "1080p", description: "Full HD - recommended" },
  { value: "4k", label: "4K", description: "Ultra HD - highest quality" },
] as const;

export const WORKFLOW_STEPS = [
  { number: 1, label: "Brief", path: "" },
  { number: 2, label: "Strategy", path: "/strategy" },
  { number: 3, label: "Scenes", path: "/scenes" },
  { number: 4, label: "Prompts", path: "/prompts" },
  { number: 5, label: "Generate", path: "/generate" },
  { number: 6, label: "Post-Production", path: "/post-production" },
] as const;

export const NAV_ITEMS = [
  { title: "Dashboard", url: "/dashboard", icon: "LayoutDashboard", group: "home" },
  { title: "Projects", url: "/projects", icon: "Film", group: "create" },
  { title: "Brand Kit", url: "/brand", icon: "Palette", group: "create" },
  { title: "Campaigns", url: "/campaigns", icon: "Megaphone", group: "distribute" },
  { title: "Calendar", url: "/calendar", icon: "CalendarDays", group: "distribute" },
  { title: "Gallery", url: "/gallery", icon: "Images", group: "library" },
  { title: "Templates", url: "/templates", icon: "FileStack", group: "library" },
  { title: "Analytics", url: "/analytics", icon: "BarChart3", group: "footer" },
  { title: "Settings", url: "/settings", icon: "Settings", group: "footer" },
] as const;

export const CAMPAIGN_WORKFLOW_STEPS = [
  { number: 1, label: "Fetch Context", path: "", icon: "Globe" },
  { number: 2, label: "AI Strategy", path: "/strategy", icon: "Brain" },
  { number: 3, label: "Media Production", path: "/media", icon: "Film" },
  { number: 4, label: "Ad Distribution", path: "/publish", icon: "Megaphone" },
  { number: 5, label: "Analytics", path: "/analytics", icon: "BarChart3" },
] as const;

export const AD_PLATFORMS = [
  { value: "google", label: "Google Ads", description: "Search, Display, YouTube" },
  { value: "meta", label: "Meta Ads", description: "Facebook, Instagram" },
] as const;

// Phone mockup templates
export const PHONE_TEMPLATES = [
  {
    id: "iphone16-portrait",
    name: "iPhone 16",
    orientation: "portrait" as const,
    // Outer frame dimensions
    frameWidth: 396,
    frameHeight: 852,
    frameRadius: 53,
    // Screen area within the frame
    screen: { x: 19, y: 19, width: 358, height: 776, radius: 45 },
    // Dynamic Island
    dynamicIsland: { x: 135, y: 30, width: 126, height: 37, radius: 19 },
  },
  {
    id: "iphone16-landscape",
    name: "iPhone 16 Landscape",
    orientation: "landscape" as const,
    frameWidth: 852,
    frameHeight: 396,
    frameRadius: 53,
    screen: { x: 38, y: 19, width: 776, height: 358, radius: 45 },
    dynamicIsland: { x: 363, y: 135, width: 37, height: 126, radius: 19 },
  },
] as const;

export type PhoneTemplateId = (typeof PHONE_TEMPLATES)[number]["id"];

// Budget alert thresholds
export const BUDGET_THRESHOLDS = [0.75, 0.9, 0.95] as const;
export const TOTAL_CREDIT_USD = 25000;
