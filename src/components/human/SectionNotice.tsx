"use client";

export default function SectionNotice({ notice }: { notice: { label: string; title: string } | null }) {
  return (
    <div id="section-notice" className={notice ? "visible" : ""}>
      <div className="sn-inner">
        <span className="sn-ch-label">{notice?.label}</span>
        <span className="sn-ch-title">{notice?.title}</span>
        <div className="sn-rule" />
        <span className="sn-msg">return to floor 00 to navigate the archive</span>
        <span className="sn-hint">← archive</span>
      </div>
    </div>
  );
}
