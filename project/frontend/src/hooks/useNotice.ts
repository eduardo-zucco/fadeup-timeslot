import { useCallback, useState } from "react";
import type { Notice } from "@/components/Alert";

export function useNotice() {
  const [notice, setNotice] = useState<Notice | null>(null);
  const show = useCallback((text: string, ok = false) => setNotice({ text, ok }), []);
  const clear = useCallback(() => setNotice(null), []);
  return { notice, show, clear };
}
