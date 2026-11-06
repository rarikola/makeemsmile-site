(function () {
    var root = document.getElementById('comments');
    var API = (root.getAttribute('data-api') || '').trim();
    var form = document.getElementById('cform');
    var msg = document.getElementById('cmsg');
    var list = document.getElementById('clist');
    var state = document.getElementById('cstate');
    var tally = document.getElementById('tally');
    var EMOJI = { sucks: '😒', meh: '🫤', notbad: '😎' };
    var WORD = { sucks: 'It sucks', meh: 'Meh', notbad: 'Not bad' };
    var counts = { sucks: 0, meh: 0, notbad: 0 };

    function ago(iso) {
      var s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
      if (s < 60) return 'just now';
      var m = Math.floor(s / 60); if (m < 60) return m + ' min ago';
      var h = Math.floor(m / 60); if (h < 24) return h + (h === 1 ? ' hour ago' : ' hours ago');
      var d = Math.floor(h / 24); if (d < 30) return d + (d === 1 ? ' day ago' : ' days ago');
      return new Date(iso).toLocaleDateString();
    }

    // Built with textContent only, so nothing anyone types can run as code.
    function item(c) {
      var li = document.createElement('li');
      li.className = 'citem';
      var em = document.createElement('span'); em.className = 'cem'; em.textContent = EMOJI[c.verdict] || '💬';
      em.title = WORD[c.verdict] || '';
      var body = document.createElement('div'); body.className = 'cbody';
      var head = document.createElement('div'); head.className = 'chead';
      var who = document.createElement('strong'); who.textContent = c.name || 'Anonymous';
      var when = document.createElement('span'); when.className = 'cwhen'; when.textContent = ago(c.time);
      head.appendChild(who); head.appendChild(when);
      var text = document.createElement('p'); text.textContent = c.comment;
      body.appendChild(head); body.appendChild(text);
      li.appendChild(em); li.appendChild(body);
      return li;
    }

    function showTally() {
      var total = counts.sucks + counts.meh + counts.notbad;
      if (!total) { tally.hidden = true; return; }
      tally.hidden = false;
      tally.textContent = '😒 ' + counts.sucks + '   🫤 ' + counts.meh + '   😎 ' + counts.notbad;
    }

    function load() {
      if (!API) { state.textContent = 'Comments are almost ready. Check back soon!'; return; }
      state.textContent = 'Loading comments…';
      fetch(API).then(function (r) { return r.json(); }).then(function (data) {
        list.textContent = '';
        (data.comments || []).forEach(function (c) { list.appendChild(item(c)); });
        counts = data.counts || counts;
        showTally();
        state.textContent = (data.comments || []).length ? '' : 'No comments yet. Be the first!';
      }).catch(function () {
        state.textContent = "Couldn't load comments right now. Try again in a moment.";
      });
    }

    var ERR = {
      pick_verdict: 'Pick a verdict first: 😒, 🫤 or 😎.',
      empty: 'Write a comment first.',
      too_long: 'That comment is too long (1000 characters max).',
      busy: 'Lots of comments right now. Try again in a few minutes.'
    };

    form.addEventListener('input', function () { msg.textContent = ''; msg.className = 'msg'; });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var f = new FormData(form);
      var payload = {
        verdict: f.get('verdict') || '',
        name: (f.get('name') || '').trim(),
        comment: (f.get('comment') || '').trim(),
        website: f.get('website') || ''
      };
      if (!payload.verdict) { msg.textContent = ERR.pick_verdict; msg.className = 'msg err'; return; }
      if (!payload.comment) { msg.textContent = ERR.empty; msg.className = 'msg err'; return; }
      if (!API) { msg.textContent = 'Comments open soon. Thanks for your patience!'; msg.className = 'msg err'; return; }

      var btn = form.querySelector('.send');
      btn.disabled = true; msg.textContent = 'Posting…'; msg.className = 'msg';
      // text/plain keeps the browser from sending a pre-check that Google Apps Script doesn't answer.
      fetch(API, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload) })
        .then(function (r) { return r.json(); })
        .then(function (res) {
          btn.disabled = false;
          if (!res.ok) { msg.textContent = ERR[res.error] || 'Something went wrong. Try again.'; msg.className = 'msg err'; return; }
          var c = res.comment || { time: new Date().toISOString(), verdict: payload.verdict, name: payload.name, comment: payload.comment };
          list.insertBefore(item(c), list.firstChild);
          if (counts[c.verdict] !== undefined) counts[c.verdict]++;
          showTally();
          state.textContent = '';
          form.reset();
          msg.textContent = 'Thanks! Your comment is up.'; msg.className = 'msg ok';
        })
        .catch(function () {
          btn.disabled = false;
          msg.textContent = "Couldn't post right now. Try again in a moment."; msg.className = 'msg err';
        });
    });

    load();
  })();
