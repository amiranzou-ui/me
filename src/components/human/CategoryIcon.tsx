/** Ported from the inline SVGs in legacy/human.html's sidebar buttons. */
export default function CategoryIcon({ slug }: { slug: string }) {
  const common = {
    width: 26,
    height: 26,
    viewBox: "0 0 26 26",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (slug) {
    case "photography":
      return (
        <svg {...common}>
          <rect x="2" y="7" width="22" height="15" rx="2.5" />
          <circle cx="13" cy="14.5" r="4" />
          <path d="M9 7l1.5-3h5L17 7" />
          <circle cx="20" cy="10" r="1" fill="currentColor" stroke="none" />
        </svg>
      );
    case "posters":
      return (
        <svg {...common}>
          <rect x="4" y="3" width="18" height="22" rx="1.5" />
          <line x1="8" y1="9" x2="18" y2="9" />
          <line x1="8" y1="13" x2="18" y2="13" />
          <line x1="8" y1="17" x2="14" y2="17" />
        </svg>
      );
    case "patterns":
      return (
        <svg {...common} strokeLinejoin={undefined}>
          {[6, 13, 20].flatMap((cy) => [6, 13, 20].map((cx) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="1.8" />))}
        </svg>
      );
    case "music":
      return (
        <svg {...common}>
          <circle cx="8" cy="20" r="2.5" />
          <circle cx="19" cy="18" r="2.5" />
          <line x1="10.5" y1="20" x2="10.5" y2="8" />
          <line x1="21.5" y1="18" x2="21.5" y2="6" />
          <polyline points="10.5,8 21.5,6" />
        </svg>
      );
    case "cooking":
      return (
        <svg {...common}>
          <path d="M4 10 Q4 5 9 5 Q9 2 13 2 Q17 2 17 5 Q22 5 22 10 L20 21 Q20 23 18 23 L8 23 Q6 23 6 21 Z" />
          <line x1="13" y1="2" x2="13" y2="5" />
          <line x1="9" y1="10" x2="9" y2="19" />
          <line x1="13" y1="10" x2="13" y2="19" />
          <line x1="17" y1="10" x2="17" y2="19" />
        </svg>
      );
    case "3d":
      return (
        <svg {...common}>
          <polyline points="13,3 22,8 13,13 4,8 13,3" />
          <polyline points="4,8 4,17 13,22 13,13" />
          <polyline points="22,8 22,17 13,22" />
        </svg>
      );
    default:
      return null;
  }
}
