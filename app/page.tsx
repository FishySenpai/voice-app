"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Send, Play, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

interface Message {
  id: string;
  sender: "user" | "bot";
  text: string;
  audioUrl?: string;
  timestamp: Date;
}

export default function ChatbotPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      sender: "bot",
      text: "Hello! I'm your AI assistant. How can I help you today?",
      audioUrl: "",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isPlaying, setIsPlaying] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { theme, setTheme } = useTheme();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: "user",
      text: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");

    // Show loading message
    const loadingId = (Date.now() + 1).toString();
    setMessages((prev) => [
      ...prev,
      {
        id: loadingId,
        sender: "bot",
        text: "Thinking...",
        timestamp: new Date(),
      },
    ]);

    try {
      const webhookUrl = process.env.NEXT_PUBLIC_MAKE_WEBHOOK_URL;
      if (!webhookUrl) throw new Error("Webhook URL not set");

      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: userMessage.text }),
      });

      if (!response.ok) throw new Error("Failed to get AI response");
      const responseText = await response.text();
      console.log("Raw response:", responseText);

      let audioUrl = "";
      let botText = "";

      // Simple split based on .mp3,
      const mp3Index = responseText.indexOf(".mp3,");
      if (mp3Index !== -1) {
        audioUrl = responseText.slice(0, mp3Index + 4).trim();
        botText = responseText.slice(mp3Index + 5).trim();
      } else {
        // fallback: show all as text
        botText = responseText.trim();
      }

      // Remove loading message
      setMessages((prev) => prev.filter((msg) => msg.id !== loadingId));

      // Add bot message
      const botMsgId = (Date.now() + 2).toString();
      setMessages((prev) => [
        ...prev,
        {
          id: botMsgId,
          sender: "bot",
          text: botText,
          audioUrl,
          timestamp: new Date(),
        },
      ]);

      // Auto-play audio
      if (audioUrl) {
        setIsPlaying(botMsgId);
        if (audioRef.current) {
          audioRef.current.src = audioUrl;
          try {
            await audioRef.current.play();
          } catch (error) {
            setIsPlaying(null);
          }
        }
      }

      // Auto-play audio
      if (audioUrl) {
        setIsPlaying(botMsgId);
        if (audioRef.current) {
          audioRef.current.src = audioUrl;
          try {
            await audioRef.current.play();
          } catch (error) {
            setIsPlaying(null);
          }
        }
      }
    } catch (error: any) {
      setMessages((prev) => prev.filter((msg) => msg.id !== loadingId));
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 3).toString(),
          sender: "bot",
          text: "Error: " + (error.message || "Unknown error"),
          timestamp: new Date(),
        },
      ]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  const playAudio = async (audioUrl: string, messageId: string) => {
    if (isPlaying === messageId) {
      audioRef.current?.pause();
      setIsPlaying(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.src = audioUrl;
      setIsPlaying(messageId);

      try {
        await audioRef.current.play();
      } catch (error) {
        setIsPlaying(null);
      }
    }
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-background">
      <div className="flex flex-col h-[90vh] w-full max-w-6xl bg-background rounded-lg shadow-lg border border-border">
        {/* Header with theme toggle */}
        <div className="flex justify-between items-center p-4 border-b border-border">
          <h1 className="text-2xl font-semibold">AI Chatbot</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>
        </div>

        {/* Chat messages area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.sender === "user" ? "justify-end" : "justify-start"
              } animate-in slide-in-from-bottom-2 duration-300`}
            >
              <div
                className={`max-w-[80%] md:max-w-[60%] ${
                  message.sender === "user" ? "order-2" : "order-1"
                }`}
              >
                <Card
                  className={`!p-4 shadow-sm ${
                    message.sender === "user"
                      ? "bg-primary text-primary-foreground ml-auto"
                      : "bg-card text-card-foreground"
                  }`}
                >
                  <p className="text-2xl leading-relaxed break-words whitespace-pre-wrap">
                    {message.text}
                  </p>

                  {/* Audio button for bot messages */}
                  {message.sender === "bot" && message.audioUrl && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-3 h-9 px-3 text-base"
                      onClick={() => playAudio(message.audioUrl!, message.id)}
                      disabled={isPlaying === message.id}
                    >
                      <Play
                        className={`h-4 w-4 mr-2 ${
                          isPlaying === message.id ? "animate-pulse" : ""
                        }`}
                      />
                      {isPlaying === message.id ? "Playing..." : "Play Audio"}
                    </Button>
                  )}
                </Card>

                {/* Timestamp */}
                <p
                  className={`text-sm text-muted-foreground mt-2 ${
                    message.sender === "user" ? "text-right" : "text-left"
                  }`}
                >
                  {formatTimestamp(message.timestamp)}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="sticky bottom-0 bg-background border-t border-border p-4">
          <div className="flex gap-2 w-full">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="flex-1 rounded-full !text-xl !px-8 !py-6 !h-16"
            />
            <Button
              onClick={handleSendMessage}
              size="icon"
              className="rounded-full shrink-0"
              disabled={!inputValue.trim()}
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Hidden audio element */}
        <audio
          ref={audioRef}
          onEnded={() => setIsPlaying(null)}
          onError={() => setIsPlaying(null)}
        />
      </div>
    </div>
  );
}
