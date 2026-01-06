import LoginPage from "./LoginPage";
import { loginAction } from "./login";

export default function Page() {
  return <LoginPage loginAction={loginAction} />;
}
