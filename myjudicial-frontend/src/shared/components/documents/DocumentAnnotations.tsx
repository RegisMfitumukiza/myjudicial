"use client";

import { useState } from "react";
import { 
  MessageSquare, X, Plus, Edit3, Trash2, 
  Clock, User, Check, AlertCircle 
} from "lucide-react";

interface Annotation {
  id: string;
  content: string;
  author: string;
  authorRole: "CLIENT" | "EXPERT" | "SYSTEM";
  createdAt: string;
  resolved: boolean;
  position?: {
    x: number;
    y: number;
    page?: number;
  };
}

interface DocumentAnnotationsProps {
  fileId: string;
  annotations: Annotation[];
  onAddAnnotation: (content: string, position?: { x: number; y: number }) => void;
  onUpdateAnnotation: (id: string, content: string) => void;
  onDeleteAnnotation: (id: string) => void;
  onResolveAnnotation: (id: string) => void;
  isReadOnly?: boolean;
}

export function DocumentAnnotations({
  fileId,
  annotations,
  onAddAnnotation,
  onUpdateAnnotation,
  onDeleteAnnotation,
  onResolveAnnotation,
  isReadOnly = false
}: DocumentAnnotationsProps) {
  const [newComment, setNewComment] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [showResolved, setShowResolved] = useState(false);

  const filteredAnnotations = annotations.filter(annotation => 
    showResolved || !annotation.resolved
  );

  const handleSubmitNew = () => {
    if (newComment.trim()) {
      onAddAnnotation(newComment.trim());
      setNewComment("");
    }
  };

  const handleSubmitEdit = (id: string) => {
    if (editContent.trim()) {
      onUpdateAnnotation(id, editContent.trim());
      setEditingId(null);
      setEditContent("");
    }
  };

  const startEditing = (annotation: Annotation) => {
    setEditingId(annotation.id);
    setEditContent(annotation.content);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditContent("");
  };

  const formatTimeAgo = (isoString: string): string => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "1d ago";
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "EXPERT": return "text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400";
      case "CLIENT": return "text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400";
      case "SYSTEM": return "text-gray-600 bg-gray-50 dark:bg-gray-900/20 dark:text-gray-400";
      default: return "text-gray-600 bg-gray-50 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "EXPERT": return "Lawyer";
      case "CLIENT": return "You";
      case "SYSTEM": return "System";
      default: return "User";
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 p-4 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              Comments & Notes
            </h3>
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
              {annotations.length}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <input
                type="checkbox"
                checked={showResolved}
                onChange={(e) => setShowResolved(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              Show resolved
            </label>
          </div>
        </div>
      </div>

      {/* Comments List */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {filteredAnnotations.length === 0 ? (
            <div className="py-8 text-center">
              <MessageSquare className="mx-auto mb-3 h-12 w-12 text-gray-300 dark:text-gray-600" />
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                No comments yet
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Add the first comment to start the conversation
              </p>
            </div>
          ) : (
            filteredAnnotations.map((annotation) => (
              <div
                key={annotation.id}
                className={`rounded-lg border p-4 transition-all ${
                  annotation.resolved 
                    ? "border-gray-200 bg-gray-50 opacity-75 dark:border-gray-700 dark:bg-gray-800/50" 
                    : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`rounded-full px-2 py-0.5 text-xs font-medium ${getRoleColor(annotation.authorRole)}`}>
                      {getRoleLabel(annotation.authorRole)}
                    </div>
                    {annotation.resolved && (
                      <div className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-600 dark:bg-green-900/30 dark:text-green-400">
                        <Check className="h-3 w-3" />
                        Resolved
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-400">
                      {formatTimeAgo(annotation.createdAt)}
                    </span>
                    
                    {!isReadOnly && annotation.authorRole === "CLIENT" && (
                      <div className="flex items-center gap-1">
                        {editingId !== annotation.id && (
                          <>
                            <button
                              onClick={() => startEditing(annotation)}
                              className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
                            >
                              <Edit3 className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => onDeleteAnnotation(annotation.id)}
                              className="rounded p-1 text-gray-400 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-3">
                  {editingId === annotation.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                        rows={3}
                        placeholder="Edit your comment..."
                      />
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleSubmitEdit(annotation.id)}
                          className="rounded-lg bg-blue-600 px-3 py-1 text-sm font-medium text-white hover:bg-blue-700"
                        >
                          Save
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="rounded-lg border border-gray-300 px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {annotation.content}
                      </p>
                      
                      {!annotation.resolved && !isReadOnly && (
                        <button
                          onClick={() => onResolveAnnotation(annotation.id)}
                          className="mt-2 inline-flex items-center gap-1 rounded-lg bg-green-100 px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50"
                        >
                          <Check className="h-3 w-3" />
                          Mark as resolved
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* New Comment */}
      {!isReadOnly && (
        <div className="border-t border-gray-200 p-4 dark:border-gray-700">
          <div className="space-y-3">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              rows={3}
              placeholder="Add a comment or note..."
            />
            
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Comments are shared with your assigned lawyer
              </p>
              
              <button
                onClick={handleSubmitNew}
                disabled={!newComment.trim()}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="h-4 w-4" />
                Add Comment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}