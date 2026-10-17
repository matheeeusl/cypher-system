'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { Button } from '@cypher/ui'

import { AppBrand } from '@/components/AppBrand'
import {
  fetchAbilities,
  fetchDescriptors,
  fetchFlavors,
  fetchFoci,
  fetchSkills,
  fetchTypes,
  validateCharacterChoices,
  type ValidationResult,
  type Stat,
  type WizardAbility,
  type WizardDescriptor,
  type WizardFlavor,
  type WizardFocus,
  type WizardSkill,
  type WizardType,
} from '@/lib/graphql/queries'

import { MobileHeaderMenu } from '@/components/MobileHeaderMenu'
import { SiteFooter } from '@/components/SiteFooter'

import { AbilitiesStep } from './AbilitiesStep'
import { BackgroundStep } from './BackgroundStep'
import { DescriptorStep } from './DescriptorStep'
import {
  buildCharacterChoicesInput,
  descriptorPoolBonus,
  descriptorSkillChoicesNeeded,
  descriptorAutoTrainedSkillIds,
  focusTier1ChoiceEntries,
  furthestReachableStep,
  isStepValid,
  skillGrantKey,
  tier1SkillGrantSlots,
  type SkillGrantSlot,
  stepErrorMessage,
  tier1ChoiceSlots,
  tier1EdgeSlots,
  tier1PickPool,
  type ChoiceSlot,
  type EdgeSlot,
} from './derive'
import { EquipmentStep } from './EquipmentStep'
import { ErrorBanner } from './ErrorBanner'
import { useWizardI18n, WizardI18nProvider } from './i18n'
import { FocusStep } from './FocusStep'
import { UserMenu } from '@/components/auth/UserMenu'
import type { Locale } from '@/lib/i18n/auth'
import { signOutLabel } from '@/lib/i18n/characters'
import { clearDraft, loadDraft, saveDraft } from '@/lib/wizard-draft'
import { HtmlLang } from '@/components/HtmlLang'
import { saveCharacter } from '@/app/[locale]/characters/actions'
import { PoolsStep } from './PoolsStep'
import { ReviewStep } from './ReviewStep'
import { SentenceBanner } from './SentenceBanner'
import { SkillsStep } from './SkillsStep'
import { INITIAL_CHOICES, STEPS, type WizardChoices } from './state'
import { StepperNav } from './StepperNav'
import { ThemeToggle } from './ThemeToggle'
import { TypeStep } from './TypeStep'
import { ValidationSummary } from './ValidationSummary'

interface ContentState<T> {
  data: T[] | null
  error: string | null
}

function useEntityList<T>(fetcher: () => Promise<T[]>, needed: boolean): ContentState<T> {
  const [state, setState] = useState<ContentState<T>>({ data: null, error: null })

  useEffect(() => {
    if (!needed || state.data || state.error) return
    let cancelled = false
    fetcher()
      .then((data) => {
        if (!cancelled) setState({ data, error: null })
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setState({ data: null, error: err instanceof Error ? err.message : String(err) })
      })
    return () => {
      cancelled = true
    }
    // fetcher is a stable module-level import for every call site here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needed, state.data, state.error])

  return state
}

function withoutSkillKey<V>(record: Record<string, V>, key: string): Record<string, V> {
  return Object.fromEntries(Object.entries(record).filter(([k]) => k !== key))
}

function withoutSkillKeys<V>(record: Record<string, V>, prefix: string): Record<string, V> {
  return Object.fromEntries(Object.entries(record).filter(([k]) => !k.startsWith(prefix)))
}

interface WizardProps {
  userName: string
  locale: Locale
  /** Set when editing a saved character; omitted for a new one. */
  characterId?: string
  /** Saved choices to start from. Reopens straight on the Review step. */
  initialChoices?: WizardChoices
  /** A flavor the character gained in play: it can't be changed here. */
  gainedFlavorId?: string | null
}

export function Wizard(props: WizardProps) {
  return (
    <WizardI18nProvider locale={props.locale}>
      <WizardInner {...props} />
    </WizardI18nProvider>
  )
}

function WizardInner({
  userName,
  locale,
  characterId,
  initialChoices,
  gainedFlavorId = null,
}: WizardProps) {
  const router = useRouter()
  const { copy } = useWizardI18n()
  const [stepIndex, setStepIndex] = useState(
    initialChoices ? STEPS.findIndex((s) => s.id === 'review') : 0,
  )
  const [choices, setChoices] = useState<WizardChoices>(initialChoices ?? INITIAL_CHOICES)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [attemptedNext, setAttemptedNext] = useState(false)
  const [validation, setValidation] = useState<ValidationResult | null>(null)
  const [validating, setValidating] = useState(false)

  // Draft: restore once after mount (never during the hydration render, which
  // must match the server), then persist every change. `restored` keeps the
  // first persist from overwriting the draft before it has been read.
  const [restored, setRestored] = useState(false)
  useEffect(() => {
    const draft = loadDraft(characterId)
    if (draft) {
      // react-hooks/set-state-in-effect: this IS the one-time read of an
      // external system (sessionStorage) that only exists after mount.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setChoices(draft.choices)
      setStepIndex(draft.stepIndex)
    }
    setRestored(true)
  }, [characterId])
  useEffect(() => {
    if (restored) saveDraft(characterId, { choices, stepIndex })
  }, [restored, characterId, choices, stepIndex])

  const step = STEPS[stepIndex]!
  const stepCopy = copy.steps[step.id]
  const otherLocale = locale === 'en' ? 'pt-br' : 'en'

  const types = useEntityList<WizardType>(
    fetchTypes,
    step.id === 'type' ||
      step.id === 'abilities' ||
      step.id === 'equipment' ||
      step.id === 'review',
  )
  const descriptors = useEntityList<WizardDescriptor>(
    fetchDescriptors,
    step.id === 'descriptor' ||
      step.id === 'pools' || // the Descriptor's bonus is part of the breakdown
      step.id === 'skills' ||
      step.id === 'abilities' ||
      step.id === 'review',
  )
  const foci = useEntityList<WizardFocus>(
    fetchFoci,
    step.id === 'focus' || step.id === 'abilities' || step.id === 'review',
  )
  // Needed on the Abilities step (the selector) and the Review step, and
  // whenever one is already chosen: the live validation can't run without it.
  const flavors = useEntityList<WizardFlavor>(
    fetchFlavors,
    step.id === 'abilities' || step.id === 'review' || choices.flavorId !== null,
  )
  const skills = useEntityList<WizardSkill>(
    fetchSkills,
    step.id === 'skills' || step.id === 'abilities' || step.id === 'review',
  )
  const abilities = useEntityList<WizardAbility>(
    fetchAbilities,
    step.id === 'abilities' || step.id === 'review',
  )

  const selectedType = types.data?.find((t) => t.id === choices.typeId)
  const selectedDescriptor = descriptors.data?.find((d) => d.id === choices.descriptorId)
  const selectedFocus = foci.data?.find((f) => f.id === choices.focusId)
  const selectedFlavor = flavors.data?.find((f) => f.id === choices.flavorId)
  const content = {
    type: selectedType,
    descriptor: selectedDescriptor,
    focus: selectedFocus,
    flavor: selectedFlavor,
    abilities: abilities.data ?? undefined,
  }

  // Live validation: call validateCharacterChoices as soon as Type/Descriptor/
  // Focus are all picked, debounced so rapid pool +/- clicks don't spam the API.
  useEffect(() => {
    const input = buildCharacterChoicesInput(choices, content)
    if (!input) return

    let cancelled = false
    // react-hooks/set-state-in-effect wants setState deferred into a
    // callback, but flipping the loading flag the moment a fetch starts is
    // the standard "syncing with an external system" pattern the rule's own
    // description endorses — there's no earlier callback to put this in.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setValidating(true)
    const timeoutId = setTimeout(() => {
      validateCharacterChoices(input)
        .then((result) => {
          if (!cancelled) setValidation(result)
        })
        .catch(() => {
          if (!cancelled) setValidation(null)
        })
        .finally(() => {
          if (!cancelled) setValidating(false)
        })
    }, 300)

    return () => {
      cancelled = true
      clearTimeout(timeoutId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [choices, selectedType, selectedDescriptor, selectedFocus, selectedFlavor, abilities.data])

  const stepValid = isStepValid(step.id, choices, content)
  const showLocalError = attemptedNext && !stepValid

  // Type/descriptor/focus never get un-set once chosen, so once this flips
  // true it stays true — no risk of showing stale validation from an
  // earlier, now-incomplete selection.
  const hasCoreChoices = Boolean(selectedType && selectedDescriptor && selectedFocus)

  const reachableIndex = furthestReachableStep(choices, content)

  function goTo(index: number) {
    setStepIndex(index)
    setAttemptedNext(false)
  }

  // Stepper clicks: any step up to the first incomplete one opens freely.
  // A click past it lands on that incomplete step instead, with its error
  // shown, so the player sees what is still missing.
  function jumpTo(index: number) {
    if (index <= reachableIndex) {
      goTo(index)
      return
    }
    setStepIndex(reachableIndex)
    setAttemptedNext(true)
  }

  function goNext() {
    if (!stepValid) {
      setAttemptedNext(true)
      return
    }
    if (stepIndex < STEPS.length - 1) goTo(stepIndex + 1)
  }

  async function onSave() {
    setSaving(true)
    setSaveError(null)
    try {
      const result = await saveCharacter(choices, characterId)
      if (result.ok) {
        clearDraft(characterId)
        router.push(`/${locale}/characters/${result.id}`)
        router.refresh()
        return
      }
      setSaveError(copy.saveErrors[result.reason])
    } catch {
      setSaveError(copy.saveErrors.unavailable)
    }
    setSaving(false)
  }

  function goBack() {
    if (stepIndex > 0) goTo(stepIndex - 1)
  }

  function update(partial: Partial<WizardChoices>) {
    setChoices((prev) => ({ ...prev, ...partial }))
    setAttemptedNext(false)
  }

  function onSelectType(id: string) {
    update({
      typeId: id,
      startingEdgeChoice: null,
      tier1TypeAbilityIds: [],
      abilitySkillChoices: withoutSkillKeys(choices.abilitySkillChoices, 'type:'),
      abilityChoices: {},
      abilityEdgeChoices: withoutSkillKeys(choices.abilityEdgeChoices, 'type:'),
    })
  }

  // Changing the flavor keeps the picks the new pool still offers and drops the
  // rest (with their skill picks), so no stale flavor ability is left behind.
  function onSelectFlavor(id: string | null) {
    const nextFlavor = flavors.data?.find((f) => f.id === id)
    const stillOffered = new Set(tier1PickPool(selectedType, nextFlavor).map((a) => a.id))
    setChoices((prev) => {
      const dropped = prev.tier1TypeAbilityIds.filter((abilityId) => !stillOffered.has(abilityId))
      return {
        ...prev,
        flavorId: id,
        tier1TypeAbilityIds: prev.tier1TypeAbilityIds.filter((abilityId) =>
          stillOffered.has(abilityId),
        ),
        abilitySkillChoices: dropped.reduce(
          (record, abilityId) => withoutSkillKey(record, skillGrantKey('type', 1, abilityId)),
          prev.abilitySkillChoices,
        ),
        abilityChoices: dropped.reduce(
          (record, abilityId) => withoutSkillKey(record, skillGrantKey('type', 1, abilityId)),
          prev.abilityChoices,
        ),
        abilityEdgeChoices: dropped.reduce(
          (record, abilityId) => withoutSkillKey(record, skillGrantKey('type', 1, abilityId)),
          prev.abilityEdgeChoices,
        ),
      }
    })
    setAttemptedNext(false)
  }

  function onSelectFocus(id: string) {
    const focus = foci.data?.find((f) => f.id === id)
    const entryCount = focus ? focusTier1ChoiceEntries(focus).length : 0
    update({
      focusId: id,
      focusChoiceSelections: Array.from({ length: entryCount }, () => []),
      abilitySkillChoices: withoutSkillKeys(choices.abilitySkillChoices, 'focus:'),
      abilityEdgeChoices: withoutSkillKeys(choices.abilityEdgeChoices, 'focus:'),
    })
  }

  function onToggleSkill(skillId: string) {
    const needed = descriptorSkillChoicesNeeded(selectedDescriptor)
    setChoices((prev) => {
      const has = prev.descriptorSkillChoices.includes(skillId)
      if (has) {
        return {
          ...prev,
          descriptorSkillChoices: prev.descriptorSkillChoices.filter((id) => id !== skillId),
        }
      }
      if (prev.descriptorSkillChoices.length >= needed) return prev
      return { ...prev, descriptorSkillChoices: [...prev.descriptorSkillChoices, skillId] }
    })
    setAttemptedNext(false)
  }

  function onToggleTypeAbility(abilityId: string) {
    setChoices((prev) => {
      const has = prev.tier1TypeAbilityIds.includes(abilityId)
      if (has) {
        return {
          ...prev,
          tier1TypeAbilityIds: prev.tier1TypeAbilityIds.filter((id) => id !== abilityId),
          abilitySkillChoices: withoutSkillKey(
            prev.abilitySkillChoices,
            skillGrantKey('type', 1, abilityId),
          ),
          abilityChoices: withoutSkillKey(prev.abilityChoices, skillGrantKey('type', 1, abilityId)),
          abilityEdgeChoices: withoutSkillKey(
            prev.abilityEdgeChoices,
            skillGrantKey('type', 1, abilityId),
          ),
        }
      }
      if (prev.tier1TypeAbilityIds.length >= 4) return prev
      return { ...prev, tier1TypeAbilityIds: [...prev.tier1TypeAbilityIds, abilityId] }
    })
    setAttemptedNext(false)
  }

  function onToggleAbilitySkill(slot: SkillGrantSlot, skillId: string) {
    setChoices((prev) => {
      const current = prev.abilitySkillChoices[slot.key] ?? []
      const has = current.includes(skillId)
      if (!has && current.length >= Math.max(slot.count, slot.alternate?.count ?? 0)) return prev
      const next = has ? current.filter((id) => id !== skillId) : [...current, skillId]
      return { ...prev, abilitySkillChoices: { ...prev.abilitySkillChoices, [slot.key]: next } }
    })
    setAttemptedNext(false)
  }

  function onToggleAbilityChoice(slot: ChoiceSlot, abilityId: string) {
    setChoices((prev) => {
      const current = prev.abilityChoices[slot.key] ?? []
      const has = current.includes(abilityId)
      if (!has && current.length >= slot.count) return prev
      const next = has ? current.filter((id) => id !== abilityId) : [...current, abilityId]
      return { ...prev, abilityChoices: { ...prev.abilityChoices, [slot.key]: next } }
    })
    setAttemptedNext(false)
  }

  function onPickEdge(slot: EdgeSlot, stat: Stat) {
    update({ abilityEdgeChoices: { ...choices.abilityEdgeChoices, [slot.key]: stat } })
  }

  function onToggleFocusChoiceOption(entryIndex: number, optionIndex: number) {
    const entry = focusTier1ChoiceEntries(selectedFocus)[entryIndex]
    if (!entry) return
    setChoices((prev) => {
      const current = prev.focusChoiceSelections[entryIndex] ?? []
      const has = current.includes(optionIndex)
      if (!has && current.length >= entry.count) return prev
      const nextSelected = has
        ? current.filter((i) => i !== optionIndex)
        : [...current, optionIndex]
      const nextAll = [...prev.focusChoiceSelections]
      nextAll[entryIndex] = nextSelected
      return { ...prev, focusChoiceSelections: nextAll }
    })
    setAttemptedNext(false)
  }

  return (
    <div className="bg-bg text-text flex min-h-screen flex-col">
      <HtmlLang locale={locale} />
      <div className="border-border bg-panel flex items-center justify-between gap-4 border-b px-4 py-3.5 sm:px-7">
        <div className="flex items-center gap-2.5">
          <div className="bg-accent h-2 w-2 rounded-full shadow-[0_0_6px_var(--color-accent)]" />
          <AppBrand locale={locale} section="CHARACTER BUILDER" />
          <a
            href={characterId ? `/${locale}/characters/${characterId}` : `/${locale}`}
            className="text-accent hover:text-warning ml-3 cursor-pointer font-mono text-[11px] transition-colors"
          >
            {characterId ? copy.toSheet : copy.toList}
          </a>
        </div>
        <div className="flex items-center gap-2">
          <MobileHeaderMenu label={locale === 'pt-br' ? 'Abrir menu' : 'Open menu'}>
            <UserMenu name={userName} signOutLabel={signOutLabel[locale]} />
            <Link
              href={`/${otherLocale}/characters/${characterId ? `${characterId}/edit` : 'new'}`}
              className="border-border bg-panel text-text-muted cursor-pointer rounded border px-4 py-2 text-center font-mono text-[11px] transition-colors hover:opacity-90"
            >
              {otherLocale.toUpperCase()}
            </Link>
          </MobileHeaderMenu>
          <div className="hidden items-center gap-4 sm:flex">
            <UserMenu name={userName} signOutLabel={signOutLabel[locale]} />
            <Link
              href={`/${otherLocale}/characters/${characterId ? `${characterId}/edit` : 'new'}`}
              className="border-border bg-panel text-text-muted cursor-pointer rounded border px-4 py-2 font-mono text-[11px] transition-colors hover:opacity-90"
            >
              {otherLocale.toUpperCase()}
            </Link>
          </div>
          <ThemeToggle />
        </div>
      </div>

      <div className="mx-auto w-full max-w-[920px] px-4 pt-6 sm:px-7">
        <StepperNav
          steps={STEPS.map((s) => ({ id: s.id, label: copy.steps[s.id].label }))}
          currentIndex={stepIndex}
          reachableIndex={reachableIndex}
          onJump={jumpTo}
        />
      </div>

      <div className="mx-auto w-full px-4 sm:w-[720px] sm:px-7">
        <SentenceBanner type={selectedType} descriptor={selectedDescriptor} focus={selectedFocus} />
      </div>

      <div className="mx-auto w-full px-4 pt-5 pb-6 sm:w-[720px] sm:px-7">
        <div className="border-border bg-panel min-h-[340px] rounded border p-4 sm:p-8">
          <div className="text-accent mb-1.5 font-mono text-xs tracking-wide uppercase">
            {copy.stepOf(stepIndex + 1, STEPS.length)}
          </div>
          <h1 className="font-display text-text mb-2 text-2xl font-semibold">{stepCopy.title}</h1>
          {stepCopy.blurb && (
            <p className="text-text-muted mb-5 max-w-[560px] text-[13px] leading-relaxed">
              {stepCopy.blurb}
            </p>
          )}

          {step.id === 'type' && (
            <TypeStep
              types={types.data}
              loading={!types.data && !types.error}
              error={types.error}
              choices={choices}
              onSelectType={onSelectType}
              onSelectEdgeChoice={(stat) => update({ startingEdgeChoice: stat })}
            />
          )}
          {step.id === 'descriptor' && (
            <DescriptorStep
              descriptors={descriptors.data}
              loading={!descriptors.data && !descriptors.error}
              error={descriptors.error}
              selectedId={choices.descriptorId}
              onSelect={(id) =>
                update({ descriptorId: id, descriptorSkillChoices: [], descriptorPoolChoice: null })
              }
              poolChoice={choices.descriptorPoolChoice}
              onPoolChoiceChange={(descriptorPoolChoice) => update({ descriptorPoolChoice })}
            />
          )}
          {step.id === 'focus' && (
            <FocusStep
              foci={foci.data}
              loading={!foci.data && !foci.error}
              error={foci.error}
              selectedId={choices.focusId}
              onSelect={onSelectFocus}
            />
          )}
          {step.id === 'pools' && (
            <PoolsStep
              type={selectedType}
              descriptorBonus={descriptorPoolBonus(
                selectedDescriptor,
                choices.descriptorPoolChoice,
              )}
              allocation={choices.poolAllocation}
              onChange={(poolAllocation) => update({ poolAllocation })}
            />
          )}
          {step.id === 'skills' && (
            <SkillsStep
              descriptor={selectedDescriptor}
              skills={skills.data}
              loading={!skills.data && !skills.error}
              error={skills.error}
              selectedSkillIds={choices.descriptorSkillChoices}
              onToggle={onToggleSkill}
            />
          )}
          {step.id === 'abilities' && (
            <AbilitiesStep
              type={selectedType}
              focus={selectedFocus}
              flavors={flavors.data}
              flavorError={flavors.error}
              selectedFlavorId={choices.flavorId}
              gainedFlavorId={gainedFlavorId}
              onSelectFlavor={onSelectFlavor}
              abilities={abilities.data}
              loading={!abilities.data && !abilities.error}
              error={abilities.error}
              selectedTypeAbilityIds={choices.tier1TypeAbilityIds}
              onToggleTypeAbility={onToggleTypeAbility}
              focusChoiceSelections={choices.focusChoiceSelections}
              onToggleFocusChoiceOption={onToggleFocusChoiceOption}
              choiceSlots={tier1ChoiceSlots(choices, content)}
              abilityChoices={choices.abilityChoices}
              onToggleAbilityChoice={onToggleAbilityChoice}
              edgeSlots={tier1EdgeSlots(choices, content)}
              abilityEdgeChoices={choices.abilityEdgeChoices}
              onPickEdge={onPickEdge}
              skills={skills.data}
              skillGrantSlots={tier1SkillGrantSlots(choices, content)}
              abilitySkillChoices={choices.abilitySkillChoices}
              trainedSkillIds={
                selectedDescriptor
                  ? [
                      ...descriptorAutoTrainedSkillIds(selectedDescriptor),
                      ...choices.descriptorSkillChoices,
                    ]
                  : []
              }
              onToggleAbilitySkill={onToggleAbilitySkill}
            />
          )}
          {step.id === 'equipment' && <EquipmentStep type={selectedType} />}
          {step.id === 'background' && (
            <BackgroundStep
              name={choices.name}
              background={choices.background}
              onNameChange={(name) => update({ name })}
              onBackgroundChange={(background) => update({ background })}
            />
          )}
          {step.id === 'review' && (
            <ReviewStep
              choices={choices}
              type={selectedType}
              descriptor={selectedDescriptor}
              focus={selectedFocus}
              flavor={selectedFlavor}
              skills={skills.data}
              abilities={abilities.data}
              onEdit={(stepId) => goTo(STEPS.findIndex((s) => s.id === stepId))}
            />
          )}
        </div>

        <ValidationSummary
          validation={hasCoreChoices ? validation : null}
          validating={hasCoreChoices && validating}
          stepIndex={stepIndex}
        />
        {saveError && <ErrorBanner message={saveError} />}
        {showLocalError && (
          <ErrorBanner message={stepErrorMessage(step.id, choices, content, copy.stepErrors)} />
        )}

        <div className="mt-5 flex justify-between">
          <Button label={copy.back} variant="ghost" onClick={goBack} />
          {step.id === 'review' ? (
            <Button
              label={saving ? copy.saving : characterId ? copy.saveChanges : copy.save}
              disabled={saving}
              onClick={() => void onSave()}
            />
          ) : (
            <Button label={copy.next} onClick={goNext} />
          )}
        </div>
      </div>

      <SiteFooter locale={locale} className="mt-auto" />
    </div>
  )
}
