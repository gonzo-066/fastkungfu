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
    ios_denied:           '✗ Permiso denegado — se usará botón manual',
    round_indicator:      'ROUND {n}/{total}',
    fallback_punch:       '👊 GOLPEAR',
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
    settings_title:       'Ajustes',
    language_label:       'Idioma',
    save_settings:        'GUARDAR',
    alert_enter_name:     'Ingresa tu nombre',
    alert_weight:         'Ingresa un peso válido (30-200 kg)',
    alert_age:            'Ingresa una edad válida (10-100)',
    alert_weight_s:       'Peso inválido',
    alert_age_s:          'Edad inválida',
    confirm_stop:         '¿Abandonar la sesión?',
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
    calib_again:          'RECALIBRAR',
    calib_notice:         'Calibra tu dispositivo para mayor precisión',
    calib_notice_btn:     'CALIBRAR',
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
    voice_ok:             '¡Bien!',
    voice_master:         '¡Maestro!',
    voice_fail:           '¡Sigue intentando!',
    voice_session_done:   '¡Sesión completada!',
    mode_colors:          '🎨 Modo Colores',
    color_stats_title:    'Estadísticas por color',
    help_title:           'AYUDA',
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
    ios_denied:           '✗ Permission denied — manual button will be used',
    round_indicator:      'ROUND {n}/{total}',
    fallback_punch:       '👊 PUNCH',
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
    calib_again:          'RECALIBRATE',
    calib_notice:         'Calibrate your device for better precision',
    calib_notice_btn:     'CALIBRATE',
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
    voice_ok:             'Good!',
    voice_master:         'Master!',
    voice_fail:           'Keep trying!',
    voice_session_done:   'Session complete!',
    mode_colors:          '🎨 Color Mode',
    color_stats_title:    'Stats by color',
    help_title:           'HELP',
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
    ios_denied:           '✗ Permissão negada — botão manual será usado',
    round_indicator:      'ROUND {n}/{total}',
    fallback_punch:       '👊 SOCAR',
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
    calib_again:          'RECALIBRAR',
    calib_notice:         'Calibre seu dispositivo para maior precisão',
    calib_notice_btn:     'CALIBRAR',
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
    voice_ok:             'Muito bem!',
    voice_master:         'Mestre!',
    voice_fail:           'Continue tentando!',
    voice_session_done:   'Sessão completa!',
    mode_colors:          '🎨 Modo Cores',
    color_stats_title:    'Estatísticas por cor',
    help_title:           'AJUDA',
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
    ios_denied:           '✗ Berechtigung verweigert — manueller Button wird verwendet',
    round_indicator:      'RUNDE {n}/{total}',
    fallback_punch:       '👊 SCHLAGEN',
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
    calib_again:          'NEU KALIBRIEREN',
    calib_notice:         'Kalibriere dein Gerät für bessere Präzision',
    calib_notice_btn:     'KALIBRIEREN',
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
    voice_ok:             'Gut!',
    voice_master:         'Meister!',
    voice_fail:           'Weiter üben!',
    voice_session_done:   'Training abgeschlossen!',
    mode_colors:          '🎨 Farbmodus',
    color_stats_title:    'Statistik nach Farbe',
    help_title:           'HILFE',
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
    lastPunchAt: 0,
    COOLDOWN: 150,            // ms debounce — training mode & signal phase
    COMBO_HIT_COOLDOWN: 80,   // ms debounce — within active combo (rapid succession)
    THRESHOLD: 1.2,           // G-force minimum
    _logAt: 0,
  },
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
  if (!APP.soundEnabled) return;
  try {
    const ctx  = getAudioCtx();
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
  if (!APP.soundEnabled) return;
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
  if (typeof DeviceMotionEvent === 'undefined') return;
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
}

function onDeviceMotion(e) {
  const acc = e.accelerationIncludingGravity;
  if (!acc) return;
  const raw    = Math.sqrt(acc.x * acc.x + acc.y * acc.y + acc.z * acc.z);
  const gForce = raw / 9.81;
  const now    = Date.now();

  // Throttled console log (~10 Hz) for calibration
  if (now - APP.accel._logAt > 100) {
    APP.accel._logAt = now;
    console.log(`[FKF] accel  g=${gForce.toFixed(2)}G  state=${APP.mode}/${APP.combo.state}  thr=${APP.accel.THRESHOLD}G`);
  }

  // Use shorter debounce within active combo so rapid successive hits all register
  const cooldown = (APP.mode === 'combo' && APP.comboConfig.submode === 'combo' && APP.combo.state === 'active')
    ? APP.accel.COMBO_HIT_COOLDOWN
    : APP.accel.COOLDOWN;

  if (gForce > APP.accel.THRESHOLD && (now - APP.accel.lastPunchAt) > cooldown) {
    APP.accel.lastPunchAt = now;
    console.log(`[FKF] PUNCH  g=${gForce.toFixed(2)}G  cooldown=${cooldown}ms  mode=${APP.mode}  combo=${APP.combo.state}  hits=${APP.combo.currentHits}/${APP.combo.targetHits}`);
    registerPunch(gForce, raw);
  }
}

function registerPunch(gForce, speed) {
  const punch = { g: gForce, speed: speed || gForce * 9.81, time: Date.now() };
  vibrate([15]);
  playPunchThud();
  if (APP.mode === 'training')                              handleTrainingPunch(punch);
  else if (APP.comboConfig.submode === 'simple')            handleReactionPunch(punch);
  else if (APP.comboConfig.submode === 'colors')            handleColorsPunch(punch);
  else                                                      handleComboPunch(punch);
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
  setTimeout(() => el.classList.remove('flash'), 280);
}

// ═══════════════════════════════════════════════════
// PANTALLA: IDIOMA
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
function initProfileScreen(fromNav) {
  const topbar = document.getElementById('profile-topbar');
  const logoWrap = document.querySelector('#profile-form-wrap .logo-img') ||
                   document.querySelector('#profile-form-wrap .logo-fallback');
  topbar.classList.toggle('hidden', !fromNav);
  if (fromNav) {
    document.getElementById('btn-profile-back').onclick = () => {
      showScreen('screen-menu');
      initMenuScreen();
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
    initMenuScreen();
  };
}

// ═══════════════════════════════════════════════════
// PANTALLA: MENÚ
// ═══════════════════════════════════════════════════
function initMenuScreen() {
  document.getElementById('btn-training-mode').onclick = () => {
    APP.mode = 'training';
    showScreen('screen-config');
    initConfigScreen();
  };
  document.getElementById('btn-combo-mode').onclick = () => {
    APP.mode = 'combo';
    showScreen('screen-config');
    initConfigScreen();
  };
  document.getElementById('btn-settings').onclick = openSettingsModal;
  document.getElementById('btn-calibrate-menu').onclick = () => showCalibrationScreen('screen-menu');
  document.getElementById('btn-help').onclick = () => { showScreen('screen-help'); initHelpScreen(); };
  document.getElementById('nav-profile').onclick = () => {
    showScreen('screen-profile');
    initProfileScreen(true);
  };
  document.getElementById('nav-train').onclick = () => {
    APP.mode = 'training';
    showScreen('screen-config');
    initConfigScreen();
  };
  document.getElementById('nav-history-btn').onclick = () => {
    showScreen('screen-history');
    initHistoryScreen();
  };
}

// ═══════════════════════════════════════════════════
// PANTALLA: CONFIGURACIÓN
// ═══════════════════════════════════════════════════
function initConfigScreen() {
  const isCombo        = APP.mode === 'combo';
  const isComboSubmode = isCombo && APP.comboConfig.submode === 'combo';
  const isColorsSubmode = isCombo && APP.comboConfig.submode === 'colors';

  document.getElementById('config-mode-title').textContent =
    isCombo ? '⚡ ' + t('combo_mode') : '🥊 ' + t('training_mode');

  document.getElementById('btn-start-session').textContent = t('config_start');

  document.getElementById('reaction-submode-block').classList.toggle('hidden', !isCombo);
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

  rInput.oninput    = () => { APP.config.rounds        = parseInt(rInput.value);    updateConfigSummary(); };
  rdInput.oninput   = () => { APP.config.roundDuration = parseInt(rdInput.value);   updateConfigSummary(); };
  restInput.oninput = () => { APP.config.restDuration  = parseInt(restInput.value); updateConfigSummary(); };

  document.getElementById('btn-config-back').onclick = () => showScreen('screen-menu');

  if (isCombo) initReactionSubmodeBlock();
  if (isComboSubmode) initComboConfigExtras();

  // iOS accelerometer
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

function updateConfigSummary() {
  const r   = APP.config.rounds;
  const rd  = APP.config.roundDuration;
  const rst = APP.config.restDuration;
  const total = Math.round(r * rd + ((r - 1) * rst / 60));

  document.getElementById('val-rounds').textContent         = t('val_rounds',        { n: r });
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
  APP.combo.results = [];
  APP.sessionSaved = false;
  acquireWakeLock();
  if (!APP.accel.available) setupAccelerometer();
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

  if (APP.mode === 'training') {
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
  APP.round.timerInterval = setInterval(() => {
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
  clearInterval(APP.round.timerInterval);
  if (APP.mode === 'combo') {
    if (APP.comboConfig.submode === 'simple')       stopReactionCycle();
    else if (APP.comboConfig.submode === 'colors')  stopColorsCycle();
    else                                            stopComboCycle();
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
  document.getElementById('btn-fallback-punch').onclick = () => {
    const g = 2.0 + Math.random() * 3;
    registerPunch(g, g * 9.81);
  };
  document.getElementById('btn-training-stop').onclick = () => {
    if (confirm(t('confirm_stop'))) {
      clearInterval(APP.round.timerInterval);
      releaseWakeLock();
      showScreen('screen-menu');
    }
  };
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

function handleTrainingPunch(punch) {
  APP.round.punches.push(punch);
  const countEl = document.getElementById('training-punch-count');
  countEl.textContent = APP.round.punches.length;
  flashEl(countEl);
  document.getElementById('training-speed').textContent = punch.speed.toFixed(1);
  document.getElementById('training-power').textContent = punch.g.toFixed(1) + 'G';
  const bestG = Math.max(...APP.round.punches.map(p => p.g));
  document.getElementById('training-best').textContent  = bestG.toFixed(1) + 'G';
  drawTrainingChart();
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
  ctx.fillStyle = '#333333';
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

  // Fallback buttons
  const fallbackHandler = () => {
    const g = 2.0 + Math.random() * 3;
    registerPunch(g, g * 9.81);
  };
  document.getElementById('btn-fallback-wait').onclick   = fallbackHandler;
  document.getElementById('btn-fallback-signal').onclick = fallbackHandler;
  document.getElementById('btn-fallback-active').onclick = fallbackHandler;

  document.getElementById('btn-mute-combo').onclick = toggleSound;
  updateMuteButtons();
  document.getElementById('btn-combo-stop').onclick = () => {
    if (confirm(t('confirm_stop'))) {
      stopComboCycle();
      clearInterval(APP.round.timerInterval);
      releaseWakeLock();
      showScreen('screen-menu');
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

  document.getElementById('wait-hits-text').textContent =
    target + (APP.lang === 'de' ? ' SCHLÄGE' : APP.lang === 'en' ? ' HITS' : APP.lang === 'pt' ? ' GOLPES' : ' GOLPES');
  document.getElementById('wait-max-time').textContent =
    APP.comboConfig.maxDuration.toFixed(1) + 's MÁXIMO';

  showComboPanel('wait');

  const pauseMs = APP.comboConfig.pauseBetween * 1000;
  let remaining = APP.comboConfig.pauseBetween;

  clearInterval(APP.combo.waitTickInterval);
  APP.combo.waitTickInterval = setInterval(() => {
    remaining -= 0.1;
    document.getElementById('wait-countdown-text').textContent =
      'Siguiente señal en ' + Math.max(0, remaining).toFixed(1) + 's';
    if (remaining <= 0) clearInterval(APP.combo.waitTickInterval);
  }, 100);

  document.getElementById('wait-countdown-text').textContent =
    'Siguiente señal en ' + remaining.toFixed(1) + 's';

  APP.combo.waitTimeout = setTimeout(() => {
    clearInterval(APP.combo.waitTickInterval);
    if (APP.round.secondsLeft > 0) showComboSignal();
  }, pauseMs);
}

// ─── SEÑAL: fondo rojo, texto HIT ─────────────────
function showComboSignal() {
  APP.combo.state    = 'signal';
  APP.combo.signalAt = Date.now();
  APP.combo.currentHits = 0;

  document.getElementById('signal-counter').textContent =
    '0/' + APP.combo.targetHits;
  showComboPanel('signal');
  vibrate([30]);
  playBeep(880, 0.12);

  // If no first hit within 3s → fail (no reaction)
  APP.combo.signalTimeout = setTimeout(() => {
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
  APP.combo.tickInterval = setInterval(() => {
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

  APP.combo.expireTimeout = setTimeout(() => {
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
    speakVoice(t('voice_ok'));
  } else {
    vibrate([50, 30, 50]);
    playComboFail();
    speakVoice(t('voice_fail'));
  }

  if (APP.round.secondsLeft > 0) {
    const pauseMs = APP.comboConfig.pauseBetween * 1000;
    document.getElementById('result-next-label').textContent =
      'Siguiente señal en ' + APP.comboConfig.pauseBetween.toFixed(1) + 's';

    const progressEl = document.getElementById('result-progress-bar');
    progressEl.style.width = '0%';
    const startAt = Date.now();

    clearInterval(APP.combo.progressInterval);
    APP.combo.progressInterval = setInterval(() => {
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
  document.getElementById('reaction-round-indicator').textContent =
    t('round_indicator', { n: roundNum, total: APP.config.rounds });
  updateReactionTimer();
  resetReactionMetrics();

  document.getElementById('btn-mute-reaction').onclick = toggleSound;
  updateMuteButtons();
  document.getElementById('btn-fallback-reaction').onclick = () => {
    const g = 2.0 + Math.random() * 3;
    registerPunch(g, g * 9.81);
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
  const el = document.getElementById('reaction-session-timer');
  el.textContent = fmtTime(APP.round.secondsLeft);
}

function resetReactionMetrics() {
  document.getElementById('reaction-last').textContent   = '—';
  document.getElementById('reaction-hits').textContent   = '0';
  document.getElementById('reaction-misses').textContent = '0';
  document.getElementById('reaction-best').textContent   = '—';
}

function setReactionStimulus(state, icon, text, sub) {
  const el = document.getElementById('reaction-stimulus');
  el.className = 'reaction-stimulus ' + state;
  document.getElementById('stimulus-icon').textContent = icon;
  document.getElementById('stimulus-text').textContent = text;
  document.getElementById('stimulus-sub').textContent  = sub || '';
}

function startReactionWait() {
  if (APP.round.secondsLeft <= 0) return;
  APP.reaction.state = 'wait';
  setReactionStimulus('state-wait', '⏳', t('stimulus_wait'), '');
  const delay = 1000 + Math.random() * 2000;
  APP.reaction.waitTimeout = setTimeout(() => {
    if (APP.round.secondsLeft > 0) showReactionStimulus();
  }, delay);
}

function showReactionStimulus() {
  APP.reaction.state     = 'hit';
  APP.reaction.stimulusAt = Date.now();
  setReactionStimulus('state-hit', '⚡', t('stimulus_hit'), '');
  vibrate([30]);
  playBeep(880, 0.12);
  APP.reaction.missTimeout = setTimeout(() => {
    if (APP.reaction.state === 'hit') missReaction();
  }, 1000);
}

function missReaction() {
  clearTimeout(APP.reaction.missTimeout);
  APP.reaction.state = 'miss';
  APP.round.misses++;
  setReactionStimulus('state-miss', '✗', t('stimulus_miss'), '');
  vibrate([80]);
  speakVoice(t('voice_fail'));
  updateReactionMetricsUI();
  if (APP.round.secondsLeft > 0) {
    setTimeout(() => startReactionWait(), 1500);
  }
}

function handleReactionPunch(punch) {
  if (APP.reaction.state !== 'hit') return;
  clearTimeout(APP.reaction.missTimeout);
  const reactionMs = Date.now() - APP.reaction.stimulusAt;
  APP.reaction.state = 'result';
  APP.round.hits++;
  APP.round.punches.push(punch);
  APP.round.reactionTimes.push(reactionMs);
  setReactionStimulus('state-result-ok', '✓', reactionMs + 'ms', reactionRank(reactionMs));
  vibrate([20, 30, 20]);
  if (reactionMs < 200) speakVoice(t('voice_master'));
  else speakVoice(t('voice_ok'));
  updateReactionMetricsUI();
  if (APP.round.secondsLeft > 0) {
    setTimeout(() => startReactionWait(), 1500);
  }
}

function updateReactionMetricsUI() {
  const rTimes  = APP.round.reactionTimes;
  const last    = rTimes.length ? rTimes[rTimes.length - 1] : null;
  const best    = rTimes.length ? Math.min(...rTimes) : null;
  document.getElementById('reaction-last').textContent   = last !== null ? last + 'ms' : '—';
  document.getElementById('reaction-hits').textContent   = APP.round.hits;
  document.getElementById('reaction-misses').textContent = APP.round.misses;
  document.getElementById('reaction-best').textContent   = best !== null ? best + 'ms' : '—';
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
  APP.rest.interval = setInterval(() => {
    seconds--;
    const el = document.getElementById('rest-countdown');
    el.textContent = seconds;
    el.classList.toggle('ending', seconds <= 5);
    if (seconds <= 3 && seconds > 0) { vibrate([50]); playBeep(600, 0.05); }
    if (seconds > 0 && seconds % 10 === 0) playRestBeep();
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
  showScreen('screen-summary');

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
  speakVoice(t('voice_session_done'));

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
function initHistoryScreen() {
  document.getElementById('btn-history-back').onclick = () => showScreen('screen-menu');
  const sessions = getSessions();

  if (!sessions.length) {
    ['hist-best-reaction', 'hist-best-power', 'hist-most-punches'].forEach(id => {
      document.getElementById(id).textContent = '—';
    });
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
    saveProfile({ name, weight, age, sex });
    closeSettingsModal();
  };
}

// ═══════════════════════════════════════════════════
// INICIALIZACIÓN
// ═══════════════════════════════════════════════════
function init() {
  loadSoundPref();
  loadCalibration();
  loadColorConfig();
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

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  if (!isIOS && typeof DeviceMotionEvent !== 'undefined') {
    activateAccelerometer();
  }
}

// ═══════════════════════════════════════════════════
// AYUDA — CONTENIDO POR IDIOMA
// ═══════════════════════════════════════════════════
const HELP_SECTIONS = {
  es: [
    {
      icon: '🥊', title: '¿Qué es FastKungFu?',
      html: `<p>FastKungFu convierte tu móvil en un medidor de golpes para entrenamiento de <strong>boxeo, kickboxing, artes marciales</strong> o saco de arena.</p>
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
<p class="help-faq-a">Sí. FastKungFu es una <strong>PWA</strong> (Progressive Web App) que funciona completamente offline una vez cargada.</p>
<p class="help-faq-q">¿Puedo usarla en iOS?</p>
<p class="help-faq-a">Sí. La primera vez debes dar permiso al <strong>sensor de movimiento</strong> en la pantalla de configuración.</p>
<p class="help-faq-q">¿Se guardan mis datos en la nube?</p>
<p class="help-faq-a">No. Todo se guarda <strong>solo en tu móvil</strong>. Nunca se envía nada a ningún servidor.</p>`
    },
  ],
  en: [
    {
      icon: '🥊', title: 'What is FastKungFu?',
      html: `<p>FastKungFu turns your phone into a punch tracker for <strong>boxing, kickboxing, martial arts</strong> or bag training.</p>
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
<p class="help-faq-a">Yes. FastKungFu is a <strong>PWA</strong> (Progressive Web App) that works fully offline once loaded.</p>
<p class="help-faq-q">Can I use it on iOS?</p>
<p class="help-faq-a">Yes. The first time you must grant <strong>motion sensor permission</strong> in the config screen.</p>
<p class="help-faq-q">Is my data saved to the cloud?</p>
<p class="help-faq-a">No. Everything is stored <strong>only on your phone</strong>. Nothing is ever sent to any server.</p>`
    },
  ],
  pt: [
    {
      icon: '🥊', title: 'O que é FastKungFu?',
      html: `<p>FastKungFu transforma seu celular em um medidor de golpes para treino de <strong>boxe, kickboxing, artes marciais</strong> ou saco de pancadas.</p>
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
<p class="help-faq-a">Sim. FastKungFu é um <strong>PWA</strong> que funciona completamente offline após o primeiro carregamento.</p>
<p class="help-faq-q">Posso usar no iOS?</p>
<p class="help-faq-a">Sim. Na primeira vez, conceda <strong>permissão ao sensor de movimento</strong> na tela de configuração.</p>
<p class="help-faq-q">Meus dados ficam na nuvem?</p>
<p class="help-faq-a">Não. Tudo é guardado <strong>apenas no seu celular</strong>. Nada é enviado a nenhum servidor.</p>`
    },
  ],
  de: [
    {
      icon: '🥊', title: 'Was ist FastKungFu?',
      html: `<p>FastKungFu verwandelt dein Smartphone in einen Schlag-Tracker für <strong>Boxen, Kickboxen, Kampfsport</strong> oder Sandsack-Training.</p>
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
<p class="help-faq-a">Ja. FastKungFu ist eine <strong>PWA</strong>, die nach dem ersten Laden vollständig offline funktioniert.</p>
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

function playRestBeep() {
  if (!APP.soundEnabled) return;
  playBeep(440, 0.07);
}

function speakVoice(text) {
  if (!APP.soundEnabled) return;
  if (!window.speechSynthesis) return;
  try {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = { es: 'es-ES', en: 'en-GB', pt: 'pt-BR', de: 'de-DE' }[APP.lang] || 'es-ES';
    utter.rate  = 1.1;
    utter.volume = 0.85;
    window.speechSynthesis.speak(utter);
  } catch(e) {}
}

// ═══════════════════════════════════════════════════
// CALIBRACIÓN DE DISPOSITIVO
// ═══════════════════════════════════════════════════
const CALIB_STEPS = [
  { key: 'suave',  label: { es: 'GOLPE SUAVE',  en: 'SOFT PUNCH',   pt: 'GOLPE LEVE',   de: 'LEICHTER SCHLAG' }, bg: '#001533' },
  { key: 'medio',  label: { es: 'GOLPE MEDIO',  en: 'MEDIUM PUNCH', pt: 'GOLPE MÉDIO',  de: 'MITTLERER SCHLAG' }, bg: '#1a1100' },
  { key: 'fuerte', label: { es: 'GOLPE FUERTE', en: 'HARD PUNCH',   pt: 'GOLPE FORTE',  de: 'HARTER SCHLAG' }, bg: '#001500' },
];

function loadCalibration() {
  const raw = localStorage.getItem('fkf_calibration');
  if (!raw) return false;
  try {
    const c = JSON.parse(raw);
    APP.accel.THRESHOLD = c.threshold;
    APP.accel.COOLDOWN  = c.debounce;
    APP.accel.COMBO_HIT_COOLDOWN = Math.max(55, c.debounce - 45);
    return true;
  } catch(e) { return false; }
}

function saveCalibration(threshold, debounce) {
  localStorage.setItem('fkf_calibration', JSON.stringify({ threshold, debounce, at: Date.now() }));
  APP.accel.THRESHOLD = threshold;
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
      <div class="calib-step-status" id="calib-status">${t('calib_press_ready')}</div>
      <button class="btn-primary btn-calib-ready" id="btn-calib-ready">${t('calib_ready_btn')}</button>
    </div>`;

  document.getElementById('btn-calib-ready').onclick = () => activateCalibListening(stepNum);
}

function activateCalibListening(stepNum) {
  const btn  = document.getElementById('btn-calib-ready');
  const stat = document.getElementById('calib-status');
  if (btn)  { btn.disabled = true; btn.textContent = t('calib_listening'); }
  if (stat) stat.textContent = t('calib_detecting');

  APP.calib.state     = 'listening';
  APP.calib.peakG     = 0;
  APP.calib.triggerAt = null;
  APP.calib.ringEnd   = null;
  APP.calib.graphData = [];
  stopCalibListener();

  clearInterval(APP.calib.graphInterval);
  APP.calib.graphInterval = setInterval(drawCalibGraph, 50);

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
      if (g > APP.calib.peakG) APP.calib.peakG = g;
      if (g > RING_G)          APP.calib.ringEnd = now;
      if (now - APP.calib.triggerAt > 2000) finishCalibStep(stepNum);
    }
  };

  window.addEventListener('devicemotion', APP.calib.listener, { passive: true });

  APP.calib.captureTimer = setTimeout(() => {
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

function finishCalibStep(stepNum) {
  if (APP.calib.state !== 'listening') return;
  APP.calib.state = 'captured';
  stopCalibListener();

  const peakG  = APP.calib.peakG  || 1.8;
  const ringMs = (APP.calib.triggerAt && APP.calib.ringEnd)
    ? Math.max(60, APP.calib.ringEnd - APP.calib.triggerAt)
    : 120;
  APP.calib.data.push({ peakG, ringMs });

  const stat = document.getElementById('calib-status');
  if (stat) stat.textContent = `✓ ${peakG.toFixed(2)}G`;

  const btn = document.getElementById('btn-calib-ready');
  if (btn) {
    btn.disabled = false;
    btn.textContent = stepNum < 3 ? t('calib_next_step') : t('calib_see_results');
    btn.onclick = () => stepNum < 3 ? renderCalibStep(stepNum + 1) : showCalibResults();
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
  if (!data.length) return;

  const peakSuave = data[0]?.peakG || 1.8;
  const avgRing   = data.reduce((a, d) => a + d.ringMs, 0) / data.length;
  const threshold = Math.round(peakSuave * 0.6 * 100) / 100;
  const debounce  = Math.round(avgRing + 50);

  const content = document.getElementById('calib-content');
  content.style.background = '';
  const stepsHtml = data.map((d, i) => {
    const lbl = CALIB_STEPS[i]?.label[APP.lang] || CALIB_STEPS[i]?.label.es || '';
    return `<div class="calib-step-dot">${lbl}: ${d.peakG.toFixed(2)}G</div>`;
  }).join('');

  content.innerHTML = `
    <div class="calib-results">
      <div class="calib-results-icon">✓</div>
      <h3 class="calib-title">${t('calib_results_title')}</h3>
      <div class="calib-result-values">
        <div class="calib-result-row">
          <span class="calib-result-label">${t('calib_threshold')}</span>
          <span class="calib-result-value">${threshold.toFixed(2)}G</span>
        </div>
        <div class="calib-result-row">
          <span class="calib-result-label">${t('calib_debounce')}</span>
          <span class="calib-result-value">${debounce}ms</span>
        </div>
      </div>
      <div class="calib-step-data">${stepsHtml}</div>
      <button class="btn-primary btn-calib-ready" id="btn-calib-save">${t('calib_save')}</button>
      <button class="btn-secondary" id="btn-calib-again">${t('calib_again')}</button>
    </div>`;

  document.getElementById('btn-calib-save').onclick = () => {
    saveCalibration(threshold, debounce);
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

  document.getElementById('btn-fallback-colors').onclick = () => {
    const g = 2.0 + Math.random() * 3;
    registerPunch(g, g * 9.81);
  };
  document.getElementById('btn-colors-stop').onclick = () => {
    if (confirm(t('confirm_stop'))) {
      stopColorsCycle();
      clearInterval(APP.round.timerInterval);
      releaseWakeLock();
      showScreen('screen-menu');
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
  setColorsStage(null);
  const pauseMs = APP.comboConfig.pauseBetween * 1000;
  APP.colorMode.waitTimeout = setTimeout(() => {
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
  APP.colorMode.stimulusAt   = Date.now();

  setColorsStage(colorId);
  vibrate([25]);
  playBeep(660, 0.06);

  const exposureMs = 1000 + Math.random() * 2000;
  APP.colorMode.missTimeout = setTimeout(() => {
    if (APP.colorMode.state === 'active') missColors();
  }, exposureMs);
}

function missColors() {
  clearTimeout(APP.colorMode.missTimeout);
  APP.colorMode.state = 'miss';
  APP.round.misses++;

  const stage  = document.getElementById('colors-stage');
  const textEl = document.getElementById('colors-center-text');
  if (stage)  stage.style.background = '#1a0000';
  if (textEl) { textEl.textContent = '✗'; textEl.style.color = '#FF5555'; }

  vibrate([80]);
  speakVoice(t('voice_fail'));

  setTimeout(() => {
    if (APP.round.secondsLeft > 0) startColorsWait();
  }, 800);
}

function handleColorsPunch(punch) {
  if (APP.colorMode.state !== 'active') return;
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
  if (reactionMs < 200) speakVoice(t('voice_master'));
  else speakVoice(t('voice_ok'));

  setTimeout(() => {
    if (APP.round.secondsLeft > 0) startColorsWait();
  }, 900);
}

function stopColorsCycle() {
  clearTimeout(APP.colorMode.waitTimeout);
  clearTimeout(APP.colorMode.missTimeout);
  APP.colorMode.state = 'idle';
}

document.addEventListener('DOMContentLoaded', init);
