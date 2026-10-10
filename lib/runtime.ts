/** Replaced with true in the independent GitHub Pages build. */
declare const __PUBLIC_STATIC__: boolean;
export const PUBLIC_STATIC=typeof __PUBLIC_STATIC__!=='undefined'&&__PUBLIC_STATIC__;
export const assetPath=(path:string)=>PUBLIC_STATIC?'./'+path.replace(/^\//,''):path;
