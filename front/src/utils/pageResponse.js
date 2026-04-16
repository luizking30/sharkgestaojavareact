/**
 * Normaliza resposta Spring Data Page ou array legado.
 */
export function unwrapPage(data) {
    if (data && Array.isArray(data.content)) {
        return {
            items: data.content,
            totalElements: data.totalElements ?? data.content.length,
            totalPages: data.totalPages ?? 1,
            number: data.number ?? 0,
            size: data.size ?? data.content.length,
        };
    }
    const arr = Array.isArray(data) ? data : [];
    return {
        items: arr,
        totalElements: arr.length,
        totalPages: 1,
        number: 0,
        size: arr.length,
    };
}
