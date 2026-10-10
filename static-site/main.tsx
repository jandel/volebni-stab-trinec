import {createRoot} from 'react-dom/client';
import Page from '../app/page';
import 'leaflet/dist/leaflet.css';
import '../app/globals.css';
createRoot(document.getElementById('root')!).render(<Page/>);
