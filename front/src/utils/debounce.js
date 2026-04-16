/**
 * Retorna função que só executa fn após ms sem novas chamadas.
 */
export function debounce(fn, ms = 300) {
    let t;
    return (...args) => {
        clearTimeout(t);
        t = setTimeout(() => fn(...args), ms);
    };
}
