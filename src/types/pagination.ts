export interface SortObject {
    empty: boolean;
    sorted: boolean;
    unsorted: boolean;
}

export interface PageableObject {
    offset: number;
    sort: SortObject;
    pageNumber: number;
    pageSize: number;
    paged: boolean;
    unpaged: boolean;
}

export interface SpringPage<T> {
    content: T[];
    pageable: PageableObject;
    last: boolean;
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
    sort: SortObject;
    first: boolean;
    numberOfElements: number;
    empty: boolean;
}