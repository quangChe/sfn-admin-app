"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";

interface WorkspaceContextType {
  tagStr: string;
  dirtyCount: number;
  dirtyLabel: string;
  reportDirty: (count: number, label: string) => void;
  registerSaveHandler: (fn: (() => Promise<void>) | null) => void;
  registerDiscardHandler: (fn: (() => void) | null) => void;
  triggerSave: () => Promise<void>;
  triggerDiscard: () => void;
  isSaving: boolean;
}

const WorkspaceContext = createContext<WorkspaceContextType | null>(null);

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be inside WorkspaceProvider");
  return ctx;
}

export function WorkspaceProvider({
  tagStr,
  children,
}: {
  tagStr: string;
  children: React.ReactNode;
}) {
  const [dirtyCount, setDirtyCount] = useState(0);
  const [dirtyLabel, setDirtyLabel] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const saveHandlerRef = useRef<(() => Promise<void>) | null>(null);
  const discardHandlerRef = useRef<(() => void) | null>(null);

  const reportDirty = useCallback((count: number, label: string) => {
    setDirtyCount(count);
    setDirtyLabel(label);
  }, []);

  const registerSaveHandler = useCallback(
    (fn: (() => Promise<void>) | null) => {
      saveHandlerRef.current = fn;
    },
    []
  );

  const registerDiscardHandler = useCallback((fn: (() => void) | null) => {
    discardHandlerRef.current = fn;
  }, []);

  const triggerSave = useCallback(async () => {
    if (!saveHandlerRef.current) return;
    setIsSaving(true);
    try {
      await saveHandlerRef.current();
      setDirtyCount(0);
    } finally {
      setIsSaving(false);
    }
  }, []);

  const triggerDiscard = useCallback(() => {
    discardHandlerRef.current?.();
    setDirtyCount(0);
  }, []);

  return (
    <WorkspaceContext.Provider
      value={{
        tagStr,
        dirtyCount,
        dirtyLabel,
        reportDirty,
        registerSaveHandler,
        registerDiscardHandler,
        triggerSave,
        triggerDiscard,
        isSaving,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}
