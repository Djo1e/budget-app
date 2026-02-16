"use client";

import { useRef, useState, useCallback, type ReactNode } from "react";
import { Pencil, Trash2 } from "lucide-react";

interface SwipeableRowProps {
  children: ReactNode;
  onEdit: () => void;
  onDelete: () => void;
}

export function SwipeableRow({ children, onEdit, onDelete }: SwipeableRowProps) {
  const [offsetX, setOffsetX] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const isSwiping = useRef(false);

  const THRESHOLD = 80;
  const OPEN_WIDTH = 128;

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    isSwiping.current = false;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const dx = e.touches[0].clientX - startX.current;
    const dy = e.touches[0].clientY - startY.current;

    if (!isSwiping.current && Math.abs(dy) > Math.abs(dx)) return;
    isSwiping.current = true;

    if (isOpen) {
      const newOffset = Math.min(0, Math.max(-OPEN_WIDTH, -OPEN_WIDTH + dx));
      setOffsetX(newOffset);
    } else {
      const newOffset = Math.min(0, Math.max(-OPEN_WIDTH, dx));
      setOffsetX(newOffset);
    }
  }, [isOpen]);

  const handleTouchEnd = useCallback(() => {
    if (Math.abs(offsetX) > THRESHOLD) {
      setOffsetX(-OPEN_WIDTH);
      setIsOpen(true);
    } else {
      setOffsetX(0);
      setIsOpen(false);
    }
  }, [offsetX]);

  const close = useCallback(() => {
    setOffsetX(0);
    setIsOpen(false);
  }, []);

  const handleEdit = useCallback(() => {
    close();
    onEdit();
  }, [close, onEdit]);

  const handleDelete = useCallback(() => {
    close();
    onDelete();
  }, [close, onDelete]);

  return (
    <div className="md:hidden relative overflow-hidden">
      <div className="absolute inset-y-0 right-0 flex">
        <button
          className="w-16 flex items-center justify-center bg-accent text-foreground"
          onClick={handleEdit}
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          className="w-16 flex items-center justify-center bg-destructive text-destructive-foreground"
          onClick={handleDelete}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div
        className="relative bg-background transition-transform duration-150 ease-out"
        style={{ transform: `translateX(${offsetX}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  );
}
