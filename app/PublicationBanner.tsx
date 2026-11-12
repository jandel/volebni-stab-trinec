'use client';
import type {PublicationInfo} from '@/lib/public-types';
import {checkedTime} from '@/lib/display';
export default function PublicationBanner({publication}:{publication:PublicationInfo|null}){
 return <div className="publication-banner" role="status"><div><strong>Veřejný přehled výsledků</strong><span>{publication?.publishedAt?`Zveřejněná verze: ${checkedTime(publication.publishedAt)}`:'První zveřejnění výsledků zatím není k dispozici.'}</span></div><p>Výsledky i komentář se načtou při otevření stránky. Případnou novější zveřejněnou verzi načtete tlačítkem „Obnovit výsledky“. Automatické obnovení je výchozí vypnuté a po načtení konečných výsledků se zastaví. Modely se ukládají pouze v tomto prohlížeči.</p></div>;
}
