'use client';
import type {PublicationInfo} from '@/lib/public-types';
import {checkedTime} from '@/lib/display';
export default function PublicationBanner({publication}:{publication:PublicationInfo|null}){
 return <div className="publication-banner" role="status"><div><strong>Veřejný přehled výsledků</strong><span>{publication?.publishedAt?`Zveřejněná verze: ${checkedTime(publication.publishedAt)}`:'První zveřejnění výsledků zatím není k dispozici.'}</span></div><p>Výsledky i komentář se zobrazují z poslední zveřejněné verze. Zapnuté obnovení po minutě načítá poslední zveřejněnou verzi. Modely se ukládají pouze v tomto prohlížeči.</p></div>;
}
