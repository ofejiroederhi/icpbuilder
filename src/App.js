import { useCallback, useState } from "react";
import ICPForm from "./components/ICPForm";
import ICPOutput from "./components/ICPOutput";
import "./styles/App.css";
import "./styles/components.css";

const sendDebugLog = (payload) => {
  // #region agent log
  fetch("http://127.0.0.1:7327/ingest/bcbb38aa-dc86-4adc-97cf-1331903d0cb8", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "bb765e",
    },
    body: JSON.stringify({
      sessionId: "bb765e",
      runId: "icp-post-debug",
      ...payload,
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
};

const INITIAL_STATE = {
  status: "form",
  content: "",
  error: "",
};

function App() {
  const [status, setStatus] = useState(INITIAL_STATE.status);
  const [content, setContent] = useState(INITIAL_STATE.content);
  const [error, setError] = useState(INITIAL_STATE.error);
  const [formKey, setFormKey] = useState(0);

  const resetToForm = useCallback((clearForm = false) => {
    setStatus("form");
    setContent("");
    setError("");

    if (clearForm) {
      setFormKey((prev) => prev + 1);
    }
  }, []);

  const handleSubmit = useCallback(async (answersJSON) => {
    // #region agent log
    const endpoint = "/.netlify/functions/generate-icp";
    sendDebugLog({
      hypothesisId: "H1",
      location: "src/App.js:49",
      message: "Submitting ICP request",
      data: {
        endpoint,
        origin: window.location.origin,
        pathname: window.location.pathname,
      },
    });
    // #endregion
    setStatus("loading");
    setError("");

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(answersJSON),
      });

      const responseText = await response.text();
      // #region agent log
      sendDebugLog({
        hypothesisId: "H2",
        location: "src/App.js:72",
        message: "ICP request response received",
        data: {
          status: response.status,
          ok: response.ok,
          bodyPreview: responseText.slice(0, 100),
        },
      });
      // #endregion

      if (!response.ok) {
        let message = "Something went wrong while generating your ICP.";

        try {
          const parsed = JSON.parse(responseText);
          if (parsed && typeof parsed.error === "string" && parsed.error.trim()) {
            message = parsed.error;
          }
        } catch (parseError) {
          if (responseText.trim()) {
            message = responseText;
          }
        }

        throw new Error(message);
      }

      setContent(responseText);
      setStatus("result");
    } catch (requestError) {
      // #region agent log
      sendDebugLog({
        hypothesisId: "H3",
        location: "src/App.js:104",
        message: "ICP request threw error",
        data: {
          error:
            requestError instanceof Error ? requestError.message : "unknown error",
        },
      });
      // #endregion
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unexpected error. Please try again."
      );
      setStatus("error");
    }
  }, []);

  const handleRetry = useCallback(() => {
    resetToForm(true);
  }, [resetToForm]);

  const handleReset = useCallback(() => {
    resetToForm(true);
  }, [resetToForm]);

  return (
    <div className="app">
      <header className="app__header">
        <div className="app__header-inner">
          <h1 className="app__title">ICP Builder</h1>
          <p className="app__tagline">
            Turn raw customer insights into a polished ideal customer profile.
          </p>
        </div>
      </header>

      <main className="app__main">
        {status === "form" ? <ICPForm key={formKey} onSubmit={handleSubmit} /> : null}

        {status === "loading" ? (
          <section className="app__loading" aria-live="polite">
            <div className="app__spinner" aria-hidden="true" />
            <p className="app__loading-text">Building your ICP...</p>
          </section>
        ) : null}

        {status === "result" ? (
          <ICPOutput content={content} onReset={handleReset} />
        ) : null}

        {status === "error" ? (
          <section className="app__error" role="alert">
            <h2 className="app__error-title">We could not generate your ICP</h2>
            <p className="app__error-message">{error}</p>
            <button
              type="button"
              className="app__retry-button"
              onClick={handleRetry}
            >
              Retry
            </button>
          </section>
        ) : null}
      </main>
    </div>
  );
}

export default App;
