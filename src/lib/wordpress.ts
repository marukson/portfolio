/*
 * Conexión con WordPress (API REST).
 * Equivale al WP_Query de page-home.php, pero pidiendo los datos por HTTP.
 *
 * En `npm run dev` se ejecuta en cada recarga: si editás un proyecto en WordPress, lo ves al instante.
 * En `npm run build` se ejecuta una vez y el resultado queda como HTML estático.
 */

const WP_URL = import.meta.env.WP_URL;

// Lo que devuelve WordPress (solo los campos que pedimos con _fields)
interface WPProyecto {
  id: number;
  title: { rendered: string };
  acf: { url?: string } | []; // ACF devuelve [] cuando el grupo no está en la API
}

// Lo que usa el sitio: más simple y con nombres propios
export interface Proyecto {
  id: number;
  titulo: string; // viene con entidades HTML (ej. &#038; en vez de &): mostrar con set:html
  url: string;
}

export async function getProyectos(): Promise<Proyecto[]> {
  const endpoint = new URL('/wp-json/wp/v2/portfolio', WP_URL);
  endpoint.searchParams.set('per_page', '100'); // por defecto son 10
  endpoint.searchParams.set('acf_format', 'standard');
  endpoint.searchParams.set('_fields', 'id,title,acf'); // solo lo que usamos: respuesta más liviana
  endpoint.searchParams.set('orderby', 'menu_order'); // el orden de Simple Custom Post Order
  endpoint.searchParams.set('order', 'asc');

  let res: Response;
  try {
    res = await fetch(endpoint);
  } catch (error) {
    throw new Error(`No pude conectar con WordPress en ${WP_URL}. ¿Está iniciado el sitio en LocalWP?`, { cause: error });
  }
  if (!res.ok) {
    throw new Error(`WordPress respondió ${res.status} al pedir ${endpoint}`);
  }

  const data: WPProyecto[] = await res.json();

  return data
    .map((p) => ({
      id: p.id,
      titulo: p.title.rendered,
      url: Array.isArray(p.acf) ? '' : (p.acf.url ?? ''),
    }))
    .filter((p) => p.url); // sin link no hay nada que mostrar
}

/*
 * CV: campo ACF "cv" (tipo Archivo, devuelve array) de la página de inicio.
 * Devuelve la URL del PDF, o '' si todavía no se subió ninguno.
 */
const INICIO_ID = 2; // ID de la página "Inicio" en WordPress (el grupo de ACF "Inicio" está asignado a esta página)

interface WPInicio {
  acf: { cv?: { url?: string } | false | '' } | [];
}

export async function getCV(): Promise<string> {
  const endpoint = new URL(`/wp-json/wp/v2/pages/${INICIO_ID}`, WP_URL);
  endpoint.searchParams.set('acf_format', 'standard');
  endpoint.searchParams.set('_fields', 'acf');

  let res: Response;
  try {
    res = await fetch(endpoint);
  } catch (error) {
    throw new Error(`No pude conectar con WordPress en ${WP_URL}. ¿Está iniciado el sitio en LocalWP?`, { cause: error });
  }
  if (!res.ok) {
    throw new Error(`WordPress respondió ${res.status} al pedir ${endpoint}`);
  }

  const data: WPInicio = await res.json();
  if (Array.isArray(data.acf)) return '';
  const cv = data.acf.cv;
  return cv && typeof cv === 'object' ? (cv.url ?? '') : '';
}
