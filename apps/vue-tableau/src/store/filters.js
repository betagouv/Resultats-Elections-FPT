import { defineStore } from 'pinia'

const useFiltersStore = defineStore('filters', {
  state: () => ({
    activeFilters: [],
  }),

  getters: {
    getActiveFilters: (state) => state.activeFilters,
  },

  actions: {
    addFilter(filter) {
      this.activeFilters.push(filter)
    },
    removeFilter(filter) {
      this.activeFilters = this.activeFilters.filter(f => f.id !== filter.id)
    },
    resetFilters() {
      this.activeFilters = []
    },
  },
})

export { useFiltersStore }