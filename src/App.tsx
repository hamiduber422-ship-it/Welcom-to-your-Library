import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Search, Book as BookIcon, User, Home, ArrowLeft, Loader2, Star, BookOpen, Clock, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, type Book, type WorkDetails, type Author, type AuthorWork, type Edition } from './types';

// --- API Helpers ---
const API_BASE = 'https://openlibrary.org';

const getCoverUrl = (id: number | string | undefined, size: 'S' | 'M' | 'L' = 'M', type: 'b' | 'a' = 'b', key: string = 'id') => {
  if (!id) return null;
  return `https://covers.openlibrary.org/${type}/${key}/${id}-${size}.jpg?default=false`;
};

const FALLBACK_BOOK = 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=600&h=900';
const FALLBACK_AUTHOR = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=400&h=400';

async function fetchJson(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
}

// --- Components ---

const Navbar = () => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <nav className="sticky top-0 z-50 glass border-b border-black/5 px-6 py-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 bg-brand-ink text-white rounded-lg flex items-center justify-center group-hover:rotate-12 transition-transform">
            <BookIcon size={24} />
          </div>
          <span className="font-serif text-2xl font-bold tracking-tight">Welcome to your Library</span>
        </Link>

        <form onSubmit={handleSearch} className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-black/40" size={18} />
          <input
            type="text"
            placeholder="Search books, authors, ISBNs..."
            className="w-full bg-black/5 border-none rounded-full py-2 pl-10 pr-4 focus:ring-2 focus:ring-brand-accent transition-all outline-none"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </form>

        <div className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link to="/" className="hover:text-brand-accent transition-colors">Home</Link>
          <Link to="/trending" className="hover:text-brand-accent transition-colors">Trending</Link>
        </div>
      </div>
    </nav>
  );
};

const BookCard: React.FC<{ book: Book }> = ({ book }) => {
  const [imgSrc, setImgSrc] = useState(getCoverUrl(book.cover_i, 'M') || FALLBACK_BOOK);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      className="group"
    >
      <Link to={`/book${book.key}`}>
        <div className="aspect-[2/3] rounded-xl overflow-hidden book-shadow mb-4 relative">
          <img 
            src={imgSrc} 
            alt={book.title}
            onError={() => setImgSrc(FALLBACK_BOOK)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="bg-white text-brand-ink px-4 py-2 rounded-full text-sm font-bold shadow-xl">
              View Details
            </div>
          </div>
        </div>
        <h3 className="font-serif text-lg font-bold leading-tight mb-1 group-hover:text-brand-accent transition-colors line-clamp-2">
          {book.title}
        </h3>
        <p className="text-sm text-black/60 line-clamp-1">
          {book.author_name?.join(', ') || 'Unknown Author'}
        </p>
        {book.ratings_average && (
          <div className="flex items-center gap-1 mt-2 text-xs font-bold text-amber-600">
            <Star size={12} fill="currentColor" />
            <span>{book.ratings_average.toFixed(1)}</span>
          </div>
        )}
      </Link>
    </motion.div>
  );
};

const HomePage = () => {
  const [categoriesData, setCategoriesData] = useState<Record<string, Book[]>>({});
  const [loading, setLoading] = useState(true);

  const categories = [
    { title: "Timeless Fiction", query: "fiction" },
    { title: "Mystery & Thriller", query: "mystery" },
    { title: "Science Fiction", query: "science_fiction" },
    { title: "Fantasy Worlds", query: "fantasy" },
    { title: "Science & Technology", query: "science" },
    { title: "Historical Journeys", query: "history" },
    { title: "Biographies", query: "biography" },
    { title: "Art & Design", query: "art" },
    { title: "Philosophy", query: "philosophy" },
  ];

  useEffect(() => {
    const fetchAllCategories = async () => {
      setLoading(true);
      const seenKeys = new Set<string>();
      const newData: Record<string, Book[]> = {};

      try {
        // Fetch categories sequentially to avoid race conditions with seenKeys
        // and to respect the "don't show same book" rule across sections
        for (const cat of categories) {
          const fields = 'key,title,author_name,cover_i,ratings_average,first_publish_year';
          // Fetch more than 12 to allow for filtering duplicates
          const data = await fetchJson(`${API_BASE}/search.json?q=subject:${cat.query}&limit=20&sort=rating&fields=${fields}`);
          
          const filteredBooks = data.docs
            .filter((book: Book) => !seenKeys.has(book.key))
            .slice(0, 12);

          filteredBooks.forEach((book: Book) => seenKeys.add(book.key));
          newData[cat.query] = filteredBooks;
        }
        setCategoriesData(newData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllCategories();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <header className="mb-20 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="font-serif text-5xl md:text-8xl font-bold mb-6 leading-tight">
            Welcome to <span className="italic text-brand-accent underline decoration-brand-accent/30 underline-offset-8">your Library</span>
          </h1>
          <p className="text-xl text-black/50 max-w-2xl mx-auto font-medium">
            Explore highly-rated masterpieces across diverse genres, handpicked from the world's largest open book database.
          </p>
        </motion.div>
      </header>

      {categories.map((cat) => {
        const books = categoriesData[cat.query];
        
        if (loading) return (
          <div key={cat.query} className="mb-20">
            <h2 className="text-2xl font-bold font-serif mb-8 border-l-4 border-brand-accent pl-4">{cat.title}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="aspect-[2/3] bg-black/5 animate-pulse rounded-xl" />
              ))}
            </div>
          </div>
        );

        if (!books || books.length === 0) return null;

        return (
          <section key={cat.query} className="mb-20">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold font-serif border-l-4 border-brand-accent pl-4">{cat.title}</h2>
              <Link to={`/search?q=subject:${cat.query}`} className="text-xs font-bold uppercase tracking-widest text-brand-accent hover:underline">Explore More</Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-8">
              {books.map((book) => (
                <BookCard key={book.key} book={book} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
};

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const page = parseInt(searchParams.get('page') || '1');
  const sort = searchParams.get('sort') || 'relevance';
  
  const [results, setResults] = useState<Book[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query) return;
    const performSearch = async () => {
      setLoading(true);
      try {
        const fields = 'key,title,author_name,cover_i,ratings_average,first_publish_year,edition_count';
        const url = `${API_BASE}/search.json?q=${encodeURIComponent(query)}&page=${page}&sort=${sort}&fields=${fields}&limit=24`;
        const data = await fetchJson(url);
        setResults(data.docs);
        setTotalResults(data.num_found);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    performSearch();
  }, [query, page, sort]);

  const handlePageChange = (newPage: number) => {
    setSearchParams({ q: query, page: newPage.toString(), sort });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSortChange = (newSort: string) => {
    setSearchParams({ q: query, page: '1', sort: newSort });
  };

  const totalPages = Math.ceil(totalResults / 24);

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-widest text-black/40 mb-2">
            {totalResults.toLocaleString()} results found
          </h2>
          <h1 className="text-3xl font-serif font-bold italic">"{query}"</h1>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm font-bold text-black/40">Sort by:</span>
          <select 
            value={sort}
            onChange={(e) => handleSortChange(e.target.value)}
            className="bg-white border border-black/10 rounded-lg px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-brand-accent"
          >
            <option value="relevance">Relevance</option>
            <option value="new">Newest</option>
            <option value="old">Oldest</option>
            <option value="rating">Top Rated</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-brand-accent" size={40} />
        </div>
      ) : results.length > 0 ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-8 mb-16">
            {results.map((book) => (
              <BookCard key={book.key} book={book} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                disabled={page === 1}
                onClick={() => handlePageChange(page - 1)}
                className="px-4 py-2 rounded-lg border border-black/10 text-sm font-bold disabled:opacity-30 hover:bg-black/5 transition-colors"
              >
                Previous
              </button>
              <div className="flex items-center gap-1">
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  let pageNum = page;
                  if (page <= 3) pageNum = i + 1;
                  else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
                  else pageNum = page - 2 + i;
                  
                  if (pageNum <= 0 || pageNum > totalPages) return null;

                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={cn(
                        "w-10 h-10 rounded-lg text-sm font-bold transition-all",
                        page === pageNum 
                          ? "bg-brand-ink text-white" 
                          : "hover:bg-black/5"
                      )}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <button
                disabled={page === totalPages}
                onClick={() => handlePageChange(page + 1)}
                className="px-4 py-2 rounded-lg border border-black/10 text-sm font-bold disabled:opacity-30 hover:bg-black/5 transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-20">
          <p className="text-xl text-black/40">No books found for your search.</p>
        </div>
      )}
    </div>
  );
};

const BookDetailsPage = () => {
  const { '*': workId } = useParams();
  const [details, setDetails] = useState<WorkDetails | null>(null);
  const [edition, setEdition] = useState<Edition | null>(null);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [moreByAuthor, setMoreByAuthor] = useState<AuthorWork[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      try {
        // 1. Fetch Work Details
        const data = await fetchJson(`${API_BASE}/works/${workId}.json`);
        setDetails(data);

        // 2. Fetch Best Edition (to get ISBN, pages, etc.)
        const editionsData = await fetchJson(`${API_BASE}/works/${workId}/editions.json?limit=1`);
        if (editionsData.entries?.[0]) {
          setEdition(editionsData.entries[0]);
        }

        // 3. Fetch Author Details
        if (data.authors) {
          const authorPromises = data.authors.map((a: any) => 
            fetchJson(`${API_BASE}${a.author.key}.json`)
          );
          const authorData = await Promise.all(authorPromises);
          setAuthors(authorData);

          // 4. Fetch More by the first author
          if (authorData[0]) {
            const authorId = authorData[0].key.split('/').pop();
            const worksData = await fetchJson(`${API_BASE}/authors/${authorId}/works.json?limit=6`);
            setMoreByAuthor(worksData.entries.filter((w: any) => w.key !== `/works/${workId}`));
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [workId]);

  const [imgSrc, setImgSrc] = useState<string>(FALLBACK_BOOK);

  useEffect(() => {
    if (details?.covers?.[0]) {
      setImgSrc(getCoverUrl(details.covers[0], 'L') || FALLBACK_BOOK);
    } else if (edition?.covers?.[0]) {
      setImgSrc(getCoverUrl(edition.covers[0], 'L') || FALLBACK_BOOK);
    }
  }, [details, edition]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="animate-spin text-brand-accent" size={40} />
    </div>
  );

  if (!details) return <div>Not found</div>;

  const description = typeof details.description === 'string' 
    ? details.description 
    : details.description?.value || 'No description available.';

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm font-bold text-brand-accent mb-8 hover:translate-x-[-4px] transition-transform"
      >
        <ArrowLeft size={16} /> Back
      </button>

      <div className="grid lg:grid-cols-[450px_1fr] gap-16 mb-24">
        <div className="space-y-8">
          <div className="book-shadow rounded-2xl overflow-hidden aspect-[2/3] sticky top-24">
            <img 
              src={imgSrc} 
              alt={details.title} 
              onError={() => setImgSrc(FALLBACK_BOOK)}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-white rounded-xl border border-black/5">
              <span className="block text-[10px] font-bold text-black/40 uppercase mb-1">First Published</span>
              <span className="font-medium flex items-center gap-2 text-sm">
                <Clock size={14} className="text-brand-accent" />
                {details.first_publish_date || 'Unknown'}
              </span>
            </div>
            {edition?.number_of_pages && (
              <div className="p-4 bg-white rounded-xl border border-black/5">
                <span className="block text-[10px] font-bold text-black/40 uppercase mb-1">Pages</span>
                <span className="font-medium flex items-center gap-2 text-sm">
                  <BookOpen size={14} className="text-brand-accent" />
                  {edition.number_of_pages}
                </span>
              </div>
            )}
          </div>
        </div>

        <div>
          <h1 className="font-serif text-5xl md:text-7xl font-bold mb-6 leading-tight">{details.title}</h1>
          
          <div className="flex flex-wrap gap-4 mb-6">
            {authors.map(author => (
              <Link 
                key={author.key} 
                to={`/author${author.key}`}
                className="flex items-center gap-2 bg-brand-accent/10 text-brand-accent px-4 py-2 rounded-full text-sm font-bold hover:bg-brand-accent hover:text-white transition-all"
              >
                <User size={16} />
                {author.name}
              </Link>
            ))}
          </div>

          <div className="flex flex-wrap gap-4 items-center mb-12">
            <a 
              href={`${API_BASE}${details.key}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-bold text-black/40 hover:text-brand-accent transition-colors"
            >
              View on Open Library <ExternalLink size={12} />
            </a>
            <div className="h-4 w-px bg-black/10 hidden sm:block" />
            <div className="flex gap-3">
              <a href={`${API_BASE}${details.key}.json`} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold uppercase tracking-wider text-black/30 hover:text-brand-accent">JSON</a>
              <a href={`${API_BASE}${details.key}.yml`} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold uppercase tracking-wider text-black/30 hover:text-brand-accent">YAML</a>
              <a href={`${API_BASE}${details.key}.rdf`} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold uppercase tracking-wider text-black/30 hover:text-brand-accent">RDF</a>
            </div>
          </div>

          <div className="prose prose-stone max-w-none mb-16">
            <h3 className="text-2xl font-serif font-bold mb-6 border-b border-black/5 pb-2">About this book</h3>
            <p className="text-black/70 leading-relaxed whitespace-pre-wrap text-lg">
              {description}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-12 mb-16">
            {details.subjects && details.subjects.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-black/40 uppercase tracking-widest mb-4">Subjects</h4>
                <div className="flex flex-wrap gap-2">
                  {details.subjects.slice(0, 10).map(s => (
                    <span key={s} className="text-xs bg-black/5 px-3 py-1 rounded-full font-medium">{s}</span>
                  ))}
                </div>
              </div>
            )}
            
            {(edition?.isbn_10 || edition?.isbn_13 || edition?.publishers) && (
              <div>
                <h4 className="text-xs font-bold text-black/40 uppercase tracking-widest mb-4">Bibliographic Info</h4>
                <dl className="space-y-3 text-sm">
                  {edition.publishers && (
                    <div className="flex justify-between border-b border-black/5 pb-1">
                      <dt className="text-black/40">Publisher</dt>
                      <dd className="font-medium text-right">{edition.publishers[0]}</dd>
                    </div>
                  )}
                  {edition.isbn_10 && (
                    <div className="flex justify-between border-b border-black/5 pb-1">
                      <dt className="text-black/40">ISBN-10</dt>
                      <dd className="font-mono font-medium">{edition.isbn_10[0]}</dd>
                    </div>
                  )}
                  {edition.isbn_13 && (
                    <div className="flex justify-between border-b border-black/5 pb-1">
                      <dt className="text-black/40">ISBN-13</dt>
                      <dd className="font-mono font-medium">{edition.isbn_13[0]}</dd>
                    </div>
                  )}
                </dl>
              </div>
            )}
          </div>

          {details.excerpts && details.excerpts.length > 0 && (
            <div className="mb-16">
              <h4 className="text-xs font-bold text-black/40 uppercase tracking-widest mb-6">Excerpt</h4>
              <blockquote className="border-l-4 border-brand-accent pl-6 py-2 italic text-black/60 text-lg leading-relaxed">
                "{details.excerpts[0].excerpt}"
              </blockquote>
            </div>
          )}
        </div>
      </div>

      {moreByAuthor.length > 0 && (
        <section className="border-t border-black/5 pt-16">
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-3xl font-serif font-bold">More by {authors[0]?.name}</h2>
            <Link to={`/author${authors[0]?.key}`} className="text-sm font-bold text-brand-accent hover:underline">View all works</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-8">
            {moreByAuthor.map((work) => (
              <AuthorWorkCard key={work.key} work={work} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

const AuthorPage = () => {
  const { '*': authorId } = useParams();
  const [author, setAuthor] = useState<Author | null>(null);
  const [works, setWorks] = useState<AuthorWork[]>([]);
  const [loading, setLoading] = useState(true);
  const [photoSrc, setPhotoSrc] = useState<string>(FALLBACK_AUTHOR);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAuthor = async () => {
      setLoading(true);
      try {
        const authorData = await fetchJson(`${API_BASE}/authors/${authorId}.json`);
        setAuthor(authorData);
        if (authorData.photos?.[0]) {
          setPhotoSrc(getCoverUrl(authorData.photos[0], 'L', 'a') || FALLBACK_AUTHOR);
        }

        const worksData = await fetchJson(`${API_BASE}/authors/${authorId}/works.json?limit=12`);
        setWorks(worksData.entries);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAuthor();
  }, [authorId]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="animate-spin text-brand-accent" size={40} />
    </div>
  );

  if (!author) return <div>Not found</div>;

  const bio = typeof author.bio === 'string' 
    ? author.bio 
    : author.bio?.value || 'No biography available.';

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm font-bold text-brand-accent mb-8 hover:translate-x-[-4px] transition-transform"
      >
        <ArrowLeft size={16} /> Back
      </button>

      <div className="grid md:grid-cols-[300px_1fr] gap-12 mb-20">
        <div className="aspect-square rounded-2xl overflow-hidden shadow-2xl bg-black/5">
          <img 
            src={photoSrc} 
            alt={author.name} 
            onError={() => setPhotoSrc(FALLBACK_AUTHOR)}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>

        <div>
          <h1 className="font-serif text-5xl md:text-7xl font-bold mb-6">{author.name}</h1>
          
          <div className="flex gap-8 mb-8 text-sm font-bold text-black/40">
            {author.birth_date && <span>Born: {author.birth_date}</span>}
            {author.death_date && <span>Died: {author.death_date}</span>}
          </div>

          <div className="flex flex-wrap gap-4 items-center mb-8">
            <a 
              href={`${API_BASE}/authors/${authorId}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-bold text-black/40 hover:text-brand-accent transition-colors"
            >
              View on Open Library <ExternalLink size={12} />
            </a>
            <div className="h-4 w-px bg-black/10 hidden sm:block" />
            <div className="flex gap-3">
              <a href={`${API_BASE}/authors/${authorId}.json`} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold uppercase tracking-wider text-black/30 hover:text-brand-accent">JSON</a>
              <a href={`${API_BASE}/authors/${authorId}.yml`} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold uppercase tracking-wider text-black/30 hover:text-brand-accent">YAML</a>
              <a href={`${API_BASE}/authors/${authorId}.rdf`} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold uppercase tracking-wider text-black/30 hover:text-brand-accent">RDF</a>
            </div>
          </div>

          <div className="prose prose-stone max-w-none">
            <h3 className="text-xl font-serif font-bold mb-4">Biography</h3>
            <p className="text-black/70 leading-relaxed whitespace-pre-wrap">
              {bio}
            </p>
          </div>
        </div>
      </div>

      <section>
        <h2 className="text-3xl font-serif font-bold mb-8">Works by {author.name}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-8">
          {works.map((work) => (
            <AuthorWorkCard key={work.key} work={work} />
          ))}
        </div>
      </section>
    </div>
  );
};

const AuthorWorkCard: React.FC<{ work: AuthorWork }> = ({ work }) => {
  const [imgSrc, setImgSrc] = useState(getCoverUrl(work.covers?.[0], 'M') || FALLBACK_BOOK);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      className="group"
    >
      <Link to={`/book${work.key}`}>
        <div className="aspect-[2/3] rounded-xl overflow-hidden book-shadow mb-4">
          <img 
            src={imgSrc} 
            alt={work.title}
            onError={() => setImgSrc(FALLBACK_BOOK)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            referrerPolicy="no-referrer"
          />
        </div>
        <h3 className="font-serif text-lg font-bold leading-tight group-hover:text-brand-accent transition-colors line-clamp-2">
          {work.title}
        </h3>
      </Link>
    </motion.div>
  );
};

const Footer = () => (
  <footer className="border-t border-black/5 py-16 px-6 mt-20 bg-white">
    <div className="max-w-7xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-ink text-white rounded-lg flex items-center justify-center">
              <BookIcon size={18} />
            </div>
            <span className="font-serif font-bold text-xl tracking-tight">Welcome to your Library</span>
          </div>
          <p className="text-sm text-black/50 max-w-sm leading-relaxed">
            A curated gateway to the world's largest open book database. 
            Discover, explore, and export bibliographic data with ease.
          </p>
          <p className="text-xs font-bold text-black/30 uppercase tracking-widest">
            © {new Date().getFullYear()} Welcome to your Library. All rights reserved.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-4">
            <h4 className="text-[10px] font-bold text-black/40 uppercase tracking-[0.2em]">Legal</h4>
            <ul className="space-y-2 text-sm font-medium text-black/60">
              <li><Link to="/privacy" className="hover:text-brand-accent transition-colors">Privacy Policy</Link></li>
              <li><Link to="/dmca" className="hover:text-brand-accent transition-colors">DMCA Notice</Link></li>
              <li><Link to="/about" className="hover:text-brand-accent transition-colors">About Us</Link></li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="text-[10px] font-bold text-black/40 uppercase tracking-[0.2em]">Resources</h4>
            <ul className="space-y-2 text-sm font-medium text-black/60">
              <li><a href="https://openlibrary.org/developers/api" target="_blank" rel="noopener noreferrer" className="hover:text-brand-accent transition-colors">API Docs</a></li>
              <li><a href="https://openlibrary.org" target="_blank" rel="noopener noreferrer" className="hover:text-brand-accent transition-colors">Open Library</a></li>
            </ul>
          </div>
        </div>
      </div>
      
      <div className="pt-8 border-t border-black/5 flex flex-col sm:flex-row justify-between items-center gap-4">
        <p className="text-[10px] text-black/30 font-bold uppercase tracking-widest">
          Data provided by <a href="https://openlibrary.org" target="_blank" rel="noopener noreferrer" className="underline hover:text-brand-accent">Open Library</a>
        </p>
        <div className="flex gap-6">
          <span className="text-[10px] text-black/20 font-bold uppercase tracking-widest cursor-default">v1.2.0</span>
        </div>
      </div>
    </div>
  </footer>
);

const AboutPage = () => (
  <div className="max-w-3xl mx-auto px-6 py-20">
    <h1 className="font-serif text-5xl font-bold mb-8">About Welcome to your Library</h1>
    <div className="prose prose-stone prose-lg max-w-none text-black/70 leading-relaxed">
      <p>
        Welcome to your Library is a modern, high-performance web application designed to provide a curated and elegant interface for the <strong>Open Library</strong> database.
      </p>
      <p>
        Our mission is to make the world's literary heritage more accessible and discoverable. By leveraging the powerful APIs provided by the Internet Archive, we offer a unique way to browse millions of books, explore author bibliographies, and access structured data exports.
      </p>
      <h3 className="font-serif text-2xl font-bold text-black mt-12 mb-4">Our Data Source</h3>
      <p>
        All bibliographic data, covers, and author information are provided by <a href="https://openlibrary.org" target="_blank" rel="noopener noreferrer" className="text-brand-accent underline">Open Library</a>, an initiative of the Internet Archive, a 501(c)(3) non-profit. Open Library is an open, editable library catalog, building towards a web page for every book ever published.
      </p>
      <h3 className="font-serif text-2xl font-bold text-black mt-12 mb-4">Key Features</h3>
      <ul>
        <li><strong>Curated Discovery:</strong> Dynamic homepage sections featuring the highest-rated books across multiple genres.</li>
        <li><strong>Deep Search:</strong> Instant access to millions of titles and authors with advanced filtering.</li>
        <li><strong>Structured Exports:</strong> Direct links to JSON, YAML, and RDF data for every work and author.</li>
        <li><strong>Rich Metadata:</strong> Detailed bibliographic information including ISBNs, publishers, and excerpts.</li>
      </ul>
    </div>
  </div>
);

const PrivacyPage = () => (
  <div className="max-w-3xl mx-auto px-6 py-20">
    <h1 className="font-serif text-5xl font-bold mb-8">Privacy Policy</h1>
    <div className="prose prose-stone prose-lg max-w-none text-black/70 leading-relaxed">
      <p className="text-sm font-bold text-black/40 uppercase tracking-widest mb-8">Last Updated: March 2026</p>
      <p>
        At Welcome to your Library, we take your privacy seriously. This policy outlines how we handle information when you use our application.
      </p>
      <h3 className="font-serif text-2xl font-bold text-black mt-12 mb-4">1. Information Collection</h3>
      <p>
        Welcome to your Library is a "client-side" application. We do not maintain a user database and we do not collect, store, or share any personal information.
      </p>
      <h3 className="font-serif text-2xl font-bold text-black mt-12 mb-4">2. Third-Party Data</h3>
      <p>
        This application interacts directly with the <strong>Open Library API</strong>. When you search for books or view details, your browser makes requests to <code>openlibrary.org</code>. These requests are subject to Open Library's own privacy policy.
      </p>
      <h3 className="font-serif text-2xl font-bold text-black mt-12 mb-4">3. Cookies</h3>
      <p>
        We do not use tracking cookies or advertising pixels. Standard browser local storage may be used solely to improve your experience (e.g., remembering your last search).
      </p>
      <h3 className="font-serif text-2xl font-bold text-black mt-12 mb-4">4. External Links</h3>
      <p>
        Our site contains links to other websites. We are not responsible for the privacy practices or content of these external sites.
      </p>
    </div>
  </div>
);

const DMCAPage = () => (
  <div className="max-w-3xl mx-auto px-6 py-20">
    <h1 className="font-serif text-5xl font-bold mb-8">DMCA Notice</h1>
    <div className="prose prose-stone prose-lg max-w-none text-black/70 leading-relaxed">
      <p>
        Welcome to your Library is a search and discovery interface that displays data and images hosted by <strong>Open Library</strong> (an initiative of the Internet Archive).
      </p>
      <h3 className="font-serif text-2xl font-bold text-black mt-12 mb-4">Content Ownership</h3>
      <p>
        We do not host any of the book covers, descriptions, or bibliographic data displayed on this site. All such content is served directly from Open Library's servers.
      </p>
      <h3 className="font-serif text-2xl font-bold text-black mt-12 mb-4">Reporting Infringement</h3>
      <p>
        If you believe that your copyrighted work is being infringed upon by content displayed through our interface, you must direct your DMCA takedown notice to the primary host of the content:
      </p>
      <div className="bg-black/5 p-6 rounded-xl my-8">
        <p className="font-bold mb-2">Internet Archive / Open Library</p>
        <p>Attn: Copyright Agent</p>
        <p>300 Funston Ave.</p>
        <p>San Francisco, CA 94118</p>
        <p>Email: <a href="mailto:info@archive.org" className="text-brand-accent underline">info@archive.org</a></p>
      </div>
      <p>
        Once content is removed from Open Library, it will automatically cease to appear in Welcome to your Library.
      </p>
    </div>
  </div>
);

export default function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/book/*" element={<BookDetailsPage />} />
            <Route path="/author/*" element={<AuthorPage />} />
            <Route path="/trending" element={<SearchPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/dmca" element={<DMCAPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}
