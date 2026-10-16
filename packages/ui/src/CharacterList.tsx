import { CharacterCard, type CharacterSummary } from './CharacterCard'
import { LinkButton } from './LinkButton'

export interface CharacterListLabels {
  title: string
  subtitle: string
  newCharacter: string
  tier: string
  updateBadge: string
  emptyTitle: string
  emptyBody: string
  delete: string
}

interface CharacterListProps {
  characters: CharacterSummary[]
  labels: CharacterListLabels
  newCharacterHref: string
  onDelete?: (id: string) => void
}

export function CharacterList({
  characters,
  labels,
  newCharacterHref,
  onDelete,
}: CharacterListProps) {
  const isEmpty = characters.length === 0
  const cta = `+ ${labels.newCharacter}`

  return (
    <div className="mx-auto w-full max-w-240">
      <div
        className={`flex flex-wrap items-center justify-between gap-4 ${isEmpty ? 'mb-8' : 'mb-6'}`}
      >
        <div>
          <h1 className="font-display text-text mb-1 text-[28px] font-semibold">{labels.title}</h1>
          <p className="text-text-muted text-[13px]">{labels.subtitle}</p>
        </div>
        {!isEmpty && <LinkButton href={newCharacterHref} label={cta} />}
      </div>

      {isEmpty ? (
        <div className="border-border rounded-md border border-dashed px-4 py-10 text-center sm:px-8 sm:py-16">
          <span className="bg-accent mx-auto mb-4.5 block size-2.5 rounded-full" />
          <h2 className="font-display text-text mb-2 text-[19px] font-semibold">
            {labels.emptyTitle}
          </h2>
          <p className="text-text-muted mx-auto mb-5.5 max-w-105 text-sm leading-relaxed">
            {labels.emptyBody}
          </p>
          <LinkButton href={newCharacterHref} label={cta} size="lg" />
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {characters.map((character) => (
            <li key={character.id}>
              <CharacterCard
                character={character}
                tierLabel={labels.tier}
                updateBadge={labels.updateBadge}
                {...(onDelete ? { deleteLabel: labels.delete, onDelete } : {})}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
