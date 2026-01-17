import { useCallback, useRef } from 'react';

type TargetType = 'post' | 'comment';

interface PendingReaction {
  itemId: string;
  emoji: string;
  targetType: TargetType;
  commentId?: string;
}

export const useOptimisticReactions = () => {
  const pendingRef = useRef<Map<string, PendingReaction>>(new Map());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const optimisticAdd = useCallback((
    itemId: string,
    emoji: string,
    reactions: Record<string, number>,
    userReactions: string[]
  ) => {
    const newReactions = { ...reactions };
    const newUserReactions = [...userReactions];
    const existingIndex = newUserReactions.indexOf(emoji);

    if (existingIndex !== -1) {
      const nextCount = (newReactions[emoji] || 1) - 1;
      if (nextCount <= 0) {
        delete newReactions[emoji];
      } else {
        newReactions[emoji] = nextCount;
      }
      newUserReactions.splice(existingIndex, 1);
    } else {
      newReactions[emoji] = (newReactions[emoji] || 0) + 1;
      newUserReactions.push(emoji);
    }

    return { newReactions, newUserReactions };
  }, []);

  const queueReaction = useCallback((
    itemId: string,
    emoji: string,
    targetType: TargetType,
    onReact: (id: string, emoji: string, type: TargetType, commentId?: string) => void,
    commentId?: string
  ) => {
    const key = `${itemId}-${emoji}-${targetType}-${commentId ?? ''}`;
    pendingRef.current.set(key, { itemId, emoji, targetType, commentId });

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      const pending = Array.from(pendingRef.current.values());
      pendingRef.current.clear();

      pending.forEach(({ itemId: id, emoji: e, targetType: type, commentId: cid }) => {
        onReact(id, e, type, cid);
      });
    }, 300);
  }, []);

  return { optimisticAdd, queueReaction };
};

