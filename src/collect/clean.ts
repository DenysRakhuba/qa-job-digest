const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

export function decodeEntities(text: string): string {
  return text.replace(/&(#\d+|[a-z]+);/gi, (match, code: string) => {
    if (code.startsWith("#")) {
      return String.fromCodePoint(Number(code.slice(1)));
    }
    return ENTITIES[code.toLowerCase()] ?? match;
  });
}

export function htmlToText(html: string): string {
  const withBreaks = html.replace(/<br\s*\/?>|<\/(p|li|h\d|div)>/gi, "\n");
  const withoutTags = withBreaks.replace(/<[^>]+>/g, "");
  return decodeEntities(withoutTags)
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

export function normalizeLink(link: string): string {
  const url = new URL(link);
  url.search = "";
  url.hash = "";
  return url.toString();
}
