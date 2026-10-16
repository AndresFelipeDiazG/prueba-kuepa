interface PermissionLike {
  content?: string
}

interface RoleLike {
  permissions?: PermissionLike[]
}

interface HomeLike {
  app?: string
  roles?: RoleLike[]
  permissions?: PermissionLike[]
}

export const hasPermission = (
  homes: HomeLike[] | undefined,
  permission: string,
  app = 'kuepa',
): boolean => {
  return Boolean(homes?.some(home => (
    home.app === app && (
      home.roles?.some(role => (
        role.permissions?.some(item => item.content === permission)
      )) || home.permissions?.some(item => item.content === permission)
    )
  )))
}
