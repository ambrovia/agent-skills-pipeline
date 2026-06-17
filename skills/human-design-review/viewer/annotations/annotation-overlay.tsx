import { useCallback, useEffect, useRef, useState } from "react";
import { resolveComponentTarget } from "./resolve-component.js";
import type { AnnotationState, AnnotationTarget } from "./types.js";

export interface AnnotationOverlayProps {
  story: string;
  variant: string;
  storyRoot: HTMLElement | null;
}

export function AnnotationOverlay({
  story,
  variant,
  storyRoot,
}: AnnotationOverlayProps): React.JSX.Element {
  const [armed, setArmed] = useState(false);
  const [selected, setSelected] = useState<AnnotationTarget | null>(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<AnnotationState | null>(null);
  const [showList, setShowList] = useState(false);

  const pillRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const armRef = useRef<HTMLButtonElement>(null);
  const hoveredRef = useRef<Element | null>(null);
  const capturedElRef = useRef<Element | null>(null);
  const listenerCleanupRef = useRef<(() => void) | null>(null);

  const fetchState = useCallback((): void => {
    void fetch("/__annotations")
      .then((r) => r.json())
      .then((data: { state: AnnotationState }) => setState(data.state))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchState();
  }, [fetchState]);

  const currentRound = state?.currentRound ?? 1;
  const currentRoundData = state?.rounds.find((r) => r.round === currentRound);
  const noteCount = currentRoundData?.annotations.length ?? 0;

  const applyHoverOutline = useCallback((el: Element | null): void => {
    if (hoveredRef.current && hoveredRef.current !== el) {
      hoveredRef.current.classList.remove("anno-hover");
    }
    if (el) {
      el.classList.add("anno-hover");
    }
    hoveredRef.current = el ?? null;
  }, []);

  const clearHoverOutline = useCallback((): void => {
    applyHoverOutline(null);
  }, [applyHoverOutline]);

  const applyCapturedOutline = useCallback((el: Element | null): void => {
    if (capturedElRef.current) {
      capturedElRef.current.classList.remove("anno-selected");
    }
    capturedElRef.current = el;
    if (el) {
      el.classList.add("anno-selected");
    }
  }, []);

  const isOwnNode = useCallback((target: EventTarget | null): boolean => {
    if (!(target instanceof Element)) return false;
    return !!(
      pillRef.current?.contains(target) ||
      popoverRef.current?.contains(target)
    );
  }, []);

  const disarm = useCallback((): void => {
    setArmed(false);
    clearHoverOutline();
    if (listenerCleanupRef.current) {
      listenerCleanupRef.current();
      listenerCleanupRef.current = null;
    }
  }, [clearHoverOutline]);

  const arm = useCallback((): void => {
    setArmed(true);
    if (!storyRoot) return;

    const handleMouseMove = (e: MouseEvent): void => {
      if (isOwnNode(e.target)) {
        clearHoverOutline();
        return;
      }
      if (e.target instanceof Element) {
        applyHoverOutline(e.target);
      }
    };

    const handleCapturingClick = (e: MouseEvent): void => {
      storyRoot.removeEventListener("mousemove", handleMouseMove);
      storyRoot.removeEventListener("click", handleCapturingClick, true);
      listenerCleanupRef.current = null;
      setArmed(false);
      clearHoverOutline();

      if (isOwnNode(e.target)) return;

      e.preventDefault();
      e.stopPropagation();

      if (e.target instanceof Element) {
        const resolved = resolveComponentTarget(e.target);
        applyCapturedOutline(e.target);
        setSelected(resolved);
        setNote("");
        setError(null);
      }
    };

    storyRoot.addEventListener("mousemove", handleMouseMove);
    storyRoot.addEventListener("click", handleCapturingClick, true);

    listenerCleanupRef.current = (): void => {
      storyRoot.removeEventListener("mousemove", handleMouseMove);
      storyRoot.removeEventListener("click", handleCapturingClick, true);
    };
  }, [
    storyRoot,
    isOwnNode,
    applyHoverOutline,
    clearHoverOutline,
    applyCapturedOutline,
  ]);

  useEffect(() => {
    return (): void => {
      listenerCleanupRef.current?.();
    };
  }, []);

  useEffect(() => {
    if (selected) {
      setTimeout(() => textareaRef.current?.focus(), 0);
    }
  }, [selected]);

  const handlePopoverKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>): void => {
      if (e.key !== "Tab") return;
      const popover = popoverRef.current;
      if (!popover) return;

      const focusable = Array.from(
        popover.querySelectorAll<HTMLElement>(
          "textarea, button:not(:disabled)",
        ),
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (e.shiftKey) {
        if (active === first) {
          e.preventDefault();
          last?.focus();
        }
      } else if (active === last) {
        e.preventDefault();
        first?.focus();
      }
    },
    [],
  );

  const handleSave = useCallback(async (): Promise<void> => {
    if (!selected || saving) return;
    setSaving(true);
    setError(null);
    try {
      const payload = { story, variant, note, target: selected };
      const res = await fetch("/__annotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Server error");
      const data = (await res.json()) as { state: AnnotationState };
      setState(data.state);
      if (capturedElRef.current) {
        capturedElRef.current.classList.remove("anno-selected");
        capturedElRef.current.classList.add("anno-saved");
        capturedElRef.current = null;
      }
      setSelected(null);
      setNote("");
    } catch {
      setError("Couldn't save — the viewer middleware may be down. Retry?");
    } finally {
      setSaving(false);
    }
  }, [selected, saving, story, variant, note]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") {
        if (selected) {
          applyCapturedOutline(null);
          setSelected(null);
          setNote("");
          setError(null);
          armRef.current?.focus();
        } else if (armed) {
          disarm();
          armRef.current?.focus();
        }
      }
      if (selected && e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        void handleSave();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [selected, armed, disarm, handleSave, applyCapturedOutline]);

  const toggleArm = (): void => {
    if (armed) disarm();
    else arm();
  };

  const handleNewIteration = async (): Promise<void> => {
    if (noteCount === 0) return;
    try {
      const res = await fetch("/__annotations/round", { method: "POST" });
      const data = (await res.json()) as { state: AnnotationState };
      setState(data.state);
      setShowList(false);
    } catch {
      // best-effort
    }
  };

  return (
    <>
      <div ref={pillRef} className="anno-pill">
        <button
          ref={armRef}
          type="button"
          className={`anno-btn${armed ? " anno-btn--active" : ""}`}
          aria-pressed={armed}
          onClick={toggleArm}
        >
          {armed ? "Selecting…" : "Select"}
        </button>

        <span className="anno-round">Round {currentRound}</span>

        <button
          type="button"
          className="anno-btn"
          aria-label={`Round ${currentRound}, ${noteCount} notes`}
          onClick={() => setShowList((v) => !v)}
        >
          {noteCount} {noteCount === 1 ? "note" : "notes"}
        </button>

        <button
          type="button"
          className="anno-btn"
          disabled={noteCount === 0}
          onClick={() => void handleNewIteration()}
        >
          New iteration
        </button>
      </div>

      {selected !== null && (
        <div
          ref={popoverRef}
          className="anno-popover"
          role="dialog"
          aria-modal="true"
          onKeyDown={handlePopoverKeyDown}
        >
          <div
            className="anno-target"
            title={`${selected.component} · ${selected.element}`}
          >
            <span className="anno-target-component">{selected.component}</span>{" "}
            &middot;{" "}
            <span className="anno-target-element">{selected.element}</span>
          </div>

          <textarea
            ref={textareaRef}
            value={note}
            placeholder="What should change about this element?"
            onChange={(e) => setNote(e.target.value)}
            rows={4}
          />

          {error !== null && <div className="anno-error">{error}</div>}

          <div className="anno-popover-actions">
            <button
              type="button"
              className="anno-btn anno-save"
              disabled={saving}
              onClick={() => void handleSave()}
            >
              {saving ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              className="anno-btn"
              onClick={() => {
                applyCapturedOutline(null);
                setSelected(null);
                setNote("");
                setError(null);
                armRef.current?.focus();
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {showList && currentRoundData && currentRoundData.annotations.length > 0 && (
        <div className="anno-list-panel">
          <ul className="anno-list">
            {currentRoundData.annotations.map((a) => (
              <li key={a.id}>
                <span className="anno-list-component">
                  {a.target.component}
                </span>{" "}
                &mdash; {a.note}
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
