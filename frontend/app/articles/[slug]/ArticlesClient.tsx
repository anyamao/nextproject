"use client";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Copy,
  Check,
  Loader2,
  Send,
  Bookmark,
  BookmarkCheck,
  Eye,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import FavoriteButton from "@/ui/FavoriteButton";

type Article = {
  id: string;
  title: string;
  content: string;
  description: string;
  estimated_minutes: number;
  clear_count: number;
  slug: string;
  image: string;
  unclear_count: number;
  view_count: number;
};

type Comment = {
  id: string;
  content: string;
  created_at: string;
  updated_at?: string;
  parent_id?: string | null;
  likes_count: number;
  dislikes_count: number;
  user_email: string;
  replies?: Comment[];
  user_liked?: "like" | "dislike" | null;
};

interface ArticlesClientProps {
  initialArticle: Article;
  initialSlug: string;
  params: { slug: string };
}

type CommentItemProps = {
  comment: Comment;
  depth?: number;
  isAuthenticated: boolean;
  editingCommentId: string | null;
  editContent: string;
  replyingTo: string | null;
  replyContent: string;
  onEdit: (id: string, content: string) => void;
  onDelete: (id: string) => void;
  onReply: (id: string, content: string) => void;
  onLike: (id: string, type: "like" | "dislike") => void;
  setEditingCommentId: (id: string | null) => void;
  setEditContent: (content: string) => void;
  setReplyingTo: (id: string | null) => void;
  setReplyContent: (content: string) => void;
};

const CommentItem = ({
  comment,
  depth = 0,
  isAuthenticated,
  editingCommentId,
  editContent,
  replyingTo,
  replyContent,
  onEdit,
  onDelete,
  onReply,
  onLike,
  setEditingCommentId,
  setEditContent,
  setReplyingTo,
  setReplyContent,
}: CommentItemProps) => {
  const isReplying = replyingTo === comment.id;
  const isEditing = editingCommentId === comment.id;

  // Only apply margin for first 2 levels, then stop increasing
  const marginLeft = depth === 0 ? 0 : depth === 1 ? 12 : 20;

  return (
    <div style={{ marginLeft: `${marginLeft}px` }} className="">
      <div className="flex gap-3 p-4 overflow-x-auto">
        <div className="flex-shrink-0 group">
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold flex-shrink-0">
            {comment.user_email?.[0]?.toUpperCase() || "U"}
          </div>
        </div>
        <div className="">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-medium text-sm break-word">
              {comment.user_email}
            </span>
            <span className="text-xs text-gray-400 flex-shrink-0">
              {new Date(comment.created_at).toLocaleDateString("ru-RU")}
            </span>
            {comment.updated_at &&
              comment.updated_at !== comment.created_at && (
                <span className="text-xs text-gray-400 flex-shrink-0">
                  (изменено)
                </span>
              )}
          </div>

          {isEditing ? (
            <div className="mt-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full p-2 border rounded-lg"
                rows={3}
                autoFocus
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => onEdit(comment.id, editContent)}
                  className="px-3 py-1 bg-green-500 text-white rounded text-sm"
                >
                  Сохранить
                </button>
                <button
                  onClick={() => {
                    setEditingCommentId(null);
                    setEditContent("");
                  }}
                  className="px-3 py-1 bg-gray-400 text-white rounded text-sm"
                >
                  Отмена
                </button>
              </div>
            </div>
          ) : (
            <p className="text-gray-700 break-words whitespace-pre-wrap">
              {comment.content}
            </p>
          )}

          <div className="flex items-center gap-4 mt-3">
            {isAuthenticated && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onLike(comment.id, "like")}
                  className={`flex items-center gap-1 text-sm ${
                    comment.user_liked === "like"
                      ? "text-blue-600"
                      : "text-gray-500 hover:text-blue-600"
                  }`}
                >
                  <span>{comment.likes_count}</span>
                </button>
                <button
                  onClick={() => onLike(comment.id, "dislike")}
                  className={`flex items-center gap-1 text-sm ${
                    comment.user_liked === "dislike"
                      ? "text-red-600"
                      : "text-gray-500 hover:text-red-600"
                  }`}
                >
                  <span>{comment.dislikes_count}</span>
                </button>
              </div>
            )}

            {isAuthenticated && !isReplying && (
              <button
                onClick={() => {
                  setReplyingTo(comment.id);
                  setReplyContent(`@${comment.user_email} `);
                }}
                className="smaller-text text-gray-500 hover:text-purple-600"
              >
                Ответить
              </button>
            )}
          </div>

          {isAuthenticated && isReplying && (
            <div className="mt-3">
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Написать ответ..."
                className="w-full p-2 border rounded-lg"
                rows={2}
                autoFocus
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => onReply(comment.id, replyContent)}
                  className="px-3 py-1 bg-purple-500 text-white rounded text-sm"
                >
                  Отправить
                </button>
                <button
                  onClick={() => {
                    setReplyingTo(null);
                    setReplyContent("");
                  }}
                  className="px-3 py-1 bg-gray-400 text-white rounded text-sm"
                >
                  Отмена
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-2 space-y-2">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              depth={depth + 1}
              isAuthenticated={isAuthenticated}
              editingCommentId={editingCommentId}
              editContent={editContent}
              replyingTo={replyingTo}
              replyContent={replyContent}
              onEdit={onEdit}
              onDelete={onDelete}
              onReply={onReply}
              onLike={onLike}
              setEditingCommentId={setEditingCommentId}
              setEditContent={setEditContent}
              setReplyingTo={setReplyingTo}
              setReplyContent={setReplyContent}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default function ArticlesClient({
  initialArticle,
  initialSlug,
  params,
}: ArticlesClientProps) {
  const supabase = createClient();
  const [article, setArticle] = useState(initialArticle);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [copySuccess, setCopySuccess] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [sendingComment, setSendingComment] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");

  const countAllComments = (commentsList: Comment[]): number => {
    return commentsList.reduce((total, comment) => {
      return (
        total + 1 + (comment.replies ? countAllComments(comment.replies) : 0)
      );
    }, 0);
  };

  // Record view count
  useEffect(() => {
    if (!article?.id) return;
    const recordView = async () => {
      try {
        const sessionKey = `viewed_${article.id}`;
        if (sessionStorage.getItem(sessionKey)) {
          return; // Already viewed in this session
        }

        await supabase.from("article_views").insert({
          article_id: article.id,
        });

        sessionStorage.setItem(sessionKey, "true");

        // Update the view count in UI
        const { count: newCount } = await supabase
          .from("article_views")
          .select("*", { count: "exact", head: true })
          .eq("article_id", article.id);

        setArticle((prev) => ({
          ...prev,
          view_count: newCount || 0,
        }));
      } catch (err) {
        console.error("Failed to record view:", err);
      }
    };

    recordView();
  }, [article?.id]);

  // Load comments
  useEffect(() => {
    const loadComments = async () => {
      try {
        const { data, error } = await supabase
          .from("comments")
          .select("*")
          .eq("lesson_id", article.id)
          .is("parent_id", null)
          .order("created_at", { ascending: false });

        if (error) throw error;

        // Load replies for each comment
        const commentsWithReplies = await Promise.all(
          (data || []).map(async (comment) => {
            const { data: replies } = await supabase
              .from("comments")
              .select("*")
              .eq("parent_id", comment.id)
              .order("created_at", { ascending: true });

            return {
              ...comment,
              replies: replies || [],
              user_liked: null,
            };
          })
        );

        setComments(commentsWithReplies);
      } catch (err) {
        console.error("Failed to load comments:", err);
      } finally {
        setLoadingComments(false);
      }
    };

    loadComments();
  }, [article.id]);

  // HANDLERS
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const addComment = async (content: string, parentId?: string) => {
    try {
      const { data: comment, error } = await supabase
        .from("comments")
        .insert({
          lesson_id: article.id,
          content: content.trim(),
          parent_id: parentId || null,
          user_email: "Anonymous",
        })
        .select()
        .single();

      if (!error && comment) {
        const newCommentObj: Comment = {
          ...comment,
          replies: [],
          user_liked: null,
        };

        if (parentId) {
          const addReplyToComment = (
            commentsList: Comment[],
            parentId: string,
            replyObj: Comment,
          ): Comment[] => {
            return commentsList.map((c) => {
              if (c.id === parentId) {
                return {
                  ...c,
                  replies: [...(c.replies || []), replyObj],
                };
              }
              if (c.replies) {
                return {
                  ...c,
                  replies: addReplyToComment(c.replies, parentId, replyObj),
                };
              }
              return c;
            });
          };
          setComments((prev) =>
            addReplyToComment(prev, parentId, newCommentObj),
          );
        } else {
          setComments((prev) => [newCommentObj, ...prev]);
        }
        setNewComment("");
      }
    } catch (err) {
      console.error("❌ Comment error:", err);
    }
  };

  const handleSendComment = async () => {
    if (!newComment.trim()) return;
    setSendingComment(true);
    await addComment(newComment);
    setSendingComment(false);
  };

  const handleEditComment = async (commentId: string, newContent: string) => {
    if (!newContent.trim()) return;
    try {
      const { error } = await supabase
        .from("comments")
        .update({
          content: newContent.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", commentId);

      if (error) throw error;

      const updateCommentInTree = (
        commentsList: Comment[],
        id: string,
        newContent: string,
      ): Comment[] => {
        return commentsList.map((c) => {
          if (c.id === id) {
            return { ...c, content: newContent };
          }
          if (c.replies) {
            return {
              ...c,
              replies: updateCommentInTree(c.replies, id, newContent),
            };
          }
          return c;
        });
      };

      setComments((prev) =>
        updateCommentInTree(prev, commentId, newContent.trim()),
      );
      setEditingCommentId(null);
      setEditContent("");
    } catch (err) {
      console.error("❌ Edit error:", err);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("Удалить этот комментарий и все ответы?")) return;
    try {
      const { error } = await supabase
        .from("comments")
        .update({ is_deleted: true })
        .eq("id", commentId);

      if (error) throw error;

      const removeCommentAndReplies = (
        commentsList: Comment[],
        id: string,
      ): Comment[] => {
        return commentsList
          .filter((c) => c.id !== id)
          .map((c) => ({
            ...c,
            replies: c.replies
              ? removeCommentAndReplies(c.replies, id)
              : undefined,
          }));
      };

      setComments((prev) => removeCommentAndReplies(prev, commentId));
    } catch (err) {
      console.error("❌ Delete error:", err);
    }
  };

  const handleAddReply = async (parentCommentId: string, content: string) => {
    if (!content.trim()) return;
    await addComment(content, parentCommentId);
    setReplyingTo(null);
    setReplyContent("");
  };

  const handleLikeComment = async (
    commentId: string,
    type: "like" | "dislike",
  ) => {
    try {
      let currentComment: Comment | null = null;

      const findComment = (
        commentsList: Comment[],
        id: string,
      ): Comment | null => {
        for (const c of commentsList) {
          if (c.id === id) return c;
          if (c.replies) {
            const found = findComment(c.replies, id);
            if (found) return found;
          }
        }
        return null;
      };

      currentComment = findComment(comments, commentId);
      const existingLike = currentComment?.user_liked;

      if (existingLike === type) {
        const { error } = await supabase
          .from("comment_likes")
          .delete()
          .eq("comment_id", commentId);

        if (error) throw error;

        const updateCommentLikes = (
          commentsList: Comment[],
          id: string,
          type: "like" | "dislike",
        ): Comment[] => {
          return commentsList.map((c) => {
            if (c.id === id) {
              return {
                ...c,
                likes_count:
                  type === "like"
                    ? Math.max(0, c.likes_count - 1)
                    : c.likes_count,
                dislikes_count:
                  type === "dislike"
                    ? Math.max(0, c.dislikes_count - 1)
                    : c.dislikes_count,
                user_liked: null,
              };
            }
            if (c.replies) {
              return {
                ...c,
                replies: updateCommentLikes(c.replies, id, type),
              };
            }
            return c;
          });
        };

        setComments((prev) => updateCommentLikes(prev, commentId, type));
      } else {
        const { error } = await supabase.from("comment_likes").upsert(
          {
            comment_id: commentId,
            like_type: type,
          },
          {
            onConflict: "comment_id",
          },
        );

        if (error) throw error;

        const updateCommentLikes = (
          commentsList: Comment[],
          id: string,
          type: "like" | "dislike",
          existingLike: string | null | undefined,
        ): Comment[] => {
          return commentsList.map((c) => {
            if (c.id === id) {
              let newLikes = c.likes_count;
              let newDislikes = c.dislikes_count;

              if (existingLike === "like") {
                newLikes = Math.max(0, c.likes_count - 1);
              }
              if (existingLike === "dislike") {
                newDislikes = Math.max(0, c.dislikes_count - 1);
              }

              if (type === "like") {
                newLikes += 1;
              } else {
                newDislikes += 1;
              }

              return {
                ...c,
                likes_count: newLikes,
                dislikes_count: newDislikes,
                user_liked: type,
              };
            }
            if (c.replies) {
              return {
                ...c,
                replies: updateCommentLikes(c.replies, id, type, existingLike),
              };
            }
            return c;
          });
        };

        setComments((prev) =>
          updateCommentLikes(prev, commentId, type, existingLike),
        );
      }
    } catch (err) {
      console.error("❌ Like error:", err);
    }
  };

  const getImageUrl = (imagePath: string) => {
    if (!imagePath) return null;
    const cleanPath = imagePath.replace(/^['"]|['"]$/g, "");
    if (cleanPath.startsWith("http")) return cleanPath;
    return cleanPath.startsWith("/") ? cleanPath : `/${cleanPath}`;
  };

  return (
    <main className="flex-1 flex flex-col items-center px-[10px] sm:px-[20px] py-[30px] w-full max-w-5xl mx-auto">
      <Link
        href="/articles"
        className="text-gray-600 hover:text-purple-600 transition flex items-center justify-between w-full mb-[25px]"
      >
        <ArrowLeft className="w-[20px] h-[20px]" />
        <div className="bg-purple-100 px-4 py-2 rounded-full text-sm font-medium text-purple-700 capitalize">
          Назад к статьям
        </div>
        <div className="w-6" />
      </Link>

      {/* Stats Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 w-full mb-8">
        <div className="bg-white flex p-[15px] items-center shadow-xs rounded-lg">
          <div className="font-semibold smaller-text">Поделитесь статьей</div>
          <button
            onClick={handleCopyLink}
            className="rounded-full ml-[15px] cursor-pointer items-center justify-center p-[7px] border-[1px] border-gray-400 hover:bg-gray-50 transition relative"
          >
            {copySuccess ? (
              <Check className="w-[15px] h-[15px] text-green-600" />
            ) : (
              <Copy className="w-[15px] h-[15px] text-gray-700" />
            )}
            {copySuccess && (
              <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                Скопировано!
              </span>
            )}
          </button>
        </div>
        <div className="flex flex-row items-center">
          <div className="flex flex-row items-center mr-[15px]">
            <p className="text-[10px] mr-[5px]">{article.view_count || 0}</p>
            <Eye className="w-[15px] h-[15px] text-gray-600"></Eye>
          </div>

          <div className="bg-white flex p-[15px] items-center shadow-xs rounded-lg">
            <div className="font-semibold smaller-text">
              Время чтения: {article.estimated_minutes} минут
            </div>
          </div>

          <FavoriteButton articleId={article.id} className="ml-[10px]" />
        </div>
      </div>

      <div className="relative w-full h-64 md:h-96 rounded-xl overflow-hidden mb-8 shadow-md">
        <div className="bg-purple-500 top-0 mt-[20px] ml-[20px] left-0 px-4 py-2 rounded-full text-sm font-medium text-white absolute z-60">
          {article.description}
        </div>

        {getImageUrl(article.image) ? (
          <img
            src={getImageUrl(article.image)!}
            alt={article.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = "none";
              const placeholder = e.currentTarget
                .nextElementSibling as HTMLElement;
              if (placeholder) placeholder.style.display = "flex";
            }}
          />
        ) : null}

        <div
          className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-purple-200"
          style={{ display: getImageUrl(article.image) ? "none" : "flex" }}
        >
          <span className="text-6xl">📖</span>
        </div>
      </div>

      <div className="px-4 py-2 rounded-full bigger-text font-semibold text-black">
        {article.title}
      </div>

      <article
        className="flex flex-col items-center prose prose-purple max-w-none mb-10"
        dangerouslySetInnerHTML={{ __html: article.content }}
      />

      <div className="flex flex-col w-full mt-[40px]">
        <p className="font-semibold border-b-[1px] border-b-gray-300 pb-[10px] mb-[20px]">
          Комментарии ({countAllComments(comments)})
        </p>
        <div className="flex flex-row items-center mb-6 mt-[10px]">
          <img
            src="/aiclose.png"
            className="w-[40px] h-[40px] rounded-full bg-gray-200"
            alt="Avatar"
          />
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Оставить комментарий"
            className="ml-[10px] flex-1 border-b border-gray-300 pb-2 outline-none focus:border-purple-500 transition"
            onKeyDown={(e) => e.key === "Enter" && handleSendComment()}
          />
          <button
            onClick={handleSendComment}
            disabled={!newComment.trim() || sendingComment}
            className="ml-2 p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition"
          >
            {sendingComment ? (
              <Loader2 className="animate-spin w-4 h-4" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
        <div className="space-y-4">
          {loadingComments ? (
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin w-6 h-6 text-gray-400" />
            </div>
          ) : comments.length > 0 ? (
            comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                isAuthenticated={true}
                editingCommentId={editingCommentId}
                editContent={editContent}
                replyingTo={replyingTo}
                replyContent={replyContent}
                onEdit={handleEditComment}
                onDelete={handleDeleteComment}
                onReply={handleAddReply}
                onLike={handleLikeComment}
                setEditingCommentId={setEditingCommentId}
                setEditContent={setEditContent}
                setReplyingTo={setReplyingTo}
                setReplyContent={setReplyContent}
              />
            ))
          ) : (
            <p className="text-gray-500 text-center py-4">
              Пока нет комментариев. Будьте первым!
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
