# Třinec · Volební mapa

Samostatná veřejná aplikace pro GitHub Pages: výsledky komunálních voleb 2026 a 2022, konečná analýza obou voleb, okrskové mapy, kandidáti, orientační přepočet mandátů, historie, modelování celých kandidátek a komentovaný přenos česky i po naszymu. Data poskytuje ČSÚ; aplikace je nezávislá.

## První zveřejnění

1. Nahrajte celý obsah tohoto projektu do veřejného repozitáře `jandel/volebni-stab-trinec`, do větve `main`.
2. V GitHubu otevřete **Settings → Pages**. Zvolte **Deploy from a branch**, větev **main**, složku **/docs** a uložte.
3. Po dokončení nasazení otevřete https://jandel.github.io/volebni-stab-trinec/ . První sestavení už je připravené; instalace Node.js není pro nahrání potřeba.

Výchozí soubor výsledků je přípravný a bez nových sečtených okrsků. Aplikace tento stav viditelně označuje.

## Aktualizace výsledků

Soukromá administrátorská aplikace vytváří jeden úplný veřejný export. Obsahuje výsledky města, okrsků a kandidátů, kontrolu konzistence, zachycenou historii a skutečné komentáře s hodinovými AI analýzami. Neobsahuje soukromé scénáře, nastavení sběru, přístupové údaje ani odkazy do soukromé aplikace.

- Ručně: stáhněte v administraci **veřejný export**, nahraďte `docs/data/published.json` a uložte změnu do `main`.
- Tlačítkem **Publikovat na GitHub** v soukromé aplikaci. Používá GitHub připojený k vašemu ChatGPT. Při prvním použití potvrďte přístup pro soukromou aplikaci, vraťte se a klikněte na publikování znovu. Ručně vyvolaný zápis se po přihlášení sám neopakuje. Veřejná verze žádné přihlášení ani propojení nepotřebuje.

Automatické publikování z otevřené administrace lze spustit s intervalem 10, 15, 30 nebo 60 minut. Výchozí interval je 10 minut; nezměněný obsah se znovu nezapisuje.

Při zapnutém komentovaném přenosu připojená hodinová úloha navíc zveřejňuje výsledky, šablonové zprávy a nově uložené AI souhrny i při zavřené administraci. Respektuje vypínač přenosu a vymezené volební období. Používá připojený GitHub vlastníka a mění jen `docs/data/published.json`; veřejná aplikace nepoužívá žádný přístupový token. Demo, ovládání a podkladové AI instrukce zůstávají v soukromé administraci.

Ruční publikování samo nespouští sběr. Odeslání do GitHubu a dostupnost na GitHub Pages jsou dva samostatné stavy; po nasazení lze v administraci ověřit verzi veřejných dat. Nasazení může trvat několik minut. Otevřený veřejný web kontroluje poslední zveřejněný soubor po minutě, pokud návštěvník obnovení nevypne.

## Komentovaný přenos

Záložka **Přenos** (`#coverage`) nabízí všechny zprávy nebo jen AI analýzy a přepínač Česky / Po naszymu. Krátké zprávy jsou deterministické šablony nad uloženými změnami ČSÚ. Označené AI souhrny vycházejí z ověřených dat a obsahují čas podkladů, omezení a otevřené otázky. Jsou interpretací, mohou chybovat a nejsou předpovědí výsledku. Nářeční verze je pracovní, se slovní oporou ve slovníku Jana Kluse / BLAF.

Do uzavření volebních místností 10. října ve 14:00 se čeká na výsledky. První AI souhrn může vzniknout od 15:00; bez nových ověřených podkladů se přeskočí.

## Konečná analýza 2022–2026

Záložka **Analýza 2022–2026** (`#analysis`) obsahuje hlavní zjištění, srovnání podpory a účasti, interaktivní mapy a grafy, mandátový model, kandidáty, obměnu zastupitelstva a zachycený průběh sčítání. Vychází z pevného konečného snímku všech 38 okrsků. Text vznikl s pomocí AI; čísla vycházejí z kontrolovaných součtů. Metodika a zdroje jsou přímo v záložce, včetně omezení srovnatelnosti listin a hranic okrsků.

Analýza funguje nezávisle na obnovování zveřejněných dat, nic nesbírá ani neukládá na server. Tabulku srovnání lze stáhnout jako CSV a celý přehled vytisknout. Přímý odkaz: https://jandel.github.io/volebni-stab-trinec/#analysis .

## Úprava aplikace

Vyžaduje Node.js 22.13 nebo novější:

```sh
npm install
npm run build
```

Sestavení aktualizuje `docs/` a zachová existující `docs/data/published.json`. Do GitHubu odešlete zdroj i nové sestavení. Závislosti jsou připnuté; soubor lock vytvořený instalací doporučujeme rovněž verzovat.

## Modely a metodika

Návštěvnické scénáře se ukládají do localStorage konkrétního prohlížeče, nejvýše 12. Nesdílejí se mezi návštěvníky ani zařízeními; smazání dat prohlížeče je odstraní. Model předpokládá hlasování pro celé kandidátky a nepřidává preferenční hlasy ani panašování. Průběžné mandáty nejsou předpovědí konečného výsledku. Podrobnosti jsou přímo v aplikaci.

## Podklady

- Výsledky a seznamy kandidátů: https://volby.gov.cz/
- Hranice okrsků: Český statistický úřad / RÚIAN, historický generalizovaný snímek 2022 a snímek 2026.
- Mapové dlaždice: OpenStreetMap a jeho přispěvatelé; atribuce je uvedena v mapě.
- Písmo: DM Sans a Manrope (Google Fonts).

Veřejný web neobsahuje analytické měření ani serverovou databázi. Při otevření mapy a načítání písma komunikuje s poskytovateli mapových dlaždic a Google Fonts.

## Odebrání veřejného webu

V **Settings → Pages** lze web zrušit pomocí **Unpublish site**. Veřejný repozitář a jeho historie tím zůstávají dostupné; jejich viditelnost se řídí samostatně v nastavení repozitáře. Již stažené kopie nelze odebrat.
