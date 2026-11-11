import { useCallback, useState } from 'react'
import { ConfirmDialog } from '../components/ios/ConfirmDialog'

export function useConfirm() {
  const [dialog, setDialog] = useState(null)

  const confirm = useCallback((options) => {
    return new Promise((resolve) => {
      setDialog({
        title: options.title,
        message: options.message,
        cancelLabel: options.cancelLabel || 'Cancelar',
        confirmLabel: options.confirmLabel || 'Confirmar',
        destructive: Boolean(options.destructive),
        confirmTone: options.confirmTone || (options.destructive ? 'destructive' : 'primary'),
        resolve,
      })
    })
  }, [])

  function close(value) {
    dialog?.resolve(value)
    setDialog(null)
  }

  const dialogElement = (
    <ConfirmDialog
      open={Boolean(dialog)}
      title={dialog?.title}
      message={dialog?.message}
      cancelLabel={dialog?.cancelLabel}
      confirmLabel={dialog?.confirmLabel}
      destructive={dialog?.destructive}
      confirmTone={dialog?.confirmTone}
      onCancel={() => close(false)}
      onConfirm={() => close(true)}
    />
  )

  return [confirm, dialogElement]
}
