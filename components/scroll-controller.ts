const scrollKeys = new Set([
  "ArrowDown",
  "ArrowUp",
  "PageDown",
  "PageUp",
  "Home",
  "End",
  " ",
]);

const topOf = (element: HTMLElement) =>
  element.getBoundingClientRect().top + window.scrollY;

const maxScroll = () =>
  Math.max(0, document.documentElement.scrollHeight - window.innerHeight);

const getSections = (root: HTMLElement) =>
  Array.from(root.querySelectorAll<HTMLElement>("main section[data-snap]"));

type ScrollAnchor = { element: HTMLElement; edge: "start" | "end" };

const anchorPosition = ({ element, edge }: ScrollAnchor) =>
  Math.min(
    maxScroll(),
    topOf(element) +
      (edge === "end" ? element.offsetHeight - window.innerHeight : 0)
  );

function anchorAt(root: HTMLElement, position: number): ScrollAnchor | null {
  const candidates = Array.from(
    root.querySelectorAll<HTMLElement>(
      "main section[data-snap], footer[data-snap]"
    )
  );
  const element = candidates.find(
    (candidate) => Math.abs(Math.min(maxScroll(), topOf(candidate)) - position) < 2
  );
  if (element) return { element, edge: "start" };
  const end = candidates.find(
    (candidate) =>
      Math.abs(
        topOf(candidate) + candidate.offsetHeight - window.innerHeight - position
      ) < 2
  );
  return end ? { element: end, edge: "end" } : null;
}

function settleTarget(
  y: number,
  anchor: number,
  bounds: [number, number],
  vh: number
) {
  const [a, b] = bounds;
  const threshold = vh * 0.06;
  if (y >= anchor) return y - a > threshold ? b : a;
  return b - y > threshold ? a : b;
}

function upwardBoundary(
  y: number,
  anchor: number,
  edge: number,
  vh: number
) {
  return y < anchor && y - edge <= vh * 0.06 ? edge : null;
}

function boundaryTarget(
  root: HTMLElement,
  y: number,
  anchor: number
): number | null {
  const vh = window.innerHeight;
  const sections = getSections(root);
  const index = sections.findLastIndex((section) => topOf(section) <= y + 1);
  const current = sections[index];
  if (!current) return null;
  const following = sections[index + 1];
  const start = topOf(current);
  const end = Math.min(
    maxScroll(),
    following ? topOf(following) : start + current.offsetHeight
  );
  if (y >= end) return y > end ? upwardBoundary(y, anchor, end, vh) : null;
  if (current.offsetHeight <= vh * 1.05) {
    return settleTarget(y, anchor, [start, end], vh);
  }
  const bottom = start + current.offsetHeight - vh;
  if (y < bottom) return upwardBoundary(y, anchor, start, vh);
  return settleTarget(y, anchor, [bottom, end], vh);
}

export function createScrollController(
  root: HTMLElement,
  reduced: boolean,
  nativeScroll = false
) {
  let anchorY = window.scrollY;
  let observedY = window.scrollY;
  let writtenY = window.scrollY;
  let snapping = false;
  let frame = 0;
  let disposed = false;
  let settled = anchorAt(root, window.scrollY);
  let settleTimer: ReturnType<typeof setTimeout>;
  let releaseTimer: ReturnType<typeof setTimeout>;

  const writePosition = (top: number) => {
    window.scrollTo({ top, behavior: "instant" });
    writtenY = observedY = window.scrollY;
  };

  const cancel = () => {
    cancelAnimationFrame(frame);
    clearTimeout(settleTimer);
    clearTimeout(releaseTimer);
    snapping = false;
    anchorY = window.scrollY;
  };

  function animateTo(position: number) {
    cancel();
    settled = null;
    const target = Math.max(0, Math.min(maxScroll(), position));
    if (nativeScroll) {
      window.scrollTo({
        top: target,
        behavior: reduced ? "instant" : "smooth",
      });
      return;
    }
    const from = window.scrollY;
    const delta = target - from;
    if (reduced || Math.abs(delta) < 2) {
      writePosition(target);
      anchorY = target;
      settled = anchorAt(root, target);
      return;
    }
    snapping = true;
    const duration = Math.min(900, 420 + Math.abs(delta) * 0.35);
    const start = performance.now();
    const step = (now: number) => {
      if (disposed) return;
      const k = Math.min(1, (now - start) / duration);
      writePosition(from + delta * (1 - Math.pow(1 - k, 3)));
      if (k < 1) {
        frame = requestAnimationFrame(step);
      } else {
        anchorY = target;
        settled = anchorAt(root, target);
        releaseTimer = setTimeout(() => {
          snapping = false;
        }, 80);
      }
    };
    frame = requestAnimationFrame(step);
  }

  function settle() {
    if (reduced || snapping || disposed) return;
    const target = boundaryTarget(root, window.scrollY, anchorY);
    if (target === null) {
      anchorY = window.scrollY;
      return;
    }
    animateTo(target);
  }

  const onScroll = () => {
    const y = window.scrollY;
    if (nativeScroll) {
      observedY = anchorY = y;
      return;
    }
    if (Math.abs(y - observedY) < 0.5) return;
    const previousY = observedY;
    observedY = y;
    settled = null;
    if (snapping) {
      if (Math.abs(y - writtenY) < 0.5) return;
      cancel();
    }
    anchorY = previousY;
    clearTimeout(settleTimer);
    settleTimer = setTimeout(settle, 130);
  };

  const onIntent = (event: Event) => {
    if (
      event.type === "keydown" &&
      !(
        "key" in event &&
        typeof event.key === "string" &&
        scrollKeys.has(event.key)
      )
    ) {
      return;
    }
    if (snapping) {
      cancel();
      anchorY = observedY;
    }
    settled = null;
  };

  const onResize = () => {
    cancel();
    if (!nativeScroll && settled && root.contains(settled.element)) {
      writePosition(Math.max(0, anchorPosition(settled)));
      anchorY = window.scrollY;
    }
    observedY = window.scrollY;
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onResize);
  const inputEvents = ["wheel", "touchstart", "pointerdown", "keydown"];
  inputEvents.forEach((type) =>
    window.addEventListener(type, onIntent, { passive: true })
  );

  return {
    to(id: string) {
      if (!id) {
        animateTo(0);
        return;
      }
      const element = document.getElementById(id);
      if (element && root.contains(element)) animateTo(topOf(element));
    },
    next() {
      const y = window.scrollY;
      const vh = window.innerHeight;
      const next =
        getSections(root)
          .map(topOf)
          .find((top) => top > y + 120) ?? maxScroll();
      animateTo(next - y > vh * 1.1 ? y + vh * 0.8 : next);
    },
    dispose() {
      disposed = true;
      cancel();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      inputEvents.forEach((type) =>
        window.removeEventListener(type, onIntent)
      );
    },
  };
}

export type ScrollController = ReturnType<typeof createScrollController>;
