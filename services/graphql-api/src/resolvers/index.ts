import { abilityResolvers } from './content/abilities.js'
import { advancementResolvers } from './content/advancement.js'
import { artifactResolvers } from './content/artifacts.js'
import { cypherResolvers } from './content/cyphers.js'
import { descriptorResolvers } from './content/descriptors.js'
import { enumResolvers } from './content/enums.js'
import { focusResolvers } from './content/foci.js'
import { oddityResolvers } from './content/oddities.js'
import { skillResolvers } from './content/skills.js'
import { typeResolvers } from './content/types.js'
import { validateResolvers } from './validate/validate-character-choices.js'

// Left untyped (inferred) rather than annotated as IResolvers<...>: each
// resolver function here takes fewer params than the full
// (parent, args, context, info) signature, which TS structurally accepts
// regardless of what context type buildSchema() ends up parameterized
// with — annotating this explicitly just fights that variance for no
// benefit.
export const resolvers = {
  ...enumResolvers,
  Query: {
    ...advancementResolvers.Query,
    ...typeResolvers.Query,
    ...descriptorResolvers.Query,
    ...focusResolvers.Query,
    ...abilityResolvers.Query,
    ...skillResolvers.Query,
    ...cypherResolvers.Query,
    ...artifactResolvers.Query,
    ...oddityResolvers.Query,
    ...validateResolvers.Query,
  },
}
