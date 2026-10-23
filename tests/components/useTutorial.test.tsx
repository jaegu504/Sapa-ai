import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useTutorial, UseTutorialOptions } from '../../src/components/tutorial/useTutorial';
import { saveTutorialState, loadTutorialState } from '../../src/services/tutorialService';

function setup(initial: Partial<UseTutorialOptions> = {}) {
  const opts: UseTutorialOptions = {
    context: 'shell',
    ready: true,
    selectedContactId: null,
    contactExists: () => true,
    setActiveTab: vi.fn(),
    openContact: vi.fn(),
    closeContact: vi.fn(),
    onComplete: vi.fn(),
    ...initial,
  };
  const hook = renderHook((p: UseTutorialOptions) => useTutorial(p), { initialProps: opts });
  const rerender = (patch: Partial<UseTutorialOptions>) => {
    Object.assign(opts, patch);
    hook.rerender({ ...opts });
  };
  return { ...hook, opts, rerender };
}

describe('useTutorial', () => {
  beforeEach(() => localStorage.clear());

  it('fresh install shows the intro; finishIntro starts at radar-tab on the radar tab', () => {
    const { result, opts } = setup();
    expect(result.current.showIntro).toBe(true);
    act(() => result.current.finishIntro());
    expect(result.current.currentStep?.id).toBe('radar-tab');
    expect(opts.setActiveTab).toHaveBeenCalledWith('radar');
  });

  it('skip sets done and persists', () => {
    const { result } = setup();
    act(() => result.current.skip());
    expect(result.current.showIntro).toBe(false);
    expect(loadTutorialState().status).toBe('done');
  });

  it('pick-contact ignores next and advances when the dossier opens', () => {
    saveTutorialState({ status: 'tour', stepId: 'pick-contact' });
    const { result, rerender } = setup();
    act(() => result.current.next());
    expect(result.current.currentStep?.id).toBe('pick-contact');
    rerender({ context: 'dossier', selectedContactId: 'c1' });
    expect(result.current.currentStep?.id).toBe('field-met');
    expect(result.current.state.contactId).toBe('c1');
  });

  it('jadwal-tab closes the open contact and draft-ai reopens it', () => {
    saveTutorialState({ status: 'tour', stepId: 'voice-note', contactId: 'c1' });
    const { result, opts, rerender } = setup({ context: 'dossier', selectedContactId: 'c1' });
    act(() => result.current.next());
    expect(result.current.currentStep?.id).toBe('jadwal-tab');
    expect(opts.closeContact).toHaveBeenCalled();
    rerender({ context: 'shell', selectedContactId: null });
    act(() => result.current.next());
    expect(result.current.currentStep?.id).toBe('draft-ai');
    expect(opts.openContact).toHaveBeenCalledWith('c1');
  });

  it('closing the dossier during a field step returns to pick-contact', () => {
    saveTutorialState({ status: 'tour', stepId: 'field-notes', contactId: 'c1' });
    const { result, rerender } = setup({ context: 'dossier', selectedContactId: 'c1' });
    rerender({ context: 'shell', selectedContactId: null });
    expect(result.current.currentStep?.id).toBe('pick-contact');
  });

  it('closing the draft modal during draft-pick returns to draft-ai', () => {
    saveTutorialState({ status: 'tour', stepId: 'draft-pick', contactId: 'c1' });
    const { result, rerender } = setup({ context: 'draft' });
    rerender({ context: 'shell' });
    expect(result.current.currentStep?.id).toBe('draft-ai');
  });

  it('tour is hidden while another modal is open', () => {
    saveTutorialState({ status: 'tour', stepId: 'pick-contact' });
    const { result, rerender } = setup();
    expect(result.current.showTour).toBe(true);
    rerender({ context: 'other' });
    expect(result.current.showTour).toBe(false);
  });

  it('next on whatsapp completes the tutorial and calls onComplete', () => {
    saveTutorialState({ status: 'tour', stepId: 'draft-ai', contactId: 'c1' });
    const { result, opts, rerender } = setup({ context: 'dossier', selectedContactId: 'c1' });
    act(() => result.current.next());
    rerender({ context: 'draft', selectedContactId: null });
    act(() => result.current.next());
    expect(result.current.currentStep?.id).toBe('whatsapp');
    act(() => result.current.next());
    expect(result.current.state.status).toBe('done');
    expect(opts.onComplete).toHaveBeenCalledTimes(1);
  });

  it('replay restarts the intro', () => {
    saveTutorialState({ status: 'done' });
    const { result } = setup();
    act(() => result.current.replay());
    expect(result.current.showIntro).toBe(true);
  });
});
