export type FeedItemStatus = "draft" | "published" | "archived";

export interface FeedItem {
  id: string;
  status: FeedItemStatus;
  title: string;
  slug: string;
  caption_short: string;
  caption_long: string;
  thumbnail_url: string;
  bunny_video_id: string;
  bunny_embed_url?: string | null;
  cta_text: string;
  cta_url: string;
  sort_order: number;
  published_at: string;
  is_featured: boolean;
  campaign_tag: string;
  created_at?: string;
  updated_at?: string;
}
