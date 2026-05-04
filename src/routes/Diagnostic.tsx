import { useState } from "react";

interface Question {
  id: string;
  text: string;
  options: { label: string; next: string | null; result?: Diagnosis }[];
}

interface Diagnosis {
  problem: string;
  severity?: "info" | "warn" | "critical";
  causes: string[];
  fixes: string[];
  prevention?: string[];
}

const D = (d: Diagnosis): { result: Diagnosis } => ({ result: d });

const questions: Record<string, Question> = {
  // ============ ROOT ============
  start: {
    id: "start",
    text: "¿Qué tipo de cultivo tienes problema con?",
    options: [
      { label: "🌿 Cannabis", next: "cannabis_q1" },
      { label: "🍄 Setas Psilocybe / Trufas", next: "setas_q1" },
      { label: "🌵 Cactus mescalínico", next: "cactus_q1" },
      { label: "🍯 Hidromiel / Cerveza / Sidra", next: "ferment_q1" },
      { label: "🍄 Amanita muscaria", next: "amanita_q1" },
      { label: "🪴 Ayahuasca (Caapi/Chacruna)", next: "aya_q1" },
      { label: "🌳 DMT / Mimosa hostilis", next: "dmt_q1" },
      { label: "🌿 Plantas suaves (Salvia/Damiana/Kava/Kanna/Lotus)", next: "plantas_q1" },
    ],
  },

  // ============ CANNABIS ============
  cannabis_q1: {
    id: "cannabis_q1",
    text: "Síntoma cannabis:",
    options: [
      { label: "🟡 Hojas amarillas", next: "cannabis_amarillo" },
      { label: "🔥 Puntas marrones / quemadas", next: "cannabis_quemado" },
      { label: "📏 Plantas alargadas/débiles", next: null, ...D({ problem: "Etiolación (poca luz)", severity: "warn", causes: ["Distancia LED demasiado lejos", "Pocas horas de luz", "Espectro deficiente"], fixes: ["Acercar lámpara progresivamente (vigila calor)", "18h luz vegetativa, 12/12 floración estricto", "LED full spectrum mínimo 100W/planta"] }) },
      { label: "❄️ Manchas blancas polvorientas", next: null, ...D({ problem: "Oídio (Powdery Mildew)", severity: "critical", causes: ["Humedad alta + ventilación pobre", "Cogollos densos sin separar", "Variación temp noche/día"], fixes: ["Bajar humedad <60% urgente", "Mejorar ventilación + extractor", "Bicarbonato sódico 5g/L pulverizado o azufre", "Eliminar hojas afectadas y QUEMARLAS"], prevention: ["Defoliación moderada", "Humedad 40-50% en floración"] }) },
      { label: "🐛 Bichos en hojas", next: "cannabis_plagas" },
      { label: "🍃 Hojas torcidas/curvadas", next: "cannabis_torcidas" },
      { label: "🌸 Problema en flores", next: "cannabis_flores" },
      { label: "💧 Riego (encharcado/seco)", next: "cannabis_riego" },
      { label: "🤔 No sé cuándo cosechar", next: "cannabis_cosecha_timing" },
      { label: "🦠 Hongos en raíces o tallo", next: "cannabis_hongo_raiz" },
      { label: "📉 Mala cosecha (poco rendimiento)", next: "cannabis_rendimiento" },
    ],
  },
  cannabis_amarillo: {
    id: "cannabis_amarillo",
    text: "¿Dónde están las hojas amarillas?",
    options: [
      { label: "Hojas viejas (abajo)", next: null, ...D({ problem: "Falta de Nitrógeno (N)", causes: ["Sustrato agotado", "Riego sin nutrientes último mes", "Drenaje excesivo lava nutrientes"], fixes: ["Fertilizar NPK alto N (Bio·Bizz Grow 2-3ml/L)", "Verificar pH 6.0-6.5", "En floración tardía cierto amarilleo viejo es NORMAL"], prevention: ["Fertilizar regular según fase"] }) },
      { label: "Hojas nuevas (arriba)", next: null, ...D({ problem: "Falta Hierro/Azufre/Calcio", causes: ["pH descompensado bloquea absorción", "Sustrato pobre micronutrientes", "Riego con agua osmosis sin Cal-Mag"] , fixes: ["Verificar y corregir pH 6.0-6.5", "Quelato hierro pulverizado foliar", "Cal-Mag suplemento si agua osmosis"] }) },
      { label: "Punto medio uniforme", next: null, ...D({ problem: "Bloqueo nutrientes por pH", causes: ["pH fuera rango (<5.5 o >7.0)", "Acumulación sales sustrato"], fixes: ["LAVADO raíces 3x volumen maceta agua pH 6.2", "Verificar pH agua y EC sustrato"] }) },
      { label: "Manchas amarillas/marrones puntuales", next: null, ...D({ problem: "Posible deficiencia Magnesio o plagas", causes: ["Mg bajo", "Araña roja primera fase"], fixes: ["Epsom salts 1g/L riego", "Inspeccionar lupa bajo hojas"] }) },
    ],
  },
  cannabis_quemado: {
    id: "cannabis_quemado",
    text: "¿Cómo es la quemadura?",
    options: [
      { label: "Solo puntas (tip burn)", next: null, ...D({ problem: "Exceso fertilizante", severity: "warn", causes: ["Demasiado nutriente concentrado", "EC alta sustrato"], fixes: ["Reducir dosis fert 30-50%", "Lavado ligero solo agua 1-2 días", "Usar EC meter para precisión"] }) },
      { label: "Hojas enteras crujientes marrones", next: null, ...D({ problem: "Estrés calor o quemadura LED directa", severity: "critical", causes: ["LED demasiado cerca", "Temp >30°C constante", "Falta ventilación"], fixes: ["Subir LED 10-15cm", "Aire fresco extractor", "Tarpaulin térmica si verano"] }) },
      { label: "Bordes amarillos/marrones (necrosis)", next: null, ...D({ problem: "Exceso K o quemadura sales", causes: ["Acumulación sales", "pH bloqueando absorción"], fixes: ["Lavado raíces", "Reducir Bloom 50%"] }) },
    ],
  },
  cannabis_plagas: {
    id: "cannabis_plagas",
    text: "Identifica plaga:",
    options: [
      { label: "Pequeños rojos/marrones + telarañas finas", next: null, ...D({ problem: "Araña roja (Tetranychus urticae)", severity: "critical", causes: ["Ambiente seco caliente >27°C", "Plantas estresadas", "Importada con esquejes"], fixes: ["URGENTE neem 5ml/L cada 3 días × 3 ciclos", "Subir humedad >50%", "Bajar temp <25°C", "Phytoseiulus persimilis depredador biológico", "En floración avanzada: piretrinas naturales"] , prevention: ["Cuarentena esquejes nuevos", "Inspección lupa semanal envés hojas"] }) },
      { label: "Verdes pequeños racimos blandos", next: null, ...D({ problem: "Pulgón (Aphididae)", severity: "warn", causes: ["Plantas débiles N alto exceso", "Sin depredadores"], fixes: ["Jabón potásico 5g/L cada 5d", "Mariquitas (Adalia bipunctata)", "Aceite neem 5ml/L"] }) },
      { label: "Mosquitas blancas que vuelan al sacudir", next: null, ...D({ problem: "Mosca blanca (Trialeurodes vaporariorum)", severity: "warn", causes: ["Humedad alta + temp 22-28°C", "Plantas hacinadas"], fixes: ["Trampas amarillas adhesivas", "Aceite neem", "Encarsia formosa parasitoide"] }) },
      { label: "Pequeños brincan en sustrato", next: null, ...D({ problem: "Sciaridae (mosca del sustrato)", severity: "warn", causes: ["Sustrato encharcado", "Materia orgánica descompuesta"], fixes: ["Dejar secar bien entre riegos", "Trampas amarillas + arena en superficie sustrato", "BTI biológico Bacillus thuringiensis", "Steinernema feltiae nematodos"] }) },
      { label: "Pequeños trips delgados marrones", next: null, ...D({ problem: "Trips (Frankliniella)", severity: "warn", causes: ["Plantas estresadas", "Sustrato seco"], fixes: ["Trampas azules adhesivas", "Spinosad 1ml/L pulverizado", "Subir humedad"] }) },
      { label: "Babosas en exterior", next: null, ...D({ problem: "Babosas/caracoles", causes: ["Humedad noche exterior", "Mantillo grueso"], fixes: ["Cebos cerveza enterrados", "Cobre alrededor maceta", "Ferramol fosfato hierro inocuo"] }) },
    ],
  },
  cannabis_torcidas: {
    id: "cannabis_torcidas",
    text: "¿Cómo torcidas?",
    options: [
      { label: "Hojas en garra hacia abajo", next: null, ...D({ problem: "Exceso Nitrógeno (N toxicity)", severity: "warn", causes: ["Demasiado fertilizante", "Hojas muy verdes oscuras"], fixes: ["Reducir Bio·Grow 50%", "Lavado raíces ligero", "Esperar 3-5 días"] }) },
      { label: "Borde curvado hacia arriba (taco)", next: null, ...D({ problem: "Estrés calor", severity: "warn", causes: ["Temperatura alta >28°C", "LED muy cerca"], fixes: ["Subir lámpara", "Mejorar ventilación", "AC si necesario"] }) },
      { label: "Hojas onduladas / arrugadas", next: null, ...D({ problem: "Posible virus o estrés persistente", severity: "warn", causes: ["TMV/HpLVd virus genético", "Estrés agudo: pH, temp, riego"], fixes: ["Verificar todas las condiciones", "Si persiste: TMV no curable, descartar planta y esterilizar tijeras"] }) },
      { label: "Tallos y hojas retorcidos", next: null, ...D({ problem: "HpLVd (Hop Latent Viroid) o estrés", severity: "critical", causes: ["Viroide endémico cannabis (silently spread)", "Estrés crónico"], fixes: ["Test viroide si disponible (Medicinal Genomics)", "Si HpLVd confirmado: descartar TODAS plantas + esterilizar tijeras + macetas", "Próximas semillas certificadas libres"] }) },
    ],
  },
  cannabis_flores: {
    id: "cannabis_flores",
    text: "¿Problema en flores?",
    options: [
      { label: "Bolas/sacos polen mezclados con flores", next: null, ...D({ problem: "Hermafrodita (estrés)", severity: "critical", causes: ["Fugas luz oscuridad", "Estrés temp/riego", "Genética inestable"], fixes: ["URGENTE: identificar y eliminar bolas con pinzas (semana 4-6)", "Verificar 0 fugas luz periodo OFF", "Si abundante hermafroditismo: descartar planta (semillará todo)", "Próxima vez: verificar variedad estable + sin fugas luz"] , prevention: ["Tape sellado armario", "Genéticas estables RQS, Sweet Seeds"] }) },
      { label: "Cogollos foxtail (puntas alargadas raras)", next: null, ...D({ problem: "Foxtailing (estrés calor o luz)", severity: "warn", causes: ["LED muy cerca + intenso", "Temp >28°C", "Estrés re-vegetación"], fixes: ["Subir LED + bajar intensidad", "Bajar temp", "Foxtail no degrada potencia mucho, se puede cosechar normal"] }) },
      { label: "Cogollo blanqueado/decolorado", next: null, ...D({ problem: "Light burn LED intenso", severity: "warn", causes: ["LED demasiado cerca + intenso 100%"], fixes: ["Subir 10-15cm o dimmar 70-80%", "Bleached areas pierden potencia: no recuperan"] }) },
      { label: "Manchas marrones interior cogollo + hojas mojadas alrededor", next: null, ...D({ problem: "BUD ROT / Botrytis (moho gris)", severity: "critical", causes: ["Humedad alta floración tardía", "Cogollos densos sin aire interno", "Otoño exterior con lluvia"], fixes: ["URGENTE: eliminar cogollos afectados con tijeras + 5cm alrededor", "Bajar humedad <50%", "Aumentar ventilación interna entre cogollos", "Si epidemia exterior: cosechar TODO inmediato (no esperar madurez óptima)"] , prevention: ["Defoliación interior cogollos", "Humedad <50% últimas 3 semanas", "Cosecha early si lluvias previstas"] }) },
      { label: "Tricomas no se forman / pocos", next: null, ...D({ problem: "Variedad pobre o estrés", causes: ["Genética baja resina", "Estrés persistente", "Falta P+K floración"], fixes: ["Verificar dosis Bloom adecuada", "Reducir estrés ambiental"] }) },
      { label: "Cogollos sueltos / aireados (larfy)", next: null, ...D({ problem: "Falta luz penetración", severity: "info", causes: ["Cogollos bajos sin luz suficiente", "Falta defoliación"], fixes: ["Lollipop: quitar partes inferiores que no reciben luz", "Defoliación moderada", "LST para abrir canopy"] }) },
    ],
  },
  cannabis_riego: {
    id: "cannabis_riego",
    text: "¿Síntoma riego?",
    options: [
      { label: "Sustrato siempre encharcado", next: null, ...D({ problem: "Exceso agua + drenaje pobre", severity: "warn", causes: ["Riego demasiado frecuente", "Maceta sin agujeros suficientes", "Sustrato compactado"], fixes: ["DEJAR secar 4-7 días", "Solo regar cuando peso maceta sea bajo", "Si sustrato compactado: trasplantar con perlita 30%"] }) },
      { label: "Sustrato siempre seco / planta marchita", next: null, ...D({ problem: "Falta agua o problema raíz", severity: "warn", causes: ["Riego insuficiente", "Maceta pequeña + planta grande", "Raíces pudridas no absorben"], fixes: ["Riego abundante hasta drenar", "Si riegas y se queda seco rápido + planta caída: trasplantar a maceta mayor", "Si raíces marrones: pythium — agua oxigenada 3% diluida 10%"] }) },
      { label: "Hojas caídas tras regar", next: null, ...D({ problem: "Estrés temp agua o pH", causes: ["Agua muy fría", "pH muy bajo riego", "Cambio brusco"], fixes: ["Agua a temp ambiente", "Verificar pH agua 6.0-6.5", "Riegos consistentes en horario"] }) },
    ],
  },
  cannabis_cosecha_timing: {
    id: "cannabis_cosecha_timing",
    text: "¿Estado tricomas (con lupa 60x)?",
    options: [
      { label: "Tricomas claros transparentes", next: null, ...D({ problem: "Demasiado pronto cosechar", severity: "info", causes: ["THC aún no pico"], fixes: ["ESPERA 1-2 semanas más", "Tricomas deben volverse lechosos opacos = pico THC"] }) },
      { label: "70-80% lechosos + 10-20% ámbar", next: null, ...D({ problem: "PUNTO ÓPTIMO", severity: "info", causes: ["Tricomas en pico THC + algunos ámbar (CBN sedante)"], fixes: ["✅ COSECHAR YA. Lavado raíces 10d previos", "Cortar al amanecer (THC pico nocturno)"] }) },
      { label: ">50% ámbar", next: null, ...D({ problem: "Cosecha tardía", severity: "warn", causes: ["THC degradándose a CBN", "Efecto más sedante menos cerebral"], fixes: ["Cosechar YA si quieres efecto mixto", "Pierdes algo potencia THC pero ganas CBN sedante"] }) },
      { label: "No tengo lupa", next: null, ...D({ problem: "Necesitas lupa 60x", severity: "info", causes: ["Sin lupa imposible juzgar tricomas"], fixes: ["Comprar lupa 60-100x bolsillo (5-10€ Amazon)", "Mientras tanto: pelitos pistilos 80% marrones = aproximación"] }) },
    ],
  },
  cannabis_hongo_raiz: {
    id: "cannabis_hongo_raiz",
    text: "¿Cómo se manifiesta?",
    options: [
      { label: "Tallo pudrido en línea agua/sustrato", next: null, ...D({ problem: "Pythium (damping off)", severity: "critical", causes: ["Sustrato muy húmedo", "Plántulas débiles"], fixes: ["URGENTE: parar riego", "Trasplantar parte sana si posible", "H₂O₂ 3% diluido 1:10 al riego (oxigena)", "Beneficial microbes Trichoderma harzianum prevención"] }) },
      { label: "Hojas amarillas + raíces marrones blandas", next: null, ...D({ problem: "Root rot avanzado", severity: "critical", causes: ["Encharcamiento crónico", "Sustrato sin oxígeno"], fixes: ["Trasplantar inmediato a sustrato seco con perlita 50%", "Cortar raíces dañadas con tijeras esterilizadas", "Beneficial bacteria boost", "Reducir frecuencia riego permanente"] }) },
      { label: "Hojas marchitas verde apagado sin causa aparente", next: null, ...D({ problem: "Posible Fusarium o pythium temprano", severity: "warn", causes: ["Patógeno suelo"], fixes: ["Inspeccionar raíces sacando planta", "Si marrones: ver opción 2"] }) },
    ],
  },
  cannabis_rendimiento: {
    id: "cannabis_rendimiento",
    text: "¿Qué fue mal?",
    options: [
      { label: "Plantas muy pequeñas", next: null, ...D({ problem: "Vegetativa corta o nutrición pobre", causes: ["Cambio fotoperiodo demasiado pronto", "Maceta pequeña limitó raíces", "Sustrato pobre"], fixes: ["Próximo: vegetativa hasta 50-70cm antes 12/12", "Maceta final 15-25L mínimo", "Sustrato calidad + Bio·Bizz líneas completas"] }) },
      { label: "Cogollos pequeños y sueltos", next: null, ...D({ problem: "Genética + condiciones", causes: ["Variedad de bajo rendimiento", "P+K insuficiente floración", "Luz insuficiente"], fixes: ["Variedades Critical, Northern Lights = alta producción", "Bio·Bizz Bloom dosis adecuada hasta sem -2 cosecha", "LED >100W/planta full spectrum"] }) },
      { label: "Cogollos buenos pero pocos", next: null, ...D({ problem: "Falta poda/LST", causes: ["Sin trabajo planta = pocos cogollos grandes top"], fixes: ["LST temprano: doblar tallo principal sem 2-3 vegetativa", "FIM/topping en sem 3-4", "Defoliación moderada"] }) },
    ],
  },

  // ============ SETAS ============
  setas_q1: {
    id: "setas_q1",
    text: "Síntoma setas/trufas:",
    options: [
      { label: "🟢 Manchas verdes/azules", next: null, ...D({ problem: "Trichoderma (mold contaminación)", severity: "critical", causes: ["Contaminación durante inoculación", "Esterilización insuficiente", "Humedad excesiva sustrato"], fixes: ["DESECHAR lote (no salvable, esporas micro)", "Sellar bolsa + tirar a basura cerrada", "Próxima vez: SAB + esterilización 90 min completa", "Aguja flameada al rojo + ambiente sin corriente"] , prevention: ["Técnica aséptica estricta", "Esterilizar TODO incluso herramientas"] }) },
      { label: "⚫ Manchas negras", next: null, ...D({ problem: "Aspergillus / moho negro", severity: "critical", causes: ["Esporas aire", "Humedad ambiental excesiva sin FAE"], fixes: ["DESECHAR lote PELIGROSO inhalación esporas", "Manejar con guantes + mascarilla", "No abrir cerca cara"] }) },
      { label: "🕸️ Capa algodonosa blanca difusa (NO densa)", next: null, ...D({ problem: "Cobweb mold (Dactylium)", severity: "warn", causes: ["Humedad excesiva sin aire", "Bulk muy mojado"], fixes: ["Pulverizar peróxido 3% diluido 1:10 sobre afectado", "Reducir humedad temporalmente <80%", "Mejorar FAE", "Si extiende >1/4 superficie: desechar"] }) },
      { label: "🟡 Líquido amarillo + olor podrido", next: null, ...D({ problem: "Contaminación bacteriana (wet rot)", severity: "critical", causes: ["Esterilización fallida", "Humedad excesiva sustrato", "Demasiada agua añadida"], fixes: ["DESECHAR lote (peligroso)", "Lavar cámara con lejía + alcohol 70%", "Próxima vez técnica aséptica + bulk hidratado correcto (no encharcado)"] }) },
      { label: "🍄 Setas alargadas, débiles, sombrero pequeño", next: null, ...D({ problem: "CO₂ excesivo (sin FAE)", severity: "warn", causes: ["Cámara muy cerrada", "Sin intercambio aire suficiente"], fixes: ["FAE 3-4x/día abanicar 30s", "Aumentar agujeros monotub", "Setas siguen comestibles, menos potentes"] }) },
      { label: "🚫 Sin primordios día 18-21", next: null, ...D({ problem: "Fructificación atascada", severity: "warn", causes: ["Humedad insuficiente", "Sin FAE", "Sin shock luz/temp"], fixes: ["Subir humedad 90%+", "Cold shock: nevera 12h", "Luz indirecta 6-12h/día (NO directa)", "Esperar otros 5-7 días tras shock"] }) },
      { label: "👥 Aborts (primordios marrones que no crecen)", next: null, ...D({ problem: "Aborts frecuente", severity: "info", causes: ["Humedad bajó <80%", "Sustrato seco", "Choque temp"], fixes: ["Aumentar humedad consistente 90%+", "Hidratar bulk (spray, no encharcar)", "Estabilizar temp 22-26°C"] }) },
      { label: "🔄 Segundo flush no aparece", next: null, ...D({ problem: "Bulk agotado o seco", severity: "info", causes: ["Sustrato consumido", "Humedad post-flush 1 baja"], fixes: ["Rehidratación dunking: sumergir bloque 2-4h en agua", "Cold shock 12h nevera tras dunking", "Si sigue sin: tras flush 3-4 normal que pare"] }) },
      { label: "📉 Solo cosecha pobre primer flush", next: null, ...D({ problem: "Subóptimo (varias causas)", causes: ["FAE insuficiente", "Humedad inestable", "Sustrato baja calidad", "Cepa débil"], fixes: ["Verificar todos parámetros", "Cepas robustas: Golden Teacher, B+ para iniciar"] }) },
    ],
  },

  // ============ CACTUS ============
  cactus_q1: {
    id: "cactus_q1",
    text: "Síntoma cactus:",
    options: [
      { label: "💧 Base se ablanda/podrida", next: null, ...D({ problem: "Pudrición exceso agua", severity: "critical", causes: ["Riego excesivo invierno", "Drenaje pobre", "Sustrato no apropiado"], fixes: ["URGENTE: parar riego", "Sacar planta examinar raíces", "Cortar zona sana arriba con cuchillo esterilizado", "Callusing 2-3 semanas zona seca", "Replantar en sustrato cactus 70% + perlita 30% maceta drenaje"] }) },
      { label: "🟡 Color amarillento", next: null, ...D({ problem: "Estrés sol/riego/trasplante", causes: ["Aclimatación brusca sol", "Trasplante reciente", "Exceso o falta agua"], fixes: ["Sombra parcial 2-3 semanas", "Dejar secar bien sustrato", "Esperar — recupera lento"] }) },
      { label: "🚫 No crece años", next: null, ...D({ problem: "Falta nutrientes/luz/espacio", causes: ["Sustrato agotado", "Sol insuficiente", "Maceta pequeña"], fixes: ["Fertilizante cactus mensual mar-sep media dosis", "Sol 4-6h directo", "Trasplante maceta mayor + sustrato fresco"] }) },
      { label: "🤎 Manchas marrones secas", next: null, ...D({ problem: "Quemadura solar o golpe físico", causes: ["Cambio brusco a sol intenso", "Daño mecánico"], fixes: ["No tratamiento — heridas se sellan solas", "Marca quedará permanente (cosmético)"] }) },
      { label: "🕷️ Pequeños insectos blancos algodonosos", next: null, ...D({ problem: "Cochinilla algodonosa", severity: "warn", causes: ["Plaga común cactus", "Importada con planta nueva"], fixes: ["Quitar manualmente con bastoncillo + alcohol 70%", "Aceite neem cada 7 días", "Aislar planta afectada"] }) },
      { label: "📏 Cactus muy delgado/etiolado en parte", next: null, ...D({ problem: "Etiolación (poca luz)", severity: "info", causes: ["Sol insuficiente", "Crecimiento invierno con poca luz"], fixes: ["Más sol gradualmente", "Etiolación se queda permanente cosméticamente, parte nueva sera normal"] }) },
      { label: "🧀 Corchotamiento base", next: null, ...D({ problem: "Corking (envejecimiento natural)", severity: "info", causes: ["Cactus maduro", "Estrés crónico mejorable"], fixes: ["NORMAL en cactus viejos +5 años", "Si extiende rápido: revisar riego/sol"] }) },
    ],
  },

  // ============ FERMENTACIÓN ============
  ferment_q1: {
    id: "ferment_q1",
    text: "Síntoma fermentación:",
    options: [
      { label: "🚫 No burbujea airlock 48h", next: null, ...D({ problem: "Levadura inactiva", severity: "warn", causes: ["Mosto >30°C al inocular = mata levadura", "Tapón mal sellado (CO₂ sale por fuera)", "Levadura caducada"], fixes: ["Verificar densidad: si bajó SÍ fermenta aunque no veas burbujear", "Re-inocular levadura nueva rehidratada en agua tibia 15min", "Verificar sellado airlock con agua"] }) },
      { label: "🍶 Sabor a vinagre", next: null, ...D({ problem: "Acetobacter (bacteria acética)", severity: "critical", causes: ["Contacto excesivo oxígeno", "Sanitización fallada", "Airlock seco"], fixes: ["Lote PERDIDO como bebida — útil como vinagre artesanal", "Continuar 2-3 sem más: vinagre artesanal premium", "Próxima vez: airlock SIEMPRE con agua + Star San TODO el equipo"] }) },
      { label: "🟢 Capa peluda blanca/verde superficie", next: null, ...D({ problem: "Moho contaminación", severity: "critical", causes: ["Exposición aire prolongada", "Sanitización fallada"], fixes: ["TIRAR lote completo", "Lavar fermentador + Star San antes próximo uso", "Verificar airlock con agua sin fugas"] }) },
      { label: "🛑 Fermentación parada (stuck)", next: null, ...D({ problem: "Stuck fermentation", severity: "warn", causes: ["Temp baja <15°C levadura dormida", "Nutrientes agotados", "ABV alto pasa tolerancia levadura", "pH muy bajo"], fixes: ["Subir temp a 20-22°C gradualmente", "Añadir nutriente levadura (DAP/Fermaid-K)", "Rehidratar levadura nueva más resistente y añadir", "Verificar densidad antes de actuar"] }) },
      { label: "🥚 Sabor azufre/huevo podrido", next: null, ...D({ problem: "H₂S sulfuro hidrógeno", severity: "warn", causes: ["Levadura estresada (temp/nutrientes)", "Pobre N en mosto"], fixes: ["Splash trasiego oxigena y disipa H₂S", "Añadir nutriente levadura", "Maduración 2-4 semanas suele mitigar"] }) },
      { label: "🧈 Sabor mantequilla/butterscotch", next: null, ...D({ problem: "Diacetil", severity: "warn", causes: ["Fermentación incompleta", "Trasiego prematuro"], fixes: ["Subir temp 22-24°C 3-5 días post-fermentación primaria (rest diacetyl)", "Esperar madurar más antes embotellar"] }) },
      { label: "🌽 Sabor maíz cocido (DMS)", next: null, ...D({ problem: "DMS (dimetilsulfuro)", severity: "info", causes: ["Hervor cubierto que retiene DMS", "Enfriado lento"], fixes: ["Próximo lote: hervor SIN tapa + chiller rápido <30min a 20°C"] }) },
      { label: "💥 Botellas explotando / espuma excesiva", next: null, ...D({ problem: "Sobrecarbonatación (gushers/bottle bombs)", severity: "critical", causes: ["Fermentación no terminada al embotellar", "Demasiado priming sugar", "Levadura silvestre"], fixes: ["URGENTE: meter botellas en frío (4°C) ralentiza", "Abrir TODAS sobre fregadero gradualmente", "Próxima: verificar densidad estable 3 días antes embotellar + medir priming exacto 6g/L"] }) },
      { label: "💨 Sin carbonatación tras embotellar", next: null, ...D({ problem: "Carbonatación insuficiente", severity: "info", causes: ["Olvidar priming sugar", "Temp baja <16°C botellas tras embotellado", "Levadura agotada"], fixes: ["Esperar 3-4 semanas a 18-22°C", "Si nada: añadir nueva levadura champagne + priming sugar (peligroso, hacer solo 1 botella test)"] }) },
      { label: "🌫️ Cerveza turbia", next: null, ...D({ problem: "Turbidez normal homebrew", severity: "info", causes: ["Levaduras suspensión", "Proteínas malta", "Sin clarificante"], fixes: ["Cold crash 24-48h en nevera antes embotellar", "Irish Moss en hervor", "Tiempo + frío = clarificación natural"] }) },
    ],
  },

  // ============ AMANITA ============
  amanita_q1: {
    id: "amanita_q1",
    text: "Problema con Amanita:",
    options: [
      { label: "❓ Identificación (¿es muscaria o veneno?)", next: null, ...D({ problem: "DUDA identificación CRÍTICA", severity: "critical", causes: ["Confusión Amanita muscaria vs phalloides MORTAL"], fixes: ["NO consumir SIN verificación 100%", "muscaria: sombrero ROJO + verrugas blancas + láminas blancas + anillo + base bulbosa", "phalloides MORTAL: verde-oliva sin verrugas + láminas blancas + volva en base", "Verificar con micólogo experto + foto + sporada", "Apps no son suficientes (tasa error >5%)"] }) },
      { label: "🤢 Náuseas tras consumir muscaria", next: null, ...D({ problem: "Ácido iboténico sin decarbox", severity: "critical", causes: ["No decarboxilación", "Muscimol bajo + iboténico alto"], fixes: ["Decarboxilar SIEMPRE antes consumo", "80°C horno 1h sobre seca", "O agua acidulada pH 2.5-3 simmer 3h", "Si síntomas graves >2h: 112 emergencias"] }) },
      { label: "📦 Setas mohosas tras secado", next: null, ...D({ problem: "Mal secado contaminación", severity: "warn", causes: ["Humedad ambiente alta secado", "Setas húmedas guardadas"], fixes: ["Tirar afectadas", "Secado: deshidratador 50°C o aire seco ventilado 5-7 días", "Frasco hermético + sílica gel"] }) },
    ],
  },

  // ============ AYAHUASCA ============
  aya_q1: {
    id: "aya_q1",
    text: "Problema con Caapi/Chacruna:",
    options: [
      { label: "🍂 Hojas amarillas", next: null, ...D({ problem: "Estrés frío o agua", severity: "warn", causes: ["Temp <18°C", "Riego inconsistente", "Cambio brusco ambiente"], fixes: ["Mantener >20°C constante", "Pulverizar hojas para humedad ambiental >70%", "Riego regular (no encharcar)"] }) },
      { label: "🥀 Hojas marchitas se caen", next: null, ...D({ problem: "Falta humedad o transplant shock", severity: "warn", causes: ["Humedad ambiental baja", "Trasplante reciente", "Frío"], fixes: ["Humidificador + bandeja agua", "Cubrir con bolsa transparente 1 sem si shock", "Calefactor 22°C estable"] }) },
      { label: "🚫 Vid Caapi no crece", next: null, ...D({ problem: "Condiciones subóptimas", causes: ["Frío", "Maceta pequeña", "Sustrato pobre"], fixes: ["Maceta 25-30L mínimo con tutor", "Sustrato rico tropical orgánico", "Calor + humedad alta + sol indirecto"] }) },
      { label: "🐛 Plagas hojas Chacruna", next: null, ...D({ problem: "Cochinilla o araña roja interior", severity: "warn", causes: ["Ambiente seco interior", "Sin enemigos naturales"], fixes: ["Pulverizar hojas + neem 5ml/L", "Subir humedad (Chacruna ama humedad)", "Aislar de otras plantas"] }) },
    ],
  },

  // ============ DMT ============
  dmt_q1: {
    id: "dmt_q1",
    text: "Problema con Mimosa:",
    options: [
      { label: "🥚 Semillas no germinan", next: null, ...D({ problem: "Falta escarificación", severity: "warn", causes: ["Mimosa hostilis tiene cubierta dura", "Sin pre-tratamiento"], fixes: ["Escarificación: agua hirviendo + remojo 24h", "O lijar suave cada semilla", "Plantar 1cm profundidad, sustrato húmedo no encharcado", "Calor 25-28°C, germina 1-3 sem"] }) },
      { label: "🍂 Hojas amarillas planta joven", next: null, ...D({ problem: "Estrés frío o exceso agua", severity: "warn", causes: ["Frío <15°C invierno", "Maceta no drena"], fixes: ["Interior invierno >18°C", "Drenaje extremo + sustrato + arena 30%", "Reducir riego invierno"] }) },
      { label: "📏 Crece muy lento años", next: null, ...D({ problem: "Mimosa madura LENTO", severity: "info", causes: ["Año 1-3 establecimiento raíces", "Frío detiene crecimiento"], fixes: ["NORMAL: cosecha raíz año 5+", "Acelerar con calor + humedad + maceta grande 30L", "Jardín exterior mediterráneo: 2x más rápido"] }) },
    ],
  },

  // ============ PLANTAS SUAVES ============
  plantas_q1: {
    id: "plantas_q1",
    text: "Problema:",
    options: [
      { label: "🍃 Salvia divinorum hojas marchitas", next: null, ...D({ problem: "Salvia subóptima ambiente", severity: "warn", causes: ["Sol directo (Salvia odia)", "Humedad <60%", "Sustrato seco"], fixes: ["Sombra parcial total", "Cubrir maceta con bolsa transparente para humedad alta primeros días", "Pulverizar hojas diario", "Sustrato siempre húmedo no encharcado"] }) },
      { label: "🌴 Kava no crece / hojas amarillas", next: null, ...D({ problem: "Kava subóptimo", severity: "warn", causes: ["Frío <18°C", "Humedad ambiental baja", "Sol directo intenso"], fixes: ["Interior cálido año redondo", "Humidificador imprescindible >70%", "Sombra parcial"] }) },
      { label: "🌿 Damiana no florece", next: null, ...D({ problem: "Falta sol/calor o joven", severity: "info", causes: ["Sol insuficiente", "Planta joven primer año"], fixes: ["Sol pleno mediterráneo", "Espera año 2 floración consistente"] }) },
      { label: "🌵 Kanna pudrida", next: null, ...D({ problem: "Exceso agua", severity: "warn", causes: ["Riego frecuente (Kanna como cactus)", "Drenaje pobre"], fixes: ["Solo regar cuando sustrato TOTALMENTE seco", "Sustrato cactus + perlita", "Si pudrición: cortar parte sana + replantar"] }) },
      { label: "🪷 Blue Lotus hojas amarillas en estanque", next: null, ...D({ problem: "Agua sucia o frío", severity: "warn", causes: ["Agua estancada con cloro", "Temp agua <20°C", "Falta sol"], fixes: ["Agua sin cloro (reposar 24h)", "Mover a sol más", "Renovar 30% agua mensual"] }) },
    ],
  },
};

export default function Diagnostic() {
  const [currentId, setCurrentId] = useState("start");
  const [history, setHistory] = useState<string[]>([]);
  const [result, setResult] = useState<Diagnosis | null>(null);

  const current = questions[currentId];

  const onSelect = (option: { next: string | null; result?: Diagnosis }) => {
    if (option.result) {
      setResult(option.result);
    } else if (option.next) {
      setHistory([...history, currentId]);
      setCurrentId(option.next);
    }
  };

  const onBack = () => {
    if (history.length === 0) return;
    setResult(null);
    const prev = [...history];
    const last = prev.pop()!;
    setHistory(prev);
    setCurrentId(last);
  };

  const onReset = () => {
    setCurrentId("start");
    setHistory([]);
    setResult(null);
  };

  const sevColor = (sev?: Diagnosis["severity"]) => {
    if (sev === "critical") return "border-error";
    if (sev === "warn") return "border-warn";
    return "border-border";
  };

  const sevLabel = (sev?: Diagnosis["severity"]) => {
    if (sev === "critical") return { emoji: "🚨", text: "CRÍTICO", color: "text-error" };
    if (sev === "warn") return { emoji: "⚠️", text: "Atención", color: "text-warn" };
    return { emoji: "ℹ️", text: "Info", color: "text-text-muted" };
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-text-bright mb-4">🔍 Diagnóstico</h1>
      <p className="text-text-muted text-sm mb-4">
        Responde preguntas guiadas para diagnosticar problemas. ~70 escenarios cubriendo cannabis, setas, cactus, fermentación, amanita, ayahuasca, DMT y plantas suaves.
      </p>

      {result ? (
        <div className="grid gap-3">
          <div className={`p-4 border ${sevColor(result.severity)} rounded`}>
            <div className={`text-xs uppercase tracking-wide mb-1 ${sevLabel(result.severity).color}`}>
              {sevLabel(result.severity).emoji} {sevLabel(result.severity).text} · diagnóstico probable
            </div>
            <h2 className="text-lg font-bold text-text-bright">{result.problem}</h2>
          </div>
          <div className="p-4 border border-border rounded">
            <h3 className="text-sm font-bold text-text-bright mb-2">🔎 Causas probables</h3>
            <ul className="grid gap-1">
              {result.causes.map((c, i) => (
                <li key={i} className="text-sm text-text-muted">• {c}</li>
              ))}
            </ul>
          </div>
          <div className="p-4 border border-success/40 bg-success/5 rounded">
            <h3 className="text-sm font-bold text-success mb-2">✅ Acciones</h3>
            <ul className="grid gap-1">
              {result.fixes.map((f, i) => (
                <li key={i} className="text-sm">→ {f}</li>
              ))}
            </ul>
          </div>
          {result.prevention && result.prevention.length > 0 && (
            <div className="p-4 border border-accent/40 bg-accent/5 rounded">
              <h3 className="text-sm font-bold text-accent mb-2">🛡️ Prevención futura</h3>
              <ul className="grid gap-1">
                {result.prevention.map((p, i) => (
                  <li key={i} className="text-sm">• {p}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="flex gap-2 flex-wrap">
            <button onClick={onReset} className="px-4 py-2 bg-accent text-bg rounded font-bold text-sm">
              🔄 Nuevo diagnóstico
            </button>
            <button onClick={onBack} className="px-4 py-2 border border-border rounded text-sm">
              ← Atrás
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div className="p-4 border border-border rounded mb-3">
            <h2 className="text-base font-bold text-text-bright">{current.text}</h2>
          </div>
          <div className="grid gap-2">
            {current.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => onSelect(opt)}
                className="text-left p-3 border border-border rounded hover:border-accent transition"
              >
                {opt.label}
              </button>
            ))}
          </div>
          {history.length > 0 && (
            <button onClick={onBack} className="mt-4 text-xs text-text-muted hover:text-accent">
              ← Atrás
            </button>
          )}
        </div>
      )}
    </div>
  );
}
