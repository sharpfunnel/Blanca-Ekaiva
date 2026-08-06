import type { TrackerContext } from "@/lib/track/types";

/**
 * Form lifecycle, keyed by `data-form-id`: viewed → started → per-field focus /
 * complete / validation-error → submitted, or abandoned on the way out.
 *
 * Only field *names* are ever recorded. Nothing a visitor types is captured
 * here, and rrweb masks inputs separately.
 */
export function initFormCollector(ctx: TrackerContext) {
  const viewed = new Set<string>();
  const started = new Set<string>();
  const submitted = new Set<string>();
  /** Fields that received focus and were left non-empty. */
  const completed = new Set<string>();

  /**
   * `data-form-id` when present, else a derived key. The fallback exists so an
   * untagged form is never silently untracked — but derived keys change with
   * the markup, which is exactly why tagging is the convention.
   */
  const formIdOf = (el: Element | null) => {
    const tagged = el?.closest<HTMLElement>("[data-form-id]");
    if (tagged?.dataset.formId) return tagged.dataset.formId;
    const form = el?.closest("form");
    if (!form) return "";
    return form.id || form.getAttribute("name") || "untagged-form";
  };

  const fieldNameOf = (el: Element) =>
    (el.getAttribute("name") ||
      el.getAttribute("id") ||
      el.getAttribute("aria-label") ||
      "field").slice(0, 60);

  /* ── viewed ────────────────────────────────────────────────────────────── */
  try {
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const id = formIdOf(entry.target);
          if (!id || viewed.has(id)) continue;
          viewed.add(id);
          ctx.track({ type: "FORM_OPEN", formId: id });
          io.unobserve(entry.target);
        }
      },
      { threshold: 0.35 }
    );
    document
      .querySelectorAll("[data-form-id], form")
      .forEach((f) => io.observe(f));
  } catch {
    /* no IntersectionObserver → the rest of the lifecycle still works */
  }

  /* ── started + field focus ─────────────────────────────────────────────── */
  addEventListener(
    "focusin",
    (event) => {
      const target = event.target as Element | null;
      if (!target?.matches?.("input, select, textarea")) return;
      const formId = formIdOf(target);
      if (!formId) return;

      if (!started.has(formId)) {
        started.add(formId);
        // First focus IS the start — a form the visitor never touched was
        // never started, however long they looked at it.
        ctx.track({ type: "FORM_START", formId });
        ctx.flush();
      }
      ctx.track({
        type: "FIELD_FOCUS",
        formId,
        fieldName: fieldNameOf(target),
      });
    },
    { capture: true }
  );

  /* ── field complete ────────────────────────────────────────────────────── */
  addEventListener(
    "focusout",
    (event) => {
      const target = event.target as HTMLInputElement | null;
      if (!target?.matches?.("input, select, textarea")) return;
      const formId = formIdOf(target);
      if (!formId || !target.value?.trim()) return;
      const field = fieldNameOf(target);
      const key = `${formId}:${field}`;
      if (completed.has(key)) return;
      completed.add(key);
      ctx.track({ type: "FIELD_COMPLETE", formId, fieldName: field });
    },
    { capture: true }
  );

  /* ── validation errors ─────────────────────────────────────────────────── */
  // Native constraint validation. React-rendered error text is caught by the
  // aria-invalid sweep below instead.
  addEventListener(
    "invalid",
    (event) => {
      const target = event.target as HTMLInputElement | null;
      if (!target) return;
      const formId = formIdOf(target);
      if (!formId) return;
      ctx.track({
        type: "VALIDATION_ERROR",
        formId,
        fieldName: fieldNameOf(target),
        text: (target.validationMessage || "invalid").slice(0, 120),
      });
    },
    { capture: true }
  );

  const reported = new Set<string>();
  function sweepInvalid() {
    document
      .querySelectorAll('[data-form-id] [aria-invalid="true"]')
      .forEach((el) => {
        const formId = formIdOf(el);
        const field = fieldNameOf(el);
        const key = `${formId}:${field}`;
        if (!formId || reported.has(key)) return;
        reported.add(key);
        ctx.track({ type: "VALIDATION_ERROR", formId, fieldName: field });
      });
  }

  /* ── submit ────────────────────────────────────────────────────────────── */
  addEventListener(
    "submit",
    (event) => {
      const formId = formIdOf(event.target as Element);
      if (!formId) return;
      submitted.add(formId);
      ctx.track({ type: "FORM_SUBMIT", formId });
      ctx.flush();
      // Client-side validation resolves a tick later; look then, not now.
      setTimeout(sweepInvalid, 60);
    },
    { capture: true }
  );

  /* ── abandoned ─────────────────────────────────────────────────────────── */
  ctx.onUnload(() => {
    for (const formId of started) {
      if (submitted.has(formId)) continue;
      ctx.track({ type: "FORM_ABANDON", formId });
    }
  });
}
