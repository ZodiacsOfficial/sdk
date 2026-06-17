import type { SocialFeedCast } from "../../lib/social";

function castTime(timestamp: string): string {
  const ts = Date.parse(timestamp);
  if (Number.isNaN(ts)) {
    return "";
  }
  const seconds = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (seconds < 60) {
    return "now";
  }
  if (seconds < 3600) {
    return `${Math.floor(seconds / 60)}m`;
  }
  if (seconds < 86400) {
    return `${Math.floor(seconds / 3600)}h`;
  }
  return `${Math.floor(seconds / 86400)}d`;
}

function authorName(cast: SocialFeedCast): string {
  return cast.author.displayName ?? cast.author.username ?? `fid ${cast.author.fid ?? "unknown"}`;
}

export function SocialCastRow({ cast }: { cast: SocialFeedCast }) {
  const username = cast.author.username ? `@${cast.author.username}` : null;
  const time = castTime(cast.timestamp);
  return (
    <article className="social-cast">
      <div className="social-author">
        {cast.author.pfpUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="social-avatar" src={cast.author.pfpUrl} alt="" />
        ) : (
          <span className="social-avatar-fallback" aria-hidden>
            {authorName(cast).slice(0, 1).toUpperCase()}
          </span>
        )}
        <div className="social-author-copy">
          <strong>{authorName(cast)}</strong>
          <span>
            {username}
            {username && time ? " / " : ""}
            {time}
          </span>
        </div>
        {cast.url ? (
          <a
            className="social-open"
            href={cast.url}
            target="_blank"
            rel="noreferrer"
            aria-label="Open cast"
          >
            Open
          </a>
        ) : null}
      </div>

      <p className="social-text">{cast.text}</p>

      {cast.embeds.length > 0 ? (
        <div className="social-embeds">
          {cast.embeds.slice(0, 2).map((embed) => (
            <a key={embed} href={embed} target="_blank" rel="noreferrer">
              {embed.replace(/^https?:\/\//u, "")}
            </a>
          ))}
        </div>
      ) : null}

      <div className="social-meta" aria-label="Cast activity">
        <span>{cast.likes} likes</span>
        <span>{cast.recasts} recasts</span>
        <span>{cast.replies} replies</span>
      </div>
    </article>
  );
}
