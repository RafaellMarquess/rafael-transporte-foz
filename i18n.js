/* ==========================================================================
   i18n.js — site em Português, Inglês e Espanhol
   --------------------------------------------------------------------------
   Como funciona: o site é escrito em português. Este arquivo troca, na tela,
   cada texto conhecido pela tradução (lista TRADUCOES abaixo). Texto que NÃO
   está na lista (ex.: o que você digita no painel) continua como foi escrito.
   Para traduzir um texto novo, basta adicionar uma linha [pt, en, es].
   ========================================================================== */

const IDIOMAS_SITE = ['pt', 'en', 'es'];
const NOMES_IDIOMA = { pt: 'Português', en: 'English', es: 'Español' };
const LANG_HTML = { pt: 'pt-BR', en: 'en', es: 'es' };

/* Textos com variáveis (usados pelo código via t('chave', {n: 3})) */
const UI = {
  pt: {
    pax1: '1 passageiro',
    paxN: '{n} passageiros',
    ate1: 'Até {n} Pessoa',
    ateN: 'Até {n} Pessoas',
    verTodos: 'Ver todos os destinos ({n})',
    menos: 'Mostrar menos',
    titulo: '{nome} - Motorista Particular & Transfers',
    msgTopo: 'Olá {nome}! Gostaria de solicitar um orçamento de corrida.'
  },
  en: {
    pax1: '1 passenger',
    paxN: '{n} passengers',
    ate1: 'Up to {n} Person',
    ateN: 'Up to {n} People',
    verTodos: 'See all destinations ({n})',
    menos: 'Show less',
    titulo: '{nome} - Private Driver & Transfers',
    msgTopo: 'Hello {nome}! I would like to request a ride quote.'
  },
  es: {
    pax1: '1 pasajero',
    paxN: '{n} pasajeros',
    ate1: 'Hasta {n} Persona',
    ateN: 'Hasta {n} Personas',
    verTodos: 'Ver todos los destinos ({n})',
    menos: 'Mostrar menos',
    titulo: '{nome} - Conductor Privado y Traslados',
    msgTopo: '¡Hola {nome}! Me gustaría solicitar un presupuesto de viaje.'
  }
};

/* [português, inglês, espanhol] */
const TRADUCOES = [
  /* Topo e navegação */
  ['Disponível para Agendamentos', 'Available for Bookings', 'Disponible para Reservas'],
  ['Agenda fechada no momento', 'Bookings closed at the moment', 'Agenda cerrada por el momento'],
  ['Indisponível hoje', 'Unavailable today', 'No disponible hoy'],
  ['Agenda fechada no momento. Volte em breve!', 'Bookings are closed at the moment. Please check back soon!', 'La agenda está cerrada por el momento. ¡Vuelva pronto!'],
  ['Não estou disponível nesta data. Escolha outro dia, por favor.', 'I am not available on this date. Please choose another day.', 'No estoy disponible en esta fecha. Elija otro día, por favor.'],
  ['Solicitar Corrida / Transfer', 'Request a Ride / Transfer', 'Solicitar Viaje / Traslado'],
  ['Motorista Particular', 'Private Driver', 'Conductor Privado'],
  ['Transfers e passeios', 'Transfers and tours', 'Traslados y paseos'],
  ['Motorista Particular & Transfers Profissionais', 'Private Driver & Professional Transfers', 'Conductor Privado y Traslados Profesionales'],
  ['Dados do Veículo e Motorista', 'Vehicle & Driver Details', 'Datos del Vehículo y Conductor'],
  ['Identificação verificada & Segurança', 'Verified identity & Safety', 'Identificación verificada y Seguridad'],
  ['Início', 'Home', 'Inicio'],
  ['Buscar', 'Search', 'Buscar'],
  ['Galeria', 'Gallery', 'Galería'],
  ['Avaliações', 'Reviews', 'Opiniones'],
  ['Navegação principal', 'Main navigation', 'Navegación principal'],
  ['Idioma', 'Language', 'Idioma'],

  /* Destinos e calculadora */
  ['Principais Destinos & Passeios', 'Top Destinations & Tours', 'Principales Destinos y Paseos'],
  ['Consulte o valor do seu transporte em apenas um clique ou use a lupa abaixo 🔍', 'Check your ride price in a single tap or use the magnifier below 🔍', 'Consulte el valor de su traslado con un solo toque o use la lupa de abajo 🔍'],
  ['Ver Detalhes', 'View Details', 'Ver Detalles'],
  ['Simular Valor da Corrida', 'Estimate Your Ride Price', 'Simular el Valor del Viaje'],
  ['Selecione o destino para calcular uma estimativa rápida:', 'Choose a destination to get a quick estimate:', 'Seleccione el destino para calcular una estimación rápida:'],
  ['Selecione o Trajeto / Destino:', 'Select the Route / Destination:', 'Seleccione el Trayecto / Destino:'],
  ['Aviso de Tolerância e Horário na Fronteira:', 'Border Waiting Time Notice:', 'Aviso de Tolerancia y Horario en la Frontera:'],
  ['Para viagens com destino ao Paraguai ou Argentina, caso haja descumprimento do horário de retorno agendado sem aviso prévio, será cobrada uma taxa de', 'For trips to Paraguay or Argentina, if the scheduled return time is missed without prior notice, a fee of', 'Para viajes con destino a Paraguay o Argentina, si no se respeta el horario de regreso acordado sin aviso previo, se cobrará una tarifa de'],
  ['R$ 50,00 por hora adicional de espera', 'R$ 50.00 per additional hour of waiting will apply', 'R$ 50,00 por hora adicional de espera'],
  ['Tipo de Viagem:', 'Trip Type:', 'Tipo de Viaje:'],
  ['Apenas Ida (Leve até o local)', 'One way (drop-off only)', 'Solo ida (lo llevo hasta el lugar)'],
  ['Ida e Volta (Com Desconto - Fico aguardando o retorno)', 'Round trip (discounted - I wait for your return)', 'Ida y vuelta (con descuento - espero su regreso)'],
  ['Data:', 'Date:', 'Fecha:'],
  ['Horário:', 'Time:', 'Hora:'],
  ['Número de Passageiros:', 'Number of Passengers:', 'Número de Pasajeros:'],
  ['Local de Embarque:', 'Pickup Location:', 'Lugar de Recogida:'],
  ['Ex.: Hotel, aeroporto ou endereço', 'E.g.: Hotel, airport or address', 'Ej.: Hotel, aeropuerto o dirección'],
  ['Valor Estimado:', 'Estimated Price:', 'Valor Estimado:'],
  ['Agendar este Trajeto', 'Book This Trip', 'Reservar este Trayecto'],

  /* Conforto e veículo */
  ['Conforto & Veículo', 'Comfort & Vehicle', 'Comodidad y Vehículo'],
  ['Viagem executiva privativa com total praticidade e comodidade', 'Private executive travel, practical and comfortable', 'Viaje ejecutivo privado, con total practicidad y comodidad'],
  ['Espaço privativo ideal para famílias e grupos com total conforto.', 'Private space, ideal for families and groups, with total comfort.', 'Espacio privado ideal para familias y grupos, con total comodidad.'],
  ['Ar-Condicionado', 'Air Conditioning', 'Aire Acondicionado'],
  ['Ambiente sempre climatizado para o calor da região.', 'Always air-conditioned for the local heat.', 'Ambiente siempre climatizado para el calor de la región.'],
  ['Porta-Malas Amplo', 'Spacious Trunk', 'Baúl Amplio'],
  ['Espaço perfeito para bagagens e compras no PY.', 'Plenty of room for luggage and shopping in Paraguay.', 'Espacio perfecto para equipaje y compras en Paraguay.'],
  ['Carregador USB', 'USB Charger', 'Cargador USB'],
  ['Cabos disponíveis para Android e iPhone.', 'Cables available for Android and iPhone.', 'Cables disponibles para Android y iPhone.'],
  ['Viagem Segura', 'Safe Ride', 'Viaje Seguro'],
  ['Direção defensiva, veículo revisado e pontualidade.', 'Defensive driving, a well-maintained vehicle and punctuality.', 'Conducción defensiva, vehículo revisado y puntualidad.'],
  ['Horários Flexíveis', 'Flexible Schedule', 'Horarios Flexibles'],
  ['Embarque no seu ritmo e sem a pressa das excursões.', 'Travel at your own pace, without the rush of group tours.', 'Viaje a su ritmo, sin la prisa de las excursiones.'],

  /* Perguntas frequentes (textos de exemplo) */
  ['Perguntas Frequentes', 'Frequently Asked Questions', 'Preguntas Frecuentes'],
  ['Quais formas de pagamento são aceitas?', 'Which payment methods are accepted?', '¿Qué formas de pago se aceptan?'],
  ['Aceito Pix e cartões de débito/crédito com praticidade no momento do atendimento.', 'I accept Pix and debit/credit cards at the time of service.', 'Acepto Pix y tarjetas de débito/crédito en el momento del servicio.'],
  ['Atende viagens para Paraguai e Argentina?', 'Do you take trips to Paraguay and Argentina?', '¿Realiza viajes a Paraguay y Argentina?'],
  ['Sim! Faço o transporte para compras em CDE e passeios na Feirinha de Puerto Iguazú.', 'Yes! I drive to Ciudad del Este for shopping and to the Puerto Iguazú market.', '¡Sí! Hago traslados para compras en CDE y paseos por la feria de Puerto Iguazú.'],
  ['Como funciona a espera no aeroporto?', 'How does airport pickup work?', '¿Cómo funciona la espera en el aeropuerto?'],
  ['Acompanho o status do seu voo para garantir recepção sem atrasos no desembarque.', 'I track your flight status so I am there on time when you land.', 'Sigo el estado de su vuelo para recibirlo sin demoras en el desembarque.'],

  /* Galeria, avaliações, comentários */
  ['Galeria de Fotos', 'Photo Gallery', 'Galería de Fotos'],
  ['Um pouco dos passeios e do dia a dia dos transfers', 'A glimpse of the tours and everyday transfers', 'Un poco de los paseos y del día a día de los traslados'],
  ['Ver mais fotos', 'See more photos', 'Ver más fotos'],
  ['Em breve, novas fotos por aqui.', 'New photos coming soon.', 'Pronto habrá nuevas fotos por aquí.'],
  ['Foto da galeria', 'Gallery photo', 'Foto de la galería'],
  ['Foto ampliada', 'Enlarged photo', 'Foto ampliada'],
  ['Anterior', 'Previous', 'Anterior'],
  ['Próxima', 'Next', 'Siguiente'],
  ['O que dizem os passageiros', 'What passengers say', 'Lo que dicen los pasajeros'],
  ['Em breve, avaliações dos nossos passageiros.', 'Passenger reviews coming soon.', 'Pronto, opiniones de nuestros pasajeros.'],
  ['Deixe seu comentário ou avaliação', 'Leave a comment or review', 'Deje su comentario o valoración'],
  ['Deixe sua opinião, elogio ou sugestão abaixo!', 'Share your opinion, praise or suggestions below!', '¡Deje su opinión, elogio o sugerencia abajo!'],

  /* Busca e detalhes */
  ['Buscar Ponto Turístico', 'Find a Tourist Spot', 'Buscar Atractivo Turístico'],
  ['Digite (ex: Cataratas, Templo, Itaipu)...', 'Type (e.g. Falls, Temple, Itaipu)...', 'Escriba (ej.: Cataratas, Templo, Itaipú)...'],
  ['Nenhum ponto encontrado.', 'No places found.', 'No se encontró ningún lugar.'],
  ['Estimativa:', 'Estimate:', 'Estimación:'],
  ['Sobre o Ponto Turístico', 'About This Place', 'Sobre el Atractivo'],
  ['Como Funciona o Transporte', 'How the Transport Works', 'Cómo Funciona el Transporte'],
  ['Apenas Ida:', 'One way:', 'Solo ida:'],
  ['Ida e Volta:', 'Round trip:', 'Ida y vuelta:'],

  /* Modal do motorista */
  ['Identificação do Motorista', 'Driver Identification', 'Identificación del Conductor'],
  ['Motorista', 'Driver', 'Conductor'],
  ['Motorista Responsável', 'Responsible Driver', 'Conductor Responsable'],
  ['Veículo Oficial', 'Official Vehicle', 'Vehículo Oficial'],
  ['Status de Segurança', 'Safety Status', 'Estado de Seguridad'],
  ['Base de Atendimento', 'Service Area', 'Zona de Atención'],
  ['Veículo Higienizado & Revisado', 'Sanitized & Inspected Vehicle', 'Vehículo Higienizado y Revisado'],
  ['Foz do Iguaçu e Tríplice Fronteira', 'Foz do Iguaçu and the Triple Border', 'Foz do Iguaçu y la Triple Frontera'],

  /* Valores padrão de destinos */
  ['Passeio Privativo em Foz', 'Private Tour in Foz', 'Paseo Privado en Foz'],
  ['Passeio turístico imperdível na região.', 'An unmissable tour in the region.', 'Un paseo turístico imperdible en la región.'],
  ['Transporte privativo direto até o destino.', 'Direct private transport to the destination.', 'Traslado privado directo hasta el destino.'],
  ['Levo até o local, aguardo o término do passeio e trago de volta.', 'I take you there, wait until the tour ends and bring you back.', 'Lo llevo al lugar, espero a que termine el paseo y lo traigo de vuelta.'],

  /* Destinos de exemplo */
  ['Cataratas do Iguaçu (Lado Brasileiro)', 'Iguaçu Falls (Brazilian Side)', 'Cataratas del Iguazú (Lado Brasileño)'],
  ['Parque Nacional do Iguaçu', 'Iguaçu National Park', 'Parque Nacional do Iguaçu'],
  ['Explore uma das Sete Maravilhas Naturais do Mundo com toda a comodidade. Desfrute da passarela panorâmica com vista de frente para a monumental Garganta do Diabo, sem se preocupar com trânsito, estacionamento ou filas de transporte.', 'Explore one of the Seven Natural Wonders of the World in total comfort. Enjoy the panoramic walkway facing the monumental Devil\'s Throat, with no worries about traffic, parking or transport queues.', 'Explore una de las Siete Maravillas Naturales del Mundo con total comodidad. Disfrute de la pasarela panorámica frente a la monumental Garganta del Diablo, sin preocuparse por el tránsito, el estacionamiento o las filas de transporte.'],
  ['Transporte direto e pontual até o Centro de Visitantes do Parque Nacional.', 'Direct, punctual transport to the National Park Visitor Center.', 'Traslado directo y puntual hasta el Centro de Visitantes del Parque Nacional.'],
  ['Levo até a portaria e aguardo o término do seu passeio para trazê-lo de volta com total conforto e segurança.', 'I drop you at the entrance, wait until your visit ends and bring you back in comfort and safety.', 'Lo llevo hasta la entrada, espero que termine su paseo y lo traigo de vuelta con total comodidad y seguridad.'],

  ['Feirinha de Puerto Iguazú & Gastronomia', 'Puerto Iguazú Market & Food', 'Feria de Puerto Iguazú y Gastronomía'],
  ['Gastronomia & Vinhos em 🇦🇷', 'Food & Wine in 🇦🇷', 'Gastronomía y Vinos en 🇦🇷'],
  ['Prove as melhores picanhas, queijos e alfajores na tradicional Feirinha de Puerto Iguazú, com transporte privativo seguro e confortável.', 'Try the best steaks, cheeses and alfajores at the traditional Puerto Iguazú market, with safe and comfortable private transport.', 'Pruebe las mejores carnes, quesos y alfajores en la tradicional feria de Puerto Iguazú, con traslado privado seguro y cómodo.'],
  ['Travessia noturna com segurança até o centro gastronômico argentino.', 'Safe evening crossing to the Argentine food district.', 'Cruce nocturno seguro hasta el centro gastronómico argentino.'],
  ['Levo para jantar ou passear na feirinha, aguardo o horário combinado e retorno com você a Foz.', 'I take you to dinner or to stroll the market, wait for the agreed time and bring you back to Foz.', 'Lo llevo a cenar o a pasear por la feria, espero el horario acordado y regresamos juntos a Foz.'],

  ['Parque das Aves', 'Parque das Aves (Bird Park)', 'Parque das Aves (Parque de las Aves)'],
  ['Imersão na Mata Atlântica', 'Immersion in the Atlantic Forest', 'Inmersión en la Mata Atlántica'],
  ['Um santuário espetacular localizado bem em frente às Cataratas. Vivencie uma experiência única de imersão em viveiros gigantes com tucanos, araras e centenas de espécies de aves da Mata Atlântica.', 'A spectacular sanctuary right across from the Falls. Enjoy a unique experience inside giant aviaries with toucans, macaws and hundreds of Atlantic Forest bird species.', 'Un santuario espectacular justo frente a las Cataratas. Viva una experiencia única dentro de enormes aviarios con tucanes, guacamayos y cientos de especies de aves de la Mata Atlántica.'],
  ['Deixo você na entrada principal do parque no horário combinado.', 'I drop you at the main park entrance at the agreed time.', 'Lo dejo en la entrada principal del parque en el horario acordado.'],
  ['Levo até o local, aguardo o tempo da sua visita e faço o retorno com você para o hotel ou residência.', 'I take you there, wait during your visit and bring you back to your hotel or home.', 'Lo llevo al lugar, espero durante su visita y lo traigo de vuelta al hotel o a su residencia.'],

  ['Usina Hidrelétrica de Itaipu', 'Itaipu Hydroelectric Dam', 'Represa Hidroeléctrica de Itaipú'],
  ['Binacional Brasil / Paraguai', 'Binational Brazil / Paraguay', 'Binacional Brasil / Paraguay'],
  ['Conheça uma das maiores produtoras de energia limpa e renovável do planeta. Realize a visita panorâmica ou os circuitos especiais com a praticidade de um transfer privativo.', 'Visit one of the largest producers of clean, renewable energy on the planet. Take the panoramic tour or the special circuits with the convenience of a private transfer.', 'Conozca una de las mayores productoras de energía limpia y renovable del planeta. Realice la visita panorámica o los circuitos especiales con la practicidad de un traslado privado.'],
  ['Transporte direto até o Centro de Recepção de Visitantes da Itaipu.', 'Direct transport to the Itaipu Visitor Reception Center.', 'Traslado directo hasta el Centro de Recepción de Visitantes de Itaipú.'],
  ['Levo até o complexo turístico, aguardo o encerramento do tour e trago você de volta com total comodidade.', 'I take you to the tourist complex, wait until the tour ends and bring you back in total comfort.', 'Lo llevo al complejo turístico, espero que termine el tour y lo traigo de vuelta con total comodidad.'],

  ['Templo Budista Chen Yen', 'Chen Yen Buddhist Temple', 'Templo Budista Chen Yen'],
  ['Paz e Estátuas Gigantes', 'Peace and Giant Statues', 'Paz y Estatuas Gigantes'],
  ['Um refúgio de serenidade e contemplação em Foz do Iguaçu, com dezenas de estátuas douradas imponentes, uma imagem de Buda com 7 metros de altura e uma vista privilegiada da região.', 'A haven of serenity and contemplation in Foz do Iguaçu, with dozens of imposing golden statues, a 7-meter-tall Buddha and a privileged view of the region.', 'Un refugio de serenidad y contemplación en Foz do Iguaçu, con decenas de imponentes estatuas doradas, una imagen de Buda de 7 metros de altura y una vista privilegiada de la región.'],
  ['Transporte confortável direto até o portão de entrada do templo.', 'Comfortable, direct transport to the temple entrance gate.', 'Traslado cómodo y directo hasta la puerta de entrada del templo.'],
  ['Levo, aguardo a sua contemplação e fotografias pelo local, e retorno com você.', 'I take you, wait while you enjoy the place and take photos, and bring you back.', 'Lo llevo, espero mientras contempla y toma fotos del lugar, y regresamos juntos.'],

  ['Marco das Três Fronteiras', 'Triple Border Landmark', 'Hito de las Tres Fronteras'],
  ['Encontro do Brasil, Argentina e Paraguai', 'Where Brazil, Argentina and Paraguay meet', 'Encuentro de Brasil, Argentina y Paraguay'],
  ['O ponto histórico onde as fronteiras do Brasil, Argentina e Paraguai se encontram. Desfrute de um pôr do sol inesquecível, praça de alimentação temática e apresentações culturais à noites.', 'The historic spot where the borders of Brazil, Argentina and Paraguay meet. Enjoy an unforgettable sunset, a themed food court and cultural shows in the evenings.', 'El punto histórico donde se encuentran las fronteras de Brasil, Argentina y Paraguay. Disfrute de un atardecer inolvidable, patio de comidas temático y espectáculos culturales por la noche.'],
  ['Desembarque rápido e seguro na entrada do complexo cultural.', 'Quick, safe drop-off at the cultural complex entrance.', 'Descenso rápido y seguro en la entrada del complejo cultural.'],
  ['Levo para curtir a tarde e as atrações noturnas, aguardando o horário combinado para o regresso.', 'I take you to enjoy the afternoon and the evening attractions, waiting until the agreed time to return.', 'Lo llevo a disfrutar la tarde y las atracciones nocturnas, y espero el horario acordado para el regreso.'],

  ['Complexo Dreamland (Museu de Cera)', 'Dreamland Complex (Wax Museum)', 'Complejo Dreamland (Museo de Cera)'],
  ['Vale dos Dinossauros & Atrações', 'Dinosaur Valley & Attractions', 'Valle de los Dinosaurios y Atracciones'],
  ['Um excelente passeio para a família na Avenida das Cataratas, reunindo estátuas de cera em tamanho real de grandes ícones mundiais, o Vale dos Dinossauros animatrônicos e o Bar de Gelo.', 'A great family outing on Avenida das Cataratas, with life-size wax figures of world icons, the animatronic Dinosaur Valley and the Ice Bar.', 'Un excelente paseo familiar en la Avenida das Cataratas, con estatuas de cera a tamaño real de grandes íconos mundiales, el Valle de los Dinosaurios animatrónicos y el Bar de Hielo.'],
  ['Deixo você na entrada do complexo de entretenimento com total agilidade.', 'I drop you at the entertainment complex entrance quickly and easily.', 'Lo dejo en la entrada del complejo de entretenimiento con total agilidad.'],
  ['Levo até o local, aguardo a diversão da família e retorno com segurança para Foz.', 'I take you there, wait while the family has fun and bring you safely back to Foz.', 'Lo llevo al lugar, espero mientras la familia se divierte y regresamos con seguridad a Foz.'],

  ['Compras em Ciudad del Este (Paraguai)', 'Shopping in Ciudad del Este (Paraguay)', 'Compras en Ciudad del Este (Paraguay)'],
  ['Eletrônicos, Perfumes & Utilidades', 'Electronics, Perfumes & Household Goods', 'Electrónicos, Perfumes y Utilidades'],
  ['Vá às compras no comércio paraguaio (Nissei, CellShop, Monalisa e shoppings) com total tranquilidade. Livre-se do estresse com o trânsito da Ponte da Amizade e estacionamento.', 'Shop in Paraguay (Nissei, CellShop, Monalisa and malls) with total peace of mind. Skip the stress of Friendship Bridge traffic and parking.', 'Vaya de compras al comercio paraguayo (Nissei, CellShop, Monalisa y shoppings) con total tranquilidad. Olvídese del estrés del tránsito del Puente de la Amistad y del estacionamiento.'],
  ['Travessia segura e desembarque direto no centro comercial escolhido.', 'Safe border crossing and direct drop-off at the shopping area of your choice.', 'Cruce seguro y descenso directo en el centro comercial elegido.'],
  ['Levo ao Paraguai, fico aguardando no ponto de apoio/estacionamento com segurança para guardar as suas sacolas e trago de volta.', 'I take you to Paraguay, wait safely at the meeting point/parking so you can store your bags, and bring you back.', 'Lo llevo a Paraguay, espero en el punto de apoyo/estacionamiento con seguridad para guardar sus bolsas, y lo traigo de vuelta.']
];

const TEXTOS = { en: {}, es: {} };
const normalizar = (s) => String(s == null ? '' : s).replace(/\s+/g, ' ').trim();
TRADUCOES.forEach(([pt, en, es]) => {
  const k = normalizar(pt);
  TEXTOS.en[k] = en;
  TEXTOS.es[k] = es;
});

/* ---------- Idioma atual ---------- */
function detectarIdioma() {
  try {
    const salvo = localStorage.getItem('idioma');
    if (IDIOMAS_SITE.includes(salvo)) return salvo;
  } catch (e) { /* navegador sem armazenamento */ }
  const lista = (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || 'pt']);
  for (const l of lista) {
    const base = String(l).toLowerCase().slice(0, 2);
    if (IDIOMAS_SITE.includes(base)) return base;
  }
  return 'pt';
}

let IDIOMA = detectarIdioma();

/* Texto com variáveis: t('ateN', { n: 4 }) */
function t(chave, vars) {
  const tabela = UI[IDIOMA] || UI.pt;
  let s = tabela[chave] !== undefined ? tabela[chave] : (UI.pt[chave] || chave);
  Object.keys(vars || {}).forEach((k) => { s = s.split('{' + k + '}').join(vars[k]); });
  return s;
}

/* Tradução de um texto solto (cai no original se não houver tradução) */
function tx(pt) {
  if (IDIOMA === 'pt') return pt;
  const r = TEXTOS[IDIOMA][normalizar(pt)];
  return r === undefined ? pt : r;
}

/* ---------- Tradução da tela ---------- */
const ATRIBUTOS_TRADUZIVEIS = ['placeholder', 'alt', 'aria-label', 'title'];

function ignorarElemento(el) {
  return !el || !!(el.closest && el.closest('script, style, noscript, [data-no-i18n]'));
}

function traduzirTexto(no) {
  const dic = TEXTOS[IDIOMA];
  if (!dic) return;
  const original = no.__pt !== undefined ? no.__pt : no.nodeValue;
  const chave = normalizar(original);
  if (!chave) return;
  const r = dic[chave];
  if (r === undefined) return;
  if (no.__pt === undefined) no.__pt = no.nodeValue;
  const ini = original.match(/^\s*/)[0];
  const fim = original.match(/\s*$/)[0];
  no.nodeValue = ini + r + fim;
}

function traduzirAtributos(el) {
  const dic = TEXTOS[IDIOMA];
  if (!dic || !el.getAttribute) return;
  ATRIBUTOS_TRADUZIVEIS.forEach((attr) => {
    if (!el.hasAttribute(attr)) return;
    const memo = '__pt_' + attr;
    const original = el[memo] !== undefined ? el[memo] : el.getAttribute(attr);
    const r = dic[normalizar(original)];
    if (r === undefined) return;
    if (el[memo] === undefined) el[memo] = original;
    el.setAttribute(attr, r);
  });
}

function traduzirArvore(raiz) {
  if (IDIOMA === 'pt' || !raiz) return;
  if (raiz.nodeType === 3) {
    if (!ignorarElemento(raiz.parentElement)) traduzirTexto(raiz);
    return;
  }
  if (raiz.nodeType !== 1 || ignorarElemento(raiz)) return;

  const nos = [];
  const andador = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => (ignorarElemento(n.parentElement) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT)
  });
  let n;
  while ((n = andador.nextNode())) nos.push(n);
  nos.forEach(traduzirTexto);

  traduzirAtributos(raiz);
  raiz.querySelectorAll('[placeholder], [alt], [aria-label], [title]').forEach((el) => {
    if (!ignorarElemento(el)) traduzirAtributos(el);
  });
}

function restaurarPortugues() {
  const andador = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let n;
  while ((n = andador.nextNode())) {
    if (n.__pt !== undefined) { n.nodeValue = n.__pt; n.__pt = undefined; }
  }
  document.querySelectorAll('*').forEach((el) => {
    ATRIBUTOS_TRADUZIVEIS.forEach((attr) => {
      const memo = '__pt_' + attr;
      if (el[memo] !== undefined) { el.setAttribute(attr, el[memo]); el[memo] = undefined; }
    });
  });
}

/* Observa o que o código cria depois (destinos, FAQ, modais...) e traduz na hora */
let observadorIdioma = null;

function iniciarObservador() {
  if (observadorIdioma || !('MutationObserver' in window)) return;
  observadorIdioma = new MutationObserver((registros) => {
    if (IDIOMA === 'pt') return;
    observadorIdioma.disconnect();
    registros.forEach((r) => r.addedNodes.forEach((no) => traduzirArvore(no)));
    observadorIdioma.observe(document.body, { childList: true, subtree: true });
  });
  observadorIdioma.observe(document.body, { childList: true, subtree: true });
}

const BANDEIRAS = { pt: '🇧🇷', en: '🇺🇸', es: '🇪🇸' };

/* Botão único: mostra o idioma atual; as opções mostram os outros dois */
function atualizarBotoesIdioma() {
  const atual = document.getElementById('idiomaAtual');
  const opcoes = document.getElementById('idiomaOpcoes');
  if (!atual || !opcoes) return;

  atual.querySelector('.idioma-bandeira').textContent = BANDEIRAS[IDIOMA];
  atual.querySelector('.idioma-codigo').textContent = IDIOMA.toUpperCase();

  opcoes.innerHTML = '';
  IDIOMAS_SITE.filter((l) => l !== IDIOMA).forEach((l) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.lang = l;
    b.lang = LANG_HTML[l];
    b.setAttribute('aria-label', NOMES_IDIOMA[l]);
    b.textContent = BANDEIRAS[l] + ' ' + l.toUpperCase();
    opcoes.appendChild(b);
  });
}

function abrirIdiomas(abrir) {
  const caixa = document.getElementById('idiomaSeletor');
  const atual = document.getElementById('idiomaAtual');
  if (!caixa || !atual) return;
  caixa.classList.toggle('aberto', abrir);
  atual.setAttribute('aria-expanded', abrir ? 'true' : 'false');
}

function iniciarSeletorIdioma() {
  const caixa = document.getElementById('idiomaSeletor');
  const atual = document.getElementById('idiomaAtual');
  if (!caixa || !atual) return;

  atual.addEventListener('click', () => abrirIdiomas(!caixa.classList.contains('aberto')));

  caixa.addEventListener('click', (e) => {
    const botao = e.target.closest('.idioma-opcoes button');
    if (!botao) return;
    definirIdioma(botao.dataset.lang);
    abrirIdiomas(false);
    atual.focus();
  });

  document.addEventListener('click', (e) => {
    if (!caixa.contains(e.target)) abrirIdiomas(false);
  });

  caixa.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && caixa.classList.contains('aberto')) {
      abrirIdiomas(false);
      atual.focus();
    }
  });
}

function definirIdioma(lang) {
  if (!IDIOMAS_SITE.includes(lang) || lang === IDIOMA) return;

  restaurarPortugues();
  IDIOMA = lang;
  try { localStorage.setItem('idioma', lang); } catch (e) { /* ok */ }

  document.documentElement.lang = LANG_HTML[lang];
  traduzirArvore(document.body);
  atualizarBotoesIdioma();

  // O código do site refaz o que tem texto com variáveis (passageiros, "Ver todos"...)
  if (typeof aoMudarIdioma === 'function') aoMudarIdioma();
}

document.addEventListener('DOMContentLoaded', () => {
  document.documentElement.lang = LANG_HTML[IDIOMA];
  atualizarBotoesIdioma();
  iniciarSeletorIdioma();
  traduzirArvore(document.body);
  iniciarObservador();
});
