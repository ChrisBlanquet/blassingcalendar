import { ConfirmDialog } from './ConfirmDialog'

/** @deprecated Usa ConfirmDialog o useConfirm. */
export function IosAlert({ title, message, cancelLabel, confirmLabel, onCancel, onConfirm, destructive }) {
  return (
    <ConfirmDialog
      open
      title={title}
      message={message}
      cancelLabel={cancelLabel}
      confirmLabel={confirmLabel}
      destructive={destructive}
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  )
}
