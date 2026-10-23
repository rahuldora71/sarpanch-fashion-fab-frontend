import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { translateWorkerWord } from "./workerWordMap";

// Maps Text nodes to their original English text content
const originalTextMap = new WeakMap<Text, string>();
const lastTranslatedMap = new WeakMap<Text, string>();

// Maps Input/Textarea elements to their original placeholder attribute
const originalPlaceholderMap = new WeakMap<Element, string>();
const lastPlaceholderMap = new WeakMap<Element, string>();

// Regex to detect purely numeric, currency, date, time, math, punctuation, or code content
const NUMERIC_OR_SYMBOL_REGEX = /^[\s\d₹$€£%.,:;/\-–—+()#@*\\_=[\]{}<>]+$/;

// Flag to prevent MutationObserver self-triggering during internal DOM updates
let isInternalDomUpdate = false;

function shouldSkipNode(node: Node): boolean {
  const parent = node.parentElement;
  if (!parent) return true;
  const tag = parent.tagName.toUpperCase();
  if (
    tag === "SCRIPT" ||
    tag === "STYLE" ||
    tag === "NOSCRIPT" ||
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "CODE" ||
    tag === "PRE" ||
    tag === "TIME" ||
    tag === "KBD" ||
    tag === "SAMP" ||
    tag === "VAR" ||
    parent.isContentEditable ||
    parent.closest("[data-no-translate]") ||
    parent.closest("[data-numeric]") ||
    parent.classList.contains("font-mono") ||
    parent.closest(".font-mono")
  ) {
    return true;
  }

  // Never mutate pure numbers, currency values, dates, percentages, codes, or symbols
  const val = node.nodeValue ?? "";
  if (!val.trim() || NUMERIC_OR_SYMBOL_REGEX.test(val)) {
    return true;
  }

  return false;
}

function processTextNode(node: Text, currentLang: string) {
  if (shouldSkipNode(node)) return;

  const currentVal = node.nodeValue ?? "";
  const lastTranslated = lastTranslatedMap.get(node);
  const trackedOriginal = originalTextMap.get(node);

  // If node has not been tracked yet or was updated by React with fresh English/business content
  if (!trackedOriginal || (currentVal !== lastTranslated && currentVal !== trackedOriginal)) {
    originalTextMap.set(node, currentVal);
  }

  const original = originalTextMap.get(node) ?? currentVal;
  const trimmed = original.trim();

  if (!trimmed) return;

  if (currentLang === "en") {
    // Only restore if this node was previously modified by our translator
    if (lastTranslated && node.nodeValue !== original) {
      isInternalDomUpdate = true;
      try {
        node.nodeValue = original;
      } finally {
        isInternalDomUpdate = false;
      }
      lastTranslatedMap.delete(node);
    }
    return;
  }

  // Translate UI vocabulary, Customer/Worker Names, and Addresses
  const translated = translateWorkerWord(trimmed, currentLang);
  if (translated && translated !== trimmed) {
    // Preserve leading/trailing whitespace
    const leadingWs = original.match(/^\s*/)?.[0] ?? "";
    const trailingWs = original.match(/\s*$/)?.[0] ?? "";
    const fullTranslated = leadingWs + translated + trailingWs;

    if (node.nodeValue !== fullTranslated) {
      isInternalDomUpdate = true;
      try {
        node.nodeValue = fullTranslated;
      } finally {
        isInternalDomUpdate = false;
      }
      lastTranslatedMap.set(node, fullTranslated);
    }
  }
}

function processPlaceholders(root: Element, currentLang: string) {
  const inputs = root.querySelectorAll("input[placeholder], textarea[placeholder]");
  inputs.forEach((el) => {
    if (el.closest("[data-no-translate]")) return;
    const currentPlaceholder = el.getAttribute("placeholder") ?? "";
    if (!currentPlaceholder.trim() || NUMERIC_OR_SYMBOL_REGEX.test(currentPlaceholder)) return;

    const lastTranslated = lastPlaceholderMap.get(el);
    const trackedOriginal = originalPlaceholderMap.get(el);

    if (
      !trackedOriginal ||
      (currentPlaceholder !== lastTranslated && currentPlaceholder !== trackedOriginal)
    ) {
      originalPlaceholderMap.set(el, currentPlaceholder);
    }

    const original = originalPlaceholderMap.get(el) ?? currentPlaceholder;
    if (currentLang === "en") {
      if (lastTranslated && el.getAttribute("placeholder") !== original) {
        el.setAttribute("placeholder", original);
        lastPlaceholderMap.delete(el);
      }
      return;
    }

    const translated = translateWorkerWord(original.trim(), currentLang);
    if (translated && translated !== original) {
      el.setAttribute("placeholder", translated);
      lastPlaceholderMap.set(el, translated);
    }
  });
}

function walkAndTranslate(root: Node, currentLang: string) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let currentNode = walker.nextNode();
  while (currentNode) {
    processTextNode(currentNode as Text, currentLang);
    currentNode = walker.nextNode();
  }

  if (root instanceof Element) {
    processPlaceholders(root, currentLang);
  }
}

/**
 * WorkerLanguageSynchronizer
 *
 * Automatically translates terms defined in `workerWordMap.ts` across the entire DOM
 * when language is set to Hindi (`hi`) or Punjabi (`pa`), and restores original English
 * when set to `en`. This ensures low-literacy workers see everyday workshop vocabulary
 * anywhere on any page, even on dynamic backend fields like measurement names,
 * while safely ignoring numbers, currency, dates, and metric data cards.
 */
export function WorkerLanguageSynchronizer() {
  const { i18n } = useTranslation();
  const currentLang = (i18n.language || "en").toLowerCase().split("-")[0];

  useEffect(() => {
    let animFrame: number;

    const runSync = () => {
      walkAndTranslate(document.body, currentLang);
    };

    runSync();

    const observer = new MutationObserver(() => {
      if (isInternalDomUpdate) return;
      cancelAnimationFrame(animFrame);
      animFrame = requestAnimationFrame(runSync);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => {
      cancelAnimationFrame(animFrame);
      observer.disconnect();
    };
  }, [currentLang]);

  return null;
}

/**
 * Hook to translate words using `WORKER_WORD_MAP` first, then standard i18next
 */
export function useWorkerTranslation() {
  const { t: i18nT, i18n } = useTranslation();
  const currentLang = (i18n.language || "en").toLowerCase().split("-")[0];

  const t = (key: string, defaultText?: string): string => {
    // 1. Try worker word map
    const workerMatch = translateWorkerWord(key, currentLang);
    if (workerMatch && workerMatch !== key) {
      return workerMatch;
    }

    // 2. Try i18next translation
    const i18nMatch = i18nT(key);
    if (i18nMatch && i18nMatch !== key) {
      return i18nMatch;
    }

    // 3. Fallback
    return defaultText ?? key;
  };

  const changeLanguage = (lang: string) => {
    void i18n.changeLanguage(lang);
  };

  return {
    t,
    currentLanguage: currentLang,
    changeLanguage,
    i18n,
  };
}
