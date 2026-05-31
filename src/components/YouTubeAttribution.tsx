/**
 * YouTubeAttribution — III.F.2.1 compliance helper.
 *
 * Display next to any UI that shows data from the YouTube Data API
 * (video stats, channel info, video metadata, etc.) so the source is
 * clearly attributed to YouTube. The official YouTube Brand Features
 * (28×20 mark, #FF0000 outer + #fff inner) are rendered at 20×14 for
 * a subtle but visible inline label.
 *
 * Per YouTube API Services Developer Policies III.F.2.1:
 * "Any API Client page or feature that displays YouTube content...
 *  must make clear to the viewer that YouTube is the source by
 *  displaying YouTube Brand Features in accordance with the
 *  requirements...and the YouTube Branding Guidelines."
 */
export function YouTubeAttribution({ label = "Data from YouTube" }: { label?: string }) {
  return (
    <div
      role="note"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontSize: 12,
        color: "rgba(255,255,255,0.55)",
        lineHeight: 1,
      }}
    >
      <svg
        width="20"
        height="14"
        viewBox="0 0 28 20"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="YouTube"
        role="img"
      >
        <path
          d="M27.42 3.13a3.51 3.51 0 0 0-2.47-2.5C22.8 0 14 0 14 0S5.2 0 3.05.63A3.51 3.51 0 0 0 .58 3.13 36.83 36.83 0 0 0 0 10a36.83 36.83 0 0 0 .58 6.87 3.51 3.51 0 0 0 2.47 2.5C5.2 20 14 20 14 20s8.8 0 10.95-.63a3.51 3.51 0 0 0 2.47-2.5A36.83 36.83 0 0 0 28 10a36.83 36.83 0 0 0-.58-6.87Z"
          fill="#FF0000"
        />
        <path d="M11.2 14.29 18.5 10 11.2 5.71v8.58Z" fill="#fff" />
      </svg>
      <span>{label}</span>
    </div>
  );
}
