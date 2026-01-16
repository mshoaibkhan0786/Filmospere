import React from 'react';

interface RichTextRendererProps {
    content: string;
}

const RichTextRenderer: React.FC<RichTextRendererProps> = ({ content }) => {
    if (!content) return null;

    // Split by double newlines to get blocks
    const blocks = content.split(/\n\n+/);

    // Check for HTML content (starts with <)
    const isHtml = content.trim().startsWith('<');

    const styles = (
        <style>
            {`
            .article-content {
                font-family: 'Georgia', serif; /* Classic reading font */
                line-height: 1.8;
                color: #d1d1d1;
                font-size: 1.15rem;
            }
            .article-content h1, .article-h1 { font-family: var(--font-inter), sans-serif; font-size: 2.5rem; font-weight: 800; color: white; margin: 2.5rem 0 1.5rem; letter-spacing: -0.02em; }
            .article-content h2, .article-h2 { font-family: var(--font-inter), sans-serif; font-size: 2rem; font-weight: 700; color: white; margin: 3rem 0 1.5rem; border-left: 4px solid #e50914; padding-left: 1rem; }
            .article-content h3, .article-h3 { font-family: var(--font-inter), sans-serif; font-size: 1.5rem; font-weight: 600; color: #f5f5f5; margin: 2rem 0 1rem; }
            .article-content p, .article-p { margin-bottom: 1.5rem; }
            .article-content ul, .article-list { margin-bottom: 1.5rem; padding-left: 1.5rem; list-style-type: disc; }
            .article-content li, .article-list li { margin-bottom: 0.5rem; }
            .article-content blockquote, .article-quote { border-left: 3px solid #e50914; margin: 2rem 0; padding: 1rem 2rem; font-style: italic; background: rgba(255,255,255,0.05); border-radius: 0 8px 8px 0; color: #fff; }
            .article-content figure, .article-figure { margin: 3rem 0; width: 100%; }
            .article-content img, .article-img { width: 100%; border-radius: 12px; height: auto; display: block; max-width: 100%; }
            .article-content figcaption { text-align: center; color: #888; font-size: 0.9rem; margin-top: 0.5rem; font-family: var(--font-inter), sans-serif; }
            .article-content strong, .article-bold { font-weight: 700; }
            .article-content a { color: #e50914; text-decoration: underline; }
            
            @media (max-width: 768px) {
                .article-content { font-size: 1.1rem; }
                .article-content h2, .article-h2 { font-size: 1.7rem; }
            }
            `}
        </style>
    );

    if (isHtml) {
        return (
            <>
                <div className="article-content" dangerouslySetInnerHTML={{ __html: content }} />
                {styles}
            </>
        );
    }

    return (
        <div className="article-content">
            {blocks.map((block, index) => {
                const trimmed = block.trim();

                // Headers (# H1, ## H2, ### H3)
                if (trimmed.startsWith('# ')) {
                    return <h1 key={index} className="article-h1">{trimmed.replace('# ', '')}</h1>;
                }
                if (trimmed.startsWith('## ')) {
                    return <h2 key={index} className="article-h2">{trimmed.replace('## ', '')}</h2>;
                }
                if (trimmed.startsWith('### ')) {
                    return <h3 key={index} className="article-h3">{trimmed.replace('### ', '')}</h3>;
                }

                // Unordered Lists (- item)
                if (trimmed.startsWith('- ')) {
                    const items = trimmed.split('\n').map(line => line.replace(/^- /, '').trim());
                    return (
                        <ul key={index} className="article-list">
                            {items.map((item, i) => <li key={i}>{parseInline(item)}</li>)}
                        </ul>
                    );
                }

                // Blockquotes (> quote)
                if (trimmed.startsWith('> ')) {
                    return <blockquote key={index} className="article-quote">{parseInline(trimmed.replace(/^> /, ''))}</blockquote>;
                }

                // Images (![alt](url))
                const imgMatch = trimmed.match(/^!\[(.*?)\]\((.*?)\)$/);
                if (imgMatch) {
                    return (
                        <figure key={index} className="article-figure">
                            <img src={imgMatch[2]} alt={imgMatch[1]} className="article-img" />
                            {imgMatch[1] && <figcaption>{imgMatch[1]}</figcaption>}
                        </figure>
                    );
                }

                // Paragraphs
                return <p key={index} className="article-p">{parseInline(trimmed)}</p>;
            })}
            {styles}
        </div>
    );
};

// Helper to parse bold (**text**) and italic (*text*)
const parseInline = (text: string) => {
    // Basic parser, can be expanded
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g); // Split by bold/italic markers
    return parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={index} className="article-bold">{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('*') && part.endsWith('*')) {
            return <em key={index} style={{ fontStyle: 'italic' }}>{part.slice(1, -1)}</em>;
        }
        return part;
    });
};

export default RichTextRenderer;
