export function contactLabel(input: {
  source: string | null;
  display_name: string | null;
  instagram_username: string | null;
  contact_name: string | null;
}): { primary: string; secondary: string | null } {
  const trim = (val: string | null): string | null => {
    if (!val) return null;
    const trimmed = val.trim();
    if (trimmed === "" || trimmed === "Unknown") return null;
    return trimmed;
  };

  const source = trim(input.source);
  const displayName = trim(input.display_name);
  const contactName = trim(input.contact_name);
  let instagramUsername = trim(input.instagram_username);

  if (instagramUsername && instagramUsername.startsWith("@")) {
    instagramUsername = instagramUsername.slice(1).trim() || null;
  }

  if (source === "instagram") {
    const name = displayName ?? contactName;
    const username = instagramUsername;

    if (name && username) {
      return { primary: name, secondary: `@${username}` };
    }
    if (name) {
      return { primary: name, secondary: null };
    }
    if (username) {
      return { primary: `@${username}`, secondary: null };
    }
    return { primary: "Instagram user", secondary: null };
  }

  const primary = displayName ?? contactName ?? "Unknown";
  return { primary, secondary: null };
}
