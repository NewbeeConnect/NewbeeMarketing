"use client";

import { useState } from "react";
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
} from "lucide-react";
import { useReplySuggest } from "@/hooks/useTweets";
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

// ─── Reply Generator Component ──────────────────────────────────────
function ReplyGenerator() {
  const [tweetText, setTweetText] = useState("");
  const [tweetAuthor, setTweetAuthor] = useState("");
  const [replies, setReplies] = useState<string[]>([]);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const suggestMutation = useReplySuggest();

  const handleGenerate = async (style: string = "helpful") => {
    if (!tweetText.trim()) return;
    try {
      const result = await suggestMutation.mutateAsync({
        tweetText: tweetText.trim(),
        tweetAuthor: tweetAuthor.trim() || undefined,
        style,
      });
      setReplies(result.data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to generate");
    }
  };

  const copyReply = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    toast.success("Copied! Paste it as a reply on X");
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          AI Reply Generator
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Paste a tweet below → AI generates reply options → copy & paste on X
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="@username (optional)"
            value={tweetAuthor}
            onChange={(e) => setTweetAuthor(e.target.value)}
            className="w-32 shrink-0 rounded-md border bg-transparent px-2 py-1.5 text-sm"
          />
          <Textarea
            placeholder="Paste tweet text here..."
            value={tweetText}
            onChange={(e) => setTweetText(e.target.value)}
            className="min-h-[60px] text-sm"
          />
        </div>
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

        {replies.length > 0 && (
          <div className="space-y-2 pt-2 border-t">
            {replies.map((reply, idx) => (
              <div key={idx} className="flex items-start gap-2 p-2 rounded-md bg-muted/50">
                <p className="text-sm flex-1">{reply}</p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  onClick={() => copyReply(reply, idx)}
                >
                  {copiedIdx === idx ? (
                    <Check className="h-3.5 w-3.5 text-green-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main Component ──────────────────────────────────────────────────
export function ReplyTargets() {
  const [queries, setQueries] = useState(() => shuffle(ALL_SEARCH_QUERIES).slice(0, 10));

  const refreshQueries = () => {
    setQueries(shuffle(ALL_SEARCH_QUERIES).slice(0, 10));
  };

  return (
    <div className="space-y-4">
      {/* AI Reply Generator */}
      <ReplyGenerator />

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
            Click to search X → find a tweet → paste it above for AI reply
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
            <Users className="h-4 w-4" />
            Target Accounts ({TARGET_ACCOUNTS.length})
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Reply to their recent tweets — high priority accounts first
          </p>
        </CardHeader>
        <CardContent className="space-y-2">
          {TARGET_ACCOUNTS.map((account) => (
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
          <p>1. <strong>Search</strong> — Click a query above, find a recent tweet</p>
          <p>2. <strong>Paste</strong> — Copy tweet text into the AI Reply Generator</p>
          <p>3. <strong>Generate</strong> — Pick a style, get 3 reply options</p>
          <p>4. <strong>Copy & Reply</strong> — Copy the best one, paste as reply on X</p>
          <p className="pt-2 border-t">
            <strong>Daily target:</strong> 20 replies across different queries.
            Focus on tweets from the last 6 hours for max visibility.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
