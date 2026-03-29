/** Cabecera no enviable desde un formulario HTML cross-origin; mitiga CSRF junto a validación de Origin. */
export const BROWSER_MUTATION_HEADER_NAME = 'X-Requested-With';
export const BROWSER_MUTATION_HEADER_VALUE = 'XMLHttpRequest';
