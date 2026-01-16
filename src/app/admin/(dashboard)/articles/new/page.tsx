"use client";

import React, { Suspense } from 'react';
import ArticleEditor from '@/components/admin/ArticleEditor';

export default function NewArticlePage() {
    return (
        <Suspense fallback={<div>Loading editor...</div>}>
            <ArticleEditor />
        </Suspense>
    );
}
