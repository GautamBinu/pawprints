interface LogoutPageProps {
  logoutAction: () => void;
}

export default function LogoutPage({ logoutAction }: LogoutPageProps) {
  return (
    <div>
      <h1>Logout</h1>
      <form action={logoutAction}>
        <button type="submit">Sign out</button>
      </form>
    </div>
  );
}