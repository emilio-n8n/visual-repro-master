import { useEffect, useRef } from "react";

interface SkipLinkProps {
  targetId?: string;
}

export function SkipLink({ targetId = "main-content" }: SkipLinkProps) {
  const linkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Tab" && !document.getElementById("skip-link")) {
        const link = document.createElement("a");
        link.id = "skip-link";
        link.href = `#${targetId}`;
        link.className = "sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-[#C4A264] focus:text-black focus:rounded";
        link.textContent = "Aller au contenu principal";
        document.body.appendChild(link);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [targetId]);

  return (
    <a
      href={`#${targetId}`}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-[#C4A264] focus:text-black focus:rounded focus:font-medium"
    >
      Aller au contenu principal
    </a>
  );
}