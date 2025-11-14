import { Paper, PlatformSource } from './paper.js';

export interface SearchQuery {
  query: string;
  field?: SearchField;
  
  sources?: PlatformSource[];
  categories?: string[];
  dateRange?: DateRange;
  
  sortBy?: SortField;
  sortOrder?: SortOrder;
  limit?: number;
  offset?: number;
  
  filters?: SearchFilter[];
  options?: SearchOptions;
}

export enum SearchField {
  ALL = 'all',
  TITLE = 'title',
  ABSTRACT = 'abstract',
  AUTHOR = 'author',
  KEYWORDS = 'keywords',
  FULLTEXT = 'fulltext'
}

export enum SortField {
  RELEVANCE = 'relevance',
  DATE = 'date',
  CITATIONS = 'citations',
  TITLE = 'title'
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc'
}

export interface DateRange {
  start?: Date;
  end?: Date;
}

export interface SearchFilter {
  field: string;
  operator: FilterOperator;
  value: any;
}

export enum FilterOperator {
  EQUALS = 'eq',
  NOT_EQUALS = 'ne',
  CONTAINS = 'contains',
  STARTS_WITH = 'starts_with',
  GREATER_THAN = 'gt',
  LESS_THAN = 'lt',
  IN = 'in',
  NOT_IN = 'not_in'
}

export interface SearchOptions {
  fuzzyMatch?: boolean;
  caseSensitive?: boolean;
  includeFullText?: boolean;
  language?: string[];
}

export interface SearchResult {
  papers: Paper[];
  total: number;
  query: SearchQuery;
  took: number;
  warnings?: string[];
  metadata: SearchResultMetadata;
}

export interface SearchResultMetadata {
  sources: {
    [key in PlatformSource]?: number;
  };
  hasMore: boolean;
  nextOffset?: number;
}