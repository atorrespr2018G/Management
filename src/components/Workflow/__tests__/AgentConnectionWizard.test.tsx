/**
 * Tests for AgentConnectionWizard component
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import AgentConnectionWizard from '../AgentConnectionWizard'
import type { Agent } from '@/services/agentApi'
import type { WorkflowDefinition } from '@/types/workflow'

const mockAgents: Agent[] = [
  { id: 'triage', name: 'Triage Agent', description: 'Triage agent' },
  { id: 'reporter', name: 'Reporter Agent', description: 'Reporter agent' },
  { id: 'reviewer', name: 'Reviewer Agent', description: 'Reviewer agent' },
]

const mockWorkflow: WorkflowDefinition = {
  nodes: [
    { id: 'triage', type: 'agent', agent_id: 'triage' },
    { id: 'reporter', type: 'agent', agent_id: 'reporter' },
  ],
  edges: [{ from_node: 'triage', to_node: 'reporter' }],
  entry_node_id: 'triage',
}

describe('AgentConnectionWizard', () => {
  const mockOnClose = jest.fn()
  const mockOnGenerate = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders when open', () => {
    render(
      <AgentConnectionWizard
        open={true}
        onClose={mockOnClose}
        onGenerate={mockOnGenerate}
        availableAgents={mockAgents}
      />
    )

    expect(screen.getByText(/connect agents/i)).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    render(
      <AgentConnectionWizard
        open={false}
        onClose={mockOnClose}
        onGenerate={mockOnGenerate}
        availableAgents={mockAgents}
      />
    )

    expect(screen.queryByText(/connect agents/i)).not.toBeInTheDocument()
  })

  it('calls onClose when cancel button is clicked', () => {
    render(
      <AgentConnectionWizard
        open={true}
        onClose={mockOnClose}
        onGenerate={mockOnGenerate}
        availableAgents={mockAgents}
      />
    )

    const cancelButton = screen.getByText(/cancel/i)
    fireEvent.click(cancelButton)

    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('displays available agents in selection', () => {
    render(
      <AgentConnectionWizard
        open={true}
        onClose={mockOnClose}
        onGenerate={mockOnGenerate}
        availableAgents={mockAgents}
      />
    )

    mockAgents.forEach((agent) => {
      expect(screen.getByText(agent.name)).toBeInTheDocument()
    })
  })
})
