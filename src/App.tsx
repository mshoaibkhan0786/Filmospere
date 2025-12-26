import { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { MovieProvider } from './context/MovieContext';
import { ConfigProvider } from './context/ConfigContext';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import PageSkeleton from './components/PageSkeleton';
import ArticleSkeleton from './components/ArticleSkeleton';
import ArticleIndexSkeleton from './components/ArticleIndexSkeleton';

import ScrollToTop from './components/ScrollToTop';

// Lazy load pages
const Home = lazy(() => import('./pages/Home'));
const MoviePage = lazy(() => import('./pages/MoviePage'));
const SectionPage = lazy(() => import('./pages/SectionPage'));
const PersonPage = lazy(() => import('./pages/PersonPage'));
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'));
const Dashboard = lazy(() => import('./pages/admin/Dashboard'));
const MovieList = lazy(() => import('./pages/admin/MovieList'));
const MovieEditor = lazy(() => import('./pages/admin/MovieEditor'));
const SectionsManager = lazy(() => import('./pages/admin/SectionsManager'));
const Settings = lazy(() => import('./pages/admin/Settings'));
const CastManager = lazy(() => import('./pages/admin/CastManager'));
const Login = lazy(() => import('./pages/admin/Login'));
const AdminArticlesPage = lazy(() => import('./pages/admin/AdminArticlesPage'));
const AdminArticleEditor = lazy(() => import('./pages/admin/AdminArticleEditor'));


const ArticlesIndexPage = lazy(() => import('./pages/ArticlesIndexPage'));
const ArticlePage = lazy(() => import('./pages/ArticlePage'));

// Legal Pages
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));
const Contact = lazy(() => import('./pages/Contact'));
const About = lazy(() => import('./pages/About'));

function App() {
  return (
    <ConfigProvider>
      <AuthProvider>
        <MovieProvider>
          <ScrollToTop />
          <Suspense fallback={<PageSkeleton />}>
            <Routes>
              {/* Main Site Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/movie/:id" element={<MoviePage />} />
              <Route path="/section/:title" element={<SectionPage />} />
              <Route path="/person/:id" element={<PersonPage />} />

              {/* Articles Routes */}
              <Route path="/articles" element={
                <Suspense fallback={<ArticleIndexSkeleton />}>
                  <ArticlesIndexPage />
                </Suspense>
              } />
              <Route path="/articles/:slug" element={
                <Suspense fallback={<ArticleSkeleton />}>
                  <ArticlePage />
                </Suspense>
              } />

              {/* Legal Pages */}
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/about" element={<About />} />

              {/* Admin Routes */}
              <Route path="/admin/login" element={<Login />} />

              <Route element={<ProtectedRoute />}>
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<Dashboard />} />
                  <Route path="movies" element={<MovieList />} />
                  <Route path="movies/new" element={<MovieEditor />} />
                  <Route path="movies/edit/:id" element={<MovieEditor />} />
                  <Route path="cast" element={<CastManager />} />
                  <Route path="sections" element={<SectionsManager />} />
                  <Route path="articles" element={<AdminArticlesPage />} />
                  <Route path="articles/new" element={<AdminArticleEditor />} />
                  <Route path="articles/edit/:slug" element={<AdminArticleEditor />} />
                  <Route path="settings" element={<Settings />} />

                </Route>
              </Route>
            </Routes>
          </Suspense>
        </MovieProvider>
      </AuthProvider >
    </ConfigProvider >
  );
}

export default App;
