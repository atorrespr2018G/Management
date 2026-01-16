import React, { useEffect, useState } from 'react'
import {
    Typography,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Switch,
    FormControlLabel,
    Box,
    Divider,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    CircularProgress,
    Alert,
} from '@mui/material'
import { inputVariableOptions } from '@/constants/agents'
import { InvokeAgentNodeData } from '../nodes/InvokeAgentNodeData'
import { invokeTool } from '@/utils/foundry'

import WorkflowConfigPanel from './WorkflowConfigPanel'

interface Agent {
    id: string
    name: string
    model: string
    description?: string
}

const CREATE_NEW_AGENT_VALUE = '__CREATE_NEW__'

interface InvokeAgentConfigPanelProps {
    data: InvokeAgentNodeData
    onUpdate: (data: InvokeAgentNodeData) => void
}

const InvokeAgentConfigPanel = ({ data, onUpdate }: InvokeAgentConfigPanelProps) => {
    // We use local state for the form to ensure responsiveness, 
    // but we sync with the parent data prop
    const [agents, setAgents] = useState<Agent[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Dialog state
    const [dialogOpen, setDialogOpen] = useState(false)
    const [newAgentName, setNewAgentName] = useState('')
    const [newAgentModel, setNewAgentModel] = useState('gpt-4o-mini')
    const [newAgentInstructions, setNewAgentInstructions] = useState('')
    const [creating, setCreating] = useState(false)
    const [createError, setCreateError] = useState<string | null>(null)

    // Fetch agents on mount
    useEffect(() => {
        fetchAgents()
    }, [])

    const fetchAgents = async () => {
        try {
            setLoading(true);
            setError(null);

            // Use the list-agents tool
            const agentsData: Agent[] = await invokeTool('list-agents', {});

            console.log('Fetched agents:', agentsData);
            setAgents(agentsData);
        } catch (err) {
            console.error('Failed to fetch agents:', err);
            setError(err instanceof Error ? err.message : 'Failed to load agents');
        } finally {
            setLoading(false);
        }
    }

    const handleChange = (field: keyof InvokeAgentNodeData, value: any) => {
        const newData = { ...data, [field]: value }
        onUpdate(newData)
    }

    const handleAgentChange = (value: string) => {
        if (value === CREATE_NEW_AGENT_VALUE) {
            setDialogOpen(true)
        } else {
            // FIX: Persist both agentId and mode for backend compatibility
            const newData = {
                ...data,
                selectedAgent: value,
                agentId: value,
                mode: 'foundry_agent'
            }
            onUpdate(newData)
        }
    }

    const handleCreateAgent = async () => {
        if (!newAgentName.trim()) {
            setCreateError('Agent name is required')
            return
        }

        try {
            setCreating(true)
            setCreateError(null)

            // Use the create-agent tool
            const newAgent: Agent = await invokeTool('create-agent', {
                name: newAgentName.trim(),
                model: newAgentModel,
                instructions: newAgentInstructions,
            });

            // Refresh agent list
            await fetchAgents()

            // Select the newly created agent
            // FIX: Persist extended fields
            const newData = {
                ...data,
                selectedAgent: newAgent.id,
                agentId: newAgent.id,
                mode: 'foundry_agent'
            }
            onUpdate(newData)

            // Close dialog and reset
            setDialogOpen(false)
            setNewAgentName('')
            setNewAgentModel('gpt-4o-mini')
            setNewAgentInstructions('')
            setCreateError(null)
        } catch (err) {
            console.error('Failed to create agent:', err)
            setCreateError(err instanceof Error ? err.message : 'Failed to create agent')
        } finally {
            setCreating(false)
        }
    }

    const handleDialogClose = () => {
        if (!creating) {
            setDialogOpen(false)
            setNewAgentName('')
            setNewAgentModel('gpt-4o-mini')
            setNewAgentInstructions('')
            setCreateError(null)
        }
    }

    return (
        <WorkflowConfigPanel title="Configuration" actionId={data.actionId}>

            {/* Select an Agent */}
            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                <InputLabel>Select an agent</InputLabel>
                <Select
                    value={loading ? '' : data.selectedAgent}
                    onChange={(e) => handleAgentChange(e.target.value)}
                    label="Select an agent"
                    disabled={loading}
                >
                    {loading && (
                        <MenuItem value="">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <CircularProgress size={16} />
                                <Typography variant="body2">Loading agents...</Typography>
                            </Box>
                        </MenuItem>
                    )}
                    {!loading && (
                        [
                            ...(error ? [
                                <MenuItem key="error" value="" disabled>
                                    <Typography variant="body2" color="error">
                                        Error: {error}
                                    </Typography>
                                </MenuItem>
                            ] : agents?.map((agent) => (
                                <MenuItem key={agent.id} value={agent.id}>
                                    {agent.name}
                                </MenuItem>
                            ))),
                            <>{!agents && (<Divider key="divider" />)}</>,
                            <MenuItem key="create" value={CREATE_NEW_AGENT_VALUE}>
                                <Typography sx={{ color: 'primary.main', fontWeight: 600 }}>
                                    + Create a new agent
                                </Typography>
                            </MenuItem>
                        ]
                    )}
                </Select>
            </FormControl>

            {/* Input Message */}
            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                <InputLabel>Input message</InputLabel>
                <Select
                    value={data.inputMessage}
                    onChange={(e) => handleChange('inputMessage', e.target.value)}
                    label="Input message"
                >
                    {inputVariableOptions.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                            {option.label}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            {/* Auto-include Response Toggle */}
            <FormControlLabel
                control={
                    <Switch
                        checked={data.autoIncludeResponse}
                        onChange={(e) => handleChange('autoIncludeResponse', e.target.checked)}
                        color="primary"
                    />
                }
                label={
                    <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                        Automatically include agent response as part of the workflow (external) conversation.
                    </Typography>
                }
                sx={{ mb: 2, alignItems: 'flex-start' }}
            />

            {/* Save agent output message as */}
            {/* <TextField
                fullWidth
                size="small"
                label="Save agent output message as"
                placeholder="Search for a variable or type a value"
                value={data.outputMessageVar}
                onChange={(e) => handleChange('outputMessageVar', e.target.value)}
                sx={{ mb: 2 }}
            /> */}

            {/* Save output JSON object/schema as */}
            {/* <TextField
                fullWidth
                size="small"
                label="Save output JSON object/schema as"
                placeholder="Search for a variable or type a value"
                value={data.outputJsonVar}
                onChange={(e) => handleChange('outputJsonVar', e.target.value)}
            /> */}

            {/* Create Agent Dialog */}
            <Dialog open={dialogOpen} onClose={handleDialogClose} maxWidth="sm" fullWidth>
                <DialogTitle>Create an agent</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                        Configure the new agent with a name, model, and instructions.
                    </Typography>

                    {createError && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {createError}
                        </Alert>
                    )}

                    <TextField
                        autoFocus
                        fullWidth
                        label="Agent name"
                        placeholder="e.g. MyHelperAgent"
                        value={newAgentName}
                        onChange={(e) => setNewAgentName(e.target.value)}
                        disabled={creating}
                        error={!!createError && !newAgentName.trim()}
                        sx={{ mb: 2 }}
                    />

                    <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                        <InputLabel>Model</InputLabel>
                        <Select
                            value={newAgentModel}
                            onChange={(e) => setNewAgentModel(e.target.value)}
                            label="Model"
                            disabled={creating}
                        >
                            <MenuItem value="gpt-4o">gpt-4o</MenuItem>
                            <MenuItem value="gpt-4o-mini">gpt-4o-mini</MenuItem>
                            <MenuItem value="gpt-35-turbo">gpt-35-turbo</MenuItem>
                        </Select>
                    </FormControl>

                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label="Instructions"
                        placeholder="You are a helpful assistant..."
                        value={newAgentInstructions}
                        onChange={(e) => setNewAgentInstructions(e.target.value)}
                        disabled={creating}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleDialogClose} disabled={creating}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleCreateAgent}
                        variant="contained"
                        disabled={creating || !newAgentName.trim()}
                    >
                        {creating ? (
                            <>
                                <CircularProgress size={16} sx={{ mr: 1 }} />
                                Creating...
                            </>
                        ) : (
                            'Create'
                        )}
                    </Button>
                </DialogActions>
            </Dialog>
        </WorkflowConfigPanel>
    )
}

export default InvokeAgentConfigPanel
