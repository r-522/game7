import { useState, useEffect, useCallback } from 'react'
import {
  useKeyBindStore,
  DEFAULT_BINDS,
  type KeyAction,
} from '@/state/useKeyBindStore'
import styles from './KeyBindScreen.module.css'

interface ActionMeta {
  action: KeyAction
  label: string
}

const ACTION_LIST: ActionMeta[] = [
  { action: 'moveUp',      label: '移動（上）' },
  { action: 'moveDown',    label: '移動（下）' },
  { action: 'moveLeft',    label: '移動（左）' },
  { action: 'moveRight',   label: '移動（右）' },
  { action: 'attackLight', label: '弱攻撃' },
  { action: 'attackHeavy', label: '強攻撃' },
  { action: 'special',     label: '必殺技' },
  { action: 'dodge',       label: '回避' },
  { action: 'block',       label: 'ガード' },
  { action: 'lockOn',      label: 'ロックオン' },
  { action: 'throwAttack', label: '投げ' },
  { action: 'interact',    label: 'インタラクト' },
  { action: 'pause',       label: 'ポーズ' },
]

function formatKey(code: string): string {
  if (code === 'Mouse0') return 'マウス左'
  if (code === 'Mouse2') return 'マウス右'
  if (code === 'Space') return 'スペース'
  if (code === 'ShiftF') return 'Shift+F'
  if (code === 'Escape') return 'Esc'
  if (code.startsWith('Key')) return code.slice(3)
  if (code.startsWith('Digit')) return code.slice(5)
  return code
}

interface Props {
  onClose: () => void
}

export function KeyBindScreen({ onClose }: Props): JSX.Element {
  const binds = useKeyBindStore((s) => s.binds)
  const setBinding = useKeyBindStore((s) => s.setBinding)
  const resetAll = useKeyBindStore((s) => s.resetAll)

  const [remapping, setRemapping] = useState<KeyAction | null>(null)
  const [conflict, setConflict] = useState<string | null>(null)

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (remapping === null) return
      e.preventDefault()
      e.stopPropagation()

      // Map key event to our code format
      const code = e.code
      if (code === 'ShiftLeft' || code === 'ShiftRight') {
        // next key will determine combo — for now treat Shift+F specially
        return
      }

      // Detect conflicts
      const existing = Object.entries(binds).find(
        ([action, k]) => k === code && action !== remapping
      )
      if (existing) {
        setConflict(existing[0])
      } else {
        setConflict(null)
      }

      setBinding(remapping, code)
      setRemapping(null)
    },
    [remapping, binds, setBinding]
  )

  const handleMouseDown = useCallback(
    (e: MouseEvent) => {
      if (remapping === null) return
      e.preventDefault()
      e.stopPropagation()

      let code: string
      if (e.button === 0) code = 'Mouse0'
      else if (e.button === 2) code = 'Mouse2'
      else if (e.button === 1) code = 'Mouse1'
      else return

      const existing = Object.entries(binds).find(
        ([action, k]) => k === code && action !== remapping
      )
      if (existing) {
        setConflict(existing[0])
      } else {
        setConflict(null)
      }

      setBinding(remapping, code)
      setRemapping(null)
    },
    [remapping, binds, setBinding]
  )

  useEffect(() => {
    if (remapping === null) return
    window.addEventListener('keydown', handleKeyDown, true)
    window.addEventListener('mousedown', handleMouseDown, true)
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true)
      window.removeEventListener('mousedown', handleMouseDown, true)
    }
  }, [remapping, handleKeyDown, handleMouseDown])

  // Dismiss on Escape when not remapping
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.code === 'Escape' && remapping === null) onClose()
    }
    window.addEventListener('keydown', onEsc)
    return () => window.removeEventListener('keydown', onEsc)
  }, [remapping, onClose])

  const handleRemap = (action: KeyAction) => {
    setConflict(null)
    setRemapping(action)
  }

  const handleCancel = () => setRemapping(null)

  const handleReset = () => {
    resetAll()
    setConflict(null)
    setRemapping(null)
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.panel}>
        <h2 className={styles.title}>キー設定</h2>

        {conflict && (
          <div className={styles.conflictBanner}>
            ⚠ 「{ACTION_LIST.find((a) => a.action === conflict)?.label ?? conflict}」
            と競合しています
          </div>
        )}

        {remapping && (
          <div className={styles.promptBanner}>
            <span className={styles.promptText}>キーを押してください…</span>
            <button className={styles.cancelBtn} onClick={handleCancel}>
              キャンセル
            </button>
          </div>
        )}

        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>アクション</th>
              <th className={styles.th}>現在のキー</th>
              <th className={styles.th}></th>
            </tr>
          </thead>
          <tbody>
            {ACTION_LIST.map(({ action, label }) => {
              const isRemapping = remapping === action
              const isDefault =
                binds[action] === DEFAULT_BINDS[action]
              return (
                <tr
                  key={action}
                  className={`${styles.row} ${isRemapping ? styles.rowActive : ''}`}
                >
                  <td className={styles.tdLabel}>{label}</td>
                  <td className={styles.tdKey}>
                    <kbd
                      className={`${styles.keyBadge} ${isDefault ? '' : styles.keyModified}`}
                    >
                      {formatKey(binds[action])}
                    </kbd>
                  </td>
                  <td className={styles.tdAction}>
                    <button
                      className={`${styles.remapBtn} ${isRemapping ? styles.remapBtnActive : ''}`}
                      onClick={() => handleRemap(action)}
                      disabled={remapping !== null && !isRemapping}
                    >
                      {isRemapping ? '待機中…' : '変更'}
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        <div className={styles.footer}>
          <button className={styles.resetBtn} onClick={handleReset}>
            デフォルトに戻す
          </button>
          <button className={styles.closeBtn} onClick={onClose}>
            閉じる
          </button>
        </div>
      </div>
    </div>
  )
}
