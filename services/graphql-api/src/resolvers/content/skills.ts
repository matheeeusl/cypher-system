import { getAllSkills, getSkillById } from '@cypher/content'

import { mapSkill } from './mappers.js'

export const skillResolvers = {
  Query: {
    skills: () => getAllSkills().map(mapSkill),
    skill: (_parent: unknown, args: { id: string }) => {
      const found = getSkillById(args.id)
      return found ? mapSkill(found) : null
    },
  },
}
