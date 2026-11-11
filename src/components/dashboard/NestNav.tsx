import { useEffect, useRef, useState } from 'react'
import type { ComponentType } from 'react'
import gsap from 'gsap'
import { Check, Pencil, Plus, RotateCcw, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useLangValue } from '@/components/landing/i18n'
import { Skeleton } from '@/components/ui/skeleton'
import { SkeletonNavRow } from '@/components/dashboard/skeletons'
import {
  MAX_COLLECTIONS,
  dropActionFor,
  normalizeName,
  type Collection,
  type CollectionRule,
} from '@/lib/collections'

type Builtin = {
  id: string
  labelKey: string
  icon: ComponentType<{ className?: string }>
  count: number
}

const RULE_OPTIONS: { id: string; labelKey: string; build: () => CollectionRule }[] = [
  { id: 'reason:finish', labelKey: 'reason.finish', build: () => ({ type: 'reason', reason: 'finish' }) },
  { id: 'reason:explore', labelKey: 'reason.explore', build: () => ({ type: 'reason', reason: 'explore' }) },
  { id: 'reason:remember', labelKey: 'reason.remember', build: () => ({ type: 'reason', reason: 'remember' }) },
  { id: 'reason:decide', labelKey: 'reason.decide', build: () => ({ type: 'reason', reason: 'decide' }) },
  { id: 'documentation', labelKey: 'kind.documentation', build: () => ({ type: 'documentation' }) },
  { id: 'once', labelKey: 'nest.rule.once', build: () => ({ type: 'once' }) },
  { id: 'ephemeral', labelKey: 'nest.rule.ephemeral', build: () => ({ type: 'ephemeral' }) },
]

export function NestNav({
  builtins,
  collections,
  collectionCounts,
  view,
  activeCollection,
  editMode,
  projects,
  selectedGroup,
  keepViews = [],
  onSelectView,
  onSelectCollection,
  onSelectGroup,
  onAddCollection,
  onRemoveCollection,
  onRenameCollection,
  onHideBuiltin,
  onRestoreDefaults,
  onRenameProject,
  onDeleteProject,
  onToggleEdit,
  onAddProject,
  dropViews = [],
  dragOver = null,
  loading = false,
  compact = false,
  collapsed = false,
}: {
  builtins: Builtin[]
  collections: Collection[]
  collectionCounts: Record<string, number>
  view: string
  activeCollection: string | null
  editMode: boolean
  projects: { id: string; name: string; count: number }[]
  selectedGroup: string | null
  keepViews?: string[]
  onSelectView: (id: string) => void
  onSelectCollection: (id: string) => void
  onSelectGroup: (id: string) => void
  onAddCollection: (name: string, rule: CollectionRule) => void
  onRemoveCollection: (id: string) => void
  onRenameCollection: (id: string, name: string) => void
  onHideBuiltin: (id: string) => void
  onRestoreDefaults: () => void
  onRenameProject?: (id: string, name: string) => void
  onDeleteProject?: (id: string) => void
  onToggleEdit: () => void
  onAddProject?: () => void
  dropViews?: string[]
  dragOver?: string | null
  loading?: boolean
  compact?: boolean
  collapsed?: boolean
}) {
  const { t } = useLangValue()
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [ruleId, setRuleId] = useState(RULE_OPTIONS[0].id)
  const [error, setError] = useState<string | null>(null)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [renamingProjectId, setRenamingProjectId] = useState<string | null>(null)
  const [projectRenameValue, setProjectRenameValue] = useState('')
  // Au déploiement, les libellés apparaissent après un bref shimmer de squelette.
  const [revealed, setRevealed] = useState(!collapsed)
  const panelRef = useRef<HTMLDivElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (collapsed) {
      setRevealed(false)
      return
    }
    const timer = window.setTimeout(() => setRevealed(true), 210)
    return () => window.clearTimeout(timer)
  }, [collapsed])

  useEffect(() => {
    if (!adding || !panelRef.current) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    gsap.fromTo(
      panelRef.current,
      { height: 0, opacity: 0, y: -6 },
      { height: 'auto', opacity: 1, y: 0, duration: 0.26, ease: 'power3.out' },
    )
  }, [adding])

  useEffect(() => {
    if (adding) nameRef.current?.focus()
  }, [adding])

  function nameTaken(candidate: string, exceptId?: string): boolean {
    const normalized = normalizeName(candidate)
    return collections.some(
      (item) => item.id !== exceptId && normalizeName(item.name) === normalized,
    )
  }

  function submit() {
    const trimmed = name.trim()
    if (!trimmed) {
      setError(t('nest.nameRequired'))
      return
    }
    if (normalizeName(trimmed).length > 24) {
      setError(t('nest.nameTooLong'))
      return
    }
    if (nameTaken(trimmed)) {
      setError(t('nest.duplicate'))
      return
    }
    if (collections.length >= MAX_COLLECTIONS) {
      setError(t('nest.limit'))
      return
    }
    const option = RULE_OPTIONS.find((item) => item.id === ruleId) ?? RULE_OPTIONS[0]
    onAddCollection(trimmed, option.build())
    setName('')
    setError(null)
    setAdding(false)
  }

  function commitRename() {
    if (!renamingId) return
    const trimmed = renameValue.trim()
    if (!trimmed) {
      setError(t('nest.nameRequired'))
      return
    }
    if (nameTaken(trimmed, renamingId)) {
      setError(t('nest.duplicate'))
      return
    }
    onRenameCollection(renamingId, trimmed)
    setRenamingId(null)
    setError(null)
  }

  const rowClass = (active: boolean) =>
    cn(
      'group flex w-full items-center gap-2.5 rounded-lg py-2 text-sm transition-colors',
      collapsed ? 'justify-center px-2' : 'px-3',
      compact
        ? active
          ? 'bg-accent text-foreground'
          : 'text-foreground/75 hover:bg-accent'
        : active
          ? 'bg-sidebar-accent font-medium text-sidebar-foreground'
          : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground',
    )

  const labelClass = compact ? 'text-foreground/50' : 'text-sidebar-foreground/50'
  const iconClass = compact
    ? 'text-foreground/60 hover:bg-accent hover:text-foreground'
    : 'text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground'
  const smallIconClass = compact
    ? 'text-foreground/50 hover:text-destructive'
    : 'text-sidebar-foreground/50 hover:text-destructive'

  // Pendant le premier chargement, la liste montre des rangées squelettes
  // plutôt que des compteurs à zéro (évite le clignotement des chiffres).
  if (loading && !collapsed) {
    return (
      <div role="status" aria-busy="true" data-skeleton-nav="" className="space-y-0.5">
        <div className={cn('pb-1', compact ? 'px-3' : 'px-3')}>
          <Skeleton className="h-3 w-24" />
        </div>
        {Array.from({ length: 8 }).map((_, index) => (
          <SkeletonNavRow key={index} delay={(index % 6) * 60} />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-0.5">
      <div
        className={cn(
          'flex items-center pb-1',
          collapsed ? 'justify-center' : 'justify-between px-3',
        )}
      >
        {!collapsed && (
          <span className={cn('relative flex items-center gap-1.5 text-xs font-medium', labelClass)}>
            <span aria-hidden="true" className="size-1.5 rounded-full bg-lime" />
            <span className="relative block">
              <span
                aria-hidden="true"
                className={cn(
                  'skeleton-shimmer absolute inset-0 h-3 rounded transition-opacity duration-200',
                  revealed ? 'opacity-0' : 'opacity-100',
                )}
              />
              <span className={cn('block transition-opacity duration-200', revealed ? 'opacity-100' : 'opacity-0')}>
                {t('nest.title')}
              </span>
            </span>
          </span>
        )}
        <button
          type="button"
          onClick={onToggleEdit}
          className={cn(
            'rounded p-1',
            collapsed && 'grid size-8 place-items-center',
            iconClass,
            editMode && 'text-lime',
          )}
          aria-label={t('nest.manage')}
          title={t('nest.manage')}
          aria-pressed={editMode}
        >
          <Pencil className="size-3.5" aria-hidden="true" />
        </button>
      </div>

      {!collapsed && (
        <p className={cn('pb-1 text-[11px] leading-snug', labelClass, 'px-3')}>
          {t('nest.intro')}
        </p>
      )}

      {builtins.map((item) => {
        const Icon = item.icon
        const active = !activeCollection && !selectedGroup && view === item.id
        const canDrop = dropViews.includes(item.id)
        const canHide = editMode && !keepViews.includes(item.id)
        return (
          <div key={item.id} className="relative">
            <button
              type="button"
              data-drop-target={canDrop ? item.id : undefined}
              onClick={() => onSelectView(item.id)}
              title={collapsed ? t(item.labelKey) : undefined}
              aria-label={collapsed ? t(item.labelKey) : undefined}
              className={cn(
                rowClass(active),
                editMode && !canDrop && 'opacity-40',
                editMode && canDrop && 'ring-1 ring-lime/50',
                dragOver === item.id && 'bg-lime text-lime-foreground ring-2 ring-lime',
              )}
            >
              <Icon className="size-4 shrink-0" aria-hidden="true" />
              {!collapsed && (
                <span className="relative min-w-0 flex-1 text-left">
                  <span
                    aria-hidden="true"
                    className={cn(
                      'skeleton-shimmer absolute inset-y-0 left-0 my-auto h-3 w-3/4 rounded transition-opacity duration-200',
                      revealed ? 'opacity-0' : 'opacity-100',
                    )}
                    style={{ transitionDelay: collapsed ? '0ms' : '160ms' }}
                  />
                  <span
                    className={cn(
                      'block truncate transition-opacity duration-200',
                      revealed ? 'opacity-100' : 'opacity-0',
                    )}
                    style={{ transitionDelay: collapsed ? '0ms' : '160ms' }}
                  >
                    {t(item.labelKey)}
                  </span>
                </span>
              )}
              {!collapsed && item.count > 0 && (
                <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[11px] tabular-nums opacity-90">{item.count}</span>
              )}
            </button>
            {editMode && canHide && !collapsed && (
              <button
                type="button"
                onClick={() => onHideBuiltin(item.id)}
                className={cn('absolute top-1/2 right-1 -translate-y-1/2 rounded p-1', smallIconClass)}
                aria-label={`${t('nest.hide')} ${t(item.labelKey)}`}
                title={t('nest.hide')}
              >
                <X className="size-3.5" aria-hidden="true" />
              </button>
            )}
          </div>
        )
      })}

      {collections.map((collection) => {
        const active = activeCollection === collection.id
        const canDrop = dropActionFor(collection.rule) !== null
        return (
          <div key={collection.id} className="relative">
            {renamingId === collection.id ? (
              <div className="flex items-center gap-1 px-2 py-1">
                <Input
                  value={renameValue}
                  onChange={(event) => setRenameValue(event.target.value)}
                  aria-label={t('nest.rename')}
                  className="h-7 min-w-0 flex-1 text-xs"
                  autoFocus
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') commitRename()
                    if (event.key === 'Escape') {
                      setRenamingId(null)
                      setError(null)
                    }
                  }}
                  onBlur={() => {
                    if (!renameValue.trim()) setRenamingId(null)
                  }}
                />
                <button
                  type="button"
                  onClick={commitRename}
                  className={cn('rounded p-1', iconClass)}
                  aria-label={t('nest.save')}
                  title={t('nest.save')}
                >
                  <Check className="size-3.5" aria-hidden="true" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                data-drop-target={canDrop ? `collection:${collection.id}` : undefined}
                onClick={() => onSelectCollection(collection.id)}
                title={collapsed ? collection.name : undefined}
                aria-label={collapsed ? collection.name : undefined}
                className={cn(
                  rowClass(active),
                  editMode && !canDrop && 'opacity-40',
                  editMode && canDrop && 'ring-1 ring-lime/50',
                  dragOver === `collection:${collection.id}` &&
                    'bg-lime text-lime-foreground ring-2 ring-lime',
                )}
              >
                <span className="size-2 shrink-0 rounded-full bg-lime" aria-hidden="true" />
                {!collapsed && (
                  <span className="relative min-w-0 flex-1 text-left">
                    <span
                      aria-hidden="true"
                      className={cn(
                        'skeleton-shimmer absolute inset-y-0 left-0 my-auto h-3 w-3/4 rounded transition-opacity duration-200',
                        revealed ? 'opacity-0' : 'opacity-100',
                      )}
                      style={{ transitionDelay: collapsed ? '0ms' : '160ms' }}
                    />
                    <span
                      className={cn(
                        'block truncate transition-opacity duration-200',
                        revealed ? 'opacity-100' : 'opacity-0',
                      )}
                      style={{ transitionDelay: collapsed ? '0ms' : '160ms' }}
                    >
                      {collection.name}
                    </span>
                  </span>
                )}
                {!collapsed && (
                  <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[11px] tabular-nums opacity-90">
                    {collectionCounts[collection.id] ?? 0}
                  </span>
                )}
              </button>
            )}
            {editMode && !collapsed && renamingId !== collection.id && (
              <div className="absolute top-1/2 right-1 flex -translate-y-1/2 items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setRenamingId(collection.id)
                    setRenameValue(collection.name)
                    setError(null)
                  }}
                  className={cn('rounded p-1', smallIconClass)}
                  aria-label={`${t('nest.rename')} ${collection.name}`}
                  title={t('nest.rename')}
                >
                  <Pencil className="size-3" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => onRemoveCollection(collection.id)}
                  className={cn('rounded p-1', smallIconClass)}
                  aria-label={`${t('nest.remove')} ${collection.name}`}
                  title={t('nest.remove')}
                >
                  <X className="size-3.5" aria-hidden="true" />
                </button>
              </div>
            )}
          </div>
        )
      })}

      {editMode && !collapsed && (
        <div className="px-3 py-1">
          <button
            type="button"
            onClick={() => {
              setAdding((value) => !value)
              setError(null)
            }}
            className={cn(
              'flex w-full items-center gap-1.5 rounded-lg border border-dashed px-2 py-1.5 text-xs',
              compact
                ? 'border-border text-foreground/60 hover:bg-accent'
                : 'border-sidebar-border text-sidebar-foreground/60 hover:bg-sidebar-accent',
            )}
            aria-expanded={adding}
          >
            <Plus className="size-3.5" aria-hidden="true" />
            {t('nest.add')}
          </button>
        </div>
      )}

      {adding && !collapsed && (
        <div ref={panelRef} className="overflow-hidden">
          <div className="mt-1 space-y-2 rounded-xl border border-border bg-card p-2">
            <Input
              ref={nameRef}
              value={name}
              onChange={(event) => {
                setName(event.target.value)
                setError(null)
              }}
              placeholder={t('nest.namePlaceholder')}
              aria-label={t('nest.namePlaceholder')}
              className="h-8 text-xs"
              onKeyDown={(event) => {
                if (event.key === 'Enter') submit()
                if (event.key === 'Escape') setAdding(false)
              }}
            />
            <div className="flex flex-wrap gap-1">
              {RULE_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setRuleId(option.id)}
                  className={cn(
                    'rounded-full border px-2 py-1 text-[11px]',
                    ruleId === option.id
                      ? 'border-lime bg-lime text-lime-foreground'
                      : 'border-border text-muted-foreground',
                  )}
                >
                  {t(option.labelKey)}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground">{t('nest.auto')}</p>
            {error && <p className="text-[11px] text-destructive">{error}</p>}
            <div className="flex items-center gap-2">
              <Button size="sm" className="h-7 px-2 text-xs" onClick={submit} disabled={!name.trim()}>
                <Check className="size-3.5" aria-hidden="true" />
                {t('nest.create')}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-xs"
                onClick={() => {
                  setAdding(false)
                  setError(null)
                }}
              >
                {t('dash.cancel')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {editMode && !collapsed && (
        <div className="px-3 py-1">
          <button
            type="button"
            onClick={onRestoreDefaults}
            className={cn(
              'flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs',
              iconClass,
            )}
          >
            <RotateCcw className="size-3.5" aria-hidden="true" />
            {t('nest.restore')}
          </button>
        </div>
      )}

      {projects.length > 0 && (
        <>
          <div
            className={cn(
              'mt-4 flex items-center justify-between pb-1',
              collapsed ? 'px-1' : 'px-3',
            )}
          >
            {!collapsed && (
              <span className={cn('flex items-center gap-1.5 text-xs font-medium', labelClass)}>
                <span aria-hidden="true" className="size-1.5 rounded-full bg-lime" />
                {t('dash.projects')}
              </span>
            )}
            {onAddProject && !collapsed && (
              <button
                type="button"
                onClick={onAddProject}
                className={cn('rounded p-1', iconClass)}
                aria-label={t('dash.newProject')}
                title={t('dash.newProject')}
              >
                <Plus className="size-3.5" aria-hidden="true" />
              </button>
            )}
          </div>
          {projects.map((project) => (
            <div key={project.id} className="relative">
              {renamingProjectId === project.id ? (
                <div className="flex items-center gap-1 px-2 py-1">
                  <Input
                    value={projectRenameValue}
                    onChange={(event) => setProjectRenameValue(event.target.value)}
                    aria-label={t('nest.rename')}
                    className="h-7 min-w-0 flex-1 text-xs"
                    autoFocus
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        const trimmed = projectRenameValue.trim()
                        if (trimmed) onRenameProject?.(project.id, trimmed)
                        setRenamingProjectId(null)
                      }
                      if (event.key === 'Escape') setRenamingProjectId(null)
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const trimmed = projectRenameValue.trim()
                      if (trimmed) onRenameProject?.(project.id, trimmed)
                      setRenamingProjectId(null)
                    }}
                    className={cn('rounded p-1', iconClass)}
                    aria-label={t('nest.save')}
                    title={t('nest.save')}
                  >
                    <Check className="size-3.5" aria-hidden="true" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  data-drop-target={`project:${project.id}`}
                  onClick={() => onSelectGroup(project.id)}
                  title={collapsed ? project.name : undefined}
                  aria-label={collapsed ? project.name : undefined}
                  className={cn(
                    rowClass(selectedGroup === project.id),
                    dragOver === `project:${project.id}` &&
                      'bg-lime text-lime-foreground ring-2 ring-lime',
                  )}
                >
                  <span className="size-2 shrink-0 rounded-full bg-lime" aria-hidden="true" />
                  {!collapsed && (
                    <span className="relative min-w-0 flex-1 text-left">
                      <span
                        aria-hidden="true"
                        className={cn(
                          'skeleton-shimmer absolute inset-y-0 left-0 my-auto h-3 w-3/4 rounded transition-opacity duration-200',
                          revealed ? 'opacity-0' : 'opacity-100',
                        )}
                        style={{ transitionDelay: collapsed ? '0ms' : '160ms' }}
                      />
                      <span
                        className={cn(
                          'block truncate transition-opacity duration-200',
                          revealed ? 'opacity-100' : 'opacity-0',
                        )}
                        style={{ transitionDelay: collapsed ? '0ms' : '160ms' }}
                      >
                        {project.name}
                      </span>
                    </span>
                  )}
                  {!collapsed && project.count > 0 && (
                    <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[11px] tabular-nums opacity-90">{project.count}</span>
                  )}
                </button>
              )}
              {editMode && !collapsed && renamingProjectId !== project.id && (
                <div className="absolute top-1/2 right-1 flex -translate-y-1/2 items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setRenamingProjectId(project.id)
                      setProjectRenameValue(project.name)
                    }}
                    className={cn('rounded p-1', smallIconClass)}
                    aria-label={`${t('nest.rename')} ${project.name}`}
                    title={t('nest.rename')}
                  >
                    <Pencil className="size-3" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteProject?.(project.id)}
                    className={cn('rounded p-1', smallIconClass)}
                    aria-label={`${t('nest.remove')} ${project.name}`}
                    title={t('nest.remove')}
                  >
                    <X className="size-3.5" aria-hidden="true" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </>
      )}

      {builtins.length === 0 && collections.length === 0 && !collapsed && (
        <p className={cn('px-3 py-2 text-xs', labelClass)}>{t('nest.empty')}</p>
      )}
    </div>
  )
}
