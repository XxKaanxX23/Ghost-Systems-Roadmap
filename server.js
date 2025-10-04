/**
 * Ghost Systems — All-in-One AI Factory MVP
 * Quick start:
 * 1. Copy .env.example to .env and add any API keys.
 * 2. Run `npm install` to install dependencies.
 * 3. Run `npm start` or `node server.js`.
 * 4. Open http://localhost:3000 in your browser.
 */

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const DEFAULT_OPENAI_MODEL = 'gpt-4o-mini';

app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.get('/healthz', (req, res) => {
  res.json({ ok: true });
});

app.post('/api/openai', async (req, res) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(400).json({ ok: false, error: 'Missing OPENAI_API_KEY on server' });
  }

  const body = req.body || {};
  const prompt = typeof body.prompt === 'string' ? body.prompt : '';
  const system = typeof body.system === 'string' ? body.system : '';
  const model = typeof body.model === 'string' && body.model.trim() ? body.model.trim() : DEFAULT_OPENAI_MODEL;
  const temperature = typeof body.temperature === 'number' ? body.temperature : 0.7;

  if (!prompt) {
    return res.status(400).json({ ok: false, error: 'Prompt is required' });
  }

  try {
    const messages = system ? [{ role: 'system', content: system }, { role: 'user', content: prompt }] : [{ role: 'user', content: prompt }];
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + apiKey
      },
      body: JSON.stringify({
        model,
        messages,
        temperature
      })
    });

    if (!response.ok) {
      let errorDetail = 'OpenAI request failed';
      try {
        const errJson = await response.json();
        if (errJson && errJson.error && errJson.error.message) {
          errorDetail = errJson.error.message;
        }
      } catch (err) {
        // ignore json parse errors
      }
      return res.status(response.status).json({ ok: false, error: errorDetail });
    }

    const data = await response.json();
    const content = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content ? data.choices[0].message.content.trim() : '';
    res.json({ ok: true, content });
  } catch (error) {
    console.error('OpenAI error:', error);
    res.status(500).json({ ok: false, error: 'OpenAI request error' });
  }
});

app.post('/api/voice', async (req, res) => {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return res.status(400).json({ ok: false, error: 'Missing ELEVENLABS_API_KEY on server' });
  }

  const text = req.body && typeof req.body.text === 'string' ? req.body.text.trim() : '';
  if (!text) {
    return res.status(400).json({ ok: false, error: 'Text is required' });
  }

  const voiceId = (req.body && typeof req.body.voiceId === 'string' && req.body.voiceId.trim()) ? req.body.voiceId.trim() : (process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM');

  try {
    const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/' + voiceId, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
        'xi-api-key': apiKey
      },
      body: JSON.stringify({
        text,
        voice_settings: {
          stability: 0.45,
          similarity_boost: 0.7
        }
      })
    });

    if (!response.ok) {
      let errorDetail = 'Voice synthesis failed';
      try {
        const errJson = await response.json();
        if (errJson && errJson.detail && errJson.detail.message) {
          errorDetail = errJson.detail.message;
        }
      } catch (err) {
        // ignore json parse errors
      }
      return res.status(response.status).json({ ok: false, error: errorDetail });
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64Audio = Buffer.from(arrayBuffer).toString('base64');
    res.json({ ok: true, audio: 'data:audio/mpeg;base64,' + base64Audio });
  } catch (error) {
    console.error('Voice error:', error);
    res.status(500).json({ ok: false, error: 'Voice request error' });
  }
});

const html = '<!DOCTYPE html>' +
'<html lang=\"en\">' +
'<head>' +
'<meta charset=\"utf-8\" />' +
'<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />' +
'<title>Ghost Systems — All-in-One AI Factory</title>' +
'<style>' +
'body { font-family: \"Inter\", \"Segoe UI\", sans-serif; background:#0b0f12; color:#f0f6ff; margin:0; padding:0; }' +
'.app { display:flex; min-height:100vh; }' +
'header { padding:20px 24px; background:#101820; border-bottom:1px solid #1c2733; display:flex; align-items:center; justify-content:space-between; position:sticky; top:0; z-index:10; }' +
'header h1 { margin:0; font-size:20px; letter-spacing:0.04em; text-transform:uppercase; }' +
'header button { background:#1f2a36; color:#f0f6ff; border:1px solid #2c3a49; padding:8px 14px; border-radius:6px; cursor:pointer; font-size:13px; }' +
'header button:hover { background:#273545; }' +
'.sidebar { width:260px; background:#0f141a; border-right:1px solid #141d28; padding:16px; display:flex; flex-direction:column; gap:8px; position:sticky; top:74px; height:calc(100vh - 74px); overflow-y:auto; }' +
'.tab-button { background:#121b24; border:1px solid #1c2733; color:#b8c7da; padding:12px 14px; border-radius:8px; text-align:left; cursor:pointer; font-size:14px; transition:all 0.2s ease; }' +
'.tab-button.active { background:#1f2a36; color:#ffffff; border-color:#2d3d50; box-shadow:0 0 0 1px #2d3d50; }' +
'.tab-button:hover { background:#18222d; }' +
'.content { flex:1; padding:24px; overflow-y:auto; }' +
'.tab-panel { display:none; }' +
'.tab-panel.active { display:block; }' +
'.card { background:#101820; border:1px solid #1b2836; border-radius:14px; padding:24px; margin-bottom:24px; box-shadow:0 18px 45px rgba(4, 6, 10, 0.35); }' +
'.card h2 { margin-top:0; font-size:18px; letter-spacing:0.02em; }' +
'label { display:block; font-size:13px; text-transform:uppercase; letter-spacing:0.08em; margin-bottom:6px; color:#9fb0c7; }' +
'input[type=\"text\"], textarea { width:100%; background:#0b1218; border:1px solid #1b2836; color:#f8fbff; border-radius:10px; padding:12px 14px; font-size:14px; box-sizing:border-box; resize:vertical; }' +
'input[type=\"text\"]:focus, textarea:focus { outline:none; border-color:#3a8ffd; box-shadow:0 0 0 2px rgba(58,143,253,0.25); }' +
'.field-row { display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:16px; margin-bottom:20px; }' +
'.btn-group { display:flex; flex-wrap:wrap; gap:10px; margin-bottom:18px; }' +
'.btn { background:#1f2a36; color:#f0f6ff; border:1px solid #2c3a49; padding:10px 16px; border-radius:8px; cursor:pointer; font-size:14px; transition:all 0.2s ease; }' +
'.btn:hover { background:#273545; }' +
'.note { font-size:12px; color:#7e8fa7; margin-top:12px; line-height:1.6; }' +
'.status { margin-top:10px; font-size:13px; color:#67d4ff; }' +
'.audio-player { margin-top:16px; }' +
'.settings-group { display:flex; flex-direction:column; gap:16px; }' +
'.settings-row { display:flex; align-items:center; gap:8px; font-size:13px; color:#c0d0e5; }' +
'.settings-row input[type=\"checkbox\"] { width:auto; }' +
'.danger { background:#2c1a1f; border-color:#493138; color:#ffc7ce; }' +
'.danger:hover { background:#3a232a; }' +
'@media (max-width: 960px) { .app { flex-direction:column; } .sidebar { position:static; width:100%; height:auto; flex-direction:row; overflow-x:auto; } .tab-button { flex:1; text-align:center; white-space:nowrap; } .content { padding:16px; } }' +
'@media print { body { background:#ffffff; color:#000000; } header, .sidebar, .btn, .status, .note { display:none !important; } .card { box-shadow:none; border:1px solid #d0d6dd; page-break-inside:avoid; } textarea { background:#ffffff; color:#000000; border:1px solid #b0b0b0; } }' +
'</style>' +
'</head>' +
'<body>' +
'<header>' +
'<h1>👻 Ghost Systems — All-in-One AI Factory</h1>' +
'<button id=\"print-btn\">Print / Save PDF</button>' +
'</header>' +
'<div class=\"app\">' +
'<nav class=\"sidebar\">' +
'<button class=\"tab-button active\" data-tab=\"niche\">Niche &amp; Product Research</button>' +
'<button class=\"tab-button\" data-tab=\"offer\">Offer &amp; Product Creation</button>' +
'<button class=\"tab-button\" data-tab=\"funnel\">Funnel Builder</button>' +
'<button class=\"tab-button\" data-tab=\"content\">Content Engine</button>' +
'<button class=\"tab-button\" data-tab=\"voice\">Voice &amp; Video</button>' +
'<button class=\"tab-button\" data-tab=\"settings\">Settings &amp; Export</button>' +
'</nav>' +
'<main class=\"content\">' +
'<section class=\"tab-panel active\" id=\"tab-niche\">' +
'<div class=\"card\">' +
'<h2>Niche &amp; Product Research</h2>' +
'<div class=\"field-row\">' +
'<div><label for=\"input-audience\">Audience</label><input type=\"text\" id=\"input-audience\" placeholder=\"e.g. Solo agency owners\" /></div>' +
'<div><label for=\"input-niche\">Initial Niche</label><input type=\"text\" id=\"input-niche\" placeholder=\"Optional starting idea\" /></div>' +
'<div><label for=\"input-avatar\">Avatar</label><input type=\"text\" id=\"input-avatar\" placeholder=\"Who are we selling to?\" /></div>' +
'<div><label for=\"input-pname\">Product Name</label><input type=\"text\" id=\"input-pname\" placeholder=\"Name your flagship offer\" /></div>' +
'</div>' +
'<div class=\"btn-group\">' +
'<button class=\"btn\" id=\"btn-niche\">Generate Niche Matrix</button>' +
'</div>' +
'<label for=\"output-niche\">Niche Matrix</label>' +
'<textarea id=\"output-niche\" rows=\"14\" placeholder=\"Your niche intelligence will appear here...\"></textarea>' +
'<div class=\"status\" id=\"status-niche\"></div>' +
'</div>' +
'</section>' +
'<section class=\"tab-panel\" id=\"tab-offer\">' +
'<div class=\"card\">' +
'<h2>Offer &amp; Product Creation</h2>' +
'<div class=\"btn-group\">' +
'<button class=\"btn\" id=\"btn-offer\">Generate Offer</button>' +
'<button class=\"btn\" id=\"btn-product\">Generate Product Outline &amp; Demo Script</button>' +
'</div>' +
'<label for=\"output-offer\">Offer Stack</label>' +
'<textarea id=\"output-offer\" rows=\"12\" placeholder=\"Tripwire, core offer, membership...\"></textarea>' +
'<label for=\"output-product\">Product Outline &amp; Demo Script</label>' +
'<textarea id=\"output-product\" rows=\"12\" placeholder=\"Outline, quickstart, templates, swipe file...\"></textarea>' +
'<div class=\"status\" id=\"status-offer\"></div>' +
'</div>' +
'</section>' +
'<section class=\"tab-panel\" id=\"tab-funnel\">' +
'<div class=\"card\">' +
'<h2>Funnel Builder</h2>' +
'<div class=\"btn-group\">' +
'<button class=\"btn\" id=\"btn-funnel\">Generate Funnel Copy + Abandoned Cart</button>' +
'</div>' +
'<label for=\"output-funnel\">Funnel Copy</label>' +
'<textarea id=\"output-funnel\" rows=\"16\" placeholder=\"VSL copy, emails, SMS reminders...\"></textarea>' +
'<div class=\"status\" id=\"status-funnel\"></div>' +
'</div>' +
'</section>' +
'<section class=\"tab-panel\" id=\"tab-content\">' +
'<div class=\"card\">' +
'<h2>Content Engine</h2>' +
'<div class=\"btn-group\">' +
'<button class=\"btn\" id=\"btn-hooks\">Generate 30 Hooks</button>' +
'<button class=\"btn\" id=\"btn-scripts\">Generate 5 Scripts</button>' +
'<button class=\"btn\" id=\"btn-captions\">Generate Captions + Hashtags</button>' +
'</div>' +
'<label for=\"output-hooks\">Hooks</label>' +
'<textarea id=\"output-hooks\" rows=\"10\" placeholder=\"Curiosity hooks appear here...\"></textarea>' +
'<label for=\"output-scripts\">Scripts</label>' +
'<textarea id=\"output-scripts\" rows=\"10\" placeholder=\"Short-form scripts appear here...\"></textarea>' +
'<label for=\"output-captions\">Captions</label>' +
'<textarea id=\"output-captions\" rows=\"8\" placeholder=\"Caption and hashtags...\"></textarea>' +
'<div class=\"status\" id=\"status-content\"></div>' +
'</div>' +
'</section>' +
'<section class=\"tab-panel\" id=\"tab-voice\">' +
'<div class=\"card\">' +
'<h2>Voice &amp; Video</h2>' +
'<label for=\"output-voice\">Voiceover Script</label>' +
'<textarea id=\"output-voice\" rows=\"10\">Scene 1: Cold open on a black screen. Whispered voice: \"You’re one idea away from owning the night.\"\nScene 2: Minimal motion graphics reveal the offer name. Narrator: \"Ghost Systems builds faceless funnels that print buyers while you sleep.\"\nScene 3: Overlay quick wins. Narrator: \"Launch in 48 hours with ready-made assets, cinematic scripts, and automated follow-up.\"\nScene 4: Call-to-action. Narrator: \"Plug in your niche, press generate, and let the haunt begin.\"</textarea>' +
'<div class=\"btn-group\">' +
'<button class=\"btn\" id=\"btn-voice\">Generate Voiceover</button>' +
'</div>' +
'<audio id=\"voice-audio\" class=\"audio-player\" controls></audio>' +
'<div class=\"status\" id=\"status-voice\"></div>' +
'</div>' +
'</section>' +
'<section class=\"tab-panel\" id=\"tab-settings\">' +
'<div class=\"card\">' +
'<h2>Settings &amp; Export</h2>' +
'<div class=\"settings-group\">' +
'<div class=\"settings-row\"><input type=\"checkbox\" id=\"toggle-demo\" /><label for=\"toggle-demo\">Demo Mode</label><span id=\"demo-indicator\"></span></div>' +
'<button class=\"btn\" id=\"btn-export\">Export Project JSON</button>' +
'<button class=\"btn danger\" id=\"btn-clear\">Clear Local Data</button>' +
'<div class=\"note\">Add your API keys to the server .env file and restart to enable live AI + voice. Demo mode provides rich sample copy even without keys.</div>' +
'</div>' +
'<div class=\"status\" id=\"status-settings\"></div>' +
'</div>' +
'</section>' +
'</main>' +
'</div>' +
'<script>' +
'(function(){' +
'  var storageKey = \"ghost-systems-state\";' +
'  var demoKey = \"ghost-systems-demo\";' +
'  var state = {' +
'    audience: \"\",' +
'    niche: \"\",' +
'    avatar: \"\",' +
'    pname: \"\",' +
'    out: {' +
'      niche: \"\",' +
'      offer: \"\",' +
'      product: \"\",' +
'      funnel: \"\",' +
'      hooks: \"\",' +
'      scripts: \"\",' +
'      captions: \"\",' +
'      voice: \"\"' +
'    }' +
'  };' +
'  var demoMode = false;' +
'  function loadState(){' +
'    try {' +
'      var saved = localStorage.getItem(storageKey);' +
'      if (saved) {' +
'        var parsed = JSON.parse(saved);' +
'        if (parsed && typeof parsed === \"object\") {' +
'          if (typeof parsed.audience === \"string\") state.audience = parsed.audience;' +
'          if (typeof parsed.niche === \"string\") state.niche = parsed.niche;' +
'          if (typeof parsed.avatar === \"string\") state.avatar = parsed.avatar;' +
'          if (typeof parsed.pname === \"string\") state.pname = parsed.pname;' +
'          if (parsed.out && typeof parsed.out === \"object\") {' +
'            for (var key in state.out) {' +
'              if (Object.prototype.hasOwnProperty.call(parsed.out, key) && typeof parsed.out[key] === \"string\") {' +
'                state.out[key] = parsed.out[key];' +
'              }' +
'            }' +
'          }' +
'        }' +
'      }' +
'    } catch (err) {' +
'      console.warn(\"Failed to parse saved state\", err);' +
'    }' +
'    try {' +
'      var savedDemo = localStorage.getItem(demoKey);' +
'      if (savedDemo === \"true\") {' +
'        demoMode = true;' +
'      }' +
'    } catch (err) {' +
'      // ignore' +
'    }' +
'  }' +
'  function persist(){' +
'    localStorage.setItem(storageKey, JSON.stringify(state));' +
'    localStorage.setItem(demoKey, demoMode ? \"true\" : \"false\");' +
'  }' +
'  function el(id){ return document.getElementById(id); }' +
'  loadState();' +
'  var audienceInput = el(\"input-audience\");' +
'  var nicheInput = el(\"input-niche\");' +
'  var avatarInput = el(\"input-avatar\");' +
'  var pnameInput = el(\"input-pname\");' +
'  var nicheOutput = el(\"output-niche\");' +
'  var offerOutput = el(\"output-offer\");' +
'  var productOutput = el(\"output-product\");' +
'  var funnelOutput = el(\"output-funnel\");' +
'  var hooksOutput = el(\"output-hooks\");' +
'  var scriptsOutput = el(\"output-scripts\");' +
'  var captionsOutput = el(\"output-captions\");' +
'  var voiceOutput = el(\"output-voice\");' +
'  var voiceAudio = el(\"voice-audio\");' +
'  var demoToggle = el(\"toggle-demo\");' +
'  var demoIndicator = el(\"demo-indicator\");' +
'  audienceInput.value = state.audience;' +
'  nicheInput.value = state.niche;' +
'  avatarInput.value = state.avatar;' +
'  pnameInput.value = state.pname;' +
'  nicheOutput.value = state.out.niche;' +
'  offerOutput.value = state.out.offer;' +
'  productOutput.value = state.out.product;' +
'  funnelOutput.value = state.out.funnel;' +
'  hooksOutput.value = state.out.hooks;' +
'  scriptsOutput.value = state.out.scripts;' +
'  captionsOutput.value = state.out.captions;' +
'  if (state.out.voice) {' +
'    voiceOutput.value = state.out.voice;' +
'  }' +
'  function updateDemoIndicator(){' +
'    demoIndicator.textContent = demoMode ? \"(enabled)\" : \"(off)\";' +
'    demoToggle.checked = demoMode;' +
'  }' +
'  updateDemoIndicator();' +
'  function attachInput(input, key){' +
'    input.addEventListener(\"input\", function(){' +
'      state[key] = input.value;' +
'      persist();' +
'    });' +
'  }' +
'  attachInput(audienceInput, \"audience\");' +
'  attachInput(nicheInput, \"niche\");' +
'  attachInput(avatarInput, \"avatar\");' +
'  attachInput(pnameInput, \"pname\");' +
'  function attachOutput(textarea, key){' +
'    textarea.addEventListener(\"input\", function(){' +
'      state.out[key] = textarea.value;' +
'      if (key === \"voice\") {' +
'        state.out.voice = textarea.value;' +
'      }' +
'      persist();' +
'    });' +
'  }' +
'  attachOutput(nicheOutput, \"niche\");' +
'  attachOutput(offerOutput, \"offer\");' +
'  attachOutput(productOutput, \"product\");' +
'  attachOutput(funnelOutput, \"funnel\");' +
'  attachOutput(hooksOutput, \"hooks\");' +
'  attachOutput(scriptsOutput, \"scripts\");' +
'  attachOutput(captionsOutput, \"captions\");' +
'  attachOutput(voiceOutput, \"voice\");' +
'  var tabs = document.querySelectorAll(\".tab-button\");' +
'  var panels = document.querySelectorAll(\".tab-panel\");' +
'  function activateTab(id){' +
'    tabs.forEach(function(btn){' +
'      if (btn.getAttribute(\"data-tab\") === id) {' +
'        btn.classList.add(\"active\");' +
'      } else {' +
'        btn.classList.remove(\"active\");' +
'      }' +
'    });' +
'    panels.forEach(function(panel){' +
'      if (panel.id === \"tab-\" + id) {' +
'        panel.classList.add(\"active\");' +
'      } else {' +
'        panel.classList.remove(\"active\");' +
'      }' +
'    });' +
'  }' +
'  tabs.forEach(function(btn){' +
'    btn.addEventListener(\"click\", function(){' +
'      activateTab(btn.getAttribute(\"data-tab\"));' +
'    });' +
'  });' +
'  el(\"print-btn\").addEventListener(\"click\", function(){ window.print(); });' +
'  var demo = {' +
'    niches: function(audience){' +
'      var who = audience || \"digital creators\";' +
'      return \"Niche Matrix for \" + who + \"\\n\\n\" +' +
'        \"| Idea | Urgency | Purchasing Power | Recurring Need | Audience Size | Competitive Gap | Proof Assets | Reachability |\\n\" +' +
'        \"| --- | --- | --- | --- | --- | --- | --- | --- |\\n\" +' +
'        \"| Midnight Client Acquisition Ops | 5 | 4 | 5 | 4 | 3 | 5 | 4 |\\n\" +' +
'        \"| Ghostwritten Authority Threads | 4 | 4 | 4 | 5 | 5 | 4 | 5 |\\n\" +' +
'        \"| Silent Webinar Funnel Studio | 3 | 5 | 4 | 3 | 4 | 3 | 4 |\\n\" +' +
'        \"| Faceless Shorts Batcher | 5 | 3 | 5 | 5 | 4 | 4 | 5 |\\n\" +' +
'        \"| Dark Social Lead Trap Kits | 4 | 5 | 4 | 4 | 3 | 5 | 3 |\\n\" +' +
'        \"\\nTop Pick: Faceless Shorts Batcher — it launches fast, fuels recurring retainers, and lets \" + who + \" own every platform feed without stepping on camera.\";' +
'    },' +
'    offer: function(niche, avatar){' +
'      var focus = niche || avatar || \"growth operators\";' +
'      return \"Tripwire — $7 Ghost Launch Sprints\\nHeadline: Deploy a faceless content army in 48 hours for \" + focus + \"\\nBullets:\\n1. Clone the exact boardroom storyboard that pulls midnight buyers.\\n2. Drag-and-drop timeline to launch 9 viral hooks a day.\\n3. Premiere-ready B-roll vault sized for reels, shorts, and stories.\\n4. Automation map that routes every click into a 5-touch nurture.\\n5. Swipe our cold DM angles with screenshots and metrics.\\n6. Plug-and-play Notion dashboard for fulfillment tracking.\\n7. Nightfall guarantee: see your first qualified lead in 48 hours or we rebuild it live.\\nOrder Bump: $27 Faceless Ad Creative Vault.\\n\\nCore Offer — $497 Ghost Systems Command Kit\\nDream Outcome: Own a cinematic sales system without showing your face.\\nProof: Includes anonymized case files, before-after metrics, and client testimonials.\\nFirst Wins: Day 1 deploy templates, Day 2 capture leads, Day 3 automate follow-up.\\nEffort: Templates, scripts, and AI prompts do the heavy lifting.\\nGuarantee: 30-day Possess the Pipeline guarantee or we train your operator weekly until closed.\\nUpsell: $197 Cinematic Retargeting Sequence bundle.\\n\\nMembership — $47/mo Midnight Operators Circle\\nWhat’s inside: Weekly faceless script drops, voice clone swaps, AI automation labs, and live teardown calls.\\nPromise: Stay armed with what’s working in the dark social underground, refreshed every week.\";' +
'    },' +
'    product: function(productName){' +
'      var name = productName || \"Ghost Systems Command Kit\";' +
'      return \"Product Outline for \" + name + \"\\n\\nModule 1: Framing the Faceless Empire\\n- Quickstart checklist to launch in 48 hours\\n- Positioning grid for avatar, promise, proof\\n- Mini sprint: activate dark social radar\\n\\nModule 2: Production Vault\\n- 5 cinematic storyboard templates\\n- Swipe file of faceless B-roll sequences\\n- AI prompt packs for hooks, captions, CTAs\\n\\nModule 3: Funnel Automations\\n- Plug-in automations for lead capture, nurture, close\\n- Notion command center template\\n- Abandoned cart + SMS flows\\n\\nModule 4: Scale in the Shadows\\n- Offer optimizer worksheet\\n- Partner outreach scripts\\n- Metrics cockpit dashboard\\n\\n90-Second Demo Script\\nHook: \\\"Imagine selling 24/7 without showing your face.\\\"\\nProblem: \\\"Most operators stall because content creation steals their time.\\\"\\nSolution: Show dashboard cutting from hooks library to automation map.\\nProof: Overlay anonymized results and testimonials.\\nCTA: \\\"Hit deploy and let Ghost Systems haunt your pipeline.\\\"\";' +
'    },' +
'    funnel: function(productName){' +
'      var name = productName || \"Ghost Systems Command Kit\";' +
'      return \"One-Page VSL for \" + name + \"\\n\\nH1: Own the Night Market Without Showing Your Face\\nSub: Deploy faceless funnels, cinematic scripts, and automation in 48 hours.\\nCTA: Start Your Command Kit\\n\\nPromise + Proof\\n- Promise: Launch a complete revenue ecosystem that runs in the dark.\\n- Proof: Operators captured $124k in 37 days using this system.\\n\\nDemo\\n- Walkthrough of hook generator, automation map, and voiceover drops.\\n\\n7 Bullets\\n1. Faceless script vault updated weekly.\\n2. Done-for-you funnel copy bank.\\n3. AI prompt matrix for every touchpoint.\\n4. Automation blueprints with Zapier, Make, and HighLevel.\\n5. Launch day checklist and fulfillment tracker.\\n6. Abandoned cart rescue sequence.\\n7. Access to Midnight Operators Circle.\\n\\nGuarantee\\nPossess the Pipeline 30-day guarantee or we build beside you.\\nCTA\\nDeploy Your Command Kit Tonight\\n\\nAbandoned Cart Email 1: Still planning the haunt? — empathize, restate promise, CTA.\\nEmail 2: Operators already deployed — share proof snapshots, CTA.\\nEmail 3: Last midnight window — urgency, guarantee reminder, CTA.\\nSMS 1: Your faceless funnel is waiting with short link.\\nSMS 2: Cart closes at midnight with guarantee mention.\";' +
'    },' +
'    hooks: function(niche){' +
'      var theme = niche || \"faceless funnel builders\";' +
'      return \"30 Hooks for \" + theme + \"\\n1. They sold out a launch without a single selfie.\\n2. The silent funnel printing buyers at 2:13 a.m.\\n3. What happens when AI writes your next midnight drop.\\n4. This faceless script crushed ads with zero targeting.\\n5. The secret dashboard ghosting your competition.\\n6. 48-hour sprint to a cinematic offer.\\n7. Dark social DM angle that fills calendars overnight.\\n8. Why the loudest brands lose to the quiet ones.\\n9. Steal this automation before the algorithm patches it.\\n10. The proof wall buyers can’t ignore.\\n11. How operators stack 30 hooks in a coffee break.\\n12. The abandoned cart line no one else is using.\\n13. Map your entire buyer journey in 12 minutes.\\n14. AI voiceover that sounds like cinematic cinema.\\n15. The 5 stats that close buyers while you sleep.\\n16. Turn one idea into 90 clips in one click.\\n17. The VSL structure big agencies keep hidden.\\n18. Stop showing your face, start showing numbers.\\n19. The guarantee rewrite that killed churn.\\n20. Four words that open dream clients.\\n21. The swipe file that outperforms human copywriters.\\n22. Automate testimonials without begging.\\n23. This metric decides if your funnel lives.\\n24. The minute-by-minute launch plan.\\n25. Build trust with zero personal brand.\\n26. Smuggle proof into every story.\\n27. The SMS duo that revives ghosted carts.\\n28. Capture leads from the comment abyss.\\n29. Make AI edit your VSL in five clicks.\\n30. Ready to haunt their newsfeed?\";' +
'    },' +
'    scripts: function(productName){' +
'      var name = productName || \"Ghost Systems Command Kit\";' +
'      return \"Short-Form Script 1\\nHOOK: They made $36k without showing their face.\\nMEAT: Show the \" + name + \" dashboard auto-spinning hooks, funnels, and voiceovers.\\nCTA: Type GHOST and I’ll send the exact system.\\n\\nShort-Form Script 2\\nHOOK: Stop filming. Start deploying.\\nMEAT: Walkthrough of automation flow, abandoned cart rescue, and cinematic templates.\\nCTA: Grab the \" + name + \" before midnight.\\n\\nShort-Form Script 3\\nHOOK: Your funnel is scaring buyers away.\\nMEAT: Contrast outdated funnels with faceless VSL, proof wall, SMS stack.\\nCTA: Link in bio to haunt smarter.\\n\\nShort-Form Script 4\\nHOOK: Imagine printing buyers while asleep.\\nMEAT: Highlight AI prompts, templates, membership support.\\nCTA: DM NIGHT to deploy.\\n\\nShort-Form Script 5\\nHOOK: The dark social playbook no one shares.\\nMEAT: Reveal DM angles, content batching, automation wizards.\\nCTA: Unlock the \" + name + \" today.\";' +
'    },' +
'    captions: function(productName){' +
'      var name = productName || \"Ghost Systems Command Kit\";' +
'      return \"Caption\\nWe build faceless empires in the dark. Drop your niche and Ghost Systems hands you the offer, funnel, and content. Deploy once, scale forever.\\n\\nHashtags\\n#GhostSystems #\" + name.replace(/\\s+/g, \"\") + \" #FacelessFunnels #MidnightOperators #AIContent #AutomatedRevenue\";' +
'    }' +
'  };' +
'  function setStatus(id, message, isError){' +
'    var elStatus = document.getElementById(id);' +
'    if (!elStatus) return;' +
'    elStatus.textContent = message || \"\";' +
'    if (isError) {' +
'      elStatus.style.color = \"#ff8899\";' +
'    } else {' +
'      elStatus.style.color = \"#67d4ff\";' +
'    }' +
'  }' +
'  function enableDemoMode(){' +
'    if (!demoMode) {' +
'      demoMode = true;' +
'      updateDemoIndicator();' +
'      persist();' +
'    }' +
'  }' +
'  function callOpenAI(prompt, fallback){' +
'    if (demoMode && typeof fallback === \"function\") {' +
'      return Promise.resolve(fallback());' +
'    }' +
'    return fetch(\"/api/openai\", {' +
'      method: \"POST\",' +
'      headers: { \"Content-Type\": \"application/json\" },' +
'      body: JSON.stringify({ prompt: prompt })' +
'    }).then(function(res){' +
'      if (res.status === 400) {' +
'        enableDemoMode();' +
'        return res.json().then(function(data){' +
'          var err = data && data.error ? data.error : \"Missing API key\";' +
'          throw new Error(err);' +
'        });' +
'      }' +
'      return res.json();' +
'    }).then(function(data){' +
'      if (!data.ok || !data.content) {' +
'        throw new Error(data.error || \"AI request failed\");' +
'      }' +
'      if (demoMode) {' +
'        demoMode = false;' +
'        updateDemoIndicator();' +
'        persist();' +
'      }' +
'      return data.content;' +
'    }).catch(function(err){' +
'      console.warn(\"AI fallback\", err);' +
'      if (typeof fallback === \"function\") {' +
'        enableDemoMode();' +
'        return fallback();' +
'      }' +
'      throw err;' +
'    });' +
'  }' +
'  function handleNiche(){' +
'    setStatus(\"status-niche\", \"Generating niche intelligence...\");' +
'    var prompt = \"Give me a niche matrix for audience: \" + (state.audience || \"operators\") + \". Score 5–10 ideas 1–5 for: Urgency, Purchasing Power, Recurring Need, Audience Size, Competitive Gap, Proof Assets, Reachability. Return a table + top pick rationale.\";' +
'    callOpenAI(prompt, function(){ return demo.niches(state.audience); }).then(function(content){' +
'      nicheOutput.value = content;' +
'      state.out.niche = content;' +
'      persist();' +
'      setStatus(\"status-niche\", \"Niche matrix ready.\");' +
'    }).catch(function(err){' +
'      setStatus(\"status-niche\", err.message || \"Unable to generate.\", true);' +
'    });' +
'  }' +
'  function handleOffer(){' +
'    setStatus(\"status-offer\", \"Crafting offer stack...\");' +
'    var prompt = \"Create a $7 tripwire, $497 core, and $47/mo membership for the niche \" + (state.niche || state.audience || \"operators\") + \". Use the Value Equation: Dream outcome, Proof, First wins in 48h, Minimal effort. Return headline, 7 bullets, guarantee, order bump, upsell.\";' +
'    callOpenAI(prompt, function(){ return demo.offer(state.niche, state.avatar); }).then(function(content){' +
'      offerOutput.value = content;' +
'      state.out.offer = content;' +
'      persist();' +
'      setStatus(\"status-offer\", \"Offer crafted.\");' +
'    }).catch(function(err){' +
'      setStatus(\"status-offer\", err.message || \"Unable to generate.\", true);' +
'    });' +
'  }' +
'  function handleProduct(){' +
'    setStatus(\"status-offer\", \"Designing product blueprint...\");' +
'    var prompt = \"Draft a detailed product outline for \" + (state.pname || \"the offer\") + \" in the niche \" + (state.niche || state.audience || \"operators\") + \". Include: Quickstart checklist, 3–5 templates, swipe file, and a 90-second faceless demo script.\";' +
'    callOpenAI(prompt, function(){ return demo.product(state.pname); }).then(function(content){' +
'      productOutput.value = content;' +
'      state.out.product = content;' +
'      persist();' +
'      setStatus(\"status-offer\", \"Product outline ready.\");' +
'    }).catch(function(err){' +
'      setStatus(\"status-offer\", err.message || \"Unable to generate.\", true);' +
'    });' +
'  }' +
'  function handleFunnel(){' +
'    setStatus(\"status-funnel\", \"Building funnel copy...\");' +
'    var prompt = \"Write a one-page VSL for \" + (state.pname || \"the offer\") + \": Hero (H1, Sub, CTA), Promise + Proof, Demo section, 7 bullets, Guarantee, CTA. Also write 3 abandoned cart emails and 2 SMS reminders.\";' +
'    callOpenAI(prompt, function(){ return demo.funnel(state.pname); }).then(function(content){' +
'      funnelOutput.value = content;' +
'      state.out.funnel = content;' +
'      persist();' +
'      setStatus(\"status-funnel\", \"Funnel assets generated.\");' +
'    }).catch(function(err){' +
'      setStatus(\"status-funnel\", err.message || \"Unable to generate.\", true);' +
'    });' +
'  }' +
'  function handleHooks(){' +
'    setStatus(\"status-content\", \"Spinning hooks...\");' +
'    var prompt = \"Generate 30 faceless short-form hooks (6–12 words) for the niche \" + (state.niche || state.audience || \"operators\") + \". High curiosity, no fluff.\";' +
'    callOpenAI(prompt, function(){ return demo.hooks(state.niche); }).then(function(content){' +
'      hooksOutput.value = content;' +
'      state.out.hooks = content;' +
'      persist();' +
'      setStatus(\"status-content\", \"Hooks generated.\");' +
'    }).catch(function(err){' +
'      setStatus(\"status-content\", err.message || \"Unable to generate.\", true);' +
'    });' +
'  }' +
'  function handleScripts(){' +
'    setStatus(\"status-content\", \"Writing scripts...\");' +
'    var prompt = \"Using these hooks, create 5 short-form scripts with HOOK + MEAT + CTA for \" + (state.pname || \"the offer\") + \". Keep under 120s.\";' +
'    callOpenAI(prompt, function(){ return demo.scripts(state.pname); }).then(function(content){' +
'      scriptsOutput.value = content;' +
'      state.out.scripts = content;' +
'      persist();' +
'      setStatus(\"status-content\", \"Scripts produced.\");' +
'    }).catch(function(err){' +
'      setStatus(\"status-content\", err.message || \"Unable to generate.\", true);' +
'    });' +
'  }' +
'  function handleCaptions(){' +
'    setStatus(\"status-content\", \"Crafting captions...\");' +
'    var prompt = \"Write a high-converting short caption and hashtag block for \" + (state.pname || \"the offer\") + \". Tone: cinematic, minimal.\";' +
'    callOpenAI(prompt, function(){ return demo.captions(state.pname || state.niche); }).then(function(content){' +
'      captionsOutput.value = content;' +
'      state.out.captions = content;' +
'      persist();' +
'      setStatus(\"status-content\", \"Caption ready.\");' +
'    }).catch(function(err){' +
'      setStatus(\"status-content\", err.message || \"Unable to generate.\", true);' +
'    });' +
'  }' +
'  function handleVoice(){' +
'    setStatus(\"status-voice\", \"Synthesizing voiceover...\");' +
'    var payload = {' +
'      text: voiceOutput.value' +
'    };' +
'    if (demoMode) {' +
'      setStatus(\"status-voice\", \"Voiceover demo requires ElevenLabs API key.\", true);' +
'      return;' +
'    }' +
'    fetch(\"/api/voice\", {' +
'      method: \"POST\",' +
'      headers: { \"Content-Type\": \"application/json\" },' +
'      body: JSON.stringify(payload)' +
'    }).then(function(res){' +
'      if (res.status === 400) {' +
'        enableDemoMode();' +
'        return res.json().then(function(data){' +
'          var msg = data && data.error ? data.error : \"Missing voice key\";' +
'          throw new Error(msg);' +
'        });' +
'      }' +
'      return res.json();' +
'    }).then(function(data){' +
'      if (!data.ok || !data.audio) {' +
'        throw new Error(data.error || \"Voice request failed\");' +
'      }' +
'      voiceAudio.src = data.audio;' +
'      voiceAudio.play();' +
'      state.out.voice = voiceOutput.value;' +
'      persist();' +
'      setStatus(\"status-voice\", \"Voiceover ready.\");' +
'    }).catch(function(err){' +
'      setStatus(\"status-voice\", err.message || \"Unable to synthesize.\", true);' +
'    });' +
'  }' +
'  document.getElementById(\"btn-niche\").addEventListener(\"click\", handleNiche);' +
'  document.getElementById(\"btn-offer\").addEventListener(\"click\", handleOffer);' +
'  document.getElementById(\"btn-product\").addEventListener(\"click\", handleProduct);' +
'  document.getElementById(\"btn-funnel\").addEventListener(\"click\", handleFunnel);' +
'  document.getElementById(\"btn-hooks\").addEventListener(\"click\", handleHooks);' +
'  document.getElementById(\"btn-scripts\").addEventListener(\"click\", handleScripts);' +
'  document.getElementById(\"btn-captions\").addEventListener(\"click\", handleCaptions);' +
'  document.getElementById(\"btn-voice\").addEventListener(\"click\", handleVoice);' +
'  demoToggle.addEventListener(\"change\", function(){' +
'    demoMode = demoToggle.checked;' +
'    updateDemoIndicator();' +
'    persist();' +
'  });' +
'  document.getElementById(\"btn-export\").addEventListener(\"click\", function(){' +
'    var exportData = JSON.stringify(state, null, 2);' +
'    var blob = new Blob([exportData], { type: \"application/json\" });' +
'    var url = URL.createObjectURL(blob);' +
'    var link = document.createElement(\"a\");' +
'    link.href = url;' +
'    var name = state.pname ? state.pname.toLowerCase().replace(/[^a-z0-9]+/g, \"-\") : \"ghost-systems-project\";' +
'    link.download = name + \".json\";' +
'    document.body.appendChild(link);' +
'    link.click();' +
'    document.body.removeChild(link);' +
'    URL.revokeObjectURL(url);' +
'    setStatus(\"status-settings\", \"Project JSON exported.\");' +
'  });' +
'  document.getElementById(\"btn-clear\").addEventListener(\"click\", function(){' +
'    localStorage.removeItem(storageKey);' +
'    localStorage.removeItem(demoKey);' +
'    location.reload();' +
'  });' +
'  if (!demoMode) {' +
'    setStatus(\"status-settings\", \"Connect API keys for live mode.\");' +
'  } else {' +
'    setStatus(\"status-settings\", \"Demo mode active.\");' +
'  }' +
'})();' +
'</script>' +
'</body>' +
'</html>';

app.get('/', (req, res) => {
  res.send(html);
});

app.listen(PORT, () => {
  console.log('Ghost Systems AI Factory running -> http://localhost:' + PORT);
});
