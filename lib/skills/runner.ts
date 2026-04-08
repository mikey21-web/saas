import { skillRegistry } from './registry'
import { AgentContext, SkillResult } from './types'

export async function executeSkill(
  skillId: string,
  input: unknown,
  context: AgentContext
): Promise<SkillResult> {
  const skill = skillRegistry.get(skillId)

  if (!skill) {
    return { success: false, output: '', error: `Skill "${skillId}" not found in registry` }
  }

  // Validate input schema
  const parsed = skill.inputSchema.safeParse(input)
  if (!parsed.success) {
    return {
      success: false,
      output: '',
      error: `Invalid input: ${parsed.error.issues.map((i) => i.message).join(', ')}`,
    }
  }

  // Execute with timeout (30 seconds per skill)
  const timeout = new Promise<SkillResult>((_, reject) =>
    setTimeout(() => reject(new Error('Skill execution timeout')), 30_000)
  )

  try {
    return await Promise.race([skill.execute(parsed.data, context), timeout])
  } catch (e: unknown) {
    return { success: false, output: '', error: (e as Error).message }
  }
}
