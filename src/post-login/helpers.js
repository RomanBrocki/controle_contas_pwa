// Runtime helpers shared by the post-login shell.
// Keep state-shaping and small business rules here so PostLoginMock.jsx can
// stay focused on orchestration, routing and modal coordination.

(function attachPostLoginHelpers(globalObject) {
  const SELF_CHAT_REPLIES = Object.freeze([
    'E?',
    'Aham...',
    'Aham...',
    'Aham...',
    'Aham...',
    'Aham...',
    'Aham...',
    'Aham...',
    'Aham...',
    'Aham...',
    'Aham...',
    'Aham...',
    'Aham...',
    'Aham...',
    'Aham...',
    'Ta me dando sono.',
    'Ja tentou colocar no arroz?',
    'Reinicia o app.',
    'Reinicia o celular.',
    'Dorme e tenta amanha.',
    'Ih, complicado...',
    'Nossa, nunca vi isso.',
    'Nao entendi.',
    'Pode ser problema temporario.',
    'Tenta atualizar a pagina.',
    'Ue, funcionou aqui.',
    'Isso e normal (acho).',
    'Estranho... mas ok.',
    'Tem certeza que ligou?',
    'okay...',
    'okay...',
    'okay...',
    'okay...',
    'Ah, isso ai e assim mesmo.',
    'Voce apertou o botao certo?',
    'Talvez se voce ignorar, resolva.',
    'Hahaha, boa sorte.',
    'Tenta soprar o cabo USB.',
    'Isso nao e comigo, e com o setor 7.',
    'Putz, que chato, hein?',
    'Deve ser o cache quantico.',
    'Entao ta certo, ne?',
    'Ja tentou limpar o cache?',
    'Ja tentou usar outro dispositivo?',
    'Funciona se voce acreditar.',
    'Ah, mas isso e do sistema.',
    'Hmm, isso parece magia negra.',
    'Ja pensou em desistir?',
    'Uau, que desastre elegante!',
    'Sao os aliens, cara.',
    'Nao entendi nada, mas parece serio.',
    'Pode repetir?',
    'Explica em outras palavras.',
    'Hmm, interessante...',
    'O problema ta entre a cadeira e o teclado.',
    'Ah, isso e normal. Ninguem entende tambem.',
    'Pode deixar que iremos demitir o estagiario.',
    'Ah, isso ai e culpa do Mercurio retrogrado.',
    'Ja tentou nao fazer isso?',
    'Pode repetir?',
    'Espera um pouco que talvez resolva sozinho.',
    'Ta com cara de "problema seu".',
    'Parece coisa de Windows.',
    'Sei la, tenta outro navegador.',
  ]);

  function normalizeLabel(value = '') {
    return String(value)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  function previousYearMonth(year, month) {
    return month > 1 ? { year, month: month - 1 } : { year: year - 1, month: 12 };
  }

  function accountIdentityKey(item = {}) {
    return `${normalizeLabel(item.nome)}__${normalizeLabel(item.instancia)}`;
  }

  function sanitizeExternalUrl(value) {
    if (!value) return '';
    const trimmedValue = String(value).trim();
    if (/^https?:\/\//i.test(trimmedValue)) return trimmedValue;
    return `https://${trimmedValue}`;
  }

  function resolveTodayISO() {
    if (typeof globalObject.todayISO === 'function') {
      return globalObject.todayISO();
    }

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function resolveParseBRtoISO(value) {
    if (typeof globalObject.parseBRtoISO === 'function') {
      return globalObject.parseBRtoISO(value);
    }
    return '';
  }

  function resolveParseBRL(value) {
    if (typeof globalObject.parseBRL === 'function') {
      return globalObject.parseBRL(value);
    }
    return Number(value || 0);
  }

  function parseMoneyValue(value) {
    return resolveParseBRL(value);
  }

  function buildContaDraft(form, context) {
    const paidBy = form.quemMode === 'outro'
      ? (form.quemOutro || '').trim()
      : (form.quem || '').trim();

    return {
      nome_da_conta: (form.nome || '').trim(),
      valor: resolveParseBRL(form.valor),
      data_de_pagamento: form.data || resolveTodayISO(),
      instancia: (form.instancia || '').trim(),
      quem_pagou: paidBy,
      dividida: !!form.dividida,
      link_boleto: sanitizeExternalUrl(form.boleto),
      link_comprovante: sanitizeExternalUrl(form.comp),
      ano: Number(context?.year || 0),
      mes: Number(context?.month || 0)
    };
  }

  function buildNewEditingState(prefill) {
    return {
      mode: 'new',
      item: {
        id: null,
        nome: prefill?.nome || '',
        valor: '',
        data: resolveTodayISO(),
        instancia: prefill?.instancia || '',
        quem: prefill?.quem || '',
        dividida: !!prefill?.dividida,
        links: { boleto: '', comp: '' }
      }
    };
  }

  function buildEditEditingState(item) {
    return {
      mode: 'edit',
      item: {
        ...JSON.parse(JSON.stringify(item)),
        data: resolveParseBRtoISO(item?.data) || resolveTodayISO()
      }
    };
  }

  function pickRandomReply(replies) {
    const list = Array.isArray(replies) ? replies : [];
    if (!list.length) return '...';
    return list[Math.floor(Math.random() * list.length)];
  }

  globalObject.PostLoginHelpers = {
    normalizeLabel,
    previousYearMonth,
    accountIdentityKey,
    sanitizeExternalUrl,
    parseMoneyValue,
    buildContaDraft,
    buildNewEditingState,
    buildEditEditingState,
    pickRandomReply,
    selfChatReplies: SELF_CHAT_REPLIES
  };
})(window);
