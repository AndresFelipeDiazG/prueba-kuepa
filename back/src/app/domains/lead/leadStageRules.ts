export const normalizeStageName = (name: string): string => {
  return name.trim().replace(/\s+/g, ' ')
}

export const createStageKey = (name: string): string => {
  return normalizeStageName(name)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export const validateStageName = (name: string): string | null => {
  const normalizedName = normalizeStageName(name)

  if (!normalizedName) return 'El nombre de la etapa es obligatorio'
  if (normalizedName.length < 2) return 'El nombre de la etapa debe tener al menos 2 caracteres'
  if (normalizedName.length > 50) return 'El nombre de la etapa no puede superar 50 caracteres'

  return null
}

export const isValidStageColor = (color: string): boolean => {
  return /^#[0-9a-fA-F]{6}$/.test(color.trim())
}

export const isValidStageOrder = (order: unknown): order is number => {
  return typeof order === 'number' && Number.isInteger(order) && order > 0
}

export const canArchiveStage = (activeStageCount: number): boolean => {
  return activeStageCount > 1
}

export const normalizeTags = (tags: unknown): string[] => {
  if (!Array.isArray(tags)) return []

  return [...new Set(
    tags
      .filter((tag): tag is string => typeof tag === 'string')
      .map(tag => tag.trim())
      .filter(Boolean),
  )]
}
