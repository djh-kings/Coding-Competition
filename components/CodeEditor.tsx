"use client";

import { useEffect, useRef } from "react";
import { EditorView, keymap, lineNumbers, highlightActiveLineGutter } from "@codemirror/view";
import { EditorState, Compartment } from "@codemirror/state";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { python } from "@codemirror/lang-python";
import { javascript } from "@codemirror/lang-javascript";
import { oneDark } from "@codemirror/theme-one-dark";

const langCompartment = new Compartment();

function getLanguageExtension(lang: string) {
  if (lang === "javascript") return javascript();
  return python();
}

interface CodeEditorProps {
  value: string;
  onChange?: (value: string) => void;
  language?: string;
  readOnly?: boolean;
  height?: string;
}

export function CodeEditor({ value, onChange, language = "python", readOnly = false, height = "280px" }: CodeEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const state = EditorState.create({
      doc: value,
      extensions: [
        lineNumbers(),
        highlightActiveLineGutter(),
        history(),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        langCompartment.of(getLanguageExtension(language)),
        oneDark,
        EditorView.editable.of(!readOnly),
        EditorState.readOnly.of(readOnly),
        EditorView.updateListener.of((update) => {
          if (update.docChanged && onChange) {
            onChange(update.state.doc.toString());
          }
        }),
        EditorView.theme({
          "&": { height, fontSize: "13px" },
          ".cm-scroller": { fontFamily: "var(--font-mono)", lineHeight: "1.85", overflow: "auto" },
          ".cm-content": { paddingTop: "16px", paddingBottom: "16px" },
        }),
      ],
    });

    const view = new EditorView({ state, parent: containerRef.current });
    viewRef.current = view;

    return () => view.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync language changes
  useEffect(() => {
    if (viewRef.current) {
      viewRef.current.dispatch({
        effects: langCompartment.reconfigure(getLanguageExtension(language)),
      });
    }
  }, [language]);

  // Sync external value changes (e.g. loading from localStorage)
  useEffect(() => {
    const view = viewRef.current;
    if (view && value !== view.state.doc.toString()) {
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: value },
      });
    }
  }, [value]);

  return <div ref={containerRef} style={{ background: "#1a1d2e" }} />;
}
