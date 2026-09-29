export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD') // Normalise les accents
    .replace(/[\u0300-\u036f]/g, '') // Retire les accents
    .replace(/[^a-z0-9 -]/g, '') // Supprime les caractères non alphanumériques
    .replace(/\s+/g, '-') // Remplace les espaces par des tirets
    .replace(/-+/g, '-') // Supprime les tirets consécutifs
    .replace(/^-+|-+$/g, '') // Enlève les tirets en début et fin
}
