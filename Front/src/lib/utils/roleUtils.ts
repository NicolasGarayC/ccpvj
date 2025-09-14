// Role definitions for the Centro Cultural application
export const ROLES = {
	ASISTENTE: 'asistente', // Read-only access, no authentication required
	COLABORADOR: 'colaborador', // Can create, edit, and delete content
	ADMINISTRADOR: 'administrador' // Full administrative access
} as const;

export type UserRole = typeof ROLES[keyof typeof ROLES];

// Role hierarchy and permissions
export const ROLE_PERMISSIONS = {
	[ROLES.ASISTENTE]: {
		canView: true,
		canCreate: false,
		canEdit: false,
		canDelete: false,
		canManageUsers: false,
		requiresAuth: false
	},
	[ROLES.COLABORADOR]: {
		canView: true,
		canCreate: true,
		canEdit: true,
		canDelete: true,
		canManageUsers: false,
		requiresAuth: true
	},
	[ROLES.ADMINISTRADOR]: {
		canView: true,
		canCreate: true,
		canEdit: true,
		canDelete: true,
		canManageUsers: true,
		requiresAuth: true
	}
} as const;

/**
 * Check if a user has a specific permission
 */
export function hasPermission(
	userRole: UserRole | null | undefined,
	permission: keyof typeof ROLE_PERMISSIONS[typeof ROLES.ASISTENTE]
): boolean {
	if (!userRole) {
		// If no role is provided, assume Asistente role for read-only access
		return ROLE_PERMISSIONS[ROLES.ASISTENTE][permission];
	}

	const rolePermissions = ROLE_PERMISSIONS[userRole];
	return rolePermissions ? rolePermissions[permission] : false;
}

/**
 * Check if a user can create content
 */
export function canCreateContent(userRole: UserRole | null | undefined): boolean {
	return hasPermission(userRole, 'canCreate');
}

/**
 * Check if a user can edit content
 */
export function canEditContent(userRole: UserRole | null | undefined): boolean {
	return hasPermission(userRole, 'canEdit');
}

/**
 * Check if a user can delete content
 */
export function canDeleteContent(userRole: UserRole | null | undefined): boolean {
	return hasPermission(userRole, 'canDelete');
}

/**
 * Check if a user can view content
 */
export function canViewContent(userRole: UserRole | null | undefined): boolean {
	return hasPermission(userRole, 'canView');
}

/**
 * Check if a user requires authentication
 */
export function requiresAuthentication(userRole: UserRole | null | undefined): boolean {
	return hasPermission(userRole, 'requiresAuth');
}

/**
 * Check if a user can manage other users
 */
export function canManageUsers(userRole: UserRole | null | undefined): boolean {
	return hasPermission(userRole, 'canManageUsers');
}

/**
 * Get the minimum role required for an action
 */
export function getMinimumRoleFor(permission: keyof typeof ROLE_PERMISSIONS[typeof ROLES.ASISTENTE]): UserRole {
	const roles = Object.entries(ROLE_PERMISSIONS) as [UserRole, typeof ROLE_PERMISSIONS[UserRole]][];
	
	for (const [role, permissions] of roles) {
		if (permissions[permission]) {
			return role;
		}
	}
	
	return ROLES.ADMINISTRADOR; // Default to highest role if none found
}

/**
 * Check if user role is valid
 */
export function isValidRole(role: string): role is UserRole {
	return Object.values(ROLES).includes(role as UserRole);
}

/**
 * Get role display name
 */
export function getRoleDisplayName(role: UserRole | null | undefined): string {
	if (!role) return 'Sin rol';
	
	const displayNames = {
		[ROLES.ASISTENTE]: 'Asistente',
		[ROLES.COLABORADOR]: 'Colaborador',
		[ROLES.ADMINISTRADOR]: 'Administrador'
	};
	
	return displayNames[role] || 'Rol desconocido';
}

/**
 * Get role description
 */
export function getRoleDescription(role: UserRole): string {
	const descriptions = {
		[ROLES.ASISTENTE]: 'Solo puede ver contenido, no requiere autenticación',
		[ROLES.COLABORADOR]: 'Puede crear, editar y eliminar contenido',
		[ROLES.ADMINISTRADOR]: 'Acceso completo al sistema, incluye gestión de usuarios'
	};
	
	return descriptions[role] || 'Sin descripción disponible';
}