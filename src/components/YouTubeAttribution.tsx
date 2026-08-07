/**
 * YouTubeAttribution — III.F.2 compliance helper.
 *
 * Display next to any UI that shows data retrieved from the YouTube Data
 * API or YouTube Analytics API (channel stats, video metadata, etc.) so
 * the viewer can see that YouTube is the source.
 *
 * Per YouTube API Services Developer Policies III.F.2.1:
 * "Any API Client page or feature that displays YouTube content...
 *  must make clear to the viewer that YouTube is the source by
 *  displaying YouTube Brand Features in accordance with the
 *  requirements...and the YouTube Branding Guidelines."
 *
 * Do NOT use this on surfaces that show metrics TubeForge computes from
 * its own records — attributing our own numbers to YouTube would imply
 * they are YouTube data, which III.E.4.h prohibits.
 *
 * The mark itself is rendered by <YouTubeMark>, which enforces the
 * official colours and the 20dp minimum height.
 */
import { YouTubeMark } from "@/components/YouTubeMark";

export function YouTubeAttribution({ label = "Data from YouTube" }: { label?: string }) {
  return (
    <div
      role="note"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        fontSize: 12,
        color: "rgba(255,255,255,0.55)",
        lineHeight: 1,
      }}
    >
      <YouTubeMark height={24} />
      <span>{label}</span>
    </div>
  );
}
