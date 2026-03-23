/**
 * Content Approval Workflow (Vercel Workflow DevKit)
 *
 * Durable workflow for content generation → approval → publish pipeline.
 * Flow: AI generates → pending_review → user approves/rejects → publish or revise.
 *
 * Uses defineHook for human-in-the-loop approval (workflow pauses until resumed).
 */

import { defineHook, getWritable, FatalError, RetryableError } from "workflow";
import { z } from "zod";
import { randomBytes } from "crypto";

// ─── Event types emitted via getWritable() ──────────────────────────────────

export type ContentApprovalEvent =
  | { type: "awaiting_approval"; contentId: string; hookToken: string }
  | { type: "publishing"; contentId: string; platforms: string[] }
  | { type: "published"; contentId: string; results: Record<string, unknown>[] }
  | { type: "rejected"; contentId: string }
  | { type: "revision"; contentId: string; attempt: number }
  | { type: "error"; contentId: string; message: string };

// ─── Approval hook ──────────────────────────────────────────────────────────

export const approvalHook = defineHook<{
  decision: "approved" | "rejected" | "revision";
  notes?: string;
  publishPlatforms?: string[];
}>();

// ─── Main workflow ──────────────────────────────────────────────────────────

export async function contentApprovalWorkflow(contentId: string): Promise<{
  status: "published" | "rejected" | "max_revisions";
  contentId: string;
}> {
  "use workflow";

  const MAX_REVISIONS = 3;
  let attempts = 0;

  while (attempts < MAX_REVISIONS) {
    // Emit awaiting_approval event with hook token
    // Cryptographically random token — unpredictable even if contentId is known
    const hookToken = `ca:${contentId}:${randomBytes(16).toString("hex")}`;
    const hook = approvalHook.create({ token: hookToken });

    await emitEvent({
      type: "awaiting_approval",
      contentId,
      hookToken,
    });

    // Update DB status to pending_review
    await updateContentStatus(contentId, "pending_review", hookToken);

    // Send notification
    await sendApprovalNotification(contentId);

    // Workflow PAUSES here until user calls resumeHook
    const event = await hook;

    if (event.decision === "approved") {
      const platforms = event.publishPlatforms ?? [];

      await emitEvent({ type: "publishing", contentId, platforms });
      await updateContentStatus(contentId, "publishing");

      const results = await publishContent(contentId, platforms);

      await emitEvent({ type: "published", contentId, results });
      await updateContentStatus(contentId, "published");

      return { status: "published", contentId };
    }

    if (event.decision === "revision" && event.notes) {
      attempts++;
      await emitEvent({ type: "revision", contentId, attempt: attempts });
      await updateContentStatus(contentId, "revision_requested");
      await regenerateContent(contentId, event.notes);
      // Loop continues — will pause at hook again
    } else {
      await emitEvent({ type: "rejected", contentId });
      await updateContentStatus(contentId, "rejected");
      return { status: "rejected", contentId };
    }
  }

  await updateContentStatus(contentId, "rejected");
  return { status: "max_revisions", contentId };
}

// ─── Step functions (each is durable + retryable) ───────────────────────────

async function emitEvent(event: ContentApprovalEvent): Promise<void> {
  "use step";
  console.log(`[content-approval] emit type=${event.type} contentId=${event.contentId}`);
  const writer = getWritable<ContentApprovalEvent>().getWriter();
  try {
    await writer.write(event);
  } finally {
    writer.releaseLock();
  }
}

async function updateContentStatus(
  contentId: string,
  status: string,
  hookToken?: string
): Promise<void> {
  "use step";
  console.log(`[content-approval] updateStatus contentId=${contentId} status=${status}`);
  const { createServiceClient } = await import("@/lib/supabase/server");
  const client = createServiceClient();

  const update: Record<string, unknown> = { status };
  if (hookToken) update.hook_token = hookToken;
  if (status === "published") update.published_at = new Date().toISOString();

  await client
    .from("mkt_content_queue")
    .update(update)
    .eq("id", contentId);
}

async function sendApprovalNotification(contentId: string): Promise<void> {
  "use step";
  console.log(`[content-approval] sendNotification contentId=${contentId}`);
  const { createServiceClient } = await import("@/lib/supabase/server");
  const client = createServiceClient();

  // Get content details
  const { data: content } = await client
    .from("mkt_content_queue")
    .select("user_id, text_content, target_platforms")
    .eq("id", contentId)
    .single();

  if (!content) return;

  await client.from("mkt_notifications").insert({
    user_id: content.user_id,
    type: "content_pending_review",
    title: "Content Ready for Review",
    message: `New content for ${(content.target_platforms as string[]).join(", ")} is waiting for your approval.`,
    reference_id: contentId,
    reference_type: "content_queue",
  });
}

async function publishContent(
  contentId: string,
  platforms: string[]
): Promise<Record<string, unknown>[]> {
  "use step";
  const { createServiceClient } = await import("@/lib/supabase/server");
  const client = createServiceClient();

  // Get content details
  const { data: content } = await client
    .from("mkt_content_queue")
    .select("id, user_id, text_content, media_urls, media_type, hashtags, target_platforms")
    .eq("id", contentId)
    .single();

  if (!content) throw new FatalError(`Content ${contentId} not found`);

  console.log(`[publishContent] START contentId=${contentId} platforms=${platforms.join(",")}`);
  const { publishToSocial } = await import("@/lib/social/publisher");
  const targetPlatforms = platforms.length > 0
    ? platforms
    : (content.target_platforms as string[]);

  const result = await publishToSocial(client, content.user_id, {
    text: content.text_content,
    mediaUrls: (content.media_urls as string[]) ?? [],
    mediaType: (content.media_type as "video" | "image" | "carousel") ?? "image",
    hashtags: (content.hashtags as string[]) ?? [],
    platforms: targetPlatforms as import("@/lib/social/types").SocialPlatform[],
  });

  // Store platform post IDs
  const postIds: Record<string, string> = {};
  for (const r of result.results) {
    if (r.success && r.externalPostId) {
      postIds[r.platform] = r.externalPostId;
    }
  }

  await client
    .from("mkt_content_queue")
    .update({ platform_post_ids: postIds })
    .eq("id", contentId);

  // Send notification
  await client.from("mkt_notifications").insert({
    user_id: content.user_id,
    type: result.failureCount > 0 ? "content_failed" : "content_published",
    title: result.failureCount > 0
      ? `Published with ${result.failureCount} failures`
      : "Content Published Successfully",
    message: `Published to ${result.successCount} platform(s).`,
    reference_id: contentId,
    reference_type: "content_queue",
  });

  console.log(`[publishContent] DONE contentId=${contentId} success=${result.successCount} fail=${result.failureCount}`);
  return result.results as unknown as Record<string, unknown>[];
}

async function regenerateContent(contentId: string, notes: string): Promise<void> {
  "use step";
  console.log(`[content-approval] regenerate contentId=${contentId} notes=${notes.slice(0, 50)}`);
  const { createServiceClient } = await import("@/lib/supabase/server");
  const client = createServiceClient();

  const { data: content } = await client
    .from("mkt_content_queue")
    .select("id, user_id, text_content, hashtags, target_platforms, revision_count")
    .eq("id", contentId)
    .single();

  if (!content) throw new FatalError(`Content ${contentId} not found`);

  // Use Gemini to regenerate based on feedback
  const { ai } = await import("@/lib/google-ai");
  if (!ai) throw new Error("AI client not available");

  const result = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `You are a social media content writer. Revise this content based on the feedback.

Current content: ${content.text_content}
Platforms: ${(content.target_platforms as string[]).join(", ")}
Hashtags: ${(content.hashtags as string[]).join(", ")}

Feedback: ${notes}

Return JSON: { "text_content": "...", "hashtags": ["..."] }`,
  });

  const raw = (result.text ?? "{}").replace(/```json?\n?/g, "").replace(/```/g, "").trim();
  let revised: { text_content?: string; hashtags?: string[] };
  try { revised = JSON.parse(raw); } catch { revised = {}; }

  await client
    .from("mkt_content_queue")
    .update({
      text_content: revised.text_content ?? content.text_content,
      hashtags: revised.hashtags ?? content.hashtags,
      revision_count: (content.revision_count ?? 0) + 1,
    })
    .eq("id", contentId);
}
