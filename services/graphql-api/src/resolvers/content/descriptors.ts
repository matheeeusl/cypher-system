import { getAllDescriptors, getDescriptorById } from '@cypher/content'

import { mapDescriptor } from './mappers.js'

export const descriptorResolvers = {
  Query: {
    descriptors: () => getAllDescriptors().map(mapDescriptor),
    descriptor: (_parent: unknown, args: { id: string }) => {
      const found = getDescriptorById(args.id)
      return found ? mapDescriptor(found) : null
    },
  },
}
