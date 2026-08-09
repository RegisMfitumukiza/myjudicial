"use client";

import { useState, useEffect } from "react";
import { Mic, MicOff, Video, VideoOff, Monitor, PhoneOff, Paperclip, Send, FileText, Wifi } from "lucide-react";
import { Link } from "@/i18n/routing";

interface ChatMessage {
  id: string;
  sender: string;
  content: string;
  time: string;
  isMe?: boolean;
}

const INITIAL_CHAT: ChatMessage[] = [
  { id: "1", sender: "System", content: "Session started", time: "10:30 AM" },
  { id: "2", sender: "Sarah Jenkins", content: "I have uploaded the draft contract for the property dispute. Please take a look.", time: "10:42 AM" },
  { id: "3", sender: "Me", content: "Got it. Reviewing section 4.2 now. Everything seems consistent with our last discussion.", time: "10:44 AM", isMe: true },
  { id: "4", sender: "Sarah Jenkins", content: "Great. We can finalize this during our session today.", time: "10:45 AM" },
];

const FILES = [
  { name: "Draft_Contract_Property_v2.pdf", size: "1.2 MB" },
  { name: "Title_Deed_Gasabo.pdf", size: "3.4 MB" },
  { name: "Umudugudu_Resolution.pdf", size: "820 KB" },
];

export default function VideoConsultationPage() {
  const [activeTab, setActiveTab] = useState<"chat" | "files">("chat");
  const [micOn, setMicOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(INITIAL_CHAT);
  const [input, setInput] = useState("");
  const [elapsed, setElapsed] = useState(45 * 60 + 12);
  const [quality, setQuality] = useState<"Good" | "Fair" | "Poor">("Good");

  useEffect(() => {
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const send = () => {
    if (!input.trim()) return;
    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setChatMessages((prev) => [...prev, { id: Date.now().toString(), sender: "Me", content: input, time: now, isMe: true }]);
    setInput("");
  };

  return (
    <div className="flex h-screen flex-col bg-white dark:bg-gray-900">
        <div className="flex items-center justify-between border-b border-blue-100 dark:border-blue-900/30 bg-blue-50 dark:bg-blue-950/30 px-6 py-2">
          <div className="flex items-center gap-2 text-sm">
            <span className="rounded bg-blue-600 px-2 py-0.5 text-xs font-semibold text-white">RECORDING ON</span>
            <span className="text-slate-600 dark:text-gray-300">Recording consent received from all participants.</span>
        </div>
        <div className="flex items-center gap-4">
          {/* Connection quality */}
          <button
            type="button"
            onClick={() => setQuality((q) => q === "Good" ? "Fair" : q === "Fair" ? "Poor" : "Good")}
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${
              quality === "Good"
                ? "bg-green-100 text-green-700"
                : quality === "Fair"
                ? "bg-amber-100 text-amber-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            <Wifi className={`h-3.5 w-3.5 ${quality === "Good" ? "text-green-600" : quality === "Fair" ? "text-amber-600" : "text-red-600"}`} />
            {quality === "Good" ? "Good Connection" : quality === "Fair" ? "Fair Connection" : "Poor Connection"}
          </button>

          <div className="flex items-center gap-2 text-sm font-semibold text-brand-blue">
            <span className="h-2 w-2 rounded-full bg-brand-blue" />
            SESSION DURATION: {formatTime(elapsed)}
          </div>
        </div>
      </div>

      <header className="flex items-center justify-between border-b border-slate-100 dark:border-gray-800 px-6 py-3">
        <div className="flex items-center gap-2">
          <span className="text-base font-bold text-brand-dark dark:text-gray-100">MyJudicial</span>
        </div>
        <nav className="flex items-center gap-6 text-sm text-slate-600 dark:text-gray-300">
          <Link href="/search" className="hover:text-brand-dark dark:hover:text-gray-100">Find Experts</Link>
          <Link href="/client/dashboard" className="hover:text-brand-dark dark:hover:text-gray-100">My Dashboard</Link>
        </nav>
        <button className="rounded-lg border border-slate-200 dark:border-gray-700 px-4 py-2 text-sm font-medium text-brand-dark dark:text-gray-100 hover:bg-slate-50 dark:hover:bg-gray-800">Sign In</button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-gray-800 px-6 py-4">
            <div>
              <h1 className="text-xl font-semibold text-brand-dark dark:text-gray-100">Legal Consultation: Case #882-B</h1>
              <p className="mt-0.5 text-sm text-slate-500 dark:text-gray-400">Scheduled for Oct 24, 2024 • Property Law</p>
            </div>
            <div className="flex -space-x-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-blue-200 text-xs font-semibold text-blue-800">SJ</div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-brand-blue text-xs font-semibold text-white">AR</div>
            </div>
          </div>

          <div className="flex flex-1 items-center justify-center gap-6 px-8 py-6">
            <div className="relative overflow-hidden rounded-2xl bg-slate-200 shadow-md" style={{ width: "340px", height: "240px" }}>
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-300 to-slate-200">
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-slate-400 text-3xl font-semibold text-white">SJ</div>
              </div>
              <div className="absolute bottom-3 left-3 rounded-md bg-black/50 px-2 py-1 text-xs font-medium text-white">Sarah Jenkins</div>
            </div>
            <div className="relative overflow-hidden rounded-2xl shadow-md" style={{ width: "340px", height: "240px" }}>
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-700 to-slate-900">
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-slate-600 text-3xl font-semibold text-white">AR</div>
              </div>
              <div className="absolute inset-x-0 top-0 h-2 rounded-t-2xl bg-yellow-400 opacity-60" />
              <div className="absolute bottom-3 left-3 rounded-md bg-black/50 px-2 py-1 text-xs font-medium text-white">Alex Rivera (You)</div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 border-t border-slate-100 dark:border-gray-800 py-5">
            <button onClick={() => setMicOn((v) => !v)} className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-slate-600 dark:text-gray-300 shadow-sm hover:bg-slate-50 dark:hover:bg-gray-800">
              {micOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5 text-red-500" />}
            </button>
            <button onClick={() => setVideoOn((v) => !v)} className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-slate-600 dark:text-gray-300 shadow-sm hover:bg-slate-50 dark:hover:bg-gray-800">
              {videoOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5 text-red-500" />}
            </button>
            <button className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-slate-600 dark:text-gray-300 shadow-sm hover:bg-slate-50 dark:hover:bg-gray-800">
              <Monitor className="h-5 w-5" />
            </button>
            <button className="flex items-center gap-2 rounded-full bg-red-500 px-6 py-3 text-sm font-semibold text-white hover:bg-red-600">
              <PhoneOff className="h-4 w-4" />
              End Consultation
            </button>
          </div>
        </div>

        <div className="flex w-80 flex-col border-l border-slate-100 dark:border-gray-800">
          <div className="flex border-b border-slate-100 dark:border-gray-800">
            <button onClick={() => setActiveTab("chat")} className={`flex flex-1 items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${activeTab === "chat" ? "border-b-2 border-brand-blue text-brand-blue" : "text-slate-500 dark:text-gray-400 hover:text-brand-dark dark:hover:text-gray-100"}`}>
              Chat
            </button>
            <button onClick={() => setActiveTab("files")} className={`flex flex-1 items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${activeTab === "files" ? "border-b-2 border-brand-blue text-brand-blue" : "text-slate-500 dark:text-gray-400 hover:text-brand-dark dark:hover:text-gray-100"}`}>
              <FileText className="h-4 w-4" /> Files ({FILES.length})
            </button>
          </div>

          {activeTab === "chat" ? (
            <>
              <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
                {chatMessages.map((msg) =>
                  msg.sender === "System" ? (
                    <div key={msg.id} className="text-center text-xs text-slate-400 dark:text-gray-500">{msg.content} {msg.time}</div>
                  ) : msg.isMe ? (
                    <div key={msg.id}>
                      <p className="mb-1 text-right text-xs text-slate-400 dark:text-gray-500">{msg.time}</p>
                      <div className="ml-6 rounded-2xl rounded-tr-none bg-brand-blue px-4 py-3 text-sm text-white">{msg.content}</div>
                    </div>
                  ) : (
                    <div key={msg.id}>
                      <p className="mb-0.5 text-xs font-medium text-slate-600 dark:text-gray-300">{msg.sender}</p>
                      <p className="mb-1 text-xs text-slate-400 dark:text-gray-500">{msg.time}</p>
                      <div className="mr-6 rounded-2xl rounded-tl-none bg-slate-50 dark:bg-gray-800 px-4 py-3 text-sm text-brand-dark dark:text-gray-100">{msg.content}</div>
                    </div>
                  )
                )}
              </div>
              <div className="border-t border-slate-100 dark:border-gray-800 px-4 py-3">
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-gray-700 px-3 py-2.5">
                  <input type="text" placeholder="Type a message..." value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} className="flex-1 bg-transparent text-sm text-brand-dark dark:text-gray-100 placeholder-slate-400 dark:placeholder-gray-500 outline-none" />
                  <Paperclip className="h-4 w-4 cursor-pointer text-slate-400 dark:text-gray-500" />
                  <button onClick={send} className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-blue text-white hover:bg-blue-700">
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 overflow-y-auto px-4 py-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-gray-500">Shared in this session</p>
              <div className="space-y-2">
                {FILES.map((file) => (
                  <div key={file.name} className="flex items-center gap-3 rounded-xl border border-slate-100 dark:border-gray-800 bg-slate-50 dark:bg-gray-800 px-4 py-3">
                    <FileText className="h-5 w-5 flex-shrink-0 text-brand-blue" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-brand-dark dark:text-gray-100">{file.name}</p>
                      <p className="text-xs text-slate-400 dark:text-gray-500">{file.size}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
