/**
 * Conditional Edge Component for XYFlow
 */

import React from 'react'
import { EdgeProps, getBezierPath } from 'reactflow'
import { Box } from '@mui/material'

export default function ConditionalEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  return (
    <>
      <path
        id={id}
        style={{
          stroke: data?.condition ? '#ff9800' : '#b1b1b7',
          strokeWidth: 2,
          strokeDasharray: data?.condition ? '5,5' : 'none',
        }}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
      />
      {data?.condition && (
        <foreignObject
          width={150}
          height={40}
          x={labelX - 75}
          y={labelY - 20}
          className="edgebutton-foreignobject"
          requiredExtensions="http://www.w3.org/1999/xhtml"
        >
          <Box
            sx={{
              backgroundColor: 'warning.light',
              border: '1px solid',
              borderColor: 'warning.main',
              borderRadius: 1,
              padding: 0.5,
              fontSize: '0.7rem',
              textAlign: 'center',
            }}
          >
            {data.condition.length > 20
              ? `${data.condition.substring(0, 20)}...`
              : data.condition}
          </Box>
        </foreignObject>
      )}
    </>
  )
}
