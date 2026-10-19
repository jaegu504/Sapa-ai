import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AppUpdateModal } from '../../src/components/ui/AppUpdateModal';
import * as updateServiceModule from '../../src/services/updateService';

describe('AppUpdateModal', () => {
  const sampleUpdate: updateServiceModule.UpdateCheckResult = {
    hasUpdate: true,
    currentVersion: '1.0.0',
    latestVersion: '1.1.0',
    releaseNotes: 'Fitur baru pengingat dan auto update',
    releaseUrl: 'https://github.com/jaegu504/Sapa-ai/releases/tag/v1.1.0',
    apkUrl: 'https://github.com/jaegu504/Sapa-ai/releases/download/v1.1.0/sapa-ai-v1.1.0.apk',
    checkedAt: Date.now(),
  };

  it('does not render when isOpen is false', () => {
    const { container } = render(
      <AppUpdateModal isOpen={false} update={sampleUpdate} onClose={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('does not render when update hasUpdate is false', () => {
    const { container } = render(
      <AppUpdateModal
        isOpen={true}
        update={{ ...sampleUpdate, hasUpdate: false }}
        onClose={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders update modal with versions, notes, and triggers download', () => {
    const onClose = vi.fn();
    const openSpy = vi.spyOn(updateServiceModule, 'openUpdateDownload').mockImplementation(() => {});

    render(<AppUpdateModal isOpen={true} update={sampleUpdate} onClose={onClose} />);

    expect(screen.getByText(/Pembaruan Sapa-ai/i)).toBeInTheDocument();
    expect(screen.getByText(/v1.0.0/i)).toBeInTheDocument();
    expect(screen.getByText(/v1.1.0/i)).toBeInTheDocument();
    expect(screen.getByText(/Fitur baru pengingat dan auto update/i)).toBeInTheDocument();

    const downloadBtn = screen.getByRole('button', { name: /Unduh & Perbarui Sekarang/i });
    fireEvent.click(downloadBtn);

    expect(openSpy).toHaveBeenCalledWith(sampleUpdate.apkUrl);
    expect(onClose).toHaveBeenCalled();

    openSpy.mockRestore();
  });

  it('calls onDismissForever and onClose when clicking Nanti Saja', () => {
    const onClose = vi.fn();
    const onDismissForever = vi.fn();

    render(
      <AppUpdateModal
        isOpen={true}
        update={sampleUpdate}
        onClose={onClose}
        onDismissForever={onDismissForever}
      />
    );

    const dismissBtn = screen.getByRole('button', { name: /Nanti Saja/i });
    fireEvent.click(dismissBtn);

    expect(onDismissForever).toHaveBeenCalledWith('1.1.0');
    expect(onClose).toHaveBeenCalled();
  });
});
