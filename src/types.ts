import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface Book {
  key: string;
  title: string;
  author_name?: string[];
  author_key?: string[];
  first_publish_year?: number;
  cover_i?: number;
  edition_count?: number;
  subject?: string[];
  ratings_average?: number;
  ratings_count?: number;
  has_fulltext?: boolean;
  public_scan_b?: boolean;
  ia?: string[];
  language?: string[];
  isbn?: string[];
}

export interface WorkDetails {
  key: string;
  title: string;
  description?: string | { value: string };
  covers?: number[];
  subjects?: string[];
  first_publish_date?: string;
  authors?: { author: { key: string }; type: { key: string } }[];
  excerpts?: { excerpt: string; author: { key: string } }[];
  links?: { url: string; title: string }[];
}

export interface Edition {
  key: string;
  title: string;
  publish_date?: string;
  publishers?: string[];
  isbn_10?: string[];
  isbn_13?: string[];
  number_of_pages?: number;
  languages?: { key: string }[];
  covers?: number[];
}

export interface Author {
  key: string;
  name: string;
  birth_date?: string;
  death_date?: string;
  bio?: string | { value: string };
  photos?: number[];
}

export interface AuthorWork {
  key: string;
  title: string;
  covers?: number[];
}
