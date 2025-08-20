export interface ApiResponse<T> {
  data: T
  success: boolean
  message?: string
  timestamp: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

export type SortOrder = 'asc' | 'desc'

export interface FilterOptions {
  team?: string
  position?: string
  sortBy?: string
  sortOrder?: SortOrder
}