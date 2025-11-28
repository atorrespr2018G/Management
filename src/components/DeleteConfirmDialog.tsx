import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from "@mui/material";

interface DeleteConfirmDialogProps {
    open: boolean;
    title?: string;
    content?: string;
    onConfirm: () => void;
    onClose: () => void;
}

export default function DeleteConfirmDialog({
    open,
    title = "Delete",
    content = "Are you sure you want to delete this item?",
    onClose,
    onConfirm
}: DeleteConfirmDialogProps) {
    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>{title}</DialogTitle>
            <DialogContent>
                <Typography>{content}</Typography>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="inherit">Cancel</Button>
                <Button onClick={onConfirm} color="error" variant="contained">Delete</Button>
            </DialogActions>
        </Dialog>
    );
}
