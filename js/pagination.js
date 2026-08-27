/**
 * Pagination utility for admin panel lists.
 * Provides client-side pagination with configurable page sizes.
 */

const PAGINATION_DEFAULTS = {
  itemsPerPage: 25,
  pageSizes: [10, 25, 50, 100],
  showAllValue: 0, // Special value meaning "show all items"
  maxVisiblePages: 5,
};

/**
 * Create pagination state object.
 * @param {Object} options
 * @param {number} options.totalItems - Total number of items
 * @param {number} options.itemsPerPage - Items per page (default: 25)
 * @param {number} options.currentPage - Current page (1-indexed, default: 1)
 * @returns {Object} Pagination state
 */
export function createPaginationState({
  totalItems = 0,
  itemsPerPage = PAGINATION_DEFAULTS.itemsPerPage,
  currentPage = 1,
} = {}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  return {
    totalItems,
    itemsPerPage,
    currentPage: Math.min(Math.max(1, currentPage), totalPages),
    totalPages,
  };
}

/**
 * Get paginated items from a list.
 * @param {Array} items - Full list of items
 * @param {Object} state - Pagination state from createPaginationState
 * @returns {Array} Subset of items for the current page
 */
export function getPaginatedItems(items, state) {
  const { currentPage, itemsPerPage } = state;
  // If itemsPerPage is 0 ("Show All"), return all items
  if (itemsPerPage === 0) {
    return items;
  }
  const startIdx = (currentPage - 1) * itemsPerPage;
  return items.slice(startIdx, startIdx + itemsPerPage);
}

/**
 * Create pagination HTML controls.
 * @param {Object} state - Pagination state
 * @param {string} containerId - ID of the container element
 * @returns {HTMLElement} Pagination controls element
 */
export function createPaginationControls(state, containerId) {
  const { currentPage, totalPages, totalItems, itemsPerPage } = state;
  
  const wrapper = document.createElement("div");
  wrapper.className = "pagination-controls";
  wrapper.setAttribute("data-pagination-container", containerId);
  
  if (totalPages <= 1 && totalItems <= PAGINATION_DEFAULTS.pageSizes[0]) {
    // Don't show pagination if there's only one page and few items
    return wrapper;
  }
  
  // Check if "Show All" is active
  const showingAll = itemsPerPage === 0;
  
  // Page size selector
  const pageSizeWrap = document.createElement("div");
  pageSizeWrap.className = "pagination-page-size";
  const pageSizeLabel = document.createElement("span");
  pageSizeLabel.className = "meta";
  pageSizeLabel.textContent = "Show";
  pageSizeWrap.appendChild(pageSizeLabel);
  
  const pageSizeSelect = document.createElement("select");
  pageSizeSelect.className = "pagination-select";
  PAGINATION_DEFAULTS.pageSizes.forEach((size) => {
    const option = document.createElement("option");
    option.value = size;
    option.textContent = size;
    option.selected = size === itemsPerPage;
    pageSizeSelect.appendChild(option);
  });
  // Add "All" option
  const allOption = document.createElement("option");
  allOption.value = PAGINATION_DEFAULTS.showAllValue;
  allOption.textContent = "All";
  allOption.selected = showingAll;
  pageSizeSelect.appendChild(allOption);
  pageSizeSelect.addEventListener("change", (e) => {
    const event = new CustomEvent("pagination:pageSizeChange", {
      detail: { containerId, pageSize: Number(e.target.value) },
      bubbles: true,
    });
    wrapper.dispatchEvent(event);
  });
  pageSizeWrap.appendChild(pageSizeSelect);
  
  const perPageLabel = document.createElement("span");
  perPageLabel.className = "meta";
  perPageLabel.textContent = showingAll ? "showing all" : "per page";
  pageSizeWrap.appendChild(perPageLabel);
  wrapper.appendChild(pageSizeWrap);
  
  // Only show navigation buttons if not showing all
  if (!showingAll) {
    // Navigation buttons
    const navWrap = document.createElement("div");
    navWrap.className = "pagination-nav";
    
    // Previous button
    const prevBtn = document.createElement("button");
    prevBtn.type = "button";
    prevBtn.className = "pagination-btn";
    prevBtn.innerHTML = "&laquo; Prev";
    prevBtn.disabled = currentPage <= 1;
    prevBtn.addEventListener("click", () => {
      const event = new CustomEvent("pagination:pageChange", {
        detail: { containerId, page: currentPage - 1 },
        bubbles: true,
      });
      wrapper.dispatchEvent(event);
    });
    navWrap.appendChild(prevBtn);
    
    // Page numbers
    const pageNumbers = getPageNumbers(currentPage, totalPages, PAGINATION_DEFAULTS.maxVisiblePages);
    pageNumbers.forEach((pageNum) => {
      if (pageNum === "...") {
        const ellipsis = document.createElement("span");
        ellipsis.className = "pagination-ellipsis";
        ellipsis.textContent = "...";
        navWrap.appendChild(ellipsis);
      } else {
        const pageBtn = document.createElement("button");
        pageBtn.type = "button";
        pageBtn.className = `pagination-btn pagination-page-num ${pageNum === currentPage ? "active" : ""}`;
        pageBtn.textContent = pageNum;
        pageBtn.addEventListener("click", () => {
          const event = new CustomEvent("pagination:pageChange", {
            detail: { containerId, page: pageNum },
            bubbles: true,
          });
          wrapper.dispatchEvent(event);
        });
        navWrap.appendChild(pageBtn);
      }
    });
    
    // Next button
    const nextBtn = document.createElement("button");
    nextBtn.type = "button";
    nextBtn.className = "pagination-btn";
    nextBtn.innerHTML = "Next &raquo;";
    nextBtn.disabled = currentPage >= totalPages;
    nextBtn.addEventListener("click", () => {
      const event = new CustomEvent("pagination:pageChange", {
        detail: { containerId, page: currentPage + 1 },
        bubbles: true,
      });
      wrapper.dispatchEvent(event);
    });
    navWrap.appendChild(nextBtn);
    
    wrapper.appendChild(navWrap);
  }
  
  // Info text
  const info = document.createElement("div");
  info.className = "pagination-info";
  if (showingAll) {
    info.textContent = `Showing all ${totalItems} items`;
  } else {
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);
    info.textContent = `Showing ${startItem}-${endItem} of ${totalItems} items`;
  }
  wrapper.appendChild(info);
  
  return wrapper;
}

/**
 * Calculate which page numbers to display.
 * @param {number} current - Current page
 * @param {number} total - Total pages
 * @param {number} maxVisible - Maximum visible page numbers
 * @returns {Array} Array of page numbers and "..." placeholders
 */
function getPageNumbers(current, total, maxVisible) {
  if (total <= maxVisible) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  
  const pages = [];
  const halfVisible = Math.floor(maxVisible / 2);
  
  let start = Math.max(1, current - halfVisible);
  let end = Math.min(total, start + maxVisible - 1);
  
  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1);
  }
  
  if (start > 1) {
    pages.push(1);
    if (start > 2) {
      pages.push("...");
    }
  }
  
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  
  if (end < total) {
    if (end < total - 1) {
      pages.push("...");
    }
    pages.push(total);
  }
  
  return pages;
}

/**
 * Pagination controller class for managing state and rendering.
 */
export class PaginationController {
  constructor(containerId, options = {}) {
    this.containerId = containerId;
    this.itemsPerPage = options.itemsPerPage || PAGINATION_DEFAULTS.itemsPerPage;
    this.currentPage = 1;
    this.totalItems = 0;
    this.renderCallback = options.renderCallback || (() => {});
    
    this._handlePageChange = this._handlePageChange.bind(this);
    this._handlePageSizeChange = this._handlePageSizeChange.bind(this);
    
    // Listen for pagination events
    document.addEventListener("pagination:pageChange", this._handlePageChange);
    document.addEventListener("pagination:pageSizeChange", this._handlePageSizeChange);
  }
  
  destroy() {
    document.removeEventListener("pagination:pageChange", this._handlePageChange);
    document.removeEventListener("pagination:pageSizeChange", this._handlePageSizeChange);
  }
  
  update(totalItems) {
    this.totalItems = totalItems;
    const state = createPaginationState({
      totalItems,
      itemsPerPage: this.itemsPerPage,
      currentPage: this.currentPage,
    });
    this.currentPage = state.currentPage;
    return state;
  }
  
  getPageItems(allItems) {
    // If showing all items, return the full array
    if (this.itemsPerPage === 0) {
      return allItems;
    }
    const state = createPaginationState({
      totalItems: allItems.length,
      itemsPerPage: this.itemsPerPage,
      currentPage: this.currentPage,
    });
    return getPaginatedItems(allItems, state);
  }
  
  getState() {
    // If showing all items, return a state with 1 page
    if (this.itemsPerPage === 0) {
      return {
        totalItems: this.totalItems,
        itemsPerPage: 0,
        currentPage: 1,
        totalPages: 1,
      };
    }
    return createPaginationState({
      totalItems: this.totalItems,
      itemsPerPage: this.itemsPerPage,
      currentPage: this.currentPage,
    });
  }
  
  renderControls(container) {
    if (!container) return;
    
    // Remove existing pagination controls
    const existing = container.querySelector(".pagination-controls");
    if (existing) existing.remove();
    
    const state = this.getState();
    const controls = createPaginationControls(state, this.containerId);
    container.appendChild(controls);
  }
  
  _handlePageChange(event) {
    if (event.detail.containerId !== this.containerId) return;
    this.currentPage = event.detail.page;
    this.renderCallback();
  }
  
  _handlePageSizeChange(event) {
    if (event.detail.containerId !== this.containerId) return;
    // Maintain approximate position when changing page size
    const firstVisibleItem = (this.currentPage - 1) * this.itemsPerPage;
    this.itemsPerPage = event.detail.pageSize;
    this.currentPage = Math.max(1, Math.floor(firstVisibleItem / this.itemsPerPage) + 1);
    this.renderCallback();
  }
}

export default {
  createPaginationState,
  getPaginatedItems,
  createPaginationControls,
  PaginationController,
};
