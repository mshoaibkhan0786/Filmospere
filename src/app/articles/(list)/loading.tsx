
import ArticleIndexSkeleton from '../../../components/ArticleIndexSkeleton';


export default function Loading() {
    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#141414', color: 'white' }}>

            <div className="container" style={{ padding: '40px 20px', maxWidth: '1200px', margin: '0 auto' }}>
                <ArticleIndexSkeleton />
            </div>

        </div>
    );
}
