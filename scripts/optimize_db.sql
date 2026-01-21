-- 1. Accelerate Movie Page Loads (The 1.3s delay fix)
-- Indexes the 'slug' field inside the JSON data.
CREATE INDEX IF NOT EXISTS idx_movies_data_slug 
ON public.movies ((data->>'slug'));

-- 2. Accelerate ID lookups inside JSON (The 1.0s delay fix)
-- Necessary if you look up TMDB IDs frequently
CREATE INDEX IF NOT EXISTS idx_movies_data_id 
ON public.movies ((data->>'id'));

-- 3. Accelerate Filtering & Tag Search (The @> query fix)
-- Allows extremely fast "Contains" checks for tags, cast, etc.
CREATE INDEX IF NOT EXISTS idx_movies_data_gin 
ON public.movies USING gin (data);

-- 4. Accelerate Title Search (Optional but recommended for Search Bar)
-- Requires pg_trgm extension for fuzzy text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_movies_data_title_search 
ON public.movies USING gin ((data->>'title') gin_trgm_ops);
