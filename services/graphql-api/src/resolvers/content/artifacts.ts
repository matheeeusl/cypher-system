import { getAllArtifacts, getArtifactById } from '@cypher/content'

import { mapArtifact } from './mappers.js'

export const artifactResolvers = {
  Query: {
    artifacts: () => getAllArtifacts().map(mapArtifact),
    artifact: (_parent: unknown, args: { id: string }) => {
      const found = getArtifactById(args.id)
      return found ? mapArtifact(found) : null
    },
  },
}
