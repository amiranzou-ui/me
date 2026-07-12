import Link from "next/link";

export default function StudioHomePage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-serif text-2xl italic text-ink">Welcome back</h1>
      <p className="text-sm text-brown max-w-lg">
        This is the private Studio — edits here go live on the site immediately, no code required.
        The Mind subsystem arrives in a later phase.
      </p>
      <div className="grid grid-cols-4 gap-4 max-w-3xl mt-4">
        <Link
          href="/studio/cv"
          className="border border-tan p-6 transition-colors hover:border-accent"
        >
          <div className="font-serif text-lg italic text-ink mb-1">CV</div>
          <div className="text-xs text-brown">Bio, contact, links, education, languages, signals</div>
        </Link>
        <Link
          href="/studio/projects"
          className="border border-tan p-6 transition-colors hover:border-accent"
        >
          <div className="font-serif text-lg italic text-ink mb-1">Projects</div>
          <div className="text-xs text-brown">Create, edit, publish, and archive projects</div>
        </Link>
        <Link
          href="/studio/gallery"
          className="border border-tan p-6 transition-colors hover:border-accent"
        >
          <div className="font-serif text-lg italic text-ink mb-1">Gallery</div>
          <div className="text-xs text-brown">Categories and photos for the Human side</div>
        </Link>
        <Link
          href="/studio/tracks"
          className="border border-tan p-6 transition-colors hover:border-accent"
        >
          <div className="font-serif text-lg italic text-ink mb-1">Tracks</div>
          <div className="text-xs text-brown">Upload songs and edit mood, room, and fragments</div>
        </Link>
      </div>
    </div>
  );
}
