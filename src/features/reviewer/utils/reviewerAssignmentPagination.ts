export function getReviewerAssignmentPagination(
  pages: readonly { items: readonly unknown[] }[],
  requestedPage: number,
  hasNextPage: boolean,
) {
  let availablePages = pages.length;
  if (!hasNextPage) {
    while (availablePages > 0 && pages[availablePages - 1].items.length === 0) {
      availablePages -= 1;
    }
  }

  return {
    currentPage: Math.max(1, Math.min(requestedPage, Math.max(1, availablePages))),
    totalPages: Math.max(1, availablePages + (hasNextPage ? 1 : 0)),
  };
}
