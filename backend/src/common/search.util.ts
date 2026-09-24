/**
 * Escapes the two characters TypeORM's `ILIKE` treats as wildcards ("%"
 * and "_") so a user searching for, say, a client named "50%" or an
 * email containing "_" gets a literal match instead of those characters
 * being read as SQL pattern syntax. Must run before the term is wrapped
 * in `%...%` for the actual search.
 */
export function escapeLikeTerm(term: string): string {
  return term.replace(/[\\%_]/g, (ch) => `\\${ch}`);
}
