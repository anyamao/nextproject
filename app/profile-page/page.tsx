// app/profile-page/page.tsx
"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  Loader2,
  Save,
  UserPlus,
  ChevronDown,
  MessageCircle,
  Trophy,
  Calendar,
  Users,
  Award,
  Clock,
  X,
  Send,
  Check,
  UserMinus,
} from "lucide-react";
import useContactStore from "@/store/states";
import { useRouter, useSearchParams } from "next/navigation";

type FriendshipStatus =
  | "none"
  | "pending_sent"
  | "pending_received"
  | "accepted"
  | "rejected"
  | "blocked";

type Achievement = {
  id: number;
  name: string;
  description: string;
  unlocked: boolean;
  icon: string;
};

type Profile = {
  id: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  status: string | null;
  about: string | null;
  updated_at: string | null;
  streak?: number;
  achievements?: Achievement[];
};

type FriendshipData = {
  friend_id: {
    id: string;
    username: string | null;
    first_name: string | null;
    last_name: string | null;
    status: string | null;
  } | null;
  user_id: {
    id: string;
    username: string | null;
    first_name: string | null;
    last_name: string | null;
    status: string | null;
  } | null;
};

type Friend = {
  id: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  status: string | null;
};

export default function UserProfilePage() {
  const { user, isAuthenticated } = useContactStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get("id") || user?.id;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageText, setMessageText] = useState("");

  // Friend system state
  const [friendshipStatus, setFriendshipStatus] =
    useState<FriendshipStatus>("none");
  const [isFriendLoading, setIsFriendLoading] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  // Mock achievements (replace with DB later)
  const mockAchievements: Achievement[] = [
    {
      id: 1,
      name: "First Blood",
      description: "Sent first message",
      unlocked: true,
      icon: "🎯",
    },
    {
      id: 2,
      name: "Social Butterfly",
      description: "Added 5 friends",
      unlocked: true,
      icon: "🦋",
    },
    {
      id: 3,
      name: "Chatterbox",
      description: "Sent 100 messages",
      unlocked: false,
      icon: "💬",
    },
    {
      id: 4,
      name: "Early Bird",
      description: "Logged in 7 days in a row",
      unlocked: true,
      icon: "🌅",
    },
    {
      id: 5,
      name: "Legendary",
      description: "Reached 30 day streak",
      unlocked: false,
      icon: "👑",
    },
    {
      id: 6,
      name: "Helper",
      description: "Helped 10 users",
      unlocked: false,
      icon: "🤝",
    },
  ];

  // ─────────────────────────────────────────────────────────────
  // FETCH PROFILE & FRIENDSHIP STATUS
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated || !user || !userId) return;

    const fetchData = async () => {
      setLoading(true);
      setIsOwnProfile(userId === user.id);

      try {
        // 1. Fetch profile
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single();

        if (profileError && profileError.code !== "PGRST116")
          throw profileError;

        setProfile({
          ...profileData,
          username: profileData?.username || `user_${userId.slice(0, 8)}`,
          streak: 15, // Replace with real streak logic later
          achievements: mockAchievements,
        });

        // 2. Fetch friendship status
        if (!isOwnProfile) {
          const { data: friendshipData } = await supabase
            .from("friendships")
            .select("status, user_id, friend_id")
            .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
            .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
            .maybeSingle();

          if (friendshipData) {
            const isRequester = friendshipData.user_id === user.id;
            if (friendshipData.status === "pending") {
              setFriendshipStatus(
                isRequester ? "pending_sent" : "pending_received",
              );
            } else {
              setFriendshipStatus(friendshipData.status as FriendshipStatus);
            }
          } else {
            setFriendshipStatus("none");
          }
        }

        // 3. Fetch friends list
        const { data: friendsData } = await supabase
          .from("friendships")
          .select(
            `
            friend_id:profiles!friendships_friend_id(*),
            user_id:profiles!friendships_user_id(*)
          `,
          )
          .eq("status", "accepted")
          .or(`user_id.eq.${userId},friend_id.eq.${userId}`);

        if (friendsData) {
          const mappedFriends: Friend[] = friendsData.reduce<Friend[]>(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (acc, f: any) => {
              const friendProfile =
                f.friend_id?.id === userId ? f.user_id : f.friend_id;

              if (friendProfile?.id) {
                acc.push({
                  id: friendProfile.id,
                  username: friendProfile.username,
                  first_name: friendProfile.first_name,
                  last_name: friendProfile.last_name,
                  status: friendProfile.status || "Offline",
                });
              }

              return acc;
            },
            [],
          );

          setFriends(mappedFriends);
        }
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId, user, isAuthenticated, isOwnProfile]);

  // ─────────────────────────────────────────────────────────────
  // FRIEND ACTIONS
  // ─────────────────────────────────────────────────────────────
  const handleAddFriend = async () => {
    if (!user || !userId) return;
    setIsFriendLoading(true);
    try {
      const { error } = await supabase
        .from("friendships")
        .insert({ user_id: user.id, friend_id: userId, status: "pending" });

      if (error) throw error;
      setFriendshipStatus("pending_sent");
    } catch (err) {
      console.error("Add friend error:", err);
      alert("Не удалось отправить запрос");
    } finally {
      setIsFriendLoading(false);
    }
  };

  const handleAcceptFriend = async () => {
    if (!user || !userId) return;
    setIsFriendLoading(true);
    try {
      const { error } = await supabase
        .from("friendships")
        .update({ status: "accepted" })
        .eq("user_id", userId)
        .eq("friend_id", user.id);

      if (error) throw error;
      setFriendshipStatus("accepted");
      // Refetch friends list
      router.refresh();
    } catch (err) {
      console.error("Accept friend error:", err);
    } finally {
      setIsFriendLoading(false);
    }
  };

  const handleRejectFriend = async () => {
    if (!user || !userId) return;
    setIsFriendLoading(true);
    try {
      const { error } = await supabase
        .from("friendships")
        .update({ status: "rejected" })
        .eq("user_id", userId)
        .eq("friend_id", user.id);

      if (error) throw error;
      setFriendshipStatus("rejected");
    } catch (err) {
      console.error("Reject friend error:", err);
    } finally {
      setIsFriendLoading(false);
    }
  };

  const handleRemoveFriend = async () => {
    if (!user || !userId) return;
    if (!confirm("Удалить из друзей?")) return;
    setIsFriendLoading(true);
    try {
      const { error } = await supabase
        .from("friendships")
        .delete()
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
        .or(`user_id.eq.${userId},friend_id.eq.${userId}`);

      if (error) throw error;
      setFriendshipStatus("none");
      router.refresh();
    } catch (err) {
      console.error("Remove friend error:", err);
    } finally {
      setIsFriendLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim()) return;
    console.log("Sending message to", profile?.username, ":", messageText);
    setShowMessageModal(false);
    setMessageText("");
    alert("Message sent! (Mock)");
  };

  const getStatusColor = (status: string | null) => {
    if (!status) return "bg-gray-400";
    const s = status.toLowerCase();
    if (s.includes("online")) return "bg-green-500";
    if (s.includes("gaming")) return "bg-purple-500";
    if (s.includes("working")) return "bg-blue-500";
    if (s.includes("away")) return "bg-yellow-500";
    return "bg-gray-400";
  };

  // ─────────────────────────────────────────────────────────────
  // RENDER STATES
  // ─────────────────────────────────────────────────────────────
  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin w-8 h-8 text-purple-500" />
        <p className="ml-4">Загрузка профиля...</p>
      </div>
    );
  if (!isAuthenticated || !user)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Войдите чтобы видеть профиль</p>
      </div>
    );
  if (!profile)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Пользователь не найден</p>
      </div>
    );

  return (
    <div className="flex-1 flex flex-col items-center px-[10px] sm:px-[20px] py-[30px] w-full min-h-full max-w-5xl mx-auto">
      {/* Profile Header */}
      <div className=" w-full h-[90px] relative"></div>

      <div className="relative px-6 pb-6 max-w-5xl w-full  mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-end gap-6 -mt-16">
          <img
            src="/aiclose.png"
            alt="Avatar"
            className="w-32 h-32 rounded-full border-4 border-white shadow-lg bg-white object-cover"
          />

          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-800">
                {profile.first_name || profile.username || "Пользователь"}
              </h1>
              <h1 className="text-3xl font-bold text-gray-800">
                {profile.last_name}
              </h1>

              <span className="text-gray-500 text-lg">
                @{profile.username || "username"}
              </span>
            </div>

            <div className="flex items-center gap-2 mb-3">
              <div
                className={`w-2 h-2 rounded-full ${getStatusColor(profile.status)}`}
              ></div>
              <span className="text-sm text-gray-600">
                {profile.status || "Offline"}
              </span>
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-500"></div>
          </div>

          {/* Action Buttons */}
          {!isOwnProfile && (
            <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
              <button
                onClick={() => setShowMessageModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all shadow-md hover:shadow-lg"
              >
                <MessageCircle className="w-4 h-4" /> Message
              </button>

              {friendshipStatus === "none" && (
                <button
                  onClick={handleAddFriend}
                  disabled={isFriendLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-all shadow-md hover:shadow-lg disabled:opacity-50"
                >
                  {isFriendLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <UserPlus className="w-4 h-4" />
                  )}
                  Add Friend
                </button>
              )}

              {friendshipStatus === "pending_sent" && (
                <button
                  disabled
                  className="flex items-center gap-2 px-4 py-2 bg-gray-400 text-white rounded-lg cursor-not-allowed"
                >
                  <Loader2 className="w-4 h-4" /> Request Sent
                </button>
              )}

              {friendshipStatus === "pending_received" && (
                <div className="flex gap-2">
                  <button
                    onClick={handleAcceptFriend}
                    disabled={isFriendLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-all shadow-md"
                  >
                    <Check className="w-4 h-4" /> Accept
                  </button>
                  <button
                    onClick={handleRejectFriend}
                    disabled={isFriendLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all shadow-md"
                  >
                    <X className="w-4 h-4" /> Decline
                  </button>
                </div>
              )}

              {friendshipStatus === "accepted" && (
                <button
                  onClick={handleRemoveFriend}
                  disabled={isFriendLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-all shadow-md"
                >
                  <UserMinus className="w-4 h-4" /> Friends
                </button>
              )}

              <button className="flex items-center gap-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-all">
                <ChevronDown className="w-4 h-4" /> More
              </button>
            </div>
          )}

          {isOwnProfile && (
            <button
              onClick={() => router.push("/account-settings")}
              className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg smaller-text transition-all"
            >
              Редактировать профиль
            </button>
          )}
        </div>
      </div>

      {/* Content Grid */}
      <div className="max-w-5xl w-full mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6 px-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <p className="ord-text font-semibold text-gray-800 mb-3">Обо мне</p>
            <p className="text-gray-700 ord-text leading-relaxed">
              {profile.about || "Этот пользователь пока ничего не написал."}
            </p>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <p className="ord-text font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-500" />
              Друзья ({friends.length})
            </p>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {friends.map((friend) => (
                <div
                  key={friend.id}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-all"
                  onClick={() => router.push(`/profile-page?id=${friend.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img
                        src="/aiclose.png"
                        alt={friend.username || "Friend"}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div
                        className={`absolute bottom-0 right-0 w-3 h-3 rounded-full ${getStatusColor(friend.status)} border-2 border-white`}
                      ></div>
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">
                        {friend.first_name || friend.username}
                      </p>
                      <p className="text-xs text-gray-500">{friend.status}</p>
                    </div>
                  </div>
                  <MessageCircle className="w-4 h-4 text-gray-400 hover:text-blue-500 transition-colors" />
                </div>
              ))}
              {friends.length === 0 && (
                <p className="text-gray-500 text-sm text-center py-4">
                  Пока нет друзей
                </p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <p className="ord-text font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Trophy className="w-[15px] h-[15px] text-yellow-500" />
              Достижения
            </p>
            <p className="text-gray-500 text-sm text-center py-4">
              Система достижений в разработке
            </p>
          </div>
        </div>
      </div>

      {/* Message Modal */}
      {showMessageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-800">
                Message {profile.first_name || profile.username}
              </h3>
              <button
                onClick={() => setShowMessageModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Write your message here..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={4}
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowMessageModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSendMessage}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" /> Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
