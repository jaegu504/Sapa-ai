import '@testing-library/jest-dom';
import 'fake-indexeddb/auto';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import { MotionGlobalConfig } from 'motion/react';

// Animations finish instantly in tests so enter/exit transitions never delay assertions.
MotionGlobalConfig.skipAnimations = true;

afterEach(() => {
  cleanup();
});
