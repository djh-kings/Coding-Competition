// Pyodide Web Worker — runs Python with blocking stdin via SharedArrayBuffer
const PYODIDE_VERSION = "0.26.2";
const PYODIDE_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

let pyodide = null;

async function loadPy() {
  if (pyodide) return pyodide;
  importScripts(`${PYODIDE_URL}pyodide.js`);
  pyodide = await loadPyodide({ indexURL: PYODIDE_URL });
  return pyodide;
}

self.onmessage = async (e) => {
  const { type, code, language, controlBuf, dataBuf } = e.data;

  if (type !== "run") return;

  if (language !== "python") {
    // JavaScript: simple eval with console capture
    let stdout = "";
    let stderr = "";
    const sandboxConsole = {
      log: (...args) => { stdout += args.join(" ") + "\n"; self.postMessage({ type: "stdout", text: args.join(" ") + "\n" }); },
      error: (...args) => { stderr += args.join(" ") + "\n"; self.postMessage({ type: "stderr", text: args.join(" ") + "\n" }); },
      warn: (...args) => { self.postMessage({ type: "stderr", text: args.join(" ") + "\n" }); },
    };
    try {
      const fn = new Function("console", `return (async () => { ${code}\n })()`);
      await fn(sandboxConsole);
      self.postMessage({ type: "done", exitCode: 0 });
    } catch (err) {
      self.postMessage({ type: "stderr", text: err.message + "\n" });
      self.postMessage({ type: "done", exitCode: 1 });
    }
    return;
  }

  // Python via Pyodide
  const control = new Int32Array(controlBuf); // [0]=state: 0=idle,1=data_ready  [1]=data_len
  const dataArr = new Uint8Array(dataBuf);

  try {
    const py = await loadPy();

    py.setStdout({
      raw: (charCode) => self.postMessage({ type: "stdout_char", char: String.fromCharCode(charCode) }),
    });
    py.setStderr({
      raw: (charCode) => self.postMessage({ type: "stderr_char", char: String.fromCharCode(charCode) }),
    });
    py.setStdin({
      stdin: () => {
        // Signal main thread we need input
        self.postMessage({ type: "input_needed" });
        // Block until main thread writes data (Atomics.wait blocks the worker thread)
        Atomics.wait(control, 0, 0); // wait while control[0] === 0
        // Read the input
        const len = control[1];
        const bytes = dataArr.slice(0, len);
        const text = new TextDecoder().decode(bytes);
        // Reset for next call
        Atomics.store(control, 0, 0);
        Atomics.store(control, 1, 0);
        return text;
      },
    });

    await py.runPythonAsync(code);
    self.postMessage({ type: "done", exitCode: 0 });
  } catch (err) {
    self.postMessage({ type: "stderr", text: err.message + "\n" });
    self.postMessage({ type: "done", exitCode: 1 });
  }
};
