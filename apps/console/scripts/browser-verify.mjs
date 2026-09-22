import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';

const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const port = 9200 + (process.pid % 500);
const targetUrl = process.env.TARGET_URL || 'http://localhost:3000/login';
const outputDir = resolve(process.cwd(), process.argv[2] || '.codex/artifacts/ui-component-pilot-v2/pass-1');
const stage = basename(outputDir);
const userDataDir = mkdtempSync(join(tmpdir(), 'rustzen-browser-verify-'));

mkdirSync(outputDir, { recursive: true });
rmSync(resolve(outputDir, 'failure.json'), { force: true });

const chromeProcess = spawn(chromePath, [
  '--headless=new',
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${userDataDir}`,
  '--no-first-run',
  '--no-default-browser-check',
  '--window-size=1440,900',
  'about:blank',
], { stdio: 'ignore' });

const sleep = (ms) => new Promise((resolvePromise) => setTimeout(resolvePromise, ms));

function assert(condition, message) {
  if (!condition) throw new Error(`Acceptance failed: ${message}`);
}

async function createNewPage(url = 'about:blank') {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent(url)}`, { method: 'PUT' });
      if (response.ok) {
        const page = await response.json();
        if (page.webSocketDebuggerUrl) return page.webSocketDebuggerUrl;
      }
    } catch {
      // Chrome may still be starting.
    }
    await sleep(150);
  }
  throw new Error('Could not create a Chrome page target');
}

class CDPClient {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.id = 1;
    this.pending = new Map();
    this.consoleLogs = [];
    this.runtimeExceptions = [];
  }

  async connect() {
    return new Promise((resolvePromise, reject) => {
      this.ws.onopen = resolvePromise;
      this.ws.onerror = reject;
      this.ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (message.id && this.pending.has(message.id)) {
          const pending = this.pending.get(message.id);
          clearTimeout(pending.timeout);
          this.pending.delete(message.id);
          if (message.error) pending.reject(new Error(`[${pending.method}] ${message.error.message}`));
          else pending.resolve(message.result);
          return;
        }
        if (message.method === 'Runtime.consoleAPICalled') {
          this.consoleLogs.push({
            type: message.params.type,
            args: message.params.args.map((argument) => argument.value ?? argument.description),
            timestamp: message.params.timestamp,
          });
        } else if (message.method === 'Log.entryAdded') {
          this.consoleLogs.push({
            type: message.params.entry.level,
            text: message.params.entry.text,
            source: message.params.entry.source,
            timestamp: message.params.entry.timestamp,
          });
        } else if (message.method === 'Runtime.exceptionThrown') {
          this.runtimeExceptions.push(message.params.exceptionDetails);
        }
      };
    });
  }

  async send(method, params = {}, timeoutMs = 8000) {
    const id = this.id;
    this.id += 1;
    return new Promise((resolvePromise, reject) => {
      const timeout = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`[${method}] timed out after ${timeoutMs}ms`));
      }, timeoutMs);
      this.pending.set(id, { method, resolve: resolvePromise, reject, timeout });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async evaluate(expression, label = 'Runtime.evaluate') {
    const result = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
      userGesture: true,
    });
    if (result.exceptionDetails) {
      const detail = result.exceptionDetails.exception?.description || result.exceptionDetails.text || 'unknown exception';
      throw new Error(`${label} failed: ${detail}`);
    }
    if (result.result?.subtype === 'error') {
      throw new Error(`${label} failed: ${result.result.description || 'runtime error'}`);
    }
    return result.result?.value;
  }

  async waitFor(expression, label, timeoutMs = 15000) {
    const startedAt = Date.now();
    while (Date.now() - startedAt < timeoutMs) {
      if (await this.evaluate(`Boolean(${expression})`, label)) return;
      await sleep(150);
    }
    throw new Error(`${label} timed out after ${timeoutMs}ms`);
  }

  async navigate(url, selector) {
    await this.send('Page.navigate', { url });
    await this.waitFor(`document.readyState === 'complete' && document.querySelector(${JSON.stringify(selector)})`, `navigate ${url}`);
    await sleep(300);
  }

  async screenshot(filename) {
    const capture = await this.send('Page.captureScreenshot', { format: 'png' }, 20000);
    writeFileSync(resolve(outputDir, filename), Buffer.from(capture.data, 'base64'));
  }

  async click(selector, label) {
    const point = await this.evaluate(`(() => {
      const element = document.querySelector(${JSON.stringify(selector)});
      if (!element) throw new Error('Missing click target: ${selector}');
      const box = element.getBoundingClientRect();
      return { x: box.left + box.width / 2, y: box.top + box.height / 2 };
    })()`, `locate ${label}`);
    await this.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: point.x, y: point.y, button: 'left', clickCount: 1 });
    await this.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: point.x, y: point.y, button: 'left', clickCount: 1 });
  }

  close() {
    this.ws.close();
  }
}

async function setupClient(width, height, mobile = false) {
  const client = new CDPClient(await createNewPage());
  await client.connect();
  await client.send('Page.enable');
  await client.send('Runtime.enable');
  await client.send('Log.enable');
  await client.send('Input.setIgnoreInputEvents', { ignore: false });
  await client.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile });
  return client;
}

async function stopChromeAndRemoveProfile() {
  if (chromeProcess.exitCode === null) {
    const exited = new Promise((resolvePromise) => chromeProcess.once('exit', resolvePromise));
    chromeProcess.kill('SIGTERM');
    await Promise.race([exited, sleep(2000)]);
  }

  let cleanupError;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      rmSync(userDataDir, { recursive: true, force: true });
      return;
    } catch (error) {
      cleanupError = error;
      await sleep(150 * (attempt + 1));
    }
  }
  throw cleanupError;
}

const elementMetricsExpression = `
  (() => {
    function read(selector, name) {
      const element = document.querySelector(selector);
      if (!element) return { name, found: false };
      const box = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return {
        name,
        found: true,
        tagName: element.tagName,
        id: element.id,
        boundingBox: { x: box.x, y: box.y, width: box.width, height: box.height },
        computedStyles: {
          backgroundColor: style.backgroundColor,
          color: style.color,
          borderRadius: style.borderRadius,
          borderColor: style.borderColor,
          boxShadow: style.boxShadow,
          opacity: style.opacity,
        },
      };
    }
    return {
      html: {
        className: document.documentElement.className,
        colorScheme: getComputedStyle(document.documentElement).colorScheme,
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
      },
      body: {
        backgroundColor: getComputedStyle(document.body).backgroundColor,
        color: getComputedStyle(document.body).color,
        fontFamily: getComputedStyle(document.body).fontFamily,
      },
      card: read('[class*="bg-card"]', 'Card'),
      usernameInput: read('#username', 'Username Input'),
      passwordInput: read('#password', 'Password Input'),
      submitButton: read('button[type="submit"]', 'Submit Button'),
      themeToggle: read('button[aria-label="Toggle color theme"]', 'Theme Toggle'),
    };
  })()
`;

async function captureTabSequence(client) {
  await client.evaluate(`(() => {
    document.body.setAttribute('tabindex', '-1');
    document.body.focus();
    document.body.removeAttribute('tabindex');
  })()`, 'reset keyboard focus');

  const sequence = [];
  for (let step = 1; step <= 4; step += 1) {
    await client.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
    await client.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
    await sleep(80);
    const focused = await client.evaluate(`(() => {
      const element = document.activeElement;
      const style = getComputedStyle(element);
      return {
        step: ${step},
        tagName: element?.tagName,
        id: element?.id || '',
        type: element?.getAttribute('type'),
        ariaLabel: element?.getAttribute('aria-label'),
        text: (element?.textContent || '').trim(),
        focusStyles: { outline: style.outline, boxShadow: style.boxShadow },
      };
    })()`, `Tab step ${step}`);
    sequence.push(focused);
    await client.screenshot(`tab-focus-step-${step}.png`);
  }
  return sequence;
}

async function run() {
  let desktopClient;
  let mobileClient;
  try {
    desktopClient = await setupClient(1440, 900);
    await desktopClient.navigate(targetUrl, '#username');

    const initiallyDark = await desktopClient.evaluate(`document.documentElement.classList.contains('dark')`, 'read initial theme');
    if (initiallyDark) {
      await desktopClient.click('button[aria-label="Toggle color theme"]', 'theme toggle');
      await desktopClient.waitFor(`!document.documentElement.classList.contains('dark')`, 'wait for light theme');
    }

    const light = await desktopClient.evaluate(elementMetricsExpression, 'read light metrics');
    await desktopClient.screenshot('login-desktop-1440x900.png');

    const tabSequence = await captureTabSequence(desktopClient);
    const tabIdentities = tabSequence.map((entry) => entry.ariaLabel || entry.id || `${entry.tagName}:${entry.type}`);
    assert(JSON.stringify(tabIdentities) === JSON.stringify(['Toggle color theme', 'username', 'password', 'BUTTON:submit']), `unexpected Tab order: ${tabIdentities.join(' -> ')}`);
    assert(tabSequence.every((entry) => entry.type !== 'hidden'), 'hidden input entered the keyboard Tab order');

    await desktopClient.navigate(targetUrl, '#username');
    const validation = await desktopClient.evaluate(`(() => {
      const form = document.querySelector('form');
      form.requestSubmit();
      const username = document.querySelector('#username');
      const password = document.querySelector('#password');
      return {
        formValid: form.checkValidity(),
        usernameInvalid: username.matches(':invalid'),
        passwordInvalid: password.matches(':invalid'),
        activeId: document.activeElement?.id || '',
        usernameValidationMessage: username.validationMessage,
      };
    })()`, 'native empty-submit validation');
    await sleep(150);
    await desktopClient.screenshot('form-validation-empty.png');
    assert(!validation.formValid && validation.usernameInvalid && validation.passwordInvalid, 'empty required fields were not rejected');
    assert(validation.activeId === 'username', `empty submit did not focus username (active=${validation.activeId})`);

    const errorUrl = new URL(targetUrl);
    errorUrl.searchParams.set('error', 'invalid');
    await desktopClient.navigate(errorUrl.toString(), '[role="alert"]');
    const errorAlert = await desktopClient.evaluate(`(() => {
      const alert = document.querySelector('[role="alert"]');
      const title = alert.querySelector('h1, h2, h3, h4, h5, h6');
      const description = alert.querySelector('p');
      const alertStyle = getComputedStyle(alert);
      const descriptionStyle = getComputedStyle(description);
      return {
        text: alert.textContent.trim(),
        titleTag: title?.tagName,
        color: alertStyle.color,
        borderColor: alertStyle.borderColor,
        descriptionColor: descriptionStyle.color,
        descriptionOpacity: descriptionStyle.opacity,
      };
    })()`, 'read rendered error Alert');
    await desktopClient.screenshot('login-error-desktop-1440x900.png');
    assert(errorAlert.text.includes('Sign in failed') && errorAlert.text.includes('Invalid username or password.'), 'error Alert copy is missing');
    assert(errorAlert.descriptionColor === errorAlert.color, 'Alert description does not inherit the variant color');
    assert(Number(errorAlert.descriptionOpacity) < 1, 'Alert description emphasis is not reduced');

    await desktopClient.navigate(targetUrl, '#username');
    await desktopClient.click('button[aria-label="Toggle color theme"]', 'theme toggle');
    await desktopClient.waitFor(`document.documentElement.classList.contains('dark')`, 'wait for dark theme');
    const dark = await desktopClient.evaluate(elementMetricsExpression, 'read dark metrics');
    await desktopClient.screenshot('login-dark-desktop-1440x900.png');
    assert(dark.card.found && dark.usernameInput.found && dark.submitButton.found, 'dark theme metrics are incomplete');
    assert(dark.html.colorScheme === 'dark', `dark color-scheme was not applied (${dark.html.colorScheme})`);

    mobileClient = await setupClient(390, 844);
    await mobileClient.navigate(targetUrl, '#username');
    const mobile = await mobileClient.evaluate(`(() => ({
      viewport: { width: 390, height: 844 },
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      hasHorizontalScroll: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      cardWidth: document.querySelector('.max-w-md')?.getBoundingClientRect().width,
    }))()`, 'read mobile metrics');
    await mobileClient.screenshot('login-mobile-390x844.png');
    assert(!mobile.hasHorizontalScroll && mobile.clientWidth === 390, 'mobile viewport has horizontal overflow');

    const runtimeFailures = [desktopClient, mobileClient].flatMap((client) => [
      ...client.runtimeExceptions.map((exception) => ({ type: 'runtime-exception', exception })),
      ...client.consoleLogs.filter((entry) => ['error', 'warning'].includes(entry.type)),
    ]);
    assert(runtimeFailures.length === 0, `browser recorded ${runtimeFailures.length} runtime error(s) or warning(s)`);

    const evidence = { stage, targetUrl, light, dark, mobile, validation, errorAlert };
    writeFileSync(resolve(outputDir, 'metrics-and-computed-styles.json'), JSON.stringify(evidence, null, 2));
    writeFileSync(resolve(outputDir, 'tab-sequence.json'), JSON.stringify(tabSequence, null, 2));
    writeFileSync(resolve(outputDir, 'console-logs.json'), JSON.stringify({
      desktop: desktopClient.consoleLogs,
      mobile: mobileClient.consoleLogs,
      runtimeExceptions: [...desktopClient.runtimeExceptions, ...mobileClient.runtimeExceptions],
    }, null, 2));
    writeFileSync(resolve(outputDir, `${stage}-summary.md`), `# UI governance browser verification: ${stage}\n\n- Target: \`${targetUrl}\`\n- Desktop: 1440 × 900\n- Mobile: 390 × 844\n- Real keyboard order: ${tabIdentities.join(' -> ')}\n- Empty-submit validation: passed\n- Error Alert: passed\n- Light/Dark: passed\n- Console/runtime failures: 0\n- Verdict: Pass\n`);
  } finally {
    mobileClient?.close();
    desktopClient?.close();
    await stopChromeAndRemoveProfile();
  }
}

run().catch((error) => {
  writeFileSync(resolve(outputDir, 'failure.json'), JSON.stringify({ stage, message: error.message, stack: error.stack }, null, 2));
  console.error(`Browser verification failed: ${error.message}`);
  process.exitCode = 1;
});
