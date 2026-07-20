import { useRef, useState } from 'react'
import { Upload, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { importDepuisFichier, type ImportProgress } from '@/lib/importData'

export function ImportBanner({ vide }: { vide: boolean }) {
  const qc = useQueryClient()
  const inputRef = useRef<HTMLInputElement>(null)
  const [progress, setProgress] = useState<ImportProgress | null>(null)
  const [busy, setBusy] = useState(false)

  async function onFile(file: File | undefined) {
    if (!file) return
    setBusy(true)
    setProgress(null)
    try {
      const res = await importDepuisFichier(file, setProgress)
      toast.success(`Import terminé : ${res.entreprises} entreprises, ${res.contacts} contacts.`)
      qc.invalidateQueries({ queryKey: ['entreprises'] })
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setBusy(false)
      setProgress(null)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const label = busy
    ? progress
      ? progress.phase === 'termine'
        ? 'Finalisation…'
        : `Import ${progress.phase} ${progress.done}/${progress.total}`
      : 'Lecture du fichier…'
    : vide
      ? 'Importer mes données'
      : 'Ré-importer / mettre à jour'

  return (
    <div
      className={
        vide
          ? 'flex flex-col items-center gap-3 rounded-lg border border-dashed bg-[var(--card)] p-8 text-center'
          : 'inline-flex'
      }
    >
      {vide && (
        <div>
          <div className="text-sm font-medium">Aucune donnée pour l'instant</div>
          <p className="mx-auto mt-1 max-w-md text-xs text-[var(--muted-foreground)]">
            Importe ton fichier <code>donnees_consolidees.json</code> (téléchargé depuis ton repo
            privé). Les données sont insérées sous ton compte, jamais exposées publiquement.
          </p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(e) => onFile(e.target.files?.[0])}
      />
      <button
        type="button"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        className="btn-salt inline-flex items-center gap-2 px-3.5 py-2 text-sm disabled:opacity-60"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        {label}
      </button>
    </div>
  )
}
