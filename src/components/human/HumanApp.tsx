"use client";

import { portal } from "@/lib/world/core";
import type { Category, GalleryItem, Track } from "@/lib/human/types";
import { useArchive } from "./useArchive";
import FriendGate from "./FriendGate";
import ArchiveHall from "./ArchiveHall";
import Elevator from "./Elevator";
import SectionNotice from "./SectionNotice";
import GalleryContent from "./GalleryContent";
import HomeLoop from "./HomeLoop";
import MusicCapsule from "./MusicCapsule";
import CursorFx from "./CursorFx";

export default function HumanApp({
  categories,
  itemsByCategory,
  tracks,
}: {
  categories: Category[];
  itemsByCategory: Record<string, GalleryItem[]>;
  tracks: Track[];
}) {
  const archive = useArchive();

  function onNavBackClick(e: React.MouseEvent) {
    if (archive.insideChapter) {
      archive.returnToArchive();
    } else {
      portal("/", "#f0ebe0", e.clientX, e.clientY);
    }
  }

  return (
    <div className="human-page">
      {/* Atmospheric background */}
      <div className="mem-atm-wrap" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="mem-atm-img"
          src="https://images.unsplash.com/photo-1575209239550-322a4b125c6d?auto=format&fit=crop&w=1920&q=85"
          alt=""
          loading="lazy"
          draggable={false}
        />
      </div>
      <div className="mem-light" aria-hidden="true" />

      <CursorFx />

      <div className="frame-corner fc-tl" />
      <div className="frame-corner fc-tr" />
      <div className="frame-corner fc-bl" />
      <div className="frame-corner fc-br" />

      <nav id="page-top">
        <button
          className="nav-name"
          onClick={(e) => portal("/", "#f0ebe0", e.clientX, e.clientY)}
        >
          II
        </button>
        <button className="nav-back" onClick={onNavBackClick}>
          {archive.insideChapter ? "← archive" : "← home"}
        </button>
      </nav>
      <div className="nav-rule" />

      {archive.gateReady && archive.accessLevel === null && (
        <FriendGate password={archive.GATE_PASSWORD} onPass={archive.passGate} />
      )}

      <ArchiveHall
        categories={categories}
        visible={archive.archiveHallVisible}
        bgNumeral={archive.bgNumeral}
        lockPulse={archive.lockPulse}
        onChapterClick={archive.handleChapterClick}
        onChapterHover={archive.handleChapterHover}
      />

      <div id="trans-overlay" className={archive.transClass} />
      <Elevator elevator={archive.elevator} />
      <SectionNotice notice={archive.sectionNotice} />

      <GalleryContent
        categories={categories}
        itemsByCategory={itemsByCategory}
        activeCategory={archive.activeCategory}
        onSidebarClick={archive.handleSidebarClick}
      />

      <HomeLoop revealed={archive.bottomRevealed} />

      <MusicCapsule tracks={tracks} open={archive.musicOpen} onClose={() => archive.setMusicOpen(false)} />
    </div>
  );
}
