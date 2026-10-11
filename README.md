# Třinec · Volební mapa

Nezávislý veřejný přehled komunálních voleb v Třinci. Výsledky vycházejí z dat Českého statistického úřadu; rozhodující jsou jeho oficiální údaje.

Veřejná aplikace: https://jandel.github.io/volebni-stab-trinec/

## Co na webu najdete

- **Výsledky 2026 a 2022:** městské součty, okrskové mapy, kandidáti a mandáty.
- **Porovnání:** změny podpory a účasti mezi oběma volbami.
- **Modelování:** vlastní předpoklady účasti a hlasování pro celé kandidátky. Scénáře se ukládají jen v konkrétním prohlížeči.
- **Průběh:** zachycené stavy sčítání.
- **Přenos:** uložené zprávy a označené AI souhrny v češtině i po naszymu.
- **Analýzy a přehledy:** konečné srovnání výsledků, koaliční varianty a profily všech zvolených zastupitelů.

## Výsledky 2022–2026

https://jandel.github.io/volebni-stab-trinec/#analysis

Konečná analýza obsahuje hlavní zjištění, srovnání podpory a účasti, interaktivní mapy a grafy, mandátový model, kandidáty, obměnu zastupitelstva a průběh sčítání. Vychází z ověřeného konečného snímku všech 38 okrsků. Srovnávací tabulku lze stáhnout jako CSV a přehled vytisknout. Metodika uvádí omezení srovnatelnosti listin i hranic okrsků.

## Možné koalice

https://jandel.github.io/volebni-stab-trinec/#coalitions

Přehled devíti základních většinových kombinací nabízí filtry podle kandidátky, počtu partnerů a rezervy nad většinou. Dvě varianty lze porovnat vedle sebe. Rozbory oddělují programové návaznosti, otevřené otázky a souvislosti mezi zvolenými lidmi. Třináct tematických přehledů pomáhá hledat konkrétní průniky.

Počty mandátů nejsou předpovědí koalice ani potvrzením dohody. Jde o datovaný přehled podle podkladů z 11. října 2026, nikoli živé sledování jednání.

## Zvolení zastupitelé

https://jandel.github.io/volebni-stab-trinec/#representatives

Všech 27 profilů lze hledat podle jména, kandidátky, osobně zmiňovaného tématu a dostupnosti osobních podkladů. Detail odděluje vlastní vyjádření, společný program kandidátky a omezení. Profesi ani mediální výroky lídra nepřevádí na osobní slib ostatních členů klubu. Pět osob bez doložených samostatných závazků je takto označeno.

Podklady odpovídají 11. říjnu 2026. Přímý odkaz na člověka má tvar `#representatives/<id-kandidáta>`. Programy a původní zdroje jsou dostupné v detailu i společném seznamu.

## Jak číst údaje

Podíl kandidátky je podílem kandidátských hlasů, nikoli podílem jednotlivých voličů. Jeden volič mohl dát více hlasů. Mandáty se mezi roky změnily z 33 na 27. Okrskové rozdíly jsou orientační kvůli zjednodušeným historickým hranicím. Texty vznikly s pomocí AI; údaje a interpretaci je vhodné rozlišovat.

## Sestavení veřejné aplikace

Vyžaduje Node.js 22.13 nebo novější:

```sh
npm install
npm run build
```

Výstup je ve složce `docs/`. Sestavení zachovává existující veřejný soubor výsledků. GitHub Pages tohoto repozitáře používá větev `main` a složku `/docs`.

## Zdroje a externí služby

- Výsledky a seznamy kandidátů: https://volby.gov.cz/
- Hranice okrsků: ČSÚ / RÚIAN, snímky 2022 a 2026.
- Mapové dlaždice: OpenStreetMap a jeho přispěvatelé; atribuce je uvedena v mapě.
- Písma: DM Sans a Manrope, Google Fonts.
- Programy, medailonky a mediální vyjádření: konkrétní odkazy u příslušných přehledů.

Web nepoužívá analytické měření. Při načítání map a písem komunikuje s uvedenými poskytovateli. Vyhledávání a filtrování probíhá v prohlížeči.
