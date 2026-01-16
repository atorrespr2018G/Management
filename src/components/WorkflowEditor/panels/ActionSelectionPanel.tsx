'use client'

import React, { useState } from 'react'
import {
    Box,
    Typography,
    TextField,
    InputAdornment,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Paper,
    Divider,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import CloseIcon from '@mui/icons-material/Close'
import CodeIcon from '@mui/icons-material/Code'
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer'
import CallSplitIcon from '@mui/icons-material/CallSplit'

interface ActionType {
    id: string
    label: string
    description: string
    icon: React.ReactNode
    category: 'Invoke' | 'Data transformation' | 'Flow' | 'Basics'
}

const AVAILABLE_ACTIONS: ActionType[] = [
    {
        id: 'invoke_agent',
        label: 'Invoke agent',
        description: 'Call an Azure AI agent to process request...',
        icon: <CodeIcon />,
        category: 'Invoke',
    },
    {
        id: 'send_message',
        label: 'Send message',
        description: 'Send a message to the user',
        icon: <QuestionAnswerIcon />,
        category: 'Basics',
    },
    // {
    //     id: 'ask_question',
    //     label: 'Ask a question',
    //     description: 'Allow agent to get information from users. The system waits for the user\'s reply before continuing',
    //     icon: <QuestionAnswerIcon />,
    //     category: 'Basics',
    // }

    {
        id: 'parallel',
        label: 'Parallel (Fan-out)',
        description: 'Execute multiple agents in parallel branches',
        icon: <CallSplitIcon />,
        category: 'Flow',
    }
]

interface ActionSelectionPanelProps {
    onSelect: (actionId: string, config?: any) => void
    onClose: () => void
}

export default function ActionSelectionPanel({ onSelect, onClose }: ActionSelectionPanelProps) {
    const [searchTerm, setSearchTerm] = useState('')
    const [wizardOpen, setWizardOpen] = useState(false)
    const [branchCount, setBranchCount] = useState(3)

    const handleActionClick = (actionId: string) => {
        if (actionId === 'parallel') {
            setWizardOpen(true)
        } else {
            onSelect(actionId)
        }
    }

    const handleWizardConfirm = () => {
        setWizardOpen(false)
        onSelect('parallel', { branches: branchCount })
    }

    const filteredActions = AVAILABLE_ACTIONS.filter((action) =>
        action.label.toLowerCase().includes(searchTerm.toLowerCase())
    )

    // Group by category
    const groupedActions = filteredActions.reduce((acc, action) => {
        if (!acc[action.category]) {
            acc[action.category] = []
        }
        acc[action.category].push(action)
        return acc
    }, {} as Record<string, ActionType[]>)

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

            {/* Header */}
            <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Add a workflow action
                </Typography>
            </Box>

            {/* Search */}
            <Box sx={{ px: 2, pb: 2 }}>
                <TextField
                    fullWidth
                    variant="outlined"
                    placeholder="Search"
                    size="small"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon color="action" />
                            </InputAdornment>
                        ),
                        endAdornment: searchTerm && (
                            <InputAdornment position="end">
                                <IconButton size="small" onClick={() => setSearchTerm('')}>
                                    <CloseIcon fontSize="small" />
                                </IconButton>
                            </InputAdornment>
                        )
                    }}
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            bgcolor: 'action.hover',
                            '& fieldset': { border: 'none' }, // clean look like screenshot
                        }
                    }}
                />
            </Box>

            <Divider />

            {/* List */}
            <Box sx={{ flex: 1, overflowY: 'auto', p: 0 }}>
                {Object.entries(groupedActions).map(([category, actions]) => (
                    <Box key={category} sx={{ mb: 1 }}>
                        <Typography
                            variant="subtitle2"
                            color="text.secondary"
                            sx={{ px: 2, py: 1.5, fontWeight: 600 }}
                        >
                            {category}
                        </Typography>
                        <List disablePadding>
                            {actions.map((action) => (
                                <ListItem key={action.id} disablePadding sx={{ px: 2, mb: 1 }}>
                                    <ListItemButton
                                        onClick={() => handleActionClick(action.id)}
                                        sx={{
                                            border: '1px solid',
                                            borderColor: 'divider',
                                            borderRadius: 2,
                                            p: 1.5,
                                            alignItems: 'flex-start',
                                            '&:hover': {
                                                borderColor: 'primary.main',
                                                bgcolor: 'action.hover',
                                            },
                                        }}
                                    >
                                        <ListItemIcon sx={{ minWidth: 40, mt: 0.5 }}>
                                            <Box
                                                sx={{
                                                    width: 32,
                                                    height: 32,
                                                    borderRadius: 1,
                                                    bgcolor: 'primary.main', // or specific color per type
                                                    color: 'white',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                }}
                                            >
                                                {action.icon}
                                            </Box>
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={
                                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                    {action.label}
                                                </Typography>
                                            }
                                            secondary={
                                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.2, mt: 0.5 }}>
                                                    {action.description}
                                                </Typography>
                                            }
                                        />
                                    </ListItemButton>
                                </ListItem>
                            ))}
                        </List>

                    </Box>
                ))}

                {filteredActions.length === 0 && (
                    <Box sx={{ p: 4, textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                            No actions found
                        </Typography>
                    </Box>
                )}
            </Box>

            {/* Parallel Wizard Dialog */}
            <Dialog open={wizardOpen} onClose={() => setWizardOpen(false)}>
                <DialogTitle>Parallel Execution</DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 1, minWidth: 300 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Run multiple agents in parallel branches. Results will be aggregated automatically.
                        </Typography>
                        <FormControl fullWidth>
                            <InputLabel id="branch-select-label">Number of Branches</InputLabel>
                            <Select
                                labelId="branch-select-label"
                                value={branchCount}
                                label="Number of Branches"
                                onChange={(e) => setBranchCount(Number(e.target.value))}
                            >
                                <MenuItem value={2}>2 Branches</MenuItem>
                                <MenuItem value={3}>3 Branches</MenuItem>
                                <MenuItem value={4}>4 Branches</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setWizardOpen(false)}>Cancel</Button>
                    <Button onClick={handleWizardConfirm} variant="contained" autoFocus>
                        Create Branches
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    )
}
