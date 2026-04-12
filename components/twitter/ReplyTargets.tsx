"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  ExternalLink,
  Search,
  Users,
  MessageSquare,
  RefreshCw,
  Copy,
  Loader2,
  Sparkles,
  Check,
  History,
  Send,
  Clock,
  Target,
} from "lucide-react";
import { useReplySuggest, useSendReply } from "@/hooks/useTweets";
import { toast } from "sonner";

// ─── Search Queries (30+) ────────────────────────────────────────────
const ALL_SEARCH_QUERIES = [
  // English — moving/relocation
  { query: "moving to Germany", emoji: "🇩🇪", desc: "Planning to move" },
  { query: "relocating to Germany tips", emoji: "📦", desc: "Relocation advice" },
  { query: "just moved to Germany", emoji: "🆕", desc: "New arrivals" },
  { query: "first week in Germany", emoji: "📅", desc: "Fresh expats" },
  // English — bureaucracy
  { query: "Anmeldung appointment", emoji: "📋", desc: "Registration struggles" },
  { query: "Ausländerbehörde waiting", emoji: "⏳", desc: "Immigration office" },
  { query: "German bureaucracy nightmare", emoji: "😤", desc: "Bureaucracy frustration" },
  { query: "Aufenthaltstitel OR residence permit Germany", emoji: "🪪", desc: "Residence permits" },
  // English — daily life
  { query: "expat Germany lonely", emoji: "😔", desc: "Lonely expats" },
  { query: "making friends in Germany", emoji: "🤝", desc: "Seeking community" },
  { query: "looking for friends Germany", emoji: "👋", desc: "Friend search" },
  { query: "expat meetup Germany", emoji: "🎉", desc: "Meetup seekers" },
  // English — work & housing
  { query: "job search Germany expat", emoji: "💼", desc: "Job hunting" },
  { query: "apartment search Germany impossible", emoji: "🏠", desc: "Housing crisis" },
  { query: "Schufa score expat", emoji: "📊", desc: "Credit score issues" },
  { query: "Germany health insurance expat", emoji: "🏥", desc: "Insurance confusion" },
  // English — hashtags & community
  { query: "#ExpatLife Germany", emoji: "✈️", desc: "Expat community" },
  { query: "#NewInGermany", emoji: "🌍", desc: "New arrivals tag" },
  { query: "#ExpatInGermany", emoji: "🇪🇺", desc: "Expat tag" },
  { query: "#MovingAbroad Germany", emoji: "🧳", desc: "Moving abroad" },
  // English — specific cities
  { query: "new in Berlin expat", emoji: "🐻", desc: "Berlin newcomers" },
  { query: "new in Munich expat", emoji: "🦁", desc: "Munich newcomers" },
  { query: "Frankfurt expat community", emoji: "🏙️", desc: "Frankfurt expats" },
  { query: "Hamburg expat life", emoji: "⚓", desc: "Hamburg expats" },
  // Turkish
  { query: "Almanya'ya taşınmak", emoji: "🇹🇷", desc: "Türk göçmenler" },
  { query: "Almanya vize başvurusu", emoji: "🇹🇷", desc: "Vize soruları" },
  { query: "Almanya'da yaşam", emoji: "🇹🇷", desc: "Almanya yaşam" },
  { query: "Almanya'da iş aramak", emoji: "🇹🇷", desc: "İş arayışı" },
  { query: "Almanya'da yalnızlık", emoji: "🇹🇷", desc: "Yalnız hissedenler" },
  // German
  { query: "neu in Deutschland Hilfe", emoji: "🇩🇪", desc: "Neue Einwanderer" },
  { query: "Einwanderung Deutschland Tipps", emoji: "🇩🇪", desc: "Einwanderungstipps" },
  { query: "Ausländer in Deutschland Freunde", emoji: "🇩🇪", desc: "Freunde finden" },
  // Visa & study
  { query: "Germany visa rejected", emoji: "😰", desc: "Visa rejections" },
  { query: "Blue Card Germany", emoji: "💳", desc: "Blue Card holders" },
  { query: "studying in Germany international", emoji: "🎓", desc: "International students" },
  { query: "German language course expat", emoji: "📚", desc: "Language learners" },
];

// ─── Target Accounts (15+) ───────────────────────────────────────────
const TARGET_ACCOUNTS = [
  { handle: "SimpleGermany", desc: "Expat tips & guides", followers: "50K+", priority: "high" },
  { handle: "AllAboutBerlin", desc: "Berlin living guide", followers: "30K+", priority: "high" },
  { handle: "GermanyVisa", desc: "Visa & immigration", followers: "20K+", priority: "high" },
  { handle: "MakeItInGermany", desc: "Official DE work portal", followers: "80K+", priority: "high" },
  { handle: "DW_Turkce", desc: "Deutsche Welle Türkçe", followers: "500K+", priority: "medium" },
  { handle: "InterNations", desc: "Global expat network", followers: "100K+", priority: "medium" },
  { handle: "StudyInGermany", desc: "DAAD student portal", followers: "40K+", priority: "medium" },
  { handle: "ExpatFocus", desc: "Expat community", followers: "15K+", priority: "medium" },
  { handle: "LiveWorkGermany", desc: "Jobs & career advice", followers: "10K+", priority: "medium" },
  { handle: "TheLocalGermany", desc: "English news Germany", followers: "60K+", priority: "medium" },
  { handle: "HandOfBlood", desc: "German creator (reach)", followers: "200K+", priority: "low" },
  { handle: "toytown_germany", desc: "Expat forum", followers: "8K+", priority: "low" },
  { handle: "Berlin_Magazine", desc: "Berlin culture & life", followers: "25K+", priority: "low" },
  { handle: "IamExpat_DE", desc: "Expat news Germany", followers: "12K+", priority: "low" },
  { handle: "GermanAtHeart", desc: "German culture & life", followers: "5K+", priority: "low" },
];

const PRIORITY_COLORS: Record<string, "default" | "secondary" | "outline"> = {
  high: "default",
  medium: "secondary",
  low: "outline",
};

function shuffle<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// ─── Helpers ──────────────────────────────────────────────────────────
function extractAuthorFromUrl(url: string): string {
  const match = url.match(/(?:x|twitter)\.com\/([A-Za-z0-9_]+)\/status\//);
  return match ? match[1] : "";
}

function extractTweetIdFromUrl(url: string): string | null {
  const match = url.match(/(?:x|twitter)\.com\/\w+\/status\/(\d+)/);
  return match ? match[1] : null;
}

// ─── Tweet Embed Component ──────────────────────────────────────────
function TweetEmbed({ url }: { url: string }) {
  const embedRef = useRef<HTMLDivElement>(null);
  const tweetId = extractTweetIdFromUrl(url);

  useEffect(() => {
    if (!tweetId || !embedRef.current) return;

    // Clear previous embed
    embedRef.current.innerHTML = "";

    // Create blockquote for Twitter widget
    const blockquote = document.createElement("blockquote");
    blockquote.className = "twitter-tweet";
    blockquote.setAttribute("data-theme", "dark");
    blockquote.setAttribute("data-width", "100%");
    const link = document.createElement("a");
    link.href = url;
    blockquote.appendChild(link);
    embedRef.current.appendChild(blockquote);

    // Load/reload Twitter widget
    const w = window as unknown as { twttr?: { widgets?: { load: (el?: HTMLElement) => void } } };
    if (w.twttr?.widgets) {
      w.twttr.widgets.load(embedRef.current);
    } else {
      const script = document.createElement("script");
      script.src = "https://platform.twitter.com/widgets.js";
      script.async = true;
      document.head.appendChild(script);
    }
  }, [tweetId, url]);

  if (!tweetId) return null;

  return (
    <div ref={embedRef} className="max-w-full overflow-hidden rounded-lg [&_iframe]:!max-w-full" />
  );
}

// ─── Reply History (localStorage) ───────────────────────────────────
interface ReplyRecord {
  tweetUrl: string;
  author: string;
  replyText: string;
  sentAt: string;
  replyUrl?: string;
}

function getReplyHistory(): ReplyRecord[] {
  try {
    return JSON.parse(localStorage.getItem("newbee_reply_history") || "[]");
  } catch {
    return [];
  }
}

function addReplyToHistory(record: ReplyRecord) {
  const history = getReplyHistory();
  history.unshift(record);
  // Keep last 100
  localStorage.setItem("newbee_reply_history", JSON.stringify(history.slice(0, 100)));
}

function getTodayReplyCount(): number {
  const today = new Date().toISOString().split("T")[0];
  return getReplyHistory().filter((r) => r.sentAt.startsWith(today)).length;
}

// ─── Reply Generator Component ──────────────────────────────────────
function ReplyGenerator() {
  const [tweetUrl, setTweetUrl] = useState("");
  const [tweetText, setTweetText] = useState("");
  const [tweetAuthor, setTweetAuthor] = useState("");
  const [replies, setReplies] = useState<string[]>([]);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [sentIdx, setSentIdx] = useState<number | null>(null);
  const [todayCount, setTodayCount] = useState(() => getTodayReplyCount());
  const [showEmbed, setShowEmbed] = useState(false);
  const suggestMutation = useReplySuggest();
  const sendReplyMutation = useSendReply();

  // Auto-extract author from URL
  const handleUrlChange = useCallback((url: string) => {
    setTweetUrl(url);
    const author = extractAuthorFromUrl(url);
    if (author) setTweetAuthor(author);
    // Show embed if valid URL
    setShowEmbed(!!extractTweetIdFromUrl(url));
    // Reset previous replies when URL changes
    setReplies([]);
    setSentIdx(null);
  }, []);

  const handleGenerate = async (style: string = "helpful") => {
    if (!tweetText.trim()) return;
    try {
      const result = await suggestMutation.mutateAsync({
        tweetText: tweetText.trim(),
        tweetAuthor: tweetAuthor.trim() || undefined,
        style,
      });
      setReplies(result.data);
      setSentIdx(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to generate");
    }
  };

  const copyReply = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    toast.success("Copied!");
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const sendReply = async (text: string, idx: number) => {
    if (!tweetUrl.trim()) {
      toast.error("Tweet URL required to send reply");
      return;
    }
    try {
      const result = await sendReplyMutation.mutateAsync({
        tweetUrl: tweetUrl.trim(),
        replyText: text,
      });
      setSentIdx(idx);

      // Save to history
      addReplyToHistory({
        tweetUrl: tweetUrl.trim(),
        author: tweetAuthor,
        replyText: text,
        sentAt: new Date().toISOString(),
        replyUrl: result.data.replyUrl,
      });
      setTodayCount(getTodayReplyCount());

      toast.success("Reply sent!", {
        action: {
          label: "View",
          onClick: () => window.open(result.data.replyUrl, "_blank"),
        },
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to send reply");
    }
  };

  const clearForm = () => {
    setTweetUrl("");
    setTweetText("");
    setTweetAuthor("");
    setReplies([]);
    setSentIdx(null);
    setCopiedIdx(null);
    setShowEmbed(false);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            AI Reply Generator
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={todayCount >= 20 ? "default" : "secondary"} className="text-xs">
              <Send className="h-3 w-3 mr-1" />
              {todayCount}/20 today
            </Badge>
            {(tweetUrl || tweetText) && (
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={clearForm}>
                Clear
              </Button>
            )}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Paste tweet URL → author auto-fills → paste text → generate → Send
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Step 1: Tweet URL */}
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground font-medium">1. Tweet URL</label>
          <input
            type="text"
            placeholder="https://x.com/user/status/..."
            value={tweetUrl}
            onChange={(e) => handleUrlChange(e.target.value)}
            className="w-full rounded-md border bg-transparent px-3 py-1.5 text-sm font-mono"
          />
        </div>

        {/* Tweet Embed Preview */}
        {showEmbed && <TweetEmbed url={tweetUrl} />}

        {/* Step 2: Author + Text */}
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground font-medium">2. Tweet content</label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="@username"
              value={tweetAuthor}
              onChange={(e) => setTweetAuthor(e.target.value)}
              className="w-28 shrink-0 rounded-md border bg-transparent px-2 py-1.5 text-sm"
            />
            <Textarea
              placeholder="Paste tweet text here..."
              value={tweetText}
              onChange={(e) => setTweetText(e.target.value)}
              className="min-h-[60px] text-sm"
            />
          </div>
        </div>

        {/* Step 3: Generate */}
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground font-medium">3. Generate reply</label>
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" onClick={() => handleGenerate("helpful")} disabled={suggestMutation.isPending || !tweetText.trim()}>
              {suggestMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <MessageSquare className="h-3.5 w-3.5 mr-1" />}
              Helpful
            </Button>
            <Button size="sm" variant="secondary" onClick={() => handleGenerate("empathetic")} disabled={suggestMutation.isPending || !tweetText.trim()}>
              Empathetic
            </Button>
            <Button size="sm" variant="secondary" onClick={() => handleGenerate("expert")} disabled={suggestMutation.isPending || !tweetText.trim()}>
              Expert
            </Button>
            <Button size="sm" variant="secondary" onClick={() => handleGenerate("funny")} disabled={suggestMutation.isPending || !tweetText.trim()}>
              Funny
            </Button>
          </div>
        </div>

        {/* Generated Replies */}
        {replies.length > 0 && (
          <div className="space-y-2 pt-2 border-t">
            <label className="text-xs text-muted-foreground font-medium">4. Pick & send</label>
            {replies.map((reply, idx) => (
              <div key={idx} className={`flex items-start gap-2 p-2 rounded-md ${sentIdx === idx ? "bg-green-500/10 border border-green-500/20" : "bg-muted/50"}`}>
                <p className="text-sm flex-1">{reply}</p>
                <div className="flex flex-col gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => copyReply(reply, idx)}
                  >
                    {copiedIdx === idx ? (
                      <Check className="h-3.5 w-3.5 text-green-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </Button>
                  {tweetUrl && sentIdx !== idx && (
                    <Button
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => sendReply(reply, idx)}
                      disabled={sendReplyMutation.isPending}
                    >
                      {sendReplyMutation.isPending ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <>
                          <Send className="h-3 w-3 mr-0.5" />
                          Send
                        </>
                      )}
                    </Button>
                  )}
                  {sentIdx === idx && (
                    <Badge variant="default" className="text-xs">
                      <Check className="h-3 w-3 mr-0.5" /> Sent
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Reply History Component ──────────────────────────────────────────
function ReplyHistory() {
  const [history, setHistory] = useState<ReplyRecord[]>(() => getReplyHistory());
  const [showAll, setShowAll] = useState(false);

  if (history.length === 0) return null;

  const displayed = showAll ? history.slice(0, 50) : history.slice(0, 5);
  const today = new Date().toISOString().split("T")[0];
  const todayReplies = history.filter((r) => r.sentAt.startsWith(today));

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <History className="h-4 w-4" />
            Reply History
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            {todayReplies.length} today / {history.length} total
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {displayed.map((record, idx) => {
          const time = new Date(record.sentAt);
          const isToday = record.sentAt.startsWith(today);
          return (
            <div key={idx} className="flex items-start gap-2 p-2 rounded-md bg-muted/30 text-sm">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  {record.author && (
                    <span className="text-xs text-muted-foreground">@{record.author}</span>
                  )}
                  <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                    <Clock className="h-3 w-3" />
                    {isToday
                      ? time.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })
                      : time.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" })}
                  </span>
                </div>
                <p className="text-xs truncate">{record.replyText}</p>
              </div>
              {record.replyUrl && (
                <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" asChild>
                  <a href={record.replyUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </Button>
              )}
            </div>
          );
        })}
        {history.length > 5 && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? "Show less" : `Show all (${history.length})`}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main Component ──────────────────────────────────────────────────
export function ReplyTargets() {
  const [queries, setQueries] = useState(() => shuffle(ALL_SEARCH_QUERIES).slice(0, 10));
  const [filterLang, setFilterLang] = useState<"all" | "en" | "tr" | "de">("all");

  const refreshQueries = () => {
    setQueries(shuffle(ALL_SEARCH_QUERIES).slice(0, 10));
  };

  const filteredAccounts = filterLang === "all"
    ? TARGET_ACCOUNTS
    : TARGET_ACCOUNTS; // All accounts are relevant for all languages

  return (
    <div className="space-y-4">
      {/* AI Reply Generator */}
      <ReplyGenerator />

      {/* Reply History */}
      <ReplyHistory />

      {/* Search Queries */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Search className="h-4 w-4" />
              Search & Reply ({ALL_SEARCH_QUERIES.length} queries)
            </CardTitle>
            <Button variant="ghost" size="sm" className="h-7" onClick={refreshQueries}>
              <RefreshCw className="h-3.5 w-3.5 mr-1" />
              Shuffle
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Click to search X → find a tweet → copy URL + text → paste above → Send reply
          </p>
        </CardHeader>
        <CardContent className="space-y-2">
          {queries.map((item) => (
            <div key={item.query} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-sm">{item.emoji}</span>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{item.desc}</p>
                  <p className="text-xs text-muted-foreground truncate">{item.query}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="h-7 shrink-0" asChild>
                <a
                  href={`https://x.com/search?q=${encodeURIComponent(item.query)}&f=live`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Target Accounts */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Target className="h-4 w-4" />
            Target Accounts ({TARGET_ACCOUNTS.length})
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Visit their profiles → find recent tweets → reply with AI-generated responses
          </p>
        </CardHeader>
        <CardContent className="space-y-2">
          {filteredAccounts.map((account) => (
            <div key={account.handle} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Badge variant={PRIORITY_COLORS[account.priority]} className="text-xs shrink-0">
                  {account.priority}
                </Badge>
                <div className="min-w-0">
                  <p className="text-sm font-medium">@{account.handle}</p>
                  <p className="text-xs text-muted-foreground">{account.desc} · {account.followers}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="h-7 shrink-0" asChild>
                <a
                  href={`https://x.com/${account.handle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Strategy Tips */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Reply Playbook
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2 text-muted-foreground">
          <p>1. <strong>Search</strong> — Click a query above to open X search (latest tab)</p>
          <p>2. <strong>Copy URL</strong> — Find a good tweet, copy its URL from browser or share button</p>
          <p>3. <strong>Paste URL</strong> — Paste into Reply Generator, author auto-fills + tweet preview shows</p>
          <p>4. <strong>Paste Text</strong> — Copy the tweet text and paste it (AI needs the text to generate a good reply)</p>
          <p>5. <strong>Generate & Send</strong> — Pick a style, get 3 options, click Send to reply directly via API</p>
          <p className="pt-2 border-t">
            <strong>Daily target:</strong> 20 replies across different queries.
            Focus on tweets from the last 6 hours for max visibility.
            Mix of Helpful (50%), Expert (25%), Empathetic (25%).
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
