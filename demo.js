const SUPABASE_URL = 'https://upumrbwnamyzmzjudsst.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVwdW1yYnduYW15em16anVkc3N0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxMDM0MzQsImV4cCI6MjA3MTY3OTQzNH0.fEn1kB-OFcT2pc4Qvb-nJmqGHIt7tlIW_ktstIupPWk';

async function supabaseFetch(path, options = {}) {
  const res = await fetch(SUPABASE_URL + '/rest/v1/' + path, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
      'Prefer': options.prefer || '',
      ...options.headers,
    },
    method: options.method || 'GET',
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  return res;
}

function getFingerprint() {
  let fp = localStorage.getItem('put_fp');
  if (!fp) {
    fp = crypto.randomUUID();
    localStorage.setItem('put_fp', fp);
  }
  return fp;
}

document.addEventListener('DOMContentLoaded', () => {
  const editor = document.getElementById('putEditor');
  const charCount = document.getElementById('charCount');
  const copyBtn = document.getElementById('copyBtn');
  const pasteBtn = document.getElementById('pasteBtn');
  const aiInput = document.getElementById('aiInput');
  const chatArea = document.getElementById('chatArea');
  const ctaBtn = document.getElementById('ctaBtn');
  const ctaBtnInline = document.getElementById('ctaBtnInline');

  let isPasting = false;

  // Load interest count
  loadInterestCount();

  // Character count
  editor.addEventListener('input', () => {
    const len = editor.value.length;
    charCount.textContent = len;
    copyBtn.disabled = !len;
    pasteBtn.disabled = !len;
  });

  // Copy button
  copyBtn.addEventListener('click', () => {
    if (!editor.value.trim()) return;
    navigator.clipboard.writeText(editor.value).catch(() => {});
    showFeedback(copyBtn, 'Copied!', 'Copy');
  });

  // Paste action (shared)
  function doPaste() {
    if (!editor.value.trim() || isPasting) return;
    isPasting = true;
    pasteBtn.disabled = true;

    const text = editor.value;

    // Create flying text element
    const rect = editor.getBoundingClientRect();
    const fly = document.createElement('div');
    fly.className = 'fly-text';
    fly.textContent = text.length > 30 ? text.substring(0, 30) + '...' : text;
    fly.style.top = rect.top + 'px';
    fly.style.left = rect.left + 'px';
    document.body.appendChild(fly);

    setTimeout(() => {
      fly.remove();

      // Show text in AI input
      typeText(aiInput, text, () => {
        setTimeout(() => {
          addChatMessage(text, 'user');
          aiInput.textContent = '';

          setTimeout(() => {
            const response = getAIResponse(text);
            addChatMessage(response, 'ai');
            isPasting = false;
            pasteBtn.disabled = !editor.value.trim();
          }, 800);
        }, 400);
      });
    }, 600);

    // Clear editor
    editor.value = '';
    charCount.textContent = '0';
    copyBtn.disabled = true;
  }

  // Paste button
  pasteBtn.addEventListener('click', doPaste);

  // Keyboard shortcut: Cmd+Shift+Enter (or Ctrl+Shift+Enter)
  editor.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'Enter') {
      e.preventDefault();
      doPaste();
    }
  });

  // Saved prompt tabs
  document.querySelectorAll('.saved-tab').forEach(tab => {
    const originalLabel = tab.querySelector('.saved-tab-label').textContent;
    let labelTimer = null;

    tab.addEventListener('click', (e) => {
      const prompt = tab.dataset.prompt;
      const label = tab.querySelector('.saved-tab-label');

      if (e.metaKey || e.ctrlKey) {
        editor.value = prompt;
        charCount.textContent = prompt.length;
        copyBtn.disabled = false;
        pasteBtn.disabled = false;
        editor.focus();
        // Show inserted feedback
        if (labelTimer) clearTimeout(labelTimer);
        label.textContent = '✓';
        labelTimer = setTimeout(() => { label.textContent = originalLabel; }, 800);
      } else {
        navigator.clipboard.writeText(prompt).catch(() => {});
        if (labelTimer) clearTimeout(labelTimer);
        label.textContent = '✓';
        labelTimer = setTimeout(() => { label.textContent = originalLabel; }, 800);
      }
    });
  });

  // Typing animation
  function typeText(el, text, callback) {
    const displayText = text.length > 80 ? text.substring(0, 80) + '...' : text;
    let i = 0;
    el.textContent = '';
    const interval = setInterval(() => {
      el.textContent += displayText[i];
      i++;
      if (i >= displayText.length) {
        clearInterval(interval);
        if (callback) setTimeout(callback, 300);
      }
    }, 20);
  }

  // Add chat message (reset after 6 messages)
  function addChatMessage(text, type) {
    const msgs = chatArea.querySelectorAll('.chat-msg');
    if (msgs.length >= 6) {
      // Keep only the initial AI greeting
      while (chatArea.children.length > 1) {
        chatArea.removeChild(chatArea.children[1]);
      }
    }
    const msg = document.createElement('div');
    msg.className = 'chat-msg chat-' + (type === 'user' ? 'user' : 'ai');
    msg.innerHTML = '<p>' + escapeHtml(text) + '</p>';
    chatArea.appendChild(msg);
    chatArea.scrollTop = chatArea.scrollHeight;
  }

  // AI mock responses
  const aiFillers = [
    'いい質問ですね！',
    'すばらしい着眼点です！',
    'なるほど、とても興味深いですね！',
    'いいですね！さっそく取り組みましょう。',
    'おっしゃる通りですね！',
    'すごく良い視点だと思います！',
  ];

  function getAIResponse(input) {
    // Easter egg: 1/60 chance
    if (Math.random() < 1 / 60) {
      return '本日のタスク：Xでputを広める';
    }

    const lower = input.toLowerCase();
    if (lower.includes('hello') || lower.includes('こんにちは')) {
      return pickFiller() + 'putから送信されたんですね。何でもお気軽にどうぞ！';
    }
    if (lower.includes('put') || lower.includes('プロンプト')) {
      return pickFiller() + 'putはプロンプト入力を快適にするエディタですね。自由に編集して、シームレスに送信できるのが魅力的です！';
    }
    if (lower.includes('おすすめ') || lower.includes('recommend')) {
      return pickFiller() + 'putを使えば、プロンプトを保存して再利用できます。よく使うプロンプトをテンプレート化すると効率的ですよ！';
    }
    if (lower.includes('レビュー') || lower.includes('review') || lower.includes('コード')) {
      return pickFiller() + 'コードを確認しました。全体的にきれいに書かれていますが、いくつか改善点を提案させてください。';
    }
    if (lower.includes('翻訳') || lower.includes('英語') || lower.includes('translate')) {
      return pickFiller() + 'Here is the translation. I\'ve used natural business English appropriate for professional correspondence.';
    }
    if (lower.includes('コピー') || lower.includes('書き直') || lower.includes('魅力')) {
      return pickFiller() + 'より魅力的に書き直しました。ターゲット読者の心に響くよう、感情に訴えかける表現を意識しています。';
    }
    return pickFiller() + 'もう少し詳しく教えていただけますか？';
  }

  function pickFiller() {
    return aiFillers[Math.floor(Math.random() * aiFillers.length)] + ' ';
  }

  // Button feedback
  function showFeedback(btn, msg, original) {
    btn.textContent = msg;
    setTimeout(() => { btn.textContent = original; }, 1200);
  }

  // Escape HTML
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // CTA buttons — Supabase connected
  let interested = localStorage.getItem('put_interested') === '1';

  if (interested) {
    markAsInterested();
  }

  async function handleCta() {
    if (interested) return;
    interested = true;
    localStorage.setItem('put_interested', '1');
    markAsInterested();

    try {
      await supabaseFetch('put_interests', {
        method: 'POST',
        prefer: 'return=minimal',
        body: { fingerprint: getFingerprint() },
      });
      loadInterestCount();
    } catch (e) {
      // silently fail
    }
  }

  function markAsInterested() {
    document.querySelectorAll('.cta-btn').forEach(b => {
      b.style.background = 'linear-gradient(135deg, #444, #666)';
      const icon = b.querySelector('.cta-icon');
      if (icon) icon.textContent = '✓';
    });
  }

  async function loadInterestCount() {
    try {
      const res = await supabaseFetch('put_interests?select=id', {
        headers: { 'Prefer': 'count=exact' },
      });
      const count = res.headers.get('content-range');
      if (count) {
        const total = count.split('/')[1];
        document.querySelectorAll('.cta-count').forEach(el => {
          el.textContent = total;
        });
      }
    } catch (e) {
      // silently fail
    }
  }

  if (ctaBtn) ctaBtn.addEventListener('click', handleCta);
  if (ctaBtnInline) ctaBtnInline.addEventListener('click', handleCta);
});
