const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

/* ── Strip accents + lowercase for robust matching ── */
function normalize(str) {
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/* ── Keyword rules — first match wins ───────────────────────────────────
   Each rule: { keywords: [...], reply: "..." }
   At least ONE keyword must appear in the normalized question.
   ──────────────────────────────────────────────────────────────────────── */
const RULES = [

  /* ── PEDIR MATERIALES ── */
  {
    keywords: ['arcilla', 'barro', 'pasta', 'material', 'donde hay arcilla', 'donde esta la arcilla'],
    reply: '¡Ya te paso! Dame un segundo.',
  },
  {
    keywords: ['engobe'],
    reply: 'No, el engobe ya lo hicimos la semana anterior.',
  },

  /* ── PEDIR HERRAMIENTAS ── */
  {
    keywords: ['tarjeta'],
    reply: '¡Ya te la paso! Dame un segundo.',
  },
  {
    keywords: ['esponja'],
    reply: '¡Ya te la paso! Dame un segundo.',
  },
  {
    keywords: ['tabla'],
    reply: '¡Ya te la traigo! Dame un segundo.',
  },
  {
    keywords: ['palillo', 'palillos'],
    reply: '¡Ya te lo paso! Dame un segundo.',
  },
  {
    keywords: ['devastador', 'rasqueta', 'rascador'],
    reply: '¡Ya te lo paso! Dame un segundo.',
  },
  {
    keywords: ['cortante', 'cortantes'],
    reply: '¡Ya te los paso! Dame un segundo.',
  },
  {
    keywords: ['rodillo', 'palo de amasar', 'amasador'],
    reply: '¡Ya te lo paso! Dame un segundo.',
  },
  {
    keywords: ['alambre', 'hilo', 'cortador de arcilla'],
    reply: '¡Ya te lo paso! Dame un segundo.',
  },
  {
    keywords: ['pincel', 'pinceles'],
    reply: '¡Ya te lo paso! Dame un segundo.',
  },
  {
    keywords: ['molde', 'moldes'],
    reply: '¡Ya te lo traigo! Dame un segundo.',
  },
  {
    keywords: ['sello', 'sellos', 'texturador'],
    reply: '¡Ya te lo paso! Dame un segundo.',
  },
  {
    keywords: ['tijera', 'tijeras'],
    reply: '¡Ya te las paso! Dame un segundo.',
  },
  {
    keywords: ['espatula', 'espátula'],
    reply: '¡Ya te la paso! Dame un segundo.',
  },

  /* ── NO SÉ QUÉ HACER / IDEAS ── */
  {
    keywords: ['no se que hacer', 'no sé qué hacer', 'que puedo hacer', 'qué puedo hacer',
               'que hago', 'qué hago', 'no tengo idea', 'no se me ocurre', 'dame una idea',
               'que hago hoy', 'qué hago hoy', 'que hago con esto', 'no sé qué hacer'],
    reply: '¡Hay mil opciones! Podés hacer un bowl, una taza, un platito, una maceta chiquita, una ensaladera, un portalápices, un adorno, un cuenco, o un plato. Si querés algo más copado, podemos hacer una figura, un animalito o una cajita con tapa. ¿Qué te copa más?',
  },
  {
    keywords: ['idea', 'ideas', 'sugerencia', 'propuesta', 'que puedo', 'qué puedo'],
    reply: 'Podés hacer un bowl, una taza, un platito, una maceta, un portalápices o un cuenco. También podemos hacer figuras, animalitos o cajitas con tapa si querés algo más detallado. ¿Qué te copa más?',
  },

  /* ── TÉCNICA PELLIZCO — formas redondeadas ── */
  {
    keywords: ['taza', 'bowl', 'bol', 'vasito', 'vaso', 'maceta', 'ensaladera',
               'florero', 'jarron', 'jarrón', 'vasija', 'cuenco', 'portalapices',
               'portalápices', 'redond', 'pellizco', 'como hago algo redondo',
               'forma redonda'],
    reply: 'Para eso hacemos la técnica de pellizco: tomás un cubo de arcilla y lo golpeás contra la mesa para darle una forma pareja. Después redondeás las puntas con la mano, metés el pulgar en el centro y pellizicás los bordes hacia afuera para abrir la forma. Si te quedó bajita y la querés más alta, le agregás arcilla arriba con choricitos o una plancha, y la pegás con barbotina. También podemos sacar arcilla del centro con el devastador si las paredes quedaron muy gruesas.',
  },

  /* ── TÉCNICA PLANCHA — formas cuadradas/rectangulares ── */
  {
    keywords: ['cuadrado', 'cuadrada', 'rectangular', 'rectangulo', 'rectángulo',
               'caja', 'cajita', 'caja con tapa', 'lapicero', 'organizador', 'forma cuadrada',
               'angulo', 'ángulo', 'esquina'],
    reply: 'Para formas cuadradas o rectangulares lo mejor es trabajar con planchas. Estirás la arcilla con el rodillo hasta que quede pareja, medís bien cada cara antes de cortar, y las pegás con barbotina rayando las superficies. Es importante medir todo antes de empezar y aprovechar bien la arcilla que amasaste para no desperdiciarla.',
  },

  /* ── CÓMO HACER UNA PLANCHA ── */
  {
    keywords: ['como hago una plancha', 'cómo hago una plancha', 'como se hace una plancha',
               'hacer plancha', 'tecnica plancha', 'técnica plancha', 'plancha de arcilla',
               'como estiro', 'cómo estiro'],
    reply: 'Para hacer una plancha: poné la arcilla sobre la tabla, aplastala un poco con la mano y después pasá el rodillo de adelante hacia atrás con presión pareja. Podés poner dos palillos a los costados de igual grosor para que la plancha te quede uniforme. Cuando tenga el grosor que querés, la podés cortar con la tarjeta o el cortante.',
  },

  /* ── PLATOS ── */
  {
    keywords: ['plato', 'platito', 'bandeja'],
    reply: 'Para hacer un plato estirás la arcilla con el rodillo hasta dejarla pareja y del grosor que querés. Después formás los bordes levantándolos con la tarjeta o agregando choricitos de arcilla alrededor y uniéndolos bien con los dedos y barbotina.',
  },

  /* ── CÓMO HACER UN ASA / MANIJA ── */
  {
    keywords: ['asa', 'manija', 'agarradera', 'mango', 'como pego el asa', 'cómo pego el asa'],
    reply: 'Para hacer un asa hacés un choricito largo y parejo, lo dejás secar un poco para que se afirme y no se doble. Después rayás bien los dos puntos donde la vas a pegar en la taza, aplicás barbotina y presionás el asa con firmeza. Dejala secar lento para que no se caiga.',
  },

  /* ── PIEZAS EN EL HORNO ── */
  {
    keywords: ['pieza', 'piezas', 'horno', 'coccion', 'cocción', 'lista', 'listas', 'quemad', 'cuando sale'],
    reply: 'Hay un horno cargado, capaz están ahí. Ahora las busco.',
  },

  /* ── TEMPERATURA ── */
  {
    keywords: ['temperatura', 'grados', 'bizcocho', 'primera coccion', 'segunda coccion'],
    reply: 'La primera cocción, el bizcocho, va entre 900 °C y 1000 °C. La segunda cocción con esmalte depende del tipo de arcilla, generalmente entre 1050 °C y 1280 °C.',
  },

  /* ── ESMALTE ── */
  {
    keywords: ['esmalte', 'vidriado', 'glasur', 'glasear', 'barniz'],
    reply: 'El esmalte se aplica después del bizcocho, cuando la pieza ya está cocida pero sin vidriar. Podés pincelarlo, sumergir la pieza, o rociarlo. Acordate de no esmaltear la base para que no se pegue al horno.',
  },

  /* ── SECADO ── */
  {
    keywords: ['secar', 'secado', 'cuanto tiempo', 'cuánto tiempo', 'tiempo de secado', 'cuando seca'],
    reply: 'Las piezas necesitan secar despacio, idealmente 24 a 48 horas al aire antes de ir al horno. Si las secás muy rápido se pueden agrietar. No las pongas al sol ni cerca de una fuente de calor.',
  },

  /* ── GRIETAS ── */
  {
    keywords: ['grieta', 'grietas', 'crack', 'roto', 'rompió', 'rompio', 'partió', 'partio', 'se partio', 'se agrietó'],
    reply: 'Las grietas suelen aparecer por secado rápido o paredes muy delgadas. Si la pieza todavía está cruda podés intentar cerrar la grieta con barbotina bien espesa, presionando desde adentro y afuera. Si ya está seca es más difícil, pero podemos intentarlo igual.',
  },

  /* ── BARBOTINA / PEGAR ── */
  {
    keywords: ['barbotina', 'pegamento', 'pegar', 'unir', 'como pego', 'cómo pego', 'se me despego', 'se despegó'],
    reply: 'Para unir piezas usás barbotina: arcilla disuelta en agua hasta consistencia de crema. Primero rayás bien las dos superficies con un palillo, aplicás barbotina en las dos partes y las unís con presión. Cuanto más rugosas estén las superficies, mejor agarra.',
  },

  /* ── GROSOR / PAREDES ── */
  {
    keywords: ['grosor', 'grueso', 'gruesa', 'delgado', 'delgada', 'que tan fino', 'cuán fino', 'cuanto grosor'],
    reply: 'Las paredes ideales tienen entre 5 y 8 milímetros de grosor. Si son muy finitas se pueden romper al secar o al cocer; si son muy gruesas pueden explotar en el horno por el vapor. Usá el devastador para sacar arcilla de adentro si ves que quedó muy grueso.',
  },

  /* ── TEXTURA ── */
  {
    keywords: ['textura', 'texturas', 'decorar', 'decoracion', 'decoración', 'diseño', 'dibujo'],
    reply: 'Para hacer texturas podés usar sellos, palillos, telas, hojas de plantas, o cualquier objeto que te guste presionar contra la arcilla cuando todavía está blanda. También podés grabar líneas y dibujos con el palillo. ¡Las posibilidades son infinitas!',
  },

  /* ── FIGURA / ESCULTURA ── */
  {
    keywords: ['figura', 'figuras', 'escultura', 'animalito', 'animalitos', 'personaje'],
    reply: 'Para hacer figuras empezás por el cuerpo principal y vas agregando las partes con barbotina. Acordate de rayar siempre antes de pegar y de hacer las partes huecas o con agujeros si son muy gruesas, para que no exploten en el horno. ¡Sé creativa!',
  },

  /* ── COLOR / PINTAR ── */
  {
    keywords: ['color', 'colores', 'pintar', 'pintarlo', 'pintarla', 'como le pongo color'],
    reply: 'Para ponerle color tenemos dos opciones: el engobe, que se aplica sobre la arcilla cruda o en bizcocho y da colores más naturales, o el esmalte, que se aplica después del bizcocho y queda vidrioso y brillante. ¡Los dos dan resultados muy lindos!',
  },

  /* ── NOMBRE EN LA PIEZA ── */
  {
    keywords: ['nombre', 'firmar', 'como marco', 'cómo marco', 'es mia', 'es mía'],
    reply: 'Acordate de poner tu nombre en la base de la pieza antes de que seque, con un palillo. Así sabemos de quién es cuando sale del horno.',
  },

];

function getReply(message) {
  const q = normalize(message);
  for (const rule of RULES) {
    if (rule.keywords.some(kw => q.includes(normalize(kw)))) {
      return rule.reply;
    }
  }
  return 'Esa pregunta no es sobre cerámica, así que no te puedo ayudar con eso. ¡Pero si tenés alguna duda sobre tu trabajo en arcilla, con gusto te respondo!';
}

app.post('/api/chat', (req, res) => {
  const { message } = req.body;
  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({ error: 'El mensaje no puede estar vacío.' });
  }
  res.json({ reply: getReply(message.trim()) });
});

app.listen(PORT, () => {
  console.log(`Asistente de cerámica corriendo en http://localhost:${PORT}`);
  console.log('Modo: respuestas predefinidas (sin API)');
});
