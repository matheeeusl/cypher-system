'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

import {
  AdvancementPanel,
  Alert,
  AbilityPicker,
  ChipPicker,
  PoolSplitPicker,
  ConditionBanner,
  ConfirmDialog,
  CypherPicker,
  Pagination,
  InventoryList,
  NotesLog,
  PoolMeter,
  Tabs,
  XpLog,
  type AdvancementStep,
  type CypherPickerItem,
} from '@cypher/ui'

import {
  addCypherAction,
  addItemAction,
  addXpAction,
  adjustPoolAction,
  changeItemQtyAction,
  choosePicksAction,
  learnOptionsAction,
  purchaseAdvancementAction,
  removeItemAction,
  removeXpAction,
  revertAdvancementAction,
  revertLearnAction,
  addNoteAction,
  removeNoteAction,
  updateNoteAction,
} from '@/app/[locale]/characters/[id]/play/actions'
import { POOL_POINTS, type AdvancementChoice } from '@/lib/advancement'
import { customSkillText, toCustomSkill } from '@/lib/custom-skill'
import { fetchCyphers, type CatalogCypher } from '@/lib/graphql/cyphers'
import type { SkillLevel, Stat } from '@/lib/graphql/queries'
import type { Locale } from '@/lib/i18n/auth'
import { loc } from '@/lib/i18n/localized'
import {
  conditionFor,
  playCopy,
  type AdvancementKey,
  type CypherCategoryKey,
} from '@/lib/i18n/play'
import { terms } from '@/lib/i18n/terms'
import { describeItem } from '@/lib/inventory-display'
import type { InventoryItem, PoolKey, PoolPoints } from '@/lib/play'
import type { PlayView } from '@/lib/play-view'

import { LearnPanel } from './LearnPanel'

type TabKey = 'status' | 'skills' | 'inventory' | 'log' | 'notes'

/** Entries per page in the XP log and the advancement history. */
const PAGE_SIZE = 5
// Longest note, in characters (mirrors LIMITS.noteLength in lib/play.ts, which
// is server-only).
const NOTE_MAX_LENGTH = 500

const STEP_ORDER: AdvancementKey[] = ['pools', 'edge', 'effort', 'skills']
const NEXT_LEVEL: Record<SkillLevel, SkillLevel> = {
  INABILITY: 'PRACTICED',
  PRACTICED: 'TRAINED',
  TRAINED: 'SPECIALIZED',
  SPECIALIZED: 'SPECIALIZED',
}

interface PlayScreenProps {
  locale: Locale
  initial: PlayView
}

export function PlayScreen({ locale, initial }: PlayScreenProps) {
  const router = useRouter()
  const copy = playCopy[locale]
  const t = terms[locale]

  const [view, setView] = useState(initial)
  const [tab, setTab] = useState<TabKey>('status')
  const [spent, setSpent] = useState<PoolPoints>(initial.spent)
  const [xp, setXp] = useState(initial.xp)
  // The purchase being confirmed for undoing (an index into view.purchases).
  const [undoIndex, setUndoIndex] = useState<number | null>(null)
  const [undoBusy, setUndoBusy] = useState(false)
  const [historyPage, setHistoryPage] = useState(0)
  const [undoError, setUndoError] = useState<string | undefined>(undefined)
  // The skill whose description is open in the Skills tab (by name).
  const [openSkill, setOpenSkill] = useState<string | null>(null)
  const [inventory, setInventory] = useState<InventoryItem[]>(initial.inventory)
  const [notes, setNotes] = useState(initial.notes)
  const [picker, setPicker] = useState<'pools' | 'edge' | 'skills' | 'abilities' | null>(null)
  const [tierUp, setTierUp] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const [errors, setErrors] = useState<{
    advancement?: string
    picks?: string
    learn?: string
    xp?: string
    notes?: string
    inventory?: string
    general?: string
  }>({})
  const setError = (key: keyof typeof errors, message?: string) =>
    setErrors((prev) => ({ ...prev, [key]: message }))

  // Every server call goes through one queue. Taps arrive faster than requests
  // finish, and the server applies them in the order they *arrive* — so
  // "spend 3, spend 3, recover all" must be sent one after another or a late
  // spend could land after the recovery and undo it.
  const queue = useRef<Promise<unknown>>(Promise.resolve())
  const [pending, setPending] = useState(0)
  function enqueue<T>(job: () => Promise<T>): Promise<T> {
    setPending((n) => n + 1)
    const result = queue.current.then(job, job)
    queue.current = result.catch(() => undefined)
    return result.finally(() => setPending((n) => n - 1))
  }

  // Closing or reloading with changes still queued would drop them: ask first.
  useEffect(() => {
    if (pending === 0) return
    const warn = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [pending])

  // ---- pools --------------------------------------------------------------

  const poolState = view.pools.map((p) => ({
    ...p,
    current: Math.max(0, p.max - (spent[p.key] ?? 0)),
  }))
  const emptyPools = poolState.filter((p) => p.current === 0).length
  const condition = conditionFor(emptyPools)

  function changePool(
    key: PoolKey,
    max: number,
    change: { kind: 'spend' | 'recover'; amount: number | 'all' },
  ) {
    // Optimistic: update now, tell the server in the background. A failure
    // means the screen drifted from what's saved, so say so.
    setSpent((prev) => {
      const current = prev[key] ?? 0
      const next =
        change.kind === 'spend'
          ? Math.min(max, current + (change.amount as number))
          : change.amount === 'all'
            ? 0
            : Math.max(0, current - change.amount)
      return { ...prev, [key]: next }
    })
    void enqueue(() => adjustPoolAction(view.characterId, key, change)).then((res) => {
      if (!res.ok) setError('general', copy.saveFailed)
    })
  }

  // ---- notes ----------------------------------------------------------------

  const characterId = view.characterId

  async function addNote(body: string) {
    setError('notes')
    const res = await enqueue(() => addNoteAction(characterId, body))
    if (res.ok) setNotes((prev) => [...prev, res.note])
    else
      setError(
        'notes',
        res.reason === 'limit' ? copy.log.notesErrors.limit : copy.log.notesErrors.generic,
      )
  }

  async function editNote(id: number, body: string) {
    setError('notes')
    const res = await enqueue(() => updateNoteAction(characterId, id, body))
    if (res.ok) setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, body } : n)))
    else setError('notes', copy.log.notesErrors.generic)
  }

  async function removeNote(id: number) {
    setError('notes')
    const res = await enqueue(() => removeNoteAction(characterId, id))
    if (res.ok) setNotes((prev) => prev.filter((n) => n.id !== id))
    else setError('notes', copy.log.notesErrors.generic)
  }

  // ---- XP -----------------------------------------------------------------

  const xpTotal = xp.reduce((sum, e) => sum + (e.kind === 'gain' ? e.amount : -e.amount), 0)

  async function addXp(entry: { kind: 'gain' | 'spend'; amount: number; reason: string }) {
    setError('xp')
    const res = await enqueue(() => addXpAction(characterId, entry))
    if (res.ok) setXp((prev) => [...prev, res.entry])
    else
      setError(
        'xp',
        res.reason === 'insufficient'
          ? copy.log.errors.insufficient
          : res.reason === 'limit'
            ? copy.log.errors.limit
            : copy.log.errors.generic,
      )
  }

  async function removeXp(id: number) {
    setError('xp')
    const res = await enqueue(() => removeXpAction(characterId, id))
    if (res.ok) setXp((prev) => prev.filter((e) => e.id !== id))
    else
      setError(
        'xp',
        res.reason === 'locked'
          ? copy.log.errors.locked
          : res.reason === 'would_go_negative'
            ? copy.log.errors.wouldGoNegative
            : copy.log.errors.generic,
      )
  }

  // ---- inventory ----------------------------------------------------------

  type InventoryOutcome = Awaited<ReturnType<typeof addItemAction>>
  function applyInventory(res: InventoryOutcome) {
    if (res.ok) {
      setInventory(res.inventory)
      setError('inventory')
    } else {
      setError(
        'inventory',
        res.reason === 'limit' ? copy.inventory.errors.limit : copy.inventory.errors.generic,
      )
    }
  }

  const [catalog, setCatalog] = useState<CatalogCypher[] | null>(null)
  const [catalogFailed, setCatalogFailed] = useState(false)
  const [cypherPickerOpen, setCypherPickerOpen] = useState(false)

  function openCypherPicker() {
    setCypherPickerOpen(true)
    if (catalog === null && !catalogFailed) {
      fetchCyphers().then(setCatalog, () => setCatalogFailed(true))
    }
  }

  // The catalog also supplies the rules text of cyphers already carried, so it
  // is loaded as soon as the inventory is looked at and holds a cypher.
  const hasCypher = inventory.some((it) => it.kind === 'cypher')
  useEffect(() => {
    if (tab === 'inventory' && hasCypher && catalog === null && !catalogFailed) {
      fetchCyphers().then(setCatalog, () => setCatalogFailed(true))
    }
  }, [tab, hasCypher, catalog, catalogFailed])

  /** What a carried item shows when clicked: a cypher's effect (and table), or a note for the player's own. */
  function itemDescription(item: (typeof inventory)[number]): string | undefined {
    if (item.kind === 'item') return copy.inventory.customItem
    const c = catalog?.find((x) => x.id === item.cypherId)
    if (!c) return undefined
    const table = c.effectTable
      ? [
          loc(c.effectTable.label, locale),
          ...c.effectTable.entries.map((e) => `${e.range} — ${loc(e.text, locale)}`),
        ].join('\n')
      : null
    return [loc(c.effectText, locale), table].filter(Boolean).join('\n\n')
  }

  const pickerItems: CypherPickerItem[] | null = useMemo(
    () =>
      catalog
        ? catalog
            .map((c) => ({
              id: c.id,
              name: loc(c.name, locale),
              categoryId: c.category,
              categoryLabel:
                copy.inventory.categories[c.category as CypherCategoryKey] ?? c.category,
              level: c.levelRange,
              effect: loc(c.effectText, locale),
            }))
            .sort((a, b) => a.name.localeCompare(b.name, locale))
        : null,
    [catalog, locale, copy.inventory.categories],
  )

  const cypherCount = inventory.reduce((n, it) => (it.kind === 'cypher' ? n + it.qty : n), 0)

  // ---- advancement --------------------------------------------------------

  const adv = view.advancement
  const bought = new Set(adv.bought)
  const canAfford = xpTotal >= adv.costXp

  const steps: AdvancementStep[] = STEP_ORDER.map((key) => {
    const done = bought.has(key)
    const blocked = !done && adv.nextIsBlocked
    return {
      key,
      label: copy.advancement.steps[key],
      // No buy buttons while a purchase is in flight: a second click would be ignored.
      status: done ? 'purchased' : canAfford && !blocked && !busy ? 'available' : 'locked',
      statusLabel: done
        ? copy.advancement.purchased
        : blocked
          ? copy.advancement.unavailable
          : canAfford
            ? copy.advancement.cost(adv.costXp)
            : copy.advancement.needs(adv.costXp),
      actionLabel: copy.advancement.purchase,
    }
  })

  async function purchase(choice: AdvancementChoice) {
    setBusy(true)
    setError('advancement')
    setPicker(null)
    try {
      const res = await enqueue(() => purchaseAdvancementAction(view.characterId, choice, locale))
      if (res.ok) {
        if (res.view) {
          setView(res.view)
          setXp(res.view.xp)
        } else {
          router.refresh()
        }
        if (res.tierUp) setTierUp(res.tier)
      } else {
        const e = copy.advancement.errors
        setError(
          'advancement',
          res.reason === 'insufficient'
            ? e.insufficient
            : res.reason === 'conflict'
              ? e.conflict
              : res.reason === 'capped'
                ? e.capped
                : e.generic,
        )
      }
    } catch {
      setError('advancement', copy.advancement.errors.generic)
    }
    setBusy(false)
  }

  async function savePicks(
    kind: 'type' | 'focus' | 'skill' | 'option',
    tier: number,
    ids: string[],
    skillKey?: string,
  ) {
    setBusy(true)
    setError('picks')
    try {
      const res = await enqueue(() =>
        choosePicksAction(view.characterId, kind, tier, ids, locale, skillKey),
      )
      if (res.ok && res.view) setView(res.view)
      else if (res.ok) router.refresh()
      else setError('picks', copy.picks.error)
    } catch {
      setError('picks', copy.picks.error)
    }
    setBusy(false)
  }

  // ---- options bought for XP (Cantrips) -------------------------------------

  async function runLearn(job: () => ReturnType<typeof learnOptionsAction>): Promise<boolean> {
    setBusy(true)
    setError('learn')
    const e = copy.learn.errors
    try {
      const res = await enqueue(job)
      if (res.ok) {
        if (res.view) {
          setView(res.view)
          setXp(res.view.xp)
        } else {
          router.refresh()
        }
        setBusy(false)
        return true
      }
      setError(
        'learn',
        res.reason === 'insufficient'
          ? e.insufficient
          : res.reason === 'conflict'
            ? e.conflict
            : e.generic,
      )
    } catch {
      setError('learn', e.generic)
    }
    setBusy(false)
    return false
  }

  const learnOptions = (ids: string[]) =>
    runLearn(() => learnOptionsAction(view.characterId, ids, locale))
  const undoLearn = (purchase: number) =>
    void runLearn(() => revertLearnAction(view.characterId, purchase, locale))

  // The advancement history, newest first, paged like the XP log.
  const historyAll = [...view.purchases].reverse()
  const historyPages = Math.max(1, Math.ceil(historyAll.length / PAGE_SIZE))
  const historyCurrent = Math.min(historyPage, historyPages - 1)
  const historyShown = historyAll.slice(
    historyCurrent * PAGE_SIZE,
    (historyCurrent + 1) * PAGE_SIZE,
  )

  async function undoPurchase() {
    if (undoIndex === null) return
    setUndoBusy(true)
    setUndoError(undefined)
    const e = copy.log.history.errors
    try {
      const res = await enqueue(() => revertAdvancementAction(view.characterId, undoIndex, locale))
      if (res.ok) {
        if (res.view) {
          setView(res.view)
          setXp(res.view.xp)
          setSpent(res.view.spent)
        } else {
          router.refresh()
        }
        setUndoIndex(null)
      } else {
        setUndoError(
          res.reason === 'not_revertable'
            ? e.notRevertable
            : res.reason === 'conflict'
              ? e.conflict
              : e.generic,
        )
      }
    } catch {
      setUndoError(e.generic)
    }
    setUndoBusy(false)
  }

  function onBuy(key: string) {
    setError('advancement')
    if (busy) return
    if (key === 'effort') void purchase({ key: 'effort' })
    else setPicker(key as 'pools' | 'edge' | 'skills')
  }

  const statOptions = (['MIGHT', 'SPEED', 'INTELLECT'] as const).map((stat) => ({
    stat,
    key: stat.toLowerCase() as PoolKey,
  }))

  const advancementPicker =
    picker === 'pools' ? (
      <PoolSplitPicker
        title={copy.advancement.addPoolsTo}
        total={POOL_POINTS}
        options={statOptions.map(({ stat }) => ({ id: stat, label: t.stats[stat] }))}
        remainingLabel={copy.advancement.poolsRemaining}
        confirmLabel={copy.advancement.confirm}
        cancelLabel={copy.advancement.cancel}
        addLabel={copy.advancement.addTo}
        removeLabel={copy.advancement.removeFrom}
        onConfirm={(a) =>
          void purchase({
            key: 'pools',
            allocation: {
              might: a.MIGHT ?? 0,
              speed: a.SPEED ?? 0,
              intellect: a.INTELLECT ?? 0,
            },
          })
        }
        onCancel={() => setPicker(null)}
      />
    ) : picker === 'edge' ? (
      <ChipPicker
        title={copy.advancement.addEdgeTo}
        options={statOptions.map(({ stat, key }) => {
          const edge = view.pools.find((p) => p.key === key)?.edge ?? 0
          return { id: stat, label: copy.advancement.edgeOption(t.stats[stat], edge, edge + 1) }
        })}
        onPick={(id) => void purchase({ key: 'edge', stat: id as Stat })}
        onCancel={() => setPicker(null)}
        cancelLabel={copy.advancement.cancel}
      />
    ) : picker === 'skills' ? (
      <ChipPicker
        searchPlaceholder={copy.advancement.skillSearch}
        // Typing a name that isn't listed offers it as a new skill: the
        // Skills advancement can train any skill, not just the catalog's.
        extraOption={(query) => {
          const id = toCustomSkill(query)
          if (id === null) return null
          const text = customSkillText(id).toLowerCase()
          const listed = view.skillOptions.some((s) => s.name.toLowerCase() === text)
          return listed ? null : { id, label: copy.advancement.skillNew(customSkillText(id)) }
        }}
        options={[
          ...view.skillOptions.map((s) => {
            const from = s.level ?? 'PRACTICED'
            const maxed = from === 'SPECIALIZED'
            return {
              id: s.id,
              label: maxed
                ? copy.advancement.skillMaxed(s.name)
                : copy.advancement.skillOption(
                    s.name,
                    t.skillLevels[from],
                    t.skillLevels[NEXT_LEVEL[from]],
                  ),
              disabled: maxed,
              highlight: s.level !== null,
            }
          }),
        ]}
        onPick={(id) => void purchase({ key: 'skills', skillId: id })}
        // Training a special ability is a different choice from training a
        // skill, so its list is kept apart from the skills.
        secondaryAction={
          view.abilityOptions.length > 0
            ? { label: copy.advancement.toAbilities, onClick: () => setPicker('abilities') }
            : undefined
        }
        onCancel={() => setPicker(null)}
        cancelLabel={copy.advancement.cancel}
      />
    ) : picker === 'abilities' ? (
      <ChipPicker
        searchPlaceholder={copy.advancement.abilitySearch}
        options={view.abilityOptions.map((a) => ({
          id: a.id,
          label: a.trained
            ? copy.advancement.abilityTrained(a.name)
            : copy.advancement.abilityOption(a.name),
          disabled: a.trained,
          highlight: true,
        }))}
        onPick={(id) => void purchase({ key: 'skills', abilityId: id })}
        secondaryAction={{
          label: copy.advancement.toSkills,
          onClick: () => setPicker('skills'),
        }}
        onCancel={() => setPicker(null)}
        cancelLabel={copy.advancement.cancel}
      />
    ) : undefined

  // ---- render -------------------------------------------------------------

  return (
    <div className="mx-auto w-full max-w-195">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Tabs
          variant="pills"
          value={tab}
          onChange={(v) => setTab(v as TabKey)}
          items={[
            { value: 'status', label: copy.tabs.status },
            { value: 'skills', label: copy.tabs.skills },
            { value: 'inventory', label: copy.tabs.inventory },
            { value: 'log', label: copy.tabs.log },
            { value: 'notes', label: copy.tabs.notes },
          ]}
        />
        {pending > 0 && (
          <span aria-live="polite" className="text-text-muted font-mono text-[11px]">
            {copy.syncing}
          </span>
        )}
      </div>

      {errors.general && (
        <div className="mb-4">
          <Alert variant="error">{errors.general}</Alert>
        </div>
      )}

      {tab === 'status' && (
        <div className="flex flex-col gap-4">
          <ConditionBanner
            label={copy.conditions[condition].label}
            note={copy.conditions[condition].note}
            tone={condition === 'hale' ? 'ok' : 'warning'}
            chips={[copy.chips.tier(view.tier), copy.chips.effort(view.effort)]}
          />

          {view.pending.map((p) => (
            <AbilityPicker
              key={`${p.kind}-${p.tier}-${p.skillKey ?? ''}`}
              title={
                p.kind === 'skill'
                  ? copy.picks.skillTitle(p.abilityName ?? '', p.tier)
                  : p.kind === 'option'
                    ? copy.picks.optionTitle(p.abilityName ?? '', p.tier)
                    : copy.picks[p.kind === 'type' ? 'typeTitle' : 'focusTitle'](p.tier)
              }
              hint={
                p.alternateRequired !== null
                  ? (selected, required) =>
                      copy.picks.skillAlternateHint(selected, required, p.alternateRequired ?? 0)
                  : copy.picks.hint
              }
              required={p.required}
              alsoAccept={p.alternateRequired !== null ? [p.alternateRequired] : undefined}
              options={p.options}
              custom={
                p.allowCustom
                  ? {
                      placeholder: copy.picks.customPlaceholder,
                      addLabel: copy.picks.customAdd,
                      toId: toCustomSkill,
                      labelOf: customSkillText,
                    }
                  : undefined
              }
              confirmLabel={copy.picks.confirm}
              busy={busy}
              onConfirm={(ids) => void savePicks(p.kind, p.tier, ids, p.skillKey ?? undefined)}
            />
          ))}
          {errors.picks && (
            <p role="alert" className="text-warning font-mono text-xs">
              {errors.picks}
            </p>
          )}

          <AdvancementPanel
            title={copy.advancement.title}
            summary={copy.advancement.summary(adv.bought.length, adv.perTier, xpTotal)}
            description={copy.advancement.description(adv.costXp, adv.perTier)}
            steps={steps}
            onBuy={onBuy}
            picker={advancementPicker}
            notice={adv.nextIsBlocked ? copy.advancement.capped : undefined}
            tierUpMessage={tierUp !== null ? copy.advancement.tierUp(tierUp) : undefined}
            dismissLabel={copy.advancement.dismiss}
            onDismissTierUp={() => setTierUp(null)}
            errorMessage={errors.advancement}
          />

          {view.learn && (
            <LearnPanel
              learn={view.learn}
              copy={copy}
              xpTotal={xpTotal}
              busy={busy}
              errorMessage={errors.learn}
              onLearn={learnOptions}
              onUndo={undoLearn}
            />
          )}

          <section>
            <div className="mb-2.5 flex items-center justify-between">
              <h2 className="text-text-muted font-mono text-xs tracking-wider uppercase">
                {copy.pools.title}
              </h2>
              <span className="text-text-muted font-mono text-xs">
                {copy.pools.effort} {view.effort}
              </span>
            </div>
            <div className="flex flex-col gap-2.5">
              {poolState.map((p) => (
                <PoolMeter
                  key={p.key}
                  name={p.name}
                  edgeLabel={copy.pools.edge}
                  edge={p.edge}
                  current={p.current}
                  max={p.max}
                  spendLabel={copy.pools.spend}
                  recoverLabel={copy.pools.recover}
                  recoverFullLabel={copy.pools.recoverFull}
                  amountLabel={copy.pools.amount}
                  confirmLabel={copy.advancement.confirm}
                  cancelLabel={copy.advancement.cancel}
                  onSpend={(n) => changePool(p.key, p.max, { kind: 'spend', amount: n })}
                  onRecover={(n) => changePool(p.key, p.max, { kind: 'recover', amount: n })}
                />
              ))}
            </div>
          </section>
        </div>
      )}

      {tab === 'skills' && (
        <div className="flex flex-col gap-7">
          {view.skills.length > 0 && (
            <section>
              <h2 className="text-text-muted mb-2.5 font-mono text-xs tracking-wider uppercase">
                {copy.skills.skills}
              </h2>
              <ul className="flex flex-wrap gap-2">
                {view.skills.map((skill) => {
                  const open = openSkill === skill.name
                  return (
                    <li key={skill.name}>
                      <button
                        type="button"
                        aria-expanded={open}
                        onClick={() => setOpenSkill(open ? null : skill.name)}
                        className={`text-text flex cursor-pointer items-center gap-1.5 rounded-sm border px-2.5 py-1 font-mono text-xs transition-colors hover:opacity-80 ${
                          open ? 'border-accent bg-accent-soft' : 'border-border'
                        }`}
                      >
                        <span>{skill.name}</span>
                        <span className="text-accent text-[10px] uppercase">{skill.level}</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
              {(() => {
                const skill = view.skills.find((s) => s.name === openSkill)
                if (!skill) return null
                return (
                  <div className="border-border bg-panel mt-3 rounded border px-3.5 py-3">
                    <div className="font-display text-text mb-1 text-sm font-semibold">
                      {skill.name}
                    </div>
                    <p className="text-text-muted text-[13px] leading-relaxed">
                      {skill.custom ? copy.skills.createdByYou : skill.description}
                    </p>
                  </div>
                )
              })()}
            </section>
          )}
          <section>
            <h2 className="text-text-muted mb-2.5 font-mono text-xs tracking-wider uppercase">
              {copy.skills.abilities}
            </h2>
            <ul>
              {view.abilities.map((ability) => (
                <li key={ability.name} className="border-border border-b py-2.5">
                  <div className="mb-0.5 flex flex-wrap items-baseline gap-2">
                    <span className="font-display text-text text-sm font-semibold">
                      {ability.name}
                    </span>
                    {ability.meta && (
                      <span className="text-text-muted font-mono text-[11px]">{ability.meta}</span>
                    )}
                    {ability.trained && (
                      <span className="text-accent font-mono text-[10px] uppercase">
                        {copy.skills.abilityTrained}
                      </span>
                    )}
                  </div>
                  <p className="text-text-muted text-[13px] leading-relaxed">
                    {ability.description}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}

      {tab === 'inventory' && (
        <InventoryList
          items={inventory.map((item) => ({
            id: item.id,
            qty: item.qty,
            description: itemDescription(item),
            ...describeItem(item, locale),
          }))}
          labels={{
            title: copy.inventory.title,
            itemName: copy.inventory.itemName,
            itemMeta: copy.inventory.itemMeta,
            add: copy.inventory.add,
            decrease: copy.inventory.decrease,
            increase: copy.inventory.increase,
            remove: copy.inventory.remove,
            previous: copy.inventory.previous,
            next: copy.inventory.next,
            page: copy.inventory.page,
          }}
          pageSize={PAGE_SIZE}
          errorMessage={errors.inventory}
          header={
            <>
              <div
                className={`mb-3 font-mono text-xs ${cypherCount > view.cypherLimit ? 'text-warning' : 'text-text-muted'}`}
              >
                {copy.inventory.cypherCount(cypherCount, view.cypherLimit)}
              </div>
              {cypherCount > view.cypherLimit && (
                <div className="mb-3">
                  <Alert variant="warning">{copy.inventory.overLimit(view.cypherLimit)}</Alert>
                </div>
              )}
              <CypherPicker
                cyphers={pickerItems}
                failed={catalogFailed}
                categories={(['MANIFEST', 'FANTASTIC', 'SUBTLE', 'POWER_BOOST'] as const).map(
                  (id) => ({
                    id,
                    label: copy.inventory.categories[id],
                  }),
                )}
                labels={{
                  hint: copy.inventory.browseHint,
                  browse: copy.inventory.browse,
                  search: copy.inventory.search,
                  shown: copy.inventory.shown,
                  close: copy.inventory.close,
                  all: copy.inventory.all,
                  noResults: copy.inventory.noResults,
                  level: copy.inventory.level,
                  add: copy.inventory.addToInventory,
                  loading: copy.inventory.loading,
                  loadFailed: copy.inventory.loadFailed,
                }}
                open={cypherPickerOpen}
                onOpen={openCypherPicker}
                onClose={() => setCypherPickerOpen(false)}
                onAdd={(id) =>
                  void enqueue(() => addCypherAction(characterId, id)).then(applyInventory)
                }
              />
            </>
          }
          onAdd={(item) =>
            void enqueue(() =>
              addItemAction(characterId, { ...item, defaultMeta: copy.inventory.itemDefaultMeta }),
            ).then(applyInventory)
          }
          onChangeQty={(id, delta) => {
            setInventory((prev) =>
              prev.map((it) => (it.id === id ? { ...it, qty: Math.max(0, it.qty + delta) } : it)),
            )
            void enqueue(() => changeItemQtyAction(characterId, id, delta)).then(applyInventory)
          }}
          onRemove={(id) =>
            void enqueue(() => removeItemAction(characterId, id)).then(applyInventory)
          }
        />
      )}

      {tab === 'log' && (
        <div className="flex flex-col gap-7">
          <XpLog
            // Newest first, 5 to a page: the log can grow without bound.
            pageSize={PAGE_SIZE}
            entries={[...xp].reverse().map((e) => ({
              id: e.id,
              reason: e.reason,
              amountLabel: `${e.kind === 'gain' ? '+' : '−'}${e.amount} XP`,
              tone: e.kind,
              removable: !e.locked,
            }))}
            labels={{
              title: copy.log.xpLog(xpTotal),
              reasonPlaceholder: copy.log.reasonPlaceholder,
              gain: copy.log.gain,
              spend: copy.log.spend,
              add: copy.log.add,
              empty: copy.log.empty,
              remove: copy.log.remove,
              previous: copy.log.previous,
              next: copy.log.next,
              page: copy.log.page,
            }}
            errorMessage={errors.xp}
            onAdd={(entry) => void addXp(entry)}
            onRemove={(id) => void removeXp(id)}
          />
          <section>
            <h2 className="text-text-muted mb-1 font-mono text-xs tracking-wider uppercase">
              {copy.log.history.title}
            </h2>
            <p className="text-text-muted mb-2.5 text-[12px]">{copy.log.history.hint}</p>
            {view.purchases.length === 0 ? (
              <p className="border-border text-text-muted rounded border border-dashed p-4 text-center font-mono text-xs italic">
                {copy.log.history.empty}
              </p>
            ) : (
              <ul className="flex flex-col gap-1.5">
                {historyShown.map((p) => (
                  <li
                    key={p.index}
                    className="border-border bg-panel flex items-center justify-between gap-3 rounded border px-3.5 py-2"
                  >
                    <span className="min-w-0 text-[13px]">
                      <span className="text-text-muted mr-2 font-mono text-[11px]">
                        {copy.log.history.tier(p.tier)}
                      </span>
                      <span className="text-text">{p.label}</span>
                    </span>
                    <button
                      type="button"
                      disabled={!p.revertable || busy}
                      title={p.revertable ? undefined : copy.log.history.lockedHint}
                      onClick={() => {
                        setUndoError(undefined)
                        setUndoIndex(p.index)
                      }}
                      className="border-border text-text-muted hover:text-warning shrink-0 rounded border px-2.5 py-1 font-mono text-[11px] enabled:cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {copy.log.history.undo}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <Pagination
              page={historyCurrent}
              pageCount={historyPages}
              ariaLabel={copy.log.history.title}
              labels={{
                previous: copy.log.previous,
                next: copy.log.next,
                page: copy.log.page,
              }}
              onChange={setHistoryPage}
            />
            <ConfirmDialog
              open={undoIndex !== null}
              title={copy.log.history.confirmTitle}
              description={copy.log.history.confirmDescription(
                view.purchases.find((p) => p.index === undoIndex)?.label ?? '',
                view.advancement.costXp,
              )}
              confirmLabel={copy.log.history.confirm}
              cancelLabel={copy.log.history.cancel}
              busyLabel={copy.log.history.working}
              busy={undoBusy}
              errorMessage={undoError}
              destructive
              onConfirm={() => void undoPurchase()}
              onCancel={() => {
                if (!undoBusy) setUndoIndex(null)
              }}
            />
          </section>
        </div>
      )}

      {tab === 'notes' && (
        <div className="flex flex-col gap-7">
          <NotesLog
            // Newest first, 5 to a page, like the XP log.
            pageSize={PAGE_SIZE}
            maxLength={NOTE_MAX_LENGTH}
            entries={[...notes].reverse().map((n) => ({
              id: n.id,
              body: n.body,
              dateLabel: new Date(n.createdAt).toLocaleString(locale, {
                dateStyle: 'medium',
                timeStyle: 'short',
              }),
            }))}
            labels={{
              title: copy.log.notes,
              placeholder: copy.log.notesPlaceholder,
              add: copy.log.notesAdd,
              empty: copy.log.notesEmpty,
              edit: copy.log.notesEdit,
              save: copy.log.notesSave,
              cancel: copy.log.notesCancel,
              remove: copy.log.notesRemove,
              previous: copy.log.previous,
              next: copy.log.next,
              page: copy.log.page,
              count: copy.log.notesCount,
            }}
            errorMessage={errors.notes}
            onAdd={(body) => void addNote(body)}
            onEdit={(id, body) => void editNote(id, body)}
            onRemove={(id) => void removeNote(id)}
          />
        </div>
      )}
    </div>
  )
}
