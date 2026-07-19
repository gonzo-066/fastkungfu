'use strict';

// ═══════════════════════════════════════════════════
// GATE GLOBAL DEL ACELERÓMETRO — solo true mientras
// un round está en curso (false en descanso/home/config)
// ═══════════════════════════════════════════════════
window.IMPACT_SESSION_ACTIVE = false;

// ID único de la "sesión de sonido/timers" en curso. Se regenera en cada
// stopEverything(), así cualquier setTimeout/setInterval/RAF creado por un
// modo anterior se auto-cancela al ejecutarse aunque no haya sido barrido
// del array de tracking (defensa extra, no sustituye la limpieza normal).
window.IMPACT_SESSION_ID = Date.now();

// ═══════════════════════════════════════════════════
// TRACKING GLOBAL DE TIMERS Y ANIMACIONES
// Todo setTimeout/setInterval/requestAnimationFrame propio
// de la app pasa por aquí para poder cancelarlo en bloque
// desde stopEverything() (abandonar sesión / volver al home).
// No se toca window.setTimeout/setInterval directamente para
// no interferir con temporizadores internos de librerías de
// terceros (p.ej. el auto-refresh de sesión de Supabase).
// ═══════════════════════════════════════════════════
window.IMPACT_TIMERS = [];
window.IMPACT_RAFS   = [];

function trackedTimeout(fn, delay, ...args) {
  const mySessionId = window.IMPACT_SESSION_ID;
  const id = window.setTimeout((...cbArgs) => {
    if (window.IMPACT_SESSION_ID !== mySessionId) return;
    fn(...cbArgs);
  }, delay, ...args);
  window.IMPACT_TIMERS.push(id);
  return id;
}

function trackedInterval(fn, delay, ...args) {
  const mySessionId = window.IMPACT_SESSION_ID;
  const id = window.setInterval((...cbArgs) => {
    if (window.IMPACT_SESSION_ID !== mySessionId) return;
    fn(...cbArgs);
  }, delay, ...args);
  window.IMPACT_TIMERS.push(id);
  return id;
}

function trackedRAF(callback) {
  const mySessionId = window.IMPACT_SESSION_ID;
  const id = window.requestAnimationFrame((ts) => {
    if (window.IMPACT_SESSION_ID !== mySessionId) return;
    callback(ts);
  });
  window.IMPACT_RAFS.push(id);
  return id;
}

// ═══════════════════════════════════════════════════
// LIMPIEZA TOTAL — abandonar sesión / STOP / volver al home
// ═══════════════════════════════════════════════════
function stopEverything() {
  // 0. Invalida cualquier timer/sonido/RAF de la sesión anterior que
  //    estuviera "en vuelo" en el instante exacto de la limpieza
  window.IMPACT_SESSION_ID = Date.now();

  // 1. Sonidos: suspender el AudioContext compartido
  if (APP.audioCtx && APP.audioCtx.state === 'running') {
    try { APP.audioCtx.suspend(); } catch (e) {}
  }

  // 2. Timers: cancelar todo lo pendiente (sonidos, cuentas atrás, mensajes...)
  window.IMPACT_TIMERS.forEach(id => { clearTimeout(id); clearInterval(id); });
  window.IMPACT_TIMERS = [];

  // 3. Acelerómetro
  window.IMPACT_SESSION_ACTIVE = false;
  window.removeEventListener('devicemotion', onDeviceMotion);
  deactivateAccelerometer();

  // 4. Partículas y animaciones — cancelar RAFs trackeados y resetear
  //    los flags internos de cada sistema para que puedan reiniciarse después
  window.IMPACT_RAFS.forEach(id => cancelAnimationFrame(id));
  window.IMPACT_RAFS = [];
  stopBgParticles();
  stopReactionBgParticles();
}

// ═══════════════════════════════════════════════════
// SERVICE WORKER
// ═══════════════════════════════════════════════════
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}

// ═══════════════════════════════════════════════════
// SUPABASE
// ═══════════════════════════════════════════════════
const SUPABASE_URL = 'https://yxhjblluztaiswfuwmbo.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4aGpibGx1enRhaXN3ZnV3bWJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwOTA1MDksImV4cCI6MjA3NzY2NjUwOX0.13gTk3fNYu3quihMe4kNAUPxIDUDKKwLy54IOYWHxP0';
let supabaseClient = null;

function initSupabase() {
  try {
    if (window.supabase && window.supabase.createClient) {
      supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    }
  } catch (e) {}
}

// ═══════════════════════════════════════════════════
// TRADUCCIONES
// ═══════════════════════════════════════════════════
const TRANSLATIONS = {
  es: {
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
    training_mode:        'ENTRENAMIENTO',
    training_desc:        'Mide velocidad y potencia por rounds',
    combo_mode:           'MODO REACCIÓN',
    combo_desc:           'Combos con tiempo de reacción',
    rounds_label:         'Rounds',
    round_duration_label: 'Duración del round',
    rest_duration_label:  'Descanso entre rounds',
    config_start:         'INICIAR ENTRENAMIENTO',
    config_summary:       '{r} rounds · {rd} min · {rst}s descanso · ~{total} min totales',
    val_rounds:           '{n} rounds',
    val_round_duration:   '{n} min',
    val_rest_duration:    '{n} s',
    combo_hits_label:     'GOLPES POR COMBO',
    combo_duration_label: 'DURACIÓN MÁXIMA DEL COMBO',
    combo_pause_label:    'PAUSA ENTRE SEÑALES',
    combo_mode_label:     'MODO',
    mode_fixed:           'FIJO',
    mode_random:          'ALEATORIO',
    nav_profile:          'Perfil',
    nav_train:            'Entrenar',
    nav_history:          'Historial',
    ios_permission_text:  'iOS requiere permiso para el acelerómetro',
    ios_permission_btn:   '🎯 Activar sensor de movimiento',
    ios_granted:          '✓ Sensor activado',
    ios_denied:           '✗ Permiso denegado — no se podrán detectar golpes',
    round_indicator:      'ROUND {n}/{total}',
    punches:              'Golpes',
    speed_label:          'Velocidad m/s',
    power_label:          'Potencia',
    best_punch:           'Mejor golpe',
    chart_last10:         'Últimos 10 golpes (G)',
    rest_title:           'DESCANSO',
    next_round:           'Próximo: Round {n}',
    skip_rest:            'SALTAR DESCANSO',
    avg_power_rest:       'Potencia media',
    session_complete:     'SESIÓN COMPLETADA',
    mode_training:        '🥊 Entrenamiento',
    mode_combo:           '⚡ Modo Reacción',
    rounds_completed:     'Rounds',
    total_punches:        'Golpes totales',
    avg_power_s:          'Potencia media',
    max_power_s:          'Potencia máxima',
    avg_speed_s:          'Velocidad media',
    max_speed_s:          'Velocidad máxima',
    avg_reaction_s:       'Reacción media',
    best_reaction_s:      'Mejor reacción',
    hits_s:               'Combos OK',
    misses_s:             'Combos fallidos',
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
    hist_empty_title:     'Aún no tienes sesiones. ¡Empieza a entrenar!',
    rank_empty_title:     'Completa sesiones para aparecer en el ranking',
    settings_title:       'Ajustes',
    language_label:       'Idioma',
    save_settings:        'GUARDAR',
    alert_enter_name:     'Ingresa tu nombre',
    alert_weight:         'Ingresa un peso válido (30-200 kg)',
    alert_age:            'Ingresa una edad válida (10-100)',
    alert_weight_s:       'Peso inválido',
    alert_age_s:          'Edad inválida',
    confirm_stop:         '¿Abandonar la sesión?',
    abandon_penalty_title: '⚠️ SESIÓN ABANDONADA',
    rank_master:          '⚫ Maestro',
    rank_fast:            '🟤 Rápido',
    rank_good:            '🟡 Bueno',
    rank_keep:            '⚪ Sigue practicando',
    reaction_submode_label: 'SUBMODO',
    submode_simple:       'GOLPE SIMPLE',
    submode_combo:        'MODO COMBO',
    last_reaction:        'Última reacción',
    hits:                 'Aciertos',
    misses:               'Fallos',
    best_reaction:        'Mejor reacción',
    combo_pct_s:          '% Combos válidos',
    best_combo_duration_s:'Mejor duración combo',
    stimulus_wait:        'Prepárate',
    stimulus_hit:         '¡HIT!',
    stimulus_miss:        'FALLO',
    mode_reaction:        '⚡ Reacción Simple',
    hits_simple_s:        'Aciertos',
    misses_simple_s:      'Fallos',
    calib_menu_btn:       'CALIBRAR DISPOSITIVO',
    calib_title:          'CALIBRAR DISPOSITIVO',
    calib_desc:           'Dar 3 golpes de distinta intensidad para medir tu umbral de detección y tiempo de rebote.',
    calib_start:          'COMENZAR CALIBRACIÓN',
    step:                 'PASO',
    calib_step_instruction: 'Presiona LISTO, luego da el golpe',
    calib_press_ready:    'Presiona LISTO cuando estés preparado',
    calib_ready_btn:      'LISTO',
    calib_listening:      'ESCUCHANDO...',
    calib_detecting:      'Esperando golpe...',
    calib_next_step:      'SIGUIENTE PASO',
    calib_see_results:    'VER RESULTADOS',
    calib_results_title:  'CALIBRACIÓN COMPLETADA',
    calib_threshold:      'Umbral',
    calib_debounce:       'Debounce',
    calib_save:           'GUARDAR CALIBRACIÓN',
    calib_again:          'REPETIR CALIBRACIÓN',
    calib_notice:         'Calibra tu dispositivo para mayor precisión',
    calib_notice_btn:     'CALIBRAR',
    calib_peak_detected:  'Pico detectado: {g}G',
    calib_repeat_punch:   'REPETIR ESTE GOLPE',
    calib_no_punch:       'No se detectó ningún golpe. Inténtalo de nuevo.',
    calib_retry_btn:      'REINTENTAR',
    calib_err_medium_weak: 'El golpe medio debe ser más fuerte que el suave',
    calib_err_hard_weak:  'El golpe fuerte debe ser más fuerte que el medio',
    calib_err_same_intensity: 'Los golpes deben tener intensidades diferentes. Intenta de nuevo con más diferencia entre ellos.',
    calib_result_soft:    'Golpe suave detectado',
    calib_result_medium:  'Golpe medio detectado',
    calib_result_hard:    'Golpe fuerte detectado',
    calib_result_threshold: 'Umbral configurado',
    calib_result_sensitivity: 'Sensibilidad',
    calib_ms_debounce:    '{n} ms debounce',
    sound_label:          'SONIDO',
    sound_on:             'ACTIVADO',
    sound_off:            'SILENCIADO',
    submode_colors:       'MODO COLORES',
    submode_colors_desc:  'Reacciona al color de pantalla',
    color_labels_label:   'ETIQUETAS DE COLOR',
    color_order_label:    'ORDEN DE COLORES',
    color_yellow_ph:      'Ej: Piernas',
    color_red_ph:         'Ej: Torso',
    color_blue_ph:        'Ej: Cara',
    mode_colors:          '🎨 Modo Colores',
    color_stats_title:    'Estadísticas por color',
    help_title:           'AYUDA',
    card_reaction:        'REACCIÓN',
    card_reaction_desc:   'Mejora tu velocidad de reacción',
    card_power:           'POTENCIA',
    card_power_desc:      'Golpea más fuerte, mejora tu fuerza',
    card_combo:           'COMBO',
    card_combo_desc:      'Golpea más fluido',
    card_colors:          'COLORES',
    card_colors_desc:     'Mejora tu precisión',
    card_record:          'RÉCORD',
    home_intro_title:     '¿QUÉ TAN FUERTE PEGAS?',
    home_tagline_1:       'MIDE.',
    home_tagline_2:       'MEJORA.',
    home_tagline_3:       'DOMINA.',
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
    training_mode:        'TRAINING',
    training_desc:        'Measure speed and power by rounds',
    combo_mode:           'REACTION MODE',
    combo_desc:           'Combos with reaction time tracking',
    rounds_label:         'Rounds',
    round_duration_label: 'Round duration',
    rest_duration_label:  'Rest between rounds',
    config_start:         'START TRAINING',
    config_summary:       '{r} rounds · {rd} min · {rst}s rest · ~{total} min total',
    val_rounds:           '{n} rounds',
    val_round_duration:   '{n} min',
    val_rest_duration:    '{n} s',
    combo_hits_label:     'HITS PER COMBO',
    combo_duration_label: 'MAX COMBO DURATION',
    combo_pause_label:    'PAUSE BETWEEN SIGNALS',
    combo_mode_label:     'MODE',
    mode_fixed:           'FIXED',
    mode_random:          'RANDOM',
    nav_profile:          'Profile',
    nav_train:            'Train',
    nav_history:          'History',
    ios_permission_text:  'iOS requires permission for the accelerometer',
    ios_permission_btn:   '🎯 Activate motion sensor',
    ios_granted:          '✓ Sensor activated',
    ios_denied:           '✗ Permission denied — punches cannot be detected',
    round_indicator:      'ROUND {n}/{total}',
    punches:              'Punches',
    speed_label:          'Speed m/s',
    power_label:          'Power',
    best_punch:           'Best punch',
    chart_last10:         'Last 10 punches (G)',
    rest_title:           'REST',
    next_round:           'Next: Round {n}',
    skip_rest:            'SKIP REST',
    avg_power_rest:       'Avg. power',
    session_complete:     'SESSION COMPLETE',
    mode_training:        '🥊 Training',
    mode_combo:           '⚡ Reaction Mode',
    rounds_completed:     'Rounds',
    total_punches:        'Total punches',
    avg_power_s:          'Avg. power',
    max_power_s:          'Max. power',
    avg_speed_s:          'Avg. speed',
    max_speed_s:          'Max. speed',
    avg_reaction_s:       'Avg. reaction',
    best_reaction_s:      'Best reaction',
    hits_s:               'Combos OK',
    misses_s:             'Failed combos',
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
    hist_empty_title:     'You don\'t have any sessions yet. Start training!',
    rank_empty_title:     'Complete sessions to appear in the ranking',
    settings_title:       'Settings',
    language_label:       'Language',
    save_settings:        'SAVE',
    alert_enter_name:     'Enter your name',
    alert_weight:         'Enter a valid weight (30-200 kg)',
    alert_age:            'Enter a valid age (10-100)',
    alert_weight_s:       'Invalid weight',
    alert_age_s:          'Invalid age',
    confirm_stop:         'Abandon the session?',
    abandon_penalty_title: '⚠️ SESSION ABANDONED',
    rank_master:          '⚫ Master',
    rank_fast:            '🟤 Fast',
    rank_good:            '🟡 Good',
    rank_keep:            '⚪ Keep practicing',
    reaction_submode_label: 'SUBMODE',
    submode_simple:       'SINGLE HIT',
    submode_combo:        'COMBO MODE',
    last_reaction:        'Last reaction',
    hits:                 'Hits',
    misses:               'Misses',
    best_reaction:        'Best reaction',
    combo_pct_s:          '% Valid combos',
    best_combo_duration_s:'Best combo duration',
    stimulus_wait:        'Get ready',
    stimulus_hit:         'HIT!',
    stimulus_miss:        'MISS',
    mode_reaction:        '⚡ Simple Reaction',
    hits_simple_s:        'Hits',
    misses_simple_s:      'Misses',
    calib_menu_btn:       'CALIBRATE DEVICE',
    calib_title:          'CALIBRATE DEVICE',
    calib_desc:           'Throw 3 punches of different intensity to measure your detection threshold and debounce time.',
    calib_start:          'START CALIBRATION',
    step:                 'STEP',
    calib_step_instruction: 'Press READY, then throw the punch',
    calib_press_ready:    'Press READY when you\'re set',
    calib_ready_btn:      'READY',
    calib_listening:      'LISTENING...',
    calib_detecting:      'Waiting for punch...',
    calib_next_step:      'NEXT STEP',
    calib_see_results:    'SEE RESULTS',
    calib_results_title:  'CALIBRATION COMPLETE',
    calib_threshold:      'Threshold',
    calib_debounce:       'Debounce',
    calib_save:           'SAVE CALIBRATION',
    calib_again:          'REPEAT CALIBRATION',
    calib_notice:         'Calibrate your device for better precision',
    calib_notice_btn:     'CALIBRATE',
    calib_peak_detected:  'Peak detected: {g}G',
    calib_repeat_punch:   'REPEAT THIS PUNCH',
    calib_no_punch:       'No punch detected. Try again.',
    calib_retry_btn:      'RETRY',
    calib_err_medium_weak: 'The medium punch must be harder than the soft one',
    calib_err_hard_weak:  'The hard punch must be harder than the medium one',
    calib_err_same_intensity: 'The punches must have different intensities. Try again with more difference between them.',
    calib_result_soft:    'Soft punch detected',
    calib_result_medium:  'Medium punch detected',
    calib_result_hard:    'Hard punch detected',
    calib_result_threshold: 'Configured threshold',
    calib_result_sensitivity: 'Sensitivity',
    calib_ms_debounce:    '{n} ms debounce',
    sound_label:          'SOUND',
    sound_on:             'ON',
    sound_off:            'MUTED',
    submode_colors:       'COLOR MODE',
    submode_colors_desc:  'React to the screen color',
    color_labels_label:   'COLOR LABELS',
    color_order_label:    'COLOR ORDER',
    color_yellow_ph:      'e.g. Legs',
    color_red_ph:         'e.g. Torso',
    color_blue_ph:        'e.g. Head',
    mode_colors:          '🎨 Color Mode',
    color_stats_title:    'Stats by color',
    help_title:           'HELP',
    card_reaction:        'REACTION',
    card_reaction_desc:   'Improve your reaction speed',
    card_power:           'POWER',
    card_power_desc:      'Hit harder',
    card_combo:           'COMBO',
    card_combo_desc:      'Hit smoother',
    card_colors:          'COLORS',
    card_colors_desc:     'Improve your accuracy',
    card_record:          'RECORD',
    home_intro_title:     'HOW HARD DO YOU PUNCH?',
    home_tagline_1:       'MEASURE.',
    home_tagline_2:       'IMPROVE.',
    home_tagline_3:       'DOMINATE.',
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
    training_mode:        'TREINO',
    training_desc:        'Meça velocidade e potência por rounds',
    combo_mode:           'MODO REAÇÃO',
    combo_desc:           'Combos com tempo de reação',
    rounds_label:         'Rounds',
    round_duration_label: 'Duração do round',
    rest_duration_label:  'Descanso entre rounds',
    config_start:         'INICIAR TREINO',
    config_summary:       '{r} rounds · {rd} min · {rst}s descanso · ~{total} min total',
    val_rounds:           '{n} rounds',
    val_round_duration:   '{n} min',
    val_rest_duration:    '{n} s',
    combo_hits_label:     'GOLPES POR COMBO',
    combo_duration_label: 'DURAÇÃO MÁXIMA DO COMBO',
    combo_pause_label:    'PAUSA ENTRE SINAIS',
    combo_mode_label:     'MODO',
    mode_fixed:           'FIXO',
    mode_random:          'ALEATÓRIO',
    nav_profile:          'Perfil',
    nav_train:            'Treinar',
    nav_history:          'Histórico',
    ios_permission_text:  'iOS requer permissão para o acelerômetro',
    ios_permission_btn:   '🎯 Ativar sensor de movimento',
    ios_granted:          '✓ Sensor ativado',
    ios_denied:           '✗ Permissão negada — não será possível detectar socos',
    round_indicator:      'ROUND {n}/{total}',
    punches:              'Golpes',
    speed_label:          'Velocidade m/s',
    power_label:          'Potência',
    best_punch:           'Melhor golpe',
    chart_last10:         'Últimos 10 golpes (G)',
    rest_title:           'DESCANSO',
    next_round:           'Próximo: Round {n}',
    skip_rest:            'PULAR DESCANSO',
    avg_power_rest:       'Potência média',
    session_complete:     'SESSÃO COMPLETA',
    mode_training:        '🥊 Treino',
    mode_combo:           '⚡ Modo Reação',
    rounds_completed:     'Rounds',
    total_punches:        'Total de golpes',
    avg_power_s:          'Potência média',
    max_power_s:          'Potência máxima',
    avg_speed_s:          'Velocidade média',
    max_speed_s:          'Velocidade máxima',
    avg_reaction_s:       'Reação média',
    best_reaction_s:      'Melhor reação',
    hits_s:               'Combos OK',
    misses_s:             'Combos falhados',
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
    power_chart_title:    'Evolução Potência Média (últimas 10)',
    reaction_chart_title: 'Tempo de Reação (últimas 10)',
    calories_chart_title: 'Calorias por sessão (últimas 10)',
    no_sessions:          'Sem sessões ainda 🥊',
    hist_empty_title:     'Você ainda não tem sessões. Comece a treinar!',
    rank_empty_title:     'Complete sessões para aparecer no ranking',
    settings_title:       'Configurações',
    language_label:       'Idioma',
    save_settings:        'SALVAR',
    alert_enter_name:     'Digite seu nome',
    alert_weight:         'Peso inválido (30-200 kg)',
    alert_age:            'Idade inválida (10-100)',
    alert_weight_s:       'Peso inválido',
    alert_age_s:          'Idade inválida',
    confirm_stop:         'Abandonar a sessão?',
    abandon_penalty_title: '⚠️ SESSÃO ABANDONADA',
    rank_master:          '⚫ Mestre',
    rank_fast:            '🟤 Rápido',
    rank_good:            '🟡 Bom',
    rank_keep:            '⚪ Continue praticando',
    reaction_submode_label: 'SUBMODO',
    submode_simple:       'GOLPE SIMPLES',
    submode_combo:        'MODO COMBO',
    last_reaction:        'Última reação',
    hits:                 'Acertos',
    misses:               'Erros',
    best_reaction:        'Melhor reação',
    combo_pct_s:          '% Combos válidos',
    best_combo_duration_s:'Melhor duração combo',
    stimulus_wait:        'Prepara-te',
    stimulus_hit:         'HIT!',
    stimulus_miss:        'FALHOU',
    mode_reaction:        '⚡ Reação Simples',
    hits_simple_s:        'Acertos',
    misses_simple_s:      'Erros',
    calib_menu_btn:       'CALIBRAR DISPOSITIVO',
    calib_title:          'CALIBRAR DISPOSITIVO',
    calib_desc:           'Dar 3 socos de intensidades diferentes para medir seu limiar de detecção e tempo de rejeição.',
    calib_start:          'INICIAR CALIBRAÇÃO',
    step:                 'PASSO',
    calib_step_instruction: 'Pressione PRONTO, depois dê o soco',
    calib_press_ready:    'Pressione PRONTO quando estiver preparado',
    calib_ready_btn:      'PRONTO',
    calib_listening:      'OUVINDO...',
    calib_detecting:      'Aguardando soco...',
    calib_next_step:      'PRÓXIMO PASSO',
    calib_see_results:    'VER RESULTADOS',
    calib_results_title:  'CALIBRAÇÃO CONCLUÍDA',
    calib_threshold:      'Limiar',
    calib_debounce:       'Debounce',
    calib_save:           'SALVAR CALIBRAÇÃO',
    calib_again:          'REPETIR CALIBRAÇÃO',
    calib_notice:         'Calibre seu dispositivo para maior precisão',
    calib_notice_btn:     'CALIBRAR',
    calib_peak_detected:  'Pico detectado: {g}G',
    calib_repeat_punch:   'REPETIR ESTE SOCO',
    calib_no_punch:       'Nenhum soco detectado. Tente novamente.',
    calib_retry_btn:      'TENTAR NOVAMENTE',
    calib_err_medium_weak: 'O soco médio deve ser mais forte que o leve',
    calib_err_hard_weak:  'O soco forte deve ser mais forte que o médio',
    calib_err_same_intensity: 'Os socos devem ter intensidades diferentes. Tente novamente com mais diferença entre eles.',
    calib_result_soft:    'Soco leve detectado',
    calib_result_medium:  'Soco médio detectado',
    calib_result_hard:    'Soco forte detectado',
    calib_result_threshold: 'Limiar configurado',
    calib_result_sensitivity: 'Sensibilidade',
    calib_ms_debounce:    '{n} ms debounce',
    sound_label:          'SOM',
    sound_on:             'ATIVADO',
    sound_off:            'SILENCIADO',
    submode_colors:       'MODO CORES',
    submode_colors_desc:  'Reaja à cor da tela',
    color_labels_label:   'RÓTULOS DE COR',
    color_order_label:    'ORDEM DAS CORES',
    color_yellow_ph:      'Ex: Pernas',
    color_red_ph:         'Ex: Tronco',
    color_blue_ph:        'Ex: Cabeça',
    mode_colors:          '🎨 Modo Cores',
    color_stats_title:    'Estatísticas por cor',
    help_title:           'AJUDA',
    card_reaction:        'REAÇÃO',
    card_reaction_desc:   'Melhora a tua velocidade de reação',
    card_power:           'POTÊNCIA',
    card_power_desc:      'Golpeia mais forte',
    card_combo:           'COMBO',
    card_combo_desc:      'Golpeia mais fluido',
    card_colors:          'CORES',
    card_colors_desc:     'Melhora a tua precisão',
    card_record:          'RECORDE',
    home_intro_title:     'QUÃ FORTE VOCÊ SOCA?',
    home_tagline_1:       'MEÇA.',
    home_tagline_2:       'MELHORE.',
    home_tagline_3:       'DOMINE.',
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
    training_mode:        'TRAINING',
    training_desc:        'Geschwindigkeit & Kraft messen',
    combo_mode:           'REAKTIONSMODUS',
    combo_desc:           'Kombos mit Reaktionszeit',
    rounds_label:         'Runden',
    round_duration_label: 'Rundendauer',
    rest_duration_label:  'Pause zwischen Runden',
    config_start:         'TRAINING STARTEN',
    config_summary:       '{r} Runden · {rd} min · {rst}s Pause · ~{total} min gesamt',
    val_rounds:           '{n} Runden',
    val_round_duration:   '{n} min',
    val_rest_duration:    '{n} s',
    combo_hits_label:     'SCHLÄGE PRO KOMBO',
    combo_duration_label: 'MAX. KOMBODAUER',
    combo_pause_label:    'PAUSE ZWISCHEN SIGNALEN',
    combo_mode_label:     'MODUS',
    mode_fixed:           'FEST',
    mode_random:          'ZUFÄLLIG',
    nav_profile:          'Profil',
    nav_train:            'Trainieren',
    nav_history:          'Verlauf',
    ios_permission_text:  'iOS benötigt Erlaubnis für den Beschleunigungssensor',
    ios_permission_btn:   '🎯 Bewegungssensor aktivieren',
    ios_granted:          '✓ Sensor aktiviert',
    ios_denied:           '✗ Berechtigung verweigert — Schläge können nicht erkannt werden',
    round_indicator:      'RUNDE {n}/{total}',
    punches:              'Schläge',
    speed_label:          'Geschwindigkeit m/s',
    power_label:          'Kraft',
    best_punch:           'Bester Schlag',
    chart_last10:         'Letzte 10 Schläge (G)',
    rest_title:           'PAUSE',
    next_round:           'Nächste: Runde {n}',
    skip_rest:            'PAUSE ÜBERSPRINGEN',
    avg_power_rest:       'Ø Kraft',
    session_complete:     'SESSION ABGESCHLOSSEN',
    mode_training:        '🥊 Training',
    mode_combo:           '⚡ Reaktionsmodus',
    rounds_completed:     'Runden',
    total_punches:        'Schläge gesamt',
    avg_power_s:          'Ø Kraft',
    max_power_s:          'Max. Kraft',
    avg_speed_s:          'Ø Geschwindigkeit',
    max_speed_s:          'Max. Geschwindigkeit',
    avg_reaction_s:       'Ø Reaktion',
    best_reaction_s:      'Beste Reaktion',
    hits_s:               'Kombos OK',
    misses_s:             'Fehlgeschlagene Kombos',
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
    hist_empty_title:     'Du hast noch keine Sessions. Fang jetzt an zu trainieren!',
    rank_empty_title:     'Schließe Sessions ab, um im Ranking zu erscheinen',
    settings_title:       'Einstellungen',
    language_label:       'Sprache',
    save_settings:        'SPEICHERN',
    alert_enter_name:     'Gib deinen Namen ein',
    alert_weight:         'Ungültiges Gewicht (30-200 kg)',
    alert_age:            'Ungültiges Alter (10-100)',
    alert_weight_s:       'Ungültiges Gewicht',
    alert_age_s:          'Ungültiges Alter',
    confirm_stop:         'Session abbrechen?',
    abandon_penalty_title: '⚠️ SITZUNG ABGEBROCHEN',
    rank_master:          '⚫ Meister',
    rank_fast:            '🟤 Schnell',
    rank_good:            '🟡 Gut',
    rank_keep:            '⚪ Weiter üben',
    reaction_submode_label: 'UNTERMODUS',
    submode_simple:       'EINZELSCHLAG',
    submode_combo:        'KOMBO-MODUS',
    last_reaction:        'Letzte Reaktion',
    hits:                 'Treffer',
    misses:               'Fehler',
    best_reaction:        'Beste Reaktion',
    combo_pct_s:          '% gültige Kombos',
    best_combo_duration_s:'Beste Kombodauer',
    stimulus_wait:        'Bereitmachen',
    stimulus_hit:         'SCHLAG!',
    stimulus_miss:        'FEHLER',
    mode_reaction:        '⚡ Einzel-Reaktion',
    hits_simple_s:        'Treffer',
    misses_simple_s:      'Fehler',
    calib_menu_btn:       'GERÄT KALIBRIEREN',
    calib_title:          'GERÄT KALIBRIEREN',
    calib_desc:           '3 Schläge unterschiedlicher Intensität ausführen, um Schwellenwert und Entprellzeit zu messen.',
    calib_start:          'KALIBRIERUNG STARTEN',
    step:                 'SCHRITT',
    calib_step_instruction: 'BEREIT drücken, dann schlagen',
    calib_press_ready:    'BEREIT drücken, wenn du bereit bist',
    calib_ready_btn:      'BEREIT',
    calib_listening:      'HÖRE ZU...',
    calib_detecting:      'Warte auf Schlag...',
    calib_next_step:      'NÄCHSTER SCHRITT',
    calib_see_results:    'ERGEBNISSE ANZEIGEN',
    calib_results_title:  'KALIBRIERUNG ABGESCHLOSSEN',
    calib_threshold:      'Schwellenwert',
    calib_debounce:       'Entprellzeit',
    calib_save:           'KALIBRIERUNG SPEICHERN',
    calib_again:          'KALIBRIERUNG WIEDERHOLEN',
    calib_notice:         'Kalibriere dein Gerät für bessere Präzision',
    calib_notice_btn:     'KALIBRIEREN',
    calib_peak_detected:  'Erkannter Spitzenwert: {g}G',
    calib_repeat_punch:   'SCHLAG WIEDERHOLEN',
    calib_no_punch:       'Kein Schlag erkannt. Versuche es erneut.',
    calib_retry_btn:      'ERNEUT VERSUCHEN',
    calib_err_medium_weak: 'Der mittlere Schlag muss stärker sein als der leichte',
    calib_err_hard_weak:  'Der harte Schlag muss stärker sein als der mittlere',
    calib_err_same_intensity: 'Die Schläge müssen unterschiedliche Intensitäten haben. Versuche es mit mehr Unterschied erneut.',
    calib_result_soft:    'Leichter Schlag erkannt',
    calib_result_medium:  'Mittlerer Schlag erkannt',
    calib_result_hard:    'Harter Schlag erkannt',
    calib_result_threshold: 'Eingestellter Schwellenwert',
    calib_result_sensitivity: 'Empfindlichkeit',
    calib_ms_debounce:    '{n} ms Entprellzeit',
    sound_label:          'TON',
    sound_on:             'AN',
    sound_off:            'STUMM',
    submode_colors:       'FARBMODUS',
    submode_colors_desc:  'Reagiere auf die Bildschirmfarbe',
    color_labels_label:   'FARBBESCHRIFTUNGEN',
    color_order_label:    'FARBREIHENFOLGE',
    color_yellow_ph:      'z.B. Beine',
    color_red_ph:         'z.B. Rumpf',
    color_blue_ph:        'z.B. Kopf',
    mode_colors:          '🎨 Farbmodus',
    color_stats_title:    'Statistik nach Farbe',
    help_title:           'HILFE',
    card_reaction:        'REAKTION',
    card_reaction_desc:   'Verbessere deine Reaktionszeit',
    card_power:           'KRAFT',
    card_power_desc:      'Schlage härter',
    card_combo:           'COMBO',
    card_combo_desc:      'Schlage flüssiger',
    card_colors:          'FARBEN',
    card_colors_desc:     'Verbessere deine Präzision',
    card_record:          'REKORD',
    home_intro_title:     'WIE HART SCHLÄGST DU?',
    home_tagline_1:       'MESSEN.',
    home_tagline_2:       'VERBESSERN.',
    home_tagline_3:       'DOMINIEREN.',
  },
};

// ═══════════════════════════════════════════════════
// ESTADO GLOBAL
// ═══════════════════════════════════════════════════
const APP = {
  lang: 'es',
  profile: null,
  mode: null,           // 'training' | 'combo'
  config: {
    rounds: 3,
    roundDuration: 2,
    restDuration: 30,
  },
  comboConfig: {
    hits: 3,            // 2-6, fixed mode or max in random
    maxDuration: 2.0,   // seconds for the combo window (from first hit)
    pauseBetween: 1.5,  // seconds between result and next signal
    mode: 'fixed',      // 'fixed' | 'random'
    submode: 'combo',   // 'simple' | 'combo'
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
    listening: false,
    lastPunchAt: 0,
    COOLDOWN: 150,
    COMBO_HIT_COOLDOWN: 80,
    THRESHOLD: 2.0,           // G-force mínimo (default sin calibrar)
    ABSOLUTE_MIN_G: 1.2,      // Nunca bajar de este valor aunque calibración lo pida
    _logAt: 0,
    _peakStart: 0,            // Filtro sostenido: timestamp primer cruce de umbral
    _peakMax: 0,              // Pico máximo durante la ventana sostenida
  },
  sessionActive: false,
  hitWindowActive: false,
  combo: {
    state: 'idle',       // 'idle'|'wait'|'signal'|'active'|'result'
    targetHits: 3,
    currentHits: 0,
    signalAt: null,
    activeAt: null,
    lastHitAt: null,     // timestamp of each hit — used for accurate combo duration
    reactionMs: null,
    waitTimeout: null,
    signalTimeout: null,
    expireTimeout: null,
    tickInterval: null,
    waitTickInterval: null,
    progressInterval: null,
    results: [],
  },
  reaction: {
    state: 'idle',      // 'idle' | 'wait' | 'hit' | 'result' | 'miss'
    stimulusAt: null,
    waitTimeout: null,
    missTimeout: null,
  },
  rest: { interval: null },
  wakeLock: null,
  audioCtx: null,
  sessionSaved: false,
  soundEnabled: true,
  colorConfig: { yellow: '', red: '', blue: '', order: 'random' },
  colorMode: {
    state: 'idle',
    currentColor: null,
    stimulusAt: null,
    waitTimeout: null,
    missTimeout: null,
    results: [],
    fixedIndex: 0,
  },
  calib: {
    step: 0,
    state: 'idle',
    data: [],
    listener: null,
    captureTimer: null,
    graphData: [],
    graphInterval: null,
    peakG: 0,
    triggerAt: null,
    ringEnd: null,
    fromScreen: 'screen-menu',
  },
  calibration: null, // { soft, medium, hard, threshold, debounce, calibrated, date } — resultado final persistido
  avatar: null,
};

// ═══════════════════════════════════════════════════
// I18N
// ═══════════════════════════════════════════════════
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

function applyLanguage() {
  document.documentElement.lang = APP.lang;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    const val = t(key);
    if (val !== key) el.textContent = val;
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });
  document.querySelectorAll('.btn-lang-sm').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === APP.lang);
  });
}

function getLocale() {
  return { es: 'es-ES', en: 'en-GB', pt: 'pt-BR', de: 'de-DE' }[APP.lang] || 'es-ES';
}

// ═══════════════════════════════════════════════════
// SISTEMA DE NIVELES
// ═══════════════════════════════════════════════════
const RANK_LEVELS = [
  { name: 'Recluta',       min: 0,    max: 99 },
  { name: 'Striker',       min: 100,  max: 299 },
  { name: 'Contender',     min: 300,  max: 599 },
  { name: 'Power Fighter', min: 600,  max: 999 },
  { name: 'Knockout',      min: 1000, max: 1499 },
  { name: 'Dominator',     min: 1500, max: 2199 },
  { name: 'Champion',      min: 2200, max: 2999 },
  { name: 'Legend',        min: 3000, max: 3999 },
  { name: 'Impact Master', min: 4000, max: Infinity },
];

function getSessionScore(s) {
  return (s.punches || 0) + Math.round((s.maxSpeed || 0) * 10);
}

function getRankLevel(sessions) {
  const score = sessions.reduce((acc, s) => acc + getSessionScore(s), 0);
  let idx = RANK_LEVELS.findIndex(l => score >= l.min && score <= l.max);
  if (idx < 0) idx = RANK_LEVELS.length - 1;
  const level     = RANK_LEVELS[idx];
  const nextLevel = RANK_LEVELS[idx + 1] || null;
  return { score, level, nextLevel, idx };
}

// ═══════════════════════════════════════════════════
// GAMIFICACIÓN — MODO POTENCIA
// ═══════════════════════════════════════════════════
const XP_LEVELS = [
  { name: 'Recluta',       min: 0     },
  { name: 'Striker',       min: 500   },
  { name: 'Contender',     min: 1500  },
  { name: 'Power Fighter', min: 3000  },
  { name: 'Knockout',      min: 5000  },
  { name: 'Dominator',     min: 8000  },
  { name: 'Champion',      min: 12000 },
  { name: 'Legend',        min: 18000 },
  { name: 'Impact Master', min: 25000 },
];

const GLOBAL_HIT_TIERS = [
  { label: 'HIT',        minG: 0,   xp: 5,   color: '#FFFFFF' },
  { label: 'GOOD',       minG: 1.5, xp: 10,  color: '#00FF66' },
  { label: 'GREAT',      minG: 3,   xp: 25,  color: '#00D4FF' },
  { label: 'EXCELLENT',  minG: 5,   xp: 50,  color: '#FFD300' },
  { label: 'MASTER',     minG: 7,   xp: 100, color: '#FF8C00' },
  { label: 'SIFU LEVEL', minG: 9,   xp: 200, color: '#FF1A1A' },
];

const RATING_ORDER = ['HIT', 'GOOD', 'GREAT', 'EXCELLENT', 'MASTER', 'SIFU LEVEL'];

function getGlobalTier(g) {
  for (let i = GLOBAL_HIT_TIERS.length - 1; i >= 0; i--) {
    if (g >= GLOBAL_HIT_TIERS[i].minG) return GLOBAL_HIT_TIERS[i];
  }
  return GLOBAL_HIT_TIERS[0];
}

let _milestoneQueue   = [];
let _milestoneActive  = false;

function getHitRating(g) {
  return getGlobalTier(g);
}

function loadGamificationXP() {
  return parseInt(localStorage.getItem('fkf_gam_xp'), 10) || 0;
}

function saveGamificationXP(xp) {
  localStorage.setItem('fkf_gam_xp', String(Math.max(0, xp)));
}

function getXPLevelInfo(xp) {
  let idx = 0;
  for (let i = XP_LEVELS.length - 1; i >= 0; i--) {
    if (xp >= XP_LEVELS[i].min) { idx = i; break; }
  }
  return { idx, current: XP_LEVELS[idx], next: XP_LEVELS[idx + 1] || null };
}

function initGamificationSession() {
  _milestoneQueue  = [];
  _milestoneActive = false;
  const totalXP  = loadGamificationXP();
  const { idx }  = getXPLevelInfo(totalXP);
  const sessions = getSessions();
  const historicBestG      = sessions.reduce((m, s) => Math.max(m, s.maxPower || 0), 0);
  const historicBestStreak = parseInt(localStorage.getItem('fkf_best_streak') || '0') || 0;
  APP.gamification = {
    totalXP,
    sessionXP: 0,
    currentStreak: 0,
    bestStreak: 0,
    streakTimer: null,
    sessionBestG: 0,
    sessionBestRating: '',
    sessionStartLevelIdx: idx,
    historicBestG,
    historicBestStreak,
  };
}

function handleGamificationPunch(punch, tier) {
  const gam = APP.gamification;
  if (!gam) return;

  // XP & popup already handled by triggerHitFeedback — only track session XP here
  gam.sessionXP += tier.xp;
  // totalXP already updated by triggerHitFeedback

  updateXPBar();

  const prevTotal = gam.totalXP - tier.xp;
  const prevLevel = getXPLevelInfo(prevTotal);
  const newLevel  = getXPLevelInfo(gam.totalXP);
  if (newLevel.idx > prevLevel.idx) showLevelUp(newLevel.current.name);

  // Streak
  clearTimeout(gam.streakTimer);
  gam.currentStreak++;
  if (gam.currentStreak > gam.bestStreak) gam.bestStreak = gam.currentStreak;
  gam.streakTimer = trackedTimeout(() => {
    gam.currentStreak = 0;
    updateStreakUI();
  }, 3000);
  updateStreakUI();
  checkStreakMilestone(gam.currentStreak);

  // Best rating
  const rIdx = RATING_ORDER.indexOf(tier.label);
  const bIdx = RATING_ORDER.indexOf(gam.sessionBestRating);
  if (!gam.sessionBestRating || rIdx > bIdx) gam.sessionBestRating = tier.label;

  // Records
  let shownPersonal = false;
  if (punch.g > gam.historicBestG) {
    gam.historicBestG = punch.g;
    shownPersonal = true;
    showMilestone(pickEpicMsg('record'));
    playRecordSound();
  }
  if (!shownPersonal && punch.g > gam.sessionBestG && gam.sessionBestG > 0) {
    showMilestone(pickEpicMsg('best'));
  }
  if (punch.g > gam.sessionBestG) gam.sessionBestG = punch.g;
}

function showHitRatingPopup(label, xp) {
  const el    = document.getElementById('gam-hit-rating');
  const lblEl = document.getElementById('gam-hit-label');
  const xpEl  = document.getElementById('gam-hit-xp');
  if (!el) return;
  lblEl.textContent = label;
  xpEl.textContent  = '+' + xp + ' XP';
  const tier = GLOBAL_HIT_TIERS.find(t => t.label === label);
  lblEl.style.color = tier ? tier.color : '#FFFFFF';
  el.classList.remove('gam-hit-anim');
  void el.offsetWidth;
  el.classList.add('gam-hit-anim');
}

function getComboGlowEl() {
  let el = document.getElementById('combo-edge-glow');
  if (!el) {
    el = document.createElement('div');
    el.id = 'combo-edge-glow';
    el.className = 'combo-edge-glow';
    document.body.appendChild(el);
  }
  return el;
}

function updateStreakUI() {
  const gam = APP.gamification;
  const el  = document.getElementById('global-streak-counter');
  const old = document.getElementById('gam-streak-badge');
  if (old) old.classList.add('hidden');

  const glow = getComboGlowEl();
  glow.classList.remove('cg-5', 'cg-10', 'cg-20');

  if (!el || !gam) return;
  const s = gam.currentStreak;
  if (s < 2) { el.classList.add('hidden'); return; }
  el.classList.remove('hidden', 'gsc-s2', 'gsc-s5', 'gsc-s10', 'gsc-s20', 'gsc-s50');
  el.textContent = 'x' + s;
  if      (s >= 50) el.classList.add('gsc-s50');
  else if (s >= 20) el.classList.add('gsc-s20');
  else if (s >= 10) el.classList.add('gsc-s10');
  else if (s >= 5)  el.classList.add('gsc-s5');
  else              el.classList.add('gsc-s2');

  if      (s >= 20) glow.classList.add('cg-20');
  else if (s >= 10) glow.classList.add('cg-10');
  else if (s >= 5)  glow.classList.add('cg-5');
}

function resetStreakCounter() {
  const el = document.getElementById('global-streak-counter');
  if (el) el.classList.add('hidden');
}

function checkStreakMilestone(streak) {
  if (streak === 5)  { playComboStreakSound(5); }
  if (streak === 10) { playComboStreakSound(10); showMilestone(pickEpicMsg('streak10')); }
  if (streak === 20) { playComboStreakSound(20); showMilestone(pickEpicMsg('streak20')); flashScreen(); }
  if (streak === 25) { showMilestone(pickEpicMsg('streak25')); }
  if (streak === 50) {
    const gam = APP.gamification;
    playComboStreakSound(50);
    if (gam && streak > gam.historicBestStreak) {
      gam.historicBestStreak = streak;
      localStorage.setItem('fkf_best_streak', String(streak));
      showMilestone(pickEpicMsg('record'));
      playRecordSound();
    } else {
      showMilestone(pickEpicMsg('streak50'));
    }
  }
}

function updateXPBar() {
  const gam = APP.gamification;
  if (!gam) return;
  const { current, next } = getXPLevelInfo(gam.totalXP);
  const lvlEl  = document.getElementById('gam-xp-level-label');
  const fillEl = document.getElementById('gam-xp-bar-fill');
  const progEl = document.getElementById('gam-xp-bar-progress');
  if (lvlEl) lvlEl.textContent = current.name.toUpperCase();
  if (next) {
    const pct = Math.min(100, Math.round(((gam.totalXP - current.min) / (next.min - current.min)) * 100));
    if (fillEl) fillEl.style.width = pct + '%';
    if (progEl) progEl.textContent = gam.totalXP + ' / ' + next.min + ' XP';
  } else {
    if (fillEl) fillEl.style.width = '100%';
    if (progEl) progEl.textContent = gam.totalXP + ' XP · MAX';
  }
}

function showLevelUp(levelName) {
  playLevelUpSound();
  const ov = document.createElement('div');
  ov.className = 'level-up-overlay';
  ov.innerHTML = `<div class="lu-tag">LEVEL UP</div><div class="lu-name">${levelName.toUpperCase()}</div>`;
  document.body.appendChild(ov);
  trackedTimeout(() => ov.remove(), 2600);
  const fill = document.getElementById('gam-xp-bar-fill');
  if (fill) {
    fill.classList.add('gam-xp-flash');
    trackedTimeout(() => fill.classList.remove('gam-xp-flash'), 1000);
  }
}

function showMilestone(text) {
  _milestoneQueue.push(text);
  if (!_milestoneActive) drainMilestoneQueue();
}

function drainMilestoneQueue() {
  if (!_milestoneQueue.length) { _milestoneActive = false; return; }
  _milestoneActive = true;
  const text  = _milestoneQueue.shift();
  const el    = document.getElementById('gam-milestone');
  const txtEl = document.getElementById('gam-milestone-text');
  if (!el || !txtEl) { drainMilestoneQueue(); return; }
  txtEl.textContent = text;
  el.classList.remove('hidden', 'gam-milestone-show');
  void el.offsetWidth;
  el.classList.add('gam-milestone-show');
  trackedTimeout(() => {
    el.classList.remove('gam-milestone-show');
    el.classList.add('hidden');
    trackedTimeout(drainMilestoneQueue, 120);
  }, 1500);
}

function flashScreen() {
  const sc = document.getElementById('screen-training');
  if (!sc) return;
  sc.classList.remove('gam-screen-flash');
  void sc.offsetWidth;
  sc.classList.add('gam-screen-flash');
  trackedTimeout(() => sc.classList.remove('gam-screen-flash'), 400);
}

function renderGamificationSummary() {
  const gam = APP.gamification;
  if (!gam) return;
  const { current, next } = getXPLevelInfo(gam.totalXP);
  const pct = next
    ? Math.min(100, Math.round(((gam.totalXP - current.min) / (next.min - current.min)) * 100))
    : 100;
  const leveledUp   = getXPLevelInfo(gam.totalXP).idx > gam.sessionStartLevelIdx;
  const leveledName = getXPLevelInfo(gam.totalXP).current.name;
  const progText    = next ? gam.totalXP + ' / ' + next.min + ' XP' : gam.totalXP + ' XP · MAX';
  const _rTier = GLOBAL_HIT_TIERS.find(t => t.label === gam.sessionBestRating);
  const ratingColor = _rTier ? _rTier.color : '#FFD300';

  const existing = document.getElementById('gam-summary-section');
  if (existing) existing.remove();

  const div = document.createElement('div');
  div.id        = 'gam-summary-section';
  div.className = 'gam-summary-section';
  div.innerHTML = `
    <div class="gam-summary-xp">+${Math.max(0, gam.sessionXP)} XP</div>
    <div class="gam-summary-xp-label">XP GANADO EN ESTA SESIÓN</div>
    <div class="gam-summary-details">
      <div class="gam-summary-detail">
        <div class="gam-summary-detail-label">MEJOR GOLPE</div>
        <div class="gam-summary-detail-val" style="color:${ratingColor}">${gam.sessionBestRating || 'GOOD'}</div>
      </div>
      <div class="gam-summary-detail">
        <div class="gam-summary-detail-label">MEJOR COMBO</div>
        <div class="gam-summary-detail-val">x${gam.bestStreak}</div>
      </div>
    </div>
    <div class="gam-summary-level">
      <div class="gam-summary-level-name">${current.name.toUpperCase()}</div>
      <div class="gam-xp-bar-track" style="margin:8px 0">
        <div class="gam-xp-bar-fill" style="width:${pct}%"></div>
      </div>
      <div class="gam-summary-level-progress">${progText}</div>
    </div>
    ${leveledUp ? `<div class="gam-summary-levelup">⬆ SUBISTE A ${leveledName.toUpperCase()}</div>` : ''}
  `;

  const body  = document.querySelector('#screen-summary .summary-body');
  const msgEl = document.getElementById('summary-message');
  if (body && msgEl) body.insertBefore(div, msgEl);
}

// ─── SONIDOS GAMIFICACIÓN ─────────────────────────────
function playHitRatingSound(rating) {
  if (!APP.soundEnabled) return;
  try {
    const ctx = getAudioCtx();
    if (ctx.state === 'suspended') ctx.resume();
    const t0 = ctx.currentTime;

    if (rating === 'HIT') {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = 'sine';
      o.frequency.setValueAtTime(110, t0);
      o.frequency.exponentialRampToValueAtTime(55, t0 + 0.12);
      g.gain.setValueAtTime(0.28, t0);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.18);
      o.start(t0); o.stop(t0 + 0.22);

    } else if (rating === 'GOOD') {
      // "thud" suave: sine 200Hz→80Hz en 80ms + ruido blanco 40ms
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = 'sine';
      o.frequency.setValueAtTime(200, t0);
      o.frequency.exponentialRampToValueAtTime(80, t0 + 0.08);
      g.gain.setValueAtTime(SFX_MAX_GAIN, t0);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.08);
      o.start(t0); o.stop(t0 + 0.1);
      playNoiseBurst(ctx, t0, 0.04, 0.15);

    } else if (rating === 'GREAT') {
      // "crack" medio: sawtooth 300Hz→100Hz en 120ms + ruido 60ms
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(300, t0);
      o.frequency.exponentialRampToValueAtTime(100, t0 + 0.12);
      g.gain.setValueAtTime(SFX_MAX_GAIN, t0);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.12);
      o.start(t0); o.stop(t0 + 0.14);
      playNoiseBurst(ctx, t0, 0.06, 0.2);

    } else if (rating === 'EXCELLENT') {
      // "POW" arcade: square 400Hz→150Hz en 150ms + tono ascendente 500Hz→800Hz en 80ms
      const o1 = ctx.createOscillator(), g1 = ctx.createGain();
      o1.connect(g1); g1.connect(ctx.destination);
      o1.type = 'square';
      o1.frequency.setValueAtTime(400, t0);
      o1.frequency.exponentialRampToValueAtTime(150, t0 + 0.15);
      g1.gain.setValueAtTime(SFX_MAX_GAIN, t0);
      g1.gain.exponentialRampToValueAtTime(0.001, t0 + 0.15);
      o1.start(t0); o1.stop(t0 + 0.17);

      const o2 = ctx.createOscillator(), g2 = ctx.createGain();
      o2.connect(g2); g2.connect(ctx.destination);
      o2.type = 'sine';
      o2.frequency.setValueAtTime(500, t0);
      o2.frequency.linearRampToValueAtTime(800, t0 + 0.08);
      g2.gain.setValueAtTime(0.25, t0);
      g2.gain.exponentialRampToValueAtTime(0.001, t0 + 0.08);
      o2.start(t0); o2.stop(t0 + 0.1);

    } else if (rating === 'MASTER') {
      // "BOOM" pesado: capa1 sawtooth 500Hz→100Hz/200ms con distorsión suave
      // + capa2 tono 800Hz→1200Hz/100ms con delay de 50ms
      const shaper = ctx.createWaveShaper();
      shaper.curve = makeDistortionCurve(18);
      shaper.oversample = '2x';
      const o1 = ctx.createOscillator(), g1 = ctx.createGain();
      o1.connect(shaper); shaper.connect(g1); g1.connect(ctx.destination);
      o1.type = 'sawtooth';
      o1.frequency.setValueAtTime(500, t0);
      o1.frequency.exponentialRampToValueAtTime(100, t0 + 0.2);
      g1.gain.setValueAtTime(SFX_MAX_GAIN, t0);
      g1.gain.exponentialRampToValueAtTime(0.001, t0 + 0.2);
      o1.start(t0); o1.stop(t0 + 0.22);

      const t1 = t0 + 0.05;
      const o2 = ctx.createOscillator(), g2 = ctx.createGain();
      o2.connect(g2); g2.connect(ctx.destination);
      o2.type = 'sine';
      o2.frequency.setValueAtTime(800, t1);
      o2.frequency.linearRampToValueAtTime(1200, t1 + 0.1);
      g2.gain.setValueAtTime(0.3, t1);
      g2.gain.exponentialRampToValueAtTime(0.001, t1 + 0.1);
      o2.start(t1); o2.stop(t1 + 0.12);

    } else if (rating === 'SIFU LEVEL') {
      // Explosión sónica: ruido 200ms + tono épico 200→600→200Hz/300ms, ambos con reverb sintético
      const reverb = createSyntheticReverb(ctx, 0.08, 0.3);

      playNoiseBurst(ctx, t0, 0.2, SFX_MAX_GAIN, reverb);

      const o = ctx.createOscillator(), g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination); g.connect(reverb);
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(200, t0);
      o.frequency.linearRampToValueAtTime(600, t0 + 0.15);
      o.frequency.linearRampToValueAtTime(200, t0 + 0.3);
      g.gain.setValueAtTime(SFX_MAX_GAIN, t0);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.3);
      o.start(t0); o.stop(t0 + 0.32);
    }
  } catch(e) {}
}

function playComboStreakSound(milestone) {
  if (!APP.soundEnabled) return;
  try {
    const ctx = getAudioCtx();
    if (ctx.state === 'suspended') ctx.resume();
    const t0 = ctx.currentTime;

    const ding = (t, fFrom, fTo, dur) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = 'sine';
      o.frequency.setValueAtTime(fFrom, t);
      o.frequency.linearRampToValueAtTime(fTo, t + dur);
      g.gain.setValueAtTime(SFX_MAX_GAIN, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o.start(t); o.stop(t + dur + 0.02);
    };

    if (milestone === 5) {
      // "ding" metálico ascendente, como moneda de videojuego
      ding(t0, 1000, 1500, 0.15);

    } else if (milestone === 10) {
      // doble "ding-ding", frecuencia más alta
      ding(t0, 1200, 1800, 0.15);
      ding(t0 + 0.1, 1200, 1800, 0.15);

    } else if (milestone === 20) {
      // triple impacto épico en cascada
      [800, 1000, 1200].forEach((f, i) => {
        const ti = t0 + i * 0.08;
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.type = 'square';
        o.frequency.value = f;
        g.gain.setValueAtTime(SFX_MAX_GAIN, ti);
        g.gain.exponentialRampToValueAtTime(0.001, ti + 0.12);
        o.start(ti); o.stop(ti + 0.14);
      });

    } else if (milestone === 50) {
      // fanfarria de 4 notas (Do Mi Sol Do agudo) con reverb
      const reverb = createSyntheticReverb(ctx, 0.09, 0.25);
      [523, 659, 784, 1047].forEach((f, i) => {
        const ti = t0 + i * 0.06;
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination); g.connect(reverb);
        o.type = 'sine';
        o.frequency.value = f;
        g.gain.setValueAtTime(SFX_MAX_GAIN, ti);
        g.gain.exponentialRampToValueAtTime(0.001, ti + 0.08);
        o.start(ti); o.stop(ti + 0.1);
      });
    }
  } catch(e) {}
}

function playLevelUpSound() {
  if (!APP.soundEnabled) return;
  try {
    const ctx = getAudioCtx();
    if (ctx.state === 'suspended') ctx.resume();
    const t0 = ctx.currentTime;
    // Sol Si Re Sol — ascendentes con overlap suave (sensación de logro claro)
    [392, 494, 587, 784].forEach((f, i) => {
      const ti = t0 + i * 0.1;
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = 'sine';
      o.frequency.value = f;
      g.gain.setValueAtTime(SFX_MAX_GAIN, ti);
      g.gain.exponentialRampToValueAtTime(0.001, ti + 0.15);
      o.start(ti); o.stop(ti + 0.17);
    });
  } catch(e) {}
}

function playRecordSound() {
  if (!APP.soundEnabled) return;
  try {
    const ctx = getAudioCtx();
    if (ctx.state === 'suspended') ctx.resume();
    const t0 = ctx.currentTime;
    // Do Mi Sol Do(alto) Mi(alto) — volumen crescendo, última nota con sustain largo
    const notes = [523, 659, 784, 1047, 1319];
    notes.forEach((f, i) => {
      const ti     = t0 + i * 0.11;
      const isLast = i === notes.length - 1;
      const dur    = isLast ? 0.4 : 0.1;
      const peak   = Math.min(SFX_MAX_GAIN, 0.2 + i * 0.04);
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = 'sine';
      o.frequency.value = f;
      g.gain.setValueAtTime(peak, ti);
      g.gain.exponentialRampToValueAtTime(0.001, ti + dur);
      o.start(ti); o.stop(ti + dur + 0.02);
    });
  } catch(e) {}
}

// ═══════════════════════════════════════════════════
// AAA — EPIC MESSAGE POOL
// ═══════════════════════════════════════════════════
const EPIC_MSGS = {
  record:   ['🎯 NUEVO RÉCORD PERSONAL', '⚡ RÉCORD ROTO', '🏆 HISTORIA ESCRITA', '💎 NIVEL DIOS'],
  best:     ['💥 MEJOR GOLPE HOY', '🔥 TÚ EN LLAMAS', '💪 ASÍ SE HACE'],
  streak10: ['🔥 10 GOLPES SEGUIDOS', '⚡ IMPARABLE', '🔥 EN RACHA'],
  streak20: ['💀 20 SIN PARAR', '🌪️ TORBELLINO', '⚡ MODO BESTIA'],
  streak25: ['🏆 25 HIT STREAK', '🔥 LEYENDA EN CURSO', '💥 ¡INCREÍBLE!'],
  streak50: ['🔥 50 HIT STREAK!', '💀 MODO SIFU', '🏆 COMBO ÉPICO'],
};
function pickEpicMsg(type) {
  const pool = EPIC_MSGS[type] || ['🔥'];
  return pool[Math.floor(Math.random() * pool.length)];
}

// ═══════════════════════════════════════════════════
// AAA — GLOBAL HIT FEEDBACK (all modes)
// ═══════════════════════════════════════════════════
function triggerHitFeedback(gForce) {
  const tier = getGlobalTier(gForce);
  boostBgSpeed();

  // Dar XP solo durante una sesión activa
  if (APP.sessionActive) {
    const prev = loadGamificationXP();
    const next = prev + tier.xp;
    saveGamificationXP(next);
    if (APP.gamification) APP.gamification.totalXP = next;
    updateGlobalXPBar();
  }

  // Visual popup
  showGlobalHitPopup(tier.label, tier.xp, tier.color);

  // Sound
  playHitRatingSound(tier.label);

  // Effects
  spawnHitParticles(tier.color);
  applyTierScreenEffect(tier);
  if (tier.label === 'SIFU LEVEL') {
    triggerBodyFlash('red');
    triggerBodyShake();
  } else if (gForce >= 5) {
    triggerBodyFlash('white');
  }

  return tier;
}

function showGlobalHitPopup(label, xp, color) {
  const container = document.getElementById('hit-popup-container');
  if (!container) return;

  // Keep max 3 visible — remove oldest if full
  while (container.children.length >= 3) {
    const oldest = container.firstChild;
    if (oldest._removeTimer) clearTimeout(oldest._removeTimer);
    oldest.remove();
  }

  const card = document.createElement('div');
  const slug = label.toLowerCase().replace(/\s+/g, '-');
  card.className = `hit-popup-card hit-popup-${slug}`;
  card.style.setProperty('--tc', color);

  const lbl = document.createElement('div');
  lbl.className = 'hit-popup-label';
  lbl.textContent = label;

  const xpEl = document.createElement('div');
  xpEl.className = 'hit-popup-xp';
  xpEl.textContent = '+' + xp + ' XP';

  card.appendChild(lbl);
  card.appendChild(xpEl);
  container.appendChild(card);

  // Animate out at 1.0s, remove at 1.25s
  card._removeTimer = trackedTimeout(() => {
    card.classList.add('hit-popup-out');
    trackedTimeout(() => card.remove(), 250);
  }, 1000);
}

function updateGlobalXPBar() {
  const overlay = document.getElementById('global-xp-overlay');
  if (!overlay || overlay.classList.contains('hidden')) return;
  const xp  = loadGamificationXP();
  const inf = getXPLevelInfo(xp);
  const lbl = document.getElementById('global-xp-level-lbl');
  const fill = document.getElementById('global-xp-fill');
  if (lbl) lbl.textContent = inf.current.name.toUpperCase();
  if (fill) {
    const pct = inf.next
      ? Math.min(100, Math.round(((xp - inf.current.min) / (inf.next.min - inf.current.min)) * 100))
      : 100;
    fill.style.width = pct + '%';
  }
}

function showGlobalXPOverlay() {
  const el = document.getElementById('global-xp-overlay');
  if (el) { el.classList.remove('hidden'); updateGlobalXPBar(); }
}

function hideGlobalXPOverlay() {
  const el = document.getElementById('global-xp-overlay');
  if (el) el.classList.add('hidden');
}

function spawnHitParticles(color, originX, originY) {
  const canvas = document.getElementById('hit-particle-canvas');
  if (!canvas) return;
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  const ctx = canvas.getContext('2d');
  const cx  = originX != null ? originX : canvas.width / 2;
  const cy  = originY != null ? originY : canvas.height * 0.42;
  const count = _fxParticleCount(10);
  const particles = Array.from({ length: count }, () => {
    const angle = Math.random() * Math.PI * 2;
    const speed = 3 + Math.random() * 5;
    return { x: cx, y: cy, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 2,
             alpha: 1, r: 3 + Math.random() * 4 };
  });
  let frame = 0;
  const MAX = 28;
  const tick = () => {
    if (_fxPaused) { trackedRAF(tick); return; }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      p.x     += p.vx;
      p.y     += p.vy;
      p.vy    += 0.25;
      p.alpha -= 1 / MAX;
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle   = color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    if (++frame < MAX) trackedRAF(tick);
    else ctx.clearRect(0, 0, canvas.width, canvas.height);
  };
  trackedRAF(tick);
}

function triggerBodyFlash(type) {
  const cls = type === 'red' ? 'screen-flash-red-body' : 'screen-flash-body';
  document.body.classList.remove(cls);
  void document.body.offsetWidth;
  document.body.classList.add(cls);
  trackedTimeout(() => document.body.classList.remove(cls), 400);
}

function triggerBodyShake() {
  document.body.classList.remove('screen-shake-body');
  void document.body.offsetWidth;
  document.body.classList.add('screen-shake-body');
  trackedTimeout(() => document.body.classList.remove('screen-shake-body'), 350);
}

// ═══════════════════════════════════════════════════
// AAA — HOME PARTICLE CANVAS (formas mixtas + KI waves + rayos)
// ═══════════════════════════════════════════════════
let _homeParticleRAF = null;
let _homeLightningTimer = null;
let _bgSpeedBoost = 1;

// Pausa global de FX cuando la pestaña/app está en background
let _fxPaused = typeof document !== 'undefined' && document.hidden;
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => { _fxPaused = document.hidden; });
}

function _fxParticleCount(base) {
  return (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2)
    ? Math.round(base * 0.5) : base;
}

// Sube el "ritmo" del fondo con cada golpe; decae solo hacia 1x
function boostBgSpeed() {
  _bgSpeedBoost = Math.min(3, _bgSpeedBoost + 0.35);
}

const _HOME_SHAPES = [
  { shape: 'star',   color: '#FFD300' },
  { shape: 'circle', color: '#00D4FF' },
  { shape: 'diamond',color: '#FF1A1A' },
  { shape: 'spark',  color: '#FFFFFF' },
];

function _drawFxShape(ctx, shape, x, y, r, color, alpha) {
  ctx.globalAlpha = Math.max(0, alpha);
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  switch (shape) {
    case 'circle':
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      break;
    case 'diamond':
      ctx.beginPath();
      ctx.moveTo(x, y - r); ctx.lineTo(x + r, y); ctx.lineTo(x, y + r); ctx.lineTo(x - r, y);
      ctx.closePath(); ctx.fill();
      break;
    case 'spark':
      ctx.lineWidth = Math.max(1, r * 0.4);
      ctx.beginPath();
      ctx.moveTo(x - r, y); ctx.lineTo(x + r, y);
      ctx.moveTo(x, y - r); ctx.lineTo(x, y + r);
      ctx.stroke();
      break;
    case 'star':
    default:
      ctx.beginPath();
      ctx.moveTo(x, y - r);
      ctx.lineTo(x + r * 0.28, y - r * 0.28);
      ctx.lineTo(x + r, y);
      ctx.lineTo(x + r * 0.28, y + r * 0.28);
      ctx.lineTo(x, y + r);
      ctx.lineTo(x - r * 0.28, y + r * 0.28);
      ctx.lineTo(x - r, y);
      ctx.lineTo(x - r * 0.28, y - r * 0.28);
      ctx.closePath();
      ctx.fill();
      break;
  }
}

function startBgParticles() {
  if (_homeParticleRAF) return;
  const canvas = document.getElementById('bg-particles');
  if (!canvas) return;
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  const particles = Array.from({ length: _fxParticleCount(30) }, () => {
    const def = _HOME_SHAPES[Math.floor(Math.random() * _HOME_SHAPES.length)];
    return {
      x: Math.random() * W, y: Math.random() * H,
      vy: -(0.25 + Math.random() * 0.5),
      vx: (Math.random() - 0.5) * 0.2,
      r: 2 + Math.random() * 4,
      shape: def.shape, color: def.color,
      alpha: 0.3, alphaDir: Math.random() < 0.5 ? 1 : -1,
      blinkSpeed: 0.004 + Math.random() * 0.006,
    };
  });

  const kiWaves = Array.from({ length: 3 }, (_, i) => ({ radius: i * 90, delay: i * 60 }));
  const KI_MAX_R = () => Math.max(W, H) * 0.6;

  let lightning = null; // { x1,y1,x2,y2, life }
  const scheduleLightning = () => {
    _homeLightningTimer = trackedTimeout(() => {
      lightning = { x1: Math.random() * W, y1: 0, x2: Math.random() * W, y2: H, life: 6 };
      scheduleLightning();
    }, 4000 + Math.random() * 2000);
  };
  scheduleLightning();

  let frame = 0;
  const tick = () => {
    if (_fxPaused) { _homeParticleRAF = trackedRAF(tick); return; }
    frame++;
    ctx.clearRect(0, 0, W, H);

    // decaimiento del boost de velocidad hacia 1x
    _bgSpeedBoost += (1 - _bgSpeedBoost) * 0.02;

    // ondas de energía KI
    ctx.save();
    ctx.strokeStyle = 'rgba(255,211,0,0.05)';
    kiWaves.forEach(w => {
      if (frame < w.delay) return;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(W / 2, H * 0.42, w.radius, 0, Math.PI * 2);
      ctx.stroke();
      w.radius += 0.6;
      if (w.radius > KI_MAX_R()) w.radius = 0;
    });
    ctx.restore();

    // relámpago ocasional
    if (lightning) {
      ctx.save();
      ctx.strokeStyle = 'rgba(0,212,255,0.15)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(lightning.x1, lightning.y1);
      ctx.lineTo(lightning.x2, lightning.y2);
      ctx.stroke();
      ctx.restore();
      lightning.life--;
      if (lightning.life <= 0) lightning = null;
    }

    // partículas mixtas
    particles.forEach(p => {
      p.x += p.vx * _bgSpeedBoost;
      p.y += p.vy * _bgSpeedBoost;
      if (p.y < -12) { p.y = H + 12; p.x = Math.random() * W; }
      if (p.x < -12) p.x = W + 12; if (p.x > W + 12) p.x = -12;

      p.alpha += p.blinkSpeed * p.alphaDir;
      if (p.alpha >= 0.8) { p.alpha = 0.8; p.alphaDir = -1; }
      if (p.alpha <= 0.3) { p.alpha = 0.3; p.alphaDir = 1; }

      _drawFxShape(ctx, p.shape, p.x, p.y, p.r, p.color, p.alpha);
    });
    ctx.globalAlpha = 1;
    _homeParticleRAF = trackedRAF(tick);
  };
  tick();
}

function stopBgParticles() {
  if (_homeParticleRAF) { cancelAnimationFrame(_homeParticleRAF); _homeParticleRAF = null; }
  if (_homeLightningTimer) { clearTimeout(_homeLightningTimer); _homeLightningTimer = null; }
  const canvas = document.getElementById('bg-particles');
  if (canvas) { const c = canvas.getContext('2d'); c.clearRect(0, 0, canvas.width, canvas.height); }
}

// Backwards-compat aliases (called from many stop/start paths)
function startHomeParticles() { startBgParticles(); }
function stopHomeParticles()  { stopBgParticles(); }

// ═══════════════════════════════════════════════════
// REACTION SCREEN BG PARTICLES
// ═══════════════════════════════════════════════════
let _reactionBgRAF = null;

function startReactionBgParticles() {
  if (_reactionBgRAF) return;
  const canvas = document.getElementById('reaction-bg-canvas');
  if (!canvas) return;
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const particles = Array.from({ length: _fxParticleCount(28) }, () => ({
    x: Math.random() * W,
    y: H + Math.random() * H,
    vx: (Math.random() - 0.5) * 0.5,
    vy: -(0.4 + Math.random() * 0.7),
    r: 1.5 + Math.random() * 2.5,
    alpha: 0.1 + Math.random() * 0.25,
    color: '#FFD300',
  }));
  const tick = () => {
    if (_fxPaused) { _reactionBgRAF = trackedRAF(tick); return; }
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => {
      p.x += p.vx * _bgSpeedBoost; p.y += p.vy * _bgSpeedBoost;
      if (p.y < -10) { p.y = H + 10; p.x = Math.random() * W; }
      if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle   = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1;
    _reactionBgRAF = trackedRAF(tick);
  };
  tick();
}

function stopReactionBgParticles() {
  if (_reactionBgRAF) { cancelAnimationFrame(_reactionBgRAF); _reactionBgRAF = null; }
  const canvas = document.getElementById('reaction-bg-canvas');
  if (canvas) { const c = canvas.getContext('2d'); c.clearRect(0, 0, canvas.width, canvas.height); }
}

// ═══════════════════════════════════════════════════
// AAA — RESULT SPLASH SCREEN
// ═══════════════════════════════════════════════════
function getSessionGrade(punches) {
  if (!punches.length) return { grade: 'C', label: 'PRACTICANTE' };
  const tiers = punches.map(p => getGlobalTier(p.g).label);
  const top   = tiers.filter(l => ['EXCELLENT','MASTER','SIFU LEVEL'].includes(l)).length;
  const good  = tiers.filter(l => ['GREAT','EXCELLENT','MASTER','SIFU LEVEL'].includes(l)).length;
  const pct   = ratio => ratio / punches.length;
  if (pct(top)  >= 0.3) return { grade: 'S', label: 'LEGENDARIO' };
  if (pct(good) >= 0.3) return { grade: 'A', label: 'MAESTRO' };
  if (pct(tiers.filter(l => ['GOOD','GREAT','EXCELLENT','MASTER','SIFU LEVEL'].includes(l)).length) >= 0.4) return { grade: 'B', label: 'GUERRERO' };
  return { grade: 'C', label: 'PRACTICANTE' };
}

function showResultSplash(punches, sessionXP, onDone) {
  const { grade, label } = getSessionGrade(punches || []);
  const gradeEl = document.getElementById('result-grade');
  const labelEl = document.getElementById('result-grade-label');
  const xpEl    = document.getElementById('result-xp-count');
  if (!gradeEl) { onDone && onDone(); return; }

  gradeEl.textContent = grade;
  gradeEl.className   = 'result-grade rg-' + grade;
  labelEl.textContent = label;
  xpEl.textContent    = '+0 XP';

  // Populate stats row
  const pArr = punches || [];
  const bestEl  = document.getElementById('result-stat-best');
  const comboEl = document.getElementById('result-stat-combo');
  const timeEl  = document.getElementById('result-stat-time');
  if (bestEl) {
    const bestG = pArr.length ? Math.max(...pArr.map(p => p.g || 0)) : 0;
    bestEl.textContent = bestG ? bestG.toFixed(1) + 'G' : '—';
  }
  if (comboEl) {
    const bestCombo = APP.gamification ? (APP.gamification.bestStreak || 0) : 0;
    comboEl.textContent = bestCombo ? 'x' + bestCombo : 'x0';
  }
  if (timeEl) {
    const elapsed = APP.session.startTime ? Math.round((Date.now() - APP.session.startTime) / 1000) : 0;
    const m = Math.floor(elapsed / 60), s = elapsed % 60;
    timeEl.textContent = elapsed ? m + ':' + String(s).padStart(2,'0') : '—';
  }

  showScreen('screen-result-splash', true);

  // XP count-up animation
  const targetXP = sessionXP || 0;
  if (targetXP > 0) {
    let cur = 0;
    const step = Math.max(1, Math.round(targetXP / 30));
    const iv = trackedInterval(() => {
      cur = Math.min(cur + step, targetXP);
      xpEl.textContent = '+' + cur + ' XP';
      if (cur >= targetXP) clearInterval(iv);
    }, 50);
  }

  // Grade sound
  playGradeSound(grade);

  // Confetti for S and A
  if (grade === 'S' || grade === 'A') spawnSplashConfetti();

  trackedTimeout(() => {
    onDone && onDone();
  }, 2200);
}

function playGradeSound(grade) {
  if (!APP.soundEnabled) return;
  try {
    const ctx = getAudioCtx();
    if (ctx.state === 'suspended') ctx.resume();
    const t0 = ctx.currentTime;
    const freqSets = {
      S: [523, 659, 784, 1047],
      A: [440, 554, 659, 880],
      B: [330, 415, 494, 659],
      C: [262, 330, 392],
    };
    (freqSets[grade] || freqSets.C).forEach((f, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = 'sine'; o.frequency.value = f;
      const ti = t0 + i * 0.12;
      g.gain.setValueAtTime(0.22, ti);
      g.gain.exponentialRampToValueAtTime(0.001, ti + 0.3);
      o.start(ti); o.stop(ti + 0.35);
    });
  } catch(e) {}
}

function spawnSplashConfetti() {
  const canvas = document.getElementById('result-confetti-canvas');
  if (!canvas) return;
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  const ctx  = canvas.getContext('2d');
  const cols  = ['#FFD300','#00D4FF','#FF1A1A','#00FF66','#FFFFFF'];
  const pieces = Array.from({ length: 60 }, () => ({
    x: Math.random() * canvas.width, y: -10,
    vx: (Math.random() - 0.5) * 4,
    vy: 2 + Math.random() * 4,
    w: 6 + Math.random() * 8, h: 4 + Math.random() * 4,
    rot: Math.random() * Math.PI,
    vrot: (Math.random() - 0.5) * 0.15,
    color: cols[Math.floor(Math.random() * cols.length)],
    alpha: 1,
  }));
  let frame = 0;
  const tick = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pieces.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.rot += p.vrot;
      if (frame > 80) p.alpha -= 0.015;
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    });
    ctx.globalAlpha = 1;
    if (++frame < 120) trackedRAF(tick);
    else ctx.clearRect(0, 0, canvas.width, canvas.height);
  };
  trackedRAF(tick);
}

// ═══════════════════════════════════════════════════
// NAVEGACIÓN
// ═══════════════════════════════════════════════════
function showScreen(id, instant) {
  const current = document.querySelector('.screen:not(.hidden)');
  const doSwitch = () => {
    document.querySelectorAll('.screen').forEach(s => {
      s.classList.toggle('hidden', s.id !== id);
    });
  };
  if (instant || !current || current.id === id) {
    doSwitch();
    return;
  }
  // Portal de energía: la pantalla entrante hace zoom-in por encima
  // mientras la saliente hace zoom-out + fade, en simultáneo (0.3s).
  const next = document.getElementById(id);
  if (next) next.style.zIndex = '2';
  doSwitch();
  trackedTimeout(() => { if (next) next.style.zIndex = ''; }, 320);
}

function setNavActive(id) {
  document.querySelectorAll('#bottom-nav .nav-btn').forEach(b => b.classList.remove('active'));
  const btn = document.getElementById(id);
  if (btn) btn.classList.add('active');
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

const SFX_MAX_GAIN = 0.4;

// ─── Helpers compartidos por los sonidos arcade ───────
function createNoiseBuffer(ctx, durationSec) {
  const size   = Math.max(1, Math.floor(ctx.sampleRate * durationSec));
  const buffer = ctx.createBuffer(1, size, ctx.sampleRate);
  const data   = buffer.getChannelData(0);
  for (let i = 0; i < size; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

function playNoiseBurst(ctx, t0, durationSec, peakGain, extraOutput) {
  const src  = ctx.createBufferSource();
  src.buffer = createNoiseBuffer(ctx, durationSec);
  const gain = ctx.createGain();
  src.connect(gain);
  gain.connect(ctx.destination);
  if (extraOutput) gain.connect(extraOutput);
  gain.gain.setValueAtTime(Math.min(peakGain, SFX_MAX_GAIN), t0);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + durationSec);
  src.start(t0);
  src.stop(t0 + durationSec + 0.02);
  return gain;
}

function makeDistortionCurve(amount) {
  const n = 44100;
  const curve = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / n - 1;
    curve[i] = ((3 + amount) * x * (20 * Math.PI / 180)) / (Math.PI + amount * Math.abs(x));
  }
  return curve;
}

// DelayNode + feedback como reverb sintético simple, compartible por varios osciladores
function createSyntheticReverb(ctx, delayTimeSec, feedbackAmount) {
  const delay = ctx.createDelay();
  delay.delayTime.value = delayTimeSec;
  const feedback = ctx.createGain();
  feedback.gain.value = feedbackAmount;
  delay.connect(feedback);
  feedback.connect(delay);
  delay.connect(ctx.destination);
  return delay;
}

function boxingBellStrike(ctx, t0, decay) {
  const osc  = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = 'sine';
  osc.frequency.setValueAtTime(800, t0);
  gain.gain.setValueAtTime(SFX_MAX_GAIN, t0);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + decay);
  osc.start(t0);
  osc.stop(t0 + decay + 0.05);
}

function playBell(type = 'round') {
  if (!APP.soundEnabled) return;
  try {
    const ctx = getAudioCtx();
    if (ctx.state === 'suspended') ctx.resume();
    if (type === 'round') {
      boxingBellStrike(ctx, ctx.currentTime, 1.2);
    } else {
      const t0 = ctx.currentTime;
      boxingBellStrike(ctx, t0, 0.6);
      boxingBellStrike(ctx, t0 + 0.25, 0.6);
      boxingBellStrike(ctx, t0 + 0.5, 0.6);
    }
  } catch (e) {}
}

function playBeep(freq = 1200, dur = 0.08) {
  if (!APP.soundEnabled) return;
  try {
    const ctx  = getAudioCtx();
    if (ctx.state === 'suspended') ctx.resume();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(SFX_MAX_GAIN, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.start();
    osc.stop(ctx.currentTime + dur + 0.01);
  } catch (e) {}
}

// HIT — señal de reacción/combo: alerta eléctrica, inmediata e inconfundible
function playHitAlertSound() {
  if (!APP.soundEnabled) return;
  try {
    const ctx = getAudioCtx();
    if (ctx.state === 'suspended') ctx.resume();
    const t0 = ctx.currentTime;
    for (let i = 0; i < 3; i++) {
      const ti = t0 + i * 0.05;
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = 'square';
      o.frequency.value = 600;
      g.gain.setValueAtTime(SFX_MAX_GAIN, ti);
      g.gain.exponentialRampToValueAtTime(0.001, ti + 0.04);
      o.start(ti); o.stop(ti + 0.045);
    }
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
  saveSessionToSupabase(session);
}

async function saveSessionToSupabase(session) {
  if (!supabaseClient || !APP.profile || !APP.profile.supabase_id) return;
  try {
    await supabaseClient.from('sesiones').insert({
      usuario_id:       APP.profile.supabase_id,
      fecha:            new Date(session.ts).toISOString(),
      modo:             session.mode,
      rounds:           session.rounds,
      total_golpes:     session.totalPunches,
      potencia_media:   session.avgPower,
      potencia_max:     session.maxPower,
      velocidad_media:  session.avgSpeed,
      velocidad_max:    session.maxSpeed,
      reaccion_media:   session.avgReaction,
      reaccion_min:     session.bestReaction,
      calorias:         session.calories,
      duracion_segundos: session.durationSec
    });
  } catch (e) {}
}

async function loadProfileFromSupabase(userId) {
  try {
    const { data } = await supabaseClient
      .from('usuarios').select('*').eq('id', userId).single();
    if (data) {
      saveProfile({
        name:        data.nombre,
        weight:      data.peso,
        age:         data.edad,
        sex:         data.sexo,
        sport:       data.deporte,
        supabase_id: userId
      });
    }
  } catch (e) {}
}

async function supabaseSignOut() {
  try {
    if (supabaseClient) await supabaseClient.auth.signOut();
  } catch (e) {}
  const lang = localStorage.getItem('fkf_lang');
  localStorage.clear();
  if (lang) localStorage.setItem('fkf_lang', lang);
  window.location.reload();
}

// ═══════════════════════════════════════════════════
// ACELERÓMETRO
// ═══════════════════════════════════════════════════
function setupAccelerometer() {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  if (typeof DeviceMotionEvent === 'undefined') return;
  if (isIOS && typeof DeviceMotionEvent.requestPermission === 'function') {
    document.getElementById('ios-permission-block').classList.remove('hidden');
    return;
  }
  activateAccelerometer();
}

function activateAccelerometer() {
  if (APP.accel.listening) return;
  window.addEventListener('devicemotion', onDeviceMotion, { passive: true });
  APP.accel.available = true;
  APP.accel.permitted = true;
  APP.accel.listening = true;
}

function deactivateAccelerometer() {
  if (!APP.accel.listening) return;
  window.removeEventListener('devicemotion', onDeviceMotion);
  APP.accel.listening  = false;
  APP.accel._peakStart = 0;
  APP.accel._peakMax   = 0;
}

function onDeviceMotion(e) {
  if (!window.IMPACT_SESSION_ACTIVE) return;
  if (!APP.sessionActive) return;
  const acc = e.accelerationIncludingGravity;
  if (!acc) return;
  const raw    = Math.sqrt(acc.x * acc.x + acc.y * acc.y + acc.z * acc.z);
  const gForce = raw / 9.81;
  const now    = Date.now();

  if (now - APP.accel._logAt > 100) {
    APP.accel._logAt = now;
    console.log(`[FKF] accel g=${gForce.toFixed(2)}G thr=${APP.accel.THRESHOLD}G`);
  }

  const effectiveThreshold = Math.max(APP.accel.THRESHOLD, APP.accel.ABSOLUTE_MIN_G);
  const cooldown = (APP.mode === 'combo' && APP.comboConfig.submode === 'combo' && APP.combo.state === 'active')
    ? APP.accel.COMBO_HIT_COOLDOWN
    : APP.accel.COOLDOWN;

  if (gForce >= effectiveThreshold) {
    // Filtro sostenido: el pico debe mantenerse al menos 50ms antes de registrar
    if (!APP.accel._peakStart) {
      APP.accel._peakStart = now;
      APP.accel._peakMax   = gForce;
    } else {
      if (gForce > APP.accel._peakMax) APP.accel._peakMax = gForce;
      if ((now - APP.accel._peakStart) >= 50 && (now - APP.accel.lastPunchAt) > cooldown) {
        const peakG = APP.accel._peakMax;
        APP.accel.lastPunchAt = now;
        APP.accel._peakStart  = 0;
        APP.accel._peakMax    = 0;
        console.log(`[FKF] PUNCH g=${peakG.toFixed(2)}G mode=${APP.mode}`);
        registerPunch(peakG, peakG * 9.81);
      }
    }
  } else {
    // Cayó por debajo del umbral: resetear la ventana de pico
    APP.accel._peakStart = 0;
    APP.accel._peakMax   = 0;
  }
}

function registerPunch(gForce, speed) {
  if (!APP.sessionActive) return;
  const punch = { g: gForce, speed: speed || gForce * 9.81, time: Date.now() };

  if (!APP.hitWindowActive) {
    handleEarlyPunch();
    return;
  }

  vibrate([15]);
  const tier = triggerHitFeedback(gForce);
  if (APP.mode === 'training')                              handleTrainingPunch(punch, tier);
  else if (APP.comboConfig.submode === 'simple')            handleReactionPunch(punch);
  else if (APP.comboConfig.submode === 'colors')            handleColorsPunch(punch);
  else                                                      handleComboPunch(punch);
}

// ═══════════════════════════════════════════════════
// PENALIZACIÓN — golpe fuera de la ventana válida
// ═══════════════════════════════════════════════════
function applyXPPenalty(amount) {
  const prevTotal = loadGamificationXP();
  saveGamificationXP(prevTotal - amount);
  if (APP.gamification) {
    APP.gamification.totalXP = loadGamificationXP();
    APP.gamification.sessionXP -= amount;
  }
  updateGlobalXPBar();
}

function playPenaltySound() {
  if (!APP.soundEnabled) return;
  try {
    const ctx = getAudioCtx();
    if (ctx.state === 'suspended') ctx.resume();
    const t0 = ctx.currentTime;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(400, t0);
    o.frequency.exponentialRampToValueAtTime(100, t0 + 0.2);
    g.gain.setValueAtTime(0.3, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.2);
    o.start(t0); o.stop(t0 + 0.22);
  } catch (e) {}
}

// Abandonar la sesión con el round en curso (no en descanso): -500 XP y
// pantalla de penalización 2s antes de volver al home.
function showAbandonPenaltyScreen() {
  applyXPPenalty(500);
  showScreen('screen-abandon-penalty');
  playPenaltySound();
  trackedTimeout(() => {
    showScreen('screen-menu');
    initMenuScreen();
  }, 2000);
}

function showPenaltyPopup(message, color, xpText) {
  const container = document.getElementById('hit-popup-container');
  if (!container) return;

  while (container.children.length >= 3) {
    const oldest = container.firstChild;
    if (oldest._removeTimer) clearTimeout(oldest._removeTimer);
    oldest.remove();
  }

  const card = document.createElement('div');
  card.className = 'hit-popup-card hit-popup-penalty';
  card.style.setProperty('--tc', color);

  const lbl = document.createElement('div');
  lbl.className = 'hit-popup-label';
  lbl.textContent = message;
  card.appendChild(lbl);

  if (xpText) {
    const xpEl = document.createElement('div');
    xpEl.className = 'hit-popup-xp';
    xpEl.textContent = xpText;
    card.appendChild(xpEl);
  }

  container.appendChild(card);
  card._removeTimer = trackedTimeout(() => {
    card.classList.add('hit-popup-out');
    trackedTimeout(() => card.remove(), 250);
  }, 1000);
}

function handleEarlyPunch() {
  if (APP.mode === 'training') {
    showPenaltyPopup('¡DESCANSA!', '#00D4FF', null);
    return;
  }
  if (APP.comboConfig.submode === 'combo') {
    applyXPPenalty(5);
    showPenaltyPopup('¡ESPERA LA SEÑAL!', '#FF8C00', '-5 XP');
    playPenaltySound();
    vibrate([100, 50, 100]);
    return;
  }
  // Reacción y Colores comparten el mismo sistema de penalización
  applyXPPenalty(5);
  showPenaltyPopup('¡DEMASIADO PRONTO!', '#FF1A1A', '-5 XP');
  playPenaltySound();
  vibrate([100, 50, 100]);
  APP.round.misses++;
  if (APP.comboConfig.submode === 'simple') updateReactionMetricsUI();
}

// ═══════════════════════════════════════════════════
// CALORÍAS
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
    ctx.fillStyle = colorFn ? colorFn(v) : '#FFE000';
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
  if (g > 3) return '#FFE000';
  return '#555555';
}

function flashEl(el) {
  el.classList.remove('flash');
  void el.offsetWidth;
  el.classList.add('flash');
  trackedTimeout(() => el.classList.remove('flash'), 280);
}

// ═══════════════════════════════════════════════════
// PANTALLA: IDIOMA
// ═══════════════════════════════════════════════════
function initLangScreen() {
  document.querySelectorAll('#screen-lang .btn-lang').forEach(btn => {
    btn.onclick = () => {
      APP.lang = btn.dataset.lang;
      localStorage.setItem('fkf_lang', APP.lang);
      applyLanguage();
      afterLangSelected();
    };
  });
}

async function afterLangSelected() {
  if (supabaseClient) {
    try {
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (session) {
        await loadProfileFromSupabase(session.user.id);
        showScreen('screen-menu');
        initMenuScreen();
        return;
      }
    } catch (e) {}
    showScreen('screen-welcome');
    initWelcomeScreen();
  } else {
    if (loadProfile()) {
      showScreen('screen-menu');
      initMenuScreen();
    } else {
      showScreen('screen-profile');
      initProfileScreen();
    }
  }
}

// ═══════════════════════════════════════════════════
// PANTALLA: PERFIL
// ═══════════════════════════════════════════════════
function renderProfileAvatar() {
  const circle   = document.getElementById('profile-avatar-circle');
  const section  = document.getElementById('profile-avatar-section');
  const badgeEl  = document.getElementById('profile-level-badge');
  const barEl    = document.getElementById('profile-level-bar');
  const pointsEl = document.getElementById('profile-level-points');
  if (!circle) return;

  // Avatar: foto guardada o iniciales
  const savedPhoto = localStorage.getItem('fkf_avatar');
  circle.innerHTML = '';
  if (savedPhoto) {
    const img = document.createElement('img');
    img.src = savedPhoto;
    circle.appendChild(img);
  } else {
    const name = APP.profile ? (APP.profile.name || '') : '';
    const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';
    const span = document.createElement('span');
    span.className = 'profile-avatar-initials';
    span.textContent = initials;
    circle.appendChild(span);
  }

  // Nivel
  const sessions = JSON.parse(localStorage.getItem('fkf_sessions') || '[]');
  const { score, level, nextLevel } = getRankLevel(sessions);
  if (badgeEl)  badgeEl.textContent  = level.name;
  if (barEl) {
    if (nextLevel) {
      const range = nextLevel.min - level.min;
      const pct   = Math.min(100, Math.round(((score - level.min) / range) * 100));
      barEl.style.width = pct + '%';
    } else {
      barEl.style.width = '100%';
    }
  }
  if (pointsEl) {
    pointsEl.textContent = nextLevel
      ? score + ' / ' + nextLevel.min + ' pts'
      : score + ' pts · NIVEL MÁXIMO';
  }
}

function initProfileScreen(fromNav) {
  const topbar   = document.getElementById('profile-topbar');
  const logoEl   = document.querySelector('.profile-setup-logo');
  const section  = document.getElementById('profile-avatar-section');

  topbar.classList.toggle('hidden', !fromNav);
  if (fromNav) {
    document.getElementById('btn-profile-back').onclick = () => {
      showScreen('screen-menu');
      setNavActive('nav-home');
      initMenuScreen();
    };
    // Con perfil existente: mostrar avatar, ocultar logo de setup
    if (APP.profile) {
      if (section) section.classList.remove('setup-mode');
      if (logoEl)  logoEl.classList.add('hidden-nav');
    }
  } else {
    // Primera configuración: ocultar sección de avatar
    if (section) section.classList.add('setup-mode');
    if (logoEl)  logoEl.classList.remove('hidden-nav');
  }

  renderProfileAvatar();

  // Upload de foto
  const fileInput = document.getElementById('profile-photo-input');
  if (fileInput) {
    fileInput.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        localStorage.setItem('fkf_avatar', ev.target.result);
        renderProfileAvatar();
      };
      reader.readAsDataURL(file);
    };
  }

  const sexBtns = document.querySelectorAll('#screen-profile .sex-btn');
  let selectedSex = APP.profile ? (APP.profile.sex || 'hombre') : 'hombre';
  if (APP.profile) {
    document.getElementById('input-name').value   = APP.profile.name   || '';
    document.getElementById('input-weight').value = APP.profile.weight || '';
    document.getElementById('input-age').value    = APP.profile.age    || '';
  }
  sexBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.sex === selectedSex);
    btn.onclick = () => {
      sexBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedSex = btn.dataset.sex;
    };
  });
  document.getElementById('btn-save-profile').onclick = () => {
    const name   = document.getElementById('input-name').value.trim();
    const weight = parseFloat(document.getElementById('input-weight').value);
    const age    = parseInt(document.getElementById('input-age').value);
    if (!name)                                { alert(t('alert_enter_name')); return; }
    if (!weight || weight < 30 || weight > 200) { alert(t('alert_weight'));   return; }
    if (!age || age < 10 || age > 100)         { alert(t('alert_age'));       return; }
    saveProfile({ name, weight, age, sex: selectedSex });
    showScreen('screen-menu');
    setNavActive('nav-home');
    initMenuScreen();
  };
}

// ═══════════════════════════════════════════════════
// PANTALLAS AUTH
// ═══════════════════════════════════════════════════
function initWelcomeScreen() {
  document.getElementById('btn-go-register').onclick = () => {
    showScreen('screen-register');
    initRegisterScreen();
  };
  document.getElementById('btn-go-login').onclick = () => {
    showScreen('screen-login');
    initLoginScreen();
  };
}

function initRegisterScreen() {
  const sexH = document.getElementById('reg-sex-hombre');
  const sexM = document.getElementById('reg-sex-mujer');
  sexH.onclick = () => { sexH.classList.add('active');    sexM.classList.remove('active'); };
  sexM.onclick = () => { sexM.classList.add('active');    sexH.classList.remove('active'); };

  document.getElementById('btn-reg-to-login').onclick = () => {
    showScreen('screen-login');
    initLoginScreen();
  };

  document.getElementById('btn-register').onclick = async () => {
    const nombre   = document.getElementById('reg-name').value.trim();
    const email    = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;
    const peso     = parseFloat(document.getElementById('reg-weight').value);
    const edad     = parseInt(document.getElementById('reg-age').value);
    const sexo     = sexH.classList.contains('active') ? 'hombre' : 'mujer';
    const deporte  = document.getElementById('reg-sport').value.trim();
    const errEl    = document.getElementById('reg-error');
    const btn      = document.getElementById('btn-register');

    errEl.textContent = '';
    if (!nombre)                           { errEl.textContent = 'Ingresa tu nombre completo'; return; }
    if (!email || !email.includes('@'))    { errEl.textContent = 'Email inválido'; return; }
    if (password.length < 6)              { errEl.textContent = 'La contraseña debe tener al menos 6 caracteres'; return; }
    if (!peso || peso < 30 || peso > 200) { errEl.textContent = 'Peso inválido (30-200 kg)'; return; }
    if (!edad || edad < 10 || edad > 100) { errEl.textContent = 'Edad inválida (10-100)'; return; }

    btn.disabled = true;
    btn.textContent = 'CREANDO...';

    try {
      const redirectUrl = window.location.hostname === 'localhost'
        ? 'http://localhost:3000'
        : 'https://fastkungfu.vercel.app';
      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: redirectUrl },
      });
      if (error) throw error;
      if (!data.user) throw new Error('No se pudo crear el usuario');

      const userId = data.user.id;
      await supabaseClient.from('usuarios').insert({
        id:      userId,
        nombre,
        email,
        peso,
        edad,
        sexo,
        deporte: deporte || null
      });

      saveProfile({ name: nombre, weight: peso, age: edad, sex: sexo, sport: deporte, supabase_id: userId });

      if (data.session) {
        showScreen('screen-menu');
        initMenuScreen();
      } else {
        errEl.style.color = '#00FF66';
        errEl.textContent = 'Revisa tu email para confirmar tu cuenta';
        btn.disabled = false;
        btn.textContent = 'CREAR CUENTA';
      }
    } catch (e) {
      errEl.style.color = '#FF4444';
      errEl.textContent = e.message || 'Error al crear la cuenta';
      btn.disabled = false;
      btn.textContent = 'CREAR CUENTA';
    }
  };
}

function initLoginScreen() {
  const errEl = document.getElementById('login-error');

  document.getElementById('btn-login-to-reg').onclick = () => {
    showScreen('screen-register');
    initRegisterScreen();
  };

  document.getElementById('btn-forgot-pass').onclick = async () => {
    const email = document.getElementById('login-email').value.trim();
    if (!email) { errEl.style.color = '#FF4444'; errEl.textContent = 'Ingresa tu email primero'; return; }
    try {
      await supabaseClient.auth.resetPasswordForEmail(email, { redirectTo: 'https://fastkungfu.vercel.app' });
      errEl.style.color = '#00FF66';
      errEl.textContent = 'Email enviado. Revisa tu bandeja de entrada.';
    } catch (e) {
      errEl.style.color = '#FF4444';
      errEl.textContent = e.message || 'Error al enviar el email';
    }
  };

  document.getElementById('btn-login').onclick = async () => {
    const email    = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const btn      = document.getElementById('btn-login');

    errEl.style.color = '#FF4444';
    errEl.textContent = '';
    if (!email)    { errEl.textContent = 'Ingresa tu email'; return; }
    if (!password) { errEl.textContent = 'Ingresa tu contraseña'; return; }

    btn.disabled = true;
    btn.textContent = 'ENTRANDO...';

    try {
      const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
      if (error) throw error;
      await loadProfileFromSupabase(data.user.id);
      showScreen('screen-menu');
      initMenuScreen();
    } catch (e) {
      errEl.textContent = e.message || 'Email o contraseña incorrectos';
      btn.disabled = false;
      btn.textContent = 'ENTRAR';
    }
  };
}

// ═══════════════════════════════════════════════════
// HOME — avatar + nivel en header
// ═══════════════════════════════════════════════════
function updateHomeHeader() {
  const circle = document.getElementById('home-avatar-circle');
  const levelEl = document.getElementById('home-avatar-level');
  if (!circle) return;

  circle.innerHTML = '';
  const savedPhoto = localStorage.getItem('fkf_avatar');
  if (savedPhoto) {
    const img = document.createElement('img');
    img.src = savedPhoto;
    circle.appendChild(img);
  } else {
    const name = APP.profile ? (APP.profile.name || '') : '';
    const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';
    const span = document.createElement('span');
    span.className = 'home-avatar-initials';
    span.textContent = initials;
    circle.appendChild(span);
  }

  if (levelEl) {
    const sessions = JSON.parse(localStorage.getItem('fkf_sessions') || '[]');
    levelEl.textContent = getRankLevel(sessions).level.name.toUpperCase();
  }
}

// ═══════════════════════════════════════════════════
// PANTALLA: MENÚ
// ═══════════════════════════════════════════════════
function initMenuScreen() {
  // Al volver al home: sonidos, timers, acelerómetro y animaciones de la
  // sesión anterior (si la había) quedan completamente detenidos primero.
  stopEverything();

  startHomeParticles();

  const measureBtn = document.getElementById('btn-training-mode');
  if (measureBtn) {
    measureBtn.onclick = e => {
      addRipple(e, measureBtn);
      const r = measureBtn.getBoundingClientRect();
      spawnHitParticles('#FFD300', r.left + r.width / 2, r.top + r.height / 2);
      stopBgParticles();
      showCalibrationScreen('screen-menu');
    };
  }
  document.getElementById('btn-combo-mode') && (document.getElementById('btn-combo-mode').onclick = () => {
    APP.mode = 'combo';
    stopHomeParticles();
    showScreen('screen-config');
    initConfigScreen();
  });

  // Entrada escalonada de las tarjetas de modos
  document.querySelectorAll('.home-modes-col .hmc').forEach((card, i) => {
    card.classList.remove('hmc-enter');
    void card.offsetWidth;
    card.style.animationDelay = (i * 100) + 'ms';
    card.classList.add('hmc-enter');
  });

  // Card tap animations: ripple + flash + partículas + vibración
  document.querySelectorAll('.hmc').forEach(card => {
    const onTap = e => {
      const now = Date.now();
      if (card._lastTapFx && now - card._lastTapFx < 300) return;
      card._lastTapFx = now;

      navigator.vibrate && navigator.vibrate(30);
      card.classList.add('tapped');
      trackedTimeout(() => card.classList.remove('tapped'), 200);

      const touch = e.touches && e.touches[0];
      const r = card.getBoundingClientRect();
      const x = touch ? touch.clientX : (e.clientX || r.left + r.width / 2);
      const y = touch ? touch.clientY : (e.clientY || r.top + r.height / 2);
      addRipple({ clientX: x, clientY: y }, card);
      spawnDomParticles(x, y, hmcColor(card), 8);
    };
    card.addEventListener('touchstart', onTap, { passive: true });
    card.addEventListener('click', onTap);
  });

  // Calibration hint link (Bug 2)
  const calibHint = document.getElementById('home-calib-hint');
  if (calibHint) calibHint.onclick = () => { stopHomeParticles(); showCalibrationScreen('screen-menu'); };

  document.getElementById('btn-settings').onclick = toggleSettingsDropdown;
  document.getElementById('btn-header-avatar').onclick = () => {
    showScreen('screen-profile');
    setNavActive('nav-profile');
    initProfileScreen(true);
  };
  document.getElementById('btn-calibrate-menu').onclick = () => showCalibrationScreen('screen-menu');
  document.getElementById('btn-help').onclick = () => { showScreen('screen-help'); initHelpScreen(); };
  document.getElementById('nav-home').onclick = () => {
    showScreen('screen-menu');
    setNavActive('nav-home');
    initMenuScreen();
  };
  document.getElementById('nav-history-btn').onclick = () => {
    showScreen('screen-history');
    setNavActive('nav-history-btn');
    initHistoryScreen('historial');
  };
  document.getElementById('nav-ranking').onclick = () => {
    showScreen('screen-history');
    setNavActive('nav-ranking');
    initHistoryScreen('ranking');
  };
  document.getElementById('nav-profile').onclick = () => {
    showScreen('screen-profile');
    setNavActive('nav-profile');
    initProfileScreen(true);
  };
  setNavActive('nav-home');
  updateHomeHeader();
}

// ═══════════════════════════════════════════════════
// PANTALLA: CONFIGURACIÓN
// ═══════════════════════════════════════════════════
function initConfigScreen() {
  const isTraining      = APP.mode === 'training';
  const isSimple        = APP.mode === 'combo' && APP.comboConfig.submode === 'simple';
  const isComboSubmode  = APP.mode === 'combo' && APP.comboConfig.submode === 'combo';
  const isColorsSubmode = APP.mode === 'combo' && APP.comboConfig.submode === 'colors';

  // Mode-specific color, active background and title
  let modeColor, modeBg, modeTitle;
  if (isTraining)      { modeColor = '#FFD300'; modeBg = '#151100'; modeTitle = t('card_power')    || 'POTENCIA'; }
  else if (isSimple)   { modeColor = '#00D4FF'; modeBg = '#001520'; modeTitle = t('card_reaction') || 'REACCIÓN'; }
  else if (isComboSubmode)  { modeColor = '#FF0000'; modeBg = '#150000'; modeTitle = t('card_combo')    || 'COMBO';    }
  else if (isColorsSubmode) { modeColor = '#9B59B6'; modeBg = '#0D0010'; modeTitle = t('card_colors')   || 'COLORES';  }

  document.getElementById('config-mode-title').textContent = modeTitle;
  document.getElementById('btn-start-session').textContent = t('config_start');

  const screenEl = document.getElementById('screen-config');
  screenEl.style.setProperty('--mode-color', modeColor);
  screenEl.style.setProperty('--mode-bg',    modeBg);

  // Mode-specific background image + tinted overlay
  const modeCardImages = {
    training: './assets/card-potencia3.png',
    simple:   './assets/Card-reacci%C3%B3n3.png',
    combo:    './assets/card-combo4.png',
    colors:   './assets/card-colores5.jpg',
  };
  const modePositions = {
    training: 'center',
    simple:   'center',
    combo:    'center',
    colors:   'center right',
  };
  const modeOverlays = {
    training: 'linear-gradient(rgba(5,3,0,0.80), rgba(5,3,0,0.80))',
    simple:   'linear-gradient(rgba(0,5,20,0.80), rgba(0,5,20,0.80))',
    combo:    'linear-gradient(rgba(20,0,0,0.80), rgba(20,0,0,0.80))',
    colors:   'linear-gradient(rgba(5,0,20,0.80), rgba(5,0,20,0.80))',
  };
  const modeShadows = {
    training: '0 0 20px rgba(255,211,0,0.5)',
    simple:   '0 0 20px rgba(0,212,255,0.5)',
    combo:    '0 0 20px rgba(255,0,0,0.5)',
    colors:   '0 0 20px rgba(155,89,182,0.5)',
  };
  const modeSummaryBgs = {
    training: 'rgba(20,15,0,0.72)',
    simple:   'rgba(0,10,30,0.72)',
    combo:    'rgba(20,0,0,0.72)',
    colors:   'rgba(15,0,22,0.72)',
  };
  const modeSummaryBorders = {
    training: 'rgba(255,211,0,0.28)',
    simple:   'rgba(0,212,255,0.28)',
    combo:    'rgba(255,0,0,0.28)',
    colors:   'rgba(155,89,182,0.28)',
  };
  const modeKey = isTraining ? 'training' : isSimple ? 'simple' : isComboSubmode ? 'combo' : 'colors';
  screenEl.style.setProperty('--config-bg-image', `url('${modeCardImages[modeKey]}')`);
  screenEl.style.setProperty('--config-overlay',  modeOverlays[modeKey]);
  screenEl.style.setProperty('--config-bg-position', modePositions[modeKey]);
  screenEl.style.setProperty('--mode-shadow',         modeShadows[modeKey]);
  screenEl.style.setProperty('--mode-summary-bg',     modeSummaryBgs[modeKey]);
  screenEl.style.setProperty('--mode-summary-border', modeSummaryBorders[modeKey]);

  // Submode selector hidden — mode is pre-selected from home card
  document.getElementById('reaction-submode-block').classList.add('hidden');
  document.getElementById('combo-config-extras').classList.toggle('hidden', !isComboSubmode);
  document.getElementById('color-mode-config').classList.toggle('hidden', !isColorsSubmode);

  // Calibration notice
  const hasCalib = !!localStorage.getItem('fkf_calibration');
  const calibNotice = document.getElementById('calib-notice');
  if (calibNotice) calibNotice.classList.toggle('hidden', hasCalib);
  const calibFromConfig = document.getElementById('btn-calibrate-from-config');
  if (calibFromConfig) calibFromConfig.onclick = () => showCalibrationScreen('screen-config');

  const rInput    = document.getElementById('input-rounds');
  const rdInput   = document.getElementById('input-round-duration');
  const restInput = document.getElementById('input-rest-duration');

  rInput.value    = APP.config.rounds;
  rdInput.value   = APP.config.roundDuration;
  restInput.value = APP.config.restDuration;

  updateConfigSummary();

  // Slider fill color
  [rInput, rdInput, restInput].forEach(sl => updateSliderFill(sl, modeColor));

  rInput.oninput    = () => { APP.config.rounds        = parseInt(rInput.value);    updateConfigSummary(); updateSliderFill(rInput, modeColor); };
  rdInput.oninput   = () => { APP.config.roundDuration = parseInt(rdInput.value);   updateConfigSummary(); updateSliderFill(rdInput, modeColor); };
  restInput.oninput = () => { APP.config.restDuration  = parseInt(restInput.value); updateConfigSummary(); updateSliderFill(restInput, modeColor); };

  document.getElementById('btn-config-back').onclick = () => showScreen('screen-menu');

  if (isComboSubmode)  initComboConfigExtras();
  if (isColorsSubmode) initColorModeConfig();

  // iOS accelerometer
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  if (isIOS && typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
    document.getElementById('ios-permission-block').classList.remove('hidden');
    document.getElementById('btn-ios-permission').onclick = async () => {
      try {
        const perm = await DeviceMotionEvent.requestPermission();
        if (perm === 'granted') {
          APP.accel.available = true;
          APP.accel.permitted = true;
          document.getElementById('permission-status').textContent = t('ios_granted');
          document.getElementById('btn-ios-permission').disabled = true;
        } else {
          document.getElementById('permission-status').textContent = t('ios_denied');
        }
      } catch (e) {}
    };
  }

  document.getElementById('btn-start-session').onclick = startSession;
}

function initReactionSubmodeBlock() {
  const btnSimple = document.getElementById('btn-submode-simple');
  const btnCombo  = document.getElementById('btn-submode-combo');
  const btnColors = document.getElementById('btn-submode-colors');

  const setActive = (submode) => {
    btnSimple.classList.toggle('active', submode === 'simple');
    btnCombo.classList.toggle('active',  submode === 'combo');
    btnColors.classList.toggle('active', submode === 'colors');
    document.getElementById('combo-config-extras').classList.toggle('hidden', submode !== 'combo');
    document.getElementById('color-mode-config').classList.toggle('hidden', submode !== 'colors');
    if (submode === 'combo')   initComboConfigExtras();
    if (submode === 'colors')  initColorModeConfig();
  };

  setActive(APP.comboConfig.submode);

  btnSimple.onclick = () => { APP.comboConfig.submode = 'simple'; setActive('simple'); };
  btnCombo.onclick  = () => { APP.comboConfig.submode = 'combo';  setActive('combo');  };
  btnColors.onclick = () => { APP.comboConfig.submode = 'colors'; setActive('colors'); };
}

function initComboConfigExtras() {
  // Stepper hits
  const valEl = document.getElementById('val-combo-hits');
  valEl.textContent = APP.comboConfig.hits;

  document.getElementById('btn-combo-hits-minus').onclick = () => {
    if (APP.comboConfig.hits > 2) { APP.comboConfig.hits--; valEl.textContent = APP.comboConfig.hits; }
  };
  document.getElementById('btn-combo-hits-plus').onclick = () => {
    if (APP.comboConfig.hits < 6) { APP.comboConfig.hits++; valEl.textContent = APP.comboConfig.hits; }
  };

  // Duration pills
  document.querySelectorAll('#combo-duration-pills .option-pill').forEach(btn => {
    const val = parseFloat(btn.dataset.val);
    btn.classList.toggle('selected', val === APP.comboConfig.maxDuration);
    btn.onclick = () => {
      APP.comboConfig.maxDuration = val;
      document.querySelectorAll('#combo-duration-pills .option-pill').forEach(b =>
        b.classList.toggle('selected', b === btn));
    };
  });

  // Pause pills
  document.querySelectorAll('#combo-pause-pills .option-pill').forEach(btn => {
    const val = parseFloat(btn.dataset.val);
    btn.classList.toggle('selected', val === APP.comboConfig.pauseBetween);
    btn.onclick = () => {
      APP.comboConfig.pauseBetween = val;
      document.querySelectorAll('#combo-pause-pills .option-pill').forEach(b =>
        b.classList.toggle('selected', b === btn));
    };
  });

  // Mode toggle
  const btnFixed  = document.getElementById('btn-combo-fixed');
  const btnRandom = document.getElementById('btn-combo-random');
  btnFixed.classList.toggle('active',  APP.comboConfig.mode === 'fixed');
  btnRandom.classList.toggle('active', APP.comboConfig.mode === 'random');
  btnFixed.onclick = () => {
    APP.comboConfig.mode = 'fixed';
    btnFixed.classList.add('active');
    btnRandom.classList.remove('active');
  };
  btnRandom.onclick = () => {
    APP.comboConfig.mode = 'random';
    btnRandom.classList.add('active');
    btnFixed.classList.remove('active');
  };
}

function updateSliderFill(input, color) {
  const min = parseFloat(input.min) || 0;
  const max = parseFloat(input.max) || 100;
  const pct = ((parseFloat(input.value) - min) / (max - min)) * 100;
  input.style.background = `linear-gradient(to right, ${color} 0%, ${color} ${pct}%, rgba(255,255,255,0.1) ${pct}%, rgba(255,255,255,0.1) 100%)`;
}

function updateConfigSummary() {
  const r   = APP.config.rounds;
  const rd  = APP.config.roundDuration;
  const rst = APP.config.restDuration;
  const total = Math.round(r * rd + ((r - 1) * rst / 60));

  document.getElementById('val-rounds').textContent         = t('val_rounds',        { n: r });
  document.getElementById('val-round-duration').textContent = t('val_round_duration', { n: rd });
  document.getElementById('val-rest-duration').textContent  = t('val_rest_duration',  { n: rst });

  const summaryEl = document.getElementById('config-summary');
  if (summaryEl) {
    summaryEl.innerHTML = `
      <div class="csm-grid">
        <div class="csm-cell"><span class="csm-val">${r}</span><span class="csm-lbl">ROUNDS</span></div>
        <div class="csm-cell"><span class="csm-val">${rd}</span><span class="csm-lbl">MIN/RD</span></div>
        <div class="csm-cell"><span class="csm-val">${rst}s</span><span class="csm-lbl">DESCANSO</span></div>
        <div class="csm-cell"><span class="csm-val">${total}</span><span class="csm-lbl">MIN TOTAL</span></div>
      </div>`;
  }
}

// ═══════════════════════════════════════════════════
// SESIÓN
// ═══════════════════════════════════════════════════
function startSession() {
  // Limpieza total antes de arrancar: ningún sonido/timer/animación de un
  // modo anterior debe seguir vivo cuando empieza uno nuevo.
  stopEverything();

  APP.session = {
    startTime: Date.now(),
    currentRound: 0,
    allPunches: [],
    roundData: [],
    reactionTimes: [],
    hits: 0,
    misses: 0,
  };
  APP.combo.results = [];
  APP.sessionSaved  = false;
  APP.sessionActive = true;
  APP.hitWindowActive = false;
  acquireWakeLock();
  activateAccelerometer();
  initGamificationSession();
  stopHomeParticles();
  showGlobalXPOverlay();
  startRound(1);
}

// ═══════════════════════════════════════════════════
// ROUNDS
// ═══════════════════════════════════════════════════
function startRound(roundNum) {
  window.IMPACT_SESSION_ACTIVE = true;
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

  if (APP.mode === 'training') {
    APP.hitWindowActive = true;
    showTrainingScreen(roundNum);
    startRoundTimer(() => endRound());
  } else if (APP.comboConfig.submode === 'simple') {
    showReactionScreen(roundNum);
    startRoundTimer(() => endRound());
    startReactionWait();
  } else if (APP.comboConfig.submode === 'colors') {
    showColorsScreen(roundNum);
    startRoundTimer(() => endRound());
    startColorsWait();
  } else {
    showComboScreen(roundNum);
    startRoundTimer(() => endRound());
    startComboWait();
  }
}

function startRoundTimer(onEnd) {
  APP.round.timerInterval = trackedInterval(() => {
    APP.round.secondsLeft--;
    if (APP.mode === 'training')                     updateTrainingTimer();
    else if (APP.comboConfig.submode === 'simple')   updateReactionTimer();
    else if (APP.comboConfig.submode === 'colors')   updateColorsTimer();
    else                                             updateComboTimer();
    if (APP.round.secondsLeft <= 0) {
      clearInterval(APP.round.timerInterval);
      onEnd();
    }
  }, 1000);
}

function endRound() {
  window.IMPACT_SESSION_ACTIVE = false;
  clearInterval(APP.round.timerInterval);
  APP.hitWindowActive = false;
  if (APP.mode === 'combo') {
    if (APP.comboConfig.submode === 'simple') {
      stopReactionCycle();
      stopReactionBgParticles();
    } else if (APP.comboConfig.submode === 'colors') {
      stopColorsCycle();
    } else {
      stopComboCycle();
    }
  }

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
// MODO ENTRENAMIENTO
// ═══════════════════════════════════════════════════
function showTrainingScreen(roundNum) {
  showScreen('screen-training');
  document.getElementById('training-round-indicator').textContent =
    t('round_indicator', { n: roundNum, total: APP.config.rounds });
  updateTrainingTimer();
  resetTrainingMetrics();
  drawTrainingChart();

  document.getElementById('btn-mute-training').onclick = toggleSound;
  updateMuteButtons();
  document.getElementById('btn-training-stop').onclick = () => {
    if (confirm(t('confirm_stop'))) {
      const wasRoundActive = window.IMPACT_SESSION_ACTIVE;
      APP.sessionActive = false;
      stopEverything();
      releaseWakeLock();
      hideGlobalXPOverlay();
      resetStreakCounter();
      if (wasRoundActive) {
        showAbandonPenaltyScreen();
      } else {
        showScreen('screen-menu');
        startHomeParticles();
      }
    }
  };

  // Init gamification UI
  updateXPBar();
  const _hitRatingEl = document.getElementById('gam-hit-rating');
  if (_hitRatingEl) _hitRatingEl.classList.remove('gam-hit-anim');
  const _streakEl = document.getElementById('gam-streak-badge');
  if (_streakEl) _streakEl.classList.add('hidden');
  const _milestoneEl = document.getElementById('gam-milestone');
  if (_milestoneEl) _milestoneEl.classList.add('hidden');
}

function updateTrainingTimer() {
  const el = document.getElementById('training-timer');
  const s  = APP.round.secondsLeft;
  el.textContent = fmtTime(s);
  el.classList.remove('warning', 'danger');
  if (s <= 10)      el.classList.add('danger');
  else if (s <= 30) el.classList.add('warning');
}

function resetTrainingMetrics() {
  document.getElementById('training-punch-count').textContent = '0';
  document.getElementById('training-speed').textContent       = '0.0';
  document.getElementById('training-power').textContent       = '0.0G';
  document.getElementById('training-best').textContent        = '0.0G';
}

function handleTrainingPunch(punch, tier) {
  APP.round.punches.push(punch);
  const countEl = document.getElementById('training-punch-count');
  countEl.textContent = APP.round.punches.length;
  flashEl(countEl);
  document.getElementById('training-speed').textContent = punch.speed.toFixed(1);
  document.getElementById('training-power').textContent = punch.g.toFixed(1) + 'G';
  const bestG = Math.max(...APP.round.punches.map(p => p.g));
  document.getElementById('training-best').textContent  = bestG.toFixed(1) + 'G';
  drawTrainingChart();
  handleGamificationPunch(punch, tier);
}

function drawTrainingChart() {
  const canvas = document.getElementById('training-chart');
  if (!canvas) return;

  const dpr   = window.devicePixelRatio || 1;
  const cont  = canvas.parentElement;
  const cssW  = cont ? Math.max(cont.clientWidth - 24, 280) : 300;
  const cssH  = 80;

  // Explicit pixel dimensions — critical to avoid blurry/blank canvas
  canvas.width       = Math.round(cssW * dpr);
  canvas.height      = Math.round(cssH * dpr);
  canvas.style.width  = cssW + 'px';
  canvas.style.height = cssH + 'px';

  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  // Background
  ctx.fillStyle = '#1A1A1A';
  ctx.fillRect(0, 0, cssW, cssH);

  // Baseline
  ctx.fillStyle = 'rgba(0, 191, 255, 0.4)';
  ctx.fillRect(0, cssH - 2, cssW, 2);

  const last10 = APP.round.punches.slice(-10).map(p => p.g);
  while (last10.length < 10) last10.unshift(0);

  const maxG = 12;
  const bw   = cssW / 10;
  const pad  = 3;

  last10.forEach((g, i) => {
    const norm = Math.min(g / maxG, 1);
    const bh   = Math.max(norm * (cssH - 14), g > 0 ? 3 : 0);
    const x    = i * bw + pad;
    const y    = cssH - 2 - bh;
    const w    = bw - pad * 2;

    // Bar — always yellow for training chart
    ctx.fillStyle = '#FFE000';
    ctx.fillRect(x, y, w, bh);

    // Value label above bar
    if (g > 0) {
      ctx.fillStyle  = '#FFFFFF';
      ctx.font       = `bold ${Math.round(9 * dpr) / dpr}px system-ui, sans-serif`;
      ctx.textAlign  = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(g.toFixed(1), x + w / 2, y - 1);
    }
  });
}

// ═══════════════════════════════════════════════════
// MODO COMBO (REACCIÓN)
// ═══════════════════════════════════════════════════
function showComboScreen(roundNum) {
  showScreen('screen-combo');
  document.getElementById('combo-round-indicator').textContent =
    t('round_indicator', { n: roundNum, total: APP.config.rounds });
  updateComboTimer();

  document.getElementById('btn-mute-combo').onclick = toggleSound;
  updateMuteButtons();
  document.getElementById('btn-combo-stop').onclick = () => {
    if (confirm(t('confirm_stop'))) {
      const wasRoundActive = window.IMPACT_SESSION_ACTIVE;
      stopComboCycle();
      APP.sessionActive = false;
      stopEverything();
      releaseWakeLock();
      hideGlobalXPOverlay();
      if (wasRoundActive) {
        showAbandonPenaltyScreen();
      } else {
        showScreen('screen-menu');
        startHomeParticles();
      }
    }
  };
}

function updateComboTimer() {
  const el = document.getElementById('combo-session-timer');
  const s  = APP.round.secondsLeft;
  el.textContent = fmtTime(s);
}

function showComboPanel(name) {
  ['wait', 'signal', 'active', 'result'].forEach(p => {
    document.getElementById('combo-panel-' + p).classList.toggle('hidden', p !== name);
  });
}

function getComboTarget() {
  if (APP.comboConfig.mode === 'fixed') return APP.comboConfig.hits;
  return 2 + Math.floor(Math.random() * Math.max(1, APP.comboConfig.hits - 1));
}

// ─── ESPERA: antes de la señal ───────────────────
function startComboWait() {
  if (APP.round.secondsLeft <= 0) return;

  const target  = getComboTarget();
  APP.combo.targetHits  = target;
  APP.combo.currentHits = 0;
  APP.combo.reactionMs  = null;
  APP.combo.state       = 'wait';
  APP.hitWindowActive   = false;

  document.getElementById('wait-hits-text').textContent =
    target + (APP.lang === 'de' ? ' SCHLÄGE' : APP.lang === 'en' ? ' HITS' : APP.lang === 'pt' ? ' GOLPES' : ' GOLPES');
  document.getElementById('wait-max-time').textContent =
    APP.comboConfig.maxDuration.toFixed(1) + 's MÁXIMO';

  showComboPanel('wait');

  const pauseMs = APP.comboConfig.pauseBetween * 1000;
  let remaining = APP.comboConfig.pauseBetween;

  clearInterval(APP.combo.waitTickInterval);
  APP.combo.waitTickInterval = trackedInterval(() => {
    remaining -= 0.1;
    document.getElementById('wait-countdown-text').textContent =
      'Siguiente señal en ' + Math.max(0, remaining).toFixed(1) + 's';
    if (remaining <= 0) clearInterval(APP.combo.waitTickInterval);
  }, 100);

  document.getElementById('wait-countdown-text').textContent =
    'Siguiente señal en ' + remaining.toFixed(1) + 's';

  APP.combo.waitTimeout = trackedTimeout(() => {
    clearInterval(APP.combo.waitTickInterval);
    if (APP.round.secondsLeft > 0) showComboSignal();
  }, pauseMs);
}

// ─── SEÑAL: fondo rojo, texto HIT ─────────────────
function showComboSignal() {
  APP.combo.state    = 'signal';
  APP.hitWindowActive = true;
  APP.combo.signalAt = Date.now();
  APP.combo.currentHits = 0;

  document.getElementById('signal-counter').textContent =
    '0/' + APP.combo.targetHits;
  showComboPanel('signal');
  vibrate([30]);
  playHitAlertSound();

  // If no first hit within 3s → fail (no reaction)
  APP.combo.signalTimeout = trackedTimeout(() => {
    if (APP.combo.state === 'signal') {
      endCombo(false, true); // failed, no hits
    }
  }, 3000);
}

// ─── ACTIVO: cuenta de golpes ─────────────────────
function handleComboPunch(punch) {
  if (APP.combo.state === 'signal') {
    clearTimeout(APP.combo.signalTimeout);
    const hitAt           = Date.now();
    APP.combo.reactionMs  = hitAt - APP.combo.signalAt;
    APP.combo.activeAt    = hitAt;
    APP.combo.lastHitAt   = hitAt;
    APP.combo.currentHits = 1;
    APP.combo.state       = 'active';
    APP.round.punches.push(punch);
    APP.round.reactionTimes.push(APP.combo.reactionMs);

    showComboPanel('active');
    document.getElementById('active-reaction').textContent =
      (APP.combo.reactionMs / 1000).toFixed(2) + 's';
    document.getElementById('active-power').textContent   = punch.g.toFixed(1) + 'G';
    document.getElementById('active-speed').textContent   = punch.speed.toFixed(1);
    updateActiveCounter();
    startComboTimer();
    return;
  }

  if (APP.combo.state === 'active') {
    APP.combo.currentHits++;
    APP.combo.lastHitAt = Date.now();   // capture exact moment of each hit
    APP.round.punches.push(punch);

    const pw = parseFloat(document.getElementById('active-power').textContent) || 0;
    if (punch.g > pw) document.getElementById('active-power').textContent = punch.g.toFixed(1) + 'G';
    document.getElementById('active-speed').textContent = punch.speed.toFixed(1);

    updateActiveCounter();

    if (APP.combo.currentHits >= APP.combo.targetHits) {
      endCombo(true, false);
    }
  }
}

function updateActiveCounter() {
  const el  = document.getElementById('active-counter');
  const pct = (APP.combo.currentHits / APP.combo.targetHits) * 100;
  el.textContent = APP.combo.currentHits + '/' + APP.combo.targetHits;
  document.getElementById('active-progress-bar').style.width = pct + '%';
  flashEl(el);
}

function startComboTimer() {
  const maxMs = APP.comboConfig.maxDuration * 1000;
  const timeEl = document.getElementById('active-time-remaining');

  clearInterval(APP.combo.tickInterval);
  APP.combo.tickInterval = trackedInterval(() => {
    if (APP.combo.state !== 'active') { clearInterval(APP.combo.tickInterval); return; }
    const elapsed   = Date.now() - APP.combo.activeAt;
    const remaining = Math.max(0, maxMs - elapsed);
    timeEl.textContent = (remaining / 1000).toFixed(1) + 's';
    timeEl.classList.toggle('urgent', remaining < 600);
    if (remaining <= 0) {
      clearInterval(APP.combo.tickInterval);
      if (APP.combo.state === 'active') endCombo(false, false);
    }
  }, 50);

  APP.combo.expireTimeout = trackedTimeout(() => {
    if (APP.combo.state === 'active') endCombo(false, false);
  }, maxMs + 50);
}

// ─── RESULTADO ────────────────────────────────────
function endCombo(ok, noHits) {
  clearTimeout(APP.combo.signalTimeout);
  clearTimeout(APP.combo.expireTimeout);
  clearInterval(APP.combo.tickInterval);
  clearInterval(APP.combo.waitTickInterval);

  APP.combo.state = 'result';
  APP.hitWindowActive = false;

  // For completed combos use exact last-hit timestamp; for timeouts use now
  const endAt    = (ok && APP.combo.lastHitAt) ? APP.combo.lastHitAt : Date.now();
  const duration = APP.combo.activeAt ? ((endAt - APP.combo.activeAt) / 1000) : 0;

  APP.combo.results.push({
    ok, hits: APP.combo.currentHits, target: APP.combo.targetHits,
    reaction: APP.combo.reactionMs, duration,
  });

  if (ok) APP.round.hits++;
  else    APP.round.misses++;

  const verdictEl = document.getElementById('result-verdict');
  verdictEl.textContent = ok ? 'OK' : 'FALLO';
  verdictEl.className   = 'result-verdict ' + (ok ? 'ok' : 'fail');

  const why = noHits ? ' SIN REACCIÓN' : (ok ? ' COMPLETADO' : ' INCOMPLETO');
  document.getElementById('result-count').textContent =
    APP.combo.currentHits + '/' + APP.combo.targetHits + why;

  document.getElementById('result-reaction').textContent =
    APP.combo.reactionMs ? (APP.combo.reactionMs / 1000).toFixed(2) + 's' : '—';
  document.getElementById('result-duration').textContent =
    duration > 0 ? duration.toFixed(2) + 's' : '—';

  showComboPanel('result');

  if (ok) {
    vibrate([20, 30, 20]);
    playComboOk();
  } else {
    vibrate([50, 30, 50]);
    playComboFail();
  }

  if (APP.round.secondsLeft > 0) {
    const pauseMs = APP.comboConfig.pauseBetween * 1000;
    document.getElementById('result-next-label').textContent =
      'Siguiente señal en ' + APP.comboConfig.pauseBetween.toFixed(1) + 's';

    const progressEl = document.getElementById('result-progress-bar');
    progressEl.style.width = '0%';
    const startAt = Date.now();

    clearInterval(APP.combo.progressInterval);
    APP.combo.progressInterval = trackedInterval(() => {
      const elapsed = Date.now() - startAt;
      progressEl.style.width = Math.min(100, (elapsed / pauseMs) * 100) + '%';
      if (elapsed >= pauseMs) {
        clearInterval(APP.combo.progressInterval);
        if (APP.round.secondsLeft > 0) startComboWait();
      }
    }, 50);
  } else {
    document.getElementById('result-next-label').textContent = '';
  }
}

function stopComboCycle() {
  clearTimeout(APP.combo.waitTimeout);
  clearTimeout(APP.combo.signalTimeout);
  clearTimeout(APP.combo.expireTimeout);
  clearInterval(APP.combo.tickInterval);
  clearInterval(APP.combo.waitTickInterval);
  clearInterval(APP.combo.progressInterval);
  APP.combo.state = 'idle';
}

// ═══════════════════════════════════════════════════
// MODO REACCIÓN SIMPLE
// ═══════════════════════════════════════════════════
function showReactionScreen(roundNum) {
  showScreen('screen-reaction');
  const total = APP.config.rounds;
  document.getElementById('reaction-round-indicator').textContent =
    t('round_indicator', { n: roundNum, total });

  // Round dots
  const dotsEl = document.getElementById('reaction-round-dots');
  if (dotsEl) {
    dotsEl.innerHTML = '';
    for (let i = 1; i <= total; i++) {
      const d = document.createElement('div');
      d.className = 'rsc-dot' + (i <= roundNum ? ' rsc-dot--filled' : '');
      dotsEl.appendChild(d);
    }
  }

  updateReactionTimer();
  resetReactionMetrics();
  updateReactionFooterXP();
  startReactionBgParticles();

  document.getElementById('btn-mute-reaction').onclick = toggleSound;
  updateMuteButtons();
  document.getElementById('btn-reaction-stop').onclick = () => {
    if (confirm(t('confirm_stop'))) {
      const wasRoundActive = window.IMPACT_SESSION_ACTIVE;
      stopReactionCycle();
      APP.sessionActive = false;
      stopEverything();
      releaseWakeLock();
      hideGlobalXPOverlay();
      if (wasRoundActive) {
        showAbandonPenaltyScreen();
      } else {
        showScreen('screen-menu');
        startHomeParticles();
      }
    }
  };
}

function updateReactionTimer() {
  const el = document.getElementById('reaction-session-timer');
  el.textContent = fmtTime(APP.round.secondsLeft);
}

function resetReactionMetrics() {
  document.getElementById('reaction-last').textContent   = '—';
  document.getElementById('reaction-hits').textContent   = '0';
  document.getElementById('reaction-misses').textContent = '0';
  document.getElementById('reaction-best').textContent   = '—';
  updateReactionComboUI(0);
}

function updateReactionComboUI(streak) {
  const numEl = document.getElementById('reaction-combo');
  const barEl = document.getElementById('reaction-combo-bars');
  if (numEl) numEl.textContent = 'x' + streak;
  if (barEl) {
    const MAX = 8;
    const filled = Math.min(streak % (MAX + 1) || (streak >= MAX ? MAX : streak), MAX);
    let html = '';
    for (let i = 0; i < MAX; i++) {
      html += '<div class="rsc-bar ' + (i < filled ? 'rsc-bar-on' : 'rsc-bar-off') + '"></div>';
    }
    barEl.innerHTML = html;
  }
}

function updateReactionFooterXP() {
  const xp  = loadGamificationXP();
  const inf = getXPLevelInfo(xp);
  const lvlEl   = document.getElementById('reaction-footer-level');
  const fillEl  = document.getElementById('reaction-footer-xp-fill');
  const badgeEl = document.getElementById('reaction-footer-xp-badge');
  if (lvlEl)   lvlEl.textContent   = 'NIVEL ' + (inf.idx + 1);
  if (badgeEl) badgeEl.textContent = xp + ' XP';
  if (fillEl && inf.next) {
    const pct = Math.min(100, Math.round(((xp - inf.current.min) / (inf.next.min - inf.current.min)) * 100));
    fillEl.style.width = pct + '%';
  } else if (fillEl) {
    fillEl.style.width = '100%';
  }
}

function setReactionStimulus(state, icon, text, sub, rank, xp) {
  const circleEl = document.getElementById('reaction-circle');
  if (!circleEl) return;
  circleEl.className = 'rsc-circle ' + state;
  const checkEl = document.getElementById('reaction-circle-check');
  const rankEl  = document.getElementById('reaction-circle-rank');
  const msEl    = document.getElementById('reaction-circle-ms');
  const subEl   = document.getElementById('reaction-circle-sub');
  const xpEl    = document.getElementById('reaction-circle-xp');
  if (checkEl) checkEl.textContent = icon || '';
  if (rankEl)  rankEl.textContent  = rank || '';
  if (msEl)    msEl.textContent    = text;
  if (subEl)   subEl.textContent   = sub || '';
  if (xpEl)    xpEl.textContent    = xp || '';
}

function startReactionWait() {
  if (APP.round.secondsLeft <= 0) return;
  APP.reaction.state = 'wait';
  APP.hitWindowActive = false;
  setReactionStimulus('state-wait', '', 'PREPÁRATE', '', '', '');
  const delay = 1000 + Math.random() * 2000;
  if (delay > 500) {
    trackedTimeout(() => {
      if (APP.reaction.state === 'wait') {
        const c = getReactionCircleCenter();
        spawnConvergeParticles(c.x, c.y, 480);
      }
    }, delay - 500);
  }
  APP.reaction.waitTimeout = trackedTimeout(() => {
    if (APP.round.secondsLeft > 0) showReactionStimulus();
  }, delay);
}

function showReactionStimulus() {
  APP.reaction.state      = 'hit';
  APP.hitWindowActive     = true;
  APP.reaction.stimulusAt = Date.now();
  triggerBodyFlash('white');
  trackedTimeout(() => {
    setReactionStimulus('state-hit', '⚡', 'HIT', '', '', '');
    const c = getReactionCircleCenter();
    spawnHitParticles('#FF1A1A', c.x, c.y);
    showHitRays();
  }, 60);
  vibrate([50, 30, 50]);
  playHitAlertSound();
  APP.reaction.missTimeout = trackedTimeout(() => {
    if (APP.reaction.state === 'hit') missReaction();
  }, 1000);
}

function missReaction() {
  clearTimeout(APP.reaction.missTimeout);
  APP.reaction.state = 'miss';
  APP.hitWindowActive = false;
  APP.round.misses++;
  setReactionStimulus('state-miss', '✗', 'FALLO', '', '', '');
  vibrate([80]);
  playPenaltySound();
  updateReactionMetricsUI();
  if (APP.round.secondsLeft > 0) {
    trackedTimeout(() => startReactionWait(), 1500);
  }
}

function handleReactionPunch(punch) {
  if (APP.reaction.state !== 'hit') return;
  APP.hitWindowActive = false;
  clearTimeout(APP.reaction.missTimeout);
  const reactionMs = Date.now() - APP.reaction.stimulusAt;
  APP.reaction.state = 'result';
  APP.round.hits++;
  APP.round.punches.push(punch);
  APP.round.reactionTimes.push(reactionMs);
  const rankStr = reactionRank(reactionMs);
  const tier    = getGlobalTier(punch.g);
  setReactionStimulus(
    'state-result-ok',
    '✓',
    reactionMs + 'ms',
    '— ' + rankStr.replace(/[⚫🟤🟡⚪]/g, '').trim() + ' —',
    rankStr.replace(/[⚫🟤🟡⚪]\s*/g, '').trim(),
    '» +' + tier.xp + ' XP «'
  );
  showReactionHitOverlay(reactionMs);
  showHitRings();
  vibrate([30, 20, 50, 20, 30]);
  updateReactionMetricsUI();
  updateReactionFooterXP();
  if (APP.round.secondsLeft > 0) {
    trackedTimeout(() => startReactionWait(), 1500);
  }
}

function showReactionHitOverlay(reactionMs) {
  const overlay = document.getElementById('reaction-hit-overlay');
  if (!overlay) return;
  const rank = reactionRank(reactionMs);
  const isPerf = reactionMs < 200;
  overlay.querySelector('.rho-rank').textContent = rank.toUpperCase();
  overlay.querySelector('.rho-time').textContent = reactionMs + 'ms';
  overlay.className = 'reaction-hit-overlay rho-show' + (isPerf ? ' rho-perfect' : '');
  if (isPerf) triggerBodyFlash('white');
  trackedTimeout(() => { overlay.classList.remove('rho-show'); }, 2000);
}

function updateReactionMetricsUI() {
  const rTimes  = APP.round.reactionTimes;
  const last    = rTimes.length ? rTimes[rTimes.length - 1] : null;
  const best    = rTimes.length ? Math.min(...rTimes) : null;
  document.getElementById('reaction-last').textContent   = last !== null ? last + 'ms' : '—';
  document.getElementById('reaction-hits').textContent   = APP.round.hits;
  document.getElementById('reaction-misses').textContent = APP.round.misses;
  document.getElementById('reaction-best').textContent   = best !== null ? best + 'ms' : '—';
  const streak = APP.gamification ? APP.gamification.currentStreak : 0;
  updateReactionComboUI(streak);
}

function stopReactionCycle() {
  clearTimeout(APP.reaction.waitTimeout);
  clearTimeout(APP.reaction.missTimeout);
  APP.reaction.state = 'idle';
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
  APP.rest.interval = trackedInterval(() => {
    seconds--;
    const el = document.getElementById('rest-countdown');
    el.textContent = seconds;
    el.classList.toggle('ending', seconds <= 10);
    if (seconds > 0 && seconds <= 10) { vibrate([50]); playBeep(1000, 0.08); }
    if (seconds <= 0) { playBeep(1200, 0.4); startNext(); }
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

  if (APP.mode === 'combo') {
    const isSimple = APP.comboConfig.submode === 'simple';
    html += `
      <div class="rest-stat-item">
        <div class="rest-stat-value">${hits}</div>
        <div class="rest-stat-label">${t(isSimple ? 'hits_s' : 'hits_s')}</div>
      </div>
      <div class="rest-stat-item">
        <div class="rest-stat-value">${misses}</div>
        <div class="rest-stat-label">${t('misses_s')}</div>
      </div>`;
    if (best !== null) {
      html += `
      <div class="rest-stat-item">
        <div class="rest-stat-value">${(best / 1000).toFixed(2)}s</div>
        <div class="rest-stat-label">${t('best_reaction_s')}</div>
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
  window.IMPACT_SESSION_ACTIVE = false;
  APP.sessionActive = false;
  deactivateAccelerometer();
  hideGlobalXPOverlay();
  resetStreakCounter();

  const sess     = APP.session;
  const punches  = sess.allPunches;
  const endTime  = Date.now();
  const durMs    = endTime - sess.startTime;
  const durMin   = durMs / 60000;
  const durSec   = Math.floor(durMs / 1000);
  const total    = punches.length;
  const avgPower = total ? punches.reduce((a, p) => a + p.g, 0) / total : 0;
  const maxPower = total ? Math.max(...punches.map(p => p.g)) : 0;
  const avgSpeed = total ? punches.reduce((a, p) => a + p.speed, 0) / total : 0;
  const maxSpeed = total ? Math.max(...punches.map(p => p.speed)) : 0;
  const rTimes   = sess.reactionTimes;
  const avgReact = rTimes.length ? Math.round(rTimes.reduce((a, v) => a + v, 0) / rTimes.length) : null;
  const bestReact = rTimes.length ? Math.min(...rTimes) : null;
  const calories  = calcCalories(total, avgPower, durMin);

  const isComboSubmode  = APP.mode === 'combo' && APP.comboConfig.submode === 'combo';
  const isColorsSubmode = APP.mode === 'combo' && APP.comboConfig.submode === 'colors';
  const modeLabel = APP.mode === 'training' ? t('mode_training')
    : APP.comboConfig.submode === 'simple'  ? t('mode_reaction')
    : APP.comboConfig.submode === 'colors'  ? t('mode_colors')
    : t('mode_combo');

  document.getElementById('summary-date').textContent  = fmtDate(endTime);
  document.getElementById('summary-mode').textContent  = modeLabel;
  document.getElementById('sum-rounds').textContent    = APP.config.rounds;
  document.getElementById('sum-punches').textContent   = total;
  document.getElementById('sum-avg-power').textContent = avgPower.toFixed(1) + 'G';
  document.getElementById('sum-max-power').textContent = maxPower.toFixed(1) + 'G';
  document.getElementById('sum-avg-speed').textContent = avgSpeed.toFixed(1);
  document.getElementById('sum-max-speed').textContent = maxSpeed.toFixed(1);
  document.getElementById('sum-duration').textContent  = fmtTime(durSec);
  document.getElementById('sum-calories').textContent  = calories + ' kcal';
  document.getElementById('summary-message').textContent = getCalorieMessage(calories);

  const comboRows = ['sum-reaction-row', 'sum-best-reaction-row', 'sum-hits-row', 'sum-misses-row'];
  comboRows.forEach(id => {
    document.getElementById(id).classList.toggle('hidden', APP.mode !== 'combo');
  });
  document.getElementById('sum-combo-pct-row').classList.toggle('hidden', !isComboSubmode);
  document.getElementById('sum-best-duration-row').classList.toggle('hidden', !isComboSubmode);

  if (APP.mode === 'combo') {
    document.getElementById('sum-avg-reaction').textContent  = avgReact  !== null ? (avgReact / 1000).toFixed(2) + 's'  : '—';
    document.getElementById('sum-best-reaction').textContent = bestReact !== null ? (bestReact / 1000).toFixed(2) + 's' : '—';
    document.getElementById('sum-hits').textContent   = sess.hits;
    document.getElementById('sum-misses').textContent = sess.misses;
  }

  if (isComboSubmode) {
    const results  = APP.combo.results;
    const totalC   = results.length;
    const okC      = results.filter(r => r.ok).length;
    const comboPct = totalC > 0 ? Math.round((okC / totalC) * 100) : 0;
    const durs     = results.filter(r => r.ok && r.duration > 0).map(r => r.duration);
    const bestDur  = durs.length ? Math.min(...durs) : null;
    document.getElementById('sum-combo-pct').textContent      = comboPct + '%';
    document.getElementById('sum-best-duration').textContent  = bestDur !== null ? bestDur.toFixed(2) + 's' : '—';
  }

  document.getElementById('summary-comparison').textContent =
    buildComparison(total, avgPower, bestReact);

  // Color stats section
  const colorStatsEl = document.getElementById('sum-color-stats');
  if (colorStatsEl) colorStatsEl.remove();
  if (isColorsSubmode && APP.colorMode.results.length) {
    const colorResults = APP.colorMode.results;
    const colorDefs = [
      { id: 'yellow', hex: '#FFE000', label: APP.colorConfig.yellow || 'AMARILLO' },
      { id: 'red',    hex: '#CC0000', label: APP.colorConfig.red    || 'ROJO' },
      { id: 'blue',   hex: '#0066CC', label: APP.colorConfig.blue   || 'AZUL' },
    ];
    const rows = colorDefs.map(c => {
      const items = colorResults.filter(r => r.color === c.id);
      if (!items.length) return '';
      const avgR = Math.round(items.reduce((a, r) => a + r.reactionMs, 0) / items.length);
      const avgP = (items.reduce((a, r) => a + r.power, 0) / items.length).toFixed(1);
      return `<div class="color-stat-row">
        <span class="color-stat-swatch" style="background:${c.hex}"></span>
        <span class="color-stat-name">${c.label}</span>
        <span class="color-stat-values">${avgR}ms · ${avgP}G</span>
      </div>`;
    }).join('');
    const div = document.createElement('div');
    div.id = 'sum-color-stats';
    div.className = 'color-stats-section';
    div.innerHTML = `<div class="color-stats-title">${t('color_stats_title')}</div><div class="color-stats-grid">${rows}</div>`;
    document.querySelector('.summary-body').appendChild(div);
  }

  const comboResults = APP.combo.results;
  const comboPctSave = isComboSubmode && comboResults.length
    ? Math.round((comboResults.filter(r => r.ok).length / comboResults.length) * 100)
    : null;
  const bestDurSave = isComboSubmode
    ? (comboResults.filter(r => r.ok && r.duration > 0).map(r => r.duration).reduce(
        (min, v) => v < min ? v : min, Infinity) || null)
    : null;

  const sessionData = {
    ts: endTime, mode: APP.mode, submode: APP.comboConfig.submode,
    rounds: APP.config.rounds,
    totalPunches: total, avgPower, maxPower, avgSpeed, maxSpeed,
    avgReaction: avgReact, bestReaction: bestReact,
    hits: sess.hits, misses: sess.misses,
    calories, durationSec: durSec,
    comboPct: comboPctSave,
    bestComboDuration: bestDurSave === Infinity ? null : bestDurSave,
  };

  // Guardar de inmediato — no depender de que el usuario pulse un botón antes
  // de cerrar/abandonar la pantalla (si no, la sesión se perdía en silencio
  // y el historial/ranking quedaban vacíos).
  if (!APP.sessionSaved) {
    saveSession(sessionData);
    APP.sessionSaved = true;
  }

  const saveBtn = document.getElementById('btn-save-session');
  saveBtn.textContent = t('session_saved_txt');
  saveBtn.disabled = true;

  document.getElementById('btn-summary-menu').onclick = () => {
    showScreen('screen-menu');
    startHomeParticles();
  };

  if (APP.mode === 'training' && APP.gamification) renderGamificationSummary();

  const sessionXP = APP.gamification ? Math.max(0, APP.gamification.sessionXP) : 0;
  showResultSplash(sess.allPunches, sessionXP, () => showScreen('screen-summary', true));
}

function buildComparison(totalPunches, avgPower, bestReaction) {
  const sessions = getSessions();
  if (!sessions.length) return '';
  const prev  = sessions[sessions.length - 1];
  const parts = [];

  const pd = totalPunches - (prev.totalPunches || 0);
  if (pd > 0)       parts.push(t('diff_punches_up',   { n: pd }));
  else if (pd < 0)  parts.push(t('diff_punches_down', { n: Math.abs(pd) }));

  const wd = avgPower - (prev.avgPower || 0);
  if (Math.abs(wd) > 0.1) {
    parts.push(wd > 0
      ? t('diff_power_up',   { n: wd.toFixed(1) })
      : t('diff_power_down', { n: Math.abs(wd).toFixed(1) }));
  }

  if (APP.mode === 'combo' && bestReaction !== null && prev.bestReaction) {
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
function initHistoryScreen(tab) {
  console.log('Sesiones guardadas:', localStorage.getItem('fkf_sessions'));
  console.log('Records:', 'XP total =', localStorage.getItem('fkf_gam_xp'), '| Mejor racha =', localStorage.getItem('fkf_best_streak'));

  document.getElementById('btn-history-back').onclick = () => { startBgParticles(); showScreen('screen-menu'); };

  const tabH = document.getElementById('tab-historial');
  const tabR = document.getElementById('tab-ranking');
  const bodyH = document.getElementById('hist-body-historial');
  const bodyR = document.getElementById('hist-body-ranking');

  const activateTab = (t) => {
    if (tabH) tabH.classList.toggle('hist-tab-active', t === 'historial');
    if (tabR) tabR.classList.toggle('hist-tab-active', t === 'ranking');
    if (bodyH) bodyH.classList.toggle('hidden', t !== 'historial');
    if (bodyR) bodyR.classList.toggle('hidden', t !== 'ranking');
    if (t === 'ranking') renderRankingContent();
    else renderHistorialContent();
  };

  if (tabH) tabH.onclick = () => activateTab('historial');
  if (tabR) tabR.onclick = () => activateTab('ranking');
  activateTab(tab || 'historial');
}

function renderHistorialContent() {
  const sessions = getSessions();
  const emptyEl  = document.getElementById('hist-empty-state');
  const sections = document.querySelectorAll('#hist-body-historial .hist-section');

  if (!sessions.length) {
    if (emptyEl) emptyEl.classList.remove('hidden');
    sections.forEach(s => s.classList.add('hidden'));
    return;
  }
  if (emptyEl) emptyEl.classList.add('hidden');
  sections.forEach(s => s.classList.remove('hidden'));

  const reactions  = sessions.filter(s => s.bestReaction).map(s => s.bestReaction);
  const bestReact  = reactions.length ? Math.min(...reactions) : null;
  const bestPower  = Math.max(...sessions.map(s => s.maxPower || 0));
  const mostPunch  = Math.max(...sessions.map(s => s.totalPunches || 0));

  document.getElementById('hist-best-reaction').textContent  = bestReact !== null ? (bestReact / 1000).toFixed(2) + 's' : '—';
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
    '#FFE000');

  const rSessions = last10.filter(s => s.avgReaction);
  if (rSessions.length > 1) {
    const rVals = rSessions.map(s => s.avgReaction);
    drawLineChart('hist-reaction-chart', rVals, Math.max(...rVals, 600), '#00cc44');
  }

  const calVals = last10.map(s => s.calories || 0);
  drawBarChart('hist-calories-chart', calVals, Math.max(...calVals, 50), () => '#ff8800');
}

function renderRankingContent() {
  const bodyR = document.getElementById('hist-body-ranking');
  if (!bodyR) return;
  const sessions = getSessions();
  const profile  = APP.profile;
  const name     = profile ? profile.name : (localStorage.getItem('fkf_guestName') || 'Tú');
  const xp       = loadGamificationXP();

  const bestPower = sessions.reduce((m, s) => Math.max(m, s.maxPower || 0), 0);
  const bestSpeed = sessions.reduce((m, s) => Math.max(m, s.maxSpeed || 0), 0);

  const rankRow = (pos, n, val, unit, color) =>
    `<div class="rank-row${pos === 1 ? ' rank-row-me' : ''}">
      <span class="rank-pos">#${pos}</span>
      <span class="rank-name">${n}</span>
      <span class="rank-val" style="color:${color}">${val}${unit}</span>
    </div>`;

  // Active ranking sub-tab
  let activeSubTab = bodyR.dataset.subtab || 'potencia';
  const renderSub = (sub) => {
    bodyR.dataset.subtab = sub;
    bodyR.querySelectorAll('.rank-subtab').forEach(b =>
      b.classList.toggle('rank-subtab-active', b.dataset.sub === sub));
    const listEl = bodyR.querySelector('.rank-list');
    if (!listEl) return;
    const emptyHtml = `<p class="rank-empty">${t('rank_empty_title')}</p>`;
    if (sub === 'potencia') {
      listEl.innerHTML = bestPower > 0
        ? rankRow(1, name, bestPower.toFixed(1), 'G', '#FFD300')
        : emptyHtml;
    } else if (sub === 'velocidad') {
      listEl.innerHTML = bestSpeed > 0
        ? rankRow(1, name, bestSpeed.toFixed(1), 'm/s', '#00D4FF')
        : emptyHtml;
    } else {
      listEl.innerHTML = xp > 0
        ? rankRow(1, name, xp, ' XP', '#9B59B6')
        : emptyHtml;
    }
  };

  bodyR.innerHTML = `
    <div class="rank-subtabs">
      <button class="rank-subtab" data-sub="potencia">🏆 POTENCIA</button>
      <button class="rank-subtab" data-sub="velocidad">⚡ VELOCIDAD</button>
      <button class="rank-subtab" data-sub="xp">⭐ XP</button>
    </div>
    <div class="rank-list"></div>
    <p class="rank-coming-soon">🌐 Ranking global próximamente</p>`;

  bodyR.querySelectorAll('.rank-subtab').forEach(b =>
    b.onclick = () => renderSub(b.dataset.sub));
  renderSub(activeSubTab);
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
// MODAL: MEDIR MI GOLPE — ELECCIÓN
// ═══════════════════════════════════════════════════
function showMeasureChoiceModal() {
  const modal = document.getElementById('modal-measure-choice');
  if (!modal) return;
  modal.classList.remove('hidden');

  document.getElementById('btn-choice-calibrate').onclick = () => {
    modal.classList.add('hidden');
    stopHomeParticles();
    showCalibrationScreen('screen-menu');
  };
  document.getElementById('btn-choice-train').onclick = () => {
    modal.classList.add('hidden');
    APP.mode = 'training';
    stopHomeParticles();
    showScreen('screen-config');
    initConfigScreen();
  };
  document.getElementById('btn-choice-cancel').onclick = () => {
    modal.classList.add('hidden');
  };
  document.getElementById('modal-measure-overlay').onclick = () => {
    modal.classList.add('hidden');
  };
}

// ═══════════════════════════════════════════════════
// SETTINGS DROPDOWN
// ═══════════════════════════════════════════════════
function toggleSettingsDropdown() {
  const dd = document.getElementById('settings-dropdown');
  if (!dd) { openSettingsModal(); return; }
  const isOpen = !dd.classList.contains('hidden');
  dd.classList.toggle('hidden', isOpen);
  if (isOpen) return;

  document.getElementById('sd-help').onclick = () => {
    dd.classList.add('hidden');
    showScreen('screen-help'); initHelpScreen();
  };
  document.getElementById('sd-calib').onclick = () => {
    dd.classList.add('hidden');
    stopBgParticles(); showCalibrationScreen('screen-menu');
  };
  document.getElementById('sd-profile').onclick = () => {
    dd.classList.add('hidden');
    openSettingsModal();
  };
  document.getElementById('sd-logout').onclick = () => {
    dd.classList.add('hidden'); supabaseSignOut();
  };
  document.querySelectorAll('.sd-lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === APP.lang);
    btn.onclick = () => {
      APP.lang = btn.dataset.lang;
      localStorage.setItem('fkf_lang', APP.lang);
      applyLanguage();
      dd.classList.add('hidden');
    };
  });

  const closeOutside = (e) => {
    if (!dd.contains(e.target) && !document.getElementById('btn-settings').contains(e.target)) {
      dd.classList.add('hidden');
      document.removeEventListener('click', closeOutside, true);
    }
  };
  trackedTimeout(() => document.addEventListener('click', closeOutside, true), 50);
}

// ═══════════════════════════════════════════════════
// MODAL: AJUSTES
// ═══════════════════════════════════════════════════
function openSettingsModal() {
  if (APP.profile) {
    document.getElementById('settings-name').value   = APP.profile.name;
    document.getElementById('settings-weight').value = APP.profile.weight;
    document.getElementById('settings-age').value    = APP.profile.age;
    document.getElementById('settings-sex-hombre').classList.toggle('active', APP.profile.sex === 'hombre');
    document.getElementById('settings-sex-mujer').classList.toggle('active',  APP.profile.sex !== 'hombre');
  }
  document.querySelectorAll('.btn-lang-sm').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === APP.lang);
  });
  updateMuteButtons();
  document.getElementById('modal-settings').classList.remove('hidden');
}

function closeSettingsModal() {
  document.getElementById('modal-settings').classList.add('hidden');
}

function initSettingsModal() {
  const btnH = document.getElementById('settings-sex-hombre');
  const btnM = document.getElementById('settings-sex-mujer');
  btnH.addEventListener('click', () => { btnH.classList.add('active');    btnM.classList.remove('active'); });
  btnM.addEventListener('click', () => { btnM.classList.add('active');    btnH.classList.remove('active'); });

  document.querySelectorAll('.btn-lang-sm').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.dataset.lang === APP.lang) return;
      APP.lang = btn.dataset.lang;
      localStorage.setItem('fkf_lang', APP.lang);
      applyLanguage();
    });
  });

  document.getElementById('btn-close-settings').onclick = closeSettingsModal;
  document.getElementById('modal-overlay').onclick      = closeSettingsModal;
  document.getElementById('btn-sound-toggle').onclick   = toggleSound;
  document.getElementById('btn-calibrate-settings').onclick = () => {
    closeSettingsModal();
    showCalibrationScreen('screen-menu');
  };

  document.getElementById('btn-save-settings').onclick = () => {
    const name   = document.getElementById('settings-name').value.trim();
    const weight = parseFloat(document.getElementById('settings-weight').value);
    const age    = parseInt(document.getElementById('settings-age').value);
    const sex    = btnH.classList.contains('active') ? 'hombre' : 'mujer';
    if (!name)                                { alert(t('alert_enter_name')); return; }
    if (!weight || weight < 30 || weight > 200) { alert(t('alert_weight_s'));  return; }
    if (!age || age < 10 || age > 100)         { alert(t('alert_age_s'));      return; }
    const supabaseId = APP.profile ? APP.profile.supabase_id : null;
    saveProfile({ name, weight, age, sex, supabase_id: supabaseId });
    closeSettingsModal();
  };

  document.getElementById('btn-logout').onclick = () => supabaseSignOut();
}

// ═══════════════════════════════════════════════════
// INICIALIZACIÓN
// ═══════════════════════════════════════════════════
const HMC_COLORS = { blue: '#00D4FF', green: '#FFD300', yellow: '#FF0000', purple: '#9B59B6' };
function hmcColor(card) {
  for (const k in HMC_COLORS) if (card.classList.contains('hmc--' + k)) return HMC_COLORS[k];
  return '#FFD300';
}

function spawnDomParticles(x, y, color, count) {
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.3;
    const dist  = 30 + Math.random() * 30;
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist;
    const el = document.createElement('span');
    el.className = 'dom-particle';
    el.style.cssText = `left:${x}px;top:${y}px;background:${color};--dx:${dx}px;--dy:${dy}px`;
    document.body.appendChild(el);
    trackedTimeout(() => el.remove(), 500);
  }
}

function addRipple(e, btn) {
  const r    = btn.getBoundingClientRect();
  const size = Math.max(r.width, r.height);
  const x    = (e.clientX || r.left + r.width / 2) - r.left - size / 2;
  const y    = (e.clientY || r.top  + r.height / 2) - r.top  - size / 2;
  const el   = document.createElement('span');
  el.className = 'btn-ripple-el';
  el.style.cssText = `width:${size}px;height:${size}px;left:${x}px;top:${y}px`;
  btn.appendChild(el);
  trackedTimeout(() => el.remove(), 600);
}

function initAvatarSystem() {
  if (!localStorage.getItem('fkf_avatar_v2')) {
    const catalog = [
      { id: 'gloves_red',    type: 'gloves',   name: 'Red Power Gloves',  xp_threshold: 0     },
      { id: 'gloves_gold',   type: 'gloves',   name: 'Champion Gloves',   xp_threshold: 5000  },
      { id: 'belt_white',    type: 'belt',      name: 'White Belt',        xp_threshold: 0     },
      { id: 'belt_black',    type: 'belt',      name: 'Black Belt',        xp_threshold: 12000 },
      { id: 'outfit_basic',  type: 'outfit',    name: 'Basic Gear',        xp_threshold: 0     },
      { id: 'outfit_sifu',   type: 'outfit',    name: 'Sifu Uniform',      xp_threshold: 25000 },
    ];
    const currentXP = loadGamificationXP();
    const unlocked  = catalog.filter(i => currentXP >= i.xp_threshold).map(i => i.id);
    APP.avatar = {
      unlocked_items: unlocked,
      equipped: { hair: null, outfit: 'outfit_basic', gloves: 'gloves_red', belt: 'belt_white', accessories: [] },
      cosmetic_points: 0,
      catalog,
    };
    localStorage.setItem('fkf_avatar_v2', JSON.stringify(APP.avatar));
  } else {
    try { APP.avatar = JSON.parse(localStorage.getItem('fkf_avatar_v2')); } catch(e) {}
  }
}

function init() {
  initSupabase();
  loadSoundPref();
  loadCalibration();
  loadColorConfig();
  initAvatarSystem();
  initSettingsModal();

  const savedLang = localStorage.getItem('fkf_lang');
  if (savedLang) {
    APP.lang = savedLang;
    applyLanguage();
    afterLangSelected();
  } else {
    showScreen('screen-lang');
    initLangScreen();
  }

  // Pre-check accelerometer availability (listener added only when session starts)
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  if (!isIOS && typeof DeviceMotionEvent !== 'undefined') {
    APP.accel.available = true;
    APP.accel.permitted = true;
  }

  trackedTimeout(() => startBgParticles(), 100);
}

// ═══════════════════════════════════════════════════
// AYUDA — CONTENIDO POR IDIOMA
// ═══════════════════════════════════════════════════
const HELP_SECTIONS = {
  es: [
    {
      icon: '🥊', title: '¿Qué es ImpactLab?',
      html: `<p>ImpactLab convierte tu móvil en un medidor de golpes para entrenamiento de <strong>boxeo, kickboxing, artes marciales</strong> o saco de arena.</p>
<p>Mide en tiempo real la <strong>potencia</strong> (G), <strong>velocidad</strong> (m/s) y <strong>tiempo de reacción</strong> de tus golpes, y guarda el historial de sesiones para que puedas ver tu progreso.</p>`
    },
    {
      icon: '📱', title: '¿Cómo funciona el sensor?',
      html: `<p>El móvil usa su <strong>acelerómetro</strong> para detectar la vibración del impacto cuando golpeas el saco.</p>
<ul>
  <li>Coloca el móvil <strong>sobre el saco</strong> o sujétalo con una goma elástica.</li>
  <li><strong>No lo tengas en la mano</strong> mientras golpeas.</li>
  <li>Cuanto más firme esté el móvil, más precisas son las lecturas.</li>
  <li>Si cuenta golpes de más, usa la <strong>Calibración</strong> para ajustar el umbral.</li>
  <li>En iOS debes dar <strong>permiso al sensor de movimiento</strong> la primera vez.</li>
</ul>`
    },
    {
      icon: '🥊', title: 'Modo Entrenamiento',
      html: `<p>Registra todos los golpes durante rounds configurables (1–12 rounds, 1–5 min).</p>
<ul>
  <li><strong>Golpes</strong> — total de impactos en el round.</li>
  <li><strong>Potencia (G)</strong> — fuerza del impacto. Más G = golpe más duro.</li>
  <li><strong>Velocidad (m/s)</strong> — velocidad de impacto estimada.</li>
  <li><strong>Mejor golpe</strong> — la G máxima registrada en el round.</li>
</ul>
<p>La gráfica muestra los últimos 10 golpes en orden cronológico.</p>`
    },
    {
      icon: '🔴', title: 'Modo Reacción — Golpe Simple',
      html: `<p>Aparece una señal <strong>⚡</strong> tras un delay aleatorio (1–3 s). Golpea lo antes posible.</p>
<p>El <strong>tiempo de reacción</strong> mide el intervalo desde que aparece la señal hasta que se detecta el golpe. Cuanto más bajo, mejor.</p>
<ul>
  <li><strong>⚫ Maestro</strong> — menos de 200 ms</li>
  <li><strong>🟤 Rápido</strong> — menos de 350 ms</li>
  <li><strong>🟡 Bueno</strong> — menos de 600 ms</li>
  <li><strong>⚪ Sigue practicando</strong> — 600 ms o más</li>
</ul>
<p>Si no golpeas en 1 segundo, cuenta como fallo.</p>`
    },
    {
      icon: '🥊', title: 'Modo Combo',
      html: `<p>La señal <strong>HIT</strong> aparece en rojo y debes completar una serie de N golpes dentro del tiempo máximo.</p>
<ul>
  <li>El <strong>primer golpe</strong> marca tu tiempo de reacción.</li>
  <li>El <strong>último golpe</strong> marca la duración total del combo.</li>
  <li><strong>Modo Fijo</strong> — siempre el mismo número de golpes por combo.</li>
  <li><strong>Modo Aleatorio</strong> — el número varía en cada señal.</li>
  <li>Combo <strong>válido</strong> = todos los golpes completados antes del límite de tiempo.</li>
  <li>Combo <strong>fallido</strong> = tiempo agotado antes de completar los golpes.</li>
</ul>`
    },
    {
      icon: '🎨', title: 'Modo Colores',
      html: `<p>La pantalla se ilumina en un color (<strong>amarillo, rojo o azul</strong>) y debes reaccionar golpeando.</p>
<p>En la configuración puedes asignar a cada color un texto libre: una <strong>zona del cuerpo, una técnica</strong> o cualquier cosa.</p>
<ul>
  <li>Ejemplo: 🟡 Amarillo = Piernas · 🔴 Rojo = Torso · 🔵 Azul = Cara</li>
  <li><strong>Orden aleatorio</strong> — los colores aparecen en orden imprevisible.</li>
  <li><strong>Orden fijo</strong> — ciclo amarillo → rojo → azul repetido.</li>
</ul>
<p>En el resumen verás el tiempo de reacción medio y potencia media por cada color.</p>`
    },
    {
      icon: '🎯', title: 'Calibración del dispositivo',
      html: `<p>La calibración ajusta el <strong>umbral de detección</strong> y el <strong>tiempo de rebote</strong> a tu saco y estilo de golpeo.</p>
<p><strong>¿Cuándo calibrar?</strong></p>
<ul>
  <li>La primera vez que uses la app.</li>
  <li>Si cambias de saco o muñeco.</li>
  <li>Si cuenta golpes de más o de menos.</li>
</ul>
<p><strong>Cómo calibrar:</strong> Menú principal → CALIBRAR DISPOSITIVO (o desde Ajustes). Da 3 golpes de intensidad creciente (suave, medio, fuerte). La app calcula el umbral automáticamente y lo guarda.</p>`
    },
    {
      icon: '📊', title: 'Analíticas e Historial',
      html: `<p>Cada sesión guardada incluye: golpes totales, potencia media y máxima, velocidad media, tiempo de reacción, calorías estimadas y duración.</p>
<p>En el <strong>Historial</strong> (icono 📊) verás:</p>
<ul>
  <li><strong>Récords históricos</strong> — mejor reacción, mayor potencia, más golpes en una sesión.</li>
  <li><strong>Totales acumulados</strong> — sesiones, golpes históricos, calorías totales.</li>
  <li><strong>Racha</strong> — días consecutivos entrenando.</li>
  <li><strong>Gráficas</strong> — evolución de potencia, reacción y calorías en las últimas 10 sesiones.</li>
</ul>`
    },
    {
      icon: '🔊', title: 'Sonidos y voz',
      html: `<p>Activa o desactiva el sonido desde <strong>Ajustes ⚙️</strong> o con el botón <strong>🔊/🔇</strong> en cualquier pantalla de sesión.</p>
<ul>
  <li>🔔 <strong>Campana</strong> — inicio y fin de round.</li>
  <li>💥 <strong>Thud</strong> — cada golpe detectado.</li>
  <li>🎵 <strong>Escala ascendente</strong> — combo completado correctamente.</li>
  <li>📉 <strong>Escala descendente</strong> — combo fallido o tiempo agotado.</li>
  <li>🔔 <strong>Beep suave</strong> — cada 10 s durante el descanso.</li>
  <li>🗣️ <strong>Voz</strong> — anuncia resultados en tu idioma (¡Bien! / ¡Maestro! / ¡Sigue intentando!).</li>
</ul>`
    },
    {
      icon: '❓', title: 'Preguntas frecuentes',
      html: `
<p class="help-faq-q">¿Por qué cuenta golpes de más?</p>
<p class="help-faq-a">El umbral de detección es muy bajo. Ve a <strong>Calibrar dispositivo</strong> para ajustarlo a tu golpe y tu saco.</p>
<p class="help-faq-q">¿Funciona sin internet?</p>
<p class="help-faq-a">Sí. ImpactLab es una <strong>PWA</strong> (Progressive Web App) que funciona completamente offline una vez cargada.</p>
<p class="help-faq-q">¿Puedo usarla en iOS?</p>
<p class="help-faq-a">Sí. La primera vez debes dar permiso al <strong>sensor de movimiento</strong> en la pantalla de configuración.</p>
<p class="help-faq-q">¿Se guardan mis datos en la nube?</p>
<p class="help-faq-a">No. Todo se guarda <strong>solo en tu móvil</strong>. Nunca se envía nada a ningún servidor.</p>`
    },
  ],
  en: [
    {
      icon: '🥊', title: 'What is ImpactLab?',
      html: `<p>ImpactLab turns your phone into a punch tracker for <strong>boxing, kickboxing, martial arts</strong> or bag training.</p>
<p>It measures <strong>power</strong> (G), <strong>speed</strong> (m/s) and <strong>reaction time</strong> in real time, and saves session history so you can track your progress.</p>`
    },
    {
      icon: '📱', title: 'How does the sensor work?',
      html: `<p>The phone uses its <strong>accelerometer</strong> to detect impact vibrations when you punch the bag.</p>
<ul>
  <li>Place the phone <strong>on the bag</strong> or secure it with an elastic band.</li>
  <li><strong>Do not hold it in your hand</strong> while punching.</li>
  <li>The more securely it is fixed, the more accurate the readings.</li>
  <li>If too many punches are counted, use <strong>Calibration</strong> to adjust the threshold.</li>
  <li>On iOS you must grant <strong>motion sensor permission</strong> the first time.</li>
</ul>`
    },
    {
      icon: '🥊', title: 'Training Mode',
      html: `<p>Records all punches during configurable rounds (1–12 rounds, 1–5 min).</p>
<ul>
  <li><strong>Punches</strong> — total impacts in the round.</li>
  <li><strong>Power (G)</strong> — impact force. Higher G = harder punch.</li>
  <li><strong>Speed (m/s)</strong> — estimated impact speed.</li>
  <li><strong>Best punch</strong> — maximum G recorded in the round.</li>
</ul>
<p>The chart shows the last 10 punches in chronological order.</p>`
    },
    {
      icon: '🔴', title: 'Reaction Mode — Single Hit',
      html: `<p>A <strong>⚡</strong> signal appears after a random delay (1–3 s). Hit as fast as you can.</p>
<p><strong>Reaction time</strong> measures the interval from signal appearance to punch detection. Lower is better.</p>
<ul>
  <li><strong>⚫ Master</strong> — under 200 ms</li>
  <li><strong>🟤 Fast</strong> — under 350 ms</li>
  <li><strong>🟡 Good</strong> — under 600 ms</li>
  <li><strong>⚪ Keep practicing</strong> — 600 ms or more</li>
</ul>
<p>If you don't punch within 1 second, it counts as a miss.</p>`
    },
    {
      icon: '🥊', title: 'Combo Mode',
      html: `<p>The <strong>HIT</strong> signal appears in red and you must complete a series of N punches within the max time.</p>
<ul>
  <li>The <strong>first punch</strong> marks your reaction time.</li>
  <li>The <strong>last punch</strong> marks the total combo duration.</li>
  <li><strong>Fixed mode</strong> — always the same number of hits per combo.</li>
  <li><strong>Random mode</strong> — the number varies each signal.</li>
  <li><strong>Valid combo</strong> = all hits completed before the time limit.</li>
  <li><strong>Failed combo</strong> = time ran out before completing the hits.</li>
</ul>`
    },
    {
      icon: '🎨', title: 'Color Mode',
      html: `<p>The screen lights up in a color (<strong>yellow, red or blue</strong>) and you must react by hitting.</p>
<p>In the config you can assign each color a custom label: a <strong>body zone, a technique</strong> or anything you like.</p>
<ul>
  <li>Example: 🟡 Yellow = Legs · 🔴 Red = Torso · 🔵 Blue = Head</li>
  <li><strong>Random order</strong> — colors appear unpredictably.</li>
  <li><strong>Fixed order</strong> — cycles yellow → red → blue.</li>
</ul>
<p>The summary shows average reaction time and power per color.</p>`
    },
    {
      icon: '🎯', title: 'Device Calibration',
      html: `<p>Calibration adjusts the <strong>detection threshold</strong> and <strong>debounce time</strong> to your bag and punching style.</p>
<p><strong>When to calibrate:</strong></p>
<ul>
  <li>The first time you use the app.</li>
  <li>When switching bags or dummies.</li>
  <li>If too many or too few hits are counted.</li>
</ul>
<p><strong>How to calibrate:</strong> Main menu → CALIBRATE DEVICE (or from Settings). Throw 3 punches of increasing intensity (soft, medium, hard). The app calculates the threshold automatically and saves it.</p>`
    },
    {
      icon: '📊', title: 'Analytics & History',
      html: `<p>Each saved session includes: total punches, avg and max power, avg speed, reaction time, estimated calories and duration.</p>
<p>The <strong>History</strong> screen (📊 icon) shows:</p>
<ul>
  <li><strong>All-time records</strong> — best reaction, max power, most punches in a session.</li>
  <li><strong>Cumulative totals</strong> — sessions, total punches, total calories.</li>
  <li><strong>Streak</strong> — consecutive training days.</li>
  <li><strong>Charts</strong> — power, reaction and calorie trends for the last 10 sessions.</li>
</ul>`
    },
    {
      icon: '🔊', title: 'Sounds & Voice',
      html: `<p>Toggle sound from <strong>Settings ⚙️</strong> or with the <strong>🔊/🔇</strong> button on any session screen.</p>
<ul>
  <li>🔔 <strong>Bell</strong> — round start and end.</li>
  <li>💥 <strong>Thud</strong> — every detected punch.</li>
  <li>🎵 <strong>Ascending scale</strong> — combo completed correctly.</li>
  <li>📉 <strong>Descending scale</strong> — combo failed or timed out.</li>
  <li>🔔 <strong>Soft beep</strong> — every 10 s during rest.</li>
  <li>🗣️ <strong>Voice</strong> — announces results in your language (Good! / Master! / Keep trying!).</li>
</ul>`
    },
    {
      icon: '❓', title: 'Frequently Asked Questions',
      html: `
<p class="help-faq-q">Why does it count too many punches?</p>
<p class="help-faq-a">The detection threshold is too low. Go to <strong>Calibrate device</strong> to tune it for your punch and bag.</p>
<p class="help-faq-q">Does it work without internet?</p>
<p class="help-faq-a">Yes. ImpactLab is a <strong>PWA</strong> (Progressive Web App) that works fully offline once loaded.</p>
<p class="help-faq-q">Can I use it on iOS?</p>
<p class="help-faq-a">Yes. The first time you must grant <strong>motion sensor permission</strong> in the config screen.</p>
<p class="help-faq-q">Is my data saved to the cloud?</p>
<p class="help-faq-a">No. Everything is stored <strong>only on your phone</strong>. Nothing is ever sent to any server.</p>`
    },
  ],
  pt: [
    {
      icon: '🥊', title: 'O que é ImpactLab?',
      html: `<p>ImpactLab transforma seu celular em um medidor de golpes para treino de <strong>boxe, kickboxing, artes marciais</strong> ou saco de pancadas.</p>
<p>Mede em tempo real a <strong>potência</strong> (G), <strong>velocidade</strong> (m/s) e <strong>tempo de reação</strong> dos seus golpes, e salva o histórico de sessões para acompanhar seu progresso.</p>`
    },
    {
      icon: '📱', title: 'Como funciona o sensor?',
      html: `<p>O celular usa seu <strong>acelerômetro</strong> para detectar vibrações de impacto quando você soca o saco.</p>
<ul>
  <li>Coloque o celular <strong>sobre o saco</strong> ou fixe com elástico.</li>
  <li><strong>Não segure na mão</strong> enquanto soca.</li>
  <li>Quanto mais firme estiver fixado, mais precisas as leituras.</li>
  <li>Se contar golpes em excesso, use a <strong>Calibração</strong> para ajustar o limiar.</li>
  <li>No iOS você deve conceder <strong>permissão ao sensor de movimento</strong> na primeira vez.</li>
</ul>`
    },
    {
      icon: '🥊', title: 'Modo Treino',
      html: `<p>Registra todos os golpes durante rounds configuráveis (1–12 rounds, 1–5 min).</p>
<ul>
  <li><strong>Golpes</strong> — total de impactos no round.</li>
  <li><strong>Potência (G)</strong> — força do impacto. Mais G = golpe mais forte.</li>
  <li><strong>Velocidade (m/s)</strong> — velocidade estimada do impacto.</li>
  <li><strong>Melhor golpe</strong> — G máxima registrada no round.</li>
</ul>
<p>O gráfico mostra os últimos 10 golpes em ordem cronológica.</p>`
    },
    {
      icon: '🔴', title: 'Modo Reação — Golpe Simples',
      html: `<p>Um sinal <strong>⚡</strong> aparece após atraso aleatório (1–3 s). Soque o mais rápido possível.</p>
<p>O <strong>tempo de reação</strong> mede o intervalo do sinal até o golpe detectado. Quanto menor, melhor.</p>
<ul>
  <li><strong>⚫ Mestre</strong> — menos de 200 ms</li>
  <li><strong>🟤 Rápido</strong> — menos de 350 ms</li>
  <li><strong>🟡 Bom</strong> — menos de 600 ms</li>
  <li><strong>⚪ Continue praticando</strong> — 600 ms ou mais</li>
</ul>
<p>Se não socar em 1 segundo, conta como erro.</p>`
    },
    {
      icon: '🥊', title: 'Modo Combo',
      html: `<p>O sinal <strong>HIT</strong> aparece em vermelho e você deve completar uma série de N golpes dentro do tempo máximo.</p>
<ul>
  <li>O <strong>primeiro golpe</strong> marca seu tempo de reação.</li>
  <li>O <strong>último golpe</strong> marca a duração total do combo.</li>
  <li><strong>Modo Fixo</strong> — sempre o mesmo número de golpes por combo.</li>
  <li><strong>Modo Aleatório</strong> — o número varia a cada sinal.</li>
  <li>Combo <strong>válido</strong> = todos os golpes antes do limite de tempo.</li>
  <li>Combo <strong>falho</strong> = tempo esgotado antes de completar os golpes.</li>
</ul>`
    },
    {
      icon: '🎨', title: 'Modo Cores',
      html: `<p>A tela acende em uma cor (<strong>amarelo, vermelho ou azul</strong>) e você deve reagir socando.</p>
<p>Na configuração pode atribuir a cada cor um rótulo livre: <strong>zona do corpo, técnica</strong> ou qualquer coisa.</p>
<ul>
  <li>Exemplo: 🟡 Amarelo = Pernas · 🔴 Vermelho = Tronco · 🔵 Azul = Cabeça</li>
  <li><strong>Ordem aleatória</strong> — cores aparecem de forma imprevisível.</li>
  <li><strong>Ordem fixa</strong> — ciclo amarelo → vermelho → azul.</li>
</ul>
<p>O resumo mostra tempo de reação médio e potência média por cor.</p>`
    },
    {
      icon: '🎯', title: 'Calibração do dispositivo',
      html: `<p>A calibração ajusta o <strong>limiar de detecção</strong> e o <strong>tempo de rejeição</strong> ao seu saco e estilo de golpe.</p>
<p><strong>Quando calibrar:</strong></p>
<ul>
  <li>Na primeira vez que usar o app.</li>
  <li>Ao trocar de saco ou manequim.</li>
  <li>Se contar golpes em excesso ou de menos.</li>
</ul>
<p><strong>Como calibrar:</strong> Menu principal → CALIBRAR DISPOSITIVO (ou em Configurações). Dê 3 socos de intensidade crescente (leve, médio, forte). O app calcula o limiar automaticamente e salva.</p>`
    },
    {
      icon: '📊', title: 'Análises e Histórico',
      html: `<p>Cada sessão salva inclui: golpes totais, potência média e máxima, velocidade média, tempo de reação, calorias estimadas e duração.</p>
<p>O <strong>Histórico</strong> (ícone 📊) mostra:</p>
<ul>
  <li><strong>Recordes históricos</strong> — melhor reação, maior potência, mais golpes em uma sessão.</li>
  <li><strong>Totais acumulados</strong> — sessões, golpes históricos, calorias totais.</li>
  <li><strong>Sequência</strong> — dias consecutivos de treino.</li>
  <li><strong>Gráficos</strong> — evolução de potência, reação e calorias nas últimas 10 sessões.</li>
</ul>`
    },
    {
      icon: '🔊', title: 'Sons e voz',
      html: `<p>Ative ou desative o som em <strong>Configurações ⚙️</strong> ou com o botão <strong>🔊/🔇</strong> em qualquer tela de sessão.</p>
<ul>
  <li>🔔 <strong>Campainha</strong> — início e fim do round.</li>
  <li>💥 <strong>Thud</strong> — cada golpe detectado.</li>
  <li>🎵 <strong>Escala ascendente</strong> — combo concluído corretamente.</li>
  <li>📉 <strong>Escala descendente</strong> — combo falhou ou tempo esgotado.</li>
  <li>🔔 <strong>Bipe suave</strong> — a cada 10 s durante o descanso.</li>
  <li>🗣️ <strong>Voz</strong> — anuncia resultados no seu idioma.</li>
</ul>`
    },
    {
      icon: '❓', title: 'Perguntas frequentes',
      html: `
<p class="help-faq-q">Por que conta golpes demais?</p>
<p class="help-faq-a">O limiar de detecção está muito baixo. Vá em <strong>Calibrar dispositivo</strong> para ajustá-lo ao seu golpe e saco.</p>
<p class="help-faq-q">Funciona sem internet?</p>
<p class="help-faq-a">Sim. ImpactLab é um <strong>PWA</strong> que funciona completamente offline após o primeiro carregamento.</p>
<p class="help-faq-q">Posso usar no iOS?</p>
<p class="help-faq-a">Sim. Na primeira vez, conceda <strong>permissão ao sensor de movimento</strong> na tela de configuração.</p>
<p class="help-faq-q">Meus dados ficam na nuvem?</p>
<p class="help-faq-a">Não. Tudo é guardado <strong>apenas no seu celular</strong>. Nada é enviado a nenhum servidor.</p>`
    },
  ],
  de: [
    {
      icon: '🥊', title: 'Was ist ImpactLab?',
      html: `<p>ImpactLab verwandelt dein Smartphone in einen Schlag-Tracker für <strong>Boxen, Kickboxen, Kampfsport</strong> oder Sandsack-Training.</p>
<p>Misst in Echtzeit <strong>Kraft</strong> (G), <strong>Geschwindigkeit</strong> (m/s) und <strong>Reaktionszeit</strong> deiner Schläge und speichert den Session-Verlauf.</p>`
    },
    {
      icon: '📱', title: 'Wie funktioniert der Sensor?',
      html: `<p>Das Smartphone nutzt seinen <strong>Beschleunigungssensor</strong>, um Erschütterungen beim Schlag zu erkennen.</p>
<ul>
  <li>Lege das Smartphone <strong>auf den Sack</strong> oder befestige es mit einem Gummiband.</li>
  <li><strong>Halte es nicht in der Hand</strong> beim Schlagen.</li>
  <li>Je fester es befestigt ist, desto genauer die Messungen.</li>
  <li>Bei zu vielen Fehlschlägen nutze die <strong>Kalibrierung</strong> zur Anpassung des Schwellenwerts.</li>
  <li>Auf iOS muss beim ersten Mal die <strong>Bewegungssensor-Berechtigung</strong> erteilt werden.</li>
</ul>`
    },
    {
      icon: '🥊', title: 'Trainingsmodus',
      html: `<p>Zeichnet alle Schläge in konfigurierbaren Runden auf (1–12 Runden, 1–5 Min).</p>
<ul>
  <li><strong>Schläge</strong> — Gesamtanzahl in der Runde.</li>
  <li><strong>Kraft (G)</strong> — Aufprallkraft. Mehr G = härterer Schlag.</li>
  <li><strong>Geschwindigkeit (m/s)</strong> — geschätzte Aufprallgeschwindigkeit.</li>
  <li><strong>Bester Schlag</strong> — maximales G in der Runde.</li>
</ul>
<p>Das Diagramm zeigt die letzten 10 Schläge in chronologischer Reihenfolge.</p>`
    },
    {
      icon: '🔴', title: 'Reaktionsmodus — Einzelschlag',
      html: `<p>Ein <strong>⚡</strong>-Signal erscheint nach zufälliger Verzögerung (1–3 s). Schlage so schnell wie möglich.</p>
<p>Die <strong>Reaktionszeit</strong> misst den Abstand vom Signal bis zum erkannten Schlag. Niedriger = besser.</p>
<ul>
  <li><strong>⚫ Meister</strong> — unter 200 ms</li>
  <li><strong>🟤 Schnell</strong> — unter 350 ms</li>
  <li><strong>🟡 Gut</strong> — unter 600 ms</li>
  <li><strong>⚪ Weiter üben</strong> — 600 ms oder mehr</li>
</ul>
<p>Kein Schlag innerhalb 1 Sekunde zählt als Fehler.</p>`
    },
    {
      icon: '🥊', title: 'Kombo-Modus',
      html: `<p>Das <strong>HIT</strong>-Signal erscheint rot und du musst N Schläge innerhalb der Maximalzeit ausführen.</p>
<ul>
  <li>Der <strong>erste Schlag</strong> markiert die Reaktionszeit.</li>
  <li>Der <strong>letzte Schlag</strong> markiert die Gesamtkombodauer.</li>
  <li><strong>Fest</strong> — immer gleiche Schlaganzahl pro Kombo.</li>
  <li><strong>Zufällig</strong> — Anzahl variiert je Signal.</li>
  <li>Gültige <strong>Kombo</strong> = alle Schläge vor dem Zeitlimit.</li>
  <li>Fehlgeschlagene <strong>Kombo</strong> = Zeit abgelaufen.</li>
</ul>`
    },
    {
      icon: '🎨', title: 'Farbmodus',
      html: `<p>Der Bildschirm leuchtet in einer Farbe (<strong>gelb, rot oder blau</strong>) auf und du musst durch Schlagen reagieren.</p>
<p>In der Konfiguration kannst du jeder Farbe einen eigenen Text zuweisen: <strong>Körperzone, Technik</strong> oder beliebig.</p>
<ul>
  <li>Beispiel: 🟡 Gelb = Beine · 🔴 Rot = Rumpf · 🔵 Blau = Kopf</li>
  <li><strong>Zufällige Reihenfolge</strong> — Farben erscheinen unvorhersehbar.</li>
  <li><strong>Feste Reihenfolge</strong> — Zyklus gelb → rot → blau.</li>
</ul>
<p>Die Zusammenfassung zeigt Ø-Reaktionszeit und Ø-Kraft pro Farbe.</p>`
    },
    {
      icon: '🎯', title: 'Gerätekalibrierung',
      html: `<p>Die Kalibrierung passt den <strong>Erkennungsschwellenwert</strong> und die <strong>Entprellzeit</strong> an deinen Sack und Schlagstil an.</p>
<p><strong>Wann kalibrieren:</strong></p>
<ul>
  <li>Beim ersten Mal.</li>
  <li>Beim Wechsel des Sacks oder der Puppe.</li>
  <li>Bei zu vielen oder zu wenigen erkannten Schlägen.</li>
</ul>
<p><strong>Wie kalibrieren:</strong> Hauptmenü → GERÄT KALIBRIEREN (oder Einstellungen). Schlage 3 Mal mit zunehmender Intensität (leicht, mittel, stark). Die App berechnet den Schwellenwert automatisch.</p>`
    },
    {
      icon: '📊', title: 'Statistiken & Verlauf',
      html: `<p>Jede gespeicherte Session enthält: Gesamtschläge, Ø und Max-Kraft, Ø-Geschwindigkeit, Reaktionszeit, geschätzte Kalorien und Dauer.</p>
<p>Der <strong>Verlauf</strong> (📊-Symbol) zeigt:</p>
<ul>
  <li><strong>Allzeit-Rekorde</strong> — beste Reaktion, Max-Kraft, meiste Schläge in einer Session.</li>
  <li><strong>Kumulierte Gesamtwerte</strong> — Sessions, Gesamtschläge, Gesamtkalorien.</li>
  <li><strong>Serie</strong> — aufeinanderfolgende Trainingstage.</li>
  <li><strong>Diagramme</strong> — Entwicklung von Kraft, Reaktion und Kalorien der letzten 10 Sessions.</li>
</ul>`
    },
    {
      icon: '🔊', title: 'Töne & Stimme',
      html: `<p>Ton ein-/ausschalten über <strong>Einstellungen ⚙️</strong> oder die <strong>🔊/🔇</strong>-Schaltfläche auf jedem Session-Bildschirm.</p>
<ul>
  <li>🔔 <strong>Glocke</strong> — Rundenstart und -ende.</li>
  <li>💥 <strong>Dumpfer Ton</strong> — jeder erkannte Schlag.</li>
  <li>🎵 <strong>Aufsteigende Skala</strong> — Kombo erfolgreich abgeschlossen.</li>
  <li>📉 <strong>Absteigende Skala</strong> — Kombo fehlgeschlagen oder Zeit abgelaufen.</li>
  <li>🔔 <strong>Leiser Piepton</strong> — alle 10 s in der Pause.</li>
  <li>🗣️ <strong>Stimme</strong> — kündigt Ergebnisse in deiner Sprache an.</li>
</ul>`
    },
    {
      icon: '❓', title: 'Häufige Fragen',
      html: `
<p class="help-faq-q">Warum werden zu viele Schläge gezählt?</p>
<p class="help-faq-a">Der Erkennungsschwellenwert ist zu niedrig. Gehe zu <strong>Gerät kalibrieren</strong>, um ihn anzupassen.</p>
<p class="help-faq-q">Funktioniert es ohne Internet?</p>
<p class="help-faq-a">Ja. ImpactLab ist eine <strong>PWA</strong>, die nach dem ersten Laden vollständig offline funktioniert.</p>
<p class="help-faq-q">Kann ich es auf iOS verwenden?</p>
<p class="help-faq-a">Ja. Beim ersten Mal muss die <strong>Bewegungssensor-Berechtigung</strong> in der Konfiguration erteilt werden.</p>
<p class="help-faq-q">Werden meine Daten in der Cloud gespeichert?</p>
<p class="help-faq-a">Nein. Alles wird <strong>nur auf deinem Gerät</strong> gespeichert. Nichts wird an einen Server gesendet.</p>`
    },
  ],
};

// ═══════════════════════════════════════════════════
// AYUDA — PANTALLA
// ═══════════════════════════════════════════════════
function initHelpScreen() {
  document.getElementById('btn-help-back').onclick = () => showScreen('screen-menu');
  applyLanguage();

  const sections = HELP_SECTIONS[APP.lang] || HELP_SECTIONS.es;
  const accordion = document.getElementById('help-accordion');
  accordion.innerHTML = '';

  sections.forEach((sec, idx) => {
    const div = document.createElement('div');
    div.className = 'help-section';
    div.innerHTML = `
      <button class="help-section-header" aria-expanded="false">
        <span class="help-section-icon">${sec.icon}</span>
        <span class="help-section-title">${sec.title}</span>
        <span class="help-section-arrow">▼</span>
      </button>
      <div class="help-section-body" role="region">
        <div class="help-section-content">${sec.html}</div>
      </div>`;

    const header = div.querySelector('.help-section-header');
    header.addEventListener('click', () => {
      const isOpen = div.classList.contains('open');
      // Close all others
      accordion.querySelectorAll('.help-section.open').forEach(s => {
        s.classList.remove('open');
        s.querySelector('.help-section-header').setAttribute('aria-expanded', 'false');
      });
      // Toggle this one
      if (!isOpen) {
        div.classList.add('open');
        header.setAttribute('aria-expanded', 'true');
      }
    });

    accordion.appendChild(div);
  });
}

// ═══════════════════════════════════════════════════
// SONIDO — SISTEMA EXTENDIDO
// ═══════════════════════════════════════════════════
function loadSoundPref() {
  const val = localStorage.getItem('fkf_sound');
  APP.soundEnabled = val === null ? true : val === '1';
}

function saveSoundPref() {
  localStorage.setItem('fkf_sound', APP.soundEnabled ? '1' : '0');
}

function toggleSound() {
  APP.soundEnabled = !APP.soundEnabled;
  saveSoundPref();
  updateMuteButtons();
}

function updateMuteButtons() {
  const icon = APP.soundEnabled ? '🔊' : '🔇';
  document.querySelectorAll('.mute-btn').forEach(btn => {
    btn.textContent = icon;
    btn.classList.toggle('muted', !APP.soundEnabled);
  });
  const toggleBtn = document.getElementById('btn-sound-toggle');
  if (toggleBtn) {
    toggleBtn.textContent = APP.soundEnabled ? ('🔊 ' + t('sound_on')) : ('🔇 ' + t('sound_off'));
    toggleBtn.classList.toggle('muted', !APP.soundEnabled);
  }
}

function playPunchThud() {
  if (!APP.soundEnabled) return;
  try {
    const ctx = getAudioCtx();
    if (ctx.state === 'suspended') ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(110, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(55, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.32, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
    osc.start(); osc.stop(ctx.currentTime + 0.22);
  } catch(e) {}
}

function playComboOk() {
  if (!APP.soundEnabled) return;
  try {
    const ctx = getAudioCtx();
    if (ctx.state === 'suspended') ctx.resume();
    [440, 554, 659, 880].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'sine';
      const t0 = ctx.currentTime + i * 0.09;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.26, t0);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.22);
      osc.start(t0); osc.stop(t0 + 0.28);
    });
  } catch(e) {}
}

function playComboFail() {
  if (!APP.soundEnabled) return;
  try {
    const ctx = getAudioCtx();
    if (ctx.state === 'suspended') ctx.resume();
    [440, 330, 220].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'sawtooth';
      const t0 = ctx.currentTime + i * 0.1;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.2, t0);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.28);
      osc.start(t0); osc.stop(t0 + 0.32);
    });
  } catch(e) {}
}

// ═══════════════════════════════════════════════════
// CALIBRACIÓN DE DISPOSITIVO
// ═══════════════════════════════════════════════════
const CALIB_STEPS = [
  { key: 'suave',  label: { es: 'GOLPE SUAVE',  en: 'SOFT PUNCH',   pt: 'GOLPE LEVE',   de: 'LEICHTER SCHLAG' }, bg: '#001533', color: '#00FF66' },
  { key: 'medio',  label: { es: 'GOLPE MEDIO',  en: 'MEDIUM PUNCH', pt: 'GOLPE MÉDIO',  de: 'MITTLERER SCHLAG' }, bg: '#1a1100', color: '#FFD300' },
  { key: 'fuerte', label: { es: 'GOLPE FUERTE', en: 'HARD PUNCH',   pt: 'GOLPE FORTE',  de: 'HARTER SCHLAG' }, bg: '#001500', color: '#FF1A1A' },
];

function loadCalibration() {
  const raw = localStorage.getItem('fkf_calibration');
  if (!raw) return false;
  try {
    const c = JSON.parse(raw);
    APP.calibration = c;
    APP.accel.THRESHOLD = Math.max(APP.accel.ABSOLUTE_MIN_G, c.threshold);
    APP.accel.COOLDOWN  = c.debounce;
    APP.accel.COMBO_HIT_COOLDOWN = Math.max(55, c.debounce - 45);
    return true;
  } catch(e) { return false; }
}

function saveCalibration(soft, medium, hard, threshold, debounce) {
  const safeThreshold = Math.max(APP.accel.ABSOLUTE_MIN_G, threshold);
  const calibration = {
    soft:       Math.round(soft   * 100) / 100,
    medium:     Math.round(medium * 100) / 100,
    hard:       Math.round(hard   * 100) / 100,
    threshold:  safeThreshold,
    debounce,
    calibrated: true,
    date:       Date.now(),
  };
  localStorage.setItem('fkf_calibration', JSON.stringify(calibration));
  APP.calibration = calibration;
  APP.accel.THRESHOLD = safeThreshold;
  APP.accel.COOLDOWN  = debounce;
  APP.accel.COMBO_HIT_COOLDOWN = Math.max(55, debounce - 45);
}

function showCalibrationScreen(fromScreen) {
  APP.calib.fromScreen = fromScreen || 'screen-menu';
  APP.calib.step  = 0;
  APP.calib.state = 'idle';
  APP.calib.data  = [];
  showScreen('screen-calibration');
  document.getElementById('btn-calib-back').onclick = () => showScreen(APP.calib.fromScreen);
  renderCalibIntro();
}

function renderCalibIntro() {
  const content = document.getElementById('calib-content');
  content.style.background = '';
  content.innerHTML = `
    <div class="calib-intro">
      <div class="calib-intro-icon">🎯</div>
      <h3 class="calib-title">${t('calib_title')}</h3>
      <p class="calib-desc">${t('calib_desc')}</p>
      <div class="calib-steps-preview">
        <div class="calib-preview-step" style="background:#001533">${CALIB_STEPS[0].label[APP.lang]||CALIB_STEPS[0].label.es}</div>
        <div class="calib-preview-step" style="background:#1a1100">${CALIB_STEPS[1].label[APP.lang]||CALIB_STEPS[1].label.es}</div>
        <div class="calib-preview-step" style="background:#001500">${CALIB_STEPS[2].label[APP.lang]||CALIB_STEPS[2].label.es}</div>
      </div>
      <button class="btn-primary btn-calib-ready" id="btn-calib-start">${t('calib_start')}</button>
    </div>`;
  document.getElementById('btn-calib-start').onclick = () => renderCalibStep(1);
}

function renderCalibStep(stepNum) {
  APP.calib.step  = stepNum;
  APP.calib.state = 'ready';
  APP.calib.peakG = 0;
  APP.calib.triggerAt = null;
  APP.calib.ringEnd   = null;
  APP.calib.graphData = [];
  stopCalibListener();

  const step  = CALIB_STEPS[stepNum - 1];
  const label = step.label[APP.lang] || step.label.es;
  const content = document.getElementById('calib-content');
  content.style.background = step.bg;

  content.innerHTML = `
    <div class="calib-step-inner">
      <div class="calib-step-num">${t('step')} ${stepNum}/3</div>
      <div class="calib-step-label">${label}</div>
      <div class="calib-step-instruction">${t('calib_step_instruction')}</div>
      <canvas id="calib-graph"></canvas>
      <div class="calib-live-peak" id="calib-live-peak"></div>
      <div class="calib-step-status" id="calib-status">${t('calib_press_ready')}</div>
      <div class="calib-step-actions" id="calib-step-actions">
        <button class="btn-primary btn-calib-ready" id="btn-calib-ready">${t('calib_ready_btn')}</button>
      </div>
    </div>`;

  document.getElementById('btn-calib-ready').onclick = () => activateCalibListening(stepNum);
}

function updateCalibLivePeak(stepNum, g) {
  const el = document.getElementById('calib-live-peak');
  if (!el) return;
  const step = CALIB_STEPS[stepNum - 1];
  el.style.color = step.color;
  el.textContent = t('calib_peak_detected', { g: g.toFixed(1) });
}

function activateCalibListening(stepNum) {
  const btn  = document.getElementById('btn-calib-ready');
  const stat = document.getElementById('calib-status');
  if (btn)  { btn.disabled = true; btn.textContent = t('calib_listening'); }
  if (stat) { stat.textContent = t('calib_detecting'); stat.classList.remove('calib-error'); stat.style.color = ''; }

  const liveEl = document.getElementById('calib-live-peak');
  if (liveEl) liveEl.textContent = '';

  APP.calib.state     = 'listening';
  APP.calib.peakG     = 0;
  APP.calib.triggerAt = null;
  APP.calib.ringEnd   = null;
  APP.calib.graphData = [];
  stopCalibListener();

  clearInterval(APP.calib.graphInterval);
  APP.calib.graphInterval = trackedInterval(drawCalibGraph, 50);

  const TRIG_G = 1.6;
  const RING_G = 1.2;

  APP.calib.listener = (e) => {
    const acc = e.accelerationIncludingGravity;
    if (!acc) return;
    const g = Math.sqrt((acc.x||0)**2 + (acc.y||0)**2 + (acc.z||0)**2) / 9.81;
    const now = Date.now();

    APP.calib.graphData.push(g);
    if (APP.calib.graphData.length > 80) APP.calib.graphData.shift();

    if (!APP.calib.triggerAt && g > TRIG_G) APP.calib.triggerAt = now;

    if (APP.calib.triggerAt) {
      if (g > APP.calib.peakG) {
        APP.calib.peakG = g;
        updateCalibLivePeak(stepNum, g);
      }
      if (g > RING_G)          APP.calib.ringEnd = now;
      if (now - APP.calib.triggerAt > 2000) finishCalibStep(stepNum);
    }
  };

  window.addEventListener('devicemotion', APP.calib.listener, { passive: true });

  APP.calib.captureTimer = trackedTimeout(() => {
    if (APP.calib.state === 'listening') finishCalibStep(stepNum);
  }, 12000);
}

function stopCalibListener() {
  if (APP.calib.listener) {
    window.removeEventListener('devicemotion', APP.calib.listener);
    APP.calib.listener = null;
  }
  clearTimeout(APP.calib.captureTimer);
  clearInterval(APP.calib.graphInterval);
}

// Vuelve a mostrar solo el botón "LISTO" para reintentar el golpe actual sin avanzar de paso
function retryCalibStep(stepNum, message) {
  const stat = document.getElementById('calib-status');
  if (stat) { stat.classList.add('calib-error'); stat.style.color = ''; stat.textContent = message; }
  const actions = document.getElementById('calib-step-actions');
  if (actions) {
    actions.innerHTML = `<button class="btn-primary btn-calib-ready" id="btn-calib-retry">${t('calib_retry_btn')}</button>`;
    document.getElementById('btn-calib-retry').onclick = () => renderCalibStep(stepNum);
  }
}

function finishCalibStep(stepNum) {
  if (APP.calib.state !== 'listening') return;
  APP.calib.state = 'captured';
  stopCalibListener();

  // Ningún golpe cruzó el umbral de disparo durante la ventana de escucha
  if (!APP.calib.triggerAt || !APP.calib.peakG) {
    retryCalibStep(stepNum, t('calib_no_punch'));
    return;
  }

  const peakG  = APP.calib.peakG;
  const ringMs = (APP.calib.triggerAt && APP.calib.ringEnd)
    ? Math.max(60, APP.calib.ringEnd - APP.calib.triggerAt)
    : 120;

  // Validación progresiva: cada golpe debe ser claramente más fuerte que el anterior
  if (stepNum === 2 && peakG <= APP.calib.data[0].peakG * 1.3) {
    retryCalibStep(stepNum, t('calib_err_medium_weak'));
    return;
  }
  if (stepNum === 3 && peakG <= APP.calib.data[1].peakG * 1.3) {
    retryCalibStep(stepNum, t('calib_err_hard_weak'));
    return;
  }

  const step = CALIB_STEPS[stepNum - 1];
  const stat = document.getElementById('calib-status');
  if (stat) {
    stat.classList.remove('calib-error');
    stat.style.color = step.color;
    stat.textContent = `✓ ${t('calib_peak_detected', { g: peakG.toFixed(1) })}`;
  }

  // No se confirma en APP.calib.data hasta que el usuario decida continuar —
  // así "Repetir este golpe" puede descartar la medición sin tocar los pasos previos
  const actions = document.getElementById('calib-step-actions');
  if (actions) {
    actions.innerHTML = `
      <button class="btn-secondary" id="btn-calib-repeat">${t('calib_repeat_punch')}</button>
      <button class="btn-primary btn-calib-ready" id="btn-calib-continue">${stepNum < 3 ? t('calib_next_step') : t('calib_see_results')}</button>`;
    document.getElementById('btn-calib-repeat').onclick = () => renderCalibStep(stepNum);
    document.getElementById('btn-calib-continue').onclick = () => {
      APP.calib.data[stepNum - 1] = { peakG, ringMs };
      stepNum < 3 ? renderCalibStep(stepNum + 1) : showCalibResults();
    };
  }
}

function drawCalibGraph() {
  const canvas = document.getElementById('calib-graph');
  if (!canvas) { clearInterval(APP.calib.graphInterval); return; }
  const dpr  = window.devicePixelRatio || 1;
  const cssW = Math.min(300, (canvas.parentElement?.clientWidth || 300) - 32);
  const cssH = 80;
  canvas.width  = cssW * dpr;
  canvas.height = cssH * dpr;
  canvas.style.width  = cssW + 'px';
  canvas.style.height = cssH + 'px';
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, cssW, cssH);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(0, 0, cssW, cssH);

  const maxG = 15;
  const y12  = cssH - (1.2 / maxG) * cssH;
  ctx.strokeStyle = 'rgba(255,200,0,0.35)';
  ctx.lineWidth   = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath(); ctx.moveTo(0, y12); ctx.lineTo(cssW, y12); ctx.stroke();
  ctx.setLineDash([]);

  const data = APP.calib.graphData;
  if (data.length < 2) return;
  ctx.beginPath();
  data.forEach((g, i) => {
    const x = (i / (data.length - 1)) * cssW;
    const y = cssH - Math.min(1, g / maxG) * cssH;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.strokeStyle = '#FFE000';
  ctx.lineWidth   = 2;
  ctx.lineJoin    = 'round';
  ctx.stroke();
}

function showCalibResults() {
  const data = APP.calib.data;
  if (data.length < 3) return;

  const content = document.getElementById('calib-content');
  content.style.background = '';

  const soft   = data[0].peakG;
  const medium = data[1].peakG;
  const hard   = data[2].peakG;

  // Salvaguarda final: las 3 intensidades deben quedar claramente diferenciadas
  const tooClose = (a, b) => a <= 0 || Math.abs(b - a) / a < 0.15;
  if (tooClose(soft, medium) || tooClose(medium, hard) || tooClose(soft, hard)) {
    content.innerHTML = `
      <div class="calib-results calib-results-error">
        <div class="calib-results-icon">⚠️</div>
        <h3 class="calib-title">${t('calib_err_same_intensity')}</h3>
        <button class="btn-primary btn-calib-ready" id="btn-calib-restart">${t('calib_again')}</button>
      </div>`;
    document.getElementById('btn-calib-restart').onclick = () => {
      APP.calib.data = [];
      renderCalibIntro();
    };
    return;
  }

  const avgRing   = data.reduce((a, d) => a + d.ringMs, 0) / data.length;
  const threshold = Math.round(soft * 0.8 * 100) / 100;
  const debounce  = Math.round(avgRing + 50);

  content.innerHTML = `
    <div class="calib-results">
      <div class="calib-results-icon">✓</div>
      <h3 class="calib-title">${t('calib_results_title')}</h3>
      <div class="calib-result-values">
        <div class="calib-result-row">
          <span class="calib-result-label">${t('calib_result_soft')}</span>
          <span class="calib-result-value" style="color:${CALIB_STEPS[0].color}">${soft.toFixed(1)}G</span>
        </div>
        <div class="calib-result-row">
          <span class="calib-result-label">${t('calib_result_medium')}</span>
          <span class="calib-result-value" style="color:${CALIB_STEPS[1].color}">${medium.toFixed(1)}G</span>
        </div>
        <div class="calib-result-row">
          <span class="calib-result-label">${t('calib_result_hard')}</span>
          <span class="calib-result-value" style="color:${CALIB_STEPS[2].color}">${hard.toFixed(1)}G</span>
        </div>
        <div class="calib-result-row">
          <span class="calib-result-label">${t('calib_result_threshold')}</span>
          <span class="calib-result-value">${threshold.toFixed(2)}G</span>
        </div>
        <div class="calib-result-row">
          <span class="calib-result-label">${t('calib_result_sensitivity')}</span>
          <span class="calib-result-value">${t('calib_ms_debounce', { n: debounce })}</span>
        </div>
      </div>
      <button class="btn-primary btn-calib-ready" id="btn-calib-save">${t('calib_save')}</button>
      <button class="btn-secondary" id="btn-calib-again">${t('calib_again')}</button>
    </div>`;

  document.getElementById('btn-calib-save').onclick = () => {
    saveCalibration(soft, medium, hard, threshold, debounce);
    const notice = document.getElementById('calib-notice');
    if (notice) notice.classList.add('hidden');
    showScreen(APP.calib.fromScreen || 'screen-menu');
    if (APP.calib.fromScreen === 'screen-menu') initMenuScreen();
  };
  document.getElementById('btn-calib-again').onclick = () => {
    APP.calib.data = [];
    renderCalibIntro();
  };
}

// ═══════════════════════════════════════════════════
// MODO COLORES — CONFIG
// ═══════════════════════════════════════════════════
function loadColorConfig() {
  const raw = localStorage.getItem('fkf_color_config');
  if (raw) {
    try { APP.colorConfig = { ...APP.colorConfig, ...JSON.parse(raw) }; } catch(e) {}
  }
}

function saveColorConfig() {
  localStorage.setItem('fkf_color_config', JSON.stringify(APP.colorConfig));
}

function initColorModeConfig() {
  const yEl = document.getElementById('color-label-yellow');
  const rEl = document.getElementById('color-label-red');
  const bEl = document.getElementById('color-label-blue');
  if (yEl) { yEl.value = APP.colorConfig.yellow; yEl.oninput = () => { APP.colorConfig.yellow = yEl.value; saveColorConfig(); }; }
  if (rEl) { rEl.value = APP.colorConfig.red;    rEl.oninput = () => { APP.colorConfig.red    = rEl.value; saveColorConfig(); }; }
  if (bEl) { bEl.value = APP.colorConfig.blue;   bEl.oninput = () => { APP.colorConfig.blue   = bEl.value; saveColorConfig(); }; }

  const btnRandom = document.getElementById('btn-colors-order-random');
  const btnFixed  = document.getElementById('btn-colors-order-fixed');
  const setOrder = (order) => {
    APP.colorConfig.order = order;
    saveColorConfig();
    btnRandom.classList.toggle('active', order === 'random');
    btnFixed.classList.toggle('active',  order === 'fixed');
  };
  setOrder(APP.colorConfig.order || 'random');
  if (btnRandom) btnRandom.onclick = () => setOrder('random');
  if (btnFixed)  btnFixed.onclick  = () => setOrder('fixed');
}

// ═══════════════════════════════════════════════════
// MODO COLORES — ENTRENAMIENTO
// ═══════════════════════════════════════════════════
const COLOR_DEFS = {
  yellow: { hex: '#FFE000', text: '#000000' },
  red:    { hex: '#CC0000', text: '#FFFFFF' },
  blue:   { hex: '#0066CC', text: '#FFFFFF' },
};

function showColorsScreen(roundNum) {
  showScreen('screen-colors');
  document.getElementById('colors-round-indicator').textContent =
    t('round_indicator', { n: roundNum, total: APP.config.rounds });
  updateColorsTimer();

  APP.colorMode.results    = [];
  APP.colorMode.fixedIndex = 0;

  document.getElementById('btn-mute-colors').onclick = toggleSound;
  updateMuteButtons();

  document.getElementById('btn-colors-stop').onclick = () => {
    if (confirm(t('confirm_stop'))) {
      const wasRoundActive = window.IMPACT_SESSION_ACTIVE;
      stopColorsCycle();
      APP.sessionActive = false;
      stopEverything();
      releaseWakeLock();
      hideGlobalXPOverlay();
      if (wasRoundActive) {
        showAbandonPenaltyScreen();
      } else {
        showScreen('screen-menu');
        startHomeParticles();
      }
    }
  };
  setColorsStage(null);
}

function updateColorsTimer() {
  const el = document.getElementById('colors-session-timer');
  if (el) el.textContent = fmtTime(APP.round.secondsLeft);
}

function setColorsStage(colorId, textOverride) {
  const stage  = document.getElementById('colors-stage');
  const textEl = document.getElementById('colors-center-text');
  if (!stage || !textEl) return;
  if (!colorId) {
    stage.style.background  = '#0A0A0A';
    textEl.textContent      = '';
    textEl.style.color      = '#FFFFFF';
    return;
  }
  const def   = COLOR_DEFS[colorId];
  stage.style.background  = def.hex;
  textEl.textContent      = textOverride !== undefined ? textOverride : (APP.colorConfig[colorId] || colorId.toUpperCase());
  textEl.style.color      = def.text;
}

function startColorsWait() {
  if (APP.round.secondsLeft <= 0) return;
  APP.colorMode.state = 'wait';
  APP.hitWindowActive = false;
  setColorsStage(null);
  const pauseMs = APP.comboConfig.pauseBetween * 1000;
  APP.colorMode.waitTimeout = trackedTimeout(() => {
    if (APP.round.secondsLeft > 0) showColorsStimulus();
  }, pauseMs);
}

function getNextColor() {
  const colors = ['yellow', 'red', 'blue'];
  if (APP.colorConfig.order === 'fixed') {
    return colors[(APP.colorMode.fixedIndex++) % 3];
  }
  return colors[Math.floor(Math.random() * 3)];
}

function showColorsStimulus() {
  if (APP.round.secondsLeft <= 0) return;
  const colorId = getNextColor();
  APP.colorMode.currentColor = colorId;
  APP.colorMode.state        = 'active';
  APP.hitWindowActive        = true;
  APP.colorMode.stimulusAt   = Date.now();

  setColorsStage(colorId);
  vibrate([25]);
  playBeep(660, 0.06);

  const exposureMs = 1000 + Math.random() * 2000;
  APP.colorMode.missTimeout = trackedTimeout(() => {
    if (APP.colorMode.state === 'active') missColors();
  }, exposureMs);
}

function missColors() {
  clearTimeout(APP.colorMode.missTimeout);
  APP.colorMode.state = 'miss';
  APP.hitWindowActive = false;
  APP.round.misses++;

  const stage  = document.getElementById('colors-stage');
  const textEl = document.getElementById('colors-center-text');
  if (stage)  stage.style.background = '#1a0000';
  if (textEl) { textEl.textContent = '✗'; textEl.style.color = '#FF5555'; }

  vibrate([80]);
  playPenaltySound();

  trackedTimeout(() => {
    if (APP.round.secondsLeft > 0) startColorsWait();
  }, 800);
}

function handleColorsPunch(punch) {
  if (APP.colorMode.state !== 'active') return;
  APP.hitWindowActive = false;
  clearTimeout(APP.colorMode.missTimeout);
  const reactionMs = Date.now() - APP.colorMode.stimulusAt;
  APP.colorMode.state = 'result';
  APP.round.hits++;
  APP.round.punches.push(punch);
  APP.round.reactionTimes.push(reactionMs);

  APP.colorMode.results.push({ color: APP.colorMode.currentColor, reactionMs, power: punch.g });

  const def = COLOR_DEFS[APP.colorMode.currentColor];
  const textEl = document.getElementById('colors-center-text');
  if (textEl) { textEl.textContent = reactionMs + 'ms'; textEl.style.color = def.text; }

  vibrate([20, 20, 20]);

  trackedTimeout(() => {
    if (APP.round.secondsLeft > 0) startColorsWait();
  }, 900);
}

function stopColorsCycle() {
  clearTimeout(APP.colorMode.waitTimeout);
  clearTimeout(APP.colorMode.missTimeout);
  APP.colorMode.state = 'idle';
}

document.addEventListener('DOMContentLoaded', init);

// ═══════════════════════════════════════════════════
// PARTE 2 — VISUAL EFFECTS
// ═══════════════════════════════════════════════════

function getReactionCircleCenter() {
  const wrap = document.querySelector('.rsc-circle-wrap');
  if (!wrap) return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  const r = wrap.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

function spawnConvergeParticles(cx, cy, duration) {
  const canvas = document.getElementById('hit-particle-canvas');
  if (!canvas) return;
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  const ctx = canvas.getContext('2d');
  const particles = Array.from({ length: _fxParticleCount(14) }, () => {
    const angle = Math.random() * Math.PI * 2;
    const dist  = 100 + Math.random() * 100;
    return { angle, startDist: dist, r: 2 + Math.random() * 3 };
  });
  const totalFrames = Math.max(1, Math.round(duration / 16.67));
  let frame = 0;
  const tick = () => {
    if (_fxPaused) { trackedRAF(tick); return; }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const t = frame / totalFrames;
    particles.forEach(p => {
      const dist = p.startDist * (1 - t);
      const x = cx + Math.cos(p.angle) * dist;
      const y = cy + Math.sin(p.angle) * dist;
      ctx.globalAlpha = 0.25 + t * 0.65;
      ctx.fillStyle = '#FFD300';
      ctx.beginPath(); ctx.arc(x, y, p.r, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1;
    frame++;
    if (frame < totalFrames) trackedRAF(tick);
    else ctx.clearRect(0, 0, canvas.width, canvas.height);
  };
  tick();
}

function showHitRays() {
  const W = window.innerWidth, H = window.innerHeight;
  const cx = W / 2, cy = H / 2;
  [[0, 0], [W, 0], [0, H], [W, H]].forEach(([x, y]) => {
    const angle = Math.atan2(cy - y, cx - x) * 180 / Math.PI;
    const ray = document.createElement('div');
    ray.className = 'hit-ray';
    ray.style.left = x + 'px';
    ray.style.top  = y + 'px';
    ray.style.setProperty('--ray-rot', angle + 'deg');
    document.body.appendChild(ray);
    trackedTimeout(() => ray.remove(), 400);
  });
}

function showHitRings() {
  const wrap = document.querySelector('.rsc-circle-wrap');
  if (!wrap) return;
  [0, 100, 200].forEach(delay => {
    trackedTimeout(() => {
      const ring = document.createElement('div');
      ring.className = 'hit-ring';
      wrap.appendChild(ring);
      trackedTimeout(() => ring.remove(), 700);
    }, delay);
  });
}

const IMPACT_WORDS = ['POW!', 'BAM!', 'WHAM!', 'CRACK!'];
function showImpactText(color) {
  const el = document.createElement('div');
  el.className = 'impact-text';
  el.textContent = IMPACT_WORDS[Math.floor(Math.random() * IMPACT_WORDS.length)];
  const rot = (Math.random() * 30 - 15).toFixed(1);
  el.style.color = color;
  el.style.textShadow = `0 0 14px ${color}, 0 0 40px ${color}`;
  el.style.top  = (15 + Math.random() * 55) + 'vh';
  el.style.left = (12 + Math.random() * 60) + 'vw';
  el.style.setProperty('--rot', rot + 'deg');
  document.body.appendChild(el);
  trackedTimeout(() => el.remove(), 500);
}

function applyTierScreenEffect(tier) {
  switch (tier.label) {
    case 'GREAT':      showEdgeWave(); showImpactText(tier.color); break;
    case 'EXCELLENT':  showBorderFlash(false); showImpactText(tier.color); break;
    case 'MASTER':     showBorderFlash(true); showImpactText(tier.color); break;
    case 'SIFU LEVEL': showBorderFlash(true); showSifuCenterText(); showImpactText(tier.color); break;
  }
}

function showEdgeWave() {
  ['top','bottom','left','right'].forEach(side => {
    const el = document.createElement('div');
    el.className = 'edge-wave edge-wave-' + side;
    document.body.appendChild(el);
    trackedTimeout(() => el.remove(), 600);
  });
}

function showBorderFlash(isMaster) {
  const el = document.createElement('div');
  el.className = 'border-flash-overlay' + (isMaster ? ' bf-master' : '');
  document.body.appendChild(el);
  trackedTimeout(() => el.remove(), 600);
}

function showSifuCenterText() {
  const el = document.createElement('div');
  el.className = 'sifu-center-text';
  el.textContent = '⚡ SIFU LEVEL ⚡';
  document.body.appendChild(el);
  trackedTimeout(() => el.remove(), 1500);
}
