'use client'

import { memo } from 'react'
import { Handle, Position, NodeProps } from '@xyflow/react'
import { Card, CardContent, Typography, Box } from '@mui/material'
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer'

export interface AskQuestionNodeData extends Record<string, unknown> {
    actionId: string
    question: string
    variableName: string
}

const AskQuestionNode = ({ data }: NodeProps) => {
    return (
        <>
            <Handle type="target" position={Position.Left} />

            <Card
                sx={{
                    minWidth: 220,
                    maxWidth: 300,
                    borderRadius: 2,
                    boxShadow: 2,
                    border: '2px solid',
                    borderColor: 'info.main',
                    '&:hover': {
                        boxShadow: 4,
                        borderColor: 'info.dark',
                    },
                }}
            >
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Box
                            sx={{
                                width: 32,
                                height: 32,
                                borderRadius: 1,
                                bgcolor: 'info.main',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <QuestionAnswerIcon fontSize="small" />
                        </Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            Ask a Question
                        </Typography>
                    </Box>

                    {/* <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        Question
                    </Typography> */}
                </CardContent>
            </Card>

            <Handle type="source" position={Position.Right} />
        </>
    )
}

export default memo(AskQuestionNode)
