import { useAuth } from '../../context/AuthContext';

const ROLE_LEVELS = ['CLIENT', 'QA', 'DEV', 'SCRUM_MASTER', 'PO', 'ADMIN'];

/**
 * <Can roles={['ADMIN','PO']}>  — rendu si le rôle est dans la liste
 * <Can min="DEV">               — rendu si le rôle >= DEV
 * <Can roles={[...]} fallback={<p>Accès refusé</p>}> — affiche fallback sinon
 */
export default function Can({ roles, min, fallback = null, children }) {
  const { user } = useAuth();

  if (!user) return fallback;

  if (roles && roles.includes(user.role)) return children;
  if (min && ROLE_LEVELS.indexOf(user.role) >= ROLE_LEVELS.indexOf(min)) return children;

  return fallback;
}
