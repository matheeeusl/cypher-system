import { getAllEquipment, getEquipmentById } from '@cypher/content'

import { mapEquipmentItem } from './mappers.js'

export const equipmentResolvers = {
  Query: {
    equipment: () => getAllEquipment().map(mapEquipmentItem),
    equipmentItem: (_parent: unknown, args: { id: string }) => {
      const found = getEquipmentById(args.id)
      return found ? mapEquipmentItem(found) : null
    },
  },
}
