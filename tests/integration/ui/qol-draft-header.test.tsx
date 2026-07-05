import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AppShell } from '../../../src/components/layout/AppShell';
import { useProjectStore } from '../../../src/app/state/projectStore';
import { createDefaultProject, createCyrilFile } from '../../../src/domain/project/defaults';

describe('T-14.01: Draft name appears only in the top bar', () => {
  beforeEach(() => {
    const project = createDefaultProject('Test Song');
    useProjectStore.setState({
      isProjectLoaded: true,
      currentProject: createCyrilFile(project),
      activeView: { type: 'draft', draftId: project.drafts[0].id },
      error: null,
      saveProject: vi.fn(),
    });
  });

  it('T-14.01: Draft name appears only in the top bar, not as a separate header below it', () => {
    render(<AppShell />);

    const draftName = project().drafts[0].name;

    // Top bar shows the draft name
    expect(screen.getByTestId('topbar-draft-name')).toHaveTextContent(draftName);

    // There must be no h2 element containing "Draft: ..." below the top bar
    const h2s = document.querySelectorAll('h2');
    const draftHeaders = Array.from(h2s).filter((el) =>
      el.textContent?.startsWith('Draft:'),
    );
    expect(draftHeaders).toHaveLength(0);
  });
});

function project() {
  return useProjectStore.getState().currentProject!.project;
}
