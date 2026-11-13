import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type ShareCapableNavigator = Navigator & {
  share?: (data?: ShareData) => Promise<void>;
};

export const OPEN_INSTALL_EVENT = "pwa:open-install";

const DISMISS_KEY = "pwa:install-dismissed-at";
// Tempo que o app "lembra" que o usuário dispensou o aviso.
const DISMISS_COOLDOWN_MS = 24 * 60 * 60 * 1000;

interface PwaState {
  installEvent: BeforeInstallPromptEvent | null;
  dismissed: boolean;
  forcedOpen: boolean;
  shared: boolean;
  isMobile: boolean;
  isIOS: boolean;
  isInstalled: boolean;
}

function detectMobile() {
  const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
  const touch = (navigator.maxTouchPoints ?? 0) > 0;
  const smallScreen = window.matchMedia("(max-width: 1024px)").matches;
  const mobileUA = /Android|iPhone|iPad|iPod|Mobile|Silk/i.test(
    navigator.userAgent
  );

  return (coarsePointer || touch) && (smallScreen || mobileUA);
}

function detectIOS() {
  const ua = navigator.userAgent;
  // iPhone / iPod / iPad com UA tradicional
  if (/iPhone|iPad|iPod/i.test(ua)) return true;
  // iPadOS 13+ em "modo desktop" se apresenta como Macintosh, mas tem suporte
  // a múltiplos toques
  return /Macintosh/i.test(ua) && (navigator.maxTouchPoints ?? 0) > 1;
}

function detectStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function readDismissedAt() {
  try {
    const raw = window.localStorage.getItem(DISMISS_KEY);
    return raw ? Number(raw) : 0;
  } catch {
    return 0;
  }
}

function isPersistedDismissed() {
  const dismissedAt = readDismissedAt();
  return dismissedAt > 0 && Date.now() - dismissedAt < DISMISS_COOLDOWN_MS;
}

/**
 * Store compartilhado (fora do React) para que o header e o bottom sheet
 * compartilhem o mesmo estado de instalação.
 *
 * O snapshot é imutável: a cada mudança cria-se um novo objeto, para que o
 * `useSyncExternalStore` detecte a alteração com Object.is.
 */
const INITIAL_STATE: PwaState = {
  installEvent: null,
  dismissed: false,
  forcedOpen: false,
  shared: false,
  isMobile: false,
  isIOS: false,
  isInstalled: false,
};

let state: PwaState = INITIAL_STATE;
const listeners = new Set<() => void>();

function setState(patch: Partial<PwaState>) {
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// Durante a hydration o React usa este snapshot (valores neutros), garantindo
// que o HTML do servidor e o do cliente sejam idênticos.
function getServerSnapshot(): PwaState {
  return INITIAL_STATE;
}

function getSnapshot(): PwaState {
  return state;
}

// Inicializa a detecção assim que o módulo é carregado no cliente.
if (typeof window !== "undefined") {
  setState({
    isMobile: detectMobile(),
    isIOS: detectIOS(),
    isInstalled: detectStandalone(),
    dismissed: isPersistedDismissed(),
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).__pwaStore = { get: () => state, set: setState };

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    setState({ installEvent: event as BeforeInstallPromptEvent });
  });

  window.addEventListener("appinstalled", () => {
    try {
      window.localStorage.removeItem(DISMISS_KEY);
    } catch {
      /* ignore */
    }
    setState({ installEvent: null, dismissed: true });
  });

  window.addEventListener(OPEN_INSTALL_EVENT, () => {
    setState({ forcedOpen: true });
  });
}

export function usePwaInstall() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const current = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const install = useCallback(async () => {
    const event = current.installEvent;
    if (!event) return false;

    try {
      await event.prompt();
      const { outcome } = await event.userChoice;

      if (outcome === "accepted") {
        try {
          window.localStorage.removeItem(DISMISS_KEY);
        } catch {
          /* ignore */
        }
        setState({ installEvent: null, dismissed: true, forcedOpen: false });
        return true;
      }
    } catch {
      return false;
    }

    return false;
  }, [current.installEvent]);

  /**
   * No iOS não existe `beforeinstallprompt`: a instalação é feita pelo menu
   * Compartilhar → "Adicionar à Tela de Início". Abrimos a folha de
   * compartilhamento nativa (que já contém essa opção).
   */
  const shareInstall = useCallback(async () => {
    const nav = navigator as ShareCapableNavigator;
    if (typeof nav.share !== "function") return false;

    const data: ShareData = {
      title: "Ingressos",
      text: "Instale o app Ingressos para abrir mais rápido e usar offline.",
      url: window.location.origin + "/",
    };

    try {
      if (nav.canShare && !nav.canShare(data)) {
        await nav.share({ title: data.title, url: data.url });
      } else {
        await nav.share(data);
      }
      setState({ shared: true });
      return true;
    } catch {
      // Usuário cancelou o compartilhamento
      return false;
    }
  }, []);

  const dismiss = useCallback(() => {
    try {
      window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* ignore */
    }
    setState({ dismissed: true, forcedOpen: false });
  }, []);

  const open = useCallback(() => {
    setState({ forcedOpen: true });
  }, []);

  const { isMobile, isIOS, isInstalled, dismissed, forcedOpen, shared } = mounted
    ? current
    : INITIAL_STATE;

  // Automático: apenas em dispositivos móveis e não descartado antes.
  // Forçado (botão "Instalar app"): sempre abre.
  const canShow =
    mounted && !isInstalled && ((isMobile && !dismissed) || forcedOpen);

  const canShare =
    mounted &&
    typeof navigator !== "undefined" &&
    typeof (navigator as ShareCapableNavigator).share === "function";

  return useMemo(
    () => ({
      canShow,
      installEvent: mounted ? current.installEvent : null,
      isIOS,
      isInstalled,
      canShare,
      shared,
      install,
      shareInstall,
      dismiss,
      open,
    }),
    [
      canShow,
      mounted,
      current.installEvent,
      isIOS,
      isInstalled,
      canShare,
      shared,
      install,
      shareInstall,
      dismiss,
      open,
    ]
  );
}
