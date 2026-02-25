"use client";

import { useState } from "react";
import { useRefineContent } from "@/hooks/useAiStrategy";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, User, Loader2 } from "lucide-react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface RefinementChatProps {
  projectId: string;
  currentContent: unknown;
  contentType: "strategy" | "scenes" | "prompts";
  onRefined: (updatedContent: unknown, explanation: string) => void;
}

export function RefinementChat({
  projectId,
  currentContent,
  contentType,
  onRefined,
}: RefinementChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const refineMutation = useRefineContent();

  const handleSend = async () => {
    if (!input.trim() || refineMutation.isPending) return;

    const userMessage = input.trim();
    setInput("");

    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);

    try {
      const result = await refineMutation.mutateAsync({
        projectId,
        currentContent,
        refinementRequest: userMessage,
        contentType,
      });

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: result.explanation },
      ]);

      onRefined(result.updated_content, result.explanation);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Error: ${error instanceof Error ? error.message : "Something went wrong"}`,
        },
      ]);
    }
  };

  const suggestions = contentType === "strategy"
    ? [
        "Make the hook more aggressive",
        "Simplify the key messages",
        "Make the CTA more urgent",
        "Add data/numbers to the strategy",
      ]
    : [
        "Make the first scene more dynamic",
        "Shorten the total duration",
        "Add more product close-ups",
        "Make transitions smoother",
      ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Bot className="h-4 w-4" />
          AI Refinement Chat
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {messages.length === 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              Ask the AI to refine specific aspects of your {contentType}:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {suggestions.map((s) => (
                <Button
                  key={s}
                  variant="outline"
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => setInput(s)}
                >
                  {s}
                </Button>
              ))}
            </div>
          </div>
        )}

        {messages.length > 0 && (
          <ScrollArea className="h-48">
            <div className="space-y-3 pr-3">
              {messages.map((msg, i) => (
                <div key={i} className="flex gap-2">
                  {msg.role === "user" ? (
                    <User className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                  ) : (
                    <Bot className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                  )}
                  <p className="text-sm">{msg.content}</p>
                </div>
              ))}
              {refineMutation.isPending && (
                <div className="flex gap-2">
                  <Bot className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>
          </ScrollArea>
        )}

        <div className="flex gap-2">
          <Input
            placeholder={`e.g. "Make the hook more aggressive"...`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            disabled={refineMutation.isPending}
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!input.trim() || refineMutation.isPending}
          >
            {refineMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
