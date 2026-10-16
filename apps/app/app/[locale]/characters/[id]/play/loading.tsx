import { CharacterPageSkeleton } from '@/components/CharacterPageSkeleton'

// Shown while play mode is built on the server.
export default function Loading() {
  return <CharacterPageSkeleton page="play" />
}
