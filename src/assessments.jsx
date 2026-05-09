import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Clock } from 'lucide-react';
import { Button, Card, PercentileBadge, ProgressRail } from './components';
import { SDMT_KEY_MAP, STROOP_COLORS, VERBAL_WORD_BANK } from './clinicalModel';

const useReactionClock = () => {
  const startRef = useRef(0);

  const start = async () =>
    new Promise((resolve) => {
      requestAnimationFrame(() => {
        startRef.current = performance.now();
        resolve(startRef.current);
      });
    });

  const stop = () => Math.round(performance.now() - startRef.current);

  return { start, stop };
};

const ScreenShell = ({ title, subtitle, progress, children }) => (
  <div className="mx-auto flex h-full w-full max-w-5xl flex-col px-6 py-8">
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div>
        <h2 className="font-display text-3xl text-slate-900">{title}</h2>
        <p className="mt-2 text-sm text-slate-600">{subtitle}</p>
      </div>
      {progress}
    </div>
    <Card className="flex-1 p-6 md:p-8">{children}</Card>
  </div>
);

export const OrientationAssessment = ({ result, onComplete }) => {
  const items = [
    'Correct date',
    'Correct month',
    'Correct year',
    'Correct day of week',
    'Correct clinic / location',
    'Correct city',
  ];
  const [responses, setResponses] = useState(result?.items ?? items.map((label) => ({ label, correct: false })));
  const [notes, setNotes] = useState(result?.notes ?? '');

  const score = responses.filter((item) => item.correct).length;

  return (
    <ScreenShell
      title="Orientation Screen"
      subtitle="Mark each item after clinician administration. This covers office-screen orientation domains without reproducing the proprietary MoCA wording."
      progress={<div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600">{score}/6 correct</div>}
    >
      <div className="grid gap-4 lg:grid-cols-[1.4fr_0.9fr]">
        <div className="space-y-3">
          {responses.map((item, index) => (
            <div key={item.label} className="flex items-center justify-between rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Item {index + 1}</div>
                <div className="mt-1 text-base font-medium text-slate-900">{item.label}</div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={item.correct ? 'accent' : 'secondary'}
                  size="sm"
                  onClick={() => setResponses((current) => current.map((entry, entryIndex) => (entryIndex === index ? { ...entry, correct: true } : entry)))}
                >
                  Correct
                </Button>
                <Button
                  variant={!item.correct ? 'quiet' : 'secondary'}
                  size="sm"
                  onClick={() => setResponses((current) => current.map((entry, entryIndex) => (entryIndex === index ? { ...entry, correct: false } : entry)))}
                >
                  Missed
                </Button>
              </div>
            </div>
          ))}
        </div>
        <div className="space-y-4">
          <div className="rounded-[28px] bg-slate-950 px-5 py-6 text-white">
            <div className="text-xs uppercase tracking-[0.18em] text-white/60">Scoring</div>
            <div className="mt-4 text-5xl font-semibold">{score}</div>
            <div className="mt-2 text-sm text-white/70">out of 6 orientation points</div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Clinician notes</label>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="min-h-[160px] w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-teal-300"
              placeholder="Disorientation pattern, cueing needed, or contextual concerns."
            />
          </div>
          <Button
            variant="accent"
            size="lg"
            onClick={() =>
              onComplete({
                score,
                items: responses,
                notes,
              })
            }
          >
            Save Orientation Score
          </Button>
        </div>
      </div>
    </ScreenShell>
  );
};

export const SymbolMatchAssessment = ({ result: _result, onComplete }) => {
  const [phase, setPhase] = useState('instruction');
  const [timeLeft, setTimeLeft] = useState(90);
  const [currentSymbol, setCurrentSymbol] = useState(null);
  const [responses, setResponses] = useState([]);
  const [practiceCorrect, setPracticeCorrect] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const clock = useReactionClock();

  const generateSymbol = async () => {
    let nextIndex = Math.floor(Math.random() * SDMT_KEY_MAP.length);
    while (currentSymbol && SDMT_KEY_MAP[nextIndex].sym === currentSymbol.sym) {
      nextIndex = Math.floor(Math.random() * SDMT_KEY_MAP.length);
    }
    setCurrentSymbol(SDMT_KEY_MAP[nextIndex]);
    await clock.start();
  };

  useEffect(() => {
    if (phase !== 'test') return undefined;
    const interval = setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1) {
          setPhase('complete');
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'complete') return;
    const correct = responses.filter((entry) => entry.isCorrect);
    const rts = correct.map((entry) => entry.rtMs);
    const mean = rts.length ? rts.reduce((sum, value) => sum + value, 0) / rts.length : 0;
    const sd = rts.length > 1 ? Math.sqrt(rts.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (rts.length - 1)) : 0;
    const sorted = [...rts].sort((left, right) => left - right);
    onComplete({
      throughput: correct.length,
      errors: responses.length - correct.length,
      accuracy: responses.length ? Math.round((correct.length / responses.length) * 100) : 0,
      meanRtMs: Math.round(mean),
      medianRtMs: sorted.length ? Math.round(sorted[Math.floor(sorted.length / 2)]) : 0,
      cvRt: mean > 0 ? Number(((sd / mean) * 100).toFixed(1)) : 0,
      totalTrials: responses.length,
    });
  }, [phase, responses, onComplete]);

  const handleInput = async (number) => {
    if (!currentSymbol) return;
    const rtMs = clock.stop();
    const isCorrect = currentSymbol.num === number;

    if (phase === 'practice') {
      setFeedback(isCorrect ? 'Correct' : 'Try again');
      if (isCorrect) {
        const nextCount = practiceCorrect + 1;
        setPracticeCorrect(nextCount);
        if (nextCount >= 4) {
          setTimeout(async () => {
            setPhase('test');
            setFeedback(null);
            await generateSymbol();
          }, 500);
          return;
        }
      }
      setTimeout(async () => {
        setFeedback(null);
        await generateSymbol();
      }, 400);
      return;
    }

    setResponses((current) => [...current, { symbol: currentSymbol.sym, number, isCorrect, rtMs }]);
    await generateSymbol();
  };

  if (phase === 'instruction') {
    return (
      <ScreenShell title="Symbol Match" subtitle="A Creyos-style speed task: match each symbol to the correct number as quickly and accurately as possible.">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.9fr]">
          <div className="grid grid-cols-3 gap-3 md:grid-cols-9">
            {SDMT_KEY_MAP.map((entry) => (
              <div key={entry.num} className="rounded-3xl border border-slate-200 bg-slate-50 p-3 text-center">
                <div className="text-3xl">{entry.sym}</div>
                <div className="mt-2 border-t border-slate-200 pt-2 text-sm font-semibold text-slate-600">{entry.num}</div>
              </div>
            ))}
          </div>
          <div className="flex flex-col justify-between rounded-[28px] bg-slate-950 p-6 text-white">
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-white/60">Flow</div>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-white/80">
                <li>4 correct practice items to verify understanding.</li>
                <li>90-second scored block with trial-level reaction times.</li>
                <li>Outputs throughput, accuracy, and variability for longitudinal review.</li>
              </ul>
            </div>
            <Button variant="accent" size="lg" onClick={async () => {
              setPhase('practice');
              await generateSymbol();
            }}>
              Begin Practice
            </Button>
          </div>
        </div>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell
      title="Symbol Match"
      subtitle={phase === 'practice' ? 'Practice until four correct responses are completed.' : 'Choose the matching number as quickly as possible.'}
      progress={
        <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">
          {phase === 'practice' ? `Practice ${practiceCorrect}/4` : `${Math.floor(timeLeft / 60)}:${String(timeLeft % 60).padStart(2, '0')}`}
        </div>
      }
    >
      <div className="grid gap-6">
        <div className="grid grid-cols-3 gap-3 md:grid-cols-9">
          {SDMT_KEY_MAP.map((entry) => (
            <div key={entry.num} className="rounded-3xl border border-slate-200 bg-slate-50 p-3 text-center">
              <div className="text-2xl">{entry.sym}</div>
              <div className="mt-2 border-t border-slate-200 pt-2 text-xs font-semibold text-slate-500">{entry.num}</div>
            </div>
          ))}
        </div>
        <div className="flex flex-col items-center justify-center gap-8 rounded-[32px] bg-slate-50 p-6">
          {feedback ? <div className="text-2xl font-semibold text-teal-700">{feedback}</div> : null}
          <div className="flex h-44 w-44 items-center justify-center rounded-[36px] border-4 border-slate-900 bg-white text-7xl shadow-lg">
            {currentSymbol?.sym ?? '·'}
          </div>
          <div className="grid w-full max-w-3xl grid-cols-3 gap-3 md:grid-cols-9">
            {SDMT_KEY_MAP.map((entry) => (
              <button
                key={entry.num}
                onPointerDown={() => handleInput(entry.num)}
                className="aspect-square rounded-3xl border border-slate-200 bg-white text-2xl font-semibold text-slate-800 transition hover:-translate-y-0.5 hover:border-teal-300 hover:bg-teal-50"
              >
                {entry.num}
              </button>
            ))}
          </div>
        </div>
      </div>
    </ScreenShell>
  );
};

const TrailCanvas = ({ mode, onComplete }) => {
  const isSwitching = mode === 'trailB';
  const [phase, setPhase] = useState('instruction');
  const [currentTarget, setCurrentTarget] = useState(isSwitching ? 0 : 1);
  const [startTime, setStartTime] = useState(null);
  const [errors, setErrors] = useState(0);
  const [path, setPath] = useState([]);
  const [positions, setPositions] = useState([]);
  const canvasRef = useRef(null);

  const sequence = useMemo(
    () => (isSwitching ? ['1', 'A', '2', 'B', '3', 'C', '4', 'D', '5', 'E', '6', 'F', '7', 'G', '8', 'H', '9', 'I', '10', 'J', '11', 'K', '12', 'L', '13'] : Array.from({ length: 25 }, (_, index) => String(index + 1))),
    [isSwitching],
  );

  useEffect(() => {
    const grid = [];
    const gridSize = 5;
    const cellSize = 60;
    const margin = 38;
    for (let row = 0; row < gridSize; row += 1) {
      for (let column = 0; column < gridSize; column += 1) {
        grid.push({
          x: margin + column * cellSize + (Math.random() - 0.5) * 16,
          y: margin + row * cellSize + (Math.random() - 0.5) * 16,
        });
      }
    }
    const shuffled = [...grid].sort(() => Math.random() - 0.5).slice(0, 25);
    setPositions(
      sequence.map((label, index) => ({
        id: isSwitching ? index : Number(label),
        label,
        x: shuffled[index].x,
        y: shuffled[index].y,
        isLetter: Number.isNaN(Number(label)),
      })),
    );
  }, [isSwitching, sequence]);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
    if (path.length < 2) return;
    context.strokeStyle = isSwitching ? '#d08b17' : '#0f8b8d';
    context.lineWidth = 3;
    context.lineCap = 'round';
    context.beginPath();
    context.moveTo(path[0].x + 20, path[0].y + 20);
    for (let index = 1; index < path.length; index += 1) {
      context.lineTo(path[index].x + 20, path[index].y + 20);
    }
    context.stroke();
  }, [isSwitching, path]);

  const handleTap = (target) => {
    if (phase !== 'test') return;
    if (target.id === currentTarget) {
      const nextPath = [...path, target];
      setPath(nextPath);
      const finished = currentTarget === (isSwitching ? sequence.length - 1 : 25);
      if (finished) {
        onComplete({
          completionTimeMs: Math.round(performance.now() - startTime),
          errors,
          sequenceType: mode,
        });
        return;
      }
      setCurrentTarget((current) => current + 1);
      return;
    }
    setErrors((current) => current + 1);
  };

  if (phase === 'instruction') {
    return (
      <ScreenShell
        title={isSwitching ? 'Trail Connect B' : 'Trail Connect A'}
        subtitle={isSwitching ? 'Alternate between numbers and letters to measure set shifting.' : 'Connect targets in numerical order to capture visual scanning and speed.'}
      >
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[32px] border border-slate-200 bg-slate-50 p-6">
            <div className="font-display text-2xl text-slate-900">{isSwitching ? 'Pattern' : 'Flow'}</div>
            <p className="mt-4 text-sm leading-6 text-slate-600">
              {isSwitching ? 'Tap 1 → A → 2 → B → 3 → C and continue until the board is completed.' : 'Tap 1 → 2 → 3 and continue through 25 as quickly as you can without sacrificing accuracy.'}
            </p>
          </div>
          <div className="flex flex-col justify-between rounded-[32px] bg-slate-950 p-6 text-white">
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-white/60">Captured</div>
              <ul className="mt-4 space-y-3 text-sm text-white/75">
                <li>Completion time in milliseconds</li>
                <li>Error count</li>
                <li>Switching inefficiency compared with other domains</li>
              </ul>
            </div>
            <Button
              variant={isSwitching ? 'primary' : 'accent'}
              size="lg"
              onClick={() => {
                setPhase('test');
                setStartTime(performance.now());
                setCurrentTarget(isSwitching ? 0 : 1);
                setErrors(0);
                setPath([]);
              }}
            >
              Start Task
            </Button>
          </div>
        </div>
      </ScreenShell>
    );
  }

  const nextLabel = sequence[currentTarget] ?? 'Done';

  return (
    <ScreenShell
      title={isSwitching ? 'Trail Connect B' : 'Trail Connect A'}
      subtitle={isSwitching ? 'Alternate number and letter targets.' : 'Continue in ascending order.'}
      progress={<div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">Next: {nextLabel}</div>}
    >
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between rounded-3xl bg-slate-50 px-5 py-4 text-sm text-slate-600">
          <span>Errors: <strong className="text-slate-900">{errors}</strong></span>
          <span>{isSwitching ? 'Executive switching mode' : 'Sequencing speed mode'}</span>
        </div>
        <div className="relative mx-auto h-[340px] w-[340px] rounded-[32px] border border-slate-200 bg-white shadow-inner">
          <canvas ref={canvasRef} width={340} height={340} className="absolute inset-0" />
          {positions.map((target) => {
            const isActive = target.id === currentTarget;
            const isComplete = path.some((entry) => entry.id === target.id);
            return (
              <button
                key={target.id}
                onClick={() => handleTap(target)}
                className={`absolute flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold transition ${
                  isComplete
                    ? isSwitching
                      ? 'border-amber-600 bg-amber-500 text-white'
                      : 'border-teal-600 bg-teal-500 text-white'
                    : isActive
                      ? target.isLetter
                        ? 'border-amber-500 bg-amber-50 text-amber-700 ring-4 ring-amber-100'
                        : 'border-teal-500 bg-teal-50 text-teal-700 ring-4 ring-teal-100'
                      : target.isLetter
                        ? 'border-amber-200 bg-amber-50 text-amber-700'
                        : 'border-slate-300 bg-white text-slate-700'
                }`}
                style={{ left: target.x, top: target.y }}
              >
                {target.label}
              </button>
            );
          })}
        </div>
      </div>
    </ScreenShell>
  );
};

export const TrailAAssessment = ({ onComplete }) => <TrailCanvas mode="trailA" onComplete={onComplete} />;
export const TrailBAssessment = ({ onComplete }) => <TrailCanvas mode="trailB" onComplete={onComplete} />;

export const StroopAssessment = ({ onComplete }) => {
  const [phase, setPhase] = useState('instruction');
  const [trialIndex, setTrialIndex] = useState(0);
  const [trials, setTrials] = useState([]);
  const [stimulusVisible, setStimulusVisible] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const timer = useReactionClock();

  const buildTrials = (count) =>
    Array.from({ length: count }).map((_, index) => {
      const textIndex = Math.floor(Math.random() * STROOP_COLORS.length);
      const congruent = index % 2 === 0;
      const inkIndex = congruent ? textIndex : (textIndex + 1 + Math.floor(Math.random() * 3)) % STROOP_COLORS.length;
      return {
        text: STROOP_COLORS[textIndex].name,
        inkName: STROOP_COLORS[inkIndex].name,
        inkHex: STROOP_COLORS[inkIndex].hex,
        congruent,
      };
    }).sort(() => Math.random() - 0.5);

  const showNext = async () => {
    setStimulusVisible(false);
    setTimeout(async () => {
      setStimulusVisible(true);
      await timer.start();
    }, 350);
  };

  const start = () => {
    setPhase('practice');
    setTrials(buildTrials(4));
    setTrialIndex(0);
    setFeedback(null);
    setTimeout(showNext, 500);
  };

  const advance = (updatedTrials) => {
    if (trialIndex < updatedTrials.length - 1) {
      setTrialIndex((current) => current + 1);
      showNext();
      return;
    }
    if (phase === 'practice') {
      setPhase('test');
      const liveTrials = buildTrials(24);
      setTrials(liveTrials);
      setTrialIndex(0);
      setFeedback(null);
      setTimeout(showNext, 500);
      return;
    }

    const scored = updatedTrials.filter((trial) => trial.isCorrect);
    const congruent = scored.filter((trial) => trial.congruent);
    const incongruent = scored.filter((trial) => !trial.congruent);
    const averageRt = (entries) => (entries.length ? Math.round(entries.reduce((sum, entry) => sum + entry.rtMs, 0) / entries.length) : 0);
    const congruentMean = averageRt(congruent);
    const incongruentMean = averageRt(incongruent);
    const allMean = averageRt(scored);
    const allRts = scored.map((trial) => trial.rtMs);
    const variance = allRts.length > 1 ? allRts.reduce((sum, value) => sum + (value - allMean) ** 2, 0) / (allRts.length - 1) : 0;
    onComplete({
      accuracy: Math.round((scored.length / updatedTrials.length) * 100),
      meanRtMs: allMean,
      sdRtMs: Math.round(Math.sqrt(variance)),
      congruentMeanMs: congruentMean,
      incongruentMeanMs: incongruentMean,
      interferenceMs: Math.round(incongruentMean - congruentMean),
      correctTrials: scored.length,
      totalTrials: updatedTrials.length,
    });
  };

  const handleChoice = (choice) => {
    if (!stimulusVisible) return;
    const current = trials[trialIndex];
    const updated = [...trials];
    updated[trialIndex] = {
      ...current,
      rtMs: timer.stop(),
      isCorrect: choice === current.inkName,
    };
    setTrials(updated);
    setStimulusVisible(false);

    if (phase === 'practice') {
      setFeedback(updated[trialIndex].isCorrect ? 'Correct' : 'Watch the ink color');
      setTimeout(() => {
        setFeedback(null);
        advance(updated);
      }, 600);
      return;
    }

    advance(updated);
  };

  if (phase === 'instruction') {
    return (
      <ScreenShell title="Color-Word Interference" subtitle="A digital inhibition task: choose the ink color and ignore the word itself.">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.9fr]">
          <div className="rounded-[32px] border border-slate-200 bg-slate-50 p-6">
            <div className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Example</div>
            <div className="mt-8 flex items-center justify-center gap-4 rounded-[28px] bg-white p-6">
              <span className="text-5xl font-black" style={{ color: '#2c6bed' }}>RED</span>
              <span className="text-slate-300">→</span>
              <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">Press BLUE</span>
            </div>
          </div>
          <div className="flex flex-col justify-between rounded-[32px] bg-slate-950 p-6 text-white">
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-white/60">Outputs</div>
              <ul className="mt-4 space-y-3 text-sm text-white/75">
                <li>Interference cost</li>
                <li>Accuracy under conflict</li>
                <li>Response-time variability</li>
              </ul>
            </div>
            <Button variant="accent" size="lg" onClick={start}>
              Start Practice
            </Button>
          </div>
        </div>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell
      title="Color-Word Interference"
      subtitle={phase === 'practice' ? 'Choose the ink color during practice.' : 'Choose the ink color as quickly as possible.'}
      progress={<div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">{phase.toUpperCase()} {trialIndex + 1}/{trials.length}</div>}
    >
      <div className="flex h-full flex-col items-center justify-center gap-10">
        <div className="flex h-40 items-center justify-center">
          {feedback ? (
            <div className="text-3xl font-semibold text-teal-700">{feedback}</div>
          ) : stimulusVisible && trials[trialIndex] ? (
            <div className="text-7xl font-black select-none" style={{ color: trials[trialIndex].inkHex }}>
              {trials[trialIndex].text}
            </div>
          ) : (
            <div className="text-6xl text-slate-300">+</div>
          )}
        </div>
        <div className="grid w-full max-w-2xl grid-cols-2 gap-4">
          {STROOP_COLORS.map((color) => (
            <button
              key={color.name}
              onPointerDown={() => handleChoice(color.name)}
              className="rounded-[24px] border border-slate-200 bg-slate-50 px-5 py-6 text-lg font-semibold text-slate-800 transition hover:-translate-y-0.5 hover:border-teal-300 hover:bg-white"
            >
              {color.name}
            </button>
          ))}
        </div>
      </div>
    </ScreenShell>
  );
};

const SpanGrid = ({ backward = false, onComplete }) => {
  const [phase, setPhase] = useState('instruction');
  const [level, setLevel] = useState(backward ? 2 : 3);
  const [strikes, setStrikes] = useState(0);
  const [sequence, setSequence] = useState([]);
  const [userSequence, setUserSequence] = useState([]);
  const [highlighted, setHighlighted] = useState(null);
  const [mode, setMode] = useState('watch');

  const generateSequence = (length) => {
    const next = [];
    while (next.length < length) {
      const candidate = Math.floor(Math.random() * 9);
      if (next[next.length - 1] !== candidate) next.push(candidate);
    }
    return next;
  };

  const startLevel = (targetLevel) => {
    setSequence(generateSequence(targetLevel));
    setUserSequence([]);
    setMode('watch');
  };

  useEffect(() => {
    if (mode !== 'watch' || !sequence.length) return;
    let index = 0;
    const tick = () => {
      if (index >= sequence.length) {
        setHighlighted(null);
        setTimeout(() => setMode('recall'), 350);
        return;
      }
      setHighlighted(sequence[index]);
      setTimeout(() => {
        setHighlighted(null);
        index += 1;
        setTimeout(tick, 220);
      }, 500);
    };
    const timeout = setTimeout(tick, 350);
    return () => clearTimeout(timeout);
  }, [mode, sequence]);

  const checkSequence = (index) => {
    const expectedSequence = backward ? [...sequence].reverse() : sequence;
    const nextSequence = [...userSequence, index];
    setUserSequence(nextSequence);

    if (nextSequence[nextSequence.length - 1] !== expectedSequence[nextSequence.length - 1]) {
      if (strikes >= 1) {
        onComplete({
          maxSpan: backward ? level - 1 : level - 1,
          direction: backward ? 'backward' : 'forward',
        });
        return;
      }
      setStrikes(1);
      setTimeout(() => startLevel(level), 700);
      return;
    }

    if (nextSequence.length === expectedSequence.length) {
      const nextLevel = level + 1;
      setStrikes(0);
      setLevel(nextLevel);
      setTimeout(() => startLevel(nextLevel), 700);
    }
  };

  if (phase === 'instruction') {
    return (
      <ScreenShell
        title={backward ? 'Pattern Span Backward' : 'Pattern Span Forward'}
        subtitle={backward ? 'Repeat the highlighted sequence in reverse order.' : 'Repeat the highlighted sequence in the same order.'}
      >
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[32px] border border-slate-200 bg-slate-50 p-6 text-sm leading-6 text-slate-600">
            Two attempts are allowed at each level. The task ends after a second failure at the same span length.
          </div>
          <div className="flex flex-col justify-between rounded-[32px] bg-slate-950 p-6 text-white">
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-white/60">What you get</div>
              <ul className="mt-4 space-y-3 text-sm text-white/75">
                <li>Maximum achieved span</li>
                <li>Forward/backward asymmetry</li>
                <li>Working-memory stress sensitivity</li>
              </ul>
            </div>
            <Button
              variant={backward ? 'primary' : 'accent'}
              size="lg"
              onClick={() => {
                setPhase('test');
                startLevel(level);
              }}
            >
              Start Span Task
            </Button>
          </div>
        </div>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell
      title={backward ? 'Pattern Span Backward' : 'Pattern Span Forward'}
      subtitle={mode === 'watch' ? 'Watch the sequence carefully.' : backward ? 'Tap in reverse order.' : 'Tap in the same order.'}
      progress={<div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">Level {level}</div>}
    >
      <div className="flex h-full flex-col items-center justify-center gap-8">
        <div className="text-sm uppercase tracking-[0.18em] text-slate-500">{mode === 'watch' ? 'Watch' : 'Recall'}</div>
        <div className="grid grid-cols-3 gap-4 rounded-[32px] bg-slate-50 p-5">
          {Array.from({ length: 9 }).map((_, index) => (
            <button
              key={index}
              disabled={mode !== 'recall'}
              onPointerDown={() => checkSequence(index)}
              className={`h-24 w-24 rounded-[24px] border-2 transition ${
                highlighted === index
                  ? backward
                    ? 'border-amber-600 bg-amber-500'
                    : 'border-teal-600 bg-teal-500'
                  : mode === 'recall'
                    ? 'border-slate-200 bg-white hover:border-teal-300 hover:bg-teal-50'
                    : 'border-slate-200 bg-white'
              }`}
            />
          ))}
        </div>
        <div className="text-sm text-slate-500">Strikes at this level: {strikes}</div>
      </div>
    </ScreenShell>
  );
};

export const SpanForwardAssessment = ({ onComplete }) => <SpanGrid onComplete={onComplete} />;
export const SpanBackwardAssessment = ({ onComplete }) => <SpanGrid backward onComplete={onComplete} />;

export const FluencyAssessment = ({ result, onComplete }) => {
  const [phase, setPhase] = useState('instruction');
  const [timeLeft, setTimeLeft] = useState(60);
  const [inputValue, setInputValue] = useState('');
  const [responses, setResponses] = useState(result?.responses ?? []);
  const [duplicates, setDuplicates] = useState(result?.perseverations ?? 0);

  useEffect(() => {
    if (phase !== 'running') return undefined;
    const interval = setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1) {
          setPhase('complete');
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'complete') return;
    onComplete({
      category: 'Animals',
      responses,
      uniqueResponses: responses.length,
      perseverations: duplicates,
      totalAttempts: responses.length + duplicates,
    });
  }, [duplicates, onComplete, phase, responses]);

  const submitWord = () => {
    if (!inputValue.trim()) return;
    const normalized = inputValue.trim().toUpperCase();
    if (responses.includes(normalized)) {
      setDuplicates((current) => current + 1);
    } else {
      setResponses((current) => [...current, normalized]);
    }
    setInputValue('');
  };

  if (phase === 'instruction') {
    return (
      <ScreenShell title="Category Fluency" subtitle="Generate as many animal names as possible in 60 seconds.">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[32px] border border-slate-200 bg-slate-50 p-6 text-sm leading-6 text-slate-600">
            This digital capture supports semantic fluency tracking and automatically counts duplicate perseverations. The clinician can still interpret appropriateness and clustering separately.
          </div>
          <div className="flex flex-col justify-between rounded-[32px] bg-slate-950 p-6 text-white">
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-white/60">Task</div>
              <div className="mt-4 text-4xl font-semibold">Animals</div>
              <div className="mt-2 text-sm text-white/70">One minute, unique responses preferred.</div>
            </div>
            <Button variant="accent" size="lg" onClick={() => setPhase('running')}>
              Start 60-Second Trial
            </Button>
          </div>
        </div>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell
      title="Category Fluency"
      subtitle="Add one animal at a time while the timer is running."
      progress={
        <div className="flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">
          <Clock size={16} />
          {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
        </div>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <div className="flex gap-3">
            <input
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && submitWord()}
              className="flex-1 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-teal-300"
              placeholder="Type an animal"
              autoFocus
            />
            <Button variant="accent" onClick={submitWord}>
              Add
            </Button>
          </div>
          <div className="mt-5 rounded-[28px] border border-slate-200 bg-slate-50 p-4">
            <div className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Captured responses</div>
            <div className="flex min-h-[160px] flex-wrap gap-2">
              {responses.map((entry) => (
                <span key={entry} className="rounded-full bg-white px-3 py-1 text-sm font-medium text-slate-700 shadow-sm">
                  {entry}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="rounded-[28px] bg-slate-950 px-5 py-6 text-white">
            <div className="text-xs uppercase tracking-[0.18em] text-white/60">Unique animals</div>
            <div className="mt-4 text-5xl font-semibold">{responses.length}</div>
          </div>
          <div className="rounded-[28px] border border-slate-200 bg-white px-5 py-6">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Perseverations</div>
            <div className="mt-4 text-4xl font-semibold text-slate-900">{duplicates}</div>
          </div>
          {phase === 'running' ? (
            <Button variant="secondary" size="lg" onClick={() => setPhase('complete')}>
              Finish Early
            </Button>
          ) : null}
        </div>
      </div>
    </ScreenShell>
  );
};

export const VerbalLearningAssessment = ({ result, onComplete }) => {
  const [form, setForm] = useState({
    learningTotal: result?.learningTotal ?? '',
    delayedRecall: result?.delayedRecall ?? '',
    recognitionHits: result?.recognitionHits ?? '',
    intrusions: result?.intrusions ?? '',
    cueBenefit: result?.cueBenefit ?? '',
    notes: result?.notes ?? '',
  });

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  return (
    <ScreenShell
      title="List Learning + Delayed Recall"
      subtitle="Capture a structured memory summary after your preferred word-list administration. A sample 10-word bank is included for convenience."
      progress={<PercentileBadge percentile={result?.percentile ?? null} />}
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <div className="rounded-[32px] bg-slate-950 p-6 text-white">
          <div className="text-xs uppercase tracking-[0.18em] text-white/60">Sample 10-word bank</div>
          <div className="mt-5 grid grid-cols-2 gap-3 text-sm text-white/80">
            {VERBAL_WORD_BANK.map((word) => (
              <div key={word} className="rounded-2xl bg-white/10 px-3 py-2">
                {word}
              </div>
            ))}
          </div>
          <p className="mt-5 text-sm leading-6 text-white/70">
            Use this list if you want a built-in standard. Otherwise, enter the clinician-scored totals from your own validated list-learning protocol.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            ['learningTotal', 'Learning total (all trials)', '0-30'],
            ['delayedRecall', 'Delayed recall', '0-10'],
            ['recognitionHits', 'Recognition hits', '0-10'],
            ['intrusions', 'Intrusions', '0-10'],
            ['cueBenefit', 'Cue benefit', '0-10'],
          ].map(([field, label, placeholder]) => (
            <label key={field} className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
              <input
                type="number"
                min="0"
                value={form[field]}
                onChange={(event) => update(field, event.target.value)}
                className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-teal-300"
                placeholder={placeholder}
              />
            </label>
          ))}
          <label className="sm:col-span-2">
            <span className="mb-2 block text-sm font-medium text-slate-700">Memory notes</span>
            <textarea
              value={form.notes}
              onChange={(event) => update('notes', event.target.value)}
              className="min-h-[140px] w-full rounded-[28px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-teal-300"
              placeholder="Cueing pattern, rapid forgetting, confabulation, or strategy observations."
            />
          </label>
          <div className="sm:col-span-2">
            <Button
              variant="accent"
              size="lg"
              onClick={() =>
                onComplete({
                  learningTotal: Number(form.learningTotal || 0),
                  delayedRecall: Number(form.delayedRecall || 0),
                  recognitionHits: Number(form.recognitionHits || 0),
                  intrusions: Number(form.intrusions || 0),
                  cueBenefit: Number(form.cueBenefit || 0),
                  retentionRate: Number(form.learningTotal || 0) > 0 ? Math.round((Number(form.delayedRecall || 0) / Math.max(Number(form.learningTotal || 0) / 3, 1)) * 100) : 0,
                  notes: form.notes.trim(),
                })
              }
            >
              Save Memory Summary
            </Button>
          </div>
        </div>
      </div>
    </ScreenShell>
  );
};

export const assessmentRenderer = {
  orientation: OrientationAssessment,
  symbolMatch: SymbolMatchAssessment,
  trailA: TrailAAssessment,
  trailB: TrailBAssessment,
  stroop: StroopAssessment,
  spanForward: SpanForwardAssessment,
  spanBackward: SpanBackwardAssessment,
  fluency: FluencyAssessment,
  verbalLearning: VerbalLearningAssessment,
};
