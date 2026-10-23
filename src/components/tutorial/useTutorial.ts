import { useCallback, useEffect, useRef, useState } from 'react';
import {
  TOUR_STEPS,
  TourContext,
  TourStep,
  TourStepId,
  TutorialState,
  getStep,
  loadTutorialState,
  nextStepId,
  resetTutorial,
  resolveResumeStep,
  saveTutorialState,
} from '../../services/tutorialService';

export interface UseTutorialOptions {
  /** What is on screen now; 'other' = a modal the tour does not cover (edit, import, log...). */
  context: TourContext | 'other';
  /** False until contacts are loaded, so resume checks see the real list. */
  ready: boolean;
  selectedContactId: string | null;
  contactExists: (id: string) => boolean;
  setActiveTab: (tab: string) => void;
  openContact: (id: string) => void;
  closeContact: () => void;
  onComplete: () => void;
}

export function useTutorial(opts: UseTutorialOptions) {
  const [state, setState] = useState<TutorialState>(() => loadTutorialState());
  const optsRef = useRef(opts);
  optsRef.current = opts;
  const prevContext = useRef(opts.context);
  const resumed = useRef(false);

  const update = useCallback((next: TutorialState) => {
    saveTutorialState(next);
    setState(next);
  }, []);

  const goTo = useCallback(
    (stepId: TourStepId, contactId = state.contactId) =>
      update({ status: 'tour', stepId, ...(contactId ? { contactId } : {}) }),
    [state.contactId, update]
  );

  const currentStep: TourStep | null =
    state.status === 'tour' && state.stepId ? getStep(state.stepId) : null;

  // Resume an interrupted tour once contacts are known.
  useEffect(() => {
    if (!opts.ready || resumed.current) return;
    resumed.current = true;
    if (state.status === 'tour') {
      const stepId = resolveResumeStep(state, opts.contactExists);
      if (stepId !== state.stepId) goTo(stepId);
    }
  }, [opts.ready, opts.contactExists, state, goTo]);

  // Entering a step: put the right screen in front.
  useEffect(() => {
    if (!currentStep || !opts.ready) return;
    const o = optsRef.current;
    if (currentStep.tab) o.setActiveTab(currentStep.tab);
    if (currentStep.context === 'shell' && o.selectedContactId) o.closeContact();
    // Only the step id matters here; re-running on other changes would fight the user.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep?.id, opts.ready]);

  // Follow what the user opens and closes so the tour never waits on a hidden screen.
  useEffect(() => {
    const prev = prevContext.current;
    prevContext.current = opts.context;
    if (!currentStep || !opts.ready) return;
    const { context, selectedContactId, contactExists } = opts;

    if (currentStep.id === 'pick-contact') {
      if (context === 'dossier' && selectedContactId) goTo('field-met', selectedContactId);
      return;
    }
    if (currentStep.context === 'dossier' && context === 'shell') {
      const id = state.contactId;
      if (prev === 'dossier' || !id || !contactExists(id)) goTo('pick-contact');
      else optsRef.current.openContact(id);
      return;
    }
    if (currentStep.context === 'draft' && prev === 'draft' && context !== 'draft' && context !== 'other') {
      goTo('draft-ai');
    }
  }, [opts.context, opts.selectedContactId, opts.ready, currentStep?.id, state.contactId, goTo]);

  const next = useCallback(() => {
    if (!currentStep || currentStep.hideNext) return;
    const following = nextStepId(currentStep.id);
    if (following) {
      goTo(following);
    } else {
      update({ status: 'done' });
      optsRef.current.onComplete();
    }
  }, [currentStep, goTo, update]);

  const skip = useCallback(() => update({ status: 'done' }), [update]);
  const finishIntro = useCallback(() => update({ status: 'tour', stepId: 'radar-tab' }), [update]);
  const replay = useCallback(() => setState(resetTutorial()), []);

  return {
    state,
    currentStep,
    stepIndex: currentStep ? TOUR_STEPS.findIndex((s) => s.id === currentStep.id) : -1,
    total: TOUR_STEPS.length,
    showIntro: state.status === 'intro',
    showTour: Boolean(currentStep && opts.ready && currentStep.context === opts.context),
    next,
    skip,
    finishIntro,
    replay,
  };
}
