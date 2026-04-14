import { useState } from "react";

const TOTAL_STEPS = 7;

const STEP_CONFIG = [
  {
    key: "industry",
    label: "What industry or sector is your target customer in?",
    type: "text",
  },
  {
    key: "role",
    label: "What is their job title or role?",
    type: "text",
  },
  {
    key: "frustrations",
    label: "What are their biggest frustrations or challenges?",
    type: "textarea",
  },
  {
    key: "success",
    label: "What does success look like for them?",
    type: "textarea",
  },
  {
    key: "triggers",
    label: "What would make them consider a new solution?",
    type: "textarea",
  },
  {
    key: "objections",
    label: "What objections would they raise?",
    type: "textarea",
  },
  {
    key: "channels",
    label: "Where do they spend time online?",
    type: "textarea",
  },
];

const INITIAL_FORM = {
  industry: "",
  role: "",
  frustrations: "",
  success: "",
  triggers: "",
  objections: "",
  channels: "",
};

function ICPForm({ onSubmit }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [error, setError] = useState("");

  const currentConfig = STEP_CONFIG[step - 1];
  const currentValue = formData[currentConfig.key];

  const handleChange = (event) => {
    const { value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [currentConfig.key]: value,
    }));

    if (error && value.trim()) {
      setError("");
    }
  };

  const validateCurrentStep = () => {
    if (!currentValue.trim()) {
      setError("This field is required.");
      return false;
    }

    setError("");
    return true;
  };

  const handleBack = () => {
    setError("");
    setStep((prev) => Math.max(1, prev - 1));
  };

  const handleNext = () => {
    if (!validateCurrentStep()) {
      return;
    }

    if (step === TOTAL_STEPS) {
      onSubmit(formData);
      return;
    }

    setStep((prev) => Math.min(TOTAL_STEPS, prev + 1));
  };

  const renderField = () => {
    if (currentConfig.type === "textarea") {
      return (
        <textarea
          id={currentConfig.key}
          name={currentConfig.key}
          className="icp-form__textarea"
          value={currentValue}
          onChange={handleChange}
          rows={6}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${currentConfig.key}-error` : undefined}
        />
      );
    }

    return (
      <input
        id={currentConfig.key}
        name={currentConfig.key}
        type="text"
        className="icp-form__input"
        value={currentValue}
        onChange={handleChange}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${currentConfig.key}-error` : undefined}
      />
    );
  };

  return (
    <section className="icp-form" aria-label="ICP Form">
      <div className="icp-form__progress-wrap" aria-label="Form progress">
        <div className="icp-form__progress-meta">
          <span>Progress</span>
          <span>
            Step {step} of {TOTAL_STEPS}
          </span>
        </div>
        <div className="icp-form__progress-track">
          <div
            className={`icp-form__progress-fill icp-form__progress-fill--step-${step}`}
          />
        </div>
      </div>

      <div className="icp-form__step">
        <label className="icp-form__label" htmlFor={currentConfig.key}>
          {currentConfig.label}
        </label>
        {renderField()}
        {error ? (
          <p id={`${currentConfig.key}-error`} className="icp-form__error">
            {error}
          </p>
        ) : null}
      </div>

      <div className="icp-form__actions">
        {step > 1 ? (
          <button
            type="button"
            className="icp-form__button icp-form__button--secondary"
            onClick={handleBack}
          >
            Back
          </button>
        ) : (
          <span className="icp-form__spacer" />
        )}
        <button
          type="button"
          className="icp-form__button icp-form__button--primary"
          onClick={handleNext}
        >
          {step === TOTAL_STEPS ? "Generate ICP" : "Next"}
        </button>
      </div>
    </section>
  );
}

export default ICPForm;
