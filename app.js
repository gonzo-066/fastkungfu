/* ═══════════════════════════════════════════════════
   FASTKUNGFU — app.js
   PWA de entrenamiento de boxeo y reacción
═══════════════════════════════════════════════════ */

'use strict';

// ═══════════════════════════════════════════════════
// SERVICE WORKER
// ═══════════════════════════════════════════════════
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}

// ═══════════════════════════════════════════════════
// TRADUCCIONES
// ═══════════════════════════════════════════════════
const TRANSLATIONS = {
  es: {
    // Perfil
    profile_subtitle:     'Configura tu perfil para comenzar',
    name:                 'Nombre',
    weight:               'Peso (kg)',
    age:                  'Edad',
    sex:                  'Sexo',
    male:                 '♂ Hombre',
    female:               '♀ Mujer',
    save_continue:        'GUARDAR Y CONTINUAR',
    name_placeholder:     'Tu nombre',
    weight_placeholder:   '70',
    age_placeholder:      '25',
    // Menú
    striking_mode:        'MODO GOLPEO',
    striking_desc:        'Mide velocidad y potencia',
    reaction_mode:        'MODO REACCIÓN',
    reaction_desc:        'Entrena tu tiempo de reacción',
    // Config
    rounds_label:         'Rounds',
    round_duration_label: 'Duración del round',
    rest_duration_label:  'Descanso entre rounds',
    config_start:         'EMPEZAR SESIÓN',
    config_summary:       '{r} rounds · {rd} min · {rst}s descanso · ~{total} min totales',
    val_rounds:           '{n} rounds',
    val_round_duration:   '{n} min',
    val_rest_duration:    '{n} s',
    ios_permission_text:  'iOS requiere permiso para el acelerómetro',
    ios_permission_btn:   '🎯 Activar sensor de movimiento',
    ios_granted:          '✓ Sensor activado',
    ios_denied:           '✗ Permiso denegado — se usará botón manual',
    // Modo golpeo
    round_indicator:      'Round {n} de {total}',
    fallback_punch:       '👊 GOLPEAR',
    punches:              'Golpes',
    speed_label:          'Velocidad (m/s²)',
    power_label:          'Potencia actual',
    best_punch:           'Mejor golpe',
    chart_last10:         'Últimos 10 golpes (G)',
    // Modo reacción
    fallback_hit:         '👊 ¡GOLPEAR!',
    stimulus_idle:        'PREPARADO',
    stimulus_idle_sub:    'Espera el inicio del round...',
    stimulus_wait:        'LISTO',
    stimulus_wait_sub:    'Espera la señal...',
    stimulus_hit:         '¡GOLPEA!',
    stimulus_miss:        'FALLO',
    stimulus_miss_sub:    'Sin golpe detectado',
    last_reaction:        'Última reacción',
    hits:                 'Aciertos',
    misses:               'Fallos',
    best_reaction:        'Mejor reacción',
    // Descanso
    rest_title:           'DESCANSO',
    next_round:           'Próximo: Round {n}',
    skip_rest:            'SALTAR DESCANSO',
    avg_power_rest:       'Potencia media',
    // Resumen
    session_complete:     'SESIÓN COMPLETADA',
    mode_striking:        '🥊 Modo Golpeo',
    mode_reaction:        '🔴 Modo Reacción',
    rounds_completed:     'Rounds',
    total_punches:        'Golpes totales',
    avg_power_s:          'Potencia media',
    max_power_s:          'Potencia máxima',
    avg_speed_s:          'Velocidad media',
    max_speed_s:          'Velocidad máxima',
    avg_reaction_s:       'Reacción media',
    best_reaction_s:      'Mejor reacción',
    hits_s:               'Aciertos',
    misses_s:             'Fallos',
    duration_s:           'Duración',
    calories_s:           'Calorías estimadas',
    save_session:         'GUARDAR SESIÓN',
    back_menu:            'VOLVER AL MENÚ',
    session_saved_txt:    '✓ GUARDADA',
    cal_warmup:           '¡Buen calentamiento! 💪',
    cal_good:             '¡Buen entrenamiento! 🔥',
    cal_elite:            '¡Sesión de élite! 🏆',
    vs_previous:          'vs sesión anterior: ',
    diff_punches_up:      '↑ +{n} golpes',
    diff_punches_down:    '↓ {n} golpes',
    diff_power_up:        '↑ +{n}G potencia',
    diff_power_down:      '↓ {n}G potencia',
    diff_reaction_faster: '↑ {n}ms más rápido',
    diff_reaction_slower: '↓ {n}ms más lento',
    // Historial
    stats_title:          'ESTADÍSTICAS',
    records_title:        '🏆 Récords Históricos',
    best_reaction_rec:    'Mejor reacción',
    best_power_rec:       'Mayor potencia',
    most_punches_rec:     'Más golpes en sesión',
    totals_title:         'Totales',
    total_sessions:       'Sesiones',
    total_punches_h:      'Golpes históricos',
    total_calories_h:     'Calorías totales',
    power_chart_title:    'Evolución Potencia Media (últimas 10)',
    reaction_chart_title: 'Tiempo de Reacción (últimas 10)',
    calories_chart_title: 'Calorías por sesión (últimas 10)',
    no_sessions:          'Sin sesiones aún 🥊',
    // Ajustes
    settings_title:       'Ajustes',
    language_label:       'Idioma',
    save_settings:        'GUARDAR',
    // Alertas
    alert_enter_name:     'Ingresa tu nombre',
    alert_weight:         'Ingresa un peso válido (30-200 kg)',
    alert_age:            'Ingresa una edad válida (10-100)',
    alert_weight_s:       'Peso inválido',
    alert_age_s:          'Edad inválida',
    confirm_stop:         '¿Abandonar la sesión?',
    // Rankings reacción
    rank_master:          '⚫ Maestro',
    rank_fast:            '🟤 Rápido',
    rank_good:            '🟡 Bueno',
    rank_keep:            '⚪ Sigue practicando',
    // Rankings potencia
    rank_explosive:       '🔴 Explosivo',
    rank_strong:          '🟠 Fuerte',
    rank_moderate:        '🟡 Moderado',
    rank_soft:            '⚪ Suave',
  },

  en: {
    profile_subtitle:     'Set up your profile to start',
    name:                 'Name',
    weight:               'Weight (kg)',
    age:                  'Age',
    sex:                  'Gender',
    male:                 '♂ Male',
    female:               '♀ Female',
    save_continue:        'SAVE & CONTINUE',
    name_placeholder:     'Your name',
    weight_placeholder:   '70',
    age_placeholder:      '25',
    striking_mode:        'STRIKING MODE',
    striking_desc:        'Measure speed and power',
    reaction_mode:        'REACTION MODE',
    reaction_desc:        'Train your reaction time',
    rounds_label:         'Rounds',
    round_duration_label: 'Round duration',
    rest_duration_label:  'Rest between rounds',
    config_start:         'START SESSION',
    config_summary:       '{r} rounds · {rd} min · {rst}s rest · ~{total} min total',
    val_rounds:           '{n} rounds',
    val_round_duration:   '{n} min',
    val_rest_duration:    '{n} s',
    ios_permission_text:  'iOS requires permission for the accelerometer',
    ios_permission_btn:   '🎯 Activate motion sensor',
    ios_granted:          '✓ Sensor activated',
    ios_denied:           '✗ Permission denied — manual button will be used',
    round_indicator:      'Round {n} of {total}',
    fallback_punch:       '👊 PUNCH',
    punches:              'Punches',
    speed_label:          'Speed (m/s²)',
    power_label:          'Current power',
    best_punch:           'Best punch',
    chart_last10:         'Last 10 punches (G)',
    fallback_hit:         '👊 HIT!',
    stimulus_idle:        'STAND BY',
    stimulus_idle_sub:    'Waiting for round to start...',
    stimulus_wait:        'READY',
    stimulus_wait_sub:    'Wait for the signal...',
    stimulus_hit:         'HIT!',
    stimulus_miss:        'MISS',
    stimulus_miss_sub:    'No punch detected',
    last_reaction:        'Last reaction',
    hits:                 'Hits',
    misses:               'Misses',
    best_reaction:        'Best reaction',
    rest_title:           'REST',
    next_round:           'Next: Round {n}',
    skip_rest:            'SKIP REST',
    avg_power_rest:       'Avg. power',
    session_complete:     'SESSION COMPLETE',
    mode_striking:        '🥊 Striking Mode',
    mode_reaction:        '🔴 Reaction Mode',
    rounds_completed:     'Rounds',
    total_punches:        'Total punches',
    avg_power_s:          'Avg. power',
    max_power_s:          'Max. power',
    avg_speed_s:          'Avg. speed',
    max_speed_s:          'Max. speed',
    avg_reaction_s:       'Avg. reaction',
    best_reaction_s:      'Best reaction',
    hits_s:               'Hits',
    misses_s:             'Misses',
    duration_s:           'Duration',
    calories_s:           'Est. calories',
    save_session:         'SAVE SESSION',
    back_menu:            'BACK TO MENU',
    session_saved_txt:    '✓ SAVED',
    cal_warmup:           'Nice warm-up! 💪',
    cal_good:             'Great workout! 🔥',
    cal_elite:            'Elite session! 🏆',
    vs_previous:          'vs last session: ',
    diff_punches_up:      '↑ +{n} punches',
    diff_punches_down:    '↓ {n} punches',
    diff_power_up:        '↑ +{n}G power',
    diff_power_down:      '↓ {n}G power',
    diff_reaction_faster: '↑ {n}ms faster',
    diff_reaction_slower: '↓ {n}ms slower',
    stats_title:          'STATISTICS',
    records_title:        '🏆 All-Time Records',
    best_reaction_rec:    'Best reaction',
    best_power_rec:       'Best power',
    most_punches_rec:     'Most punches',
    totals_title:         'Totals',
    total_sessions:       'Sessions',
    total_punches_h:      'Total punches',
    total_calories_h:     'Total calories',
    power_chart_title:    'Avg. Power (last 10)',
    reaction_chart_title: 'Reaction Time (last 10)',
    calories_chart_title: 'Calories per session (last 10)',
    no_sessions:          'No sessions yet 🥊',
    settings_title:       'Settings',
    language_label:       'Language',
    save_settings:        'SAVE',
    alert_enter_name:     'Enter your name',
    alert_weight:         'Enter a valid weight (30-200 kg)',
    alert_age:            'Enter a valid age (10-100)',
    alert_weight_s:       'Invalid weight',
    alert_age_s:          'Invalid age',
    confirm_stop:         'Abandon the session?',
    rank_master:          '⚫ Master',
    rank_fast:            '🟤 Fast',
    rank_good:            '🟡 Good',
    rank_keep:            '⚪ Keep practicing',
    rank_explosive:       '🔴 Explosive',
    rank_strong:          '🟠 Strong',
    rank_moderate:        '🟡 Moderate',
    rank_soft:            '⚪ Light',
  },

  pt: {
    profile_subtitle:     'Configure seu perfil para começar',
    name:                 'Nome',
    weight:               'Peso (kg)',
    age:                  'Idade',
    sex:                  'Sexo',
    male:                 '♂ Masculino',
    female:               '♀ Feminino',
    save_continue:        'SALVAR E CONTINUAR',
    name_placeholder:     'Seu nome',
    weight_placeholder:   '70',
    age_placeholder:      '25',
    striking_mode:        'MODO GOLPE',
    striking_desc:        'Meça velocidade e potência',
    reaction_mode:        'MODO REAÇÃO',
    reaction_desc:        'Treine seu tempo de reação',
    rounds_label:         'Rounds',
    round_duration_label: 'Duração do round',
    rest_duration_label:  'Descanso entre rounds',
    config_start:         'INICIAR SESSÃO',
    config_summary:       '{r} rounds · {rd} min · {rst}s descanso · ~{total} min total',
    val_rounds:           '{n} rounds',
    val_round_duration:   '{n} min',
    val_rest_duration:    '{n} s',
    ios_permission_text:  'iOS requer permissão para o acelerômetro',
    ios_permission_btn:   '🎯 Ativar sensor de movimento',
    ios_granted:          '✓ Sensor ativado',
    ios_denied:           '✗ Permissão negada — botão manual será usado',
    round_indicator:      'Round {n} de {total}',
    fallback_punch:       '👊 SOCAR',
    punches:              'Golpes',
    speed_label:          'Velocidade (m/s²)',
    power_label:          'Potência atual',
    best_punch:           'Melhor golpe',
    chart_last10:         'Últimos 10 golpes (G)',
    fallback_hit:         '👊 GOLPEAR!',
    stimulus_idle:        'PREPARADO',
    stimulus_idle_sub:    'Aguardando início do round...',
    stimulus_wait:        'PRONTO',
    stimulus_wait_sub:    'Aguarde o sinal...',
    stimulus_hit:         'SOCA!',
    stimulus_miss:        'FALHOU',
    stimulus_miss_sub:    'Nenhum golpe detectado',
    last_reaction:        'Última reação',
    hits:                 'Acertos',
    misses:               'Erros',
    best_reaction:        'Melhor reação',
    rest_title:           'DESCANSO',
    next_round:           'Próximo: Round {n}',
    skip_rest:            'PULAR DESCANSO',
    avg_power_rest:       'Potência média',
    session_complete:     'SESSÃO COMPLETA',
    mode_striking:        '🥊 Modo Golpe',
    mode_reaction:        '🔴 Modo Reação',
    rounds_completed:     'Rounds',
    total_punches:        'Total de golpes',
    avg_power_s:          'Potência média',
    max_power_s:          'Potência máxima',
    avg_speed_s:          'Velocidade média',
    max_speed_s:          'Velocidade máxima',
    avg_reaction_s:       'Reação média',
    best_reaction_s:      'Melhor reação',
    hits_s:               'Acertos',
    misses_s:             'Erros',
    duration_s:           'Duração',
    calories_s:           'Calorias estimadas',
    save_session:         'SALVAR SESSÃO',
    back_menu:            'VOLTAR AO MENU',
    session_saved_txt:    '✓ SALVA',
    cal_warmup:           'Bom aquecimento! 💪',
    cal_good:             'Bom treino! 🔥',
    cal_elite:            'Sessão de elite! 🏆',
    vs_previous:          'vs sessão anterior: ',
    diff_punches_up:      '↑ +{n} golpes',
    diff_punches_down:    '↓ {n} golpes',
    diff_power_up:        '↑ +{n}G potência',
    diff_power_down:      '↓ {n}G potência',
    diff_reaction_faster: '↑ {n}ms mais rápido',
    diff_reaction_slower: '↓ {n}ms mais lento',
    stats_title:          'ESTATÍSTICAS',
    records_title:        '🏆 Recordes Históricos',
    best_reaction_rec:    'Melhor reação',
    best_power_rec:       'Maior potência',
    most_punches_rec:     'Mais golpes',
    totals_title:         'Totais',
    total_sessions:       'Sessões',
    total_punches_h:      'Total de golpes',
    total_calories_h:     'Total de calorias',
    power_chart_title:    'Evolução da Potência Média (últimas 10)',
    reaction_chart_title: 'Tempo de Reação (últimas 10)',
    calories_chart_title: 'Calorias por sessão (últimas 10)',
    no_sessions:          'Sem sessões ainda 🥊',
    settings_title:       'Configurações',
    language_label:       'Idioma',
    save_settings:        'SALVAR',
    alert_enter_name:     'Digite seu nome',
    alert_weight:         'Peso inválido (30-200 kg)',
    alert_age:            'Idade inválida (10-100)',
    alert_weight_s:       'Peso inválido',
    alert_age_s:          'Idade inválida',
    confirm_stop:         'Abandonar a sessão?',
    rank_master:          '⚫ Mestre',
    rank_fast:            '🟤 Rápido',
    rank_good:            '🟡 Bom',
    rank_keep:            '⚪ Continue praticando',
    rank_explosive:       '🔴 Explosivo',
    rank_strong:          '🟠 Forte',
    rank_moderate:        '🟡 Moderado',
    rank_soft:            '⚪ Suave',
  },

  de: {
    profile_subtitle:     'Profil einrichten um zu beginnen',
    name:                 'Name',
    weight:               'Gewicht (kg)',
    age:                  'Alter',
    sex:                  'Geschlecht',
    male:                 '♂ Männlich',
    female:               '♀ Weiblich',
    save_continue:        'SPEICHERN & WEITER',
    name_placeholder:     'Dein Name',
    weight_placeholder:   '70',
    age_placeholder:      '25',
    striking_mode:        'SCHLAGMODUS',
    striking_desc:        'Geschwindigkeit & Kraft messen',
    reaction_mode:        'REAKTIONSMODUS',
    reaction_desc:        'Reaktionszeit trainieren',
    rounds_label:         'Runden',
    round_duration_label: 'Rundendauer',
    rest_duration_label:  'Pause zwischen Runden',
    config_start:         'SESSION STARTEN',
    config_summary:       '{r} Runden · {rd} min · {rst}s Pause · ~{total} min gesamt',
    val_rounds:           '{n} Runden',
    val_round_duration:   '{n} min',
    val_rest_duration:    '{n} s',
    ios_permission_text:  'iOS benötigt Erlaubnis für den Beschleunigungssensor',
    ios_permission_btn:   '🎯 Bewegungssensor aktivieren',
    ios_granted:          '✓ Sensor aktiviert',
    ios_denied:           '✗ Berechtigung verweigert — manueller Button wird verwendet',
    round_indicator:      'Runde {n} von {total}',
    fallback_punch:       '👊 SCHLAGEN',
    punches:              'Schläge',
    speed_label:          'Geschwindigkeit (m/s²)',
    power_label:          'Aktuelle Kraft',
    best_punch:           'Bester Schlag',
    chart_last10:         'Letzte 10 Schläge (G)',
    fallback_hit:         '👊 ZUSCHLAGEN!',
    stimulus_idle:        'BEREITHALTEN',
    stimulus_idle_sub:    'Warte auf Rundenstart...',
    stimulus_wait:        'BEREIT',
    stimulus_wait_sub:    'Warte auf das Signal...',
    stimulus_hit:         'SCHLAG!',
    stimulus_miss:        'VERPASST',
    stimulus_miss_sub:    'Kein Schlag erkannt',
    last_reaction:        'Letzte Reaktion',
    hits:                 'Treffer',
    misses:               'Fehlschläge',
    best_reaction:        'Beste Reaktion',
    rest_title:           'PAUSE',
    next_round:           'Nächste: Runde {n}',
    skip_rest:            'PAUSE ÜBERSPRINGEN',
    avg_power_rest:       'Ø Kraft',
    session_complete:     'SESSION ABGESCHLOSSEN',
    mode_striking:        '🥊 Schlagmodus',
    mode_reaction:        '🔴 Reaktionsmodus',
    rounds_completed:     'Runden',
    total_punches:        'Schläge gesamt',
    avg_power_s:          'Ø Kraft',
    max_power_s:          'Max. Kraft',
    avg_speed_s:          'Ø Geschwindigkeit',
    max_speed_s:          'Max. Geschwindigkeit',
    avg_reaction_s:       'Ø Reaktion',
    best_reaction_s:      'Beste Reaktion',
    hits_s:               'Treffer',
    misses_s:             'Fehlschläge',
    duration_s:           'Dauer',
    calories_s:           'Geschätzte Kalorien',
    save_session:         'SESSION SPEICHERN',
    back_menu:            'ZURÜCK ZUM MENÜ',
    session_saved_txt:    '✓ GESPEICHERT',
    cal_warmup:           'Gutes Aufwärmen! 💪',
    cal_good:             'Gutes Training! 🔥',
    cal_elite:            'Elite-Session! 🏆',
    vs_previous:          'vs. letzte Session: ',
    diff_punches_up:      '↑ +{n} Schläge',
    diff_punches_down:    '↓ {n} Schläge',
    diff_power_up:        '↑ +{n}G Kraft',
    diff_power_down:      '↓ {n}G Kraft',
    diff_reaction_faster: '↑ {n}ms schneller',
    diff_reaction_slower: '↓ {n}ms langsamer',
    stats_title:          'STATISTIKEN',
    records_title:        '🏆 Rekorde',
    best_reaction_rec:    'Beste Reaktion',
    best_power_rec:       'Beste Kraft',
    most_punches_rec:     'Meiste Schläge',
    totals_title:         'Gesamt',
    total_sessions:       'Sessions',
    total_punches_h:      'Schläge gesamt',
    total_calories_h:     'Kalorien gesamt',
    power_chart_title:    'Ø Kraft Verlauf (letzte 10)',
    reaction_chart_title: 'Reaktionszeit (letzte 10)',
    calories_chart_title: 'Kalorien pro Session (letzte 10)',
    no_sessions:          'Noch keine Sessions 🥊',
    settings_title:       'Einstellungen',
    language_label:       'Sprache',
    save_settings:        'SPEICHERN',
    alert_enter_name:     'Gib deinen Namen ein',
    alert_weight:         'Ungültiges Gewicht (30-200 kg)',
    alert_age:            'Ungültiges Alter (10-100)',
    alert_weight_s:       'Ungültiges Gewicht',
    alert_age_s:          'Ungültiges Alter',
    confirm_stop:         'Session abbrechen?',
    rank_master:          '⚫ Meister',
    rank_fast:            '🟤 Schnell',
    rank_good:            '🟡 Gut',
    rank_keep:            '⚪ Weiter üben',
    rank_explosive:       '🔴 Explosiv',
    rank_strong:          '🟠 Stark',
    rank_moderate:        '🟡 Moderat',
    rank_soft:            '⚪ Leicht',
  },
};

// ═══════════════════════════════════════════════════
// ESTADO GLOBAL
// ═══════════════════════════════════════════════════
const APP = {
  lang: 'es',
  profile: null,
  mode: null,           // 'striking' | 'reaction'
  config: {
    rounds: 3,
    roundDuration: 2,
    restDuration: 30,
  },
  session: {
    startTime: null,
    currentRound: 0,
    allPunches: [],
    roundData: [],
    reactionTimes: [],
    hits: 0,
    misses: 0,
  },
  round: {
    punches: [],
    reactionTimes: [],
    hits: 0,
    misses: 0,
    startTime: null,
    timerInterval: null,
    secondsLeft: 0,
  },
  accel: {
    available: false,
    permitted: false,
    lastPunchAt: 0,
    COOLDOWN: 400,
    THRESHOLD: 2.5,
  },
  reaction: {
    state: 'idle',
    stimulusAt: null,
    waitTimeout: null,
    missTimeout: null,
  },
  rest: { interval: null },
  wakeLock: null,
  audioCtx: null,
  fallbackMode: false,
  sessionSaved: false,
};

// ═══════════════════════════════════════════════════
// I18N — TRADUCCIÓN
// ═══════════════════════════════════════════════════

/** Devuelve la traducción de una clave, con interpolación de parámetros */
function t(key, params) {
  const dict = TRANSLATIONS[APP.lang] || TRANSLATIONS['es'];
  let str = dict[key] !== undefined ? dict[key] : (TRANSLATIONS['es'][key] || key);
  if (params) {
    Object.keys(params).forEach(k => {
      str = str.replace(new RegExp('\\{' + k + '\\}', 'g'), params[k]);
    });
  }
  return str;
}

/** Actualiza todos los elementos con data-i18n al idioma activo */
function applyLanguage() {
  document.documentElement.lang = APP.lang;

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    const val = t(key);
    if (val !== key) el.textContent = val;
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.dataset.i18nPlaceholder;
    el.placeholder = t(key);
  });

  // Marcar botón activo en el selector de idioma del modal
  document.querySelectorAll('.btn-lang-sm').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === APP.lang);
  });
}

/** Locale para fechas */
function getLocale() {
  return { es: 'es-ES', en: 'en-GB', pt: 'pt-BR', de: 'de-DE' }[APP.lang] || 'es-ES';
}

// ═══════════════════════════════════════════════════
// NAVEGACIÓN
// ═══════════════════════════════════════════════════
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => {
    s.classList.toggle('hidden', s.id !== id);
  });
}

// ═══════════════════════════════════════════════════
// AUDIO
// ═══════════════════════════════════════════════════
function getAudioCtx() {
  if (!APP.audioCtx) {
    APP.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return APP.audioCtx;
}

function playBell(type = 'round') {
  try {
    const ctx = getAudioCtx();
    if (ctx.state === 'suspended') ctx.resume();
    const freqs    = type === 'round' ? [880, 660, 440] : [440];
    const duration = type === 'round' ? 1.8 : 0.4;
    freqs.forEach((freq, i) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      const t0 = ctx.currentTime + i * 0.08;
      osc.frequency.setValueAtTime(freq, t0);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.5, t0 + duration);
      gain.gain.setValueAtTime(0.4, t0);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
      osc.start(t0);
      osc.stop(t0 + duration + 0.05);
    });
  } catch (e) {}
}

function playBeep(freq = 1200, dur = 0.08) {
  try {
    const ctx  = getAudioCtx();
    if (ctx.state === 'suspended') ctx.resume();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.start();
    osc.stop(ctx.currentTime + dur + 0.01);
  } catch (e) {}
}

// ═══════════════════════════════════════════════════
// VIBRACIÓN / WAKE LOCK
// ═══════════════════════════════════════════════════
function vibrate(pattern) {
  if (navigator.vibrate) navigator.vibrate(pattern);
}

async function acquireWakeLock() {
  if (!('wakeLock' in navigator)) return;
  try { APP.wakeLock = await navigator.wakeLock.request('screen'); } catch (e) {}
}

function releaseWakeLock() {
  if (APP.wakeLock) { APP.wakeLock.release().catch(() => {}); APP.wakeLock = null; }
}

// ═══════════════════════════════════════════════════
// PERFIL
// ═══════════════════════════════════════════════════
function loadProfile() {
  const raw = localStorage.getItem('fkf_profile');
  if (raw) { APP.profile = JSON.parse(raw); return true; }
  return false;
}

function saveProfile(profile) {
  APP.profile = profile;
  localStorage.setItem('fkf_profile', JSON.stringify(profile));
}

function getWeight() {
  return APP.profile ? (APP.profile.weight || 70) : 70;
}

// ═══════════════════════════════════════════════════
// HISTORIAL
// ═══════════════════════════════════════════════════
function getSessions() {
  const raw = localStorage.getItem('fkf_sessions');
  return raw ? JSON.parse(raw) : [];
}

function saveSession(session) {
  const sessions = getSessions();
  sessions.push(session);
  localStorage.setItem('fkf_sessions', JSON.stringify(sessions));
}

// ═══════════════════════════════════════════════════
// ACELERÓMETRO
// ═══════════════════════════════════════════════════
function setupAccelerometer() {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  if (typeof DeviceMotionEvent === 'undefined') { APP.fallbackMode = true; return; }
  if (isIOS && typeof DeviceMotionEvent.requestPermission === 'function') {
    document.getElementById('ios-permission-block').classList.remove('hidden');
    return;
  }
  activateAccelerometer();
}

function activateAccelerometer() {
  window.addEventListener('devicemotion', onDeviceMotion, { passive: true });
  APP.accel.available = true;
  APP.accel.permitted = true;
  document.getElementById('btn-fallback-punch').classList.add('hidden');
  document.getElementById('btn-fallback-hit').classList.add('hidden');
}

function onDeviceMotion(e) {
  const acc = e.accelerationIncludingGravity;
  if (!acc) return;
  const raw    = Math.sqrt(acc.x * acc.x + acc.y * acc.y + acc.z * acc.z);
  const gForce = raw / 9.81;
  const now    = Date.now();
  if (gForce > APP.accel.THRESHOLD && (now - APP.accel.lastPunchAt) > APP.accel.COOLDOWN) {
    APP.accel.lastPunchAt = now;
    registerPunch(gForce, raw);
  }
}

function registerPunch(gForce, speed) {
  const punch = { g: gForce, speed: speed || gForce * 9.81, time: Date.now() };
  vibrate([20]);
  if (APP.mode === 'striking')       handleStrikingPunch(punch);
  else if (APP.mode === 'reaction')  handleReactionPunch(punch);
}

// ═══════════════════════════════════════════════════
// CALORÍAS (MET)
// ═══════════════════════════════════════════════════
function calcCalories(totalPunches, avgPower, durationMin) {
  const weight      = getWeight();
  const punchPerMin = totalPunches / Math.max(durationMin, 1);
  let met = 6.0;
  if (punchPerMin > 30 || avgPower > 5)        met = 9.0;
  else if (punchPerMin > 20 || avgPower > 3.5) met = 7.5;
  return Math.round(met * weight * (durationMin / 60));
}

function getCalorieMessage(kcal) {
  if (kcal < 50)  return t('cal_warmup');
  if (kcal < 100) return t('cal_good');
  return t('cal_elite');
}

// ═══════════════════════════════════════════════════
// RANKINGS
// ═══════════════════════════════════════════════════
function reactionRank(ms) {
  if (ms < 200) return t('rank_master');
  if (ms < 350) return t('rank_fast');
  if (ms < 600) return t('rank_good');
  return t('rank_keep');
}

function getStreakText(n) {
  if (APP.lang === 'de') return `${n} Tag${n !== 1 ? 'e' : ''} am Stück trainiert 🔥`;
  if (APP.lang === 'en') return `${n}-day training streak 🔥`;
  if (APP.lang === 'pt') return `${n} dia${n !== 1 ? 's' : ''} de treino seguidos 🔥`;
  return `Llevas ${n} día${n !== 1 ? 's' : ''} entrenando seguidos 🔥`;
}

// ═══════════════════════════════════════════════════
// UTILIDADES
// ═══════════════════════════════════════════════════
function fmtTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function fmtDate(ts) {
  return new Date(ts).toLocaleDateString(getLocale(), {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ═══════════════════════════════════════════════════
// CANVAS CHARTS
// ═══════════════════════════════════════════════════
function drawBarChart(canvasId, values, maxVal, colorFn) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const dpr  = window.devicePixelRatio || 1;
  const cssW = (canvas.parentElement.clientWidth - 24) || 320;
  const cssH = parseInt(canvas.getAttribute('height')) || 80;
  canvas.width  = cssW * dpr;
  canvas.height = cssH * dpr;
  canvas.style.width  = cssW + 'px';
  canvas.style.height = cssH + 'px';
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, cssW, cssH);
  if (!values.length) return;
  const bw = cssW / values.length;
  values.forEach((v, i) => {
    const norm = Math.min(v / maxVal, 1);
    const bh   = Math.max(norm * (cssH - 4), 2);
    ctx.fillStyle = colorFn ? colorFn(v) : '#00cc44';
    ctx.fillRect(i * bw + 2, cssH - bh, bw - 4, bh);
  });
}

function drawLineChart(canvasId, values, maxVal, color) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const dpr  = window.devicePixelRatio || 1;
  const cssW = (canvas.parentElement.clientWidth - 24) || 320;
  const cssH = parseInt(canvas.getAttribute('height')) || 120;
  canvas.width  = cssW * dpr;
  canvas.height = cssH * dpr;
  canvas.style.width  = cssW + 'px';
  canvas.style.height = cssH + 'px';
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, cssW, cssH);
  if (values.length < 2) return;
  const n     = values.length;
  const padH  = 12;
  const plotH = cssH - padH * 2;
  const pts   = values.map((v, i) => ({
    x: (i / (n - 1)) * cssW,
    y: padH + plotH - (Math.min(v / maxVal, 1) * plotH),
  }));
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  [0.25, 0.5, 0.75].forEach(f => {
    const y = padH + plotH * (1 - f);
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(cssW, y); ctx.stroke();
  });
  ctx.beginPath();
  ctx.moveTo(pts[0].x, cssH);
  pts.forEach(p => ctx.lineTo(p.x, p.y));
  ctx.lineTo(pts[pts.length - 1].x, cssH);
  ctx.closePath();
  ctx.fillStyle = color + '22';
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  pts.forEach(p => ctx.lineTo(p.x, p.y));
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  ctx.stroke();
  pts.forEach(p => {
    ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
    ctx.fillStyle = color; ctx.fill();
  });
}

function punchColor(g) {
  if (g > 8) return '#ff2222';
  if (g > 5) return '#ff8800';
  if (g > 3) return '#ffcc00';
  return '#888888';
}

function flashEl(el) {
  el.classList.remove('flash');
  void el.offsetWidth;
  el.classList.add('flash');
  setTimeout(() => el.classList.remove('flash'), 300);
}

// ═══════════════════════════════════════════════════
// PANTALLA: SELECCIÓN DE IDIOMA
// ═══════════════════════════════════════════════════
function initLangScreen() {
  document.querySelectorAll('#screen-lang .btn-lang').forEach(btn => {
    btn.addEventListener('click', () => {
      APP.lang = btn.dataset.lang;
      localStorage.setItem('fkf_lang', APP.lang);
      applyLanguage();
      afterLangSelected();
    });
  });
}

function afterLangSelected() {
  if (loadProfile()) {
    showScreen('screen-menu');
    initMenuScreen();
  } else {
    showScreen('screen-profile');
    initProfileScreen();
  }
}

// ═══════════════════════════════════════════════════
// PANTALLA: PERFIL
// ═══════════════════════════════════════════════════
function initProfileScreen() {
  const sexBtns = document.querySelectorAll('#screen-profile .sex-btn');
  let selectedSex = 'hombre';

  sexBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      sexBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedSex = btn.dataset.sex;
    });
  });

  document.getElementById('btn-save-profile').addEventListener('click', () => {
    const name   = document.getElementById('input-name').value.trim();
    const weight = parseFloat(document.getElementById('input-weight').value);
    const age    = parseInt(document.getElementById('input-age').value);

    if (!name)                           { alert(t('alert_enter_name')); return; }
    if (!weight || weight < 30 || weight > 200) { alert(t('alert_weight'));       return; }
    if (!age || age < 10 || age > 100)   { alert(t('alert_age'));           return; }

    saveProfile({ name, weight, age, sex: selectedSex });
    showScreen('screen-menu');
    initMenuScreen();
  });
}

// ═══════════════════════════════════════════════════
// PANTALLA: MENÚ
// ═══════════════════════════════════════════════════
function initMenuScreen() {
  document.getElementById('btn-striking-mode').onclick = () => {
    APP.mode = 'striking';
    showScreen('screen-config');
    initConfigScreen();
  };
  document.getElementById('btn-reaction-mode').onclick = () => {
    APP.mode = 'reaction';
    showScreen('screen-config');
    initConfigScreen();
  };
  document.getElementById('btn-history').onclick = () => {
    showScreen('screen-history');
    initHistoryScreen();
  };
  document.getElementById('btn-settings').onclick = openSettingsModal;
}

// ═══════════════════════════════════════════════════
// PANTALLA: CONFIGURACIÓN
// ═══════════════════════════════════════════════════
function initConfigScreen() {
  document.getElementById('config-mode-title').textContent =
    APP.mode === 'striking'
      ? '🥊 ' + t('striking_mode')
      : '🔴 ' + t('reaction_mode');

  const rInput    = document.getElementById('input-rounds');
  const rdInput   = document.getElementById('input-round-duration');
  const restInput = document.getElementById('input-rest-duration');

  rInput.value    = APP.config.rounds;
  rdInput.value   = APP.config.roundDuration;
  restInput.value = APP.config.restDuration;

  updateConfigSummary();

  rInput.addEventListener('input',    () => { APP.config.rounds        = parseInt(rInput.value);    updateConfigSummary(); });
  rdInput.addEventListener('input',   () => { APP.config.roundDuration = parseInt(rdInput.value);   updateConfigSummary(); });
  restInput.addEventListener('input', () => { APP.config.restDuration  = parseInt(restInput.value); updateConfigSummary(); });

  document.getElementById('btn-config-back').onclick = () => showScreen('screen-menu');

  // iOS
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  if (isIOS && typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
    document.getElementById('ios-permission-block').classList.remove('hidden');
    document.getElementById('btn-ios-permission').onclick = async () => {
      try {
        const perm = await DeviceMotionEvent.requestPermission();
        if (perm === 'granted') {
          activateAccelerometer();
          document.getElementById('permission-status').textContent = t('ios_granted');
          document.getElementById('btn-ios-permission').disabled = true;
        } else {
          document.getElementById('permission-status').textContent = t('ios_denied');
          APP.fallbackMode = true;
        }
      } catch (e) { APP.fallbackMode = true; }
    };
  }

  document.getElementById('btn-start-session').onclick = startSession;
}

function updateConfigSummary() {
  const r   = APP.config.rounds;
  const rd  = APP.config.roundDuration;
  const rst = APP.config.restDuration;
  const total = Math.round(r * rd + ((r - 1) * rst / 60));

  document.getElementById('val-rounds').textContent        = t('val_rounds',        { n: r });
  document.getElementById('val-round-duration').textContent = t('val_round_duration', { n: rd });
  document.getElementById('val-rest-duration').textContent  = t('val_rest_duration',  { n: rst });
  document.getElementById('config-summary').textContent     = t('config_summary', { r, rd, rst, total });
}

// ═══════════════════════════════════════════════════
// SESIÓN
// ═══════════════════════════════════════════════════
function startSession() {
  APP.session = {
    startTime: Date.now(),
    currentRound: 0,
    allPunches: [],
    roundData: [],
    reactionTimes: [],
    hits: 0,
    misses: 0,
  };
  APP.sessionSaved = false;
  acquireWakeLock();
  if (!APP.accel.available && !APP.fallbackMode) setupAccelerometer();
  startRound(1);
}

// ═══════════════════════════════════════════════════
// ROUNDS
// ═══════════════════════════════════════════════════
function startRound(roundNum) {
  APP.session.currentRound = roundNum;
  APP.round = {
    punches: [], reactionTimes: [],
    hits: 0, misses: 0,
    startTime: Date.now(),
    timerInterval: null,
    secondsLeft: APP.config.roundDuration * 60,
  };
  vibrate([100, 50, 100]);
  playBell('round');
  if (APP.mode === 'striking') {
    showStrikingScreen(roundNum);
    startRoundTimer(() => endRound());
  } else {
    showReactionScreen(roundNum);
    startRoundTimer(() => endRound());
    startReactionCycle();
  }
}

function startRoundTimer(onEnd) {
  APP.round.timerInterval = setInterval(() => {
    APP.round.secondsLeft--;
    if (APP.mode === 'striking') updateStrikingTimer();
    else                         updateReactionTimer();
    if (APP.round.secondsLeft <= 0) {
      clearInterval(APP.round.timerInterval);
      onEnd();
    }
  }, 1000);
}

function endRound() {
  clearInterval(APP.round.timerInterval);
  if (APP.mode === 'reaction') stopReactionCycle();

  APP.session.roundData.push({ ...APP.round });
  APP.session.allPunches.push(...APP.round.punches);
  APP.session.reactionTimes.push(...APP.round.reactionTimes);
  APP.session.hits   += APP.round.hits;
  APP.session.misses += APP.round.misses;

  vibrate([200, 100, 200]);
  playBell('end');

  if (APP.session.currentRound >= APP.config.rounds) {
    showSummaryScreen();
  } else {
    showRestScreen(APP.session.currentRound, APP.session.currentRound + 1);
  }
}

// ═══════════════════════════════════════════════════
// MODO GOLPEO
// ═══════════════════════════════════════════════════
function showStrikingScreen(roundNum) {
  showScreen('screen-striking');
  document.getElementById('strike-round-indicator').textContent =
    t('round_indicator', { n: roundNum, total: APP.config.rounds });
  updateStrikingTimer();
  resetStrikingMetrics();
  drawStrikingChart();

  if (APP.fallbackMode || !APP.accel.available) {
    document.getElementById('btn-fallback-punch').classList.remove('hidden');
  }
  document.getElementById('btn-fallback-punch').onclick = () => {
    const g = 2.5 + Math.random() * 3;
    registerPunch(g, g * 9.81);
  };
  document.getElementById('btn-strike-stop').onclick = () => {
    if (confirm(t('confirm_stop'))) {
      clearInterval(APP.round.timerInterval);
      releaseWakeLock();
      showScreen('screen-menu');
    }
  };
}

function updateStrikingTimer() {
  const el = document.getElementById('strike-timer');
  const s  = APP.round.secondsLeft;
  el.textContent = fmtTime(s);
  el.classList.remove('warning', 'danger');
  if (s <= 10)      el.classList.add('danger');
  else if (s <= 30) el.classList.add('warning');
}

function resetStrikingMetrics() {
  document.getElementById('strike-punch-count').textContent = '0';
  document.getElementById('strike-speed').textContent       = '0.0';
  document.getElementById('strike-power').textContent       = '0.0G';
  document.getElementById('strike-best').textContent        = '0.0G';
}

function handleStrikingPunch(punch) {
  APP.round.punches.push(punch);
  const countEl = document.getElementById('strike-punch-count');
  countEl.textContent = APP.round.punches.length;
  flashEl(countEl);
  document.getElementById('strike-speed').textContent = punch.speed.toFixed(1);
  document.getElementById('strike-power').textContent = punch.g.toFixed(1) + 'G';
  const bestG = Math.max(...APP.round.punches.map(p => p.g));
  document.getElementById('strike-best').textContent = bestG.toFixed(1) + 'G';
  drawStrikingChart();
}

function drawStrikingChart() {
  const last10 = APP.round.punches.slice(-10).map(p => p.g);
  while (last10.length < 10) last10.unshift(0);
  drawBarChart('strike-chart', last10, 12, punchColor);
}

// ═══════════════════════════════════════════════════
// MODO REACCIÓN
// ═══════════════════════════════════════════════════
function showReactionScreen(roundNum) {
  showScreen('screen-reaction');
  document.getElementById('reaction-round-indicator').textContent =
    t('round_indicator', { n: roundNum, total: APP.config.rounds });
  updateReactionTimer();
  setReactionState('idle');
  document.getElementById('reaction-last-time').textContent = '—';
  document.getElementById('reaction-hits').textContent      = '0';
  document.getElementById('reaction-misses').textContent    = '0';
  document.getElementById('reaction-best').textContent      = '—';

  if (APP.fallbackMode || !APP.accel.available) {
    document.getElementById('btn-fallback-hit').classList.remove('hidden');
  }
  document.getElementById('btn-fallback-hit').onclick = () => {
    if (APP.reaction.state === 'stimulus') {
      const g = 2.5 + Math.random() * 3;
      registerPunch(g, g * 9.81);
    }
  };
  document.getElementById('btn-reaction-stop').onclick = () => {
    if (confirm(t('confirm_stop'))) {
      stopReactionCycle();
      clearInterval(APP.round.timerInterval);
      releaseWakeLock();
      showScreen('screen-menu');
    }
  };
}

function updateReactionTimer() {
  const el = document.getElementById('reaction-timer');
  const s  = APP.round.secondsLeft;
  el.textContent = fmtTime(s);
  el.classList.remove('warning', 'danger');
  if (s <= 10)      el.classList.add('danger');
  else if (s <= 30) el.classList.add('warning');
}

function setReactionState(state, subtext) {
  const stim = document.getElementById('reaction-stimulus');
  const text = document.getElementById('stimulus-text');
  const sub  = document.getElementById('stimulus-sub');
  APP.reaction.state = state;
  stim.className = 'reaction-stimulus';
  switch (state) {
    case 'idle':
      stim.classList.add('state-wait');
      text.textContent = t('stimulus_idle');
      sub.textContent  = t('stimulus_idle_sub');
      break;
    case 'waiting':
      stim.classList.add('state-wait');
      text.textContent = t('stimulus_wait');
      sub.textContent  = t('stimulus_wait_sub');
      break;
    case 'stimulus':
      stim.classList.add('state-hit');
      text.textContent = t('stimulus_hit');
      sub.textContent  = '';
      vibrate([30]);
      break;
    case 'result':
      stim.classList.add('state-result');
      text.textContent = subtext || '—';
      sub.textContent  = '';
      break;
    case 'miss':
      stim.classList.add('state-miss');
      text.textContent = t('stimulus_miss');
      sub.textContent  = t('stimulus_miss_sub');
      vibrate([50, 30, 50]);
      break;
  }
}

function startReactionCycle() {
  if (APP.round.secondsLeft <= 0) return;
  scheduleNextStimulus();
}

function stopReactionCycle() {
  clearTimeout(APP.reaction.waitTimeout);
  clearTimeout(APP.reaction.missTimeout);
  APP.reaction.state = 'idle';
}

function scheduleNextStimulus() {
  if (APP.round.secondsLeft <= 0) return;
  const delay = 1500 + Math.random() * 3500;
  APP.reaction.waitTimeout = setTimeout(() => {
    if (APP.round.secondsLeft <= 0) return;
    showStimulus();
  }, delay);
  setReactionState('waiting');
}

function showStimulus() {
  APP.reaction.stimulusAt = Date.now();
  setReactionState('stimulus');
  APP.reaction.missTimeout = setTimeout(() => {
    if (APP.reaction.state === 'stimulus') {
      APP.round.misses++;
      document.getElementById('reaction-misses').textContent = APP.round.misses;
      setReactionState('miss');
      setTimeout(() => {
        if (APP.round.secondsLeft > 0) scheduleNextStimulus();
      }, 800);
    }
  }, 3000);
}

function handleReactionPunch(punch) {
  if (APP.reaction.state !== 'stimulus') return;
  clearTimeout(APP.reaction.missTimeout);
  const reactionMs = Date.now() - APP.reaction.stimulusAt;
  APP.round.hits++;
  APP.round.reactionTimes.push(reactionMs);
  APP.round.punches.push(punch);
  document.getElementById('reaction-hits').textContent      = APP.round.hits;
  document.getElementById('reaction-last-time').textContent = reactionMs + ' ms';
  const best = Math.min(...APP.round.reactionTimes);
  document.getElementById('reaction-best').textContent = best + ' ms';
  setReactionState('result', reactionMs + ' ms · ' + reactionRank(reactionMs));
  setTimeout(() => {
    if (APP.round.secondsLeft > 0) scheduleNextStimulus();
  }, 1000);
}

// ═══════════════════════════════════════════════════
// DESCANSO
// ═══════════════════════════════════════════════════
function showRestScreen(doneRound, nextRound) {
  showScreen('screen-rest');
  document.getElementById('rest-next').textContent = t('next_round', { n: nextRound });

  let seconds = APP.config.restDuration;
  document.getElementById('rest-countdown').textContent = seconds;
  renderRestStats();

  const startNext = () => {
    clearInterval(APP.rest.interval);
    startRound(nextRound);
  };

  document.getElementById('btn-skip-rest').onclick = startNext;
  APP.rest.interval = setInterval(() => {
    seconds--;
    const el = document.getElementById('rest-countdown');
    el.textContent = seconds;
    el.classList.toggle('ending', seconds <= 5);
    if (seconds <= 3) { vibrate([50]); playBeep(600, 0.05); }
    if (seconds <= 0) startNext();
  }, 1000);
}

function renderRestStats() {
  const { punches, reactionTimes, hits, misses } = APP.round;
  const avgG = punches.length ? punches.reduce((a, p) => a + p.g, 0) / punches.length : 0;
  const maxG = punches.length ? Math.max(...punches.map(p => p.g)) : 0;
  const best = reactionTimes.length ? Math.min(...reactionTimes) : null;

  let html = `
    <div class="rest-stat-item">
      <div class="rest-stat-value">${punches.length}</div>
      <div class="rest-stat-label">${t('punches')}</div>
    </div>
    <div class="rest-stat-item">
      <div class="rest-stat-value">${maxG.toFixed(1)}G</div>
      <div class="rest-stat-label">${t('best_punch')}</div>
    </div>
    <div class="rest-stat-item">
      <div class="rest-stat-value">${avgG.toFixed(1)}G</div>
      <div class="rest-stat-label">${t('avg_power_rest')}</div>
    </div>`;

  if (APP.mode === 'reaction') {
    html += `
      <div class="rest-stat-item">
        <div class="rest-stat-value">${hits}</div>
        <div class="rest-stat-label">${t('hits')}</div>
      </div>
      <div class="rest-stat-item">
        <div class="rest-stat-value">${misses}</div>
        <div class="rest-stat-label">${t('misses')}</div>
      </div>`;
    if (best !== null) {
      html += `
      <div class="rest-stat-item">
        <div class="rest-stat-value">${best}ms</div>
        <div class="rest-stat-label">${t('best_reaction')}</div>
      </div>`;
    }
  }

  document.getElementById('rest-stats').innerHTML = html;
}

// ═══════════════════════════════════════════════════
// RESUMEN DE SESIÓN
// ═══════════════════════════════════════════════════
function showSummaryScreen() {
  releaseWakeLock();
  showScreen('screen-summary');

  const sess       = APP.session;
  const punches    = sess.allPunches;
  const endTime    = Date.now();
  const durMs      = endTime - sess.startTime;
  const durMin     = durMs / 60000;
  const durSec     = Math.floor(durMs / 1000);
  const total      = punches.length;
  const avgPower   = total ? punches.reduce((a, p) => a + p.g, 0) / total : 0;
  const maxPower   = total ? Math.max(...punches.map(p => p.g)) : 0;
  const avgSpeed   = total ? punches.reduce((a, p) => a + p.speed, 0) / total : 0;
  const maxSpeed   = total ? Math.max(...punches.map(p => p.speed)) : 0;
  const rTimes     = sess.reactionTimes;
  const avgReact   = rTimes.length ? Math.round(rTimes.reduce((a, v) => a + v, 0) / rTimes.length) : null;
  const bestReact  = rTimes.length ? Math.min(...rTimes) : null;
  const calories   = calcCalories(total, avgPower, durMin);

  document.getElementById('summary-date').textContent  = fmtDate(endTime);
  document.getElementById('summary-mode').textContent  = APP.mode === 'striking' ? t('mode_striking') : t('mode_reaction');
  document.getElementById('sum-rounds').textContent    = APP.config.rounds;
  document.getElementById('sum-punches').textContent   = total;
  document.getElementById('sum-avg-power').textContent = avgPower.toFixed(1) + 'G';
  document.getElementById('sum-max-power').textContent = maxPower.toFixed(1) + 'G';
  document.getElementById('sum-avg-speed').textContent = avgSpeed.toFixed(1);
  document.getElementById('sum-max-speed').textContent = maxSpeed.toFixed(1);
  document.getElementById('sum-duration').textContent  = fmtTime(durSec);
  document.getElementById('sum-calories').textContent  = calories + ' kcal';
  document.getElementById('summary-message').textContent = getCalorieMessage(calories);

  ['sum-reaction-row', 'sum-best-reaction-row', 'sum-hits-row', 'sum-misses-row'].forEach(id => {
    document.getElementById(id).classList.toggle('hidden', APP.mode !== 'reaction');
  });

  if (APP.mode === 'reaction') {
    document.getElementById('sum-avg-reaction').textContent  = avgReact  !== null ? avgReact + ' ms'  : '—';
    document.getElementById('sum-best-reaction').textContent = bestReact !== null ? bestReact + ' ms' : '—';
    document.getElementById('sum-hits').textContent   = sess.hits;
    document.getElementById('sum-misses').textContent = sess.misses;
  }

  document.getElementById('summary-comparison').textContent =
    buildComparison(total, avgPower, bestReact);

  const sessionData = {
    ts: endTime, mode: APP.mode, rounds: APP.config.rounds,
    totalPunches: total, avgPower, maxPower, avgSpeed, maxSpeed,
    avgReaction: avgReact, bestReaction: bestReact,
    hits: sess.hits, misses: sess.misses,
    calories, durationSec: durSec,
  };

  const saveBtn = document.getElementById('btn-save-session');
  saveBtn.textContent = t('save_session');
  saveBtn.disabled = false;

  saveBtn.onclick = () => {
    if (!APP.sessionSaved) {
      saveSession(sessionData);
      APP.sessionSaved = true;
      saveBtn.textContent = t('session_saved_txt');
      saveBtn.disabled = true;
    }
  };

  document.getElementById('btn-summary-menu').onclick = () => {
    if (!APP.sessionSaved) { saveSession(sessionData); APP.sessionSaved = true; }
    showScreen('screen-menu');
  };
}

function buildComparison(totalPunches, avgPower, bestReaction) {
  const sessions = getSessions();
  if (!sessions.length) return '';
  const prev  = sessions[sessions.length - 1];
  const parts = [];

  const pd = totalPunches - (prev.totalPunches || 0);
  if (pd > 0)        parts.push(t('diff_punches_up',   { n: pd }));
  else if (pd < 0)   parts.push(t('diff_punches_down', { n: Math.abs(pd) }));

  const wd = avgPower - (prev.avgPower || 0);
  if (Math.abs(wd) > 0.1) {
    parts.push(wd > 0
      ? t('diff_power_up',   { n: wd.toFixed(1) })
      : t('diff_power_down', { n: Math.abs(wd).toFixed(1) }));
  }

  if (APP.mode === 'reaction' && bestReaction !== null && prev.bestReaction) {
    const rd = bestReaction - prev.bestReaction;
    if (Math.abs(rd) > 5) {
      parts.push(rd < 0
        ? t('diff_reaction_faster', { n: Math.abs(rd) })
        : t('diff_reaction_slower', { n: rd }));
    }
  }

  return parts.length ? t('vs_previous') + parts.join(' · ') : '';
}

// ═══════════════════════════════════════════════════
// HISTORIAL
// ═══════════════════════════════════════════════════
function initHistoryScreen() {
  document.getElementById('btn-history-back').onclick = () => showScreen('screen-menu');
  const sessions = getSessions();

  if (!sessions.length) {
    document.getElementById('hist-best-reaction').textContent  = '—';
    document.getElementById('hist-best-power').textContent     = '—';
    document.getElementById('hist-most-punches').textContent   = '—';
    document.getElementById('hist-total-sessions').textContent = '0';
    document.getElementById('hist-total-punches').textContent  = '0';
    document.getElementById('hist-total-calories').textContent = '0';
    document.getElementById('hist-streak').textContent = t('no_sessions');
    return;
  }

  const reactions  = sessions.filter(s => s.bestReaction).map(s => s.bestReaction);
  const bestReact  = reactions.length ? Math.min(...reactions) : null;
  const bestPower  = Math.max(...sessions.map(s => s.maxPower || 0));
  const mostPunch  = Math.max(...sessions.map(s => s.totalPunches || 0));

  document.getElementById('hist-best-reaction').textContent  = bestReact !== null ? bestReact + ' ms' : '—';
  document.getElementById('hist-best-power').textContent     = bestPower.toFixed(1) + 'G';
  document.getElementById('hist-most-punches').textContent   = mostPunch;
  document.getElementById('hist-total-sessions').textContent = sessions.length;
  document.getElementById('hist-total-punches').textContent  = sessions.reduce((a, s) => a + (s.totalPunches || 0), 0);
  document.getElementById('hist-total-calories').textContent = sessions.reduce((a, s) => a + (s.calories || 0), 0) + ' kcal';

  document.getElementById('hist-streak').textContent = getStreakText(calcStreak(sessions));

  const last10 = sessions.slice(-10);
  drawLineChart('hist-power-chart',
    last10.map(s => s.avgPower || 0),
    Math.max(...last10.map(s => s.avgPower || 0), 5),
    '#ff8800');

  const rSessions = last10.filter(s => s.avgReaction);
  if (rSessions.length > 1) {
    const rVals = rSessions.map(s => s.avgReaction);
    drawLineChart('hist-reaction-chart', rVals, Math.max(...rVals, 600), '#00cc44');
  }

  const calVals = last10.map(s => s.calories || 0);
  drawBarChart('hist-calories-chart', calVals, Math.max(...calVals, 50), () => '#ff8800');
}

function calcStreak(sessions) {
  if (!sessions.length) return 0;
  const unique = [...new Set(sessions.map(s => {
    const d = new Date(s.ts);
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  }))].sort().reverse();

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
  const yest = new Date(today); yest.setDate(yest.getDate() - 1);
  const yestStr = `${yest.getFullYear()}-${yest.getMonth()}-${yest.getDate()}`;

  if (unique[0] !== todayStr && unique[0] !== yestStr) return 0;

  let streak = 1;
  for (let i = 1; i < unique.length; i++) {
    const a = new Date(unique[i - 1].replace(/-/g, '/'));
    const b = new Date(unique[i].replace(/-/g, '/'));
    if (Math.round((a - b) / 86400000) === 1) streak++;
    else break;
  }
  return streak;
}

// ═══════════════════════════════════════════════════
// MODAL: AJUSTES
// ═══════════════════════════════════════════════════
function openSettingsModal() {
  if (!APP.profile) return;
  document.getElementById('settings-name').value   = APP.profile.name;
  document.getElementById('settings-weight').value = APP.profile.weight;
  document.getElementById('settings-age').value    = APP.profile.age;

  document.getElementById('settings-sex-hombre').classList.toggle('active', APP.profile.sex === 'hombre');
  document.getElementById('settings-sex-mujer').classList.toggle('active',  APP.profile.sex !== 'hombre');

  // Marcar idioma activo
  document.querySelectorAll('.btn-lang-sm').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === APP.lang);
  });

  document.getElementById('modal-settings').classList.remove('hidden');
}

function closeSettingsModal() {
  document.getElementById('modal-settings').classList.add('hidden');
}

function initSettingsModal() {
  // Sex toggle
  const btnH = document.getElementById('settings-sex-hombre');
  const btnM = document.getElementById('settings-sex-mujer');
  btnH.addEventListener('click', () => { btnH.classList.add('active');    btnM.classList.remove('active'); });
  btnM.addEventListener('click', () => { btnM.classList.add('active');    btnH.classList.remove('active'); });

  // Cambio de idioma instantáneo
  document.querySelectorAll('.btn-lang-sm').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.dataset.lang === APP.lang) return;
      APP.lang = btn.dataset.lang;
      localStorage.setItem('fkf_lang', APP.lang);
      applyLanguage();
      // Actualizar valores de config si están visibles
      updateConfigSummaryIfVisible();
    });
  });

  document.getElementById('btn-close-settings').onclick = closeSettingsModal;
  document.getElementById('modal-overlay').onclick      = closeSettingsModal;

  document.getElementById('btn-save-settings').onclick = () => {
    const name   = document.getElementById('settings-name').value.trim();
    const weight = parseFloat(document.getElementById('settings-weight').value);
    const age    = parseInt(document.getElementById('settings-age').value);
    const sex    = btnH.classList.contains('active') ? 'hombre' : 'mujer';

    if (!name)                           { alert(t('alert_enter_name')); return; }
    if (!weight || weight < 30 || weight > 200) { alert(t('alert_weight_s'));   return; }
    if (!age || age < 10 || age > 100)   { alert(t('alert_age_s'));       return; }

    saveProfile({ name, weight, age, sex });
    closeSettingsModal();
  };
}

function updateConfigSummaryIfVisible() {
  if (!document.getElementById('screen-config').classList.contains('hidden')) {
    updateConfigSummary();
    document.getElementById('config-mode-title').textContent =
      APP.mode === 'striking'
        ? '🥊 ' + t('striking_mode')
        : '🔴 ' + t('reaction_mode');
  }
}

// ═══════════════════════════════════════════════════
// INICIALIZACIÓN
// ═══════════════════════════════════════════════════
function init() {
  initSettingsModal();

  const savedLang = localStorage.getItem('fkf_lang');

  if (savedLang) {
    // Idioma ya elegido: saltar pantalla de idioma
    APP.lang = savedLang;
    applyLanguage();
    afterLangSelected();
  } else {
    // Primera vez: mostrar selector de idioma
    showScreen('screen-lang');
    initLangScreen();
  }

  // Detectar disponibilidad del acelerómetro (no-iOS)
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  if (!isIOS && typeof DeviceMotionEvent === 'undefined') {
    APP.fallbackMode = true;
  }
}

document.addEventListener('DOMContentLoaded', init);
