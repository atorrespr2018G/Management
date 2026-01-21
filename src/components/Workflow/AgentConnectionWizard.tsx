/**
 * Agent Connection Wizard
 * Dialog for selecting agents and generating workflow structures
 */

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  Stepper,
  Step,
  StepLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  TextField,
} from '@mui/material'
import { AutoAwesome as AgentIcon } from '@mui/icons-material'
import type { Agent } from '@/services/agentApi'
import type { WorkflowDefinition } from '@/types/workflow'
import {
  generateLinearWorkflow,
  generateConditionalWorkflow,
  type ConnectionConfig,
  type ConditionalRoute,
} from '@/utils/agentWorkflowGenerator'
import {
  AGENT_CONNECTION_TEMPLATES,
  type AgentConnectionTemplate,
} from '@/utils/agentConnectionTemplates'

interface AgentConnectionWizardProps {
  open: boolean
  onClose: () => void
  onGenerate: (workflow: WorkflowDefinition) => void
  availableAgents: Agent[]
}

type FlowPattern = 'linear' | 'conditional' | 'template' | 'custom'

export default function AgentConnectionWizard({
  open,
  onClose,
  onGenerate,
  availableAgents,
}: AgentConnectionWizardProps) {
  const [activeStep, setActiveStep] = useState(0)
  const [selectedAgents, setSelectedAgents] = useState<string[]>([])
  const [flowPattern, setFlowPattern] = useState<FlowPattern>('linear')
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [previewWorkflow, setPreviewWorkflow] = useState<WorkflowDefinition | null>(null)
  const [conditionalRoutes, setConditionalRoutes] = useState<ConditionalRoute[]>([])

  const steps = ['Select Agents', 'Choose Pattern', 'Configure', 'Preview']

  useEffect(() => {
    if (open) {
      // Reset state when dialog opens
      setActiveStep(0)
      setSelectedAgents([])
      setFlowPattern('linear')
      setSelectedTemplate('')
      setPreviewWorkflow(null)
      setConditionalRoutes([])
    }
  }, [open])

  const handleAgentToggle = (agentId: string) => {
    setSelectedAgents((prev) =>
      prev.includes(agentId) ? prev.filter((id) => id !== agentId) : [...prev, agentId]
    )
  }

  const handleNext = () => {
    if (activeStep === 0 && selectedAgents.length < 2) {
      return // Can't proceed without at least 2 agents
    }
    if (activeStep === 1 && flowPattern === 'template' && !selectedTemplate) {
      return // Can't proceed without selecting a template
    }
    if (activeStep === 2) {
      generatePreview()
    }
    setActiveStep((prev) => prev + 1)
  }

  const handleBack = () => {
    setActiveStep((prev) => prev - 1)
  }

  const generatePreview = () => {
    try {
      const agents = availableAgents.filter((a) => selectedAgents.includes(a.id))

      if (flowPattern === 'template' && selectedTemplate) {
        const template = AGENT_CONNECTION_TEMPLATES.find((t) => t.id === selectedTemplate)
        if (template) {
          const workflow = template.generate(agents)
          setPreviewWorkflow(workflow)
          return
        }
      }

      if (flowPattern === 'linear') {
        const workflow = generateLinearWorkflow(agents)
        setPreviewWorkflow(workflow)
      } else if (flowPattern === 'conditional') {
        if (agents.length < 2) {
          throw new Error('Need at least 2 agents for conditional routing')
        }
        const sourceAgent = agents[0]
        const routes: ConditionalRoute[] = agents.slice(1).map((agent, index) => ({
          condition: index === 0 ? `${sourceAgent.id.toLowerCase()}.preferred_agent == "${agent.id}"` : '',
          targetAgentId: agent.id,
          label: agent.name,
        }))
        const workflow = generateConditionalWorkflow(sourceAgent, routes)
        setPreviewWorkflow(workflow)
      }
    } catch (error: any) {
      console.error('Failed to generate preview:', error)
      setPreviewWorkflow(null)
    }
  }

  const handleGenerate = () => {
    if (previewWorkflow) {
      onGenerate(previewWorkflow)
      onClose()
    }
  }

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box>
            <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
              Select at least 2 agents to connect
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {availableAgents.map((agent) => (
                <Chip
                  key={agent.id}
                  label={`${agent.name} (${agent.id})`}
                  onClick={() => handleAgentToggle(agent.id)}
                  color={selectedAgents.includes(agent.id) ? 'primary' : 'default'}
                  variant={selectedAgents.includes(agent.id) ? 'filled' : 'outlined'}
                  icon={<AgentIcon />}
                />
              ))}
            </Box>
            {selectedAgents.length > 0 && (
              <Alert severity="success" sx={{ mt: 2 }}>
                {selectedAgents.length} agent(s) selected
              </Alert>
            )}
          </Box>
        )

      case 1:
        return (
          <Box>
            <FormControl component="fieldset">
              <RadioGroup value={flowPattern} onChange={(e) => setFlowPattern(e.target.value as FlowPattern)}>
                <FormControlLabel value="linear" control={<Radio />} label="Linear (A → B → C)" />
                <FormControlLabel
                  value="conditional"
                  control={<Radio />}
                  label="Conditional Routing (A → [condition] → B or C)"
                />
                <FormControlLabel value="template" control={<Radio />} label="Use Template" />
              </RadioGroup>
            </FormControl>

            {flowPattern === 'template' && (
              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel>Template</InputLabel>
                <Select
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                  label="Template"
                >
                  {AGENT_CONNECTION_TEMPLATES.map((template) => (
                    <MenuItem key={template.id} value={template.id}>
                      {template.name} - {template.description}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Box>
        )

      case 2:
        return (
          <Box>
            <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
              Configuration options will be available here. For now, using default settings.
            </Typography>
            <Alert severity="info">
              The workflow will be generated with default input/output mappings. You can customize these in the graph
              editor after generation.
            </Alert>
          </Box>
        )

      case 3:
        return (
          <Box>
            {previewWorkflow ? (
              <>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Preview: {previewWorkflow.name}
                </Typography>
                <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                  {previewWorkflow.description}
                </Typography>
                <Alert severity="success">
                  <Typography variant="body2">
                    <strong>Nodes:</strong> {previewWorkflow.nodes.length}
                    <br />
                    <strong>Edges:</strong> {previewWorkflow.edges.length}
                    <br />
                    <strong>Entry Node:</strong> {previewWorkflow.entry_node_id}
                  </Typography>
                </Alert>
              </>
            ) : (
              <Alert severity="error">Failed to generate workflow preview</Alert>
            )}
          </Box>
        )

      default:
        return null
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Connect Agents</DialogTitle>
      <DialogContent>
        <Stepper activeStep={activeStep} sx={{ mb: 3, mt: 2 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {renderStepContent()}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleBack} disabled={activeStep === 0}>
          Back
        </Button>
        <Button
          onClick={activeStep === steps.length - 1 ? handleGenerate : handleNext}
          variant="contained"
          disabled={
            (activeStep === 0 && selectedAgents.length < 2) ||
            (activeStep === 1 && flowPattern === 'template' && !selectedTemplate) ||
            (activeStep === steps.length - 1 && !previewWorkflow)
          }
        >
          {activeStep === steps.length - 1 ? 'Generate Workflow' : 'Next'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
