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

  // 1. Sonidos: parar la música de menús y suspender el AudioContext compartido.
  //    La música se para explícitamente: suspender el contexto sólo la pausa,
  //    y volvería a sonar en cuanto cualquier SFX del round lo reanude.
  stopMenuMusic();
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
  //    los flags internos de cada sistema para que puedan reiniciarse después.
  //    El fondo global (#bg-particles) queda fuera a propósito: corre con RAF
  //    sin trackear y no debe pararse nunca, se ve en todas las pantallas.
  window.IMPACT_RAFS.forEach(id => cancelAnimationFrame(id));
  window.IMPACT_RAFS = [];
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
    wait_hits:            '{n} GOLPES',
    wait_max_time:        '{t}s MÁXIMO',
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
    calib_existing_title: '✓ Ya tienes una calibración guardada',
    calib_current_title:  'CALIBRACIÓN ACTUAL',
    calib_cur_threshold:  'Umbral detección',
    calib_cur_debounce:   'Debounce',
    calib_existing_date:  'Fecha',
    calib_use_existing:   '✓ USAR ESTA CALIBRACIÓN',
    calib_recalibrate:    '🔄 RECALIBRAR',
    calib_notice:         'Calibra tu dispositivo para mayor precisión',
    calib_notice_btn:     'CALIBRAR',
    calib_peak_detected:  'Golpe detectado: {g}G',
    calib_repeat_punch:   'REPETIR ESTE GOLPE',
    calib_no_punch:       'No se detectó golpe. Intenta de nuevo.',
    calib_retry_btn:      'REINTENTAR',
    calib_sensor_live:    'Sensor: {g}G',
    calib_sensor_ok:      '✓ Sensor activo — Golpea ahora',
    calib_sensor_off:     '⚠️ Sensor no disponible',
    calib_tap_fallback:   'Mi móvil no detecta — usar toque',
    calib_tap_used:       'Golpe simulado con toque: {g}G',
    calib_result_soft:    'Golpe suave detectado',
    calib_result_medium:  'Golpe medio detectado',
    calib_result_hard:    'Golpe fuerte detectado',
    calib_result_threshold: 'Umbral configurado',
    calib_result_sensitivity: 'Sensibilidad',
    calib_ms_debounce:    '{n} ms debounce',
    calib_manual_title:   'AJUSTE MANUAL',
    calib_manual_label:   'SENSIBILIDAD: {g}G',
    calib_manual_desc:    'Menor valor = más sensible',
    home_calib_status_yes: '✓ Calibración guardada — {date}',
    home_calib_status_no: '⚠️ Sin calibrar — toca para calibrar',
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
    // — textos que antes estaban fijos en español —
    last_punch:              'ÚLTIMO GOLPE',
    personal_record:         'RÉCORD PERSONAL',
    vs_yesterday:            'VS AYER',
    btn_calibrate:           'CALIBRAR',
    nav_home:                'INICIO',
    nav_ranking:             'Ranking',
    speed_title:             'VELOCIDAD',
    global_ranking_soon:     'RANKING GLOBAL — PRÓXIMAMENTE',
    you:                     'Tú',
    auth_create_account:     'CREAR CUENTA',
    auth_have_account:       'YA TENGO CUENTA',
    auth_full_name:          'NOMBRE COMPLETO',
    auth_full_name_ph:       'Tu nombre completo',
    auth_email:              'EMAIL',
    auth_password:           'CONTRASEÑA',
    auth_password_min:       'CONTRASEÑA (mín. 6 caracteres)',
    auth_sport:              'DEPORTE / DISCIPLINA (opcional)',
    auth_sport_ph:           'Boxeo, Kickboxing...',
    auth_already:            '¿Ya tienes cuenta?',
    auth_login_link:         'Inicia sesión',
    auth_login_btn:          'ENTRAR',
    auth_no_account:         '¿No tienes cuenta?',
    auth_register_link:      'Regístrate',
    auth_forgot:             'Olvidé mi contraseña',
    auth_creating:           'CREANDO...',
    auth_entering:           'ENTRANDO...',
    auth_err_name:           'Ingresa tu nombre completo',
    auth_err_email:          'Email inválido',
    auth_err_password:       'La contraseña debe tener al menos 6 caracteres',
    auth_err_weight:         'Peso inválido (30-200 kg)',
    auth_err_age:            'Edad inválida (10-100)',
    auth_err_create:         'Error al crear la cuenta',
    auth_err_send:           'Error al enviar el email',
    auth_err_enter_email:    'Ingresa tu email',
    auth_err_enter_pass:     'Ingresa tu contraseña',
    auth_err_credentials:    'Email o contraseña incorrectos',
    auth_check_email:        'Revisa tu email para confirmar tu cuenta',
    auth_email_sent:         'Email enviado. Revisa tu bandeja de entrada.',
    change_photo:            'Cambiar foto',
    logout:                  'CERRAR SESIÓN',
    training_type:           'TIPO DE ENTRENAMIENTO',
    submode_simple_desc:     'Señal → 1 golpe → mide reacción',
    submode_combo_desc:      'Señal → serie de golpes',
    time_left:               'TIEMPO RESTANTE',
    combo_duration:          'DURACIÓN COMBO',
    verdict_fail:            'FALLO',
    result_completed:        'COMPLETADO',
    result_incomplete:       'INCOMPLETO',
    result_no_reaction:      'SIN REACCIÓN',
    next_signal_in:          'Siguiente señal en {s}s',
    next_signal_soon:        'Siguiente señal en breve...',
    start_now:               '¡Empieza ahora!',
    best_combo:              'MEJOR COMBO',
    total_time:              'TIEMPO TOTAL',
    measure_my_punch:        'MEDIR MI GOLPE',
    measure_calib_desc:      'Primer uso o nuevo dispositivo',
    mode_power_title:        'MODO POTENCIA',
    measure_power_desc:      'Mide la fuerza de tu golpe',
    cancel:                  'Cancelar',
    penalty_rest:            '¡DESCANSA!',
    penalty_wait_signal:     '¡ESPERA LA SEÑAL!',
    penalty_too_soon:        '¡DEMASIADO PRONTO!',
    new_record_overlay:      '🏆 ¡NUEVO RÉCORD!',
    max_level:               'NIVEL MÁXIMO',
    // — notas de sesión y colores por defecto —
    grade_s:                 'LEGENDARIO',
    grade_a:                 'MAESTRO',
    grade_b:                 'GUERRERO',
    grade_c:                 'PRACTICANTE',
    color_yellow:            'AMARILLO',
    color_red:               'ROJO',
    color_blue:              'AZUL',
    // — resumen de configuración y XP de sesión —
    min_per_round:           'MIN/RD',
    min_total:               'MIN TOTAL',
    xp_earned_session:       'XP GANADO EN ESTA SESIÓN',
    level_up_to:             '⬆ SUBISTE A {n}',
    // — nivel numerado —
    level_n:                 'NIVEL {n}',
    // — botones del quiz —
    quiz_skip:               'Saltar',
    quiz_back:               '← Atrás',
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
    wait_hits:            '{n} HITS',
    wait_max_time:        '{t}s MAX',
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
    calib_existing_title: '✓ You already have a saved calibration',
    calib_current_title:  'CURRENT CALIBRATION',
    calib_cur_threshold:  'Detection threshold',
    calib_cur_debounce:   'Debounce',
    calib_existing_date:  'Date',
    calib_use_existing:   '✓ USE THIS CALIBRATION',
    calib_recalibrate:    '🔄 RECALIBRATE',
    calib_notice:         'Calibrate your device for better precision',
    calib_notice_btn:     'CALIBRATE',
    calib_peak_detected:  'Punch detected: {g}G',
    calib_repeat_punch:   'REPEAT THIS PUNCH',
    calib_no_punch:       'No punch detected. Try again.',
    calib_retry_btn:      'RETRY',
    calib_sensor_live:    'Sensor: {g}G',
    calib_sensor_ok:      '✓ Sensor active — Punch now',
    calib_sensor_off:     '⚠️ Sensor not available',
    calib_tap_fallback:   'My phone does not detect — use tap',
    calib_tap_used:       'Punch simulated with tap: {g}G',
    calib_result_soft:    'Soft punch detected',
    calib_result_medium:  'Medium punch detected',
    calib_result_hard:    'Hard punch detected',
    calib_result_threshold: 'Configured threshold',
    calib_result_sensitivity: 'Sensitivity',
    calib_ms_debounce:    '{n} ms debounce',
    calib_manual_title:   'MANUAL ADJUSTMENT',
    calib_manual_label:   'SENSITIVITY: {g}G',
    calib_manual_desc:    'Lower value = more sensitive',
    home_calib_status_yes: '✓ Calibration saved — {date}',
    home_calib_status_no: '⚠️ Not calibrated — tap to calibrate',
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
    // — textos que antes estaban fijos en español —
    last_punch:              'LAST PUNCH',
    personal_record:         'PERSONAL RECORD',
    vs_yesterday:            'VS YESTERDAY',
    btn_calibrate:           'CALIBRATE',
    nav_home:                'Home',
    nav_ranking:             'Ranking',
    speed_title:             'SPEED',
    global_ranking_soon:     'GLOBAL RANKING — COMING SOON',
    you:                     'You',
    auth_create_account:     'CREATE ACCOUNT',
    auth_have_account:       'I ALREADY HAVE AN ACCOUNT',
    auth_full_name:          'FULL NAME',
    auth_full_name_ph:       'Your full name',
    auth_email:              'EMAIL',
    auth_password:           'PASSWORD',
    auth_password_min:       'PASSWORD (min. 6 characters)',
    auth_sport:              'SPORT / DISCIPLINE (optional)',
    auth_sport_ph:           'Boxing, Kickboxing...',
    auth_already:            'Already have an account?',
    auth_login_link:         'Log in',
    auth_login_btn:          'LOG IN',
    auth_no_account:         'No account yet?',
    auth_register_link:      'Sign up',
    auth_forgot:             'I forgot my password',
    auth_creating:           'CREATING...',
    auth_entering:           'LOGGING IN...',
    auth_err_name:           'Enter your full name',
    auth_err_email:          'Invalid email',
    auth_err_password:       'The password must be at least 6 characters',
    auth_err_weight:         'Invalid weight (30-200 kg)',
    auth_err_age:            'Invalid age (10-100)',
    auth_err_create:         'Could not create the account',
    auth_err_send:           'Could not send the email',
    auth_err_enter_email:    'Enter your email',
    auth_err_enter_pass:     'Enter your password',
    auth_err_credentials:    'Wrong email or password',
    auth_check_email:        'Check your email to confirm your account',
    auth_email_sent:         'Email sent. Check your inbox.',
    change_photo:            'Change photo',
    logout:                  'LOG OUT',
    training_type:           'TRAINING TYPE',
    submode_simple_desc:     'Signal → 1 punch → measures reaction',
    submode_combo_desc:      'Signal → series of punches',
    time_left:               'TIME LEFT',
    combo_duration:          'COMBO DURATION',
    verdict_fail:            'FAIL',
    result_completed:        'COMPLETED',
    result_incomplete:       'INCOMPLETE',
    result_no_reaction:      'NO REACTION',
    next_signal_in:          'Next signal in {s}s',
    next_signal_soon:        'Next signal shortly...',
    start_now:               'Start now!',
    best_combo:              'BEST COMBO',
    total_time:              'TOTAL TIME',
    measure_my_punch:        'MEASURE MY PUNCH',
    measure_calib_desc:      'First use or new device',
    mode_power_title:        'POWER MODE',
    measure_power_desc:      'Measure the force of your punch',
    cancel:                  'Cancel',
    penalty_rest:            'REST!',
    penalty_wait_signal:     'WAIT FOR THE SIGNAL!',
    penalty_too_soon:        'TOO SOON!',
    new_record_overlay:      '🏆 NEW RECORD!',
    max_level:               'MAX LEVEL',
    // — notas de sesión y colores por defecto —
    grade_s:                 'LEGENDARY',
    grade_a:                 'MASTER',
    grade_b:                 'WARRIOR',
    grade_c:                 'PRACTITIONER',
    color_yellow:            'YELLOW',
    color_red:               'RED',
    color_blue:              'BLUE',
    // — resumen de configuración y XP de sesión —
    min_per_round:           'MIN/RD',
    min_total:               'TOTAL MIN',
    xp_earned_session:       'XP EARNED THIS SESSION',
    level_up_to:             '⬆ YOU REACHED {n}',
    // — nivel numerado —
    level_n:                 'LEVEL {n}',
    // — botones del quiz —
    quiz_skip:               'Skip',
    quiz_back:               '← Back',
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
    wait_hits:            '{n} GOLPES',
    wait_max_time:        '{t}s MÁXIMO',
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
    calib_existing_title: '✓ Você já tem uma calibração salva',
    calib_current_title:  'CALIBRAÇÃO ATUAL',
    calib_cur_threshold:  'Limiar de detecção',
    calib_cur_debounce:   'Debounce',
    calib_existing_date:  'Data',
    calib_use_existing:   '✓ USAR ESTA CALIBRAÇÃO',
    calib_recalibrate:    '🔄 RECALIBRAR',
    calib_notice:         'Calibre seu dispositivo para maior precisão',
    calib_notice_btn:     'CALIBRAR',
    calib_peak_detected:  'Soco detectado: {g}G',
    calib_repeat_punch:   'REPETIR ESTE SOCO',
    calib_no_punch:       'Nenhum soco detectado. Tente novamente.',
    calib_retry_btn:      'TENTAR NOVAMENTE',
    calib_sensor_live:    'Sensor: {g}G',
    calib_sensor_ok:      '✓ Sensor ativo — Bata agora',
    calib_sensor_off:     '⚠️ Sensor não disponível',
    calib_tap_fallback:   'Meu celular não detecta — usar toque',
    calib_tap_used:       'Soco simulado com toque: {g}G',
    calib_result_soft:    'Soco leve detectado',
    calib_result_medium:  'Soco médio detectado',
    calib_result_hard:    'Soco forte detectado',
    calib_result_threshold: 'Limiar configurado',
    calib_result_sensitivity: 'Sensibilidade',
    calib_ms_debounce:    '{n} ms debounce',
    calib_manual_title:   'AJUSTE MANUAL',
    calib_manual_label:   'SENSIBILIDADE: {g}G',
    calib_manual_desc:    'Menor valor = mais sensível',
    home_calib_status_yes: '✓ Calibração salva — {date}',
    home_calib_status_no: '⚠️ Sem calibrar — toque para calibrar',
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
    // — textos que antes estaban fijos en español —
    last_punch:              'ÚLTIMO GOLPE',
    personal_record:         'RECORDE PESSOAL',
    vs_yesterday:            'VS ONTEM',
    btn_calibrate:           'CALIBRAR',
    nav_home:                'Início',
    nav_ranking:             'Ranking',
    speed_title:             'VELOCIDADE',
    global_ranking_soon:     'RANKING GLOBAL — EM BREVE',
    you:                     'Você',
    auth_create_account:     'CRIAR CONTA',
    auth_have_account:       'JÁ TENHO CONTA',
    auth_full_name:          'NOME COMPLETO',
    auth_full_name_ph:       'Seu nome completo',
    auth_email:              'EMAIL',
    auth_password:           'SENHA',
    auth_password_min:       'SENHA (mín. 6 caracteres)',
    auth_sport:              'ESPORTE / DISCIPLINA (opcional)',
    auth_sport_ph:           'Boxe, Kickboxing...',
    auth_already:            'Já tem conta?',
    auth_login_link:         'Entrar',
    auth_login_btn:          'ENTRAR',
    auth_no_account:         'Não tem conta?',
    auth_register_link:      'Cadastre-se',
    auth_forgot:             'Esqueci minha senha',
    auth_creating:           'CRIANDO...',
    auth_entering:           'ENTRANDO...',
    auth_err_name:           'Digite seu nome completo',
    auth_err_email:          'Email inválido',
    auth_err_password:       'A senha deve ter pelo menos 6 caracteres',
    auth_err_weight:         'Peso inválido (30-200 kg)',
    auth_err_age:            'Idade inválida (10-100)',
    auth_err_create:         'Erro ao criar a conta',
    auth_err_send:           'Erro ao enviar o email',
    auth_err_enter_email:    'Digite seu email',
    auth_err_enter_pass:     'Digite sua senha',
    auth_err_credentials:    'Email ou senha incorretos',
    auth_check_email:        'Verifique seu email para confirmar a conta',
    auth_email_sent:         'Email enviado. Verifique sua caixa de entrada.',
    change_photo:            'Trocar foto',
    logout:                  'SAIR',
    training_type:           'TIPO DE TREINO',
    submode_simple_desc:     'Sinal → 1 golpe → mede a reação',
    submode_combo_desc:      'Sinal → série de golpes',
    time_left:               'TEMPO RESTANTE',
    combo_duration:          'DURAÇÃO DO COMBO',
    verdict_fail:            'FALHA',
    result_completed:        'COMPLETO',
    result_incomplete:       'INCOMPLETO',
    result_no_reaction:      'SEM REAÇÃO',
    next_signal_in:          'Próximo sinal em {s}s',
    next_signal_soon:        'Próximo sinal em breve...',
    start_now:               'Comece agora!',
    best_combo:              'MELHOR COMBO',
    total_time:              'TEMPO TOTAL',
    measure_my_punch:        'MEDIR MEU GOLPE',
    measure_calib_desc:      'Primeiro uso ou novo dispositivo',
    mode_power_title:        'MODO POTÊNCIA',
    measure_power_desc:      'Meça a força do seu golpe',
    cancel:                  'Cancelar',
    penalty_rest:            'DESCANSE!',
    penalty_wait_signal:     'ESPERE O SINAL!',
    penalty_too_soon:        'CEDO DEMAIS!',
    new_record_overlay:      '🏆 NOVO RECORDE!',
    max_level:               'NÍVEL MÁXIMO',
    // — notas de sesión y colores por defecto —
    grade_s:                 'LENDÁRIO',
    grade_a:                 'MESTRE',
    grade_b:                 'GUERREIRO',
    grade_c:                 'PRATICANTE',
    color_yellow:            'AMARELO',
    color_red:               'VERMELHO',
    color_blue:              'AZUL',
    // — resumen de configuración y XP de sesión —
    min_per_round:           'MIN/RD',
    min_total:               'MIN TOTAL',
    xp_earned_session:       'XP GANHO NESTA SESSÃO',
    level_up_to:             '⬆ VOCÊ SUBIU PARA {n}',
    // — nivel numerado —
    level_n:                 'NÍVEL {n}',
    // — botones del quiz —
    quiz_skip:               'Pular',
    quiz_back:               '← Voltar',
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
    wait_hits:            '{n} SCHLÄGE',
    wait_max_time:        '{t}s MAXIMUM',
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
    calib_existing_title: '✓ Du hast bereits eine gespeicherte Kalibrierung',
    calib_current_title:  'AKTUELLE KALIBRIERUNG',
    calib_cur_threshold:  'Erkennungsschwelle',
    calib_cur_debounce:   'Debounce',
    calib_existing_date:  'Datum',
    calib_use_existing:   '✓ DIESE KALIBRIERUNG NUTZEN',
    calib_recalibrate:    '🔄 NEU KALIBRIEREN',
    calib_notice:         'Kalibriere dein Gerät für bessere Präzision',
    calib_notice_btn:     'KALIBRIEREN',
    calib_peak_detected:  'Schlag erkannt: {g}G',
    calib_repeat_punch:   'SCHLAG WIEDERHOLEN',
    calib_no_punch:       'Kein Schlag erkannt. Versuche es erneut.',
    calib_retry_btn:      'ERNEUT VERSUCHEN',
    calib_sensor_live:    'Sensor: {g}G',
    calib_sensor_ok:      '✓ Sensor aktiv — Schlag jetzt',
    calib_sensor_off:     '⚠️ Sensor nicht verfügbar',
    calib_tap_fallback:   'Mein Handy erkennt nichts — Tippen verwenden',
    calib_tap_used:       'Schlag per Tippen simuliert: {g}G',
    calib_result_soft:    'Leichter Schlag erkannt',
    calib_result_medium:  'Mittlerer Schlag erkannt',
    calib_result_hard:    'Harter Schlag erkannt',
    calib_result_threshold: 'Eingestellter Schwellenwert',
    calib_result_sensitivity: 'Empfindlichkeit',
    calib_ms_debounce:    '{n} ms Entprellzeit',
    calib_manual_title:   'MANUELLE EINSTELLUNG',
    calib_manual_label:   'EMPFINDLICHKEIT: {g}G',
    calib_manual_desc:    'Kleinerer Wert = empfindlicher',
    home_calib_status_yes: '✓ Kalibrierung gespeichert — {date}',
    home_calib_status_no: '⚠️ Nicht kalibriert — zum Kalibrieren tippen',
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
    // — textos que antes estaban fijos en español —
    last_punch:              'LETZTER SCHLAG',
    personal_record:         'PERSÖNLICHER REKORD',
    vs_yesterday:            'VS GESTERN',
    btn_calibrate:           'KALIBRIEREN',
    nav_home:                'Start',
    nav_ranking:             'Ranking',
    speed_title:             'GESCHWINDIGKEIT',
    global_ranking_soon:     'GLOBALES RANKING — DEMNÄCHST',
    you:                     'Du',
    auth_create_account:     'KONTO ERSTELLEN',
    auth_have_account:       'ICH HABE BEREITS EIN KONTO',
    auth_full_name:          'VOLLSTÄNDIGER NAME',
    auth_full_name_ph:       'Dein vollständiger Name',
    auth_email:              'E-MAIL',
    auth_password:           'PASSWORT',
    auth_password_min:       'PASSWORT (mind. 6 Zeichen)',
    auth_sport:              'SPORTART / DISZIPLIN (optional)',
    auth_sport_ph:           'Boxen, Kickboxen...',
    auth_already:            'Schon ein Konto?',
    auth_login_link:         'Anmelden',
    auth_login_btn:          'ANMELDEN',
    auth_no_account:         'Noch kein Konto?',
    auth_register_link:      'Registrieren',
    auth_forgot:             'Passwort vergessen',
    auth_creating:           'WIRD ERSTELLT...',
    auth_entering:           'ANMELDUNG...',
    auth_err_name:           'Gib deinen vollständigen Namen ein',
    auth_err_email:          'Ungültige E-Mail',
    auth_err_password:       'Das Passwort muss mindestens 6 Zeichen haben',
    auth_err_weight:         'Ungültiges Gewicht (30-200 kg)',
    auth_err_age:            'Ungültiges Alter (10-100)',
    auth_err_create:         'Konto konnte nicht erstellt werden',
    auth_err_send:           'E-Mail konnte nicht gesendet werden',
    auth_err_enter_email:    'Gib deine E-Mail ein',
    auth_err_enter_pass:     'Gib dein Passwort ein',
    auth_err_credentials:    'E-Mail oder Passwort falsch',
    auth_check_email:        'Prüfe deine E-Mails, um dein Konto zu bestätigen',
    auth_email_sent:         'E-Mail gesendet. Prüfe deinen Posteingang.',
    change_photo:            'Foto ändern',
    logout:                  'ABMELDEN',
    training_type:           'TRAININGSART',
    submode_simple_desc:     'Signal → 1 Schlag → misst die Reaktion',
    submode_combo_desc:      'Signal → Schlagserie',
    time_left:               'VERBLEIBENDE ZEIT',
    combo_duration:          'COMBO-DAUER',
    verdict_fail:            'FEHLER',
    result_completed:        'ABGESCHLOSSEN',
    result_incomplete:       'UNVOLLSTÄNDIG',
    result_no_reaction:      'KEINE REAKTION',
    next_signal_in:          'Nächstes Signal in {s}s',
    next_signal_soon:        'Nächstes Signal gleich...',
    start_now:               'Jetzt loslegen!',
    best_combo:              'BESTES COMBO',
    total_time:              'GESAMTZEIT',
    measure_my_punch:        'MEINEN SCHLAG MESSEN',
    measure_calib_desc:      'Erste Nutzung oder neues Gerät',
    mode_power_title:        'KRAFT-MODUS',
    measure_power_desc:      'Miss die Kraft deines Schlags',
    cancel:                  'Abbrechen',
    penalty_rest:            'PAUSE!',
    penalty_wait_signal:     'WARTE AUF DAS SIGNAL!',
    penalty_too_soon:        'ZU FRÜH!',
    new_record_overlay:      '🏆 NEUER REKORD!',
    max_level:               'MAX. STUFE',
    // — notas de sesión y colores por defecto —
    grade_s:                 'LEGENDÄR',
    grade_a:                 'MEISTER',
    grade_b:                 'KRIEGER',
    grade_c:                 'ÜBENDER',
    color_yellow:            'GELB',
    color_red:               'ROT',
    color_blue:              'BLAU',
    // — resumen de configuración y XP de sesión —
    min_per_round:           'MIN/RD',
    min_total:               'MIN GESAMT',
    xp_earned_session:       'XP IN DIESER SESSION',
    level_up_to:             '⬆ AUFGESTIEGEN ZU {n}',
    // — nivel numerado —
    level_n:                 'STUFE {n}',
    // — botones del quiz —
    quiz_skip:               'Überspringen',
    quiz_back:               '← Zurück',
  },
  ja: {
    profile_subtitle:     'プロフィールを設定して開始',
    name:                 '名前',
    weight:               '体重 (kg)',
    age:                  '年齢',
    sex:                  '性別',
    male:                 '♂ 男性',
    female:               '♀ 女性',
    save_continue:        '保存して続ける',
    name_placeholder:     'あなたの名前',
    weight_placeholder:   '70',
    age_placeholder:      '25',
    training_mode:        'トレーニング',
    training_desc:        'ラウンドごとにスピードとパワーを測定',
    combo_mode:           'リアクションモード',
    combo_desc:           'リアクションタイム付きのコンボ',
    rounds_label:         'ラウンド数',
    round_duration_label: 'ラウンドの長さ',
    rest_duration_label:  'ラウンド間の休憩',
    config_start:         'トレーニング開始',
    config_summary:       '{r} ラウンド · {rd} 分 · 休憩 {rst}秒 · 合計 約{total} 分',
    val_rounds:           '{n} ラウンド',
    val_round_duration:   '{n} 分',
    val_rest_duration:    '{n} 秒',
    combo_hits_label:     'コンボあたりのパンチ数',
    combo_duration_label: 'コンボ最大時間',
    combo_pause_label:    '合図の間隔',
    combo_mode_label:     'モード',
    mode_fixed:           '固定',
    mode_random:          'ランダム',
    nav_profile:          'プロフィール',
    nav_train:            'トレーニング',
    nav_history:          '履歴',
    ios_permission_text:  'iOSでは加速度センサーの許可が必要です',
    ios_permission_btn:   '🎯 モーションセンサーを有効化',
    ios_granted:          '✓ センサー有効',
    ios_denied:           '✗ 許可が拒否されました — パンチを検出できません',
    round_indicator:      'ラウンド {n}/{total}',
    punches:              'パンチ',
    wait_hits:            '{n} パンチ',
    wait_max_time:        '最大 {t}秒',
    speed_label:          'スピード m/s',
    power_label:          'パワー',
    best_punch:           'ベストパンチ',
    chart_last10:         '直近10発のパンチ (G)',
    rest_title:           '休憩',
    next_round:           '次: ラウンド {n}',
    skip_rest:            '休憩をスキップ',
    avg_power_rest:       '平均パワー',
    session_complete:     'セッション完了',
    mode_training:        '🥊 トレーニング',
    mode_combo:           '⚡ リアクションモード',
    rounds_completed:     'ラウンド',
    total_punches:        '総パンチ数',
    avg_power_s:          '平均パワー',
    max_power_s:          '最大パワー',
    avg_speed_s:          '平均スピード',
    max_speed_s:          '最高スピード',
    avg_reaction_s:       '平均リアクション',
    best_reaction_s:      'ベストリアクション',
    hits_s:               'コンボ成功',
    misses_s:             'コンボ失敗',
    duration_s:           '時間',
    calories_s:           '推定カロリー',
    save_session:         'セッションを保存',
    back_menu:            'メニューに戻る',
    session_saved_txt:    '✓ 保存しました',
    cal_warmup:           'いいウォームアップ! 💪',
    cal_good:             '素晴らしいトレーニング! 🔥',
    cal_elite:            'エリート級のセッション! 🏆',
    vs_previous:          '前回との比較: ',
    diff_punches_up:      '↑ +{n} パンチ',
    diff_punches_down:    '↓ {n} パンチ',
    diff_power_up:        '↑ +{n}G パワー',
    diff_power_down:      '↓ {n}G パワー',
    diff_reaction_faster: '↑ {n}ms 速い',
    diff_reaction_slower: '↓ {n}ms 遅い',
    stats_title:          '統計',
    records_title:        '🏆 歴代記録',
    best_reaction_rec:    'ベストリアクション',
    best_power_rec:       '最高パワー',
    most_punches_rec:     '最多パンチ数',
    totals_title:         '合計',
    total_sessions:       'セッション数',
    total_punches_h:      '総パンチ数',
    total_calories_h:     '総カロリー',
    power_chart_title:    '平均パワー (直近10)',
    reaction_chart_title: 'リアクションタイム (直近10)',
    calories_chart_title: 'セッションごとのカロリー (直近10)',
    no_sessions:          'まだセッションがありません 🥊',
    hist_empty_title:     'まだセッションがありません。トレーニングを始めましょう!',
    rank_empty_title:     'ランキングに載るにはセッションを完了してください',
    settings_title:       '設定',
    language_label:       '言語',
    save_settings:        '保存',
    alert_enter_name:     '名前を入力してください',
    alert_weight:         '有効な体重を入力してください (30〜200 kg)',
    alert_age:            '有効な年齢を入力してください (10〜100)',
    alert_weight_s:       '体重が無効です',
    alert_age_s:          '年齢が無効です',
    confirm_stop:         'セッションを中止しますか?',
    abandon_penalty_title: '⚠️ セッション中止',
    rank_master:          '⚫ マスター',
    rank_fast:            '🟤 高速',
    rank_good:            '🟡 グッド',
    rank_keep:            '⚪ 練習を続けよう',
    reaction_submode_label: 'サブモード',
    submode_simple:       'シングルヒット',
    submode_combo:        'コンボモード',
    last_reaction:        '直近のリアクション',
    hits:                 'ヒット',
    misses:               'ミス',
    best_reaction:        'ベストリアクション',
    combo_pct_s:          '有効コンボ率',
    best_combo_duration_s:'ベストコンボ時間',
    stimulus_wait:        '構えて',
    stimulus_hit:         'ヒット!',
    stimulus_miss:        'ミス',
    mode_reaction:        '⚡ シンプルリアクション',
    hits_simple_s:        'ヒット',
    misses_simple_s:      'ミス',
    calib_menu_btn:       'デバイスをキャリブレート',
    calib_title:          'デバイスをキャリブレート',
    calib_desc:           '強さの違う3発のパンチで検出しきい値とデバウンス時間を測定します。',
    calib_start:          'キャリブレーション開始',
    step:                 'ステップ',
    calib_step_instruction: '準備完了を押してからパンチ',
    calib_press_ready:    '構えたら準備完了を押す',
    calib_ready_btn:      '準備完了',
    calib_listening:      '計測中...',
    calib_detecting:      'パンチを待っています...',
    calib_next_step:      '次のステップ',
    calib_see_results:    '結果を見る',
    calib_results_title:  'キャリブレーション完了',
    calib_threshold:      'しきい値',
    calib_debounce:       'デバウンス',
    calib_save:           'キャリブレーションを保存',
    calib_again:          'キャリブレーションをやり直す',
    calib_existing_title: '✓ 保存済みのキャリブレーションがあります',
    calib_current_title:  '現在のキャリブレーション',
    calib_cur_threshold:  '検出しきい値',
    calib_cur_debounce:   'デバウンス',
    calib_existing_date:  '日付',
    calib_use_existing:   '✓ このキャリブレーションを使う',
    calib_recalibrate:    '🔄 再キャリブレーション',
    calib_notice:         '精度を上げるためデバイスをキャリブレートしましょう',
    calib_notice_btn:     'キャリブレート',
    calib_peak_detected:  'パンチ検出: {g}G',
    calib_repeat_punch:   'このパンチをやり直す',
    calib_no_punch:       'パンチを検出できませんでした。もう一度お試しください。',
    calib_retry_btn:      '再試行',
    calib_sensor_live:    'センサー: {g}G',
    calib_sensor_ok:      '✓ センサー有効 — 今すぐパンチ',
    calib_sensor_off:     '⚠️ センサーを利用できません',
    calib_tap_fallback:   'スマホが検出しない — タップを使う',
    calib_tap_used:       'タップでパンチを再現: {g}G',
    calib_result_soft:    '弱いパンチを検出',
    calib_result_medium:  '中くらいのパンチを検出',
    calib_result_hard:    '強いパンチを検出',
    calib_result_threshold: '設定されたしきい値',
    calib_result_sensitivity: '感度',
    calib_ms_debounce:    'デバウンス {n} ms',
    calib_manual_title:   '手動調整',
    calib_manual_label:   '感度: {g}G',
    calib_manual_desc:    '値が小さいほど敏感',
    home_calib_status_yes: '✓ キャリブレーション保存済み — {date}',
    home_calib_status_no: '⚠️ 未キャリブレーション — タップして設定',
    sound_label:          'サウンド',
    sound_on:             'オン',
    sound_off:            'ミュート',
    submode_colors:       'カラーモード',
    submode_colors_desc:  '画面の色に反応する',
    color_labels_label:   'カラーのラベル',
    color_order_label:    'カラーの順番',
    color_yellow_ph:      '例: 脚',
    color_red_ph:         '例: 胴体',
    color_blue_ph:        '例: 頭',
    mode_colors:          '🎨 カラーモード',
    color_stats_title:    'カラー別の統計',
    help_title:           'ヘルプ',
    card_reaction:        'リアクション',
    card_reaction_desc:   '反応速度を上げる',
    card_power:           'パワー',
    card_power_desc:      'より強く打つ',
    card_combo:           'コンボ',
    card_combo_desc:      'よりスムーズに打つ',
    card_colors:          'カラー',
    card_colors_desc:     '正確さを上げる',
    card_record:          '記録',
    home_intro_title:     'あなたのパンチはどれだけ強い?',
    home_tagline_1:       '測定。',
    home_tagline_2:       '改善。',
    home_tagline_3:       '支配。',
    // — textos que antes estaban fijos en español —
    last_punch:              '最後のパンチ',
    personal_record:         '個人記録',
    vs_yesterday:            '昨日比',
    btn_calibrate:           'キャリブレート',
    nav_home:                'ホーム',
    nav_ranking:             'ランキング',
    speed_title:             'スピード',
    global_ranking_soon:     'グローバルランキング — 近日公開',
    you:                     'あなた',
    auth_create_account:     'アカウント作成',
    auth_have_account:       'アカウントを持っています',
    auth_full_name:          '氏名',
    auth_full_name_ph:       'あなたの氏名',
    auth_email:              'メール',
    auth_password:           'パスワード',
    auth_password_min:       'パスワード (6文字以上)',
    auth_sport:              '競技 / 種目 (任意)',
    auth_sport_ph:           'ボクシング、キックボクシング...',
    auth_already:            'すでにアカウントをお持ちですか?',
    auth_login_link:         'ログイン',
    auth_login_btn:          'ログイン',
    auth_no_account:         'アカウントがありませんか?',
    auth_register_link:      '新規登録',
    auth_forgot:             'パスワードを忘れました',
    auth_creating:           '作成中...',
    auth_entering:           'ログイン中...',
    auth_err_name:           '氏名を入力してください',
    auth_err_email:          'メールアドレスが不正です',
    auth_err_password:       'パスワードは6文字以上必要です',
    auth_err_weight:         '体重が不正です (30〜200 kg)',
    auth_err_age:            '年齢が不正です (10〜100)',
    auth_err_create:         'アカウントを作成できませんでした',
    auth_err_send:           'メールを送信できませんでした',
    auth_err_enter_email:    'メールアドレスを入力してください',
    auth_err_enter_pass:     'パスワードを入力してください',
    auth_err_credentials:    'メールアドレスかパスワードが違います',
    auth_check_email:        'メールを確認してアカウントを有効化してください',
    auth_email_sent:         'メールを送信しました。受信トレイをご確認ください。',
    change_photo:            '写真を変更',
    logout:                  'ログアウト',
    training_type:           'トレーニングの種類',
    submode_simple_desc:     '合図 → 1発 → リアクションを測定',
    submode_combo_desc:      '合図 → 連続パンチ',
    time_left:               '残り時間',
    combo_duration:          'コンボ時間',
    verdict_fail:            '失敗',
    result_completed:        '完了',
    result_incomplete:       '未完了',
    result_no_reaction:      'リアクションなし',
    next_signal_in:          '次の合図まで {s}秒',
    next_signal_soon:        'まもなく次の合図...',
    start_now:               '今すぐ開始!',
    best_combo:              'ベストコンボ',
    total_time:              '合計時間',
    measure_my_punch:        'パンチを測定する',
    measure_calib_desc:      '初回利用または新しい端末',
    mode_power_title:        'パワーモード',
    measure_power_desc:      'パンチの強さを測定',
    cancel:                  'キャンセル',
    penalty_rest:            '休め!',
    penalty_wait_signal:     '合図を待て!',
    penalty_too_soon:        '早すぎる!',
    new_record_overlay:      '🏆 新記録!',
    max_level:               '最大レベル',
    // — notas de sesión y colores por defecto —
    grade_s:                 '伝説級',
    grade_a:                 '達人',
    grade_b:                 '戦士',
    grade_c:                 '修行者',
    color_yellow:            '黄',
    color_red:               '赤',
    color_blue:              '青',
    // — resumen de configuración y XP de sesión —
    min_per_round:           '分/RD',
    min_total:               '合計分',
    xp_earned_session:       'このセッションで獲得したXP',
    level_up_to:             '⬆ {n} に昇格',
    // — nivel numerado —
    level_n:                 'レベル {n}',
    // — botones del quiz —
    quiz_skip:               'スキップ',
    quiz_back:               '← 戻る',
  },
  fr: {
    profile_subtitle:     'Configure ton profil pour commencer',
    name:                 'Nom',
    weight:               'Poids (kg)',
    age:                  'Âge',
    sex:                  'Sexe',
    male:                 '♂ Homme',
    female:               '♀ Femme',
    save_continue:        'ENREGISTRER ET CONTINUER',
    name_placeholder:     'Ton nom',
    weight_placeholder:   '70',
    age_placeholder:      '25',
    training_mode:        'ENTRAÎNEMENT',
    training_desc:        'Mesure la vitesse et la puissance par rounds',
    combo_mode:           'MODE RÉACTION',
    combo_desc:           'Combos avec temps de réaction',
    rounds_label:         'Rounds',
    round_duration_label: 'Durée du round',
    rest_duration_label:  'Repos entre les rounds',
    config_start:         'COMMENCER L\'ENTRAÎNEMENT',
    config_summary:       '{r} rounds · {rd} min · {rst}s de repos · ~{total} min au total',
    val_rounds:           '{n} rounds',
    val_round_duration:   '{n} min',
    val_rest_duration:    '{n} s',
    combo_hits_label:     'COUPS PAR COMBO',
    combo_duration_label: 'DURÉE MAX DU COMBO',
    combo_pause_label:    'PAUSE ENTRE LES SIGNAUX',
    combo_mode_label:     'MODE',
    mode_fixed:           'FIXE',
    mode_random:          'ALÉATOIRE',
    nav_profile:          'Profil',
    nav_train:            'Entraîner',
    nav_history:          'Historique',
    ios_permission_text:  'iOS demande une autorisation pour l\'accéléromètre',
    ios_permission_btn:   '🎯 Activer le capteur de mouvement',
    ios_granted:          '✓ Capteur activé',
    ios_denied:           '✗ Autorisation refusée — impossible de détecter les coups',
    round_indicator:      'ROUND {n}/{total}',
    punches:              'Coups',
    wait_hits:            '{n} COUPS',
    wait_max_time:        '{t}s MAXIMUM',
    speed_label:          'Vitesse m/s',
    power_label:          'Puissance',
    best_punch:           'Meilleur coup',
    chart_last10:         '10 derniers coups (G)',
    rest_title:           'REPOS',
    next_round:           'Suivant : Round {n}',
    skip_rest:            'PASSER LE REPOS',
    avg_power_rest:       'Puissance moy.',
    session_complete:     'SÉANCE TERMINÉE',
    mode_training:        '🥊 Entraînement',
    mode_combo:           '⚡ Mode Réaction',
    rounds_completed:     'Rounds',
    total_punches:        'Coups au total',
    avg_power_s:          'Puissance moy.',
    max_power_s:          'Puissance max.',
    avg_speed_s:          'Vitesse moy.',
    max_speed_s:          'Vitesse max.',
    avg_reaction_s:       'Réaction moy.',
    best_reaction_s:      'Meilleure réaction',
    hits_s:               'Combos réussis',
    misses_s:             'Combos ratés',
    duration_s:           'Durée',
    calories_s:           'Calories est.',
    save_session:         'ENREGISTRER LA SÉANCE',
    back_menu:            'RETOUR AU MENU',
    session_saved_txt:    '✓ ENREGISTRÉ',
    cal_warmup:           'Bel échauffement ! 💪',
    cal_good:             'Super séance ! 🔥',
    cal_elite:            'Séance d\'élite ! 🏆',
    vs_previous:          'vs séance précédente : ',
    diff_punches_up:      '↑ +{n} coups',
    diff_punches_down:    '↓ {n} coups',
    diff_power_up:        '↑ +{n}G de puissance',
    diff_power_down:      '↓ {n}G de puissance',
    diff_reaction_faster: '↑ {n}ms plus rapide',
    diff_reaction_slower: '↓ {n}ms plus lent',
    stats_title:          'STATISTIQUES',
    records_title:        '🏆 Records absolus',
    best_reaction_rec:    'Meilleure réaction',
    best_power_rec:       'Meilleure puissance',
    most_punches_rec:     'Plus de coups',
    totals_title:         'Totaux',
    total_sessions:       'Séances',
    total_punches_h:      'Coups au total',
    total_calories_h:     'Calories totales',
    power_chart_title:    'Puissance moy. (10 dernières)',
    reaction_chart_title: 'Temps de réaction (10 derniers)',
    calories_chart_title: 'Calories par séance (10 dernières)',
    no_sessions:          'Aucune séance pour le moment 🥊',
    hist_empty_title:     'Tu n\'as encore aucune séance. Commence à t\'entraîner !',
    rank_empty_title:     'Termine des séances pour apparaître au classement',
    settings_title:       'Paramètres',
    language_label:       'Langue',
    save_settings:        'SAUVEGARDER',
    alert_enter_name:     'Saisis ton nom',
    alert_weight:         'Saisis un poids valide (30-200 kg)',
    alert_age:            'Saisis un âge valide (10-100)',
    alert_weight_s:       'Poids invalide',
    alert_age_s:          'Âge invalide',
    confirm_stop:         'Abandonner la séance ?',
    abandon_penalty_title: '⚠️ SÉANCE ABANDONNÉE',
    rank_master:          '⚫ Maître',
    rank_fast:            '🟤 Rapide',
    rank_good:            '🟡 Bien',
    rank_keep:            '⚪ Continue à t\'entraîner',
    reaction_submode_label: 'SOUS-MODE',
    submode_simple:       'COUP UNIQUE',
    submode_combo:        'MODE COMBO',
    last_reaction:        'Dernière réaction',
    hits:                 'Réussis',
    misses:               'Ratés',
    best_reaction:        'Meilleure réaction',
    combo_pct_s:          '% de combos valides',
    best_combo_duration_s:'Meilleure durée de combo',
    stimulus_wait:        'Prépare-toi',
    stimulus_hit:         'FRAPPE !',
    stimulus_miss:        'RATÉ',
    mode_reaction:        '⚡ Réaction simple',
    hits_simple_s:        'Réussis',
    misses_simple_s:      'Ratés',
    calib_menu_btn:       'CALIBRER L\'APPAREIL',
    calib_title:          'CALIBRER L\'APPAREIL',
    calib_desc:           'Donne 3 coups d\'intensité différente pour mesurer ton seuil de détection et le temps de debounce.',
    calib_start:          'DÉMARRER LA CALIBRATION',
    step:                 'ÉTAPE',
    calib_step_instruction: 'Appuie sur PRÊT, puis frappe',
    calib_press_ready:    'Appuie sur PRÊT quand tu es en place',
    calib_ready_btn:      'PRÊT',
    calib_listening:      'ÉCOUTE...',
    calib_detecting:      'En attente du coup...',
    calib_next_step:      'ÉTAPE SUIVANTE',
    calib_see_results:    'VOIR LES RÉSULTATS',
    calib_results_title:  'CALIBRATION TERMINÉE',
    calib_threshold:      'Seuil',
    calib_debounce:       'Debounce',
    calib_save:           'ENREGISTRER LA CALIBRATION',
    calib_again:          'REFAIRE LA CALIBRATION',
    calib_existing_title: '✓ Tu as déjà une calibration enregistrée',
    calib_current_title:  'CALIBRATION ACTUELLE',
    calib_cur_threshold:  'Seuil de détection',
    calib_cur_debounce:   'Debounce',
    calib_existing_date:  'Date',
    calib_use_existing:   '✓ UTILISER CETTE CALIBRATION',
    calib_recalibrate:    '🔄 RECALIBRER',
    calib_notice:         'Calibre ton appareil pour plus de précision',
    calib_notice_btn:     'CALIBRER',
    calib_peak_detected:  'Coup détecté : {g}G',
    calib_repeat_punch:   'REFAIRE CE COUP',
    calib_no_punch:       'Aucun coup détecté. Réessaie.',
    calib_retry_btn:      'RÉESSAYER',
    calib_sensor_live:    'Capteur : {g}G',
    calib_sensor_ok:      '✓ Capteur actif — Frappe maintenant',
    calib_sensor_off:     '⚠️ Capteur non disponible',
    calib_tap_fallback:   'Mon téléphone ne détecte pas — utiliser le toucher',
    calib_tap_used:       'Coup simulé par toucher : {g}G',
    calib_result_soft:    'Coup léger détecté',
    calib_result_medium:  'Coup moyen détecté',
    calib_result_hard:    'Coup fort détecté',
    calib_result_threshold: 'Seuil configuré',
    calib_result_sensitivity: 'Sensibilité',
    calib_ms_debounce:    '{n} ms de debounce',
    calib_manual_title:   'RÉGLAGE MANUEL',
    calib_manual_label:   'SENSIBILITÉ : {g}G',
    calib_manual_desc:    'Valeur plus basse = plus sensible',
    home_calib_status_yes: '✓ Calibration enregistrée — {date}',
    home_calib_status_no: '⚠️ Non calibré — touche pour calibrer',
    sound_label:          'SON',
    sound_on:             'ACTIVÉ',
    sound_off:            'MUET',
    submode_colors:       'MODE COULEURS',
    submode_colors_desc:  'Réagis à la couleur de l\'écran',
    color_labels_label:   'ÉTIQUETTES DES COULEURS',
    color_order_label:    'ORDRE DES COULEURS',
    color_yellow_ph:      'ex. Jambes',
    color_red_ph:         'ex. Torse',
    color_blue_ph:        'ex. Tête',
    mode_colors:          '🎨 Mode Couleurs',
    color_stats_title:    'Stats par couleur',
    help_title:           'AIDE',
    card_reaction:        'RÉACTION',
    card_reaction_desc:   'Améliore ta vitesse de réaction',
    card_power:           'PUISSANCE',
    card_power_desc:      'Frappe plus fort',
    card_combo:           'COMBO',
    card_combo_desc:      'Frappe plus fluide',
    card_colors:          'COULEURS',
    card_colors_desc:     'Améliore ta précision',
    card_record:          'RECORD',
    home_intro_title:     'À QUELLE PUISSANCE FRAPPES-TU ?',
    home_tagline_1:       'MESURE.',
    home_tagline_2:       'AMÉLIORE.',
    home_tagline_3:       'DOMINE.',
    // — textos que antes estaban fijos en español —
    last_punch:              'DERNIER COUP',
    personal_record:         'RECORD PERSONNEL',
    vs_yesterday:            'VS HIER',
    btn_calibrate:           'CALIBRER',
    nav_home:                'Accueil',
    nav_ranking:             'Classement',
    speed_title:             'VITESSE',
    global_ranking_soon:     'CLASSEMENT MONDIAL — BIENTÔT',
    you:                     'Toi',
    auth_create_account:     'CRÉER UN COMPTE',
    auth_have_account:       'J\'AI DÉJÀ UN COMPTE',
    auth_full_name:          'NOM COMPLET',
    auth_full_name_ph:       'Ton nom complet',
    auth_email:              'E-MAIL',
    auth_password:           'MOT DE PASSE',
    auth_password_min:       'MOT DE PASSE (min. 6 caractères)',
    auth_sport:              'SPORT / DISCIPLINE (facultatif)',
    auth_sport_ph:           'Boxe, Kickboxing...',
    auth_already:            'Tu as déjà un compte ?',
    auth_login_link:         'Se connecter',
    auth_login_btn:          'SE CONNECTER',
    auth_no_account:         'Pas encore de compte ?',
    auth_register_link:      'S\'inscrire',
    auth_forgot:             'J\'ai oublié mon mot de passe',
    auth_creating:           'CRÉATION...',
    auth_entering:           'CONNEXION...',
    auth_err_name:           'Saisis ton nom complet',
    auth_err_email:          'E-mail invalide',
    auth_err_password:       'Le mot de passe doit faire au moins 6 caractères',
    auth_err_weight:         'Poids invalide (30-200 kg)',
    auth_err_age:            'Âge invalide (10-100)',
    auth_err_create:         'Impossible de créer le compte',
    auth_err_send:           'Impossible d\'envoyer l\'e-mail',
    auth_err_enter_email:    'Saisis ton e-mail',
    auth_err_enter_pass:     'Saisis ton mot de passe',
    auth_err_credentials:    'E-mail ou mot de passe incorrect',
    auth_check_email:        'Vérifie tes e-mails pour confirmer ton compte',
    auth_email_sent:         'E-mail envoyé. Vérifie ta boîte de réception.',
    change_photo:            'Changer la photo',
    logout:                  'DÉCONNEXION',
    training_type:           'TYPE D\'ENTRAÎNEMENT',
    submode_simple_desc:     'Signal → 1 coup → mesure la réaction',
    submode_combo_desc:      'Signal → série de coups',
    time_left:               'TEMPS RESTANT',
    combo_duration:          'DURÉE DU COMBO',
    verdict_fail:            'RATÉ',
    result_completed:        'TERMINÉ',
    result_incomplete:       'INCOMPLET',
    result_no_reaction:      'AUCUNE RÉACTION',
    next_signal_in:          'Prochain signal dans {s}s',
    next_signal_soon:        'Prochain signal bientôt...',
    start_now:               'Commence maintenant !',
    best_combo:              'MEILLEUR COMBO',
    total_time:              'TEMPS TOTAL',
    measure_my_punch:        'MESURER MON COUP',
    measure_calib_desc:      'Première utilisation ou nouvel appareil',
    mode_power_title:        'MODE PUISSANCE',
    measure_power_desc:      'Mesure la force de ton coup',
    cancel:                  'Annuler',
    penalty_rest:            'REPOSE-TOI !',
    penalty_wait_signal:     'ATTENDS LE SIGNAL !',
    penalty_too_soon:        'TROP TÔT !',
    new_record_overlay:      '🏆 NOUVEAU RECORD !',
    max_level:               'NIVEAU MAX',
    // — notas de sesión y colores por defecto —
    grade_s:                 'LÉGENDAIRE',
    grade_a:                 'MAÎTRE',
    grade_b:                 'GUERRIER',
    grade_c:                 'PRATIQUANT',
    color_yellow:            'JAUNE',
    color_red:               'ROUGE',
    color_blue:              'BLEU',
    // — resumen de configuración y XP de sesión —
    min_per_round:           'MIN/RD',
    min_total:               'MIN TOTAL',
    xp_earned_session:       'XP GAGNÉ DANS CETTE SÉANCE',
    level_up_to:             '⬆ TU PASSES À {n}',
    // — nivel numerado —
    level_n:                 'NIVEAU {n}',
    // — botones del quiz —
    quiz_skip:               'Passer',
    quiz_back:               '← Retour',
  },
  ru: {
    profile_subtitle:     'Настройте профиль, чтобы начать',
    name:                 'Имя',
    weight:               'Вес (кг)',
    age:                  'Возраст',
    sex:                  'Пол',
    male:                 '♂ Мужской',
    female:               '♀ Женский',
    save_continue:        'СОХРАНИТЬ И ПРОДОЛЖИТЬ',
    name_placeholder:     'Ваше имя',
    weight_placeholder:   '70',
    age_placeholder:      '25',
    training_mode:        'ТРЕНИРОВКА',
    training_desc:        'Измеряй скорость и мощность по раундам',
    combo_mode:           'РЕЖИМ РЕАКЦИИ',
    combo_desc:           'Комбинации с замером реакции',
    rounds_label:         'Раунды',
    round_duration_label: 'Длительность раунда',
    rest_duration_label:  'Отдых между раундами',
    config_start:         'НАЧАТЬ ТРЕНИРОВКУ',
    config_summary:       '{r} раундов · {rd} мин · отдых {rst}с · всего ~{total} мин',
    val_rounds:           '{n} раундов',
    val_round_duration:   '{n} мин',
    val_rest_duration:    '{n} с',
    combo_hits_label:     'УДАРОВ В КОМБО',
    combo_duration_label: 'МАКС. ДЛИТЕЛЬНОСТЬ КОМБО',
    combo_pause_label:    'ПАУЗА МЕЖДУ СИГНАЛАМИ',
    combo_mode_label:     'РЕЖИМ',
    mode_fixed:           'ФИКСИРОВАННЫЙ',
    mode_random:          'СЛУЧАЙНЫЙ',
    nav_profile:          'Профиль',
    nav_train:            'Тренировка',
    nav_history:          'История',
    ios_permission_text:  'iOS требует разрешение на акселерометр',
    ios_permission_btn:   '🎯 Включить датчик движения',
    ios_granted:          '✓ Датчик активен',
    ios_denied:           '✗ Доступ запрещён — удары не определяются',
    round_indicator:      'РАУНД {n}/{total}',
    punches:              'Удары',
    wait_hits:            'УДАРОВ: {n}',
    wait_max_time:        'МАКС. {t}с',
    speed_label:          'Скорость м/с',
    power_label:          'Мощность',
    best_punch:           'Лучший удар',
    chart_last10:         'Последние 10 ударов (G)',
    rest_title:           'ОТДЫХ',
    next_round:           'Далее: раунд {n}',
    skip_rest:            'ПРОПУСТИТЬ ОТДЫХ',
    avg_power_rest:       'Средняя мощность',
    session_complete:     'ТРЕНИРОВКА ЗАВЕРШЕНА',
    mode_training:        '🥊 Тренировка',
    mode_combo:           '⚡ Режим реакции',
    rounds_completed:     'Раунды',
    total_punches:        'Всего ударов',
    avg_power_s:          'Средняя мощность',
    max_power_s:          'Макс. мощность',
    avg_speed_s:          'Средняя скорость',
    max_speed_s:          'Макс. скорость',
    avg_reaction_s:       'Средняя реакция',
    best_reaction_s:      'Лучшая реакция',
    hits_s:               'Комбо выполнено',
    misses_s:             'Комбо провалено',
    duration_s:           'Длительность',
    calories_s:           'Калории (оценка)',
    save_session:         'СОХРАНИТЬ ТРЕНИРОВКУ',
    back_menu:            'В МЕНЮ',
    session_saved_txt:    '✓ СОХРАНЕНО',
    cal_warmup:           'Хорошая разминка! 💪',
    cal_good:             'Отличная тренировка! 🔥',
    cal_elite:            'Элитная тренировка! 🏆',
    vs_previous:          'к прошлой тренировке: ',
    diff_punches_up:      '↑ +{n} ударов',
    diff_punches_down:    '↓ {n} ударов',
    diff_power_up:        '↑ +{n}G мощности',
    diff_power_down:      '↓ {n}G мощности',
    diff_reaction_faster: '↑ на {n}мс быстрее',
    diff_reaction_slower: '↓ на {n}мс медленнее',
    stats_title:          'СТАТИСТИКА',
    records_title:        '🏆 Рекорды за всё время',
    best_reaction_rec:    'Лучшая реакция',
    best_power_rec:       'Лучшая мощность',
    most_punches_rec:     'Больше всего ударов',
    totals_title:         'Итого',
    total_sessions:       'Тренировки',
    total_punches_h:      'Всего ударов',
    total_calories_h:     'Всего калорий',
    power_chart_title:    'Средняя мощность (последние 10)',
    reaction_chart_title: 'Время реакции (последние 10)',
    calories_chart_title: 'Калории за тренировку (последние 10)',
    no_sessions:          'Пока нет тренировок 🥊',
    hist_empty_title:     'У вас пока нет тренировок. Начните заниматься!',
    rank_empty_title:     'Завершайте тренировки, чтобы попасть в рейтинг',
    settings_title:       'Настройки',
    language_label:       'Язык',
    save_settings:        'СОХРАНИТЬ',
    alert_enter_name:     'Введите имя',
    alert_weight:         'Введите корректный вес (30-200 кг)',
    alert_age:            'Введите корректный возраст (10-100)',
    alert_weight_s:       'Некорректный вес',
    alert_age_s:          'Некорректный возраст',
    confirm_stop:         'Прервать тренировку?',
    abandon_penalty_title: '⚠️ ТРЕНИРОВКА ПРЕРВАНА',
    rank_master:          '⚫ Мастер',
    rank_fast:            '🟤 Быстро',
    rank_good:            '🟡 Хорошо',
    rank_keep:            '⚪ Продолжай тренироваться',
    reaction_submode_label: 'ПОДРЕЖИМ',
    submode_simple:       'ОДИНОЧНЫЙ УДАР',
    submode_combo:        'РЕЖИМ КОМБО',
    last_reaction:        'Последняя реакция',
    hits:                 'Попадания',
    misses:               'Промахи',
    best_reaction:        'Лучшая реакция',
    combo_pct_s:          '% верных комбо',
    best_combo_duration_s:'Лучшее время комбо',
    stimulus_wait:        'Приготовься',
    stimulus_hit:         'УДАР!',
    stimulus_miss:        'ПРОМАХ',
    mode_reaction:        '⚡ Простая реакция',
    hits_simple_s:        'Попадания',
    misses_simple_s:      'Промахи',
    calib_menu_btn:       'КАЛИБРОВКА УСТРОЙСТВА',
    calib_title:          'КАЛИБРОВКА УСТРОЙСТВА',
    calib_desc:           'Нанесите 3 удара разной силы, чтобы измерить порог срабатывания и время дебаунса.',
    calib_start:          'НАЧАТЬ КАЛИБРОВКУ',
    step:                 'ШАГ',
    calib_step_instruction: 'Нажмите ГОТОВ, затем бейте',
    calib_press_ready:    'Нажмите ГОТОВ, когда будете готовы',
    calib_ready_btn:      'ГОТОВ',
    calib_listening:      'СЛУШАЮ...',
    calib_detecting:      'Ожидание удара...',
    calib_next_step:      'СЛЕДУЮЩИЙ ШАГ',
    calib_see_results:    'СМОТРЕТЬ РЕЗУЛЬТАТЫ',
    calib_results_title:  'КАЛИБРОВКА ЗАВЕРШЕНА',
    calib_threshold:      'Порог',
    calib_debounce:       'Дебаунс',
    calib_save:           'СОХРАНИТЬ КАЛИБРОВКУ',
    calib_again:          'ПОВТОРИТЬ КАЛИБРОВКУ',
    calib_existing_title: '✓ У вас уже есть сохранённая калибровка',
    calib_current_title:  'ТЕКУЩАЯ КАЛИБРОВКА',
    calib_cur_threshold:  'Порог срабатывания',
    calib_cur_debounce:   'Дебаунс',
    calib_existing_date:  'Дата',
    calib_use_existing:   '✓ ИСПОЛЬЗОВАТЬ ЭТУ КАЛИБРОВКУ',
    calib_recalibrate:    '🔄 ПЕРЕКАЛИБРОВАТЬ',
    calib_notice:         'Откалибруйте устройство для большей точности',
    calib_notice_btn:     'КАЛИБРОВКА',
    calib_peak_detected:  'Удар обнаружен: {g}G',
    calib_repeat_punch:   'ПОВТОРИТЬ ЭТОТ УДАР',
    calib_no_punch:       'Удар не обнаружен. Попробуйте ещё раз.',
    calib_retry_btn:      'ПОВТОРИТЬ',
    calib_sensor_live:    'Датчик: {g}G',
    calib_sensor_ok:      '✓ Датчик активен — бейте сейчас',
    calib_sensor_off:     '⚠️ Датчик недоступен',
    calib_tap_fallback:   'Телефон не улавливает — использовать касание',
    calib_tap_used:       'Удар сымитирован касанием: {g}G',
    calib_result_soft:    'Обнаружен слабый удар',
    calib_result_medium:  'Обнаружен средний удар',
    calib_result_hard:    'Обнаружен сильный удар',
    calib_result_threshold: 'Настроенный порог',
    calib_result_sensitivity: 'Чувствительность',
    calib_ms_debounce:    'дебаунс {n} мс',
    calib_manual_title:   'РУЧНАЯ НАСТРОЙКА',
    calib_manual_label:   'ЧУВСТВИТЕЛЬНОСТЬ: {g}G',
    calib_manual_desc:    'Меньше значение = выше чувствительность',
    home_calib_status_yes: '✓ Калибровка сохранена — {date}',
    home_calib_status_no: '⚠️ Не откалибровано — нажмите для калибровки',
    sound_label:          'ЗВУК',
    sound_on:             'ВКЛ',
    sound_off:            'БЕЗ ЗВУКА',
    submode_colors:       'РЕЖИМ ЦВЕТОВ',
    submode_colors_desc:  'Реагируй на цвет экрана',
    color_labels_label:   'НАЗВАНИЯ ЦВЕТОВ',
    color_order_label:    'ПОРЯДОК ЦВЕТОВ',
    color_yellow_ph:      'напр. Ноги',
    color_red_ph:         'напр. Корпус',
    color_blue_ph:        'напр. Голова',
    mode_colors:          '🎨 Режим цветов',
    color_stats_title:    'Статистика по цветам',
    help_title:           'ПОМОЩЬ',
    card_reaction:        'РЕАКЦИЯ',
    card_reaction_desc:   'Улучши скорость реакции',
    card_power:           'МОЩНОСТЬ',
    card_power_desc:      'Бей сильнее',
    card_combo:           'КОМБО',
    card_combo_desc:      'Бей чище',
    card_colors:          'ЦВЕТА',
    card_colors_desc:     'Улучши точность',
    card_record:          'РЕКОРД',
    home_intro_title:     'НАСКОЛЬКО СИЛЬНО ТЫ БЬЁШЬ?',
    home_tagline_1:       'ИЗМЕРЬ.',
    home_tagline_2:       'УЛУЧШИ.',
    home_tagline_3:       'ДОМИНИРУЙ.',
    // — textos que antes estaban fijos en español —
    last_punch:              'ПОСЛЕДНИЙ УДАР',
    personal_record:         'ЛИЧНЫЙ РЕКОРД',
    vs_yesterday:            'VS ВЧЕРА',
    btn_calibrate:           'КАЛИБРОВКА',
    nav_home:                'Главная',
    nav_ranking:             'Рейтинг',
    speed_title:             'СКОРОСТЬ',
    global_ranking_soon:     'ГЛОБАЛЬНЫЙ РЕЙТИНГ — СКОРО',
    you:                     'Ты',
    auth_create_account:     'СОЗДАТЬ АККАУНТ',
    auth_have_account:       'У МЕНЯ УЖЕ ЕСТЬ АККАУНТ',
    auth_full_name:          'ПОЛНОЕ ИМЯ',
    auth_full_name_ph:       'Твоё полное имя',
    auth_email:              'EMAIL',
    auth_password:           'ПАРОЛЬ',
    auth_password_min:       'ПАРОЛЬ (мин. 6 символов)',
    auth_sport:              'ВИД СПОРТА / ДИСЦИПЛИНА (необязательно)',
    auth_sport_ph:           'Бокс, кикбоксинг...',
    auth_already:            'Уже есть аккаунт?',
    auth_login_link:         'Войти',
    auth_login_btn:          'ВОЙТИ',
    auth_no_account:         'Нет аккаунта?',
    auth_register_link:      'Зарегистрироваться',
    auth_forgot:             'Я забыл пароль',
    auth_creating:           'СОЗДАЁМ...',
    auth_entering:           'ВХОД...',
    auth_err_name:           'Введите полное имя',
    auth_err_email:          'Некорректный email',
    auth_err_password:       'Пароль должен быть не короче 6 символов',
    auth_err_weight:         'Некорректный вес (30-200 кг)',
    auth_err_age:            'Некорректный возраст (10-100)',
    auth_err_create:         'Не удалось создать аккаунт',
    auth_err_send:           'Не удалось отправить письмо',
    auth_err_enter_email:    'Введите email',
    auth_err_enter_pass:     'Введите пароль',
    auth_err_credentials:    'Неверный email или пароль',
    auth_check_email:        'Проверьте почту, чтобы подтвердить аккаунт',
    auth_email_sent:         'Письмо отправлено. Проверьте входящие.',
    change_photo:            'Сменить фото',
    logout:                  'ВЫЙТИ',
    training_type:           'ТИП ТРЕНИРОВКИ',
    submode_simple_desc:     'Сигнал → 1 удар → замер реакции',
    submode_combo_desc:      'Сигнал → серия ударов',
    time_left:               'ОСТАЛОСЬ ВРЕМЕНИ',
    combo_duration:          'ДЛИТЕЛЬНОСТЬ КОМБО',
    verdict_fail:            'ПРОМАХ',
    result_completed:        'ВЫПОЛНЕНО',
    result_incomplete:       'НЕ ЗАВЕРШЕНО',
    result_no_reaction:      'БЕЗ РЕАКЦИИ',
    next_signal_in:          'Следующий сигнал через {s}с',
    next_signal_soon:        'Следующий сигнал скоро...',
    start_now:               'Начинай!',
    best_combo:              'ЛУЧШЕЕ КОМБО',
    total_time:              'ОБЩЕЕ ВРЕМЯ',
    measure_my_punch:        'ИЗМЕРИТЬ МОЙ УДАР',
    measure_calib_desc:      'Первый запуск или новое устройство',
    mode_power_title:        'РЕЖИМ МОЩНОСТИ',
    measure_power_desc:      'Измерь силу своего удара',
    cancel:                  'Отмена',
    penalty_rest:            'ОТДЫХАЙ!',
    penalty_wait_signal:     'ЖДИ СИГНАЛА!',
    penalty_too_soon:        'СЛИШКОМ РАНО!',
    new_record_overlay:      '🏆 НОВЫЙ РЕКОРД!',
    max_level:               'МАКС. УРОВЕНЬ',
    // — notas de sesión y colores por defecto —
    grade_s:                 'ЛЕГЕНДАРНО',
    grade_a:                 'МАСТЕР',
    grade_b:                 'ВОИН',
    grade_c:                 'УЧЕНИК',
    color_yellow:            'ЖЁЛТЫЙ',
    color_red:               'КРАСНЫЙ',
    color_blue:              'СИНИЙ',
    // — resumen de configuración y XP de sesión —
    min_per_round:           'МИН/Р',
    min_total:               'ВСЕГО МИН',
    xp_earned_session:       'XP ЗА ЭТУ ТРЕНИРОВКУ',
    level_up_to:             '⬆ НОВЫЙ УРОВЕНЬ: {n}',
    // — nivel numerado —
    level_n:                 'УРОВЕНЬ {n}',
    // — botones del quiz —
    quiz_skip:               'Пропустить',
    quiz_back:               '← Назад',
  },
  zh: {
    profile_subtitle:     '设置你的档案即可开始',
    name:                 '姓名',
    weight:               '体重 (kg)',
    age:                  '年龄',
    sex:                  '性别',
    male:                 '♂ 男',
    female:               '♀ 女',
    save_continue:        '保存并继续',
    name_placeholder:     '你的名字',
    weight_placeholder:   '70',
    age_placeholder:      '25',
    training_mode:        '训练',
    training_desc:        '按回合测量速度与力量',
    combo_mode:           '反应模式',
    combo_desc:           '带反应时间的连击',
    rounds_label:         '回合数',
    round_duration_label: '回合时长',
    rest_duration_label:  '回合间休息',
    config_start:         '开始训练',
    config_summary:       '{r} 回合 · {rd} 分钟 · 休息 {rst} 秒 · 共约 {total} 分钟',
    val_rounds:           '{n} 回合',
    val_round_duration:   '{n} 分钟',
    val_rest_duration:    '{n} 秒',
    combo_hits_label:     '每组连击次数',
    combo_duration_label: '连击最长时间',
    combo_pause_label:    '信号间隔',
    combo_mode_label:     '模式',
    mode_fixed:           '固定',
    mode_random:          '随机',
    nav_profile:          '档案',
    nav_train:            '训练',
    nav_history:          '历史',
    ios_permission_text:  'iOS 需要授权才能使用加速度计',
    ios_permission_btn:   '🎯 启用运动传感器',
    ios_granted:          '✓ 传感器已启用',
    ios_denied:           '✗ 权限被拒绝 — 无法检测击打',
    round_indicator:      '回合 {n}/{total}',
    punches:              '击打',
    wait_hits:            '{n} 次击打',
    wait_max_time:        '最长 {t} 秒',
    speed_label:          '速度 m/s',
    power_label:          '力量',
    best_punch:           '最佳击打',
    chart_last10:         '最近 10 次击打 (G)',
    rest_title:           '休息',
    next_round:           '下一个：回合 {n}',
    skip_rest:            '跳过休息',
    avg_power_rest:       '平均力量',
    session_complete:     '训练完成',
    mode_training:        '🥊 训练',
    mode_combo:           '⚡ 反应模式',
    rounds_completed:     '回合',
    total_punches:        '总击打数',
    avg_power_s:          '平均力量',
    max_power_s:          '最大力量',
    avg_speed_s:          '平均速度',
    max_speed_s:          '最高速度',
    avg_reaction_s:       '平均反应',
    best_reaction_s:      '最佳反应',
    hits_s:               '连击成功',
    misses_s:             '连击失败',
    duration_s:           '时长',
    calories_s:           '预估卡路里',
    save_session:         '保存训练',
    back_menu:            '返回菜单',
    session_saved_txt:    '✓ 已保存',
    cal_warmup:           '热身不错！💪',
    cal_good:             '训练很棒！🔥',
    cal_elite:            '精英级训练！🏆',
    vs_previous:          '对比上次训练：',
    diff_punches_up:      '↑ +{n} 次击打',
    diff_punches_down:    '↓ {n} 次击打',
    diff_power_up:        '↑ +{n}G 力量',
    diff_power_down:      '↓ {n}G 力量',
    diff_reaction_faster: '↑ 快 {n} 毫秒',
    diff_reaction_slower: '↓ 慢 {n} 毫秒',
    stats_title:          '统计',
    records_title:        '🏆 历史记录',
    best_reaction_rec:    '最佳反应',
    best_power_rec:       '最大力量',
    most_punches_rec:     '最多击打',
    totals_title:         '总计',
    total_sessions:       '训练次数',
    total_punches_h:      '总击打数',
    total_calories_h:     '总卡路里',
    power_chart_title:    '平均力量（最近 10 次）',
    reaction_chart_title: '反应时间（最近 10 次）',
    calories_chart_title: '每次训练的卡路里（最近 10 次）',
    no_sessions:          '还没有训练记录 🥊',
    hist_empty_title:     '你还没有任何训练记录。开始训练吧！',
    rank_empty_title:     '完成训练即可进入排名',
    settings_title:       '设置',
    language_label:       '语言',
    save_settings:        '保存',
    alert_enter_name:     '请输入你的名字',
    alert_weight:         '请输入有效体重 (30-200 kg)',
    alert_age:            '请输入有效年龄 (10-100)',
    alert_weight_s:       '体重无效',
    alert_age_s:          '年龄无效',
    confirm_stop:         '要放弃本次训练吗？',
    abandon_penalty_title: '⚠️ 训练已放弃',
    rank_master:          '⚫ 大师',
    rank_fast:            '🟤 快速',
    rank_good:            '🟡 良好',
    rank_keep:            '⚪ 继续练习',
    reaction_submode_label: '子模式',
    submode_simple:       '单次击打',
    submode_combo:        '连击模式',
    last_reaction:        '上次反应',
    hits:                 '命中',
    misses:               '失误',
    best_reaction:        '最佳反应',
    combo_pct_s:          '有效连击率',
    best_combo_duration_s:'最佳连击时间',
    stimulus_wait:        '准备好',
    stimulus_hit:         '打击！',
    stimulus_miss:        '未中',
    mode_reaction:        '⚡ 简单反应',
    hits_simple_s:        '命中',
    misses_simple_s:      '失误',
    calib_menu_btn:       '校准设备',
    calib_title:          '校准设备',
    calib_desc:           '打出 3 次不同力度的击打，以测量检测阈值和防抖时间。',
    calib_start:          '开始校准',
    step:                 '步骤',
    calib_step_instruction: '按下“准备好”，然后出拳',
    calib_press_ready:    '就位后按“准备好”',
    calib_ready_btn:      '准备好',
    calib_listening:      '检测中...',
    calib_detecting:      '等待击打...',
    calib_next_step:      '下一步',
    calib_see_results:    '查看结果',
    calib_results_title:  '校准完成',
    calib_threshold:      '阈值',
    calib_debounce:       '防抖',
    calib_save:           '保存校准',
    calib_again:          '重新校准',
    calib_existing_title: '✓ 你已有保存的校准',
    calib_current_title:  '当前校准',
    calib_cur_threshold:  '检测阈值',
    calib_cur_debounce:   '防抖',
    calib_existing_date:  '日期',
    calib_use_existing:   '✓ 使用此校准',
    calib_recalibrate:    '🔄 重新校准',
    calib_notice:         '校准设备以获得更高精度',
    calib_notice_btn:     '校准',
    calib_peak_detected:  '检测到击打：{g}G',
    calib_repeat_punch:   '重打这一拳',
    calib_no_punch:       '未检测到击打，请再试一次。',
    calib_retry_btn:      '重试',
    calib_sensor_live:    '传感器：{g}G',
    calib_sensor_ok:      '✓ 传感器已启用 — 现在出拳',
    calib_sensor_off:     '⚠️ 传感器不可用',
    calib_tap_fallback:   '我的手机检测不到 — 改用点击',
    calib_tap_used:       '用点击模拟击打：{g}G',
    calib_result_soft:    '检测到轻击',
    calib_result_medium:  '检测到中等击打',
    calib_result_hard:    '检测到重击',
    calib_result_threshold: '已设置的阈值',
    calib_result_sensitivity: '灵敏度',
    calib_ms_debounce:    '防抖 {n} 毫秒',
    calib_manual_title:   '手动调整',
    calib_manual_label:   '灵敏度：{g}G',
    calib_manual_desc:    '数值越小 = 越灵敏',
    home_calib_status_yes: '✓ 校准已保存 — {date}',
    home_calib_status_no: '⚠️ 未校准 — 点击进行校准',
    sound_label:          '声音',
    sound_on:             '开启',
    sound_off:            '静音',
    submode_colors:       '颜色模式',
    submode_colors_desc:  '对屏幕颜色做出反应',
    color_labels_label:   '颜色标签',
    color_order_label:    '颜色顺序',
    color_yellow_ph:      '例如：腿',
    color_red_ph:         '例如：躯干',
    color_blue_ph:        '例如：头',
    mode_colors:          '🎨 颜色模式',
    color_stats_title:    '按颜色统计',
    help_title:           '帮助',
    card_reaction:        '反应',
    card_reaction_desc:   '提升你的反应速度',
    card_power:           '力量',
    card_power_desc:      '打得更重',
    card_combo:           '连击',
    card_combo_desc:      '打得更流畅',
    card_colors:          '颜色',
    card_colors_desc:     '提升你的准确度',
    card_record:          '记录',
    home_intro_title:     '你的拳有多重？',
    home_tagline_1:       '测量。',
    home_tagline_2:       '提升。',
    home_tagline_3:       '主宰。',
    // — textos que antes estaban fijos en español —
    last_punch:              '最后一拳',
    personal_record:         '个人记录',
    vs_yesterday:            '对比昨天',
    btn_calibrate:           '校准',
    nav_home:                '主页',
    nav_ranking:             '排名',
    speed_title:             '速度',
    global_ranking_soon:     '全球排名 — 即将推出',
    you:                     '你',
    auth_create_account:     '创建账号',
    auth_have_account:       '我已有账号',
    auth_full_name:          '全名',
    auth_full_name_ph:       '你的全名',
    auth_email:              '邮箱',
    auth_password:           '密码',
    auth_password_min:       '密码（至少 6 位）',
    auth_sport:              '运动 / 项目（选填）',
    auth_sport_ph:           '拳击、自由搏击……',
    auth_already:            '已经有账号了？',
    auth_login_link:         '登录',
    auth_login_btn:          '登录',
    auth_no_account:         '还没有账号？',
    auth_register_link:      '注册',
    auth_forgot:             '忘记密码',
    auth_creating:           '创建中...',
    auth_entering:           '登录中...',
    auth_err_name:           '请输入你的全名',
    auth_err_email:          '邮箱无效',
    auth_err_password:       '密码至少需要 6 位',
    auth_err_weight:         '体重无效 (30-200 kg)',
    auth_err_age:            '年龄无效 (10-100)',
    auth_err_create:         '创建账号失败',
    auth_err_send:           '发送邮件失败',
    auth_err_enter_email:    '请输入邮箱',
    auth_err_enter_pass:     '请输入密码',
    auth_err_credentials:    '邮箱或密码错误',
    auth_check_email:        '请查收邮件以确认账号',
    auth_email_sent:         '邮件已发送，请查看收件箱。',
    change_photo:            '更换照片',
    logout:                  '退出',
    training_type:           '训练类型',
    submode_simple_desc:     '信号 → 1 拳 → 测量反应',
    submode_combo_desc:      '信号 → 连续出拳',
    time_left:               '剩余时间',
    combo_duration:          '连击时长',
    verdict_fail:            '失败',
    result_completed:        '已完成',
    result_incomplete:       '未完成',
    result_no_reaction:      '无反应',
    next_signal_in:          '下个信号 {s} 秒后',
    next_signal_soon:        '下个信号即将出现...',
    start_now:               '现在开始！',
    best_combo:              '最佳连击',
    total_time:              '总时长',
    measure_my_punch:        '测量我的拳',
    measure_calib_desc:      '首次使用或更换设备',
    mode_power_title:        '力量模式',
    measure_power_desc:      '测量你出拳的力量',
    cancel:                  '取消',
    penalty_rest:            '休息！',
    penalty_wait_signal:     '等信号！',
    penalty_too_soon:        '太早了！',
    new_record_overlay:      '🏆 新纪录！',
    max_level:               '最高等级',
    // — notas de sesión y colores por defecto —
    grade_s:                 '传奇',
    grade_a:                 '大师',
    grade_b:                 '战士',
    grade_c:                 '习练者',
    color_yellow:            '黄色',
    color_red:               '红色',
    color_blue:              '蓝色',
    // — resumen de configuración y XP de sesión —
    min_per_round:           '分钟/回合',
    min_total:               '总分钟',
    xp_earned_session:       '本次训练获得的 XP',
    level_up_to:             '⬆ 已升至 {n}',
    // — nivel numerado —
    level_n:                 '等级 {n}',
    // — botones del quiz —
    quiz_skip:               '跳过',
    quiz_back:               '← 返回',
  },
  'zh-TW': {
    profile_subtitle:     '設定你的檔案即可開始',
    name:                 '姓名',
    weight:               '體重 (kg)',
    age:                  '年齡',
    sex:                  '性別',
    male:                 '♂ 男',
    female:               '♀ 女',
    save_continue:        '儲存並繼續',
    name_placeholder:     '你的名字',
    weight_placeholder:   '70',
    age_placeholder:      '25',
    training_mode:        '訓練',
    training_desc:        '依回合測量速度與力量',
    combo_mode:           '反應模式',
    combo_desc:           '帶反應時間的連擊',
    rounds_label:         '回合數',
    round_duration_label: '回合時長',
    rest_duration_label:  '回合間休息',
    config_start:         '開始訓練',
    config_summary:       '{r} 回合 · {rd} 分鐘 · 休息 {rst} 秒 · 共約 {total} 分鐘',
    val_rounds:           '{n} 回合',
    val_round_duration:   '{n} 分鐘',
    val_rest_duration:    '{n} 秒',
    combo_hits_label:     '每組連擊次數',
    combo_duration_label: '連擊最長時間',
    combo_pause_label:    '訊號間隔',
    combo_mode_label:     '模式',
    mode_fixed:           '固定',
    mode_random:          '隨機',
    nav_profile:          '檔案',
    nav_train:            '訓練',
    nav_history:          '歷史',
    ios_permission_text:  'iOS 需要授權才能使用加速度計',
    ios_permission_btn:   '🎯 啟用動作感測器',
    ios_granted:          '✓ 感測器已啟用',
    ios_denied:           '✗ 權限遭拒 — 無法偵測擊打',
    round_indicator:      '回合 {n}/{total}',
    punches:              '擊打',
    wait_hits:            '{n} 次擊打',
    wait_max_time:        '最長 {t} 秒',
    speed_label:          '速度 m/s',
    power_label:          '力量',
    best_punch:           '最佳擊打',
    chart_last10:         '最近 10 次擊打 (G)',
    rest_title:           '休息',
    next_round:           '下一個：回合 {n}',
    skip_rest:            '略過休息',
    avg_power_rest:       '平均力量',
    session_complete:     '訓練完成',
    mode_training:        '🥊 訓練',
    mode_combo:           '⚡ 反應模式',
    rounds_completed:     '回合',
    total_punches:        '總擊打數',
    avg_power_s:          '平均力量',
    max_power_s:          '最大力量',
    avg_speed_s:          '平均速度',
    max_speed_s:          '最高速度',
    avg_reaction_s:       '平均反應',
    best_reaction_s:      '最佳反應',
    hits_s:               '連擊成功',
    misses_s:             '連擊失敗',
    duration_s:           '時長',
    calories_s:           '預估卡路里',
    save_session:         '儲存訓練',
    back_menu:            '返回選單',
    session_saved_txt:    '✓ 已儲存',
    cal_warmup:           '熱身不錯！💪',
    cal_good:             '訓練很棒！🔥',
    cal_elite:            '菁英級訓練！🏆',
    vs_previous:          '對比上次訓練：',
    diff_punches_up:      '↑ +{n} 次擊打',
    diff_punches_down:    '↓ {n} 次擊打',
    diff_power_up:        '↑ +{n}G 力量',
    diff_power_down:      '↓ {n}G 力量',
    diff_reaction_faster: '↑ 快 {n} 毫秒',
    diff_reaction_slower: '↓ 慢 {n} 毫秒',
    stats_title:          '統計',
    records_title:        '🏆 歷史紀錄',
    best_reaction_rec:    '最佳反應',
    best_power_rec:       '最大力量',
    most_punches_rec:     '最多擊打',
    totals_title:         '總計',
    total_sessions:       '訓練次數',
    total_punches_h:      '總擊打數',
    total_calories_h:     '總卡路里',
    power_chart_title:    '平均力量（最近 10 次）',
    reaction_chart_title: '反應時間（最近 10 次）',
    calories_chart_title: '每次訓練的卡路里（最近 10 次）',
    no_sessions:          '還沒有訓練紀錄 🥊',
    hist_empty_title:     '你還沒有任何訓練紀錄。開始訓練吧！',
    rank_empty_title:     '完成訓練即可進入排名',
    settings_title:       '設定',
    language_label:       '語言',
    save_settings:        '儲存',
    alert_enter_name:     '請輸入你的名字',
    alert_weight:         '請輸入有效體重 (30-200 kg)',
    alert_age:            '請輸入有效年齡 (10-100)',
    alert_weight_s:       '體重無效',
    alert_age_s:          '年齡無效',
    confirm_stop:         '要放棄本次訓練嗎？',
    abandon_penalty_title: '⚠️ 訓練已放棄',
    rank_master:          '⚫ 大師',
    rank_fast:            '🟤 快速',
    rank_good:            '🟡 良好',
    rank_keep:            '⚪ 繼續練習',
    reaction_submode_label: '子模式',
    submode_simple:       '單次擊打',
    submode_combo:        '連擊模式',
    last_reaction:        '上次反應',
    hits:                 '命中',
    misses:               '失誤',
    best_reaction:        '最佳反應',
    combo_pct_s:          '有效連擊率',
    best_combo_duration_s:'最佳連擊時間',
    stimulus_wait:        '準備好',
    stimulus_hit:         '打擊！',
    stimulus_miss:        '未中',
    mode_reaction:        '⚡ 簡單反應',
    hits_simple_s:        '命中',
    misses_simple_s:      '失誤',
    calib_menu_btn:       '校準裝置',
    calib_title:          '校準裝置',
    calib_desc:           '打出 3 次不同力道的擊打，以測量偵測門檻與防抖時間。',
    calib_start:          '開始校準',
    step:                 '步驟',
    calib_step_instruction: '按下「準備好」，然後出拳',
    calib_press_ready:    '就位後按「準備好」',
    calib_ready_btn:      '準備好',
    calib_listening:      '偵測中...',
    calib_detecting:      '等待擊打...',
    calib_next_step:      '下一步',
    calib_see_results:    '查看結果',
    calib_results_title:  '校準完成',
    calib_threshold:      '門檻',
    calib_debounce:       '防抖',
    calib_save:           '儲存校準',
    calib_again:          '重新校準',
    calib_existing_title: '✓ 你已有儲存的校準',
    calib_current_title:  '目前的校準',
    calib_cur_threshold:  '偵測門檻',
    calib_cur_debounce:   '防抖',
    calib_existing_date:  '日期',
    calib_use_existing:   '✓ 使用此校準',
    calib_recalibrate:    '🔄 重新校準',
    calib_notice:         '校準裝置以獲得更高精度',
    calib_notice_btn:     '校準',
    calib_peak_detected:  '偵測到擊打：{g}G',
    calib_repeat_punch:   '重打這一拳',
    calib_no_punch:       '未偵測到擊打，請再試一次。',
    calib_retry_btn:      '重試',
    calib_sensor_live:    '感測器：{g}G',
    calib_sensor_ok:      '✓ 感測器已啟用 — 現在出拳',
    calib_sensor_off:     '⚠️ 感測器不可用',
    calib_tap_fallback:   '我的手機偵測不到 — 改用點擊',
    calib_tap_used:       '用點擊模擬擊打：{g}G',
    calib_result_soft:    '偵測到輕擊',
    calib_result_medium:  '偵測到中等擊打',
    calib_result_hard:    '偵測到重擊',
    calib_result_threshold: '已設定的門檻',
    calib_result_sensitivity: '靈敏度',
    calib_ms_debounce:    '防抖 {n} 毫秒',
    calib_manual_title:   '手動調整',
    calib_manual_label:   '靈敏度：{g}G',
    calib_manual_desc:    '數值越小 = 越靈敏',
    home_calib_status_yes: '✓ 校準已儲存 — {date}',
    home_calib_status_no: '⚠️ 未校準 — 點擊進行校準',
    sound_label:          '聲音',
    sound_on:             '開啟',
    sound_off:            '靜音',
    submode_colors:       '顏色模式',
    submode_colors_desc:  '對螢幕顏色做出反應',
    color_labels_label:   '顏色標籤',
    color_order_label:    '顏色順序',
    color_yellow_ph:      '例如：腿',
    color_red_ph:         '例如：軀幹',
    color_blue_ph:        '例如：頭',
    mode_colors:          '🎨 顏色模式',
    color_stats_title:    '依顏色統計',
    help_title:           '幫助',
    card_reaction:        '反應',
    card_reaction_desc:   '提升你的反應速度',
    card_power:           '力量',
    card_power_desc:      '打得更重',
    card_combo:           '連擊',
    card_combo_desc:      '打得更流暢',
    card_colors:          '顏色',
    card_colors_desc:     '提升你的準確度',
    card_record:          '紀錄',
    home_intro_title:     '你的拳有多重？',
    home_tagline_1:       '測量。',
    home_tagline_2:       '提升。',
    home_tagline_3:       '主宰。',
    // — textos que antes estaban fijos en español —
    last_punch:              '最後一拳',
    personal_record:         '個人紀錄',
    vs_yesterday:            '對比昨天',
    btn_calibrate:           '校準',
    nav_home:                '主頁',
    nav_ranking:             '排名',
    speed_title:             '速度',
    global_ranking_soon:     '全球排名 — 即將推出',
    you:                     '你',
    auth_create_account:     '建立帳號',
    auth_have_account:       '我已有帳號',
    auth_full_name:          '全名',
    auth_full_name_ph:       '你的全名',
    auth_email:              '電子郵件',
    auth_password:           '密碼',
    auth_password_min:       '密碼（至少 6 位）',
    auth_sport:              '運動 / 項目（選填）',
    auth_sport_ph:           '拳擊、自由搏擊……',
    auth_already:            '已經有帳號了？',
    auth_login_link:         '登入',
    auth_login_btn:          '登入',
    auth_no_account:         '還沒有帳號？',
    auth_register_link:      '註冊',
    auth_forgot:             '忘記密碼',
    auth_creating:           '建立中...',
    auth_entering:           '登入中...',
    auth_err_name:           '請輸入你的全名',
    auth_err_email:          '電子郵件無效',
    auth_err_password:       '密碼至少需要 6 位',
    auth_err_weight:         '體重無效 (30-200 kg)',
    auth_err_age:            '年齡無效 (10-100)',
    auth_err_create:         '建立帳號失敗',
    auth_err_send:           '寄送郵件失敗',
    auth_err_enter_email:    '請輸入電子郵件',
    auth_err_enter_pass:     '請輸入密碼',
    auth_err_credentials:    '電子郵件或密碼錯誤',
    auth_check_email:        '請查收郵件以確認帳號',
    auth_email_sent:         '郵件已寄出，請查看收件匣。',
    change_photo:            '更換照片',
    logout:                  '登出',
    training_type:           '訓練類型',
    submode_simple_desc:     '訊號 → 1 拳 → 測量反應',
    submode_combo_desc:      '訊號 → 連續出拳',
    time_left:               '剩餘時間',
    combo_duration:          '連擊時長',
    verdict_fail:            '失敗',
    result_completed:        '已完成',
    result_incomplete:       '未完成',
    result_no_reaction:      '無反應',
    next_signal_in:          '下個訊號 {s} 秒後',
    next_signal_soon:        '下個訊號即將出現...',
    start_now:               '現在開始！',
    best_combo:              '最佳連擊',
    total_time:              '總時長',
    measure_my_punch:        '測量我的拳',
    measure_calib_desc:      '首次使用或更換裝置',
    mode_power_title:        '力量模式',
    measure_power_desc:      '測量你出拳的力量',
    cancel:                  '取消',
    penalty_rest:            '休息！',
    penalty_wait_signal:     '等訊號！',
    penalty_too_soon:        '太早了！',
    new_record_overlay:      '🏆 新紀錄！',
    max_level:               '最高等級',
    // — notas de sesión y colores por defecto —
    grade_s:                 '傳奇',
    grade_a:                 '大師',
    grade_b:                 '戰士',
    grade_c:                 '習練者',
    color_yellow:            '黃色',
    color_red:               '紅色',
    color_blue:              '藍色',
    // — resumen de configuración y XP de sesión —
    min_per_round:           '分鐘/回合',
    min_total:               '總分鐘',
    xp_earned_session:       '本次訓練獲得的 XP',
    level_up_to:             '⬆ 已升至 {n}',
    // — nivel numerado —
    level_n:                 '等級 {n}',
    // — botones del quiz —
    quiz_skip:               '跳過',
    quiz_back:               '← 返回',
  },
  ko: {
    profile_subtitle:     '프로필을 설정하고 시작하세요',
    name:                 '이름',
    weight:               '체중 (kg)',
    age:                  '나이',
    sex:                  '성별',
    male:                 '♂ 남성',
    female:               '♀ 여성',
    save_continue:        '저장하고 계속',
    name_placeholder:     '이름',
    weight_placeholder:   '70',
    age_placeholder:      '25',
    training_mode:        '트레이닝',
    training_desc:        '라운드별로 속도와 파워를 측정',
    combo_mode:           '반응 모드',
    combo_desc:           '반응 시간이 포함된 콤보',
    rounds_label:         '라운드',
    round_duration_label: '라운드 길이',
    rest_duration_label:  '라운드 간 휴식',
    config_start:         '훈련 시작',
    config_summary:       '{r} 라운드 · {rd} 분 · 휴식 {rst}초 · 총 약 {total} 분',
    val_rounds:           '{n} 라운드',
    val_round_duration:   '{n} 분',
    val_rest_duration:    '{n} 초',
    combo_hits_label:     '콤보당 타격 수',
    combo_duration_label: '콤보 최대 시간',
    combo_pause_label:    '신호 간격',
    combo_mode_label:     '모드',
    mode_fixed:           '고정',
    mode_random:          '랜덤',
    nav_profile:          '프로필',
    nav_train:            '훈련',
    nav_history:          '기록 내역',
    ios_permission_text:  'iOS에서는 가속도 센서 권한이 필요합니다',
    ios_permission_btn:   '🎯 모션 센서 활성화',
    ios_granted:          '✓ 센서 활성화됨',
    ios_denied:           '✗ 권한 거부됨 — 타격을 감지할 수 없습니다',
    round_indicator:      '라운드 {n}/{total}',
    punches:              '타격',
    wait_hits:            '{n} 타격',
    wait_max_time:        '최대 {t}초',
    speed_label:          '속도 m/s',
    power_label:          '파워',
    best_punch:           '최고의 타격',
    chart_last10:         '최근 10회 타격 (G)',
    rest_title:           '휴식',
    next_round:           '다음: 라운드 {n}',
    skip_rest:            '휴식 건너뛰기',
    avg_power_rest:       '평균 파워',
    session_complete:     '세션 완료',
    mode_training:        '🥊 트레이닝',
    mode_combo:           '⚡ 반응 모드',
    rounds_completed:     '라운드',
    total_punches:        '총 타격 수',
    avg_power_s:          '평균 파워',
    max_power_s:          '최대 파워',
    avg_speed_s:          '평균 속도',
    max_speed_s:          '최고 속도',
    avg_reaction_s:       '평균 반응',
    best_reaction_s:      '최고 반응',
    hits_s:               '콤보 성공',
    misses_s:             '콤보 실패',
    duration_s:           '시간',
    calories_s:           '예상 칼로리',
    save_session:         '세션 저장',
    back_menu:            '메뉴로 돌아가기',
    session_saved_txt:    '✓ 저장됨',
    cal_warmup:           '좋은 워밍업! 💪',
    cal_good:             '훌륭한 훈련! 🔥',
    cal_elite:            '엘리트급 세션! 🏆',
    vs_previous:          '지난 세션 대비: ',
    diff_punches_up:      '↑ +{n} 타격',
    diff_punches_down:    '↓ {n} 타격',
    diff_power_up:        '↑ +{n}G 파워',
    diff_power_down:      '↓ {n}G 파워',
    diff_reaction_faster: '↑ {n}ms 더 빠름',
    diff_reaction_slower: '↓ {n}ms 더 느림',
    stats_title:          '통계',
    records_title:        '🏆 역대 기록',
    best_reaction_rec:    '최고 반응',
    best_power_rec:       '최고 파워',
    most_punches_rec:     '최다 타격',
    totals_title:         '합계',
    total_sessions:       '세션 수',
    total_punches_h:      '총 타격 수',
    total_calories_h:     '총 칼로리',
    power_chart_title:    '평균 파워 (최근 10회)',
    reaction_chart_title: '반응 시간 (최근 10회)',
    calories_chart_title: '세션당 칼로리 (최근 10회)',
    no_sessions:          '아직 세션이 없습니다 🥊',
    hist_empty_title:     '아직 세션이 없습니다. 훈련을 시작하세요!',
    rank_empty_title:     '랭킹에 오르려면 세션을 완료하세요',
    settings_title:       '설정',
    language_label:       '언어',
    save_settings:        '저장',
    alert_enter_name:     '이름을 입력하세요',
    alert_weight:         '올바른 체중을 입력하세요 (30-200 kg)',
    alert_age:            '올바른 나이를 입력하세요 (10-100)',
    alert_weight_s:       '체중이 올바르지 않습니다',
    alert_age_s:          '나이가 올바르지 않습니다',
    confirm_stop:         '세션을 중단할까요?',
    abandon_penalty_title: '⚠️ 세션 중단됨',
    rank_master:          '⚫ 마스터',
    rank_fast:            '🟤 빠름',
    rank_good:            '🟡 좋아요',
    rank_keep:            '⚪ 계속 연습하세요',
    reaction_submode_label: '서브 모드',
    submode_simple:       '단일 타격',
    submode_combo:        '콤보 모드',
    last_reaction:        '마지막 반응',
    hits:                 '성공',
    misses:               '실패',
    best_reaction:        '최고 반응',
    combo_pct_s:          '유효 콤보 비율',
    best_combo_duration_s:'최고 콤보 시간',
    stimulus_wait:        '준비',
    stimulus_hit:         '히트!',
    stimulus_miss:        '실패',
    mode_reaction:        '⚡ 단순 반응',
    hits_simple_s:        '성공',
    misses_simple_s:      '실패',
    calib_menu_btn:       '기기 캘리브레이션',
    calib_title:          '기기 캘리브레이션',
    calib_desc:           '세기가 다른 3번의 타격으로 감지 임계값과 디바운스 시간을 측정합니다.',
    calib_start:          '캘리브레이션 시작',
    step:                 '단계',
    calib_step_instruction: '준비를 누른 뒤 타격하세요',
    calib_press_ready:    '자세를 잡고 준비를 누르세요',
    calib_ready_btn:      '준비',
    calib_listening:      '측정 중...',
    calib_detecting:      '타격 대기 중...',
    calib_next_step:      '다음 단계',
    calib_see_results:    '결과 보기',
    calib_results_title:  '캘리브레이션 완료',
    calib_threshold:      '임계값',
    calib_debounce:       '디바운스',
    calib_save:           '캘리브레이션 저장',
    calib_again:          '캘리브레이션 다시 하기',
    calib_existing_title: '✓ 저장된 캘리브레이션이 있습니다',
    calib_current_title:  '현재 캘리브레이션',
    calib_cur_threshold:  '감지 임계값',
    calib_cur_debounce:   '디바운스',
    calib_existing_date:  '날짜',
    calib_use_existing:   '✓ 이 캘리브레이션 사용',
    calib_recalibrate:    '🔄 다시 캘리브레이션',
    calib_notice:         '정확도를 높이려면 기기를 캘리브레이션하세요',
    calib_notice_btn:     '캘리브레이션',
    calib_peak_detected:  '타격 감지: {g}G',
    calib_repeat_punch:   '이 타격 다시 하기',
    calib_no_punch:       '타격이 감지되지 않았습니다. 다시 시도하세요.',
    calib_retry_btn:      '다시 시도',
    calib_sensor_live:    '센서: {g}G',
    calib_sensor_ok:      '✓ 센서 활성 — 지금 타격하세요',
    calib_sensor_off:     '⚠️ 센서를 사용할 수 없습니다',
    calib_tap_fallback:   '휴대폰이 감지하지 못함 — 탭 사용',
    calib_tap_used:       '탭으로 타격 시뮬레이션: {g}G',
    calib_result_soft:    '약한 타격 감지',
    calib_result_medium:  '중간 타격 감지',
    calib_result_hard:    '강한 타격 감지',
    calib_result_threshold: '설정된 임계값',
    calib_result_sensitivity: '민감도',
    calib_ms_debounce:    '디바운스 {n} ms',
    calib_manual_title:   '수동 조정',
    calib_manual_label:   '민감도: {g}G',
    calib_manual_desc:    '값이 낮을수록 더 민감',
    home_calib_status_yes: '✓ 캘리브레이션 저장됨 — {date}',
    home_calib_status_no: '⚠️ 캘리브레이션 안 됨 — 탭하여 설정',
    sound_label:          '소리',
    sound_on:             '켜짐',
    sound_off:            '음소거',
    submode_colors:       '컬러 모드',
    submode_colors_desc:  '화면 색에 반응하세요',
    color_labels_label:   '색 라벨',
    color_order_label:    '색 순서',
    color_yellow_ph:      '예: 다리',
    color_red_ph:         '예: 몸통',
    color_blue_ph:        '예: 머리',
    mode_colors:          '🎨 컬러 모드',
    color_stats_title:    '색상별 통계',
    help_title:           '도움말',
    card_reaction:        '반응',
    card_reaction_desc:   '반응 속도를 높이세요',
    card_power:           '파워',
    card_power_desc:      '더 강하게 치세요',
    card_combo:           '콤보',
    card_combo_desc:      '더 부드럽게 치세요',
    card_colors:          '컬러',
    card_colors_desc:     '정확도를 높이세요',
    card_record:          '기록',
    home_intro_title:     '당신의 펀치는 얼마나 강한가?',
    home_tagline_1:       '측정.',
    home_tagline_2:       '개선.',
    home_tagline_3:       '지배.',
    // — textos que antes estaban fijos en español —
    last_punch:              '마지막 타격',
    personal_record:         '개인 기록',
    vs_yesterday:            '어제 대비',
    btn_calibrate:           '캘리브레이션',
    nav_home:                '홈',
    nav_ranking:             '랭킹',
    speed_title:             '속도',
    global_ranking_soon:     '글로벌 랭킹 — 곧 출시',
    you:                     '나',
    auth_create_account:     '계정 만들기',
    auth_have_account:       '이미 계정이 있습니다',
    auth_full_name:          '이름',
    auth_full_name_ph:       '이름을 입력하세요',
    auth_email:              '이메일',
    auth_password:           '비밀번호',
    auth_password_min:       '비밀번호 (6자 이상)',
    auth_sport:              '종목 / 분야 (선택)',
    auth_sport_ph:           '복싱, 킥복싱...',
    auth_already:            '이미 계정이 있나요?',
    auth_login_link:         '로그인',
    auth_login_btn:          '로그인',
    auth_no_account:         '계정이 없나요?',
    auth_register_link:      '가입하기',
    auth_forgot:             '비밀번호를 잊었어요',
    auth_creating:           '생성 중...',
    auth_entering:           '로그인 중...',
    auth_err_name:           '이름을 입력하세요',
    auth_err_email:          '이메일이 올바르지 않습니다',
    auth_err_password:       '비밀번호는 6자 이상이어야 합니다',
    auth_err_weight:         '체중이 올바르지 않습니다 (30-200 kg)',
    auth_err_age:            '나이가 올바르지 않습니다 (10-100)',
    auth_err_create:         '계정을 만들지 못했습니다',
    auth_err_send:           '이메일을 보내지 못했습니다',
    auth_err_enter_email:    '이메일을 입력하세요',
    auth_err_enter_pass:     '비밀번호를 입력하세요',
    auth_err_credentials:    '이메일 또는 비밀번호가 틀렸습니다',
    auth_check_email:        '이메일을 확인해 계정을 인증하세요',
    auth_email_sent:         '이메일을 보냈습니다. 받은편지함을 확인하세요.',
    change_photo:            '사진 변경',
    logout:                  '로그아웃',
    training_type:           '훈련 유형',
    submode_simple_desc:     '신호 → 1회 타격 → 반응 측정',
    submode_combo_desc:      '신호 → 연속 타격',
    time_left:               '남은 시간',
    combo_duration:          '콤보 시간',
    verdict_fail:            '실패',
    result_completed:        '완료',
    result_incomplete:       '미완료',
    result_no_reaction:      '반응 없음',
    next_signal_in:          '다음 신호까지 {s}초',
    next_signal_soon:        '곧 다음 신호...',
    start_now:               '지금 시작!',
    best_combo:              '최고 콤보',
    total_time:              '총 시간',
    measure_my_punch:        '내 타격 측정하기',
    measure_calib_desc:      '첫 사용 또는 새 기기',
    mode_power_title:        '파워 모드',
    measure_power_desc:      '타격의 힘을 측정하세요',
    cancel:                  '취소',
    penalty_rest:            '쉬어!',
    penalty_wait_signal:     '신호를 기다려!',
    penalty_too_soon:        '너무 빨라!',
    new_record_overlay:      '🏆 신기록!',
    max_level:               '최고 레벨',
    // — notas de sesión y colores por defecto —
    grade_s:                 '전설',
    grade_a:                 '마스터',
    grade_b:                 '전사',
    grade_c:                 '수련생',
    color_yellow:            '노랑',
    color_red:               '빨강',
    color_blue:              '파랑',
    // — resumen de configuración y XP de sesión —
    min_per_round:           '분/RD',
    min_total:               '총 분',
    xp_earned_session:       '이번 세션에서 얻은 XP',
    level_up_to:             '⬆ {n} 달성',
    // — nivel numerado —
    level_n:                 '레벨 {n}',
    // — botones del quiz —
    quiz_skip:               '건너뛰기',
    quiz_back:               '← 뒤로',
  },
  ar: {
    profile_subtitle:     'أعدّ ملفك الشخصي للبدء',
    name:                 'الاسم',
    weight:               'الوزن (كجم)',
    age:                  'العمر',
    sex:                  'الجنس',
    male:                 '♂ ذكر',
    female:               '♀ أنثى',
    save_continue:        'حفظ ومتابعة',
    name_placeholder:     'اسمك',
    weight_placeholder:   '70',
    age_placeholder:      '25',
    training_mode:        'تدريب',
    training_desc:        'قِس السرعة والقوة عبر الجولات',
    combo_mode:           'وضع رد الفعل',
    combo_desc:           'كومبو مع قياس زمن رد الفعل',
    rounds_label:         'الجولات',
    round_duration_label: 'مدة الجولة',
    rest_duration_label:  'الراحة بين الجولات',
    config_start:         'بدء التدريب',
    config_summary:       '{r} جولات · {rd} دقيقة · راحة {rst} ثانية · ~{total} دقيقة إجمالاً',
    val_rounds:           '{n} جولات',
    val_round_duration:   '{n} دقيقة',
    val_rest_duration:    '{n} ثانية',
    combo_hits_label:     'الضربات في الكومبو',
    combo_duration_label: 'أقصى مدة للكومبو',
    combo_pause_label:    'الفاصل بين الإشارات',
    combo_mode_label:     'الوضع',
    mode_fixed:           'ثابت',
    mode_random:          'عشوائي',
    nav_profile:          'الملف الشخصي',
    nav_train:            'تدرّب',
    nav_history:          'السجل',
    ios_permission_text:  'يتطلب iOS إذنًا لمقياس التسارع',
    ios_permission_btn:   '🎯 تفعيل مستشعر الحركة',
    ios_granted:          '✓ المستشعر مُفعّل',
    ios_denied:           '✗ تم رفض الإذن — لا يمكن رصد الضربات',
    round_indicator:      'جولة {n}/{total}',
    punches:              'الضربات',
    wait_hits:            '{n} ضربات',
    wait_max_time:        '{t} ثانية كحد أقصى',
    speed_label:          'السرعة م/ث',
    power_label:          'القوة',
    best_punch:           'أفضل ضربة',
    chart_last10:         'آخر 10 ضربات (G)',
    rest_title:           'راحة',
    next_round:           'التالي: جولة {n}',
    skip_rest:            'تخطي الراحة',
    avg_power_rest:       'متوسط القوة',
    session_complete:     'اكتملت الجلسة',
    mode_training:        '🥊 تدريب',
    mode_combo:           '⚡ وضع رد الفعل',
    rounds_completed:     'الجولات',
    total_punches:        'إجمالي الضربات',
    avg_power_s:          'متوسط القوة',
    max_power_s:          'أقصى قوة',
    avg_speed_s:          'متوسط السرعة',
    max_speed_s:          'أقصى سرعة',
    avg_reaction_s:       'متوسط رد الفعل',
    best_reaction_s:      'أفضل رد فعل',
    hits_s:               'كومبو ناجح',
    misses_s:             'كومبو فاشل',
    duration_s:           'المدة',
    calories_s:           'السعرات التقديرية',
    save_session:         'حفظ الجلسة',
    back_menu:            'العودة للقائمة',
    session_saved_txt:    '✓ تم الحفظ',
    cal_warmup:           'إحماء جيد! 💪',
    cal_good:             'تمرين رائع! 🔥',
    cal_elite:            'جلسة من طراز النخبة! 🏆',
    vs_previous:          'مقارنة بالجلسة السابقة: ',
    diff_punches_up:      '↑ +{n} ضربة',
    diff_punches_down:    '↓ {n} ضربة',
    diff_power_up:        '↑ +{n}G قوة',
    diff_power_down:      '↓ {n}G قوة',
    diff_reaction_faster: '↑ أسرع بـ {n} مللي ثانية',
    diff_reaction_slower: '↓ أبطأ بـ {n} مللي ثانية',
    stats_title:          'الإحصائيات',
    records_title:        '🏆 الأرقام القياسية',
    best_reaction_rec:    'أفضل رد فعل',
    best_power_rec:       'أفضل قوة',
    most_punches_rec:     'أكثر عدد ضربات',
    totals_title:         'الإجماليات',
    total_sessions:       'الجلسات',
    total_punches_h:      'إجمالي الضربات',
    total_calories_h:     'إجمالي السعرات',
    power_chart_title:    'متوسط القوة (آخر 10)',
    reaction_chart_title: 'زمن رد الفعل (آخر 10)',
    calories_chart_title: 'السعرات لكل جلسة (آخر 10)',
    no_sessions:          'لا توجد جلسات بعد 🥊',
    hist_empty_title:     'ليست لديك أي جلسات بعد. ابدأ التدريب!',
    rank_empty_title:     'أكمل الجلسات لتظهر في الترتيب',
    settings_title:       'الإعدادات',
    language_label:       'اللغة',
    save_settings:        'حفظ',
    alert_enter_name:     'أدخل اسمك',
    alert_weight:         'أدخل وزنًا صحيحًا (30-200 كجم)',
    alert_age:            'أدخل عمرًا صحيحًا (10-100)',
    alert_weight_s:       'وزن غير صالح',
    alert_age_s:          'عمر غير صالح',
    confirm_stop:         'هل تريد إنهاء الجلسة؟',
    abandon_penalty_title: '⚠️ تم التخلي عن الجلسة',
    rank_master:          '⚫ أستاذ',
    rank_fast:            '🟤 سريع',
    rank_good:            '🟡 جيد',
    rank_keep:            '⚪ واصل التدريب',
    reaction_submode_label: 'الوضع الفرعي',
    submode_simple:       'ضربة واحدة',
    submode_combo:        'وضع الكومبو',
    last_reaction:        'آخر رد فعل',
    hits:                 'إصابات',
    misses:               'إخفاقات',
    best_reaction:        'أفضل رد فعل',
    combo_pct_s:          '٪ الكومبو الصحيح',
    best_combo_duration_s:'أفضل مدة كومبو',
    stimulus_wait:        'استعد',
    stimulus_hit:         'اضرب!',
    stimulus_miss:        'إخفاق',
    mode_reaction:        '⚡ رد فعل بسيط',
    hits_simple_s:        'إصابات',
    misses_simple_s:      'إخفاقات',
    calib_menu_btn:       'معايرة الجهاز',
    calib_title:          'معايرة الجهاز',
    calib_desc:           'وجّه 3 ضربات بقوى مختلفة لقياس عتبة الرصد وزمن منع التكرار.',
    calib_start:          'بدء المعايرة',
    step:                 'خطوة',
    calib_step_instruction: 'اضغط جاهز ثم وجّه الضربة',
    calib_press_ready:    'اضغط جاهز عندما تستعد',
    calib_ready_btn:      'جاهز',
    calib_listening:      'جارٍ الاستماع...',
    calib_detecting:      'في انتظار الضربة...',
    calib_next_step:      'الخطوة التالية',
    calib_see_results:    'عرض النتائج',
    calib_results_title:  'اكتملت المعايرة',
    calib_threshold:      'العتبة',
    calib_debounce:       'منع التكرار',
    calib_save:           'حفظ المعايرة',
    calib_again:          'إعادة المعايرة',
    calib_existing_title: '✓ لديك معايرة محفوظة بالفعل',
    calib_current_title:  'المعايرة الحالية',
    calib_cur_threshold:  'عتبة الرصد',
    calib_cur_debounce:   'منع التكرار',
    calib_existing_date:  'التاريخ',
    calib_use_existing:   '✓ استخدم هذه المعايرة',
    calib_recalibrate:    '🔄 إعادة المعايرة',
    calib_notice:         'عايِر جهازك لدقة أعلى',
    calib_notice_btn:     'معايرة',
    calib_peak_detected:  'تم رصد ضربة: {g}G',
    calib_repeat_punch:   'أعد هذه الضربة',
    calib_no_punch:       'لم تُرصد أي ضربة. حاول مرة أخرى.',
    calib_retry_btn:      'إعادة المحاولة',
    calib_sensor_live:    'المستشعر: {g}G',
    calib_sensor_ok:      '✓ المستشعر نشط — اضرب الآن',
    calib_sensor_off:     '⚠️ المستشعر غير متاح',
    calib_tap_fallback:   'هاتفي لا يرصد — استخدم اللمس',
    calib_tap_used:       'ضربة محاكاة باللمس: {g}G',
    calib_result_soft:    'تم رصد ضربة خفيفة',
    calib_result_medium:  'تم رصد ضربة متوسطة',
    calib_result_hard:    'تم رصد ضربة قوية',
    calib_result_threshold: 'العتبة المضبوطة',
    calib_result_sensitivity: 'الحساسية',
    calib_ms_debounce:    'منع التكرار {n} مللي ثانية',
    calib_manual_title:   'ضبط يدوي',
    calib_manual_label:   'الحساسية: {g}G',
    calib_manual_desc:    'القيمة الأقل = حساسية أعلى',
    home_calib_status_yes: '✓ تم حفظ المعايرة — {date}',
    home_calib_status_no: '⚠️ غير مُعايَر — المس للمعايرة',
    sound_label:          'الصوت',
    sound_on:             'مُفعّل',
    sound_off:            'صامت',
    submode_colors:       'وضع الألوان',
    submode_colors_desc:  'تفاعل مع لون الشاشة',
    color_labels_label:   'تسميات الألوان',
    color_order_label:    'ترتيب الألوان',
    color_yellow_ph:      'مثال: الساقان',
    color_red_ph:         'مثال: الجذع',
    color_blue_ph:        'مثال: الرأس',
    mode_colors:          '🎨 وضع الألوان',
    color_stats_title:    'إحصائيات حسب اللون',
    help_title:           'مساعدة',
    card_reaction:        'رد الفعل',
    card_reaction_desc:   'حسّن سرعة رد فعلك',
    card_power:           'القوة',
    card_power_desc:      'اضرب أقوى',
    card_combo:           'كومبو',
    card_combo_desc:      'اضرب بسلاسة أكبر',
    card_colors:          'الألوان',
    card_colors_desc:     'حسّن دقتك',
    card_record:          'رقم قياسي',
    home_intro_title:     'ما مدى قوة ضربتك؟',
    home_tagline_1:       'قِس.',
    home_tagline_2:       'حسِّن.',
    home_tagline_3:       'سيطر.',
    // — textos que antes estaban fijos en español —
    last_punch:              'آخر ضربة',
    personal_record:         'الرقم الشخصي',
    vs_yesterday:            'مقارنة بالأمس',
    btn_calibrate:           'معايرة',
    nav_home:                'الرئيسية',
    nav_ranking:             'الترتيب',
    speed_title:             'السرعة',
    global_ranking_soon:     'الترتيب العالمي — قريباً',
    you:                     'أنت',
    auth_create_account:     'إنشاء حساب',
    auth_have_account:       'لديّ حساب بالفعل',
    auth_full_name:          'الاسم الكامل',
    auth_full_name_ph:       'اسمك الكامل',
    auth_email:              'البريد الإلكتروني',
    auth_password:           'كلمة المرور',
    auth_password_min:       'كلمة المرور (6 أحرف على الأقل)',
    auth_sport:              'الرياضة / التخصص (اختياري)',
    auth_sport_ph:           'ملاكمة، كيك بوكسينغ...',
    auth_already:            'لديك حساب بالفعل؟',
    auth_login_link:         'تسجيل الدخول',
    auth_login_btn:          'دخول',
    auth_no_account:         'ليس لديك حساب؟',
    auth_register_link:      'إنشاء حساب',
    auth_forgot:             'نسيت كلمة المرور',
    auth_creating:           'جارٍ الإنشاء...',
    auth_entering:           'جارٍ الدخول...',
    auth_err_name:           'أدخل اسمك الكامل',
    auth_err_email:          'بريد إلكتروني غير صالح',
    auth_err_password:       'يجب ألا تقل كلمة المرور عن 6 أحرف',
    auth_err_weight:         'وزن غير صالح (30-200 كجم)',
    auth_err_age:            'عمر غير صالح (10-100)',
    auth_err_create:         'تعذّر إنشاء الحساب',
    auth_err_send:           'تعذّر إرسال البريد',
    auth_err_enter_email:    'أدخل بريدك الإلكتروني',
    auth_err_enter_pass:     'أدخل كلمة المرور',
    auth_err_credentials:    'البريد أو كلمة المرور غير صحيحة',
    auth_check_email:        'راجع بريدك لتأكيد حسابك',
    auth_email_sent:         'تم إرسال البريد. راجع صندوق الوارد.',
    change_photo:            'تغيير الصورة',
    logout:                  'تسجيل الخروج',
    training_type:           'نوع التدريب',
    submode_simple_desc:     'إشارة ← ضربة واحدة ← قياس رد الفعل',
    submode_combo_desc:      'إشارة ← سلسلة ضربات',
    time_left:               'الوقت المتبقي',
    combo_duration:          'مدة الكومبو',
    verdict_fail:            'إخفاق',
    result_completed:        'مكتمل',
    result_incomplete:       'غير مكتمل',
    result_no_reaction:      'بلا رد فعل',
    next_signal_in:          'الإشارة التالية بعد {s} ثانية',
    next_signal_soon:        'الإشارة التالية قريباً...',
    start_now:               'ابدأ الآن!',
    best_combo:              'أفضل كومبو',
    total_time:              'الوقت الإجمالي',
    measure_my_punch:        'قياس ضربتي',
    measure_calib_desc:      'أول استخدام أو جهاز جديد',
    mode_power_title:        'وضع القوة',
    measure_power_desc:      'قِس قوة ضربتك',
    cancel:                  'إلغاء',
    penalty_rest:            'استرح!',
    penalty_wait_signal:     'انتظر الإشارة!',
    penalty_too_soon:        'مبكر جداً!',
    new_record_overlay:      '🏆 رقم قياسي جديد!',
    max_level:               'أعلى مستوى',
    // — notas de sesión y colores por defecto —
    grade_s:                 'أسطوري',
    grade_a:                 'أستاذ',
    grade_b:                 'محارب',
    grade_c:                 'متدرب',
    color_yellow:            'أصفر',
    color_red:               'أحمر',
    color_blue:              'أزرق',
    // — resumen de configuración y XP de sesión —
    min_per_round:           'دقيقة/جولة',
    min_total:               'إجمالي الدقائق',
    xp_earned_session:       'نقاط الخبرة في هذه الجلسة',
    level_up_to:             '⬆ ارتقيت إلى {n}',
    // — nivel numerado —
    level_n:                 'المستوى {n}',
    // — botones del quiz —
    quiz_skip:               'تخطّي',
    quiz_back:               '← رجوع',
  },
  hi: {
    profile_subtitle:     'शुरू करने के लिए अपनी प्रोफ़ाइल सेट करें',
    name:                 'नाम',
    weight:               'वज़न (kg)',
    age:                  'उम्र',
    sex:                  'लिंग',
    male:                 '♂ पुरुष',
    female:               '♀ महिला',
    save_continue:        'सहेजें और जारी रखें',
    name_placeholder:     'आपका नाम',
    weight_placeholder:   '70',
    age_placeholder:      '25',
    training_mode:        'प्रशिक्षण',
    training_desc:        'राउंड के हिसाब से गति और शक्ति मापें',
    combo_mode:           'प्रतिक्रिया मोड',
    combo_desc:           'प्रतिक्रिया समय के साथ कॉम्बो',
    rounds_label:         'राउंड',
    round_duration_label: 'राउंड की अवधि',
    rest_duration_label:  'राउंड के बीच आराम',
    config_start:         'प्रशिक्षण शुरू करें',
    config_summary:       '{r} राउंड · {rd} मिनट · {rst}से आराम · कुल ~{total} मिनट',
    val_rounds:           '{n} राउंड',
    val_round_duration:   '{n} मिनट',
    val_rest_duration:    '{n} से',
    combo_hits_label:     'प्रति कॉम्बो प्रहार',
    combo_duration_label: 'कॉम्बो की अधिकतम अवधि',
    combo_pause_label:    'संकेतों के बीच विराम',
    combo_mode_label:     'मोड',
    mode_fixed:           'निश्चित',
    mode_random:          'यादृच्छिक',
    nav_profile:          'प्रोफ़ाइल',
    nav_train:            'अभ्यास',
    nav_history:          'इतिहास',
    ios_permission_text:  'iOS को एक्सेलेरोमीटर के लिए अनुमति चाहिए',
    ios_permission_btn:   '🎯 मोशन सेंसर चालू करें',
    ios_granted:          '✓ सेंसर चालू',
    ios_denied:           '✗ अनुमति अस्वीकृत — प्रहार का पता नहीं चल सकता',
    round_indicator:      'राउंड {n}/{total}',
    punches:              'प्रहार',
    wait_hits:            '{n} प्रहार',
    wait_max_time:        'अधिकतम {t}से',
    speed_label:          'गति m/s',
    power_label:          'शक्ति',
    best_punch:           'सर्वश्रेष्ठ प्रहार',
    chart_last10:         'पिछले 10 प्रहार (G)',
    rest_title:           'आराम',
    next_round:           'अगला: राउंड {n}',
    skip_rest:            'आराम छोड़ें',
    avg_power_rest:       'औसत शक्ति',
    session_complete:     'सत्र पूरा हुआ',
    mode_training:        '🥊 प्रशिक्षण',
    mode_combo:           '⚡ प्रतिक्रिया मोड',
    rounds_completed:     'राउंड',
    total_punches:        'कुल प्रहार',
    avg_power_s:          'औसत शक्ति',
    max_power_s:          'अधिकतम शक्ति',
    avg_speed_s:          'औसत गति',
    max_speed_s:          'अधिकतम गति',
    avg_reaction_s:       'औसत प्रतिक्रिया',
    best_reaction_s:      'सर्वश्रेष्ठ प्रतिक्रिया',
    hits_s:               'सफल कॉम्बो',
    misses_s:             'असफल कॉम्बो',
    duration_s:           'अवधि',
    calories_s:           'अनुमानित कैलोरी',
    save_session:         'सत्र सहेजें',
    back_menu:            'मेन्यू पर वापस',
    session_saved_txt:    '✓ सहेजा गया',
    cal_warmup:           'बढ़िया वार्म-अप! 💪',
    cal_good:             'शानदार कसरत! 🔥',
    cal_elite:            'एलीट सत्र! 🏆',
    vs_previous:          'पिछले सत्र की तुलना में: ',
    diff_punches_up:      '↑ +{n} प्रहार',
    diff_punches_down:    '↓ {n} प्रहार',
    diff_power_up:        '↑ +{n}G शक्ति',
    diff_power_down:      '↓ {n}G शक्ति',
    diff_reaction_faster: '↑ {n}ms तेज़',
    diff_reaction_slower: '↓ {n}ms धीमा',
    stats_title:          'आँकड़े',
    records_title:        '🏆 सर्वकालिक रिकॉर्ड',
    best_reaction_rec:    'सर्वश्रेष्ठ प्रतिक्रिया',
    best_power_rec:       'सर्वश्रेष्ठ शक्ति',
    most_punches_rec:     'सर्वाधिक प्रहार',
    totals_title:         'कुल',
    total_sessions:       'सत्र',
    total_punches_h:      'कुल प्रहार',
    total_calories_h:     'कुल कैलोरी',
    power_chart_title:    'औसत शक्ति (पिछले 10)',
    reaction_chart_title: 'प्रतिक्रिया समय (पिछले 10)',
    calories_chart_title: 'प्रति सत्र कैलोरी (पिछले 10)',
    no_sessions:          'अभी तक कोई सत्र नहीं 🥊',
    hist_empty_title:     'आपके पास अभी कोई सत्र नहीं है। अभ्यास शुरू करें!',
    rank_empty_title:     'रैंकिंग में आने के लिए सत्र पूरे करें',
    settings_title:       'सेटिंग्स',
    language_label:       'भाषा',
    save_settings:        'सहेजें',
    alert_enter_name:     'अपना नाम दर्ज करें',
    alert_weight:         'मान्य वज़न दर्ज करें (30-200 kg)',
    alert_age:            'मान्य उम्र दर्ज करें (10-100)',
    alert_weight_s:       'अमान्य वज़न',
    alert_age_s:          'अमान्य उम्र',
    confirm_stop:         'सत्र छोड़ दें?',
    abandon_penalty_title: '⚠️ सत्र छोड़ा गया',
    rank_master:          '⚫ गुरु',
    rank_fast:            '🟤 तेज़',
    rank_good:            '🟡 अच्छा',
    rank_keep:            '⚪ अभ्यास जारी रखें',
    reaction_submode_label: 'उप-मोड',
    submode_simple:       'एकल प्रहार',
    submode_combo:        'कॉम्बो मोड',
    last_reaction:        'पिछली प्रतिक्रिया',
    hits:                 'सफल',
    misses:               'चूक',
    best_reaction:        'सर्वश्रेष्ठ प्रतिक्रिया',
    combo_pct_s:          '% मान्य कॉम्बो',
    best_combo_duration_s:'सर्वश्रेष्ठ कॉम्बो अवधि',
    stimulus_wait:        'तैयार हो जाइए',
    stimulus_hit:         'मारो!',
    stimulus_miss:        'चूक',
    mode_reaction:        '⚡ सरल प्रतिक्रिया',
    hits_simple_s:        'सफल',
    misses_simple_s:      'चूक',
    calib_menu_btn:       'डिवाइस कैलिब्रेट करें',
    calib_title:          'डिवाइस कैलिब्रेट करें',
    calib_desc:           'पहचान सीमा और डिबाउंस समय मापने के लिए अलग-अलग तीव्रता के 3 प्रहार करें।',
    calib_start:          'कैलिब्रेशन शुरू करें',
    step:                 'चरण',
    calib_step_instruction: 'तैयार दबाएँ, फिर प्रहार करें',
    calib_press_ready:    'तैयार होने पर तैयार दबाएँ',
    calib_ready_btn:      'तैयार',
    calib_listening:      'सुन रहे हैं...',
    calib_detecting:      'प्रहार की प्रतीक्षा...',
    calib_next_step:      'अगला चरण',
    calib_see_results:    'परिणाम देखें',
    calib_results_title:  'कैलिब्रेशन पूरा',
    calib_threshold:      'सीमा',
    calib_debounce:       'डिबाउंस',
    calib_save:           'कैलिब्रेशन सहेजें',
    calib_again:          'कैलिब्रेशन दोहराएँ',
    calib_existing_title: '✓ आपके पास पहले से सहेजा कैलिब्रेशन है',
    calib_current_title:  'वर्तमान कैलिब्रेशन',
    calib_cur_threshold:  'पहचान सीमा',
    calib_cur_debounce:   'डिबाउंस',
    calib_existing_date:  'तारीख़',
    calib_use_existing:   '✓ यही कैलिब्रेशन उपयोग करें',
    calib_recalibrate:    '🔄 फिर से कैलिब्रेट करें',
    calib_notice:         'बेहतर सटीकता के लिए अपना डिवाइस कैलिब्रेट करें',
    calib_notice_btn:     'कैलिब्रेट',
    calib_peak_detected:  'प्रहार मिला: {g}G',
    calib_repeat_punch:   'यह प्रहार दोहराएँ',
    calib_no_punch:       'कोई प्रहार नहीं मिला। फिर कोशिश करें।',
    calib_retry_btn:      'फिर कोशिश करें',
    calib_sensor_live:    'सेंसर: {g}G',
    calib_sensor_ok:      '✓ सेंसर सक्रिय — अभी प्रहार करें',
    calib_sensor_off:     '⚠️ सेंसर उपलब्ध नहीं',
    calib_tap_fallback:   'मेरा फ़ोन पहचान नहीं पाता — टैप का उपयोग करें',
    calib_tap_used:       'टैप से नकली प्रहार: {g}G',
    calib_result_soft:    'हल्का प्रहार मिला',
    calib_result_medium:  'मध्यम प्रहार मिला',
    calib_result_hard:    'तेज़ प्रहार मिला',
    calib_result_threshold: 'निर्धारित सीमा',
    calib_result_sensitivity: 'संवेदनशीलता',
    calib_ms_debounce:    '{n} ms डिबाउंस',
    calib_manual_title:   'मैनुअल समायोजन',
    calib_manual_label:   'संवेदनशीलता: {g}G',
    calib_manual_desc:    'कम मान = अधिक संवेदनशील',
    home_calib_status_yes: '✓ कैलिब्रेशन सहेजा गया — {date}',
    home_calib_status_no: '⚠️ कैलिब्रेट नहीं — कैलिब्रेट करने के लिए टैप करें',
    sound_label:          'ध्वनि',
    sound_on:             'चालू',
    sound_off:            'म्यूट',
    submode_colors:       'रंग मोड',
    submode_colors_desc:  'स्क्रीन के रंग पर प्रतिक्रिया दें',
    color_labels_label:   'रंगों के लेबल',
    color_order_label:    'रंगों का क्रम',
    color_yellow_ph:      'जैसे: टाँगें',
    color_red_ph:         'जैसे: धड़',
    color_blue_ph:        'जैसे: सिर',
    mode_colors:          '🎨 रंग मोड',
    color_stats_title:    'रंग के अनुसार आँकड़े',
    help_title:           'सहायता',
    card_reaction:        'प्रतिक्रिया',
    card_reaction_desc:   'अपनी प्रतिक्रिया गति सुधारें',
    card_power:           'शक्ति',
    card_power_desc:      'और ज़ोर से मारें',
    card_combo:           'कॉम्बो',
    card_combo_desc:      'और सहजता से मारें',
    card_colors:          'रंग',
    card_colors_desc:     'अपनी सटीकता सुधारें',
    card_record:          'रिकॉर्ड',
    home_intro_title:     'आप कितनी ज़ोर से मारते हैं?',
    home_tagline_1:       'मापें।',
    home_tagline_2:       'सुधारें।',
    home_tagline_3:       'हावी हों।',
    // — textos que antes estaban fijos en español —
    last_punch:              'अंतिम प्रहार',
    personal_record:         'व्यक्तिगत रिकॉर्ड',
    vs_yesterday:            'कल की तुलना',
    btn_calibrate:           'कैलिब्रेट',
    nav_home:                'होम',
    nav_ranking:             'रैंकिंग',
    speed_title:             'गति',
    global_ranking_soon:     'वैश्विक रैंकिंग — जल्द आ रहा है',
    you:                     'आप',
    auth_create_account:     'खाता बनाएँ',
    auth_have_account:       'मेरा खाता पहले से है',
    auth_full_name:          'पूरा नाम',
    auth_full_name_ph:       'आपका पूरा नाम',
    auth_email:              'ईमेल',
    auth_password:           'पासवर्ड',
    auth_password_min:       'पासवर्ड (कम से कम 6 अक्षर)',
    auth_sport:              'खेल / विधा (वैकल्पिक)',
    auth_sport_ph:           'बॉक्सिंग, किकबॉक्सिंग...',
    auth_already:            'पहले से खाता है?',
    auth_login_link:         'लॉग इन करें',
    auth_login_btn:          'लॉग इन',
    auth_no_account:         'खाता नहीं है?',
    auth_register_link:      'साइन अप करें',
    auth_forgot:             'पासवर्ड भूल गए',
    auth_creating:           'बन रहा है...',
    auth_entering:           'लॉग इन हो रहा है...',
    auth_err_name:           'अपना पूरा नाम दर्ज करें',
    auth_err_email:          'अमान्य ईमेल',
    auth_err_password:       'पासवर्ड कम से कम 6 अक्षरों का होना चाहिए',
    auth_err_weight:         'अमान्य वज़न (30-200 kg)',
    auth_err_age:            'अमान्य उम्र (10-100)',
    auth_err_create:         'खाता नहीं बन सका',
    auth_err_send:           'ईमेल नहीं भेजा जा सका',
    auth_err_enter_email:    'अपना ईमेल दर्ज करें',
    auth_err_enter_pass:     'अपना पासवर्ड दर्ज करें',
    auth_err_credentials:    'ईमेल या पासवर्ड ग़लत है',
    auth_check_email:        'खाता पुष्टि करने के लिए अपना ईमेल देखें',
    auth_email_sent:         'ईमेल भेज दिया गया। इनबॉक्स देखें।',
    change_photo:            'फ़ोटो बदलें',
    logout:                  'लॉग आउट',
    training_type:           'प्रशिक्षण का प्रकार',
    submode_simple_desc:     'संकेत → 1 प्रहार → प्रतिक्रिया मापें',
    submode_combo_desc:      'संकेत → प्रहारों की शृंखला',
    time_left:               'शेष समय',
    combo_duration:          'कॉम्बो अवधि',
    verdict_fail:            'चूक',
    result_completed:        'पूर्ण',
    result_incomplete:       'अपूर्ण',
    result_no_reaction:      'कोई प्रतिक्रिया नहीं',
    next_signal_in:          'अगला संकेत {s} सेकंड में',
    next_signal_soon:        'अगला संकेत जल्द...',
    start_now:               'अभी शुरू करें!',
    best_combo:              'सर्वश्रेष्ठ कॉम्बो',
    total_time:              'कुल समय',
    measure_my_punch:        'मेरा प्रहार मापें',
    measure_calib_desc:      'पहला उपयोग या नया डिवाइस',
    mode_power_title:        'शक्ति मोड',
    measure_power_desc:      'अपने प्रहार की ताक़त मापें',
    cancel:                  'रद्द करें',
    penalty_rest:            'आराम करो!',
    penalty_wait_signal:     'संकेत का इंतज़ार करो!',
    penalty_too_soon:        'बहुत जल्दी!',
    new_record_overlay:      '🏆 नया रिकॉर्ड!',
    max_level:               'अधिकतम स्तर',
    // — notas de sesión y colores por defecto —
    grade_s:                 'महान',
    grade_a:                 'गुरु',
    grade_b:                 'योद्धा',
    grade_c:                 'अभ्यासी',
    color_yellow:            'पीला',
    color_red:               'लाल',
    color_blue:              'नीला',
    // — resumen de configuración y XP de sesión —
    min_per_round:           'मिनट/राउंड',
    min_total:               'कुल मिनट',
    xp_earned_session:       'इस सत्र में अर्जित XP',
    level_up_to:             '⬆ आप {n} तक पहुँचे',
    // — nivel numerado —
    level_n:                 'स्तर {n}',
    // — botones del quiz —
    quiz_skip:               'छोड़ें',
    quiz_back:               '← वापस',
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
    COMBO_HIT_COOLDOWN: 150,
    THRESHOLD: 0.8,           // G neto mínimo (default sin calibrar)
    // Suelo absoluto del umbral. Antes era 1.5G y en sacos/muñecos que
    // transmiten poca vibración al móvil ningún golpe lo superaba: no se
    // registraba nada y el XP se quedaba a 0. Ahora se permite bajar hasta
    // 0.01G y el usuario ajusta con el slider de sensibilidad.
    ABSOLUTE_MIN_G: 0.01,     // Nunca bajar de este valor aunque calibración lo pida
    MAX_THRESHOLD_G: 3.0,     // Tope del slider manual
    _logAt: 0,
  },
  sessionActive: false,
  hitWindowActive: false,
  records: { bestPower: 0, bestSpeed: 0, bestReaction: Infinity },
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
  audioBuffers: {},     // name -> AudioBuffer ya decodificado (caché)
  audioLoading: {},     // name -> Promise en vuelo (evita fetches duplicados)
  musicSource: null,    // handle de la música de fondo de los menús
  _audioUnlockArmed: false,
  _homeReached: false,  // true en cuanto se pisa el home (habilita la música)
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
    liveInterval: null,   // refresco 100ms de la lectura "Sensor: X.XG"
    sensorCheck: null,    // timeout que marca el sensor como no disponible
    sensorSeen: false,    // true en cuanto llega el primer evento devicemotion
    rawG: 0,              // última magnitud total leída (con gravedad)
    maxRawG: 0,           // máxima magnitud total del paso actual
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
// Los 12 idiomas de la app, en el orden en que se listan en el selector.
const LANGS = [
  { code: 'es',    flag: '🇪🇸', name: 'Español',  short: 'ES' },
  { code: 'en',    flag: '🇺🇸', name: 'English',  short: 'EN' },
  { code: 'pt',    flag: '🇧🇷', name: 'Português', short: 'PT' },
  { code: 'de',    flag: '🇩🇪', name: 'Deutsch',  short: 'DE' },
  { code: 'ja',    flag: '🇯🇵', name: '日本語',    short: 'JA' },
  { code: 'fr',    flag: '🇫🇷', name: 'Français', short: 'FR' },
  { code: 'ru',    flag: '🇷🇺', name: 'Русский',  short: 'RU' },
  { code: 'zh',    flag: '🇨🇳', name: '中文',      short: 'ZH' },
  { code: 'zh-TW', flag: '🇹🇼', name: '繁體中文',  short: '繁' },
  { code: 'ko',    flag: '🇰🇷', name: '한국어',    short: 'KO' },
  { code: 'ar',    flag: '🇸🇦', name: 'العربية',   short: 'AR' },
  { code: 'hi',    flag: '🇮🇳', name: 'हिन्दी',     short: 'HI' },
];

// Idiomas que se escriben de derecha a izquierda
const RTL_LANGS = ['ar'];

function isRTL(lang) {
  return RTL_LANGS.indexOf(lang || APP.lang) !== -1;
}

// Cadena de respaldo: idioma actual → inglés → español → la propia clave.
// El inglés va primero porque es el idioma pivote de las traducciones nuevas.
function t(key, params) {
  const dict = TRANSLATIONS[APP.lang] || TRANSLATIONS['en'];
  let str = dict[key];
  if (str === undefined) str = TRANSLATIONS['en'][key];
  if (str === undefined) str = TRANSLATIONS['es'][key];
  if (str === undefined) str = key;
  if (params) {
    Object.keys(params).forEach(k => {
      str = str.replace(new RegExp('\\{' + k + '\\}', 'g'), params[k]);
    });
  }
  return str;
}

function applyLanguage() {
  document.documentElement.lang = APP.lang;

  // RTL: el árabe invierte la dirección de toda la app
  const rtl = isRTL(APP.lang);
  document.documentElement.dir = rtl ? 'rtl' : 'ltr';
  document.body.classList.toggle('rtl', rtl);

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    const val = t(key);
    if (val !== key) el.textContent = val;
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });
  // Marca el idioma activo en los tres selectores (pantalla de idioma,
  // menú de ajustes y modal de ajustes)
  document.querySelectorAll('.btn-lang-sm, .btn-lang').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === APP.lang);
  });
}

const LOCALES = {
  es: 'es-ES', en: 'en-GB', pt: 'pt-BR', de: 'de-DE',
  ja: 'ja-JP', fr: 'fr-FR', ru: 'ru-RU', zh: 'zh-CN',
  'zh-TW': 'zh-TW', ko: 'ko-KR', ar: 'ar-SA', hi: 'hi-IN',
};

function getLocale() {
  return LOCALES[APP.lang] || 'es-ES';
}

// ═══════════════════════════════════════════════════
// SISTEMA DE NIVELES
// ═══════════════════════════════════════════════════
// Único escalafón de la app: el nivel se deriva siempre del XP acumulado.
const LEVELS = [
  { name: 'Rookie',        xp: 0       },
  { name: 'Amateur',       xp: 50000   },
  { name: 'Fighter',       xp: 150000  },
  { name: 'Contender',     xp: 350000  },
  { name: 'Warrior',       xp: 700000  },
  { name: 'Veteran',       xp: 1200000 },
  { name: 'Expert',        xp: 1900000 },
  { name: 'Elite',         xp: 2800000 },
  { name: 'Champion',      xp: 3900000 },
  { name: 'Grand Master',  xp: 5100000 },
  { name: 'Legend',        xp: 6500000 },
  { name: 'Impact Master', xp: 8500000 },
];

function getSessionScore(s) {
  return (s.punches || 0) + Math.round((s.maxSpeed || 0) * 10);
}

// Mantiene la firma antigua (recibe las sesiones) para no tocar los llamantes,
// pero el nivel sale del XP global, igual que en la barra de gamificación.
function getRankLevel(sessions) {
  const score = loadGamificationXP();
  const { idx, current, next } = getXPLevelInfo(score);
  return { score, level: current, nextLevel: next, idx };
}

// ═══════════════════════════════════════════════════
// GAMIFICACIÓN — MODO POTENCIA
// ═══════════════════════════════════════════════════
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

// El escalafón antiguo topaba en 25.000 XP y el nuevo pone Amateur en 50.000:
// sin migrar, todo el mundo volvería a Rookie. Se multiplica el XP guardado
// por 20 para reubicarlo en la nueva escala. Sólo una vez: el flag evita que
// una recarga vuelva a multiplicar.
const XP_MIGRATION_FLAG   = 'xp_migrated_v52';
const XP_MIGRATION_FACTOR = 20;

function migrateXPToV52() {
  if (localStorage.getItem(XP_MIGRATION_FLAG) === 'true') return;
  const stored = parseInt(localStorage.getItem('fkf_gam_xp'), 10);
  if (stored > 0) {
    const migrated = stored * XP_MIGRATION_FACTOR;
    localStorage.setItem('fkf_gam_xp', String(migrated));
    console.log(`[FKF] XP migrado al escalafón v52: ${stored} -> ${migrated}`);
  }
  localStorage.setItem(XP_MIGRATION_FLAG, 'true');
}

function loadGamificationXP() {
  const raw = parseInt(localStorage.getItem('fkf_gam_xp'), 10);
  if (!Number.isFinite(raw)) {
    // Primer arranque o valor corrupto: se inicializa a 0 en localStorage
    localStorage.setItem('fkf_gam_xp', '0');
    return 0;
  }
  return Math.max(0, raw);
}

function saveGamificationXP(xp) {
  const safe = Math.max(0, Math.round(Number(xp) || 0));
  localStorage.setItem('fkf_gam_xp', String(safe));
  if (APP.gamification) APP.gamification.totalXP = safe;
}

// APP.xp — espejo de solo lectura del XP persistido ('fkf_gam_xp'). Permite
// depurar desde el móvil (console.log / APP.xp) sin tener que recordar la
// clave de localStorage, y asignarle un valor lo guarda de verdad.
Object.defineProperty(APP, 'xp', {
  get() { return loadGamificationXP(); },
  set(v) { saveGamificationXP(v); updateGlobalXPBar(); },
});

function getXPLevelInfo(xp) {
  let idx = 0;
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].xp) { idx = i; break; }
  }
  return { idx, current: LEVELS[idx], next: LEVELS[idx + 1] || null };
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

  // Records — la celebración (sonido + overlay dorado) ya la dispara
  // checkPowerSpeedRecord() en registerPunch() para todos los modos
  let shownPersonal = false;
  if (punch.g > gam.historicBestG) {
    gam.historicBestG = punch.g;
    shownPersonal = true;
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
      celebrateRecord();
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
    const pct = Math.min(100, Math.round(((gam.totalXP - current.xp) / (next.xp - current.xp)) * 100));
    if (fillEl) fillEl.style.width = pct + '%';
    if (progEl) progEl.textContent = gam.totalXP + ' / ' + next.xp + ' XP';
  } else {
    if (fillEl) fillEl.style.width = '100%';
    if (progEl) progEl.textContent = gam.totalXP + ' XP · MAX';
  }
}

function showLevelUp(levelName) {
  playSound('level_up');
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
    ? Math.min(100, Math.round(((gam.totalXP - current.xp) / (next.xp - current.xp)) * 100))
    : 100;
  const leveledUp   = getXPLevelInfo(gam.totalXP).idx > gam.sessionStartLevelIdx;
  const leveledName = getXPLevelInfo(gam.totalXP).current.name;
  const progText    = next ? gam.totalXP + ' / ' + next.xp + ' XP' : gam.totalXP + ' XP · MAX';
  const _rTier = GLOBAL_HIT_TIERS.find(t => t.label === gam.sessionBestRating);
  const ratingColor = _rTier ? _rTier.color : '#FFD300';

  const existing = document.getElementById('gam-summary-section');
  if (existing) existing.remove();

  const div = document.createElement('div');
  div.id        = 'gam-summary-section';
  div.className = 'gam-summary-section';
  div.innerHTML = `
    <div class="gam-summary-xp">+${Math.max(0, gam.sessionXP)} XP</div>
    <div class="gam-summary-xp-label">${t('xp_earned_session')}</div>
    <div class="gam-summary-details">
      <div class="gam-summary-detail">
        <div class="gam-summary-detail-label">${t('best_punch').toUpperCase()}</div>
        <div class="gam-summary-detail-val" style="color:${ratingColor}">${gam.sessionBestRating || 'GOOD'}</div>
      </div>
      <div class="gam-summary-detail">
        <div class="gam-summary-detail-label">${t('best_combo')}</div>
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
    ${leveledUp ? `<div class="gam-summary-levelup">${t('level_up_to', { n: leveledName.toUpperCase() })}</div>` : ''}
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
      // Impacto seco + tono corto ascendente: sine 150Hz→400Hz/100ms + ruido 30ms
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = 'sine';
      o.frequency.setValueAtTime(150, t0);
      o.frequency.exponentialRampToValueAtTime(400, t0 + 0.1);
      g.gain.setValueAtTime(SFX_MAX_GAIN, t0);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.1);
      o.start(t0); o.stop(t0 + 0.12);
      playNoiseBurst(ctx, t0, 0.03, 0.18);

    } else if (rating === 'GREAT') {
      // Impacto más gordo + destello tonal: sawtooth 200Hz→600Hz/150ms + sine 800Hz decay 80ms
      const o1 = ctx.createOscillator(), g1 = ctx.createGain();
      o1.connect(g1); g1.connect(ctx.destination);
      o1.type = 'sawtooth';
      o1.frequency.setValueAtTime(200, t0);
      o1.frequency.exponentialRampToValueAtTime(600, t0 + 0.15);
      g1.gain.setValueAtTime(SFX_MAX_GAIN, t0);
      g1.gain.exponentialRampToValueAtTime(0.001, t0 + 0.15);
      o1.start(t0); o1.stop(t0 + 0.17);

      const o2 = ctx.createOscillator(), g2 = ctx.createGain();
      o2.connect(g2); g2.connect(ctx.destination);
      o2.type = 'sine';
      o2.frequency.value = 800;
      g2.gain.setValueAtTime(0.28, t0);
      g2.gain.exponentialRampToValueAtTime(0.001, t0 + 0.08);
      o2.start(t0); o2.stop(t0 + 0.09);

    } else if (rating === 'EXCELLENT') {
      // "CRACK" arcade: square 300Hz→800Hz/180ms + acorde doble sine 1000+1200Hz/100ms
      const o1 = ctx.createOscillator(), g1 = ctx.createGain();
      o1.connect(g1); g1.connect(ctx.destination);
      o1.type = 'square';
      o1.frequency.setValueAtTime(300, t0);
      o1.frequency.exponentialRampToValueAtTime(800, t0 + 0.18);
      g1.gain.setValueAtTime(SFX_MAX_GAIN, t0);
      g1.gain.exponentialRampToValueAtTime(0.001, t0 + 0.18);
      o1.start(t0); o1.stop(t0 + 0.2);

      [1000, 1200].forEach(f => {
        const o2 = ctx.createOscillator(), g2 = ctx.createGain();
        o2.connect(g2); g2.connect(ctx.destination);
        o2.type = 'sine';
        o2.frequency.value = f;
        g2.gain.setValueAtTime(0.22, t0);
        g2.gain.exponentialRampToValueAtTime(0.001, t0 + 0.1);
        o2.start(t0); o2.stop(t0 + 0.11);
      });

    } else if (rating === 'MASTER') {
      // "BOOM" pesado: ruido blanco 100ms + 4 tonos rápidos 400→600→800→1000Hz cada 40ms
      playNoiseBurst(ctx, t0, 0.1, SFX_MAX_GAIN);

      [400, 600, 800, 1000].forEach((f, i) => {
        const ti = t0 + i * 0.04;
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.type = 'square';
        o.frequency.value = f;
        g.gain.setValueAtTime(0.3, ti);
        g.gain.exponentialRampToValueAtTime(0.001, ti + 0.04);
        o.start(ti); o.stop(ti + 0.05);
      });

    } else if (rating === 'SIFU LEVEL') {
      // BOOM épico de 3 capas: ruido 200ms + sub-bass 60Hz decay 300ms + acorde épico 5 notas/200ms, reverb largo 500ms
      const reverb = createSyntheticReverb(ctx, 0.12, 0.4);

      playNoiseBurst(ctx, t0, 0.2, SFX_MAX_GAIN, reverb);

      const sub = ctx.createOscillator(), subG = ctx.createGain();
      sub.connect(subG); subG.connect(ctx.destination);
      sub.type = 'sine';
      sub.frequency.value = 60;
      subG.gain.setValueAtTime(SFX_MAX_GAIN, t0);
      subG.gain.exponentialRampToValueAtTime(0.001, t0 + 0.3);
      sub.start(t0); sub.stop(t0 + 0.32);

      [200, 300, 400, 600, 800].forEach((f, i) => {
        const ti = t0 + i * 0.02;
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination); g.connect(reverb);
        o.type = 'sawtooth';
        o.frequency.value = f;
        g.gain.setValueAtTime(0.22, ti);
        g.gain.exponentialRampToValueAtTime(0.001, ti + 0.2);
        o.start(ti); o.stop(ti + 0.22);
      });
    }
  } catch(e) {}
}

// Cascada estilo Candy Crush: Sol Si Re Fa# La Do Re Sol(agudo) — más notas y más épico
// cuanto mayor el combo (x5: 3 notas · x10: 4+reverb · x20: 5+explosión · x50: fanfarria de 8)
const COMBO_STREAK_NOTES = [392, 494, 587, 740, 880, 1047, 1175, 1568];

function playComboStreakSound(milestone) {
  if (!APP.soundEnabled) return;
  try {
    const ctx = getAudioCtx();
    if (ctx.state === 'suspended') ctx.resume();
    const t0 = ctx.currentTime;
    const noteDur = 0.08, noteSep = 0.04;

    const playNote = (t, f, out) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      if (out) g.connect(out);
      o.type = 'sine';
      o.frequency.value = f;
      g.gain.setValueAtTime(SFX_MAX_GAIN, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + noteDur);
      o.start(t); o.stop(t + noteDur + 0.02);
    };

    const sparkle = (t) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = 'sine';
      o.frequency.value = 1200;
      g.gain.setValueAtTime(0.25, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
      o.start(t); o.stop(t + 0.07);
    };

    let count, reverb = null, explosion = false;
    if      (milestone === 5)  { count = 3; }
    else if (milestone === 10) { count = 4; reverb = createSyntheticReverb(ctx, 0.09, 0.28); }
    else if (milestone === 20) { count = 5; reverb = createSyntheticReverb(ctx, 0.1, 0.32);  explosion = true; }
    else if (milestone === 50) { count = 8; reverb = createSyntheticReverb(ctx, 0.12, 0.4);  explosion = true; }
    else return;

    for (let i = 0; i < count; i++) {
      playNote(t0 + i * (noteDur + noteSep), COMBO_STREAK_NOTES[i], reverb);
    }
    const tEnd = t0 + count * (noteDur + noteSep);
    sparkle(tEnd);
    if (explosion) playNoiseBurst(ctx, tEnd, 0.15, SFX_MAX_GAIN, reverb);
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

// BOOM de récord histórico batido — 4 fases:
// 1) impacto brutal (igual que SIFU LEVEL) · 2) silencio dramático 100ms
// 3) fanfarria épica Do Mi Sol Do Mi Sol crescendo con overlap · 4) reverb larga que se desvanece
function playRecordSound() {
  if (!APP.soundEnabled) return;
  try {
    const ctx = getAudioCtx();
    if (ctx.state === 'suspended') ctx.resume();
    const t0 = ctx.currentTime;
    const reverb = createSyntheticReverb(ctx, 0.14, 0.45);

    // Fase 1 (0ms): impacto brutal igual que SIFU LEVEL
    playNoiseBurst(ctx, t0, 0.2, SFX_MAX_GAIN, reverb);

    const sub = ctx.createOscillator(), subG = ctx.createGain();
    sub.connect(subG); subG.connect(ctx.destination);
    sub.type = 'sine';
    sub.frequency.value = 60;
    subG.gain.setValueAtTime(SFX_MAX_GAIN, t0);
    subG.gain.exponentialRampToValueAtTime(0.001, t0 + 0.3);
    sub.start(t0); sub.stop(t0 + 0.32);

    [200, 300, 400, 600, 800].forEach((f, i) => {
      const ti = t0 + i * 0.02;
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination); g.connect(reverb);
      o.type = 'sawtooth';
      o.frequency.value = f;
      g.gain.setValueAtTime(0.22, ti);
      g.gain.exponentialRampToValueAtTime(0.001, ti + 0.2);
      o.start(ti); o.stop(ti + 0.22);
    });

    // Fase 2 (200ms→300ms): silencio dramático — nada programado en ese hueco

    // Fase 3 (300ms): fanfarria Do Mi Sol Do(alto) Mi(alto) Sol(alto), crescendo, notas solapadas
    const t3    = t0 + 0.3;
    const notes = [261, 329, 392, 523, 659, 784];
    notes.forEach((f, i) => {
      const ti     = t3 + i * 0.12;
      const isLast = i === notes.length - 1;
      const dur    = isLast ? 0.5 : 0.18;
      const peak   = Math.min(SFX_MAX_GAIN, 0.14 + i * 0.045);
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination); g.connect(reverb);
      o.type = 'sine';
      o.frequency.value = f;
      g.gain.setValueAtTime(peak, ti);
      g.gain.exponentialRampToValueAtTime(0.001, ti + dur);
      o.start(ti); o.stop(ti + dur + 0.02);
    });

    // Fase 4 (~1000ms): la reverb compartida (delay+feedback) se desvanece de forma natural
  } catch(e) {}
}

// Overlay dorado a pantalla completa para un récord histórico batido
function showRecordOverlay() {
  const ov = document.createElement('div');
  ov.className = 'record-overlay';
  ov.innerHTML = '<div class="record-overlay-text">' + t('new_record_overlay') + '</div>';
  document.body.appendChild(ov);
  spawnHitParticles('#FFD300', window.innerWidth / 2, window.innerHeight / 2, 26);
  trackedTimeout(() => ov.remove(), 2000);
}

// Celebración unificada de récord histórico: sonido BOOM + overlay dorado
function celebrateRecord() {
  playRecordSound();
  showRecordOverlay();
}

// ═══════════════════════════════════════════════════
// AAA — EPIC MESSAGE POOL
// ═══════════════════════════════════════════════════
// Frases de hito, una lista por idioma (como HELP_SECTIONS). Van fuera de
// TRANSLATIONS porque se eligen al azar dentro de cada grupo.
const EPIC_MSGS = {
  es: {
    record:   ['🎯 NUEVO RÉCORD PERSONAL', '⚡ RÉCORD ROTO', '🏆 HISTORIA ESCRITA', '💎 NIVEL DIOS'],
    best:     ['💥 MEJOR GOLPE HOY', '🔥 TÚ EN LLAMAS', '💪 ASÍ SE HACE'],
    streak10: ['🔥 10 GOLPES SEGUIDOS', '⚡ IMPARABLE', '🔥 EN RACHA'],
    streak20: ['💀 20 SIN PARAR', '🌪️ TORBELLINO', '⚡ MODO BESTIA'],
    streak25: ['🏆 25 HIT STREAK', '🔥 LEYENDA EN CURSO', '💥 ¡INCREÍBLE!'],
    streak50: ['🔥 50 HIT STREAK!', '💀 MODO SIFU', '🏆 COMBO ÉPICO'],
  },
  en: {
    record:   ['🎯 NEW PERSONAL RECORD', '⚡ RECORD BROKEN', '🏆 HISTORY MADE', '💎 GOD TIER'],
    best:     ['💥 BEST PUNCH TODAY', '🔥 YOU\'RE ON FIRE', '💪 THAT\'S HOW IT\'S DONE'],
    streak10: ['🔥 10 IN A ROW', '⚡ UNSTOPPABLE', '🔥 ON A ROLL'],
    streak20: ['💀 20 NON-STOP', '🌪️ WHIRLWIND', '⚡ BEAST MODE'],
    streak25: ['🏆 25 HIT STREAK', '🔥 LEGEND IN THE MAKING', '💥 INCREDIBLE!'],
    streak50: ['🔥 50 HIT STREAK!', '💀 SIFU MODE', '🏆 EPIC COMBO'],
  },
  pt: {
    record:   ['🎯 NOVO RECORDE PESSOAL', '⚡ RECORDE QUEBRADO', '🏆 HISTÓRIA ESCRITA', '💎 NÍVEL DEUS'],
    best:     ['💥 MELHOR GOLPE DE HOJE', '🔥 VOCÊ ESTÁ PEGANDO FOGO', '💪 É ASSIM QUE SE FAZ'],
    streak10: ['🔥 10 SEGUIDOS', '⚡ IMPARÁVEL', '🔥 EMBALADO'],
    streak20: ['💀 20 SEM PARAR', '🌪️ FURACÃO', '⚡ MODO FERA'],
    streak25: ['🏆 25 HIT STREAK', '🔥 LENDA EM FORMAÇÃO', '💥 INCRÍVEL!'],
    streak50: ['🔥 50 HIT STREAK!', '💀 MODO SIFU', '🏆 COMBO ÉPICO'],
  },
  de: {
    record:   ['🎯 NEUER PERSÖNLICHER REKORD', '⚡ REKORD GEBROCHEN', '🏆 GESCHICHTE GESCHRIEBEN', '💎 GOTT-LEVEL'],
    best:     ['💥 BESTER SCHLAG HEUTE', '🔥 DU BRENNST', '💪 SO GEHT DAS'],
    streak10: ['🔥 10 AM STÜCK', '⚡ UNAUFHALTSAM', '🔥 IM LAUF'],
    streak20: ['💀 20 OHNE PAUSE', '🌪️ WIRBELSTURM', '⚡ BESTIENMODUS'],
    streak25: ['🏆 25 HIT STREAK', '🔥 LEGENDE IM WERDEN', '💥 UNGLAUBLICH!'],
    streak50: ['🔥 50 HIT STREAK!', '💀 SIFU-MODUS', '🏆 EPISCHES COMBO'],
  },
  ja: {
    record:   ['🎯 自己新記録', '⚡ 記録更新', '🏆 歴史を刻んだ', '💎 神レベル'],
    best:     ['💥 本日のベストパンチ', '🔥 絶好調', '💪 その調子'],
    streak10: ['🔥 10連続', '⚡ 止まらない', '🔥 ノリに乗ってる'],
    streak20: ['💀 20連続', '🌪️ 竜巻', '⚡ ビーストモード'],
    streak25: ['🏆 25連続ヒット', '🔥 伝説進行中', '💥 信じられない!'],
    streak50: ['🔥 50連続ヒット!', '💀 師父モード', '🏆 エピックコンボ'],
  },
  fr: {
    record:   ['🎯 NOUVEAU RECORD PERSONNEL', '⚡ RECORD BATTU', '🏆 HISTOIRE ÉCRITE', '💎 NIVEAU DIVIN'],
    best:     ['💥 MEILLEUR COUP DU JOUR', '🔥 TU ES EN FEU', '💪 C\'EST COMME ÇA'],
    streak10: ['🔥 10 D\'AFFILÉE', '⚡ INARRÊTABLE', '🔥 EN SÉRIE'],
    streak20: ['💀 20 SANS S\'ARRÊTER', '🌪️ TOURBILLON', '⚡ MODE BÊTE'],
    streak25: ['🏆 25 COUPS D\'AFFILÉE', '🔥 LÉGENDE EN COURS', '💥 INCROYABLE !'],
    streak50: ['🔥 50 COUPS D\'AFFILÉE !', '💀 MODE SIFU', '🏆 COMBO ÉPIQUE'],
  },
  ru: {
    record:   ['🎯 НОВЫЙ ЛИЧНЫЙ РЕКОРД', '⚡ РЕКОРД ПОБИТ', '🏆 ИСТОРИЯ НАПИСАНА', '💎 БОЖЕСТВЕННЫЙ УРОВЕНЬ'],
    best:     ['💥 ЛУЧШИЙ УДАР ДНЯ', '🔥 ТЫ В ОГНЕ', '💪 ВОТ ТАК НАДО'],
    streak10: ['🔥 10 ПОДРЯД', '⚡ НЕОСТАНОВИМ', '🔥 В УДАРЕ'],
    streak20: ['💀 20 БЕЗ ОСТАНОВКИ', '🌪️ ВИХРЬ', '⚡ РЕЖИМ ЗВЕРЯ'],
    streak25: ['🏆 25 УДАРОВ ПОДРЯД', '🔥 РОЖДАЕТСЯ ЛЕГЕНДА', '💥 НЕВЕРОЯТНО!'],
    streak50: ['🔥 50 УДАРОВ ПОДРЯД!', '💀 РЕЖИМ СИФУ', '🏆 ЭПИЧЕСКОЕ КОМБО'],
  },
  zh: {
    record:   ['🎯 个人新纪录', '⚡ 纪录被打破', '🏆 创造历史', '💎 神级'],
    best:     ['💥 今日最佳一拳', '🔥 你正火热', '💪 就该这样'],
    streak10: ['🔥 连续 10 次', '⚡ 势不可挡', '🔥 手感火热'],
    streak20: ['💀 连续 20 次', '🌪️ 旋风', '⚡ 野兽模式'],
    streak25: ['🏆 25 连击', '🔥 传奇正在诞生', '💥 太不可思议了！'],
    streak50: ['🔥 50 连击！', '💀 师父模式', '🏆 史诗连击'],
  },
  'zh-TW': {
    record:   ['🎯 個人新紀錄', '⚡ 紀錄被打破', '🏆 創造歷史', '💎 神級'],
    best:     ['💥 今日最佳一拳', '🔥 你正火熱', '💪 就該這樣'],
    streak10: ['🔥 連續 10 次', '⚡ 勢不可擋', '🔥 手感火熱'],
    streak20: ['💀 連續 20 次', '🌪️ 旋風', '⚡ 野獸模式'],
    streak25: ['🏆 25 連擊', '🔥 傳奇正在誕生', '💥 太不可思議了！'],
    streak50: ['🔥 50 連擊！', '💀 師父模式', '🏆 史詩連擊'],
  },
  ko: {
    record:   ['🎯 개인 신기록', '⚡ 기록 경신', '🏆 역사를 썼다', '💎 신의 경지'],
    best:     ['💥 오늘의 최고 타격', '🔥 불붙었다', '💪 바로 그거야'],
    streak10: ['🔥 10연속', '⚡ 멈출 수 없다', '🔥 상승세'],
    streak20: ['💀 20연속', '🌪️ 회오리', '⚡ 비스트 모드'],
    streak25: ['🏆 25연속 히트', '🔥 전설이 되는 중', '💥 믿을 수 없어!'],
    streak50: ['🔥 50연속 히트!', '💀 사부 모드', '🏆 에픽 콤보'],
  },
  ar: {
    record:   ['🎯 رقم شخصي جديد', '⚡ تحطم الرقم القياسي', '🏆 صنعت التاريخ', '💎 مستوى أسطوري'],
    best:     ['💥 أفضل ضربة اليوم', '🔥 أنت مشتعل', '💪 هكذا يكون الأمر'],
    streak10: ['🔥 10 متتالية', '⚡ لا يمكن إيقافك', '🔥 في أوج تألقك'],
    streak20: ['💀 20 بلا توقف', '🌪️ إعصار', '⚡ وضع الوحش'],
    streak25: ['🏆 25 ضربة متتالية', '🔥 أسطورة قيد الصنع', '💥 لا يُصدَّق!'],
    streak50: ['🔥 50 ضربة متتالية!', '💀 وضع السيفو', '🏆 كومبو أسطوري'],
  },
  hi: {
    record:   ['🎯 नया व्यक्तिगत रिकॉर्ड', '⚡ रिकॉर्ड टूटा', '🏆 इतिहास रच दिया', '💎 ईश्वरीय स्तर'],
    best:     ['💥 आज का सर्वश्रेष्ठ प्रहार', '🔥 आप आग पर हैं', '💪 ऐसे होता है'],
    streak10: ['🔥 लगातार 10', '⚡ अजेय', '🔥 लय में'],
    streak20: ['💀 लगातार 20', '🌪️ बवंडर', '⚡ बीस्ट मोड'],
    streak25: ['🏆 25 लगातार प्रहार', '🔥 किंवदंती बन रही है', '💥 अविश्वसनीय!'],
    streak50: ['🔥 50 लगातार प्रहार!', '💀 सिफू मोड', '🏆 महाकाव्य कॉम्बो'],
  },
};

function pickEpicMsg(type) {
  const set  = EPIC_MSGS[APP.lang] || EPIC_MSGS.en;
  const pool = set[type] || EPIC_MSGS.en[type] || ['🔥'];
  return pool[Math.floor(Math.random() * pool.length)];
}

// ═══════════════════════════════════════════════════
// AAA — GLOBAL HIT FEEDBACK (all modes)
// ═══════════════════════════════════════════════════
function triggerHitFeedback(gForce) {
  const tier = getGlobalTier(gForce);
  boostBgSpeed();

  // Log temporal de depuración en móvil: si el XP no sube, aquí se ve si el
  // golpe llegó y con qué flags de sesión.
  console.log('[XP] golpe detectado, G:', Number(gForce).toFixed(2),
              'XP antes:', APP.xp, '| tier:', tier.label, '+' + tier.xp,
              '| sessionActive:', APP.sessionActive,
              '| IMPACT_SESSION_ACTIVE:', window.IMPACT_SESSION_ACTIVE);

  // Dar XP solo durante una sesión/round activo
  if (APP.sessionActive || window.IMPACT_SESSION_ACTIVE) {
    const prev = loadGamificationXP();
    const next = prev + tier.xp;
    saveGamificationXP(next);
    if (APP.gamification) APP.gamification.totalXP = next;
    updateGlobalXPBar();
    console.log('[XP] XP después:', APP.xp);
  } else {
    console.warn('[XP] sin sesión activa — no se suma XP');
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
      ? Math.min(100, Math.round(((xp - inf.current.xp) / (inf.next.xp - inf.current.xp)) * 100))
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

function spawnHitParticles(color, originX, originY, countBase) {
  const canvas = document.getElementById('hit-particle-canvas');
  if (!canvas) return;
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  const ctx = canvas.getContext('2d');
  const cx  = originX != null ? originX : canvas.width / 2;
  const cy  = originY != null ? originY : canvas.height * 0.42;
  const count = _fxParticleCount(countBase || 10);
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

// El fondo de partículas es GLOBAL y permanente: arranca una vez y no se
// detiene nunca, para que se vea en todas las pantallas.
//
// Ojo con el tracking: el loop usa requestAnimationFrame/setTimeout DIRECTOS,
// no trackedRAF/trackedTimeout. stopEverything() cancela todos los RAF y
// timers trackeados, y eso era lo que apagaba el fondo en cuanto se salía
// del home (además de las llamadas explícitas a stopBgParticles()).
function startBgParticles() {
  if (_homeParticleRAF) return;
  const canvas = document.getElementById('bg-particles');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let W, H;
  const resize = () => {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  };
  resize();
  // Sin esto, al girar el móvil el canvas se quedaba con el tamaño viejo:
  // antes se disimulaba porque el loop se reiniciaba en cada navegación.
  window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', resize);

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
    _homeLightningTimer = window.setTimeout(() => {
      lightning = { x1: Math.random() * W, y1: 0, x2: Math.random() * W, y2: H, life: 6 };
      scheduleLightning();
    }, 4000 + Math.random() * 2000);
  };
  scheduleLightning();

  let frame = 0;
  const tick = () => {
    if (_fxPaused) { _homeParticleRAF = window.requestAnimationFrame(tick); return; }
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
    _homeParticleRAF = window.requestAnimationFrame(tick);
  };
  tick();
}

// No-op deliberado. Una docena de rutas de navegación llamaban a esto al
// salir del home, que es justo por lo que el fondo sólo se veía ahí. Ahora
// el fondo es global y permanente, así que "parar" no debe hacer nada; se
// mantiene la función para no tener que tocar todos esos llamantes (y para
// que uno nuevo tampoco pueda volver a apagarlo por accidente).
function stopBgParticles() {}

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
  if (!punches.length) return { grade: 'C', label: t('grade_c') };
  const tiers = punches.map(p => getGlobalTier(p.g).label);
  const top   = tiers.filter(l => ['EXCELLENT','MASTER','SIFU LEVEL'].includes(l)).length;
  const good  = tiers.filter(l => ['GREAT','EXCELLENT','MASTER','SIFU LEVEL'].includes(l)).length;
  const pct   = ratio => ratio / punches.length;
  if (pct(top)  >= 0.3) return { grade: 'S', label: t('grade_s') };
  if (pct(good) >= 0.3) return { grade: 'A', label: t('grade_a') };
  if (pct(tiers.filter(l => ['GOOD','GREAT','EXCELLENT','MASTER','SIFU LEVEL'].includes(l)).length) >= 0.4) return { grade: 'B', label: t('grade_b') };
  return { grade: 'C', label: t('grade_c') };
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
// Pantallas de sesión: la música de fondo de los menús no suena aquí.
// El resto (home, config, historial, perfil, ayuda, calibración…) sí.
const SESSION_SCREENS = [
  'screen-training', 'screen-reaction', 'screen-combo', 'screen-colors',
  'screen-rest', 'screen-abandon-penalty', 'screen-result-splash', 'screen-summary',
];

// Punto único que decide si la música debe sonar en la pantalla actual.
// Se aplaza un tick porque varios llamantes hacen showScreen('screen-menu')
// e inmediatamente después initMenuScreen(), que arranca con stopEverything().
function syncMenuMusic(screenId) {
  trackedTimeout(() => {
    if (SESSION_SCREENS.indexOf(screenId) !== -1) stopMenuMusic();
    else startMenuMusic();
  }, 0);
}

// ═══════════════════════════════════════════════════
// PANTALLA COMPLETA
// En landscape la barra del navegador se comía parte del round. La PWA
// instalada lo resuelve con display:fullscreen en el manifest; desde el
// navegador hace falta la Fullscreen API, que exige un gesto del usuario:
// por eso se pide en el click de INICIAR ENTRENAMIENTO y no al pintar la
// pantalla del round.
// Nota: Safari en iPhone no implementa la Fullscreen API (sólo en <video>),
// así que ahí la única vía es instalar la app.
// ═══════════════════════════════════════════════════
function isFullscreen() {
  return !!(document.fullscreenElement    || document.webkitFullscreenElement ||
            document.mozFullScreenElement || document.msFullscreenElement);
}

function requestFullscreen() {
  if (isFullscreen()) return;
  const el = document.documentElement;
  try {
    if (el.requestFullscreen) {
      const p = el.requestFullscreen({ navigationUI: 'hide' });
      if (p && p.catch) p.catch(() => {});   // denegado o sin gesto: se ignora
    }
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    else if (el.mozRequestFullScreen)    el.mozRequestFullScreen();
    else if (el.msRequestFullscreen)     el.msRequestFullscreen();
  } catch (e) {}
}

function exitFullscreen() {
  if (!isFullscreen()) return;
  try {
    if (document.exitFullscreen) {
      const p = document.exitFullscreen();
      if (p && p.catch) p.catch(() => {});
    }
    else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
    else if (document.mozCancelFullScreen)  document.mozCancelFullScreen();
    else if (document.msExitFullscreen)     document.msExitFullscreen();
  } catch (e) {}
}

function showScreen(id, instant) {
  const current = document.querySelector('.screen:not(.hidden)');
  syncMenuMusic(id);
  // Al salir de la sesión (home, historial, resumen cerrado…) se devuelve la
  // barra del navegador. Las pantallas de round/descanso/resumen la mantienen
  // oculta para no dar un salto de layout en mitad del entreno.
  if (SESSION_SCREENS.indexOf(id) === -1) exitFullscreen();
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

// ═══════════════════════════════════════════════════
// AUDIO MANAGER — ARCHIVOS WAV REALES
// Carga los ficheros de assets/sounds/ con fetch + decodeAudioData
// y los cachea en APP.audioBuffers para no volver a descargarlos.
// ═══════════════════════════════════════════════════
const SOUND_FILES = {
  good_reaccion:   './assets/sounds/good_reaccion.wav',
  combo:           './assets/sounds/combo.wav',
  level_up:        './assets/sounds/level_up.wav',
  musica_settings: './assets/sounds/musica_settings.wav',
  puntaje_final:   './assets/sounds/puntaje_final.wav',
  ring_inicial:    './assets/sounds/ring_inicial.wav',
  ring_final:      './assets/sounds/ring_final.wav',
  '10_segundos':   './assets/sounds/10_segundos.wav',
};

// Volumen de la música de fondo de los menús
const MUSIC_VOLUME = 0.3;

// SFX cortos: se precargan al arrancar la app (~1.7MB en total).
const SOUND_PRELOAD_BOOT = ['ring_inicial', 'ring_final', 'good_reaccion', 'combo', 'level_up'];
// Ficheros grandes que no hacen falta al instante: se piden al empezar la
// sesión, con más de un round de margen antes de necesitarlos.
const SOUND_PRELOAD_SESSION = ['10_segundos', 'puntaje_final'];
// musica_settings.wav pesa ~20MB — carga lazy, sólo al llegar al home.

// Si un WAV no se puede cargar (sin red en el primer uso, decode fallido…)
// se cae al sintetizador equivalente para no dejar el evento mudo.
const SOUND_FALLBACKS = {
  ring_inicial:  () => playBell('round'),
  ring_final:    () => playBell('end'),
  good_reaccion: () => playBeep(880, 0.12),
  combo:         () => playComboOk(),
  level_up:      () => playLevelUpSound(),
  puntaje_final: () => playBell('end'),
  '10_segundos': () => playBeep(1000, 0.08),
};

function loadSound(name) {
  if (APP.audioBuffers[name])  return Promise.resolve(APP.audioBuffers[name]);
  if (APP.audioLoading[name])  return APP.audioLoading[name];

  const url = SOUND_FILES[name];
  if (!url) return Promise.reject(new Error('sonido desconocido: ' + name));

  const p = fetch(url)
    .then(res => {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.arrayBuffer();
    })
    .then(raw => new Promise((resolve, reject) => {
      // decodeAudioData: Safari antiguo sólo soporta la forma con callbacks
      const ret = getAudioCtx().decodeAudioData(raw, resolve, reject);
      if (ret && typeof ret.then === 'function') ret.then(resolve, reject);
    }))
    .then(buffer => {
      APP.audioBuffers[name] = buffer;
      delete APP.audioLoading[name];
      return buffer;
    })
    .catch(err => {
      delete APP.audioLoading[name];
      console.log('[FKF] audio load fail ' + name + ': ' + err.message);
      throw err;
    });

  APP.audioLoading[name] = p;
  return p;
}

function preloadSounds(names) {
  names.forEach(n => { loadSound(n).catch(() => {}); });
}

// Reproduce un sonido. Devuelve un handle con .stop() y .source — el
// BufferSource real, que es null hasta que el buffer termina de cargarse
// (por eso el handle y no el source pelado: permite parar algo que aún
// se está descargando, como la música de 20MB).
function playSound(name, loop = false, volume = 1.0) {
  const handle = {
    name,
    source: null,
    gain: null,
    stopped: false,
    stop() {
      this.stopped = true;
      if (this.source) {
        try { this.source.stop(); } catch (e) {}
        this.source = null;
      }
    },
  };

  if (!APP.soundEnabled) { handle.stopped = true; return handle; }

  const start = (buffer) => {
    if (handle.stopped) return;
    try {
      const ctx = getAudioCtx();
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
      const src  = ctx.createBufferSource();
      const gain = ctx.createGain();
      src.buffer = buffer;
      src.loop   = loop;
      gain.gain.value = volume;
      src.connect(gain);
      gain.connect(ctx.destination);
      src.onended = () => { if (handle.source === src) handle.source = null; };
      src.start(0);
      handle.source = src;
      handle.gain   = gain;
    } catch (e) {}
  };

  const cached = APP.audioBuffers[name];
  if (cached) { start(cached); return handle; }

  loadSound(name).then(start).catch(() => {
    if (handle.stopped) return;
    const fb = SOUND_FALLBACKS[name];
    if (fb) { try { fb(); } catch (e) {} }
  });
  return handle;
}

// ─── MÚSICA DE FONDO DE LOS MENÚS ─────────────────────
function startMenuMusic() {
  if (!APP.soundEnabled) return;
  // Lazy de verdad: el fichero pesa ~20MB, así que no se pide hasta que el
  // usuario ha llegado al home (idioma/registro/login se quedan en silencio).
  if (!APP._homeReached) return;
  if (APP.musicSource && !APP.musicSource.stopped) return;   // ya sonando
  const ctx = getAudioCtx();
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  APP.musicSource = playSound('musica_settings', true, MUSIC_VOLUME);
}

function stopMenuMusic() {
  if (APP.musicSource) {
    APP.musicSource.stop();
    APP.musicSource = null;
  }
}

// ¿Está el usuario en una pantalla de menú? (para reanudar la música
// al desmutear sin arrancarla en mitad de un round)
function isOnMenuScreen() {
  const el = document.querySelector('.screen:not(.hidden)');
  return !!(el && SESSION_SCREENS.indexOf(el.id) === -1);
}

// Muchos navegadores dejan el AudioContext suspendido hasta el primer
// gesto del usuario: lo reanudamos en el primer toque de la sesión.
function armAudioUnlock() {
  if (APP._audioUnlockArmed) return;
  APP._audioUnlockArmed = true;
  const unlock = () => {
    const ctx = getAudioCtx();
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    document.removeEventListener('touchstart', unlock);
    document.removeEventListener('pointerdown', unlock);
  };
  document.addEventListener('touchstart', unlock, { passive: true });
  document.addEventListener('pointerdown', unlock, { passive: true });
}

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
      // El quiz se responde antes de existir la cuenta: se sube ahora
      flushPendingQuiz();
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
  APP.accel.listening = false;
}

// ─── FILTRO DE PASO BAJO: GRAVEDAD EN TIEMPO REAL ─────
// El baseline medido "en reposo" no servía: al girar el móvil, la gravedad
// cambia de eje y la resta dejaba de valer, generando falsos positivos.
// Este filtro sigue la gravedad continuamente, así que la aceleración neta
// es fiable en cualquier orientación.
// ALPHA alto a propósito: con 0.85 el filtro se comía ~15% del pico (un
// impacto real de 5G se leía como 4.25G) porque la propia muestra del golpe
// arrastraba la estimación de gravedad. Con 0.95 el filtro sigue la
// orientación pero apenas reacciona al impacto, así que el pico llega entero.
const GRAV_ALPHA       = 0.95;  // inercia del filtro (más alto = más lento)
const NET_HIT_G        = 0.01;  // G netos mínimos para contar como golpe (suelo duro)
const HIT_DEBOUNCE_MS  = 150;   // ms mínimos entre dos golpes (anti-doble)
const FILTER_SETTLE_MS = 600;   // margen para que el filtro converja tras un reset
                                // (con ALPHA 0.95 tarda más que con 0.85)

let gravX = 0, gravY = 0, gravZ = 0;
let _filterReadyAt = 0;

// Se llama al empezar cada sesión/round: el filtro arranca de cero y se
// ignoran las lecturas hasta que converge (si no, el transitorio inicial
// se leería como un golpe).
function resetGravityFilter() {
  gravX = 0; gravY = 0; gravZ = 0;
  _filterReadyAt = Date.now() + FILTER_SETTLE_MS;
  APP.accel.lastPunchAt = Date.now();
}

// Aceleración NETA (sin gravedad) en G.
function netGForce(e) {
  const raw = e.accelerationIncludingGravity;
  if (raw && (raw.x != null || raw.y != null || raw.z != null)) {
    const rx = raw.x || 0, ry = raw.y || 0, rz = raw.z || 0;
    gravX = GRAV_ALPHA * gravX + (1 - GRAV_ALPHA) * rx;
    gravY = GRAV_ALPHA * gravY + (1 - GRAV_ALPHA) * ry;
    gravZ = GRAV_ALPHA * gravZ + (1 - GRAV_ALPHA) * rz;
    const netX = rx - gravX, netY = ry - gravY, netZ = rz - gravZ;
    return Math.sqrt(netX * netX + netY * netY + netZ * netZ) / 9.81;
  }
  // Fallback: navegadores que sólo exponen la aceleración ya sin gravedad
  const lin = e.acceleration;
  if (lin && (lin.x != null || lin.y != null || lin.z != null)) {
    const x = lin.x || 0, y = lin.y || 0, z = lin.z || 0;
    return Math.sqrt(x * x + y * y + z * z) / 9.81;
  }
  return null;
}

function onDeviceMotion(e) {
  if (!window.IMPACT_SESSION_ACTIVE) return;
  if (!APP.sessionActive) return;

  const gForce = netGForce(e);
  if (gForce == null) return;
  const now = Date.now();

  // El filtro aún no ha convergido: la señal no es fiable todavía
  if (now < _filterReadyAt) return;

  // Suelo absoluto: por debajo de NET_HIT_G neto no es un golpe
  const effectiveThreshold = Math.max(APP.accel.THRESHOLD, NET_HIT_G);
  const cooldown = Math.max(HIT_DEBOUNCE_MS,
    (APP.mode === 'combo' && APP.comboConfig.submode === 'combo' && APP.combo.state === 'active')
      ? APP.accel.COMBO_HIT_COOLDOWN
      : APP.accel.COOLDOWN);

  if (now - APP.accel._logAt > 100) {
    APP.accel._logAt = now;
    console.log(`[FKF] accel net=${gForce.toFixed(2)}G thr=${effectiveThreshold}G`);
  }

  if (gForce > effectiveThreshold && (now - APP.accel.lastPunchAt) >= cooldown) {
    APP.accel.lastPunchAt = now;
    console.log(`[FKF] PUNCH g=${gForce.toFixed(2)}G mode=${APP.mode}`);
    registerPunch(gForce, gForce * 9.81);
  }
}

// ═══════════════════════════════════════════════════
// RÉCORDS HISTÓRICOS (potencia / velocidad / reacción)
// ═══════════════════════════════════════════════════
function loadRecords() {
  return {
    bestPower:    parseFloat(localStorage.getItem('fkf_record_power'))    || 0,
    bestSpeed:    parseFloat(localStorage.getItem('fkf_record_speed'))    || 0,
    bestReaction: parseFloat(localStorage.getItem('fkf_record_reaction')) || Infinity,
  };
}

function saveRecords() {
  localStorage.setItem('fkf_record_power',    String(APP.records.bestPower));
  localStorage.setItem('fkf_record_speed',    String(APP.records.bestSpeed));
  localStorage.setItem('fkf_record_reaction', String(APP.records.bestReaction));
}

// Récord de potencia (G-force) y/o velocidad — se comprueba en cada golpe registrado
function checkPowerSpeedRecord(punch) {
  if (!APP.records) return false;
  let broke = false;
  if (punch.g > APP.records.bestPower)     { APP.records.bestPower = punch.g;     broke = true; }
  if (punch.speed > APP.records.bestSpeed) { APP.records.bestSpeed = punch.speed; broke = true; }
  if (broke) { saveRecords(); celebrateRecord(); }
  return broke;
}

// Récord de reacción (menor tiempo = mejor) — se comprueba donde se calcula cada reactionMs
function checkReactionRecord(reactionMs) {
  if (!APP.records || reactionMs == null) return false;
  if (reactionMs < APP.records.bestReaction) {
    APP.records.bestReaction = reactionMs;
    saveRecords();
    celebrateRecord();
    return true;
  }
  return false;
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
  checkPowerSpeedRecord(punch);
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
    showPenaltyPopup(t('penalty_rest'), '#00D4FF', null);
    return;
  }
  if (APP.comboConfig.submode === 'combo') {
    applyXPPenalty(5);
    showPenaltyPopup(t('penalty_wait_signal'), '#FF8C00', '-5 XP');
    playPenaltySound();
    vibrate([100, 50, 100]);
    return;
  }
  // Reacción y Colores comparten el mismo sistema de penalización
  applyXPPenalty(5);
  showPenaltyPopup(t('penalty_too_soon'), '#FF1A1A', '-5 XP');
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

// Plural ruso: 1 день · 2-4 дня · 5+ дней (y las decenas 11-14 van a 'дней')
function pluralRu(n, one, few, many) {
  const d10 = n % 10, d100 = n % 100;
  if (d10 === 1 && d100 !== 11) return one;
  if (d10 >= 2 && d10 <= 4 && (d100 < 12 || d100 > 14)) return few;
  return many;
}

// Va aparte del diccionario porque varios idiomas necesitan plural variable
function getStreakText(n) {
  const s = n !== 1;
  switch (APP.lang) {
    case 'en':    return `${n}-day training streak 🔥`;
    case 'de':    return `${n} Tag${s ? 'e' : ''} am Stück trainiert 🔥`;
    case 'pt':    return `${n} dia${s ? 's' : ''} de treino seguidos 🔥`;
    case 'ja':    return `${n}日連続でトレーニング中 🔥`;
    case 'fr':    return `${n} jour${s ? 's' : ''} d'entraînement d'affilée 🔥`;
    case 'ru':    return `${n} ${pluralRu(n, 'день', 'дня', 'дней')} тренировок подряд 🔥`;
    case 'zh':    return `已连续训练 ${n} 天 🔥`;
    case 'zh-TW': return `已連續訓練 ${n} 天 🔥`;
    case 'ko':    return `${n}일 연속 훈련 중 🔥`;
    case 'ar':    return `${n} ${n === 1 ? 'يوم' : 'أيام'} من التدريب المتواصل 🔥`;
    case 'hi':    return `${n} दिन से लगातार अभ्यास 🔥`;
    default:      return `Llevas ${n} día${s ? 's' : ''} entrenando seguidos 🔥`;
  }
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

// Solo día/mes/año — para etiquetas cortas como el aviso del home
function fmtDateShort(ts) {
  return new Date(ts).toLocaleDateString(getLocale(), {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

// ═══════════════════════════════════════════════════
// CONTADORES ANIMADOS
// ═══════════════════════════════════════════════════
// Anima el número de un elemento de 0 hasta `target` con easeOutCubic.
// opts.decimals — decimales a mostrar (los G y las velocidades usan 1;
//                 sin esto, 4.7G se vería como "4G" durante y al final).
// opts.formatter — formato propio (la duración cuenta como 0:00 → 2:30).
function animateCounter(el, target, duration, suffix = '', prefix = '', opts = {}) {
  if (!el) return;
  const decimals  = opts.decimals || 0;
  const factor    = Math.pow(10, decimals);
  const formatter = opts.formatter || null;
  const render    = v => formatter ? formatter(v) : (prefix + v.toFixed(decimals) + suffix);

  const start = performance.now();
  const step = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const eased    = 1 - Math.pow(1 - progress, 3);
    const current  = Math.floor(eased * target * factor) / factor;
    el.textContent = render(current);
    if (progress < 1) trackedRAF(step);
    else el.textContent = render(target);
  };
  trackedRAF(step);
}

const SUMMARY_COUNTER_MS = 5000;

// Anima todos los números del resumen final. `specs` es una lista de
// [idOrElement, valor, sufijo, prefijo, opts].
function animateSummaryCounters(specs) {
  specs.forEach(([target, value, suffix, prefix, opts]) => {
    const el = typeof target === 'string' ? document.getElementById(target) : target;
    if (!el) return;
    animateCounter(el, value, SUMMARY_COUNTER_MS, suffix || '', prefix || '', opts || {});
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

// Tras elegir idioma: el quiz de alta va por delante del registro y del home,
// una sola vez por dispositivo. Si ya está hecho, se sigue de largo.
async function afterLangSelected() {
  if (shouldShowQuiz()) {
    maybeShowQuiz(() => { continueAfterLang(); });
    return;
  }
  return continueAfterLang();
}

async function continueAfterLang() {
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
      const range = nextLevel.xp - level.xp;
      const pct   = Math.min(100, Math.round(((score - level.xp) / range) * 100));
      barEl.style.width = pct + '%';
    } else {
      barEl.style.width = '100%';
    }
  }
  if (pointsEl) {
    pointsEl.textContent = nextLevel
      ? score + ' / ' + nextLevel.xp + ' XP'
      : score + ' XP · ' + t('max_level');
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
    if (!nombre)                           { errEl.textContent = t('auth_err_name'); return; }
    if (!email || !email.includes('@'))    { errEl.textContent = t('auth_err_email'); return; }
    if (password.length < 6)              { errEl.textContent = t('auth_err_password'); return; }
    if (!peso || peso < 30 || peso > 200) { errEl.textContent = t('auth_err_weight'); return; }
    if (!edad || edad < 10 || edad > 100) { errEl.textContent = t('auth_err_age'); return; }

    btn.disabled = true;
    btn.textContent = t('auth_creating');

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
      flushPendingQuiz();

      if (data.session) {
        showScreen('screen-menu');
        initMenuScreen();
      } else {
        errEl.style.color = '#00FF66';
        errEl.textContent = t('auth_check_email');
        btn.disabled = false;
        btn.textContent = t('auth_create_account');
      }
    } catch (e) {
      errEl.style.color = '#FF4444';
      errEl.textContent = e.message || t('auth_err_create');
      btn.disabled = false;
      btn.textContent = t('auth_create_account');
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
      errEl.textContent = t('auth_email_sent');
    } catch (e) {
      errEl.style.color = '#FF4444';
      errEl.textContent = e.message || t('auth_err_send');
    }
  };

  document.getElementById('btn-login').onclick = async () => {
    const email    = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const btn      = document.getElementById('btn-login');

    errEl.style.color = '#FF4444';
    errEl.textContent = '';
    if (!email)    { errEl.textContent = t('auth_err_enter_email'); return; }
    if (!password) { errEl.textContent = t('auth_err_enter_pass'); return; }

    btn.disabled = true;
    btn.textContent = t('auth_entering');

    try {
      const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
      if (error) throw error;
      await loadProfileFromSupabase(data.user.id);
      showScreen('screen-menu');
      initMenuScreen();
    } catch (e) {
      errEl.textContent = e.message || t('auth_err_credentials');
      btn.disabled = false;
      btn.textContent = t('auth_login_btn');
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

  // Primera llegada al home: a partir de aquí la música de menús ya puede
  // descargarse y sonar (antes no, para no pedir 20MB en el arranque).
  APP._homeReached = true;
  startMenuMusic();
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

  // Aviso de calibración bajo el botón CALIBRAR: verde con la fecha si hay
  // calibración guardada, naranja si el dispositivo aún no está calibrado
  const calibHint = document.getElementById('home-calib-hint');
  if (calibHint) {
    calibHint.onclick = () => { stopHomeParticles(); showCalibrationScreen('screen-menu'); };
    const cal = APP.calibration;
    const isCalibrated = !!(cal && cal.calibrated);
    calibHint.textContent = isCalibrated
      ? t('home_calib_status_yes', { date: cal.date ? fmtDateShort(cal.date) : '—' })
      : t('home_calib_status_no');
    calibHint.classList.toggle('home-calib-hint-ok',   isCalibrated);
    calibHint.classList.toggle('home-calib-hint-warn', !isCalibrated);
  }

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
  if (isTraining)      { modeColor = '#FFD300'; modeBg = '#151100'; modeTitle = t('card_power');    }
  else if (isSimple)   { modeColor = '#00D4FF'; modeBg = '#001520'; modeTitle = t('card_reaction'); }
  else if (isComboSubmode)  { modeColor = '#FF0000'; modeBg = '#150000'; modeTitle = t('card_combo');    }
  else if (isColorsSubmode) { modeColor = '#9B59B6'; modeBg = '#0D0010'; modeTitle = t('card_colors');   }

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
        <div class="csm-cell"><span class="csm-val">${r}</span><span class="csm-lbl">${t('rounds_completed').toUpperCase()}</span></div>
        <div class="csm-cell"><span class="csm-val">${rd}</span><span class="csm-lbl">${t('min_per_round')}</span></div>
        <div class="csm-cell"><span class="csm-val">${rst}s</span><span class="csm-lbl">${t('rest_title')}</span></div>
        <div class="csm-cell"><span class="csm-val">${total}</span><span class="csm-lbl">${t('min_total')}</span></div>
      </div>`;
  }
}

// ═══════════════════════════════════════════════════
// SESIÓN
// ═══════════════════════════════════════════════════
function startSession() {
  // Lo primero, dentro del gesto del click: sin él el navegador deniega la
  // pantalla completa. Vale para los 4 modos (todos entran por aquí).
  requestFullscreen();

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
  // stopEverything() ya paró la música; el descanso y el resumen necesitan
  // sus WAV grandes, y aquí hay más de un round de margen para bajarlos.
  preloadSounds(SOUND_PRELOAD_SESSION);
  acquireWakeLock();
  activateAccelerometer();
  resetGravityFilter();
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
  playSound('ring_inicial');

  // El filtro de gravedad arranca de cero en cada round
  resetGravityFilter();

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
  playSound('ring_final');

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

  document.getElementById('wait-hits-text').textContent = t('wait_hits', { n: target });
  document.getElementById('wait-max-time').textContent =
    t('wait_max_time', { t: APP.comboConfig.maxDuration.toFixed(1) });

  showComboPanel('wait');

  const pauseMs = APP.comboConfig.pauseBetween * 1000;
  let remaining = APP.comboConfig.pauseBetween;

  clearInterval(APP.combo.waitTickInterval);
  APP.combo.waitTickInterval = trackedInterval(() => {
    remaining -= 0.1;
    document.getElementById('wait-countdown-text').textContent =
      t('next_signal_in', { s: Math.max(0, remaining).toFixed(1) });
    if (remaining <= 0) clearInterval(APP.combo.waitTickInterval);
  }, 100);

  document.getElementById('wait-countdown-text').textContent =
    t('next_signal_in', { s: remaining.toFixed(1) });

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
    checkReactionRecord(APP.combo.reactionMs);

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
  verdictEl.textContent = ok ? 'OK' : t('verdict_fail');
  verdictEl.className   = 'result-verdict ' + (ok ? 'ok' : 'fail');

  const why = ' ' + (noHits ? t('result_no_reaction') : (ok ? t('result_completed') : t('result_incomplete')));
  document.getElementById('result-count').textContent =
    APP.combo.currentHits + '/' + APP.combo.targetHits + why;

  document.getElementById('result-reaction').textContent =
    APP.combo.reactionMs ? (APP.combo.reactionMs / 1000).toFixed(2) + 's' : '—';
  document.getElementById('result-duration').textContent =
    duration > 0 ? duration.toFixed(2) + 's' : '—';

  showComboPanel('result');

  if (ok) {
    vibrate([20, 30, 20]);
    playSound('combo');
  } else {
    vibrate([50, 30, 50]);
    playComboFail();
  }

  if (APP.round.secondsLeft > 0) {
    const pauseMs = APP.comboConfig.pauseBetween * 1000;
    document.getElementById('result-next-label').textContent =
      t('next_signal_in', { s: APP.comboConfig.pauseBetween.toFixed(1) });

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
  if (lvlEl)   lvlEl.textContent   = t('level_n', { n: inf.idx + 1 });
  if (badgeEl) badgeEl.textContent = xp + ' XP';
  if (fillEl && inf.next) {
    const pct = Math.min(100, Math.round(((xp - inf.current.xp) / (inf.next.xp - inf.current.xp)) * 100));
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
  setReactionStimulus('state-wait', '', t('stimulus_wait').toUpperCase(), '', '', '');
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
  setReactionStimulus('state-miss', '✗', t('verdict_fail'), '', '', '');
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
  checkReactionRecord(reactionMs);
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
  playSound('good_reaccion');
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

  // Aviso de "quedan 10 segundos". Si el descanso configurado es más corto
  // que eso, suena ya al entrar en el descanso.
  let warned10 = false;
  const warn10 = () => {
    if (warned10) return;
    warned10 = true;
    playSound('10_segundos');
  };
  if (seconds <= 10) warn10();

  document.getElementById('btn-skip-rest').onclick = startNext;
  APP.rest.interval = trackedInterval(() => {
    seconds--;
    const el = document.getElementById('rest-countdown');
    el.textContent = seconds;
    el.classList.toggle('ending', seconds <= 10);
    if (seconds === 10) warn10();
    if (seconds > 0 && seconds <= 10) vibrate([50]);
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
      { id: 'yellow', hex: '#FFE000', label: APP.colorConfig.yellow || t('color_yellow') },
      { id: 'red',    hex: '#CC0000', label: APP.colorConfig.red    || t('color_red') },
      { id: 'blue',   hex: '#0066CC', label: APP.colorConfig.blue   || t('color_blue') },
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
    showScreen('screen-menu');   // showScreen reanuda la música de menús
    startHomeParticles();
  };

  if (APP.mode === 'training' && APP.gamification) renderGamificationSummary();

  const sessionXP = APP.gamification ? Math.max(0, APP.gamification.sessionXP) : 0;

  // Contadores que se animan de 0 al valor final al mostrar el resumen.
  // Los valores definitivos ya están escritos arriba: si la animación no
  // llegara a arrancar, las cifras correctas siguen a la vista.
  const counterSpecs = [
    ['sum-punches',   total,    '',      '', { decimals: 0 }],
    ['sum-avg-power', avgPower, 'G',     '', { decimals: 1 }],
    ['sum-max-power', maxPower, 'G',     '', { decimals: 1 }],
    ['sum-avg-speed', avgSpeed, '',      '', { decimals: 1 }],
    ['sum-max-speed', maxSpeed, '',      '', { decimals: 1 }],
    ['sum-calories',  calories, ' kcal', '', { decimals: 0 }],
    ['sum-duration',  durSec,   '',      '', { formatter: v => fmtTime(Math.floor(v)) }],
  ];
  if (APP.mode === 'combo') {
    counterSpecs.push(['sum-hits',   sess.hits,   '', '', { decimals: 0 }]);
    counterSpecs.push(['sum-misses', sess.misses, '', '', { decimals: 0 }]);
  }
  const xpEl = document.querySelector('#gam-summary-section .gam-summary-xp');
  if (xpEl) counterSpecs.push([xpEl, sessionXP, ' XP', '+', { decimals: 0 }]);

  showResultSplash(sess.allPunches, sessionXP, () => {
    showScreen('screen-summary', true);
    playSound('puntaje_final');
    animateSummaryCounters(counterSpecs);
  });
}

// ═══════════════════════════════════════════════════
// QUIZ FUNNEL — 10 PREGUNTAS (ONBOARDING)
//
// Va justo después de elegir idioma y ANTES del registro y del home, una
// sola vez por dispositivo (flag 'strikeiq_quiz_done').
//
// Con las respuestas se calcula un "bucket" (perfil de luchador) por puntos:
// cada opción suma a uno o dos perfiles y gana el que más acumula; los
// empates se rompen con el orden fijo de QUIZ_BUCKETS, así que el resultado
// es siempre determinista.
//
// Como el quiz corre antes del registro, todavía no hay usuario en Supabase:
// la respuesta se guarda en local y se sube en cuanto hay sesión
// (flushPendingQuiz, llamado tras registrarse o iniciar sesión).
// ═══════════════════════════════════════════════════
const QUIZ_DONE_KEY    = 'strikeiq_quiz_done';
const QUIZ_STORAGE_KEY = 'strikeiq_quiz';
const QUIZ_BUCKET_KEY  = 'strikeiq_bucket';
const QUIZ_PENDING_KEY = 'strikeiq_quiz_pending';
const QUIZ_VERSION     = 2;

// El orden es también el desempate: de más específico a más genérico.
const QUIZ_BUCKETS = [
  { id: 'competidor',  emoji: '🏆', color: '#FFD300' },
  { id: 'demoledor',   emoji: '💥', color: '#FF1A1A' },
  { id: 'relampago',   emoji: '⚡', color: '#00D4FF' },
  { id: 'tecnico',     emoji: '🥋', color: '#00FF66' },
  { id: 'explorador',  emoji: '🌱', color: '#9B59B6' },
];

// scores: puntos que suma cada opción a cada perfil
const QUIZ_QUESTIONS = [
  { id: 'objetivo', options: [
    { id: 'potencia',  emoji: '💥', scores: { demoledor: 3 } },
    { id: 'velocidad', emoji: '⚡', scores: { relampago: 3 } },
    { id: 'tecnica',   emoji: '🥋', scores: { tecnico: 3 } },
    { id: 'forma',     emoji: '🔥', scores: { explorador: 2, demoledor: 1 } },
  ]},
  { id: 'disciplina', options: [
    { id: 'boxeo',      emoji: '🥊', scores: { demoledor: 2, competidor: 1 } },
    { id: 'kickboxing', emoji: '🦵', scores: { competidor: 2, relampago: 1 } },
    { id: 'marciales',  emoji: '🥋', scores: { tecnico: 3 } },
    { id: 'solo',       emoji: '🏠', scores: { explorador: 2 } },
  ]},
  { id: 'experiencia', options: [
    { id: 'novato',     emoji: '🌱', scores: { explorador: 3 } },
    { id: 'medio',      emoji: '📈', scores: { tecnico: 2, relampago: 1 } },
    { id: 'veterano',   emoji: '💪', scores: { demoledor: 2, tecnico: 1 } },
    { id: 'competidor', emoji: '🏆', scores: { competidor: 4 } },
  ]},
  { id: 'frecuencia', options: [
    { id: 'f12',        emoji: '📅', scores: { explorador: 2 } },
    { id: 'f34',        emoji: '📆', scores: { tecnico: 1, relampago: 1 } },
    { id: 'f5',         emoji: '🔥', scores: { competidor: 3 } },
    { id: 'irregular',  emoji: '🌀', scores: { explorador: 3 } },
  ]},
  { id: 'equipo', options: [
    { id: 'saco',       emoji: '🥊', scores: { demoledor: 3 } },
    { id: 'muneco',     emoji: '🗿', scores: { demoledor: 2, tecnico: 1 } },
    { id: 'manoplas',   emoji: '🤝', scores: { tecnico: 2, competidor: 1 } },
    { id: 'sombra',     emoji: '💨', scores: { relampago: 3, explorador: 1 } },
  ]},
  { id: 'lugar', options: [
    { id: 'gimnasio',   emoji: '🏟️', scores: { competidor: 2, tecnico: 1 } },
    { id: 'casa',       emoji: '🏠', scores: { explorador: 2, demoledor: 1 } },
    { id: 'exterior',   emoji: '🌳', scores: { relampago: 2 } },
    { id: 'varia',      emoji: '🔄', scores: { explorador: 1, relampago: 1 } },
  ]},
  { id: 'duracion', options: [
    { id: 'corta',      emoji: '⏱️', scores: { relampago: 2, explorador: 1 } },
    { id: 'media',      emoji: '⏲️', scores: { tecnico: 2 } },
    { id: 'larga',      emoji: '🕐', scores: { competidor: 2 } },
    { id: 'muylarga',   emoji: '🔥', scores: { competidor: 3, demoledor: 1 } },
  ]},
  { id: 'debilidad', options: [
    { id: 'potencia',    emoji: '💥', scores: { demoledor: 3 } },
    { id: 'reaccion',    emoji: '⚡', scores: { relampago: 4 } },
    { id: 'resistencia', emoji: '🫁', scores: { competidor: 2 } },
    { id: 'constancia',  emoji: '🧭', scores: { explorador: 3 } },
  ]},
  { id: 'medir', options: [
    { id: 'fuerza',      emoji: '💪', scores: { demoledor: 3 } },
    { id: 'reaccion',    emoji: '⚡', scores: { relampago: 3 } },
    { id: 'resistencia', emoji: '🫁', scores: { competidor: 2 } },
    { id: 'progreso',    emoji: '📈', scores: { tecnico: 3 } },
  ]},
  { id: 'motivacion', options: [
    { id: 'numeros',   emoji: '📊', scores: { relampago: 2, tecnico: 1 } },
    { id: 'competir',  emoji: '🏆', scores: { competidor: 3 } },
    { id: 'superarme', emoji: '🧠', scores: { tecnico: 1, demoledor: 1 } },
    { id: 'desahogo',  emoji: '🧘', scores: { explorador: 2 } },
  ]},
];

// ── Texto del quiz, un bloque por idioma (como HELP_SECTIONS): son cadenas
// largas y sólo las usa este módulo, así que no van en TRANSLATIONS.
const QUIZ_I18N = {
  es: {
    intro_title: 'Antes de empezar...', intro_sub: '10 preguntas rápidas para crear tu perfil de luchador',
    step: '{n} / {total}', profile_title: 'TU PERFIL DE LUCHADOR', profile_cta: 'CONTINUAR',
    q: {
      objetivo: '¿Cuál es tu objetivo principal?', disciplina: '¿Qué practicas?',
      experiencia: '¿Cuánto llevas entrenando?', frecuencia: '¿Cuántos días entrenas por semana?',
      equipo: '¿Contra qué golpeas?', lugar: '¿Dónde entrenas normalmente?',
      duracion: '¿Cuánto dura tu entrenamiento?', debilidad: '¿Qué crees que te frena más?',
      medir: '¿Qué quieres medir primero?', motivacion: '¿Qué te hace volver a entrenar?',
    },
    a: {
      objetivo_potencia: 'Pegar más fuerte', objetivo_velocidad: 'Ser más rápido',
      objetivo_tecnica: 'Pulir mi técnica', objetivo_forma: 'Ponerme en forma',
      disciplina_boxeo: 'Boxeo', disciplina_kickboxing: 'Kickboxing / Muay Thai',
      disciplina_marciales: 'Karate, taekwondo, kung fu', disciplina_solo: 'Entreno por mi cuenta',
      experiencia_novato: 'Menos de 6 meses', experiencia_medio: 'Entre 6 meses y 2 años',
      experiencia_veterano: 'Más de 2 años', experiencia_competidor: 'Compito o he competido',
      frecuencia_f12: '1 o 2 días', frecuencia_f34: '3 o 4 días',
      frecuencia_f5: '5 días o más', frecuencia_irregular: 'Cuando puedo',
      equipo_saco: 'Saco pesado', equipo_muneco: 'Muñeco o maniquí',
      equipo_manoplas: 'Manoplas con compañero', equipo_sombra: 'Sombra, sin saco',
      lugar_gimnasio: 'En un gimnasio o club', lugar_casa: 'En casa',
      lugar_exterior: 'Al aire libre', lugar_varia: 'Depende del día',
      duracion_corta: 'Menos de 20 minutos', duracion_media: 'Entre 20 y 40 minutos',
      duracion_larga: 'Entre 40 y 60 minutos', duracion_muylarga: 'Más de una hora',
      debilidad_potencia: 'Me falta potencia', debilidad_reaccion: 'Reacciono tarde',
      debilidad_resistencia: 'Me canso pronto', debilidad_constancia: 'No soy constante',
      medir_fuerza: 'La fuerza de mi golpe', medir_reaccion: 'Mi tiempo de reacción',
      medir_resistencia: 'Cuánto aguanto por rounds', medir_progreso: 'Mi progreso con el tiempo',
      motivacion_numeros: 'Ver mis números subir', motivacion_competir: 'Ganar a otros',
      motivacion_superarme: 'Superarme a mí mismo', motivacion_desahogo: 'Descargar y despejarme',
    },
    b: {
      competidor_name: 'EL COMPETIDOR',
      competidor_desc: 'Entrenas con un objetivo claro y aguantas el ritmo. Tu margen ya no está en pegar más fuerte, sino en sostener la potencia cuando llega el cansancio.',
      competidor_tip: 'Haz rounds largos en MODO POTENCIA y vigila la caída de tus G del primer al último round.',
      demoledor_name: 'EL DEMOLEDOR',
      demoledor_desc: 'Buscas el impacto. Tu fuerte es el golpe único y contundente, y el saco es tu terreno.',
      demoledor_tip: 'Calibra fino y persigue tu récord de G en MODO POTENCIA. Descansa entre golpes: la potencia máxima necesita músculo fresco.',
      relampago_name: 'EL RELÁMPAGO',
      relampago_desc: 'Lo tuyo es llegar antes. La velocidad y el tiempo de reacción son tu ventaja competitiva.',
      relampago_tip: 'MODO REACCIÓN y MODO COLORES son los tuyos. Persigue bajar de 300 ms de forma constante.',
      tecnico_name: 'EL TÉCNICO',
      tecnico_desc: 'Te importa cómo se hace, no sólo cuánto pega. Mides para corregir, y ahí es donde más creces.',
      tecnico_tip: 'Usa MODO COMBO para encadenar sin perder limpieza y compara tu potencia media, no la máxima.',
      explorador_name: 'EL EXPLORADOR',
      explorador_desc: 'Estás empezando o entrenas cuando puedes. Tu mayor ganancia ahora mismo es la constancia, no la intensidad.',
      explorador_tip: 'Sesiones cortas de 2 rounds, varias veces por semana. Mira tu racha de días en el historial: ése es tu marcador.',
    },
  },
  en: {
    intro_title: 'Before we start...', intro_sub: '10 quick questions to build your fighter profile',
    step: '{n} / {total}', profile_title: 'YOUR FIGHTER PROFILE', profile_cta: 'CONTINUE',
    q: {
      objetivo: 'What is your main goal?', disciplina: 'What do you practise?',
      experiencia: 'How long have you been training?', frecuencia: 'How many days a week do you train?',
      equipo: 'What do you hit?', lugar: 'Where do you usually train?',
      duracion: 'How long is your session?', debilidad: 'What holds you back the most?',
      medir: 'What do you want to measure first?', motivacion: 'What keeps you coming back?',
    },
    a: {
      objetivo_potencia: 'Punch harder', objetivo_velocidad: 'Get faster',
      objetivo_tecnica: 'Sharpen my technique', objetivo_forma: 'Get in shape',
      disciplina_boxeo: 'Boxing', disciplina_kickboxing: 'Kickboxing / Muay Thai',
      disciplina_marciales: 'Karate, taekwondo, kung fu', disciplina_solo: 'I train on my own',
      experiencia_novato: 'Less than 6 months', experiencia_medio: '6 months to 2 years',
      experiencia_veterano: 'More than 2 years', experiencia_competidor: 'I compete or have competed',
      frecuencia_f12: '1 or 2 days', frecuencia_f34: '3 or 4 days',
      frecuencia_f5: '5 days or more', frecuencia_irregular: 'Whenever I can',
      equipo_saco: 'Heavy bag', equipo_muneco: 'Dummy or mannequin',
      equipo_manoplas: 'Pads with a partner', equipo_sombra: 'Shadow, no bag',
      lugar_gimnasio: 'At a gym or club', lugar_casa: 'At home',
      lugar_exterior: 'Outdoors', lugar_varia: 'It depends on the day',
      duracion_corta: 'Under 20 minutes', duracion_media: '20 to 40 minutes',
      duracion_larga: '40 to 60 minutes', duracion_muylarga: 'More than an hour',
      debilidad_potencia: 'I lack power', debilidad_reaccion: 'I react too late',
      debilidad_resistencia: 'I gas out early', debilidad_constancia: 'I am not consistent',
      medir_fuerza: 'How hard I punch', medir_reaccion: 'My reaction time',
      medir_resistencia: 'How long I last over rounds', medir_progreso: 'My progress over time',
      motivacion_numeros: 'Watching my numbers climb', motivacion_competir: 'Beating others',
      motivacion_superarme: 'Beating my own limits', motivacion_desahogo: 'Blowing off steam',
    },
    b: {
      competidor_name: 'THE COMPETITOR',
      competidor_desc: 'You train with a clear goal and you hold the pace. Your edge is no longer punching harder, but keeping the power up once fatigue kicks in.',
      competidor_tip: 'Run long rounds in POWER MODE and watch how your G drops from the first round to the last.',
      demoledor_name: 'THE DEMOLISHER',
      demoledor_desc: 'You are after impact. The single, crushing punch is your strength, and the bag is your home ground.',
      demoledor_tip: 'Calibrate finely and chase your G record in POWER MODE. Rest between punches: peak power needs fresh muscle.',
      relampago_name: 'THE LIGHTNING',
      relampago_desc: 'Your thing is getting there first. Speed and reaction time are your competitive edge.',
      relampago_tip: 'REACTION MODE and COLOR MODE are made for you. Aim to stay consistently under 300 ms.',
      tecnico_name: 'THE TECHNICIAN',
      tecnico_desc: 'You care about how it is done, not just how hard it lands. You measure to correct, and that is where you grow most.',
      tecnico_tip: 'Use COMBO MODE to chain punches without losing form, and compare your average power, not your peak.',
      explorador_name: 'THE EXPLORER',
      explorador_desc: 'You are starting out or training whenever you can. Your biggest gain right now is consistency, not intensity.',
      explorador_tip: 'Short 2-round sessions, several times a week. Watch your day streak in the history: that is your scoreboard.',
    },
  },
  pt: {
    intro_title: 'Antes de começar...', intro_sub: '10 perguntas rápidas para criar seu perfil de lutador',
    step: '{n} / {total}', profile_title: 'SEU PERFIL DE LUTADOR', profile_cta: 'CONTINUAR',
    q: {
      objetivo: 'Qual é seu objetivo principal?', disciplina: 'O que você pratica?',
      experiencia: 'Há quanto tempo você treina?', frecuencia: 'Quantos dias por semana você treina?',
      equipo: 'Contra o que você bate?', lugar: 'Onde você costuma treinar?',
      duracion: 'Quanto dura seu treino?', debilidad: 'O que mais te atrapalha?',
      medir: 'O que você quer medir primeiro?', motivacion: 'O que te faz voltar a treinar?',
    },
    a: {
      objetivo_potencia: 'Bater mais forte', objetivo_velocidad: 'Ser mais rápido',
      objetivo_tecnica: 'Aprimorar minha técnica', objetivo_forma: 'Entrar em forma',
      disciplina_boxeo: 'Boxe', disciplina_kickboxing: 'Kickboxing / Muay Thai',
      disciplina_marciales: 'Karatê, taekwondo, kung fu', disciplina_solo: 'Treino por conta própria',
      experiencia_novato: 'Menos de 6 meses', experiencia_medio: 'De 6 meses a 2 anos',
      experiencia_veterano: 'Mais de 2 anos', experiencia_competidor: 'Compito ou já competi',
      frecuencia_f12: '1 ou 2 dias', frecuencia_f34: '3 ou 4 dias',
      frecuencia_f5: '5 dias ou mais', frecuencia_irregular: 'Quando dá',
      equipo_saco: 'Saco pesado', equipo_muneco: 'Boneco ou manequim',
      equipo_manoplas: 'Manoplas com parceiro', equipo_sombra: 'Sombra, sem saco',
      lugar_gimnasio: 'Em academia ou clube', lugar_casa: 'Em casa',
      lugar_exterior: 'Ao ar livre', lugar_varia: 'Depende do dia',
      duracion_corta: 'Menos de 20 minutos', duracion_media: 'De 20 a 40 minutos',
      duracion_larga: 'De 40 a 60 minutos', duracion_muylarga: 'Mais de uma hora',
      debilidad_potencia: 'Falta potência', debilidad_reaccion: 'Reajo tarde',
      debilidad_resistencia: 'Canso rápido', debilidad_constancia: 'Não sou constante',
      medir_fuerza: 'A força do meu golpe', medir_reaccion: 'Meu tempo de reação',
      medir_resistencia: 'Quanto aguento por rounds', medir_progreso: 'Minha evolução ao longo do tempo',
      motivacion_numeros: 'Ver meus números subirem', motivacion_competir: 'Vencer os outros',
      motivacion_superarme: 'Superar a mim mesmo', motivacion_desahogo: 'Descarregar e espairecer',
    },
    b: {
      competidor_name: 'O COMPETIDOR',
      competidor_desc: 'Você treina com um objetivo claro e segura o ritmo. Sua margem já não está em bater mais forte, e sim em manter a potência quando o cansaço chega.',
      competidor_tip: 'Faça rounds longos no MODO POTÊNCIA e observe a queda dos seus G do primeiro ao último round.',
      demoledor_name: 'O DEMOLIDOR',
      demoledor_desc: 'Você busca o impacto. Seu forte é o golpe único e devastador, e o saco é seu território.',
      demoledor_tip: 'Calibre com precisão e persiga seu recorde de G no MODO POTÊNCIA. Descanse entre os golpes: potência máxima exige músculo descansado.',
      relampago_name: 'O RELÂMPAGO',
      relampago_desc: 'O seu negócio é chegar antes. Velocidade e tempo de reação são sua vantagem competitiva.',
      relampago_tip: 'MODO REAÇÃO e MODO CORES são os seus. Mire em ficar sempre abaixo de 300 ms.',
      tecnico_name: 'O TÉCNICO',
      tecnico_desc: 'Você se importa com o como, não só com o quanto. Você mede para corrigir, e é aí que mais cresce.',
      tecnico_tip: 'Use o MODO COMBO para encadear sem perder a limpeza e compare sua potência média, não a máxima.',
      explorador_name: 'O EXPLORADOR',
      explorador_desc: 'Você está começando ou treina quando dá. Seu maior ganho agora é a constância, não a intensidade.',
      explorador_tip: 'Sessões curtas de 2 rounds, várias vezes por semana. Olhe sua sequência de dias no histórico: esse é seu placar.',
    },
  },
  de: {
    intro_title: 'Bevor es losgeht...', intro_sub: '10 kurze Fragen für dein Kämpferprofil',
    step: '{n} / {total}', profile_title: 'DEIN KÄMPFERPROFIL', profile_cta: 'WEITER',
    q: {
      objetivo: 'Was ist dein Hauptziel?', disciplina: 'Was trainierst du?',
      experiencia: 'Wie lange trainierst du schon?', frecuencia: 'An wie vielen Tagen pro Woche trainierst du?',
      equipo: 'Worauf schlägst du?', lugar: 'Wo trainierst du normalerweise?',
      duracion: 'Wie lange dauert dein Training?', debilidad: 'Was bremst dich am meisten?',
      medir: 'Was willst du zuerst messen?', motivacion: 'Was bringt dich zurück ins Training?',
    },
    a: {
      objetivo_potencia: 'Härter schlagen', objetivo_velocidad: 'Schneller werden',
      objetivo_tecnica: 'Meine Technik verfeinern', objetivo_forma: 'In Form kommen',
      disciplina_boxeo: 'Boxen', disciplina_kickboxing: 'Kickboxen / Muay Thai',
      disciplina_marciales: 'Karate, Taekwondo, Kung-Fu', disciplina_solo: 'Ich trainiere allein',
      experiencia_novato: 'Weniger als 6 Monate', experiencia_medio: '6 Monate bis 2 Jahre',
      experiencia_veterano: 'Mehr als 2 Jahre', experiencia_competidor: 'Ich kämpfe im Wettkampf',
      frecuencia_f12: '1 oder 2 Tage', frecuencia_f34: '3 oder 4 Tage',
      frecuencia_f5: '5 Tage oder mehr', frecuencia_irregular: 'Wann immer es geht',
      equipo_saco: 'Schwerer Sandsack', equipo_muneco: 'Puppe oder Dummy',
      equipo_manoplas: 'Pratzen mit Partner', equipo_sombra: 'Schattenboxen, ohne Sack',
      lugar_gimnasio: 'Im Gym oder Verein', lugar_casa: 'Zu Hause',
      lugar_exterior: 'Draußen', lugar_varia: 'Je nach Tag',
      duracion_corta: 'Unter 20 Minuten', duracion_media: '20 bis 40 Minuten',
      duracion_larga: '40 bis 60 Minuten', duracion_muylarga: 'Mehr als eine Stunde',
      debilidad_potencia: 'Mir fehlt Kraft', debilidad_reaccion: 'Ich reagiere zu spät',
      debilidad_resistencia: 'Mir geht schnell die Luft aus', debilidad_constancia: 'Ich bleibe nicht dran',
      medir_fuerza: 'Wie hart ich schlage', medir_reaccion: 'Meine Reaktionszeit',
      medir_resistencia: 'Wie lange ich über Runden durchhalte', medir_progreso: 'Meinen Fortschritt über die Zeit',
      motivacion_numeros: 'Meine Zahlen steigen sehen', motivacion_competir: 'Andere schlagen',
      motivacion_superarme: 'Mich selbst übertreffen', motivacion_desahogo: 'Dampf ablassen',
    },
    b: {
      competidor_name: 'DER WETTKÄMPFER',
      competidor_desc: 'Du trainierst mit klarem Ziel und hältst das Tempo. Dein Spielraum liegt nicht mehr im härteren Schlag, sondern darin, die Kraft zu halten, wenn die Müdigkeit kommt.',
      competidor_tip: 'Mach lange Runden im KRAFT-MODUS und beobachte, wie deine G von der ersten zur letzten Runde abfallen.',
      demoledor_name: 'DER ZERSTÖRER',
      demoledor_desc: 'Dir geht es um den Einschlag. Der einzelne, wuchtige Schlag ist deine Stärke, und der Sack ist dein Terrain.',
      demoledor_tip: 'Kalibriere fein und jage deinen G-Rekord im KRAFT-MODUS. Pausiere zwischen den Schlägen: Maximalkraft braucht frische Muskeln.',
      relampago_name: 'DER BLITZ',
      relampago_desc: 'Deine Sache ist, zuerst da zu sein. Geschwindigkeit und Reaktionszeit sind dein Vorteil.',
      relampago_tip: 'REAKTIONSMODUS und FARBMODUS sind für dich gemacht. Ziel: dauerhaft unter 300 ms bleiben.',
      tecnico_name: 'DER TECHNIKER',
      tecnico_desc: 'Dir ist wichtig, wie es gemacht wird, nicht nur wie hart es trifft. Du misst, um zu korrigieren, und genau da wächst du am meisten.',
      tecnico_tip: 'Nutze den COMBO-MODUS für saubere Schlagfolgen und vergleiche deine Durchschnittskraft, nicht die Spitze.',
      explorador_name: 'DER ENTDECKER',
      explorador_desc: 'Du fängst an oder trainierst, wann es passt. Dein größter Gewinn ist gerade Beständigkeit, nicht Intensität.',
      explorador_tip: 'Kurze Einheiten mit 2 Runden, mehrmals pro Woche. Achte im Verlauf auf deine Tagesserie: das ist dein Punktestand.',
    },
  },
  ja: {
    intro_title: '始める前に...', intro_sub: 'あなたのファイタープロフィールを作る10の質問',
    step: '{n} / {total}', profile_title: 'あなたのファイタープロフィール', profile_cta: '続ける',
    q: {
      objetivo: '一番の目標は?', disciplina: '何をやっている?',
      experiencia: 'どのくらい練習している?', frecuencia: '週に何日練習する?',
      equipo: '何を叩いている?', lugar: '普段どこで練習する?',
      duracion: '1回の練習時間は?', debilidad: '一番の課題は?',
      medir: 'まず何を測りたい?', motivacion: '練習を続ける理由は?',
    },
    a: {
      objetivo_potencia: 'もっと強く打ちたい', objetivo_velocidad: 'もっと速くなりたい',
      objetivo_tecnica: '技術を磨きたい', objetivo_forma: '体を鍛えたい',
      disciplina_boxeo: 'ボクシング', disciplina_kickboxing: 'キックボクシング / ムエタイ',
      disciplina_marciales: '空手・テコンドー・カンフー', disciplina_solo: '独学で練習している',
      experiencia_novato: '6か月未満', experiencia_medio: '6か月〜2年',
      experiencia_veterano: '2年以上', experiencia_competidor: '試合に出ている',
      frecuencia_f12: '1〜2日', frecuencia_f34: '3〜4日',
      frecuencia_f5: '5日以上', frecuencia_irregular: 'できるときだけ',
      equipo_saco: 'ヘビーバッグ', equipo_muneco: 'ダミー人形',
      equipo_manoplas: 'ミット(相手あり)', equipo_sombra: 'シャドー(バッグなし)',
      lugar_gimnasio: 'ジムやクラブ', lugar_casa: '自宅',
      lugar_exterior: '屋外', lugar_varia: '日によって違う',
      duracion_corta: '20分未満', duracion_media: '20〜40分',
      duracion_larga: '40〜60分', duracion_muylarga: '1時間以上',
      debilidad_potencia: 'パワーが足りない', debilidad_reaccion: '反応が遅い',
      debilidad_resistencia: 'すぐバテる', debilidad_constancia: '続かない',
      medir_fuerza: 'パンチの強さ', medir_reaccion: 'リアクションタイム',
      medir_resistencia: 'ラウンドを通した持久力', medir_progreso: '長期的な成長',
      motivacion_numeros: '数字が伸びるのを見る', motivacion_competir: '相手に勝つ',
      motivacion_superarme: '自分を超える', motivacion_desahogo: 'ストレス発散',
    },
    b: {
      competidor_name: 'ザ・コンペティター',
      competidor_desc: '明確な目標を持ち、ペースを保てるタイプ。伸びしろはもう強く打つことではなく、疲れてきてもパワーを落とさないことにある。',
      competidor_tip: 'パワーモードで長いラウンドを行い、最初と最後のラウンドでGがどれだけ落ちるかを見よう。',
      demoledor_name: 'ザ・デモリッシャー',
      demoledor_desc: '狙いはインパクト。一撃の重さが武器で、サンドバッグが主戦場。',
      demoledor_tip: '細かくキャリブレートしてパワーモードでG記録を狙おう。最大出力には休んだ筋肉が必要なので、パンチの間は休むこと。',
      relampago_name: 'ザ・ライトニング',
      relampago_desc: '持ち味は先に届くこと。スピードとリアクションタイムが最大の武器。',
      relampago_tip: 'リアクションモードとカラーモードが最適。安定して300ms未満を目指そう。',
      tecnico_name: 'ザ・テクニシャン',
      tecnico_desc: '強さだけでなく「どう打つか」を重視するタイプ。修正のために測る、そこが一番伸びる。',
      tecnico_tip: 'コンボモードで質を落とさず連打し、最大値ではなく平均パワーを比べよう。',
      explorador_name: 'ザ・エクスプローラー',
      explorador_desc: '始めたばかり、あるいはできるときに練習するタイプ。今の伸びしろは強度より継続にある。',
      explorador_tip: '2ラウンドの短いセッションを週に数回。履歴の連続日数が今のスコアだ。',
    },
  },
  fr: {
    intro_title: 'Avant de commencer...', intro_sub: '10 questions rapides pour créer ton profil de combattant',
    step: '{n} / {total}', profile_title: 'TON PROFIL DE COMBATTANT', profile_cta: 'CONTINUER',
    q: {
      objetivo: 'Quel est ton objectif principal ?', disciplina: 'Que pratiques-tu ?',
      experiencia: 'Depuis combien de temps tu t\'entraînes ?', frecuencia: 'Combien de jours par semaine ?',
      equipo: 'Sur quoi tu frappes ?', lugar: 'Où t\'entraînes-tu d\'habitude ?',
      duracion: 'Combien de temps dure ta séance ?', debilidad: 'Qu\'est-ce qui te freine le plus ?',
      medir: 'Que veux-tu mesurer en premier ?', motivacion: 'Qu\'est-ce qui te fait revenir ?',
    },
    a: {
      objetivo_potencia: 'Frapper plus fort', objetivo_velocidad: 'Être plus rapide',
      objetivo_tecnica: 'Affiner ma technique', objetivo_forma: 'Me remettre en forme',
      disciplina_boxeo: 'Boxe', disciplina_kickboxing: 'Kickboxing / Muay Thaï',
      disciplina_marciales: 'Karaté, taekwondo, kung-fu', disciplina_solo: 'Je m\'entraîne seul',
      experiencia_novato: 'Moins de 6 mois', experiencia_medio: 'De 6 mois à 2 ans',
      experiencia_veterano: 'Plus de 2 ans', experiencia_competidor: 'Je fais ou j\'ai fait de la compétition',
      frecuencia_f12: '1 ou 2 jours', frecuencia_f34: '3 ou 4 jours',
      frecuencia_f5: '5 jours ou plus', frecuencia_irregular: 'Quand je peux',
      equipo_saco: 'Sac lourd', equipo_muneco: 'Mannequin',
      equipo_manoplas: 'Pattes d\'ours avec un partenaire', equipo_sombra: 'Shadow, sans sac',
      lugar_gimnasio: 'En salle ou en club', lugar_casa: 'À la maison',
      lugar_exterior: 'En extérieur', lugar_varia: 'Ça dépend des jours',
      duracion_corta: 'Moins de 20 minutes', duracion_media: 'De 20 à 40 minutes',
      duracion_larga: 'De 40 à 60 minutes', duracion_muylarga: 'Plus d\'une heure',
      debilidad_potencia: 'Je manque de puissance', debilidad_reaccion: 'Je réagis trop tard',
      debilidad_resistencia: 'Je m\'essouffle vite', debilidad_constancia: 'Je manque de régularité',
      medir_fuerza: 'La force de mon coup', medir_reaccion: 'Mon temps de réaction',
      medir_resistencia: 'Ma tenue sur la durée', medir_progreso: 'Ma progression dans le temps',
      motivacion_numeros: 'Voir mes chiffres monter', motivacion_competir: 'Battre les autres',
      motivacion_superarme: 'Me dépasser', motivacion_desahogo: 'Évacuer la pression',
    },
    b: {
      competidor_name: 'LE COMPÉTITEUR',
      competidor_desc: 'Tu t\'entraînes avec un objectif clair et tu tiens le rythme. Ta marge n\'est plus de frapper plus fort, mais de garder la puissance quand la fatigue arrive.',
      competidor_tip: 'Fais des rounds longs en MODE PUISSANCE et surveille la chute de tes G du premier au dernier round.',
      demoledor_name: 'LE DÉMOLISSEUR',
      demoledor_desc: 'Tu cherches l\'impact. Ta force, c\'est le coup unique et massif, et le sac est ton terrain.',
      demoledor_tip: 'Calibre finement et vise ton record de G en MODE PUISSANCE. Repose-toi entre les coups : la puissance max exige un muscle frais.',
      relampago_name: 'L\'ÉCLAIR',
      relampago_desc: 'Ton truc, c\'est d\'arriver avant. La vitesse et le temps de réaction sont ton avantage.',
      relampago_tip: 'Le MODE RÉACTION et le MODE COULEURS sont faits pour toi. Vise à passer durablement sous 300 ms.',
      tecnico_name: 'LE TECHNICIEN',
      tecnico_desc: 'Ce qui compte pour toi, c\'est comment c\'est fait, pas seulement la force. Tu mesures pour corriger, et c\'est là que tu progresses le plus.',
      tecnico_tip: 'Utilise le MODE COMBO pour enchaîner sans perdre en propreté et compare ta puissance moyenne, pas ton maximum.',
      explorador_name: 'L\'EXPLORATEUR',
      explorador_desc: 'Tu débutes ou tu t\'entraînes quand tu peux. Ton plus gros gain en ce moment, c\'est la régularité, pas l\'intensité.',
      explorador_tip: 'Des séances courtes de 2 rounds, plusieurs fois par semaine. Regarde ta série de jours dans l\'historique : c\'est ton compteur.',
    },
  },
  ru: {
    intro_title: 'Прежде чем начать...', intro_sub: '10 быстрых вопросов, чтобы собрать твой профиль бойца',
    step: '{n} / {total}', profile_title: 'ТВОЙ ПРОФИЛЬ БОЙЦА', profile_cta: 'ПРОДОЛЖИТЬ',
    q: {
      objetivo: 'Какая у тебя главная цель?', disciplina: 'Чем ты занимаешься?',
      experiencia: 'Как давно тренируешься?', frecuencia: 'Сколько дней в неделю тренируешься?',
      equipo: 'По чему бьёшь?', lugar: 'Где обычно тренируешься?',
      duracion: 'Сколько длится тренировка?', debilidad: 'Что мешает тебе больше всего?',
      medir: 'Что хочешь измерить в первую очередь?', motivacion: 'Что возвращает тебя к тренировкам?',
    },
    a: {
      objetivo_potencia: 'Бить сильнее', objetivo_velocidad: 'Стать быстрее',
      objetivo_tecnica: 'Отточить технику', objetivo_forma: 'Прийти в форму',
      disciplina_boxeo: 'Бокс', disciplina_kickboxing: 'Кикбоксинг / муай-тай',
      disciplina_marciales: 'Карате, тхэквондо, кунг-фу', disciplina_solo: 'Тренируюсь сам',
      experiencia_novato: 'Меньше 6 месяцев', experiencia_medio: 'От 6 месяцев до 2 лет',
      experiencia_veterano: 'Больше 2 лет', experiencia_competidor: 'Выступаю или выступал',
      frecuencia_f12: '1-2 дня', frecuencia_f34: '3-4 дня',
      frecuencia_f5: '5 дней и больше', frecuencia_irregular: 'Когда получается',
      equipo_saco: 'Тяжёлый мешок', equipo_muneco: 'Манекен',
      equipo_manoplas: 'Лапы с партнёром', equipo_sombra: 'Бой с тенью, без мешка',
      lugar_gimnasio: 'В зале или клубе', lugar_casa: 'Дома',
      lugar_exterior: 'На улице', lugar_varia: 'Зависит от дня',
      duracion_corta: 'Меньше 20 минут', duracion_media: 'От 20 до 40 минут',
      duracion_larga: 'От 40 до 60 минут', duracion_muylarga: 'Больше часа',
      debilidad_potencia: 'Не хватает силы', debilidad_reaccion: 'Реагирую поздно',
      debilidad_resistencia: 'Быстро устаю', debilidad_constancia: 'Нет регулярности',
      medir_fuerza: 'Силу удара', medir_reaccion: 'Время реакции',
      medir_resistencia: 'Сколько держусь по раундам', medir_progreso: 'Прогресс со временем',
      motivacion_numeros: 'Смотреть, как растут цифры', motivacion_competir: 'Обыгрывать других',
      motivacion_superarme: 'Превосходить себя', motivacion_desahogo: 'Сбросить напряжение',
    },
    b: {
      competidor_name: 'БОЕЦ-СОРЕВНОВАТЕЛЬ',
      competidor_desc: 'Ты тренируешься с чёткой целью и держишь темп. Твой запас теперь не в силе удара, а в умении сохранять мощность, когда приходит усталость.',
      competidor_tip: 'Делай длинные раунды в РЕЖИМЕ МОЩНОСТИ и следи, насколько падают твои G от первого раунда к последнему.',
      demoledor_name: 'СОКРУШИТЕЛЬ',
      demoledor_desc: 'Тебе нужен удар. Твоя сила — один тяжёлый акцентированный удар, а мешок — твоя территория.',
      demoledor_tip: 'Настрой калибровку точно и гонись за рекордом G в РЕЖИМЕ МОЩНОСТИ. Отдыхай между ударами: максимальная сила требует свежих мышц.',
      relampago_name: 'МОЛНИЯ',
      relampago_desc: 'Твоё — успеть первым. Скорость и время реакции — твоё преимущество.',
      relampago_tip: 'РЕЖИМ РЕАКЦИИ и РЕЖИМ ЦВЕТОВ — для тебя. Цель — стабильно держаться ниже 300 мс.',
      tecnico_name: 'ТЕХНИК',
      tecnico_desc: 'Тебе важно, как сделано, а не только насколько сильно. Ты измеряешь, чтобы исправлять, и именно тут растёшь быстрее всего.',
      tecnico_tip: 'Используй РЕЖИМ КОМБО, чтобы связывать удары без потери чистоты, и сравнивай среднюю мощность, а не максимум.',
      explorador_name: 'ИССЛЕДОВАТЕЛЬ',
      explorador_desc: 'Ты начинаешь или тренируешься когда получается. Сейчас твой главный выигрыш — регулярность, а не интенсивность.',
      explorador_tip: 'Короткие сессии по 2 раунда несколько раз в неделю. Следи за серией дней в истории: это твой счёт.',
    },
  },
  zh: {
    intro_title: '开始之前...', intro_sub: '10 个快速问题，生成你的格斗档案',
    step: '{n} / {total}', profile_title: '你的格斗档案', profile_cta: '继续',
    q: {
      objetivo: '你的主要目标是什么？', disciplina: '你练什么？',
      experiencia: '你练了多久？', frecuencia: '你每周练几天？',
      equipo: '你打什么？', lugar: '你通常在哪里训练？',
      duracion: '你一次训练多久？', debilidad: '你觉得什么最拖后腿？',
      medir: '你最想先测什么？', motivacion: '是什么让你坚持训练？',
    },
    a: {
      objetivo_potencia: '打得更重', objetivo_velocidad: '变得更快',
      objetivo_tecnica: '打磨技术', objetivo_forma: '练出体能',
      disciplina_boxeo: '拳击', disciplina_kickboxing: '自由搏击 / 泰拳',
      disciplina_marciales: '空手道、跆拳道、功夫', disciplina_solo: '我自己练',
      experiencia_novato: '不到 6 个月', experiencia_medio: '6 个月到 2 年',
      experiencia_veterano: '超过 2 年', experiencia_competidor: '我参加过比赛',
      frecuencia_f12: '1 到 2 天', frecuencia_f34: '3 到 4 天',
      frecuencia_f5: '5 天以上', frecuencia_irregular: '有空就练',
      equipo_saco: '重沙袋', equipo_muneco: '假人或木人桩',
      equipo_manoplas: '和搭档打手靶', equipo_sombra: '空击，不用沙袋',
      lugar_gimnasio: '健身房或俱乐部', lugar_casa: '在家',
      lugar_exterior: '户外', lugar_varia: '看情况',
      duracion_corta: '不到 20 分钟', duracion_media: '20 到 40 分钟',
      duracion_larga: '40 到 60 分钟', duracion_muylarga: '一个多小时',
      debilidad_potencia: '力量不够', debilidad_reaccion: '反应太慢',
      debilidad_resistencia: '很快就累', debilidad_constancia: '坚持不下来',
      medir_fuerza: '我出拳有多重', medir_reaccion: '我的反应时间',
      medir_resistencia: '我能撑几个回合', medir_progreso: '我的长期进步',
      motivacion_numeros: '看着数字上涨', motivacion_competir: '赢过别人',
      motivacion_superarme: '超越自己', motivacion_desahogo: '发泄和放松',
    },
    b: {
      competidor_name: '竞技者',
      competidor_desc: '你目标明确，也扛得住节奏。你的空间已经不在打得更重，而在疲劳来临时还能保持力量。',
      competidor_tip: '在力量模式下打长回合，观察你的 G 值从第一回合到最后一回合掉了多少。',
      demoledor_name: '破坏者',
      demoledor_desc: '你追求的是冲击力。单发重拳是你的强项，沙袋是你的主场。',
      demoledor_tip: '把校准调细，在力量模式里冲击你的 G 值纪录。出拳之间要休息：最大力量需要新鲜的肌肉。',
      relampago_name: '闪电',
      relampago_desc: '你的特点是先到一步。速度和反应时间就是你的竞争优势。',
      relampago_tip: '反应模式和颜色模式最适合你。目标是稳定保持在 300 毫秒以内。',
      tecnico_name: '技术家',
      tecnico_desc: '你在意的是怎么打，而不只是打多重。你测量是为了修正，而这正是你成长最快的地方。',
      tecnico_tip: '用连击模式串联出拳而不失动作质量，比较你的平均力量，而不是最大值。',
      explorador_name: '探索者',
      explorador_desc: '你刚起步，或者有空才练。你现在最大的收益是坚持，而不是强度。',
      explorador_tip: '每周多次、每次 2 回合的短训练。看历史里的连续天数：那才是你的计分板。',
    },
  },
  'zh-TW': {
    intro_title: '開始之前...', intro_sub: '10 個快速問題，生成你的格鬥檔案',
    step: '{n} / {total}', profile_title: '你的格鬥檔案', profile_cta: '繼續',
    q: {
      objetivo: '你的主要目標是什麼？', disciplina: '你練什麼？',
      experiencia: '你練了多久？', frecuencia: '你每週練幾天？',
      equipo: '你打什麼？', lugar: '你通常在哪裡訓練？',
      duracion: '你一次訓練多久？', debilidad: '你覺得什麼最拖累你？',
      medir: '你最想先測什麼？', motivacion: '是什麼讓你持續訓練？',
    },
    a: {
      objetivo_potencia: '打得更重', objetivo_velocidad: '變得更快',
      objetivo_tecnica: '打磨技術', objetivo_forma: '練出體能',
      disciplina_boxeo: '拳擊', disciplina_kickboxing: '自由搏擊 / 泰拳',
      disciplina_marciales: '空手道、跆拳道、功夫', disciplina_solo: '我自己練',
      experiencia_novato: '不到 6 個月', experiencia_medio: '6 個月到 2 年',
      experiencia_veterano: '超過 2 年', experiencia_competidor: '我參加過比賽',
      frecuencia_f12: '1 到 2 天', frecuencia_f34: '3 到 4 天',
      frecuencia_f5: '5 天以上', frecuencia_irregular: '有空就練',
      equipo_saco: '重沙袋', equipo_muneco: '假人或木人樁',
      equipo_manoplas: '和夥伴打手靶', equipo_sombra: '空擊，不用沙袋',
      lugar_gimnasio: '健身房或俱樂部', lugar_casa: '在家',
      lugar_exterior: '戶外', lugar_varia: '看情況',
      duracion_corta: '不到 20 分鐘', duracion_media: '20 到 40 分鐘',
      duracion_larga: '40 到 60 分鐘', duracion_muylarga: '一個多小時',
      debilidad_potencia: '力量不夠', debilidad_reaccion: '反應太慢',
      debilidad_resistencia: '很快就累', debilidad_constancia: '堅持不下來',
      medir_fuerza: '我出拳有多重', medir_reaccion: '我的反應時間',
      medir_resistencia: '我能撐幾個回合', medir_progreso: '我的長期進步',
      motivacion_numeros: '看著數字上升', motivacion_competir: '贏過別人',
      motivacion_superarme: '超越自己', motivacion_desahogo: '發洩和放鬆',
    },
    b: {
      competidor_name: '競技者',
      competidor_desc: '你目標明確，也扛得住節奏。你的空間已經不在打得更重，而在疲勞來臨時還能維持力量。',
      competidor_tip: '在力量模式下打長回合，觀察你的 G 值從第一回合到最後一回合掉了多少。',
      demoledor_name: '破壞者',
      demoledor_desc: '你追求的是衝擊力。單發重拳是你的強項，沙袋是你的主場。',
      demoledor_tip: '把校準調細，在力量模式裡衝擊你的 G 值紀錄。出拳之間要休息：最大力量需要新鮮的肌肉。',
      relampago_name: '閃電',
      relampago_desc: '你的特點是先到一步。速度和反應時間就是你的競爭優勢。',
      relampago_tip: '反應模式和顏色模式最適合你。目標是穩定保持在 300 毫秒以內。',
      tecnico_name: '技術家',
      tecnico_desc: '你在意的是怎麼打，而不只是打多重。你測量是為了修正，而這正是你成長最快的地方。',
      tecnico_tip: '用連擊模式串聯出拳而不失動作品質，比較你的平均力量，而不是最大值。',
      explorador_name: '探索者',
      explorador_desc: '你剛起步，或者有空才練。你現在最大的收益是堅持，而不是強度。',
      explorador_tip: '每週多次、每次 2 回合的短訓練。看歷史裡的連續天數：那才是你的計分板。',
    },
  },
  ko: {
    intro_title: '시작하기 전에...', intro_sub: '당신의 파이터 프로필을 만드는 10가지 질문',
    step: '{n} / {total}', profile_title: '당신의 파이터 프로필', profile_cta: '계속하기',
    q: {
      objetivo: '가장 큰 목표는 무엇인가요?', disciplina: '어떤 운동을 하나요?',
      experiencia: '얼마나 오래 훈련했나요?', frecuencia: '일주일에 며칠 훈련하나요?',
      equipo: '무엇을 치나요?', lugar: '보통 어디서 훈련하나요?',
      duracion: '한 번에 얼마나 훈련하나요?', debilidad: '가장 발목을 잡는 것은?',
      medir: '가장 먼저 측정하고 싶은 것은?', motivacion: '다시 훈련하게 만드는 것은?',
    },
    a: {
      objetivo_potencia: '더 세게 치기', objetivo_velocidad: '더 빨라지기',
      objetivo_tecnica: '기술 다듬기', objetivo_forma: '몸 만들기',
      disciplina_boxeo: '복싱', disciplina_kickboxing: '킥복싱 / 무에타이',
      disciplina_marciales: '가라테, 태권도, 쿵후', disciplina_solo: '혼자 훈련합니다',
      experiencia_novato: '6개월 미만', experiencia_medio: '6개월에서 2년',
      experiencia_veterano: '2년 이상', experiencia_competidor: '시합에 나갑니다',
      frecuencia_f12: '1~2일', frecuencia_f34: '3~4일',
      frecuencia_f5: '5일 이상', frecuencia_irregular: '가능할 때만',
      equipo_saco: '헤비백', equipo_muneco: '더미 또는 목인',
      equipo_manoplas: '파트너와 미트', equipo_sombra: '섀도, 백 없이',
      lugar_gimnasio: '체육관이나 클럽', lugar_casa: '집에서',
      lugar_exterior: '야외', lugar_varia: '날마다 다름',
      duracion_corta: '20분 미만', duracion_media: '20~40분',
      duracion_larga: '40~60분', duracion_muylarga: '한 시간 이상',
      debilidad_potencia: '파워가 부족해요', debilidad_reaccion: '반응이 늦어요',
      debilidad_resistencia: '금방 지쳐요', debilidad_constancia: '꾸준하지 못해요',
      medir_fuerza: '내 타격의 힘', medir_reaccion: '내 반응 시간',
      medir_resistencia: '라운드를 버티는 힘', medir_progreso: '시간에 따른 성장',
      motivacion_numeros: '수치가 오르는 것', motivacion_competir: '남을 이기는 것',
      motivacion_superarme: '나를 넘어서는 것', motivacion_desahogo: '스트레스 해소',
    },
    b: {
      competidor_name: '컴페티터',
      competidor_desc: '목표가 분명하고 페이스를 유지할 줄 압니다. 이제 여유는 더 세게 치는 데 있지 않고, 피로가 왔을 때 파워를 유지하는 데 있습니다.',
      competidor_tip: '파워 모드에서 긴 라운드를 하고, 첫 라운드와 마지막 라운드의 G 하락 폭을 확인하세요.',
      demoledor_name: '디몰리셔',
      demoledor_desc: '당신이 노리는 건 임팩트입니다. 한 방의 묵직한 타격이 강점이고, 헤비백이 당신의 무대입니다.',
      demoledor_tip: '캘리브레이션을 세밀하게 맞추고 파워 모드에서 G 기록에 도전하세요. 타격 사이엔 쉬어야 합니다. 최대 파워엔 회복된 근육이 필요합니다.',
      relampago_name: '라이트닝',
      relampago_desc: '당신의 강점은 먼저 도달하는 것입니다. 스피드와 반응 시간이 곧 경쟁력입니다.',
      relampago_tip: '반응 모드와 컬러 모드가 딱 맞습니다. 꾸준히 300ms 아래를 목표로 하세요.',
      tecnico_name: '테크니션',
      tecnico_desc: '얼마나 세게가 아니라 어떻게 치는지를 중시합니다. 고치기 위해 측정하고, 바로 거기서 가장 크게 성장합니다.',
      tecnico_tip: '콤보 모드로 폼을 잃지 않고 연결하고, 최고치가 아니라 평균 파워를 비교하세요.',
      explorador_name: '익스플로러',
      explorador_desc: '이제 시작했거나 가능할 때 훈련합니다. 지금 가장 큰 이득은 강도가 아니라 꾸준함입니다.',
      explorador_tip: '2라운드짜리 짧은 세션을 주 여러 번. 기록의 연속 일수를 보세요. 그게 당신의 점수판입니다.',
    },
  },
  ar: {
    intro_title: 'قبل أن نبدأ...', intro_sub: '10 أسئلة سريعة لبناء ملفك كمقاتل',
    step: '{n} / {total}', profile_title: 'ملفك كمقاتل', profile_cta: 'متابعة',
    q: {
      objetivo: 'ما هدفك الأساسي؟', disciplina: 'ماذا تمارس؟',
      experiencia: 'منذ متى وأنت تتدرب؟', frecuencia: 'كم يوماً في الأسبوع تتدرب؟',
      equipo: 'على ماذا تضرب؟', lugar: 'أين تتدرب عادةً؟',
      duracion: 'كم تستغرق حصتك؟', debilidad: 'ما الذي يعيقك أكثر؟',
      medir: 'ما الذي تريد قياسه أولاً؟', motivacion: 'ما الذي يعيدك إلى التدريب؟',
    },
    a: {
      objetivo_potencia: 'أن أضرب أقوى', objetivo_velocidad: 'أن أصبح أسرع',
      objetivo_tecnica: 'أن أصقل تقنيتي', objetivo_forma: 'أن أستعيد لياقتي',
      disciplina_boxeo: 'ملاكمة', disciplina_kickboxing: 'كيك بوكسينغ / مواي تاي',
      disciplina_marciales: 'كاراتيه، تايكوندو، كونغ فو', disciplina_solo: 'أتدرب بمفردي',
      experiencia_novato: 'أقل من 6 أشهر', experiencia_medio: 'من 6 أشهر إلى سنتين',
      experiencia_veterano: 'أكثر من سنتين', experiencia_competidor: 'أنافس أو نافست',
      frecuencia_f12: 'يوم أو يومان', frecuencia_f34: '3 أو 4 أيام',
      frecuencia_f5: '5 أيام أو أكثر', frecuencia_irregular: 'حين أستطيع',
      equipo_saco: 'كيس ثقيل', equipo_muneco: 'دمية تدريب',
      equipo_manoplas: 'لبادات مع شريك', equipo_sombra: 'ملاكمة الظل، بلا كيس',
      lugar_gimnasio: 'في نادٍ أو صالة', lugar_casa: 'في البيت',
      lugar_exterior: 'في الهواء الطلق', lugar_varia: 'يختلف حسب اليوم',
      duracion_corta: 'أقل من 20 دقيقة', duracion_media: 'من 20 إلى 40 دقيقة',
      duracion_larga: 'من 40 إلى 60 دقيقة', duracion_muylarga: 'أكثر من ساعة',
      debilidad_potencia: 'تنقصني القوة', debilidad_reaccion: 'رد فعلي متأخر',
      debilidad_resistencia: 'أتعب بسرعة', debilidad_constancia: 'لست منتظماً',
      medir_fuerza: 'قوة ضربتي', medir_reaccion: 'زمن رد فعلي',
      medir_resistencia: 'قدرتي على الاستمرار عبر الجولات', medir_progreso: 'تقدّمي مع الوقت',
      motivacion_numeros: 'رؤية أرقامي ترتفع', motivacion_competir: 'التغلب على الآخرين',
      motivacion_superarme: 'تجاوز نفسي', motivacion_desahogo: 'تفريغ الضغط',
    },
    b: {
      competidor_name: 'المنافس',
      competidor_desc: 'تتدرب بهدف واضح وتحافظ على الإيقاع. هامشك لم يعد في الضرب أقوى، بل في الحفاظ على القوة حين يأتي التعب.',
      competidor_tip: 'خُض جولات طويلة في وضع القوة وراقب انخفاض قيم G من الجولة الأولى إلى الأخيرة.',
      demoledor_name: 'المدمّر',
      demoledor_desc: 'أنت تبحث عن الاصطدام. قوتك في الضربة المفردة الساحقة، والكيس هو ميدانك.',
      demoledor_tip: 'اضبط المعايرة بدقة وطارد رقمك القياسي في وضع القوة. استرح بين الضربات: القوة القصوى تحتاج عضلة مرتاحة.',
      relampago_name: 'البرق',
      relampago_desc: 'ميزتك أن تصل أولاً. السرعة وزمن رد الفعل هما سلاحك.',
      relampago_tip: 'وضع رد الفعل ووضع الألوان صُنعا لك. استهدف البقاء تحت 300 مللي ثانية بثبات.',
      tecnico_name: 'الفنّي',
      tecnico_desc: 'يهمك كيف تُنفَّذ الضربة لا مقدار قوتها فقط. تقيس لتصحّح، وهناك تنمو أكثر.',
      tecnico_tip: 'استخدم وضع الكومبو لتسلسل الضربات دون فقدان النظافة، وقارن متوسط قوتك لا ذروتها.',
      explorador_name: 'المستكشف',
      explorador_desc: 'أنت في البداية أو تتدرب حين تستطيع. أكبر مكسب لك الآن هو الانتظام، لا الشدة.',
      explorador_tip: 'حصص قصيرة من جولتين، عدة مرات في الأسبوع. راقب سلسلة أيامك في السجل: تلك هي نتيجتك.',
    },
  },
  hi: {
    intro_title: 'शुरू करने से पहले...', intro_sub: 'आपकी फाइटर प्रोफ़ाइल बनाने के लिए 10 त्वरित सवाल',
    step: '{n} / {total}', profile_title: 'आपकी फाइटर प्रोफ़ाइल', profile_cta: 'जारी रखें',
    q: {
      objetivo: 'आपका मुख्य लक्ष्य क्या है?', disciplina: 'आप क्या अभ्यास करते हैं?',
      experiencia: 'आप कब से अभ्यास कर रहे हैं?', frecuencia: 'हफ़्ते में कितने दिन अभ्यास करते हैं?',
      equipo: 'आप किस पर प्रहार करते हैं?', lugar: 'आप आमतौर पर कहाँ अभ्यास करते हैं?',
      duracion: 'आपका सत्र कितना लंबा होता है?', debilidad: 'आपको सबसे ज़्यादा क्या रोकता है?',
      medir: 'आप पहले क्या मापना चाहते हैं?', motivacion: 'आपको दोबारा अभ्यास पर क्या लाता है?',
    },
    a: {
      objetivo_potencia: 'और ज़ोर से मारना', objetivo_velocidad: 'और तेज़ होना',
      objetivo_tecnica: 'तकनीक निखारना', objetivo_forma: 'फिट होना',
      disciplina_boxeo: 'बॉक्सिंग', disciplina_kickboxing: 'किकबॉक्सिंग / मॉय थाई',
      disciplina_marciales: 'कराटे, ताइक्वांडो, कुंग फू', disciplina_solo: 'मैं खुद अभ्यास करता हूँ',
      experiencia_novato: '6 महीने से कम', experiencia_medio: '6 महीने से 2 साल',
      experiencia_veterano: '2 साल से ज़्यादा', experiencia_competidor: 'मैं प्रतियोगिता करता हूँ',
      frecuencia_f12: '1 या 2 दिन', frecuencia_f34: '3 या 4 दिन',
      frecuencia_f5: '5 दिन या ज़्यादा', frecuencia_irregular: 'जब समय मिले',
      equipo_saco: 'भारी बैग', equipo_muneco: 'डमी या पुतला',
      equipo_manoplas: 'साथी के साथ पैड', equipo_sombra: 'शैडो, बिना बैग',
      lugar_gimnasio: 'जिम या क्लब में', lugar_casa: 'घर पर',
      lugar_exterior: 'खुले में', lugar_varia: 'दिन पर निर्भर',
      duracion_corta: '20 मिनट से कम', duracion_media: '20 से 40 मिनट',
      duracion_larga: '40 से 60 मिनट', duracion_muylarga: 'एक घंटे से ज़्यादा',
      debilidad_potencia: 'ताक़त की कमी है', debilidad_reaccion: 'देर से प्रतिक्रिया करता हूँ',
      debilidad_resistencia: 'जल्दी थक जाता हूँ', debilidad_constancia: 'नियमित नहीं हूँ',
      medir_fuerza: 'मेरे प्रहार की ताक़त', medir_reaccion: 'मेरा प्रतिक्रिया समय',
      medir_resistencia: 'राउंड में कितना टिकता हूँ', medir_progreso: 'समय के साथ मेरी प्रगति',
      motivacion_numeros: 'अपने आँकड़े बढ़ते देखना', motivacion_competir: 'दूसरों को हराना',
      motivacion_superarme: 'खुद से आगे निकलना', motivacion_desahogo: 'तनाव निकालना',
    },
    b: {
      competidor_name: 'प्रतियोगी',
      competidor_desc: 'आप स्पष्ट लक्ष्य के साथ अभ्यास करते हैं और रफ़्तार बनाए रखते हैं। अब आपकी गुंजाइश ज़ोर से मारने में नहीं, बल्कि थकान आने पर ताक़त बनाए रखने में है।',
      competidor_tip: 'शक्ति मोड में लंबे राउंड करें और देखें कि पहले से आख़िरी राउंड तक आपके G कितने गिरते हैं।',
      demoledor_name: 'ध्वंसक',
      demoledor_desc: 'आपको प्रहार का असर चाहिए। एक भारी प्रहार आपकी ताक़त है, और बैग आपका मैदान।',
      demoledor_tip: 'कैलिब्रेशन बारीकी से करें और शक्ति मोड में अपना G रिकॉर्ड तोड़ें। प्रहारों के बीच आराम करें: अधिकतम ताक़त के लिए ताज़ा मांसपेशी चाहिए।',
      relampago_name: 'बिजली',
      relampago_desc: 'आपकी खूबी है पहले पहुँचना। गति और प्रतिक्रिया समय ही आपकी बढ़त है।',
      relampago_tip: 'प्रतिक्रिया मोड और रंग मोड आपके लिए हैं। लगातार 300 ms से नीचे रहने का लक्ष्य रखें।',
      tecnico_name: 'तकनीशियन',
      tecnico_desc: 'आपके लिए मायने रखता है कि कैसे किया जाए, सिर्फ़ कितना ज़ोर से नहीं। आप सुधारने के लिए मापते हैं, और वहीं सबसे ज़्यादा बढ़ते हैं।',
      tecnico_tip: 'कॉम्बो मोड से सफ़ाई खोए बिना प्रहार जोड़ें, और अधिकतम नहीं बल्कि औसत ताक़त की तुलना करें।',
      explorador_name: 'खोजी',
      explorador_desc: 'आप शुरुआत कर रहे हैं या जब समय मिले तब अभ्यास करते हैं। अभी आपका सबसे बड़ा फ़ायदा तीव्रता नहीं, निरंतरता है।',
      explorador_tip: '2 राउंड के छोटे सत्र, हफ़्ते में कई बार। इतिहास में अपनी दिनों की लय देखें: वही आपका स्कोरबोर्ड है।',
    },
  },
};

// Texto del quiz con respaldo: idioma actual → inglés → español
function quizT(path, params) {
  const get = (d) => path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), d);
  let str = get(QUIZ_I18N[APP.lang]);
  if (str === undefined) str = get(QUIZ_I18N.en);
  if (str === undefined) str = get(QUIZ_I18N.es);
  if (str === undefined) return path;
  if (params) Object.keys(params).forEach(k => {
    str = str.replace(new RegExp('\\{' + k + '\\}', 'g'), params[k]);
  });
  return str;
}

// ── Estado y persistencia ──
function loadQuiz() {
  try {
    const raw = localStorage.getItem(QUIZ_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}

function saveQuiz(data) {
  try { localStorage.setItem(QUIZ_STORAGE_KEY, JSON.stringify(data)); } catch (e) {}
}

// Una sola vez por dispositivo: tanto completarlo como saltarlo levantan el
// flag, porque el quiz es un paso de alta, no algo que se repita.
function isQuizDone() {
  return localStorage.getItem(QUIZ_DONE_KEY) === 'true';
}

function markQuizDone() {
  localStorage.setItem(QUIZ_DONE_KEY, 'true');
}

function shouldShowQuiz() {
  return !isQuizDone();
}

function getQuizBucket() {
  return localStorage.getItem(QUIZ_BUCKET_KEY) || null;
}

// ── Cálculo del perfil ──
function calcQuizBucket(answers) {
  const points = {};
  QUIZ_BUCKETS.forEach(b => { points[b.id] = 0; });

  QUIZ_QUESTIONS.forEach(q => {
    const opt = q.options.find(o => o.id === answers[q.id]);
    if (!opt) return;
    Object.keys(opt.scores).forEach(b => {
      if (points[b] !== undefined) points[b] += opt.scores[b];
    });
  });

  // Gana el más puntuado; a igualdad manda el orden de QUIZ_BUCKETS
  let best = QUIZ_BUCKETS[0].id;
  QUIZ_BUCKETS.forEach(b => { if (points[b.id] > points[best]) best = b.id; });
  return { bucket: best, points };
}

// ── Supabase ──
// Al responder el quiz todavía no hay cuenta, así que la fila queda pendiente
// en local y se sube en cuanto hay usuario.
function quizRecordToRow(record, userId) {
  return {
    usuario_id:  userId,
    fecha:       new Date(record.ts).toISOString(),
    idioma:      record.lang || APP.lang,
    version:     record.version || QUIZ_VERSION,
    bucket:      record.bucket,
    objetivo:    record.answers.objetivo,
    disciplina:  record.answers.disciplina,
    experiencia: record.answers.experiencia,
    frecuencia:  record.answers.frecuencia,
    equipo:      record.answers.equipo,
    lugar:       record.answers.lugar,
    duracion:    record.answers.duracion,
    debilidad:   record.answers.debilidad,
    medir:       record.answers.medir,
    motivacion:  record.answers.motivacion,
    puntos:      record.points,
  };
}

async function saveQuizToSupabase(record) {
  const userId = APP.profile && APP.profile.supabase_id;
  if (!supabaseClient || !userId) {
    // Sin cuenta todavía: se guarda para subirlo al registrarse
    try { localStorage.setItem(QUIZ_PENDING_KEY, JSON.stringify(record)); } catch (e) {}
    return;
  }
  try {
    await supabaseClient.from('quiz_responses').insert(quizRecordToRow(record, userId));
    localStorage.removeItem(QUIZ_PENDING_KEY);
  } catch (e) {}
}

// Se llama justo después de registrarse o iniciar sesión
async function flushPendingQuiz() {
  const userId = APP.profile && APP.profile.supabase_id;
  if (!supabaseClient || !userId) return;
  let record = null;
  try {
    const raw = localStorage.getItem(QUIZ_PENDING_KEY);
    record = raw ? JSON.parse(raw) : null;
  } catch (e) {}
  if (!record) return;
  try {
    await supabaseClient.from('quiz_responses').insert(quizRecordToRow(record, userId));
    localStorage.removeItem(QUIZ_PENDING_KEY);
  } catch (e) {}
}

// ── Flujo ──
// onDone se llama SIEMPRE (se complete o se salte): quien llama sigue con el
// registro/home sin tener que saber si hubo quiz o no.
let _quizState = null;

function maybeShowQuiz(onDone) {
  if (!shouldShowQuiz()) { onDone && onDone(); return; }
  _quizState = { idx: 0, answers: {}, onDone: onDone || (() => {}) };
  showScreen('screen-quiz', true);
  renderQuizQuestion();
}

function finishQuizFlow() {
  const done = _quizState ? _quizState.onDone : null;
  _quizState = null;
  done && done();
}

function skipQuiz() {
  markQuizDone();   // el quiz de alta no se vuelve a ofrecer
  finishQuizFlow();
}

function renderQuizQuestion() {
  if (!_quizState) return;
  const total = QUIZ_QUESTIONS.length;
  const i     = _quizState.idx;
  const q     = QUIZ_QUESTIONS[i];

  const fill = document.getElementById('quiz-progress-fill');
  if (fill) fill.style.width = Math.round((i / total) * 100) + '%';
  const step = document.getElementById('quiz-step');
  if (step) step.textContent = quizT('step', { n: i + 1, total });

  const back = document.getElementById('btn-quiz-back');
  if (back) back.classList.toggle('hidden', i === 0);

  const body = document.getElementById('quiz-body');
  if (!body) return;

  const opts = q.options.map(o => `
    <button class="quiz-opt" data-opt="${o.id}">
      <span class="quiz-opt-emoji">${o.emoji}</span>
      <span class="quiz-opt-label">${quizT('a.' + q.id + '_' + o.id)}</span>
      <span class="quiz-opt-arrow">›</span>
    </button>`).join('');

  body.innerHTML = `
    ${i === 0 ? `<div class="quiz-intro">
      <div class="quiz-intro-title">${quizT('intro_title')}</div>
      <div class="quiz-intro-sub">${quizT('intro_sub')}</div>
    </div>` : ''}
    <h2 class="quiz-question">${quizT('q.' + q.id)}</h2>
    <div class="quiz-opts">${opts}</div>`;

  body.querySelectorAll('.quiz-opt').forEach(btn => {
    btn.onclick = () => answerQuiz(q.id, btn.dataset.opt);
  });
}

function answerQuiz(questionId, optionId) {
  if (!_quizState) return;
  _quizState.answers[questionId] = optionId;
  vibrate([12]);
  playSound('good_reaccion');
  if (_quizState.idx < QUIZ_QUESTIONS.length - 1) {
    _quizState.idx++;
    renderQuizQuestion();
  } else {
    completeQuiz();
  }
}

function quizBack() {
  if (!_quizState || _quizState.idx === 0) return;
  _quizState.idx--;
  renderQuizQuestion();
}

function completeQuiz() {
  const answers = _quizState ? _quizState.answers : {};
  const { bucket, points } = calcQuizBucket(answers);
  const record = {
    completed: true, version: QUIZ_VERSION, ts: Date.now(),
    lang: APP.lang, answers, bucket, points,
  };

  saveQuiz(record);
  markQuizDone();
  localStorage.setItem(QUIZ_BUCKET_KEY, bucket);
  saveQuizToSupabase(record);

  const fill = document.getElementById('quiz-progress-fill');
  if (fill) fill.style.width = '100%';

  renderQuizResult(bucket);
}

function renderQuizResult(bucketId) {
  const b    = QUIZ_BUCKETS.find(x => x.id === bucketId) || QUIZ_BUCKETS[0];
  const body = document.getElementById('quiz-result-body');
  if (!body) { finishQuizFlow(); return; }

  body.innerHTML = `
    <div class="quiz-res-card" style="--bc:${b.color}">
      <div class="quiz-res-kicker">${quizT('profile_title')}</div>
      <div class="quiz-res-emoji">${b.emoji}</div>
      <div class="quiz-res-name">${quizT('b.' + b.id + '_name')}</div>
      <p class="quiz-res-desc">${quizT('b.' + b.id + '_desc')}</p>
      <div class="quiz-res-tip">${quizT('b.' + b.id + '_tip')}</div>
      <button class="btn-primary quiz-res-cta" id="btn-quiz-continue">${quizT('profile_cta')}</button>
    </div>`;

  showScreen('screen-quiz-result', true);
  playSound('level_up');
  spawnHitParticles(b.color, window.innerWidth / 2, window.innerHeight / 3, 24);

  const cta = document.getElementById('btn-quiz-continue');
  if (cta) cta.onclick = finishQuizFlow;
}

function initQuizScreen() {
  const skip = document.getElementById('btn-quiz-skip');
  if (skip) skip.onclick = skipQuiz;
  const back = document.getElementById('btn-quiz-back');
  if (back) back.onclick = quizBack;
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
  const name     = profile ? profile.name : (localStorage.getItem('fkf_guestName') || t('you'));
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
      <button class="rank-subtab" data-sub="potencia">🏆 ${t('card_power')}</button>
      <button class="rank-subtab" data-sub="velocidad">⚡ ${t('speed_title')}</button>
      <button class="rank-subtab" data-sub="xp">⭐ XP</button>
    </div>
    <div class="rank-list"></div>
    <p class="rank-coming-soon">🌐 ${t('global_ranking_soon')}</p>`;

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
  // Antes que nada: nadie debe leer el XP viejo sin migrar
  migrateXPToV52();
  loadSoundPref();
  armAudioUnlock();
  preloadSounds(SOUND_PRELOAD_BOOT);
  loadCalibration();
  loadColorConfig();
  APP.records = loadRecords();
  initAvatarSystem();
  initSettingsModal();
  initQuizScreen();

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

  // Plain setTimeout: con trackedTimeout, un stopEverything() en los primeros
  // 100ms cancelaba el arranque y el fondo no aparecía nunca.
  window.setTimeout(() => startBgParticles(), 100);
}

// ═══════════════════════════════════════════════════
// AYUDA — CONTENIDO POR IDIOMA
// ═══════════════════════════════════════════════════
const HELP_SECTIONS = {
  es: [
    {
      icon: '🥊', title: '¿Qué es Strike IQ?',
      html: `<p>Strike IQ convierte tu móvil en un medidor de golpes para entrenamiento de <strong>boxeo, kickboxing, artes marciales</strong> o saco de arena.</p>
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
  <li>⏱️ <strong>Aviso</strong> — cuando quedan 10 s de descanso.</li>
  <li>🎶 <strong>Música de fondo</strong> — en los menús (se corta al empezar el round).</li>
  <li>🗣️ <strong>Voz</strong> — anuncia resultados en tu idioma (¡Bien! / ¡Maestro! / ¡Sigue intentando!).</li>
</ul>`
    },
    {
      icon: '❓', title: 'Preguntas frecuentes',
      html: `
<p class="help-faq-q">¿Por qué cuenta golpes de más?</p>
<p class="help-faq-a">El umbral de detección es muy bajo. Ve a <strong>Calibrar dispositivo</strong> para ajustarlo a tu golpe y tu saco.</p>
<p class="help-faq-q">¿Funciona sin internet?</p>
<p class="help-faq-a">Sí. Strike IQ es una <strong>PWA</strong> (Progressive Web App) que funciona completamente offline una vez cargada.</p>
<p class="help-faq-q">¿Puedo usarla en iOS?</p>
<p class="help-faq-a">Sí. La primera vez debes dar permiso al <strong>sensor de movimiento</strong> en la pantalla de configuración.</p>
<p class="help-faq-q">¿Se guardan mis datos en la nube?</p>
<p class="help-faq-a">No. Todo se guarda <strong>solo en tu móvil</strong>. Nunca se envía nada a ningún servidor.</p>`
    },
  ],
  en: [
    {
      icon: '🥊', title: 'What is Strike IQ?',
      html: `<p>Strike IQ turns your phone into a punch tracker for <strong>boxing, kickboxing, martial arts</strong> or bag training.</p>
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
  <li>⏱️ <strong>Warning</strong> — when 10 s of rest are left.</li>
  <li>🎶 <strong>Background music</strong> — in the menus (stops when the round starts).</li>
  <li>🗣️ <strong>Voice</strong> — announces results in your language (Good! / Master! / Keep trying!).</li>
</ul>`
    },
    {
      icon: '❓', title: 'Frequently Asked Questions',
      html: `
<p class="help-faq-q">Why does it count too many punches?</p>
<p class="help-faq-a">The detection threshold is too low. Go to <strong>Calibrate device</strong> to tune it for your punch and bag.</p>
<p class="help-faq-q">Does it work without internet?</p>
<p class="help-faq-a">Yes. Strike IQ is a <strong>PWA</strong> (Progressive Web App) that works fully offline once loaded.</p>
<p class="help-faq-q">Can I use it on iOS?</p>
<p class="help-faq-a">Yes. The first time you must grant <strong>motion sensor permission</strong> in the config screen.</p>
<p class="help-faq-q">Is my data saved to the cloud?</p>
<p class="help-faq-a">No. Everything is stored <strong>only on your phone</strong>. Nothing is ever sent to any server.</p>`
    },
  ],
  pt: [
    {
      icon: '🥊', title: 'O que é Strike IQ?',
      html: `<p>Strike IQ transforma seu celular em um medidor de golpes para treino de <strong>boxe, kickboxing, artes marciais</strong> ou saco de pancadas.</p>
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
  <li>⏱️ <strong>Aviso</strong> — quando faltam 10 s de descanso.</li>
  <li>🎶 <strong>Música de fundo</strong> — nos menus (para ao começar o round).</li>
  <li>🗣️ <strong>Voz</strong> — anuncia resultados no seu idioma.</li>
</ul>`
    },
    {
      icon: '❓', title: 'Perguntas frequentes',
      html: `
<p class="help-faq-q">Por que conta golpes demais?</p>
<p class="help-faq-a">O limiar de detecção está muito baixo. Vá em <strong>Calibrar dispositivo</strong> para ajustá-lo ao seu golpe e saco.</p>
<p class="help-faq-q">Funciona sem internet?</p>
<p class="help-faq-a">Sim. Strike IQ é um <strong>PWA</strong> que funciona completamente offline após o primeiro carregamento.</p>
<p class="help-faq-q">Posso usar no iOS?</p>
<p class="help-faq-a">Sim. Na primeira vez, conceda <strong>permissão ao sensor de movimento</strong> na tela de configuração.</p>
<p class="help-faq-q">Meus dados ficam na nuvem?</p>
<p class="help-faq-a">Não. Tudo é guardado <strong>apenas no seu celular</strong>. Nada é enviado a nenhum servidor.</p>`
    },
  ],
  de: [
    {
      icon: '🥊', title: 'Was ist Strike IQ?',
      html: `<p>Strike IQ verwandelt dein Smartphone in einen Schlag-Tracker für <strong>Boxen, Kickboxen, Kampfsport</strong> oder Sandsack-Training.</p>
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
  <li>⏱️ <strong>Hinweis</strong> — wenn noch 10 s Pause bleiben.</li>
  <li>🎶 <strong>Hintergrundmusik</strong> — in den Menüs (stoppt beim Rundenstart).</li>
  <li>🗣️ <strong>Stimme</strong> — kündigt Ergebnisse in deiner Sprache an.</li>
</ul>`
    },
    {
      icon: '❓', title: 'Häufige Fragen',
      html: `
<p class="help-faq-q">Warum werden zu viele Schläge gezählt?</p>
<p class="help-faq-a">Der Erkennungsschwellenwert ist zu niedrig. Gehe zu <strong>Gerät kalibrieren</strong>, um ihn anzupassen.</p>
<p class="help-faq-q">Funktioniert es ohne Internet?</p>
<p class="help-faq-a">Ja. Strike IQ ist eine <strong>PWA</strong>, die nach dem ersten Laden vollständig offline funktioniert.</p>
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

  // La ayuda larga sólo está escrita en es/en/pt/de: los 8 idiomas nuevos
  // caen a inglés (misma cadena de respaldo que t()).
  const sections = HELP_SECTIONS[APP.lang] || HELP_SECTIONS.en || HELP_SECTIONS.es;
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
  // La música de menús también obedece al mute global
  if (!APP.soundEnabled) stopMenuMusic();
  else if (isOnMenuScreen()) startMenuMusic();
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
  { key: 'suave',  bg: '#001533', color: '#00FF66', tapG: 1.2, label: {
    es: 'GOLPE SUAVE', en: 'SOFT PUNCH', pt: 'GOLPE LEVE', de: 'LEICHTER SCHLAG',
    ja: '弱いパンチ', fr: 'COUP LÉGER', ru: 'СЛАБЫЙ УДАР', zh: '轻击',
    'zh-TW': '輕擊', ko: '약한 타격', ar: 'ضربة خفيفة', hi: 'हल्का प्रहार' } },
  { key: 'medio',  bg: '#1a1100', color: '#FFD300', tapG: 2.0, label: {
    es: 'GOLPE MEDIO', en: 'MEDIUM PUNCH', pt: 'GOLPE MÉDIO', de: 'MITTLERER SCHLAG',
    ja: '中くらいのパンチ', fr: 'COUP MOYEN', ru: 'СРЕДНИЙ УДАР', zh: '中等击打',
    'zh-TW': '中等擊打', ko: '중간 타격', ar: 'ضربة متوسطة', hi: 'मध्यम प्रहार' } },
  { key: 'fuerte', bg: '#001500', color: '#FF1A1A', tapG: 3.0, label: {
    es: 'GOLPE FUERTE', en: 'HARD PUNCH', pt: 'GOLPE FORTE', de: 'HARTER SCHLAG',
    ja: '強いパンチ', fr: 'COUP FORT', ru: 'СИЛЬНЫЙ УДАР', zh: '重击',
    'zh-TW': '重擊', ko: '강한 타격', ar: 'ضربة قوية', hi: 'तेज़ प्रहार' } },
];

// La calibración lee SIEMPRE accelerationIncludingGravity: es el único dato
// presente en todos los dispositivos. En reposo la magnitud es ~1G, así que
// los umbrales llevan esa gravedad base incorporada y el pico guardado se
// almacena ya sin ella (magnitud − 1G = impacto real).
const CALIB_GRAVITY = 1.0;   // gravedad base contenida en cada lectura (G)
const CALIB_TRIG_G  = 1.3;   // disparo: 1G de gravedad + 0.3G de impacto
const CALIB_RING_G  = 1.1;   // fin del rebote: 1G + 0.1G

// Umbral válido: nunca por debajo de 0.01G (dispositivos que reciben poca
// vibración del saco) ni por encima del tope del slider.
function clampThreshold(g) {
  const v = Number(g);
  if (!Number.isFinite(v)) return APP.accel.THRESHOLD;
  return Math.min(APP.accel.MAX_THRESHOLD_G,
                  Math.max(APP.accel.ABSOLUTE_MIN_G, Math.round(v * 100) / 100));
}

function loadCalibration() {
  const raw = localStorage.getItem('fkf_calibration');
  if (!raw) return false;
  try {
    const c = JSON.parse(raw);
    // Las calibraciones anteriores a netG se midieron con la gravedad incluida
    // (~1G de más): su umbral no sirve para la detección por aceleración neta.
    if (!c.netG) {
      localStorage.removeItem('fkf_calibration');
      return false;
    }
    APP.calibration = c;
    APP.accel.THRESHOLD = clampThreshold(c.threshold);
    APP.accel.COOLDOWN  = c.debounce;
    APP.accel.COMBO_HIT_COOLDOWN = Math.max(55, c.debounce - 45);
    return true;
  } catch(e) { return false; }
}

function saveCalibration(soft, medium, hard, threshold, debounce) {
  const safeThreshold = clampThreshold(threshold);
  const calibration = {
    soft:       Math.round(soft   * 100) / 100,
    medium:     Math.round(medium * 100) / 100,
    hard:       Math.round(hard   * 100) / 100,
    threshold:  safeThreshold,
    debounce,
    netG:       true,   // medida sobre aceleración neta (sin gravedad)
    calibrated: true,
    date:       Date.now(),
  };
  localStorage.setItem('fkf_calibration', JSON.stringify(calibration));
  APP.calibration = calibration;
  APP.accel.THRESHOLD = safeThreshold;
  APP.accel.COOLDOWN  = debounce;
  APP.accel.COMBO_HIT_COOLDOWN = Math.max(55, debounce - 45);
}

// ─────────────────────────────────────────────────────
// AJUSTE MANUAL DE SENSIBILIDAD
// Slider que convive con la calibración automática: el usuario puede afinar
// el umbral después de calibrar (o sin calibrar) hasta 0.01G, para sacos o
// muñecos que transmiten poca vibración al móvil.
// ─────────────────────────────────────────────────────
function currentManualThreshold() {
  const fromCalib = APP.calibration && Number(APP.calibration.threshold);
  if (Number.isFinite(fromCalib) && fromCalib > 0) return clampThreshold(fromCalib);
  return clampThreshold(APP.accel.THRESHOLD || 0.8);
}

// Aplica y persiste el umbral manual al instante (cada movimiento del slider)
function setManualThreshold(g) {
  const v = clampThreshold(g);
  const base = APP.calibration || {};
  const calibration = {
    soft:       base.soft   || 0,
    medium:     base.medium || 0,
    hard:       base.hard   || 0,
    threshold:  v,
    debounce:   base.debounce || APP.accel.COOLDOWN || 150,
    netG:       true,
    // Mover el slider no equivale a haber calibrado: si nunca se calibró, se
    // sigue mostrando la intro de calibración (y el aviso del menú).
    calibrated: base.calibrated === true,
    manual:     true,
    date:       base.date || Date.now(),
  };
  localStorage.setItem('fkf_calibration', JSON.stringify(calibration));
  APP.calibration     = calibration;
  APP.accel.THRESHOLD = v;
  console.log('[FKF] umbral manual =', v.toFixed(2) + 'G');
}

function thresholdSliderHTML() {
  const v = currentManualThreshold();
  return `
    <div class="calib-manual">
      <div class="calib-manual-title">${t('calib_manual_title')}</div>
      <div class="calib-manual-label" id="calib-thr-label">${t('calib_manual_label', { g: v.toFixed(2) })}</div>
      <input type="range" class="slider calib-manual-slider" id="calib-thr-slider"
             min="0.01" max="3" step="0.05" value="${v}" />
      <div class="slider-range"><span>0.01G</span><span>3.00G</span></div>
      <p class="calib-manual-desc">${t('calib_manual_desc')}</p>
    </div>`;
}

function wireThresholdSlider() {
  const sl  = document.getElementById('calib-thr-slider');
  const lbl = document.getElementById('calib-thr-label');
  if (!sl) return;
  const apply = () => {
    const v = clampThreshold(parseFloat(sl.value));
    if (lbl) lbl.textContent = t('calib_manual_label', { g: v.toFixed(2) });
    setManualThreshold(v);
  };
  sl.oninput  = apply;
  sl.onchange = apply;
}

function showCalibrationScreen(fromScreen) {
  APP.calib.fromScreen = fromScreen || 'screen-menu';
  APP.calib.step  = 0;
  APP.calib.state = 'idle';
  APP.calib.data  = [];
  showScreen('screen-calibration');
  document.getElementById('btn-calib-back').onclick = () => {
    stopCalibListener();
    APP.calib.state = 'idle';
    showScreen(APP.calib.fromScreen);
  };
  // Si ya hay una calibración guardada, se muestra primero su resumen en vez
  // de arrancar los 3 pasos otra vez
  if (APP.calibration && APP.calibration.calibrated) renderCalibExisting();
  else                                               renderCalibIntro();
}

// Resumen de la calibración guardada. No arranca el sensor: la lectura en
// vivo y el aviso "Sensor activo" solo aparecen al pulsar RECALIBRAR.
function renderCalibExisting() {
  const c = APP.calibration;
  const content = document.getElementById('calib-content');
  content.style.background = '';
  stopCalibListener();

  const card = (icon, label, value, color) => `
    <div class="calib-cur-card">
      <span class="calib-cur-icon">${icon}</span>
      <span class="calib-cur-label">${label}</span>
      <span class="calib-cur-value"${color ? ` style="color:${color}"` : ''}>${value}</span>
    </div>`;

  const stepLabel = i => CALIB_STEPS[i].label[APP.lang] || CALIB_STEPS[i].label.es;

  content.innerHTML = `
    <div class="calib-results calib-cur-screen">
      <h3 class="calib-cur-title">${t('calib_current_title')}</h3>
      <div class="calib-cur-cards">
        ${card('🟢', stepLabel(0), `${(c.soft   || 0).toFixed(1)}G`, CALIB_STEPS[0].color)}
        ${card('🟡', stepLabel(1), `${(c.medium || 0).toFixed(1)}G`, CALIB_STEPS[1].color)}
        ${card('🔴', stepLabel(2), `${(c.hard   || 0).toFixed(1)}G`, CALIB_STEPS[2].color)}
        ${card('⚙️', t('calib_cur_threshold'), `${(c.threshold || 0).toFixed(2)}G`)}
        ${card('⏱', t('calib_cur_debounce'), `${c.debounce || 0}ms`)}
        ${card('📅', t('calib_existing_date'), c.date ? fmtDate(c.date) : '—')}
      </div>
      ${thresholdSliderHTML()}
      <button class="btn-primary btn-calib-ready" id="btn-calib-keep">${t('calib_use_existing')}</button>
      <button class="btn-calib-outline" id="btn-calib-redo">${t('calib_recalibrate')}</button>
    </div>`;

  wireThresholdSlider();

  document.getElementById('btn-calib-keep').onclick = () => {
    stopCalibListener();
    APP.calib.state = 'idle';
    showScreen(APP.calib.fromScreen || 'screen-menu');
    if ((APP.calib.fromScreen || 'screen-menu') === 'screen-menu') initMenuScreen();
  };
  document.getElementById('btn-calib-redo').onclick = () => {
    APP.calib.data = [];
    renderCalibIntro();
  };
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
      <div class="calib-sensor-status" id="calib-sensor-status"></div>
      <button class="btn-primary btn-calib-ready" id="btn-calib-start">${t('calib_start')}</button>
      ${thresholdSliderHTML()}
    </div>`;
  document.getElementById('btn-calib-start').onclick = () => renderCalibStep(1);
  wireThresholdSlider();
  // Estado del sensor visible ya en la intro: el usuario sabe si responde
  // antes de empezar los 3 pasos.
  startCalibSensor(1);
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
      <div class="calib-sensor-live" id="calib-sensor-live">${t('calib_sensor_live', { g: '0.0' })}</div>
      <div class="calib-sensor-status" id="calib-sensor-status"></div>
      <div class="calib-live-peak" id="calib-live-peak"></div>
      <div class="calib-step-status" id="calib-status">${t('calib_press_ready')}</div>
      <div class="calib-step-actions" id="calib-step-actions">
        <button class="btn-primary btn-calib-ready" id="btn-calib-ready">${t('calib_ready_btn')}</button>
      </div>
      <button class="btn-calib-tap" id="btn-calib-tap">${t('calib_tap_fallback')}</button>
    </div>`;

  document.getElementById('btn-calib-ready').onclick = () => activateCalibListening(stepNum);
  document.getElementById('btn-calib-tap').onclick   = () => useCalibTapFallback(stepNum);

  // El sensor se escucha desde que entra el paso: así el usuario ve valores
  // en vivo y sabe si el acelerómetro responde antes de golpear.
  startCalibSensor(stepNum);
}

function updateCalibLivePeak(stepNum, g) {
  const el = document.getElementById('calib-live-peak');
  if (!el) return;
  const step = CALIB_STEPS[stepNum - 1];
  el.style.color = step.color;
  el.textContent = t('calib_peak_detected', { g: g.toFixed(1) });
}

// Lectura en vivo cada 100ms: "Sensor: X.XG" (magnitud total, con gravedad).
// Verde cuando la magnitud supera el umbral de disparo.
function updateCalibSensorReadout() {
  const el = document.getElementById('calib-sensor-live');
  if (!el) { clearInterval(APP.calib.liveInterval); return; }
  const mag = APP.calib.rawG || 0;
  el.textContent = t('calib_sensor_live', { g: mag.toFixed(1) });
  el.classList.toggle('calib-sensor-hot', mag > CALIB_TRIG_G);
}

function setCalibSensorStatus(ok) {
  const el = document.getElementById('calib-sensor-status');
  if (!el) return;
  el.textContent = ok ? t('calib_sensor_ok') : t('calib_sensor_off');
  el.classList.toggle('calib-sensor-ok',  ok);
  el.classList.toggle('calib-sensor-bad', !ok);
}

// Un único listener por paso: alimenta la lectura en vivo siempre y captura
// el golpe cuando el paso está en estado 'listening'.
function startCalibSensor(stepNum) {
  stopCalibListener();
  APP.calib.rawG       = 0;
  APP.calib.maxRawG    = 0;
  APP.calib.sensorSeen = false;

  APP.calib.graphInterval = trackedInterval(drawCalibGraph, 50);
  APP.calib.liveInterval  = trackedInterval(updateCalibSensorReadout, 100);

  if (typeof DeviceMotionEvent === 'undefined') { setCalibSensorStatus(false); return; }

  APP.calib.listener = (e) => {
    const acc = e.accelerationIncludingGravity;
    if (!acc) return;
    // Magnitud total, gravedad incluida: en reposo ≈1G, un golpe es 1G + impacto
    const mag = Math.sqrt((acc.x||0)**2 + (acc.y||0)**2 + (acc.z||0)**2) / 9.81;
    const now = Date.now();

    APP.calib.rawG = mag;
    if (mag > APP.calib.maxRawG) APP.calib.maxRawG = mag;
    if (!APP.calib.sensorSeen) { APP.calib.sensorSeen = true; setCalibSensorStatus(true); }

    if (APP.calib.state !== 'listening') return;

    // La gráfica muestra el impacto real, ya sin la gravedad base
    APP.calib.graphData.push(Math.max(0, mag - CALIB_GRAVITY));
    if (APP.calib.graphData.length > 80) APP.calib.graphData.shift();

    if (!APP.calib.triggerAt && mag > CALIB_TRIG_G) APP.calib.triggerAt = now;

    if (APP.calib.triggerAt) {
      const impact = mag - CALIB_GRAVITY;   // pico guardado sin gravedad
      if (impact > APP.calib.peakG) {
        APP.calib.peakG = impact;
        updateCalibLivePeak(stepNum, impact);
      }
      if (mag > CALIB_RING_G)  APP.calib.ringEnd = now;
      if (now - APP.calib.triggerAt > 2000) finishCalibStep(stepNum);
    }
  };

  window.addEventListener('devicemotion', APP.calib.listener, { passive: true });

  // Si en 1.5s no ha llegado ni un evento, el sensor no está disponible
  APP.calib.sensorCheck = trackedTimeout(() => {
    if (!APP.calib.sensorSeen) setCalibSensorStatus(false);
  }, 1500);
}

function activateCalibListening(stepNum) {
  const btn  = document.getElementById('btn-calib-ready');
  const stat = document.getElementById('calib-status');
  if (btn)  { btn.disabled = true; btn.textContent = t('calib_listening'); }
  if (stat) { stat.textContent = t('calib_detecting'); stat.classList.remove('calib-error'); stat.style.color = ''; }

  const liveEl = document.getElementById('calib-live-peak');
  if (liveEl) liveEl.textContent = '';

  APP.calib.peakG     = 0;
  APP.calib.triggerAt = null;
  APP.calib.ringEnd   = null;
  APP.calib.graphData = [];
  APP.calib.maxRawG   = 0;
  APP.calib.state     = 'listening';

  clearTimeout(APP.calib.captureTimer);
  APP.calib.captureTimer = trackedTimeout(() => {
    if (APP.calib.state === 'listening') finishCalibStep(stepNum);
  }, 12000);
}

// Fallback SOLO para calibrar: si el acelerómetro del dispositivo no responde,
// el usuario toca la pantalla para registrar el golpe de este paso.
// No sustituye la detección durante el entrenamiento.
function useCalibTapFallback(stepNum) {
  const step = CALIB_STEPS[stepNum - 1];
  // Si el sensor llegó a moverse, se usa su pico real; si no, un valor típico
  const measured = APP.calib.maxRawG - CALIB_GRAVITY;
  const peakG    = measured > 0.2 ? measured : step.tapG;

  APP.calib.state     = 'captured';
  APP.calib.peakG     = peakG;
  APP.calib.triggerAt = Date.now();
  APP.calib.ringEnd   = null;
  stopCalibListener();

  const stat = document.getElementById('calib-status');
  if (stat) {
    stat.classList.remove('calib-error');
    stat.style.color = step.color;
    stat.textContent = t('calib_tap_used', { g: peakG.toFixed(1) });
  }
  renderCalibStepConfirm(stepNum, peakG, 150);
}

function stopCalibListener() {
  if (APP.calib.listener) {
    window.removeEventListener('devicemotion', APP.calib.listener);
    APP.calib.listener = null;
  }
  clearTimeout(APP.calib.captureTimer);
  clearTimeout(APP.calib.sensorCheck);
  clearInterval(APP.calib.graphInterval);
  clearInterval(APP.calib.liveInterval);
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

  const step = CALIB_STEPS[stepNum - 1];
  const stat = document.getElementById('calib-status');
  if (stat) {
    stat.classList.remove('calib-error');
    stat.style.color = step.color;
    stat.textContent = `✓ ${t('calib_peak_detected', { g: peakG.toFixed(1) })}`;
  }

  renderCalibStepConfirm(stepNum, peakG, ringMs);
}

// Botones de confirmación del paso. No se escribe en APP.calib.data hasta que
// el usuario decide continuar — así "Repetir este golpe" descarta la medición
// sin tocar los pasos previos.
function renderCalibStepConfirm(stepNum, peakG, ringMs) {
  const tapBtn = document.getElementById('btn-calib-tap');
  if (tapBtn) tapBtn.style.display = 'none';

  const actions = document.getElementById('calib-step-actions');
  if (!actions) return;
  actions.innerHTML = `
    <button class="btn-secondary" id="btn-calib-repeat">${t('calib_repeat_punch')}</button>
    <button class="btn-primary btn-calib-ready" id="btn-calib-continue">${stepNum < 3 ? t('calib_next_step') : t('calib_see_results')}</button>`;
  document.getElementById('btn-calib-repeat').onclick = () => renderCalibStep(stepNum);
  document.getElementById('btn-calib-continue').onclick = () => {
    APP.calib.data[stepNum - 1] = { peakG, ringMs };
    stepNum < 3 ? renderCalibStep(stepNum + 1) : showCalibResults();
  };
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
  const y12  = cssH - (0.3 / maxG) * cssH;
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

  // La mitad del golpe suave, con 0.01G como único suelo (sin mínimos altos:
  // hay sacos/muñecos que apenas transmiten vibración al móvil).
  const threshold = Math.max(0.01, Math.round(soft * 0.5 * 100) / 100);
  const debounce  = 150;

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
    stage.style.background  = 'rgba(10,10,10,0.92)';   // deja ver las partículas
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
  checkReactionRecord(reactionMs);
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
