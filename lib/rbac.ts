export const ROLE_PATH_PREFIX: Record<string, string> = {
  admin: '_admin',
  client: '_company',
  candidate: '_candidate',
};

export function getPathPrefixForRole(role: string): string | undefined {
  return ROLE_PATH_PREFIX[role];
} 