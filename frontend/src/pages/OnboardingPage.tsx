import { useState } from 'react';
import { ProfileChip } from '../components/Chips';
import { PrimaryButton } from '../components/Buttons';
import { PawAvatar } from '../components/PawAvatar';
import { Icon } from '../components/Icon';
import { dataService } from '../services/dataService';

export type OnboardingAnswers = Record<string, string[]>;

// Screen 12: five quick questions, one per screen.
export function OnboardingPage({ onDone, onSkip }: { onDone: (a: OnboardingAnswers) => void; onSkip: () => void }) {
  const questions = dataService.getOnboardingQuestions();
  const [step, setStep] = useState(-1); // -1 = welcome
  const [answers, setAnswers] = useState<OnboardingAnswers>({});

  if (step === -1) {
    return (
      <div className="page onboarding welcome">
        <div className="welcome-body">
          <div className="welcome-mark">
            <PawAvatar size={72} />
          </div>
          <h1>
            U<b>Compass</b>
          </h1>
          <p className="tagline">One campus. One conversation.</p>
          <p className="welcome-copy">Hi, I’m Paw. Answer five quick questions and I’ll tailor what you see. About 30 seconds.</p>
        </div>
        <div className="onb-footer">
          <PrimaryButton block size="lg" onClick={() => setStep(0)}>
            Get started
          </PrimaryButton>
          <button className="link-btn center" onClick={onSkip}>
            Skip for now
          </button>
        </div>
      </div>
    );
  }

  const q = questions[step];
  const selected = answers[q.id] ?? [];
  const toggle = (opt: string) => {
    setAnswers((a) => {
      const cur = a[q.id] ?? [];
      const next = q.multi ? (cur.includes(opt) ? cur.filter((x) => x !== opt) : [...cur, opt]) : [opt];
      return { ...a, [q.id]: next };
    });
  };
  const isLast = step === questions.length - 1;
  const next = () => (isLast ? onDone(answers) : setStep(step + 1));

  return (
    <div className="page onboarding">
      <header className="onb-header">
        <button className="icon-btn icon-btn-ghost" aria-label="Back" onClick={() => setStep(step - 1)}>
          <Icon name="chevronLeft" size={22} />
        </button>
        <div className="progress" role="progressbar" aria-valuemin={1} aria-valuemax={questions.length} aria-valuenow={step + 1}>
          {questions.map((_, i) => (
            <span key={i} className={i <= step ? 'is-done' : ''} />
          ))}
        </div>
        <button className="link-btn" onClick={next}>
          Skip
        </button>
      </header>

      <div className="scroll onb-body" key={q.id}>
        <span className="eyebrow">
          Question {step + 1} of {questions.length}
        </span>
        <h1>{q.title}</h1>
        <p className="onb-helper">{q.helper}</p>
        <div className={`onb-options ${q.options.length > 5 ? 'is-wrap' : ''}`}>
          {q.options.map((o) => (
            <ProfileChip key={o} label={o} selected={selected.includes(o)} onClick={() => toggle(o)} large={q.options.length <= 5} />
          ))}
        </div>
      </div>

      <div className="onb-footer">
        <PrimaryButton block size="lg" onClick={next} disabled={selected.length === 0}>
          {isLast ? 'Finish' : 'Continue'}
        </PrimaryButton>
      </div>
    </div>
  );
}
