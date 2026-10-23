import { describe, it, expect, beforeEach } from 'vitest';
import {
  TOUR_STEPS,
  TUTORIAL_STORAGE_KEY,
  loadTutorialState,
  saveTutorialState,
  resetTutorial,
  nextStepId,
  resolveResumeStep,
} from '../../src/services/tutorialService';
import { ONBOARDING_STORAGE_KEY } from '../../src/components/onboarding/OnboardingModal';

describe('tutorialService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('loadTutorialState returns intro for fresh install', () => {
    expect(loadTutorialState()).toEqual({ status: 'intro' });
  });

  it('loadTutorialState returns done for existing users', () => {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    expect(loadTutorialState()).toEqual({ status: 'done' });
  });

  it('loadTutorialState treats corrupt JSON as absent', () => {
    localStorage.setItem(TUTORIAL_STORAGE_KEY, '{oops');
    expect(loadTutorialState()).toEqual({ status: 'intro' });
  });

  it('save then load round-trips', () => {
    const state = { status: 'tour' as const, stepId: 'field-topic' as const, contactId: 'c1' };
    saveTutorialState(state);
    expect(loadTutorialState()).toEqual(state);
  });

  it('resetTutorial returns intro even after done', () => {
    saveTutorialState({ status: 'done' });
    expect(resetTutorial()).toEqual({ status: 'intro' });
    expect(loadTutorialState()).toEqual({ status: 'intro' });
  });

  it('nextStepId walks the step order and ends after whatsapp', () => {
    expect(nextStepId('radar-tab')).toBe('contacts-tab');
    expect(nextStepId('whatsapp')).toBeNull();
  });

  it('TOUR_STEPS has 12 steps and field-topic body mentions Draf AI', () => {
    expect(TOUR_STEPS).toHaveLength(12);
    const topic = TOUR_STEPS.find((s) => s.id === 'field-topic');
    expect(topic?.body).toContain('Draf AI');
    expect(TOUR_STEPS.find((s) => s.id === 'pick-contact')?.hideNext).toBe(true);
  });

  it('resolveResumeStep falls back to pick-contact when contact deleted', () => {
    expect(
      resolveResumeStep({ status: 'tour', stepId: 'field-notes', contactId: 'x' }, () => false)
    ).toBe('pick-contact');
  });

  it('resolveResumeStep maps draft-pick to draft-ai', () => {
    expect(
      resolveResumeStep({ status: 'tour', stepId: 'draft-pick', contactId: 'x' }, () => true)
    ).toBe('draft-ai');
  });

  it('resolveResumeStep defaults to radar-tab', () => {
    expect(resolveResumeStep({ status: 'tour' }, () => true)).toBe('radar-tab');
  });
});
