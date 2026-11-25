// Shared by UserMenu and AvatarSection for the account avatar's fallback
// (EntityAvatar has its own equivalent inline, one level simpler since
// asset/platform names don't need multi-word initials the way "Jean
// Dupont" does).
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}
