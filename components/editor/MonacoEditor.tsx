"use client";

import dynamic from "next/dynamic";
import { useRef } from "react";
import type { editor } from "monaco-editor";
import type { Language } from "@prisma/client";

const MonacoEditorLib = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-[#1e1e1e] text-zinc-500 text-sm">
      Loading editor…
    </div>
  ),
});

const MONACO_LANGUAGE: Record<Language, string> = {
  JAVASCRIPT: "javascript",
  TYPESCRIPT: "typescript",
  PYTHON: "python",
  GO: "go",
  RUST: "rust",
  JAVA: "java",
  CPP: "cpp",
  SQL: "sql",
  HTML: "html",
};

interface MonacoEditorProps {
  language: Language;
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
}

export function MonacoEditor({ language, value, onChange, readOnly = false }: MonacoEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  return (
    <MonacoEditorLib
      height="100%"
      language={MONACO_LANGUAGE[language]}
      value={value}
      theme="vs-dark"
      onChange={(val) => onChange(val ?? "")}
      onMount={(ed) => {
        editorRef.current = ed;
      }}
      options={{
        readOnly,
        minimap: { enabled: false },
        fontSize: 14,
        lineHeight: 22,
        fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
        fontLigatures: true,
        tabSize: 2,
        insertSpaces: true,
        scrollBeyondLastLine: false,
        automaticLayout: true,
        padding: { top: 12, bottom: 12 },
        scrollbar: { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
      }}
    />
  );
}
