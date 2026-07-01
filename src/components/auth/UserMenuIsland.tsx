import { AuthProvider } from '../../context/AuthContext';
import { UserMenu } from './UserMenu';

export const UserMenuIsland = () => {
    return (
        <AuthProvider>
            <UserMenu />
        </AuthProvider>
    );
};