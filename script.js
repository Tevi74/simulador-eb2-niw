/**
 * Simulador de Elegibilidade EB-2 NIW
 * Martínez & Santos Advogados Associados
 *
 * Fluxo em etapas (estilo Typeform), pontuação 0–100,
 * velocímetro animado e envio via WhatsApp.
 */

(function () {
  "use strict";

  /* ─── Configuração do escritório ─── */
  const CONFIG = {
    /** Número WhatsApp do escritório (DDI + DDD + número, só dígitos) */
  whatsappNumber: "5511919552446",
    totalSteps: 10,
  };

  /* ─── Rótulos legíveis para o resumo ─── */
  const LABELS = {
    formacao: {
      doutorado: "Doutorado / Pós-doutorado",
      mestrado: "Mestrado (Master's)",
      graduacao_5: "Graduação + 5+ anos de experiência",
      graduacao: "Apenas graduação",
      outro: "Outro / em andamento",
    },
    experiencia: {
      "15+": "15 anos ou mais",
      "10-14": "10 a 14 anos",
      "5-9": "5 a 9 anos",
      "2-4": "2 a 4 anos",
      "0-1": "Menos de 2 anos",
    },
    area: {
      stem: "STEM",
      saude: "Saúde",
      negocios: "Negócios / Finanças",
      direito: "Direito / Políticas Públicas",
      artes: "Artes / Educação / Outra",
    },
    reconhecimentos: {
      excelente: "Excelente — publicações, prêmios e certificações de elite",
      bom: "Bom — publicações e reconhecimentos setoriais",
      moderado: "Parcial — em desenvolvimento",
      pouco: "Poucos ou nenhum documentado",
    },
    cartas: {
      sim_prontas: "Cartas prontas de experts",
      sim_possivel: "Possível obter de líderes do setor",
      incerto: "Ainda não identificados",
      nao: "Sem referências fortes no momento",
    },
    plano_eua: {
      detalhado: "Plano detalhado (3–5 anos)",
      estruturado: "Estruturado — refinando proposta",
      inicial: "Ideia inicial sem plano formal",
      indefinido: "Ainda indefinido",
    },
    impacto: {
      alto: "Alto — impacto mensurável em escala nacional",
      medio: "Médio — contribuição relevante ao setor",
      emergente: "Emergente — argumentação em construção",
      baixo: "Impacto nacional ainda não demonstrável",
    },
    ingles: {
      fluente: "Fluente (TOEFL/IELTS ou uso profissional)",
      avancado: "Avançado",
      intermediario: "Intermediário",
      basico: "Básico ou iniciante",
    },
    documentos: {
      diplomas: "Diplomas e históricos escolares",
      cv: "CV / Lattes atualizado",
      publicacoes: "Publicações, patentes ou projetos",
      cartas: "Cartas de recomendação",
      plano: "Plano de negócios / proposta nos EUA",
      nenhum: "Documentação ainda não organizada",
    },
  };

  /* ─── Pesos de pontuação por resposta (máx. soma normalizada ≈ 100) ─── */
  const SCORES = {
    formacao: { doutorado: 14, mestrado: 12, graduacao_5: 10, graduacao: 5, outro: 3 },
    experiencia: { "15+": 12, "10-14": 10, "5-9": 8, "2-4": 4, "0-1": 1 },
    area: { stem: 10, saude: 10, negocios: 8, direito: 7, artes: 6 },
    reconhecimentos: { excelente: 14, bom: 10, moderado: 6, pouco: 2 },
    cartas: { sim_prontas: 12, sim_possivel: 8, incerto: 4, nao: 1 },
    plano_eua: { detalhado: 12, estruturado: 9, inicial: 5, indefinido: 2 },
    impacto: { alto: 14, medio: 10, emergente: 5, baixo: 2 },
    ingles: { fluente: 8, avancado: 6, intermediario: 3, basico: 1 },
    documentos: { diplomas: 3, cv: 3, publicacoes: 4, cartas: 4, plano: 4, nenhum: 0 },
  };

  const MAX_RAW_SCORE = 100;

  /* ─── Níveis de elegibilidade ─── */
  const TIERS = [
    {
      min: 70,
      key: "alta",
      className: "result__badge--alta",
      icon: "★",
      title: "Alta elegibilidade inicial",
      desc:
        "Seu perfil apresenta elementos sólidos para uma petição EB-2 NIW. Recomendamos agendar consulta para estratégia documental e alinhamento ao framework Dhanasar.",
    },
    {
      min: 45,
      key: "media",
      className: "result__badge--media",
      icon: "◆",
      title: "Elegibilidade intermediária",
      desc:
        "Há fundamento promissor, mas pontos críticos exigem fortalecimento (documentação, impacto nacional ou plano nos EUA). Uma preparação estratégica pode elevar significativamente o caso.",
    },
    {
      min: 0,
      key: "baixa",
      className: "result__badge--baixa",
      icon: "○",
      title: "Necessita preparação estratégica",
      desc:
        "O perfil atual demanda desenvolvimento estruturado antes de uma petição NIW robusta. O escritório pode orientar um roadmap de curto e médio prazo.",
    },
  ];

  /* ─── Referências DOM ─── */
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const screenWelcome = $("#screenWelcome");
  const screenSimulator = $("#screenSimulator");
  const screenResult = $("#screenResult");
  const progressWrapper = $("#progressWrapper");
  const progressFill = $("#progressFill");
  const progressLabel = $("#progressLabel");
  const form = $("#simulatorForm");
  const steps = $$(".step");
  const btnStart = $("#btnStart");
  const btnPrev = $("#btnPrev");
  const btnNext = $("#btnNext");
  const btnSubmit = $("#btnSubmit");
  const btnRestart = $("#btnRestart");
  const btnWhatsApp = $("#btnWhatsApp");
  const scoreValue = $("#scoreValue");
  const gaugeFill = $("#gaugeFill");
  const gaugeNeedle = $("#gaugeNeedle");
  const resultBadge = $("#resultBadge");
  const badgeIcon = $("#badgeIcon");
  const resultTitle = $("#resultTitle");
  const resultDesc = $("#resultDesc");
  const resultSummary = $("#resultSummary");

  let currentStep = 1;
  let lastAnalysis = null;

  /* Arco do velocímetro (semicírculo): comprimento ≈ π × r = π × 80 */
  const GAUGE_ARC = 251.2;

  /** Inicialização */
  function init() {
    $("#year").textContent = new Date().getFullYear();
    bindEvents();
  }

  function bindEvents() {
    btnStart.addEventListener("click", startSimulator);
    btnPrev.addEventListener("click", goPrev);
    btnNext.addEventListener("click", goNext);
    form.addEventListener("submit", onSubmit);
    btnRestart.addEventListener("click", restart);

    /* Avanço automático ao selecionar radio (exceto etapa 1 e 10) */
    steps.forEach((step) => {
      const stepNum = Number(step.dataset.step);
      step.querySelectorAll('input[type="radio"]').forEach((radio) => {
        radio.addEventListener("change", () => {
          if (stepNum !== 1 && stepNum !== 10 && stepNum === currentStep) {
            setTimeout(() => {
              if (currentStep === stepNum) goNext();
            }, 380);
          }
        });
      });
    });

    /* Enter no campo de texto avança etapa */
    form.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && e.target.tagName !== "TEXTAREA") {
        e.preventDefault();
        if (currentStep < CONFIG.totalSteps) goNext();
        else if (currentStep === CONFIG.totalSteps) form.requestSubmit();
      }
    });
  }

  /* ─── Navegação de telas ─── */
  function showScreen(screenEl) {
    [screenWelcome, screenSimulator, screenResult].forEach((s) => {
      s.classList.remove("screen--active");
    });
    screenEl.classList.add("screen--active");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function startSimulator() {
    showScreen(screenSimulator);
    progressWrapper.classList.add("is-visible");
    currentStep = 1;
    updateProgress();
    updateNavButtons();
    showStep(1);
  }

  function restart() {
    form.reset();
    currentStep = 1;
    lastAnalysis = null;
    progressWrapper.classList.remove("is-visible");
    clearStepErrors();
    showScreen(screenWelcome);
    showStep(1);
    updateNavButtons();
  }

  /* ─── Etapas do simulador ─── */
  function showStep(n) {
    steps.forEach((step) => {
      step.classList.remove("step--active", "step--exit");
      if (Number(step.dataset.step) === n) {
        step.classList.add("step--active");
        const firstInput = step.querySelector("input, select, textarea");
        if (firstInput) setTimeout(() => firstInput.focus(), 300);
      }
    });
    currentStep = n;
    updateProgress();
    updateNavButtons();
    clearStepErrors();
  }

  function updateProgress() {
    const pct = Math.round((currentStep / CONFIG.totalSteps) * 100);
    progressFill.style.width = pct + "%";
    progressLabel.textContent = pct + "%";
  }

  function updateNavButtons() {
    btnPrev.disabled = currentStep === 1;
    const isLast = currentStep === CONFIG.totalSteps;
    btnNext.classList.toggle("btn--hidden", isLast);
    btnSubmit.classList.toggle("btn--hidden", !isLast);
  }

  function goPrev() {
    if (currentStep > 1) {
      const prev = currentStep - 1;
      const active = steps[currentStep - 1];
      active.classList.add("step--exit");
      setTimeout(() => showStep(prev), 200);
    }
  }

  function goNext() {
    if (!validateStep(currentStep)) return;
    if (currentStep < CONFIG.totalSteps) {
      const active = steps[currentStep - 1];
      active.classList.add("step--exit");
      setTimeout(() => showStep(currentStep + 1), 200);
    }
  }

  function onSubmit(e) {
    e.preventDefault();
    if (!validateStep(CONFIG.totalSteps)) return;
    lastAnalysis = buildAnalysis();
    showResults(lastAnalysis);
  }

  /* ─── Validação por etapa ─── */
  function validateStep(n) {
    clearStepErrors();
    const step = steps[n - 1];

    if (n === 1) {
      const fields = step.querySelectorAll("input[required]");
      let valid = true;
      fields.forEach((input) => {
        if (!input.value.trim()) {
          input.classList.add("is-invalid");
          valid = false;
        } else {
          input.classList.remove("is-invalid");
          if (input.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value)) {
            input.classList.add("is-invalid");
            valid = false;
          }
        }
      });
      if (!valid) showStepError(step, "Preencha todos os campos corretamente.");
      return valid;
    }

    if (n === 10) {
      const checked = step.querySelectorAll('input[name="documentos"]:checked');
      if (checked.length === 0) {
        showStepError(step, "Selecione ao menos uma opção de documentação.");
        return false;
      }
      return true;
    }

    const radio = step.querySelector('input[type="radio"]:checked');
    if (!radio) {
      showStepError(step, "Selecione uma opção para continuar.");
      return false;
    }
    return true;
  }

  function showStepError(step, msg) {
    let el = step.querySelector(".step-error");
    if (!el) {
      el = document.createElement("p");
      el.className = "step-error";
      step.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add("is-visible");
  }

  function clearStepErrors() {
    $$(".step-error").forEach((el) => el.classList.remove("is-visible"));
    $$(".is-invalid").forEach((el) => el.classList.remove("is-invalid"));
  }

  /* ─── Coleta de dados do formulário ─── */
  function getFormData() {
    const fd = new FormData(form);
    const docs = fd.getAll("documentos");
    return {
      nome: (fd.get("nome") || "").trim(),
      whatsapp: (fd.get("whatsapp") || "").trim(),
      email: (fd.get("email") || "").trim(),
      profissao: (fd.get("profissao") || "").trim(),
      pais: (fd.get("pais") || "").trim(),
      formacao: fd.get("formacao"),
      experiencia: fd.get("experiencia"),
      area: fd.get("area"),
      reconhecimentos: fd.get("reconhecimentos"),
      cartas: fd.get("cartas"),
      plano_eua: fd.get("plano_eua"),
      impacto: fd.get("impacto"),
      ingles: fd.get("ingles"),
      documentos: docs,
    };
  }

  /* ─── Cálculo de pontuação ─── */
  function calculateScore(data) {
    let raw = 0;

    raw += SCORES.formacao[data.formacao] || 0;
    raw += SCORES.experiencia[data.experiencia] || 0;
    raw += SCORES.area[data.area] || 0;
    raw += SCORES.reconhecimentos[data.reconhecimentos] || 0;
    raw += SCORES.cartas[data.cartas] || 0;
    raw += SCORES.plano_eua[data.plano_eua] || 0;
    raw += SCORES.impacto[data.impacto] || 0;
    raw += SCORES.ingles[data.ingles] || 0;

    /* Documentos: soma dos selecionados, cap em 18; "nenhum" não soma */
    let docScore = 0;
    data.documentos.forEach((d) => {
      if (d !== "nenhum") docScore += SCORES.documentos[d] || 0;
    });
    raw += Math.min(docScore, 18);

    /* Normaliza para 0–100 */
    const score = Math.min(100, Math.round((raw / MAX_RAW_SCORE) * 100));
    return score;
  }

  function getTier(score) {
    return TIERS.find((t) => score >= t.min) || TIERS[TIERS.length - 1];
  }

  function getRecommendations(data, score) {
    const tips = [];
    if (["graduacao", "outro"].includes(data.formacao)) {
      tips.push("Considerar mestrado ou documentar 5+ anos de experiência progressiva equivalente ao advanced degree.");
    }
    if (["pouco", "moderado"].includes(data.reconhecimentos)) {
      tips.push("Fortalecer evidências de excelência: publicações, citações, prêmios e certificações reconhecidas.");
    }
    if (["incerto", "nao"].includes(data.cartas)) {
      tips.push("Mapear especialistas independentes para cartas de recomendação detalhadas e específicas.");
    }
    if (["inicial", "indefinido"].includes(data.plano_eua)) {
      tips.push("Elaborar plano profissional nos EUA alinhado ao interesse nacional (proposta de trabalho / business plan).");
    }
    if (["emergente", "baixo"].includes(data.impacto)) {
      tips.push("Documentar impacto nacional com métricas, relatórios, mídia especializada e benefício aos EUA.");
    }
    if (["intermediario", "basico"].includes(data.ingles)) {
      tips.push("Aprimorar proficiência em inglês e, se aplicável, obter certificação TOEFL/IELTS.");
    }
    if (data.documentos.includes("nenhum") || data.documentos.length <= 1) {
      tips.push("Organizar dossiê documental completo antes do protocolo da petição I-140.");
    }
    if (score >= 70) {
      tips.push("Agendar consulta para revisão estratégica da petição e cronograma de protocolo.");
    }
    return tips.length ? tips : ["Manter documentação atualizada e alinhada aos critérios Dhanasar (Matter of Dhanasar, 26 I&N Dec. 884)."];
  }

  function buildAnalysis() {
    const data = getFormData();
    const score = calculateScore(data);
    const tier = getTier(score);
    const recommendations = getRecommendations(data, score);

    return { data, score, tier, recommendations };
  }

  /* ─── Tela de resultados ─── */
  function showResults(analysis) {
    showScreen(screenResult);
    progressWrapper.classList.remove("is-visible");

    animateGauge(analysis.score);
    renderBadge(analysis.tier);
    renderSummary(analysis);
    setupWhatsApp(analysis);
  }

  function animateGauge(score) {
    const offset = GAUGE_ARC - (score / 100) * GAUGE_ARC;
    /* Agulha: -90° (esquerda) a +90° (direita) */
    const angle = -90 + (score / 100) * 180;

    scoreValue.textContent = "0";
    gaugeFill.style.strokeDashoffset = GAUGE_ARC;
    gaugeNeedle.style.transform = "rotate(-90deg)";

    requestAnimationFrame(() => {
      setTimeout(() => {
        gaugeFill.style.strokeDashoffset = offset;
        gaugeNeedle.style.transform = `rotate(${angle}deg)`;
        animateCounter(scoreValue, 0, score, 1800);
      }, 150);
    });
  }

  function animateCounter(el, from, to, duration) {
    const start = performance.now();
    function tick(now) {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(from + (to - from) * eased);
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  function renderBadge(tier) {
    resultBadge.className = "result__badge " + tier.className;
    badgeIcon.textContent = tier.icon;
    resultTitle.textContent = tier.title;
    resultDesc.textContent = tier.desc;
  }

  function renderSummary({ data, score, tier, recommendations }) {
    const docLabels = data.documentos
      .map((d) => LABELS.documentos[d] || d)
      .join("; ");

    resultSummary.innerHTML = `
      <h4>Resumo da pré-análise</h4>
      <dl class="summary-grid">
        <div class="summary-item">
          <dt>Nome</dt><dd>${escapeHtml(data.nome)}</dd>
        </div>
        <div class="summary-item">
          <dt>WhatsApp</dt><dd>${escapeHtml(data.whatsapp)}</dd>
        </div>
        <div class="summary-item">
          <dt>E-mail</dt><dd>${escapeHtml(data.email)}</dd>
        </div>
        <div class="summary-item">
          <dt>Profissão</dt><dd>${escapeHtml(data.profissao)}</dd>
        </div>
        <div class="summary-item">
          <dt>País atual</dt><dd>${escapeHtml(data.pais)}</dd>
        </div>
        <div class="summary-item">
          <dt>Formação</dt><dd>${escapeHtml(LABELS.formacao[data.formacao])}</dd>
        </div>
        <div class="summary-item">
          <dt>Experiência</dt><dd>${escapeHtml(LABELS.experiencia[data.experiencia])}</dd>
        </div>
        <div class="summary-item">
          <dt>Área</dt><dd>${escapeHtml(LABELS.area[data.area])}</dd>
        </div>
        <div class="summary-item">
          <dt>Reconhecimentos</dt><dd>${escapeHtml(LABELS.reconhecimentos[data.reconhecimentos])}</dd>
        </div>
        <div class="summary-item">
          <dt>Cartas</dt><dd>${escapeHtml(LABELS.cartas[data.cartas])}</dd>
        </div>
        <div class="summary-item">
          <dt>Plano nos EUA</dt><dd>${escapeHtml(LABELS.plano_eua[data.plano_eua])}</dd>
        </div>
        <div class="summary-item">
          <dt>Impacto nacional</dt><dd>${escapeHtml(LABELS.impacto[data.impacto])}</dd>
        </div>
        <div class="summary-item">
          <dt>Inglês</dt><dd>${escapeHtml(LABELS.ingles[data.ingles])}</dd>
        </div>
        <div class="summary-item">
          <dt>Documentos</dt><dd>${escapeHtml(docLabels)}</dd>
        </div>
        <div class="summary-item">
          <dt>Pontuação</dt><dd><strong>${score} / 100</strong></dd>
        </div>
        <div class="summary-item">
          <dt>Classificação</dt><dd><strong>${escapeHtml(tier.title)}</strong></dd>
        </div>
      </dl>
      <div class="summary-section">
        <h5>Recomendações preliminares</h5>
        <ul class="summary-list">
          ${recommendations.map((r) => `<li>${escapeHtml(r)}</li>`).join("")}
        </ul>
      </div>
      <p class="summary-recommendations">
        Esta pré-análise é automatizada e não substitui avaliação jurídica individual.
        Entre em contato com Martínez & Santos para análise aprofundada do seu caso EB-2 NIW.
      </p>
    `;
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  /* ─── WhatsApp ─── */
  function buildWhatsAppMessage({ data, score, tier, recommendations }) {
    const docLabels = data.documentos.map((d) => LABELS.documentos[d]).join(", ");
    const lines = [
      "*Pré-análise EB-2 NIW*",
      "Martínez & Santos Advogados Associados",
      "────────────────────",
      `*Nome:* ${data.nome}`,
      `*WhatsApp:* ${data.whatsapp}`,
      `*E-mail:* ${data.email}`,
      `*Profissão:* ${data.profissao}`,
      `*País:* ${data.pais}`,
      "",
      `*Formação:* ${LABELS.formacao[data.formacao]}`,
      `*Experiência:* ${LABELS.experiencia[data.experiencia]}`,
      `*Área:* ${LABELS.area[data.area]}`,
      `*Reconhecimentos:* ${LABELS.reconhecimentos[data.reconhecimentos]}`,
      `*Cartas:* ${LABELS.cartas[data.cartas]}`,
      `*Plano EUA:* ${LABELS.plano_eua[data.plano_eua]}`,
      `*Impacto nacional:* ${LABELS.impacto[data.impacto]}`,
      `*Inglês:* ${LABELS.ingles[data.ingles]}`,
      `*Documentos:* ${docLabels}`,
      "",
      `*Pontuação:* ${score}/100`,
      `*Resultado:* ${tier.title}`,
      "",
      "*Recomendações:*",
      ...recommendations.map((r, i) => `${i + 1}. ${r}`),
      "",
      "_Triagem inicial — não garante aprovação USCIS._",
    ];
    return lines.join("\n");
  }

  function setupWhatsApp(analysis) {
    const text = encodeURIComponent(buildWhatsAppMessage(analysis));
    btnWhatsApp.href = `https://wa.me/${CONFIG.whatsappNumber}?text=${text}`;
  }

  init();
})();
