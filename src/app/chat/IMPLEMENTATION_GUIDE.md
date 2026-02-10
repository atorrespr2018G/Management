# Phase 1 Frontend Implementation Guide — RLM Toggle

**Objective**: Add RLM toggle to the Orchestration panel in the Chat page

---

## Where to Add the Toggle

### File: `src/app/chat/page.tsx`

The RLM toggle should be added to the **Agent Data Panel** (right side panel, currently shows agent info).

**Current Structure** (lines ~450-end):

```
Main Chat Area
├── Chat Window (left 60%)
│   ├── Messages Area
│   └── Input Area (where user types)
└── Agent Data Panel (right 35%, desktop only)
    └── [YOUR CODE: Add RLM toggle here]
```

---

## Step-by-Step Implementation

### 1. Add State for RLM Toggle

**At the top with other useState hooks** (around line 45):

```typescript
const [rlmEnabled, setRlmEnabled] = useState(false);
```

### 2. Add RLM Toggle UI in Agent Data Panel

**Find the Agent Data Panel section** (around line 468):

```tsx
{/* Agent Data Panel (Desktop) */}
<Paper
  elevation={3}
  sx={{
    flex: '0 0 350px',
    display: { xs: 'none', lg: 'flex' },
    flexDirection: 'column',
    overflow: 'hidden',
  }}
>
```

**Inside this Panel, add Advanced Options section**. Add this code after the Paper opening tag:

```tsx
<Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', overflowY: 'auto' }}>
	{/* Existing Agent Data content here... */}

	{/* === ADVANCED/EXPERIMENTAL OPTIONS === */}
	<Accordion defaultExpanded={false}>
		<AccordionSummary expandIcon={<ExpandMoreIcon />}>
			<Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
				Advanced / Experimental
			</Typography>
		</AccordionSummary>
		<AccordionDetails>
			<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
				{/* RLM Toggle */}
				<Box
					sx={{
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'space-between',
					}}
				>
					<Box>
						<Typography variant="body2" sx={{ fontWeight: 500 }}>
							RLM Mode
						</Typography>
						<Typography variant="caption" color="text.secondary">
							Recursive Language Model (experimental)
						</Typography>
					</Box>
					<Checkbox
						checked={rlmEnabled}
						onChange={(e) => setRlmEnabled(e.target.checked)}
						size="small"
					/>
				</Box>
			</Box>
		</AccordionDetails>
	</Accordion>
</Box>
```

### 3. Import Required Components

**At the top imports**, add `Checkbox` if not already present:

```typescript
import {
	Box,
	Container,
	Paper,
	TextField,
	IconButton,
	Typography,
	CircularProgress,
	Chip,
	Accordion,
	AccordionSummary,
	AccordionDetails,
	Divider,
	Avatar,
	Drawer,
	useMediaQuery,
	useTheme,
	Checkbox, // ← ADD THIS
} from '@mui/material';
```

### 4. Pass `rlmEnabled` to API Call

**Find the `handleSend` function** (around line 83), and update the `sendMessage` call:

**Before**:

```typescript
const response = await sendMessage(currentSessionId, query);
```

**After**:

```typescript
const response = await sendMessage(currentSessionId, query, {
	rlm_enabled: rlmEnabled,
});
```

### 5. Update `sendMessage` API Function

**File**: `src/services/chatApi.ts`

Update the `sendMessage` function signature to accept options:

**Before**:

```typescript
export async function sendMessage(
  sessionId: string,
  message: string
): Promise<ChatResponse> {
```

**After**:

```typescript
export async function sendMessage(
  sessionId: string,
  message: string,
  options?: { rlm_enabled?: boolean }
): Promise<ChatResponse> {
```

**Then update the API call** to pass the option:

```typescript
const body = {
	message,
	rlm_enabled: options?.rlm_enabled, // ← ADD THIS
};

const response = await fetch(`${API_BASE_URL}/api/v1/workflows/execute`, {
	method: 'POST',
	headers: {
		'Content-Type': 'application/json',
		Authorization: `Bearer ${token}`,
	},
	body: JSON.stringify({
		goal: message,
		use_graph: false,
		rlm_enabled: options?.rlm_enabled, // ← OR ADD THIS depending on API structure
	}),
});
```

---

## Complete Example Code Block

Here's what the Agent Data Panel section should look like:

```tsx
{
	/* Agent Data Panel (Desktop) */
}
<Paper
	elevation={3}
	sx={{
		flex: '0 0 350px',
		display: { xs: 'none', lg: 'flex' },
		flexDirection: 'column',
		overflow: 'hidden',
		borderRadius: 2,
	}}
	ref={agentDataRef}
>
	<Box
		sx={{ p: 2, borderBottom: 1, borderColor: 'divider', overflowY: 'auto' }}
	>
		{/* Existing agent data content */}
		{latestAssistantMessage && (
			<>
				<Typography variant="h6" sx={{ mb: 2 }}>
					Agent Response
				</Typography>
				{/* ... existing agent response code ... */}
			</>
		)}

		{/* === ADVANCED/EXPERIMENTAL OPTIONS === */}
		<Accordion defaultExpanded={false} sx={{ mt: 2 }}>
			<AccordionSummary expandIcon={<ExpandMoreIcon />}>
				<Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
					Advanced / Experimental
				</Typography>
			</AccordionSummary>
			<AccordionDetails>
				<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
					{/* RLM Toggle */}
					<Box
						sx={{
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'space-between',
						}}
					>
						<Box>
							<Typography variant="body2" sx={{ fontWeight: 500 }}>
								RLM Mode
							</Typography>
							<Typography variant="caption" color="text.secondary">
								Recursive Language Model (experimental)
							</Typography>
						</Box>
						<Checkbox
							checked={rlmEnabled}
							onChange={(e) => setRlmEnabled(e.target.checked)}
							size="small"
						/>
					</Box>
				</Box>
			</AccordionDetails>
		</Accordion>
	</Box>
</Paper>;
```

---

## Visual Layout

```
┌─────────────────────────────────────────────┐
│         CHAT PAGE                           │
├──────────────────────┬──────────────────────┤
│                      │                      │
│   MESSAGES AREA      │   AGENT DATA PANEL   │
│                      │  ┌──────────────────┐│
│                      │  │ Agent Response   ││
│                      │  │ (if any)         ││
│                      │  └──────────────────┘│
│                      │  ┌──────────────────┐│
│                      │  │ Advanced /     ▼ ││
│                      │  │ Experimental     ││
│                      │  │ ┌──────────────┐ ││
│                      │  │ │ RLM Mode  ☐ │ ││  ← ADD HERE
│                      │  │ │ Experimental │ ││
│                      │  │ └──────────────┘ ││
│                      │  └──────────────────┘│
├──────────────────────┴──────────────────────┤
│ INPUT: "Ask a question..." | [SEND BTN]    │
└──────────────────────────────────────────────┘
```

---

## Testing

### Test 1: Toggle is Visible

1. Open Chat page on desktop
2. Look for "Advanced / Experimental" section in right panel
3. Should be a clickable accordion

### Test 2: Toggle State Persists in Input

1. Toggle RLM ON
2. Send a message
3. Check logs or network tab to see `rlm_enabled: true` in request

### Test 3: Backend Receives Toggle

1. Send message with RLM ON
2. Check backend logs for: "RLM branch selected"
3. Send message with RLM OFF
4. Check backend logs for: "Default sequential branch selected"

---

## Key Points

✅ **Toggle location**: Right panel, Advanced/Experimental section  
✅ **Default state**: OFF (false)  
✅ **Visibility**: Desktop only (using `display: { xs: 'none', lg: 'flex' }`)  
✅ **Persistence**: Per-session toggle (resets when page refreshes)  
✅ **Backend integration**: Passes `rlm_enabled` in WorkflowRequest

---

## Next Steps

1. Add the toggle component to Chat page
2. Update `sendMessage` function to pass `rlm_enabled` parameter
3. Verify backend logs show "RLM branch selected"
4. Test both ON and OFF states

---

## Questions?

If the toggle isn't appearing:

- Make sure you're on desktop (not mobile, lg breakpoint)
- Check that Checkbox is imported
- Verify the Accordion import is present

If backend isn't receiving the toggle:

- Check `sendMessage` function passes `rlm_enabled` in request body
- Verify WorkflowRequest type includes `rlm_enabled?: boolean`
