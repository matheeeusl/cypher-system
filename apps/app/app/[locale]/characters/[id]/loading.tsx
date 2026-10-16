import { CharacterPageSkeleton } from '@/components/CharacterPageSkeleton'

// Shown while the sheet is built on the server (also for /edit, until the
// wizard renders).
export default function Loading() {
  return <CharacterPageSkeleton page="sheet" />
}
