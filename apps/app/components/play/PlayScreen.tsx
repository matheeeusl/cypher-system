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
  CypherPicker,
  InventoryList,
  NotesField,
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
  purchaseAdvancementAction,
  removeItemAction,
  removeXpAction,
  setNotesAction,
} from '@/app/[locale]/characters/[id]/play/actions'
import { POOL_POINTS, type AdvancementChoice } from '@/lib/advancement'
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

type TabKey = 'status' | 'skills' | 'inventory' | 'log'
type NotesStatus = 'idle' | 'saving' | 'saved'

const STEP_ORDER: AdvancementKey[] = ['pools', 'edge', 'effort', 'skills']
const NEXT_LEVEL: Record<SkillLevel, SkillLevel> = {
  INABILITY: 'PRACTICED',
  PRACTICED: 'TRAINED',
  TRAINED: 'SPECIALIZED',
  SPECIALIZED: 'SPECIALIZED',
}
const NOTES_DEBOUNCE_MS = 800

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
  const [inventory, setInventory] = useState<InventoryItem[]>(initial.inventory)
  const [notes, setNotes] = useState(initial.notes)
  const [notesStatus, setNotesStatus] = useState<NotesStatus>('idle')
  const [picker, setPicker] = useState<'pools' | 'edge' | 'skills' | null>(null)
  const [tierUp, setTierUp] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const [errors, setErrors] = useState<{
    advancement?: string
    picks?: string
    xp?: string
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

  // ---- notes (debounced autosave) ----------------------------------------

  const notesTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const latestNotes = useRef(initial.notes)
  const characterId = view.characterId

  function onNotesChange(value: string) {
    setNotes(value)
    latestNotes.current = value
    setNotesStatus('saving')
    clearTimeout(notesTimer.current)
    notesTimer.current = setTimeout(() => {
      notesTimer.current = undefined
      void enqueue(() => setNotesAction(characterId, value)).then((res) => {
        if (res.ok) setNotesStatus('saved')
        else setError('general', copy.saveFailed)
      })
    }, NOTES_DEBOUNCE_MS)
  }

  // Leaving the screen mid-debounce must not drop the last keystrokes.
  useEffect(
    () => () => {
      if (notesTimer.current) {
        clearTimeout(notesTimer.current)
        void setNotesAction(characterId, latestNotes.current)
      }
    },
    [characterId],
  )

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
    kind: 'type' | 'focus' | 'skill',
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
          ...view.abilityOptions.map((a) => ({
            id: `ability:${a.id}`,
            label: a.trained
              ? copy.advancement.abilityTrained(a.name)
              : copy.advancement.abilityOption(a.name),
            disabled: a.trained,
            highlight: true,
          })),
        ]}
        onPick={(id) =>
          void purchase(
            id.startsWith('ability:')
              ? { key: 'skills', abilityId: id.slice('ability:'.length) }
              : { key: 'skills', skillId: id },
          )
        }
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
                  : copy.picks[p.kind === 'type' ? 'typeTitle' : 'focusTitle'](p.tier)
              }
              hint={copy.picks.hint}
              required={p.required}
              options={p.options}
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
                {view.skills.map((skill) => (
                  <li
                    key={skill.name}
                    className="border-border text-text flex items-center gap-1.5 rounded-sm border px-2.5 py-1 font-mono text-xs"
                  >
                    <span>{skill.name}</span>
                    <span className="text-accent text-[10px] uppercase">{skill.level}</span>
                  </li>
                ))}
              </ul>
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
          }}
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
            entries={xp.map((e) => ({
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
            }}
            errorMessage={errors.xp}
            onAdd={(entry) => void addXp(entry)}
            onRemove={(id) => void removeXp(id)}
          />
          <NotesField
            label={copy.log.notes}
            value={notes}
            placeholder={copy.log.notesPlaceholder}
            onChange={onNotesChange}
            status={
              notesStatus === 'saving'
                ? copy.log.saving
                : notesStatus === 'saved'
                  ? copy.log.saved
                  : undefined
            }
          />
        </div>
      )}
    </div>
  )
}
