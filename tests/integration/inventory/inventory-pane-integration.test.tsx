import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent, act } from '@testing-library/react';
import { InventoryPane } from '../../../src/features/inventory/InventoryPane';
import { useProjectStore } from '../../../src/app/state/projectStore';
import { createDefaultProject } from '../../../src/domain/project/defaults';

// Create a mock project with drafts for testing
function createMockProject() {
  const project = createDefaultProject('Test Song');
  return {
    schemaVersion: '1.0.0',
    project: {
      ...project,
      activeDraftId: project.drafts[0].id
    }
  };
}

describe('Inventory Pane Integration', () => {
  beforeEach(() => {
    cleanup();
  });

  afterEach(() => {
    cleanup();
  });

  test('T-5.03: Inventory pane renders in bottom-right panel', () => {
    // Set up mock store with a loaded project
    const mockProject = createMockProject();

    // Mock the store state
    useProjectStore.setState({
      currentProject: mockProject,
      activeView: { type: 'draft', draftId: mockProject.project.drafts[0].id }
    });

    render(<InventoryPane />);

    // Check that the inventory pane is rendered
    const inventoryPane = screen.getByTestId('inventory-pane');
    expect(inventoryPane).toBeDefined();

    // Check that the collected-words chip surface is rendered (not a raw textarea)
    expect(screen.getByTestId('inventory-chips')).toBeDefined();
    expect(screen.getByTestId('inventory-add-input')).toBeDefined();
    expect(screen.queryByTestId('inventory-textarea')).not.toBeInTheDocument();
  });

  test('T-5.04: Switching drafts switches inventory content correctly', () => {
    const mockProject = createMockProject();
    const draftA = mockProject.project.drafts[0];
    const draftB = {
      ...draftA,
      id: 'draft_b',
      name: 'Draft B',
      inventory: {
        type: 'inventory' as const,
        doc: {
          type: 'doc' as const,
          content: [
            { type: 'paragraph', content: [{ type: 'text', text: 'Draft B fragment' }] },
          ],
        },
      },
    };
    draftA.inventory = {
      type: 'inventory',
      doc: {
        type: 'doc',
        content: [
          { type: 'paragraph', content: [{ type: 'text', text: 'Draft A fragment' }] },
        ],
      },
    };
    mockProject.project.drafts = [draftA, draftB];

    useProjectStore.setState({
      currentProject: mockProject,
      activeView: { type: 'draft', draftId: draftA.id }
    });

    const { rerender } = render(<InventoryPane />);

    expect(screen.getByText('Draft A fragment')).toBeInTheDocument();
    expect(screen.queryByText('Draft B fragment')).not.toBeInTheDocument();

    // Switch the active draft
    act(() => {
      useProjectStore.setState({ activeView: { type: 'draft', draftId: draftB.id } });
    });
    rerender(<InventoryPane />);

    expect(screen.getByText('Draft B fragment')).toBeInTheDocument();
    expect(screen.queryByText('Draft A fragment')).not.toBeInTheDocument();
  });

  test('T-5.05: Editing inventory does not alter draft document', () => {
    const mockProject = createMockProject();
    const draftId = mockProject.project.drafts[0].id;
    const originalDocContent = JSON.stringify(mockProject.project.drafts[0].doc);

    // Set up store
    useProjectStore.setState({
      currentProject: mockProject,
      activeView: { type: 'draft', draftId }
    });

    render(<InventoryPane />);

    const addInput = screen.getByTestId('inventory-add-input');
    fireEvent.change(addInput, { target: { value: 'New inventory line' } });
    fireEvent.submit(addInput.closest('form')!);

    // Get the updated store state
    const updatedState = useProjectStore.getState();
    const updatedDraft = updatedState.currentProject?.project.drafts.find(d => d.id === draftId);

    // Verify that inventory was updated
    expect(updatedDraft).toBeDefined();
    expect(updatedDraft!.inventory.doc.content.length).toBeGreaterThan(0);

    // Verify that the main draft document was NOT altered
    const currentDocContent = JSON.stringify(updatedDraft!.doc);
    expect(currentDocContent).toBe(originalDocContent);
  });
});
