import React from "react";
import { Plus, Trash, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { type ChatRoom } from "@/types/chat";
import { useSound, Sounds } from "@/hooks/useSound";
import { getPrivateRoomDisplayName } from "@/utils/chat";
import { useChatsStore } from "@/stores/useChatsStore";
import { useThemeStore } from "@/stores/useThemeStore";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// 头像组件 - macOS 26 风格，直接显示 emoji（无圆框）
const CircularAvatar: React.FC<{ name: string; className?: string }> = ({
  name,
  className,
}) => {
  // 检查是否是 Zi
  const normalizedName = name.toLowerCase().trim();
  const isZi = normalizedName === "zi" || normalizedName === "zihan" || normalizedName === "@zi";
  
  // 如果是 Zi，使用 🗿 emoji
  if (isZi) {
    return (
      <div
        className={cn(
          "flex items-center justify-center flex-shrink-0 chat-avatar-emoji",
          className
        )}
        style={{
          fontSize: "32px",
          lineHeight: "1",
        }}
      >
        🗿
      </div>
    );
  }
  
  // Food & Drink emoji 列表
  const foodEmojis = [
    "🍎", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🍒",
    "🍑", "🥭", "🍍", "🥥", "🥝", "🍅", "🥑", "🌽",
    "🥕", "🥔", "🍠", "🥐", "🥯", "🍞", "🥖", "🧀",
    "🥚", "🍳", "🥞", "🧇", "🥓", "🍗", "🌭", "🍔",
    "🍟", "🍕", "🥪", "🌮", "🌯", "🥗", "🍝", "🍜",
    "🍲", "🍛", "🍣", "🍱", "🍤", "🍙", "🍚", "🥟",
    "🍢", "🍡", "🍧", "🍨", "🍦", "🥧", "🧁", "🍰",
    "🎂", "🍮", "🍭", "🍬", "🍫", "🍿", "🍩", "🍪",
    "🥜", "🍯", "🥛", "☕", "🍵", "🧃", "🥤", "🍷",
  ];
  
  // 根据名字生成 emoji 索引
  const hash = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const emoji = foodEmojis[hash % foodEmojis.length];

  return (
    <div
      className={cn(
        "flex items-center justify-center flex-shrink-0 chat-avatar-emoji",
        className
      )}
      style={{
        fontSize: "32px",
        lineHeight: "1",
      }}
    >
      {emoji}
    </div>
  );
};

// Extracted ChatRoomSidebar component
interface ChatRoomSidebarProps {
  rooms: ChatRoom[];
  currentRoom: ChatRoom | null;
  onRoomSelect: (room: ChatRoom | null) => void;
  onAddRoom: () => void;
  onDeleteRoom?: (room: ChatRoom) => void;
  isVisible: boolean;
  isAdmin: boolean;
  /** When rendered inside mobile/overlay mode, occupies full width and hides right border */
  isOverlay?: boolean;
  username?: string | null;
}

export const ChatRoomSidebar: React.FC<ChatRoomSidebarProps> = ({
  rooms,
  currentRoom,
  onRoomSelect,
  onAddRoom,
  onDeleteRoom,
  isVisible,
  isAdmin,
  isOverlay = false,
  username,
}) => {
  const { play: playButtonClick } = useSound(Sounds.BUTTON_CLICK);
  const unreadCounts = useChatsStore((state) => state.unreadCounts);

  // Theme detection for border styling
  const currentTheme = useThemeStore((state) => state.current);
  const isXpTheme = currentTheme === "xp" || currentTheme === "win98";
  const isWindowsLegacyTheme = isXpTheme;
  const isOS1Theme = currentTheme === "os1";

  // Section headings are non-interactive; show all lists by default

  // Read collapse state from store BEFORE any early returns to preserve hook order
  const isChannelsOpen = useChatsStore((s) => s.isChannelsOpen);
  const isPrivateOpen = useChatsStore((s) => s.isPrivateOpen);
  const toggleChannelsOpen = useChatsStore((s) => s.toggleChannelsOpen);
  const togglePrivateOpen = useChatsStore((s) => s.togglePrivateOpen);

  if (!isVisible) {
    return null;
  }

  const renderRoomItem = (room: ChatRoom) => {
    const unreadCount = unreadCounts[room.id] || 0;
    const hasUnread = unreadCount > 0;
    const isSelected = currentRoom?.id === room.id;
    
    // 获取显示名称
    const displayName = room.type === "private"
      ? getPrivateRoomDisplayName(room, username ?? null)
      : room.name;

    return (
      <div
        key={room.id}
        className={cn(
          "group relative py-2 px-3 cursor-pointer transition-all",
          isOS1Theme && "rounded-lg mx-2 my-0.5",
          isOS1Theme && isSelected && "chat-room-selected",
          isSelected 
            ? isOS1Theme 
              ? "bg-[#0091FF] text-white"
              : ""
            : isOS1Theme
            ? "hover:bg-black/5"
            : "hover:bg-black/5"
        )}
        style={
          isSelected && !isOS1Theme
            ? {
                background: "var(--os-color-selection-bg)",
                color: "var(--os-color-selection-text)",
              }
            : undefined
        }
        onClick={() => {
          playButtonClick();
          onRoomSelect(room);
        }}
      >
        <div className="flex items-center gap-2">
          {/* 圆形头像 - 仅在 OS1 主题下显示 */}
          {isOS1Theme && (
            <CircularAvatar 
              name={displayName} 
              className="w-7 h-7"
            />
          )}
          
          <div className="flex-1 min-w-0 flex items-center gap-2">
            <span className={cn(
              "truncate font-medium",
              isOS1Theme && "text-sm",
              isOS1Theme && isSelected && "text-white"
            )}>
              {room.type === "private" ? displayName : `#${displayName}`}
            </span>
            {(hasUnread || room.type !== "private") && (
              <span
                className={cn(
                  "text-[10px] transition-opacity flex-shrink-0",
                  isOS1Theme && isSelected
                    ? "text-white/60"
                    : hasUnread
                    ? "text-orange-600"
                    : isSelected
                    ? "text-white/40"
                    : "text-black/40",
                  hasUnread || room.userCount > 0
                    ? "opacity-100"
                    : isSelected
                    ? "opacity-100"
                    : "opacity-0 group-hover:opacity-100"
                )}
              >
                {hasUnread
                  ? `${unreadCount >= 20 ? "20+" : unreadCount} new`
                  : `${room.userCount} online`}
              </span>
            )}
          </div>
        </div>
        {((isAdmin && room.type !== "private") || room.type === "private") &&
          onDeleteRoom && (
            <button
              className={cn(
                "absolute right-2 top-1/2 transform -translate-y-1/2 transition-opacity p-1 rounded",
                isOS1Theme 
                  ? isSelected
                    ? "text-white/60 hover:text-white hover:bg-white/20"
                    : "text-gray-500 hover:text-red-500 hover:bg-black/5"
                  : "text-gray-500 hover:text-red-500 hover:bg-black/5",
                isSelected
                  ? "opacity-100"
                  : "opacity-0 group-hover:opacity-100"
              )}
              onClick={(e) => {
                e.stopPropagation();
                playButtonClick();
                onDeleteRoom(room);
              }}
              aria-label={
                room.type === "private" ? "Leave conversation" : "Delete room"
              }
              title={
                room.type === "private" ? "Leave conversation" : "Delete room"
              }
            >
              <Trash className="w-3 h-3" />
            </button>
          )}
      </div>
    );
  };

  return (
    <div
      className={cn(
        "flex flex-col font-geneva-12 text-[12px] chat-room-sidebar",
        isOS1Theme 
          ? "bg-white/85 backdrop-blur-lg" 
          : "bg-neutral-100",
        isOverlay
          ? `w-full border-b ${
              isWindowsLegacyTheme
                ? "border-[#919b9c]"
                : currentTheme === "macosx"
                ? "border-black/10"
                : isOS1Theme
                ? "border-black/8"
                : "border-black"
            }`
          : `w-56 border-r h-full overflow-hidden ${
              isWindowsLegacyTheme
                ? "border-[#919b9c]"
                : currentTheme === "macosx"
                ? "border-black/10"
                : isOS1Theme
                ? "border-black/8"
                : "border-black"
            }`,
        isOS1Theme && !isOverlay && "rounded-tl-xl"
      )}
      style={isOS1Theme ? {
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
      } : undefined}
    >
      <div
        className={cn(
          "pt-3 flex flex-col",
          isOverlay ? "pb-3" : "flex-1 overflow-hidden"
        )}
      >
        <div className="flex justify-between items-center mb-2 flex-shrink-0 px-3">
          <div className="flex items-baseline gap-1.5">
            <h2 className="text-[14px] pl-1">Chats</h2>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onAddRoom}
                  className="flex items-center text-xs hover:bg-black/5 w-[24px] h-[24px]"
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>New Chat</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div
          className={cn(
            "space-y-1 overscroll-contain w-full",
            isOverlay
              ? "flex-1 overflow-y-auto min-h-0"
              : "flex-1 overflow-y-auto min-h-0"
          )}
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {/* Zi (@zi) Chat Selection */}
          <div
            className={cn(
              "py-2 px-3 cursor-pointer transition-all",
              isOS1Theme && "rounded-lg mx-2 my-0.5",
              isOS1Theme && currentRoom === null && "chat-room-selected",
              currentRoom === null 
                ? isOS1Theme 
                  ? "bg-[#0091FF] text-white"
                  : ""
                : isOS1Theme
                ? "hover:bg-black/5"
                : "hover:bg-black/5"
            )}
            style={
              currentRoom === null && !isOS1Theme
                ? {
                    background: "var(--os-color-selection-bg)",
                    color: "var(--os-color-selection-text)",
                  }
                : undefined
            }
            onClick={() => {
              playButtonClick();
              onRoomSelect(null);
            }}
          >
            <div className="flex items-center gap-2">
              {/* 圆形头像 - 仅在 OS1 主题下显示 */}
              {isOS1Theme && (
                <CircularAvatar 
                  name="zi" 
                  className="w-7 h-7"
                />
              )}
              <span className={cn(
                "font-medium",
                isOS1Theme && "text-sm",
                isOS1Theme && currentRoom === null && "text-white"
              )}>
                @zi
              </span>
            </div>
          </div>
          {/* Chat Rooms List (Sections) */}
          {Array.isArray(rooms) && (
            <>
              {(() => {
                const publicRooms = rooms.filter(
                  (room) => room.type !== "private"
                );
                const privateRooms = rooms.filter(
                  (room) => room.type === "private"
                );
                const hasBoth =
                  publicRooms.length > 0 && privateRooms.length > 0;
                const hasPrivate = privateRooms.length > 0;
                const channelsOpen = hasPrivate ? isChannelsOpen : true;

                return (
                  <>
                    {hasBoth ? (
                      <>
                        {publicRooms.length > 0 && (
                          <div
                            className={cn(
                              "mt-2 px-4 pt-2 pb-1 w-full flex items-center group",
                              "!text-[11px] uppercase tracking-wide text-black/50"
                            )}
                            onClick={() => {
                              if (hasPrivate) {
                                playButtonClick();
                                toggleChannelsOpen();
                              }
                            }}
                            role="button"
                            aria-expanded={isChannelsOpen}
                          >
                            <span>Channels</span>
                            {hasPrivate && (
                              <span className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <ChevronRight
                                  className={cn(
                                    "w-3 h-3 text-black/50 transition-transform",
                                    isChannelsOpen ? "rotate-90" : "rotate-0"
                                  )}
                                />
                              </span>
                            )}
                          </div>
                        )}
                        {channelsOpen && publicRooms.map(renderRoomItem)}

                        {privateRooms.length > 0 && (
                          <div
                            className={cn(
                              "mt-2 px-4 pt-2 pb-1 w-full flex items-center group",
                              "!text-[11px] uppercase tracking-wide text-black/50"
                            )}
                            onClick={() => {
                              playButtonClick();
                              togglePrivateOpen();
                            }}
                            role="button"
                            aria-expanded={isPrivateOpen}
                          >
                            <span>Private</span>
                            <span className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <ChevronRight
                                className={cn(
                                  "w-3 h-3 text-black/50 transition-transform",
                                  isPrivateOpen ? "rotate-90" : "rotate-0"
                                )}
                              />
                            </span>
                          </div>
                        )}
                        {isPrivateOpen && privateRooms.map(renderRoomItem)}
                      </>
                    ) : (
                      <>
                        {publicRooms.length > 0
                          ? publicRooms.map(renderRoomItem)
                          : privateRooms.map(renderRoomItem)}
                      </>
                    )}
                  </>
                );
              })()}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
