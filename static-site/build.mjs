import {build} from 'esbuild';
import {mkdir,readFile,writeFile,copyFile,rm,access} from 'node:fs/promises';
import path from 'node:path';
const root=process.cwd();
export async function buildPublic(outdir='docs'){
 const output=path.resolve(root,outdir);await mkdir(path.join(output,'data'),{recursive:true});await rm(path.join(output,'assets'),{recursive:true,force:true});
 const result=await build({entryPoints:[path.join(root,'static-site/main.tsx')],outdir:path.join(output,'assets'),bundle:true,format:'esm',splitting:true,platform:'browser',target:'es2022',minify:true,jsx:'automatic',define:{__PUBLIC_STATIC__:'true','process.env.NODE_ENV':'"production"'},alias:{'@':root},loader:{'.png':'file','.svg':'file'},entryNames:'main-[hash]',chunkNames:'chunk-[hash]',assetNames:'[name]-[hash]',metafile:true,plugins:[{name:'omit-private-controls',setup(b){b.onResolve({filter:/^@\/lib\/(client-data|scenario-client)$/},args=>({path:path.join(root,'static-site',args.path.split('/').at(-1)+'.ts')}));b.onResolve({filter:/(?:^|\/)(CollectionControls|PublishControls)$/},args=>({path:args.path,namespace:'public-stub'}));b.onLoad({filter:/.*/,namespace:'public-stub'},()=>({contents:'export default function PrivateControl(){return null}',loader:'js'}));}}]});
 for(const file of ['precincts-2022.geojson','precincts-2026.geojson'])await copyFile(path.join(root,'public/data',file),path.join(output,'data',file));
 await copyFile(path.join(root,'public/favicon.svg'),path.join(output,'favicon.svg'));
 const entry=Object.entries(result.metafile.outputs).find(([,value])=>value.entryPoint?.endsWith('static-site/main.tsx'));
 if(!entry)throw Error('Public entrypoint is missing');
 const script='./'+path.relative(output,path.resolve(root,entry[0])).split(path.sep).join('/');
 const style=entry[1].cssBundle?'./'+path.relative(output,path.resolve(root,entry[1].cssBundle)).split(path.sep).join('/'):null;
 let html=await readFile(path.join(root,'static-site/index.html'),'utf8');
 html=html.replace('./assets/main.js',script);if(style)html=html.replace('./assets/main.css',style);
 await writeFile(path.join(output,'index.html'),html);
 await writeFile(path.join(output,'.nojekyll'),'');await writeFile(path.join(output,'.election-public.json'),JSON.stringify({application:'trinec-election-map',schemaVersion:1})+'\n');
 // Frontend rebuilds must preserve the latest published result file.
 try{await access(path.join(output,'data/published.json'));}catch{await copyFile(path.join(root,'static-site/seed.json'),path.join(output,'data/published.json'));}
 return result;
}
if(process.argv[1]===new URL(import.meta.url).pathname){await buildPublic(process.argv[2]??'docs');console.log('Veřejný web je připraven ve složce '+(process.argv[2]??'docs'));}
