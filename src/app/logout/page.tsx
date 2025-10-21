import LogoutPage from './LogoutPage';
import { logoutAction } from './logout';

export default function Page() {
  return <LogoutPage logoutAction={logoutAction} />;
}