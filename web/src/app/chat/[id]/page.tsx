"use client";

import { useState, useRef, useEffect, use } from "react";
import { Icon } from "@/components/ui/Icon";
import { useI18n } from "@/components/providers/I18nProvider";

interface Message {
  id: string;
  text: string;
  isMe: boolean;
  time: string;
  read: boolean;
}

interface ChatParams {
  id: string;
}

const mockMessages: Record<string, { name: string; messages: Message[] }> = {
  "1": {
    name: "inkink",
    messages: [
      { id: "m1", text: "Hey there! How is the new UI coming along?", isMe: false, time: "10:30", read: true },
      { id: "m2", text: "Producer-san! It's looking amazing! 39!", isMe: true, time: "10:32", read: true },
      { id: "m3", text: "We are working on the Chat module right now. The left-aligned design is super clean.", isMe: true, time: "10:33", read: false },
      { id: "m4", text: "That sounds perfect. Can't wait to see it running on Riverpod... well, Pinia here!", isMe: false, time: "10:35", read: false },
    ],
  },
  "2": {
    name: "yuzuki",
    messages: [
      { id: "m5", text: "我怎么去联合其他社区啊", isMe: false, time: "14:20", read: true },
    ],
  },
  "3": {
    name: "瞿十光",
    messages: [
      { id: "m6", text: "在吗", isMe: false, time: "09:15", read: true },
    ],
  },
  "4": {
    name: "初音ミク",
    messages: [
      { id: "m7", text: "準備打歌了！", isMe: false, time: "18:00", read: true },
    ],
  },
  "5": {
    name: "技术交流群",
    messages: [
      { id: "m8", text: "系统维护通知：今晚 22:00-23:00 将进行例行维护。", isMe: false, time: "20:00", read: true },
    ],
  },
};

export default function ChatDetailPage({ params }: { params: Promise<ChatParams> }) {
  const { t } = useI18n();
  const { id } = use(params);
  const chatData = mockMessages[id] || { name: "Unknown", messages: [] };
  const [messages, setMessages] = useState<Message[]>(chatData.messages);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    const msg: Message = {
      id: `m${Date.now()}`,
      text: newMessage,
      isMe: true,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      read: false,
    };
    setMessages((prev) => [...prev, msg]);
    setNewMessage("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 relative">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-800/50 shrink-0 z-10">
        <button
          onClick={() => history.back()}
          className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        >
          <Icon name="arrow_left" fontSize={18} />
        </button>
        <div className="w-9 h-9 rounded-full overflow-hidden bg-cyan-500/20 flex items-center justify-center">
          <Icon name="person" className="text-cyan-500" fontSize={18} />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white truncate">{chatData.name}</h2>
          <p className="text-[10px] text-green-500 font-semibold">{t("chat.online")}</p>
        </div>
        <button className="w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:text-cyan-500 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
          <Icon name="call" fontSize={18} />
        </button>
        <button className="w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:text-cyan-500 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
          <Icon name="videocam" fontSize={18} />
        </button>
      </div>

      {/* Contact Info Card */}
      <div className="px-6 pt-6 pb-4 flex flex-col items-center text-center">
        <div className="relative mb-3">
          <div className="w-16 h-16 rounded-full overflow-hidden ring-4 ring-cyan-500/20 shadow-2xl">
            <div className="w-full h-full bg-cyan-500/20 flex items-center justify-center">
              <Icon name="person" className="text-cyan-500" fontSize={28} />
            </div>
          </div>
          <div className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-green-500 border-2 border-white dark:border-gray-900 shadow-sm" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
          {chatData.name}
          <Icon name="verified" className="text-cyan-500" fontSize={18} />
        </h3>
        <span className="text-[10px] uppercase font-bold tracking-widest text-cyan-600 dark:text-cyan-400 mt-1">
          {t("chat.e2eEncrypted")}
        </span>
        <div className="h-px w-20 bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-800 to-transparent mt-4" />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 pb-32 flex flex-col gap-4">
        {messages.map((msg) => (
          <div key={msg.id} className="flex items-start gap-3 max-w-[85%] group">
            <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 mt-1 ring-1 ring-gray-200 dark:ring-gray-800">
              {msg.isMe ? (
                <div className="w-full h-full bg-cyan-500/20 flex items-center justify-center ring-2 ring-cyan-500/50">
                  <Icon name="person" className="text-cyan-500" fontSize={14} />
                </div>
              ) : (
                <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <Icon name="person" className="text-gray-400" fontSize={14} />
                </div>
              )}
            </div>
            <div className="flex flex-col gap-1 min-w-0">
              <div className="flex items-center gap-2 px-1">
                <span className={`text-xs font-bold ${msg.isMe ? "text-cyan-500" : "text-gray-700 dark:text-gray-300"}`}>
                  {msg.isMe ? "Me" : chatData.name}
                </span>
                <span className="text-[10px] text-gray-400 font-medium">{msg.time}</span>
              </div>
              <div
                className={`px-4 py-3 rounded-[20px] rounded-tl-sm text-[15px] leading-relaxed shadow-sm transition-transform group-hover:-translate-y-0.5 ${
                  msg.isMe
                    ? "bg-cyan-500 text-white shadow-cyan-500/20"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 shadow-black/5"
                }`}
              >
                {msg.text}
              </div>
              {msg.isMe && (
                <div className="px-2 text-[10px] font-bold tracking-wider uppercase h-3">
                  <span className={msg.read ? "text-cyan-500/70" : "text-gray-300 dark:text-gray-600"}>
                    {msg.read ? "Read" : "Sent"}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Floating Input */}
      <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 pointer-events-none z-20">
        <div className="pointer-events-auto bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-gray-200 dark:border-gray-800 shadow-2xl shadow-black/10 rounded-3xl p-2 flex flex-col gap-2">
          <div className="flex items-end gap-2 px-2 pb-1">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t("chat.typeMessage")}
              rows={1}
              className="w-full bg-transparent border-none focus:ring-0 resize-none text-[15px] max-h-32 min-h-[44px] py-3 text-gray-800 dark:text-gray-200 placeholder-gray-400 leading-tight font-medium"
            />
            <button
              onClick={sendMessage}
              className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center transition-all shadow-md active:scale-95 mb-0.5 ${
                newMessage.trim()
                  ? "bg-cyan-500 text-white shadow-cyan-500/30"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-400"
              }`}
            >
              <Icon name="send" fontSize={20} />
            </button>
          </div>
          <div className="flex items-center gap-1.5 px-2 pb-1">
            <button className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-cyan-500 transition-colors">
              <Icon name="add_circle" fontSize={20} />
            </button>
            <button className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-cyan-500 transition-colors">
              <Icon name="image" fontSize={20} />
            </button>
            <div className="flex-1" />
            <button className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-cyan-500 transition-colors">
              <Icon name="call" fontSize={20} />
            </button>
            <button className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-cyan-500 transition-colors">
              <Icon name="videocam" fontSize={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
